from uuid import uuid4
from pathlib import Path
from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel
from localops.analytics import safe_query
from localops.config import settings
from localops.security import limit_bytes, safe_filename

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.post("/datasets")
async def upload_dataset(file: UploadFile = File(...)) -> dict[str, str]:
    filename = safe_filename(file.filename or "dataset.csv")
    if not filename.lower().endswith(".csv"):
        raise HTTPException(400, "Only CSV files are supported by the foundation")
    content = await file.read()
    limit_bytes(content, settings.max_upload_bytes)
    dataset_id = str(uuid4())
    (settings.data_dir / "datasets" / f"{dataset_id}.csv").write_bytes(content)
    return {"id": dataset_id, "filename": filename, "status": "ready"}

class QueryRequest(BaseModel):
    dataset_id: str
    query: str

@router.post("/query")
def query_dataset(request: QueryRequest) -> dict:
    path = settings.data_dir / "datasets" / f"{request.dataset_id}.csv"
    if not path.is_file():
        raise HTTPException(404, "Dataset not found")
    return safe_query(path, request.query)
