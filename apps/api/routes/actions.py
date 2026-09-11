import json
from uuid import uuid4
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from localops.store import db

router = APIRouter(tags=["approvals"])

class ActionRequest(BaseModel):
    action_type: str = Field(pattern="^(create_report|create_task)$")
    payload: dict

@router.post("/actions")
def request_action(request: ActionRequest) -> dict[str, str]:
    approval_id = str(uuid4())
    with db() as connection:
        connection.execute("INSERT INTO approvals VALUES (?, ?, ?, ?)", (approval_id, request.action_type, json.dumps(request.payload), "pending"))
        connection.execute("INSERT INTO audit(event, detail) VALUES (?, ?)", ("action_requested", approval_id))
    return {"approval_id": approval_id, "status": "pending"}

class Decision(BaseModel):
    approved: bool

@router.post("/approvals/{approval_id}")
def decide(approval_id: str, decision: Decision) -> dict[str, str]:
    status = "approved" if decision.approved else "rejected"
    with db() as connection:
        changed = connection.execute("UPDATE approvals SET status=? WHERE id=? AND status='pending'", (status, approval_id)).rowcount
        if not changed:
            raise HTTPException(404, "Pending approval not found")
        connection.execute("INSERT INTO audit(event, detail) VALUES (?, ?)", (f"action_{status}", approval_id))
    return {"approval_id": approval_id, "status": status}
