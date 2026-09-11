from uuid import uuid4
from fastapi import APIRouter, File, UploadFile
from localops.config import settings
from localops.security import limit_bytes, safe_filename
from localops.store import db

router = APIRouter(prefix="/documents", tags=["documents"])

@router.post("")
async def upload_document(file: UploadFile = File(...)) -> dict[str, str]:
    filename = safe_filename(file.filename or "upload.txt")
    if not filename.lower().endswith((".txt", ".md")):
        return {"error": "Foundation supports UTF-8 .txt and .md files; add loaders for other types."}
    content = await file.read()
    limit_bytes(content, settings.max_upload_bytes)
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError as error:
        return {"error": f"File must be UTF-8: {error}"}
    document_id = str(uuid4())
    with db() as connection:
        connection.execute("INSERT INTO documents VALUES (?, ?, ?)", (document_id, filename, text))
    return {"id": document_id, "filename": filename, "status": "ready"}
