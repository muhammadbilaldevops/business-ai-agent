import json
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from apps.api.dependencies import services
from localops.analytics import query_rows
from localops.rag.loaders import load_table
from localops.security import limit_bytes, safe_filename

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.post("/upload")
@router.post("/datasets")
async def upload(file: UploadFile = File(...), svc=Depends(services)):
    filename = safe_filename(file.filename or "dataset.csv")
    content = await file.read(svc.settings.max_upload_bytes + 1)
    limit_bytes(content, svc.settings.max_upload_bytes)
    if len(svc.store.rows("SELECT id FROM datasets")) >= 50:
        raise HTTPException(409, "Workspace limit: 50 datasets")
    from starlette.concurrency import run_in_threadpool

    columns, rows = await run_in_threadpool(load_table, filename, content)
    dataset_id = str(uuid4())
    with svc.store.connect() as c:
        c.execute(
            "INSERT INTO datasets(id,filename,columns_json,rows_json) VALUES(?,?,?,?)",
            (dataset_id, filename, json.dumps(columns), json.dumps(rows)),
        )
    svc.store.audit("dataset_uploaded", dataset_id)
    return {
        "id": dataset_id,
        "filename": filename,
        "status": "ready",
        "columns": columns,
        "row_count": len(rows),
        "rows": rows[:10],
    }


@router.get("/datasets")
def datasets(svc=Depends(services)):
    return [
        {
            **{k: r[k] for k in ("id", "filename", "created_at")},
            "columns": json.loads(r["columns_json"]),
            "row_count": len(json.loads(r["rows_json"])),
        }
        for r in svc.store.rows("SELECT * FROM datasets ORDER BY created_at DESC")
    ]


@router.get("/datasets/{dataset_id}")
def get_dataset(dataset_id: str, svc=Depends(services)):
    rows = svc.store.rows("SELECT * FROM datasets WHERE id=?", (dataset_id,))
    if not rows:
        raise HTTPException(404, "Dataset not found")
    r = rows[0]
    return {
        "id": r["id"],
        "filename": r["filename"],
        "columns": json.loads(r["columns_json"]),
        "rows": json.loads(r["rows_json"])[:100],
        "row_count": len(json.loads(r["rows_json"])),
    }


@router.delete("/datasets/{dataset_id}")
def delete_dataset(dataset_id: str, svc=Depends(services)):
    get_dataset(dataset_id, svc)
    with svc.store.connect() as c:
        c.execute("DELETE FROM datasets WHERE id=?", (dataset_id,))
    svc.store.audit("dataset_deleted", dataset_id)
    return {"status": "deleted"}


class QueryRequest(BaseModel):
    dataset_id: str = Field(min_length=1, max_length=100)
    query: str = Field(min_length=1, max_length=4000)


@router.post("/query")
def query(request: QueryRequest, svc=Depends(services)):
    rows = svc.store.rows("SELECT * FROM datasets WHERE id=?", (request.dataset_id,))
    if not rows:
        raise HTTPException(404, "Dataset not found")
    r = rows[0]
    result = query_rows(
        json.loads(r["columns_json"]),
        json.loads(r["rows_json"]),
        request.query,
        svc.settings.query_timeout,
    )
    svc.store.audit("analytics_query", request.dataset_id)
    return {**result, "dataset_id": r["id"], "filename": r["filename"], "query": request.query}
