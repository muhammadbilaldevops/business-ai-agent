import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field

from apps.api.dependencies import services

router = APIRouter(tags=["approvals"])


class ActionRequest(BaseModel):
    action_type: str = Field(pattern="^(create_report|create_task)$")
    payload: dict


class Decision(BaseModel):
    approved: bool


class ToolDecision(Decision):
    approval_id: str


@router.post("/actions")
def request_action(request: ActionRequest, svc=Depends(services)):
    return svc.registry.request(request.action_type, request.payload)


@router.get("/approvals")
def approvals(svc=Depends(services)):
    return [
        {
            **r,
            "payload": json.loads(r["payload"]),
            "result": json.loads(r["result"]) if r["result"] else None,
        }
        for r in svc.store.rows("SELECT * FROM requests ORDER BY created_at DESC")
    ]


@router.post("/approvals/{approval_id}")
def decide(approval_id: str, decision: Decision, svc=Depends(services)):
    return svc.agent.resume(approval_id, decision.approved)


@router.post("/tools/approve")
def approve_tool(decision: ToolDecision, svc=Depends(services)):
    return svc.agent.resume(decision.approval_id, decision.approved)


@router.get("/tools")
def tools(svc=Depends(services)):
    return svc.registry.describe()


@router.get("/tasks")
def tasks(svc=Depends(services)):
    return svc.store.rows("SELECT * FROM tasks ORDER BY created_at DESC")


@router.get("/reports")
def reports(svc=Depends(services)):
    return svc.store.rows("SELECT id,title,created_at FROM reports ORDER BY created_at DESC")


@router.get("/reports/{report_id}")
def report(report_id: str, svc=Depends(services)):
    rows = svc.store.rows("SELECT content FROM reports WHERE id=?", (report_id,))
    if not rows:
        raise HTTPException(404, "Report not found")
    return PlainTextResponse(
        rows[0]["content"],
        media_type="text/markdown",
        headers={"Content-Disposition": 'attachment; filename="operations-report.md"'},
    )
