"""No dynamic code: schema-validated tools and atomic, idempotent approvals."""

import json
from uuid import uuid4

from fastapi import HTTPException
from pydantic import BaseModel, ConfigDict, Field

from localops.store import Store


class TaskInput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=4000)


class ReportInput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(default="", max_length=20000)


TOOLS = {
    "create_task": {
        "description": "Create a local follow-up task",
        "schema": TaskInput,
        "permission": "approval",
        "timeout_seconds": 5,
        "audit_category": "task",
    },
    "create_report": {
        "description": "Save a Markdown report for download",
        "schema": ReportInput,
        "permission": "approval",
        "timeout_seconds": 5,
        "audit_category": "report",
    },
}


class ToolRegistry:
    def __init__(self, store: Store):
        self.store = store

    def describe(self):
        return [
            {
                "name": name,
                **{k: v for k, v in tool.items() if k != "schema"},
                "input_schema": tool["schema"].model_json_schema(),
                "output_schema": {"type": "object", "required": ["id", "status"]},
            }
            for name, tool in TOOLS.items()
        ]

    def request(self, tool: str, payload: dict, run_id: str | None = None) -> dict:
        if tool not in TOOLS:
            raise HTTPException(403, "Tool is not allowlisted")
        validated = TOOLS[tool]["schema"].model_validate(payload).model_dump()
        approval_id = str(uuid4())
        with self.store.connect() as c:
            c.execute(
                "INSERT INTO requests(id,tool,payload,run_id) VALUES(?,?,?,?)",
                (approval_id, tool, json.dumps(validated), run_id),
            )
            c.execute(
                "INSERT INTO audit_events(event,entity_id) VALUES(?,?)",
                ("action_requested", approval_id),
            )
        return {
            "approval_id": approval_id,
            "status": "pending",
            "tool": tool,
            "payload": validated,
            "risk": "Writes to your local workspace",
        }

    def decide(self, approval_id: str, approved: bool) -> dict:
        with self.store.connect() as c:
            c.execute("BEGIN IMMEDIATE")
            row = c.execute("SELECT * FROM requests WHERE id=?", (approval_id,)).fetchone()
            if not row:
                raise HTTPException(404, "Approval not found")
            if row["status"] != "pending":
                return json.loads(row["result"])
            payload = TOOLS[row["tool"]]["schema"].model_validate_json(row["payload"])
            result = {
                "id": approval_id,
                "approval_id": approval_id,
                "status": "approved" if approved else "rejected",
                "executed": approved,
                "tool": row["tool"],
            }
            if approved:
                if row["tool"] == "create_task":
                    c.execute(
                        "INSERT INTO tasks(id,title,description) VALUES(?,?,?)",
                        (approval_id, payload.title, payload.description),
                    )
                elif row["tool"] == "create_report":
                    c.execute(
                        "INSERT INTO reports(id,title,content) VALUES(?,?,?)",
                        (
                            approval_id,
                            payload.title,
                            payload.content or f"# {payload.title}\n\nNo report content supplied.",
                        ),
                    )
            c.execute(
                "UPDATE requests SET status=?,result=? WHERE id=?",
                (result["status"], json.dumps(result), approval_id),
            )
            c.execute(
                "INSERT INTO audit_events(event,entity_id) VALUES(?,?)",
                ("action_" + result["status"], approval_id),
            )
        return result
