from fastapi import APIRouter
from localops.config import settings

router = APIRouter(tags=["health"])

@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "mode": "local", "data_dir": str(settings.data_dir)}
