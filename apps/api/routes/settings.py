from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from apps.api.dependencies import services

router = APIRouter(tags=["settings"])


class Preferences(BaseModel):
    workspace_name: str = Field(min_length=1, max_length=80)


@router.get("/settings")
def get_settings(svc=Depends(services)):
    prefs = {r["key"]: r["value"] for r in svc.store.rows("SELECT * FROM preferences")}
    return {
        "workspace_name": prefs.get("workspace_name", "My local workspace"),
        "mode": svc.settings.mode,
        "model": svc.settings.model,
    }


@router.put("/settings")
def preferences(request: Preferences, svc=Depends(services)):
    with svc.store.connect() as c:
        c.execute(
            "INSERT INTO preferences(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            ("workspace_name", request.workspace_name),
        )
    return get_settings(svc)
