import json
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from apps.api.dependencies import services
from localops.rag.chunking import chunk_text
from localops.rag.loaders import extract
from localops.security import limit_bytes, safe_filename

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload")
@router.post("")
async def upload_document(file: UploadFile = File(...), svc=Depends(services)):
    filename = safe_filename(file.filename or "upload.txt")
    content = await file.read(svc.settings.max_upload_bytes + 1)
    limit_bytes(content, svc.settings.max_upload_bytes)
    # CPU parsing and indexing run in a worker, keeping the event loop responsive.
    from starlette.concurrency import run_in_threadpool

    return await run_in_threadpool(ingest, svc, filename, content)


def ingest(svc, filename, content):
    if len(svc.store.rows("SELECT id FROM knowledge")) >= 200:
        raise HTTPException(409, "Workspace limit: 200 documents. Delete an unused source first.")
    pages = extract(filename, content, svc.settings.max_text_chars)
    document_id = str(uuid4())
    chunks = []
    for page in pages:
        for chunk in chunk_text(
            page["text"],
            svc.settings.chunk_size,
            svc.settings.chunk_overlap,
            document_id=document_id,
            filename=filename,
            page=page["page"],
            source_type=filename.rsplit(".", 1)[-1],
        ):
            chunk["chunk_index"] = len(chunks)
            chunks.append(chunk)
    try:
        svc.retriever.index(document_id, chunks)
        with svc.store.connect() as c:
            c.execute(
                "INSERT INTO knowledge(id,filename,content,chunks) VALUES(?,?,?,?)",
                (document_id, filename, "\n".join(p["text"] for p in pages), json.dumps(chunks)),
            )
    except Exception:
        svc.retriever.remove(document_id)
        raise
    svc.store.audit("document_uploaded", document_id)
    return {
        "id": document_id,
        "filename": filename,
        "status": "ready",
        "chunk_count": len(chunks),
        "retrieval": "hybrid" if svc.retriever.vector else "bm25",
    }


@router.get("")
def documents(svc=Depends(services)):
    return [
        {
            "id": r["id"],
            "filename": r["filename"],
            "status": "ready",
            "chunk_count": len(json.loads(r["chunks"])),
            "created_at": r["created_at"],
        }
        for r in svc.store.rows(
            "SELECT id,filename,chunks,created_at FROM knowledge ORDER BY created_at DESC"
        )
    ]


@router.get("/search")
def search(q: str, svc=Depends(services)):
    return svc.retriever.search(q[:4000])


@router.get("/{document_id}")
def document(document_id: str, svc=Depends(services)):
    rows = svc.store.rows("SELECT * FROM knowledge WHERE id=?", (document_id,))
    if not rows:
        raise HTTPException(404, "Document not found")
    return {**rows[0], "chunks": json.loads(rows[0]["chunks"])}


@router.delete("/{document_id}")
def delete_document(document_id: str, svc=Depends(services)):
    document(document_id, svc)
    svc.retriever.remove(document_id)
    with svc.store.connect() as c:
        c.execute("DELETE FROM knowledge WHERE id=?", (document_id,))
    svc.store.audit("document_deleted", document_id)
    return {"status": "deleted"}


@router.post("/{document_id}/reindex")
def reindex(document_id: str, svc=Depends(services)):
    doc = document(document_id, svc)
    chunks = doc["chunks"] or chunk_text(
        doc["content"], document_id=document_id, filename=doc["filename"], page=None
    )
    svc.retriever.index(document_id, chunks)
    with svc.store.connect() as c:
        c.execute("UPDATE knowledge SET chunks=? WHERE id=?", (json.dumps(chunks), document_id))
    return {"status": "ready", "chunk_count": len(chunks)}
