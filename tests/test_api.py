from fastapi.testclient import TestClient
from apps.api.main import app

client = TestClient(app)

def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_action_requires_approval() -> None:
    created = client.post("/actions", json={"action_type": "create_report", "payload": {"title": "Weekly"}})
    assert created.status_code == 200
    approval_id = created.json()["approval_id"]
    final = client.post(f"/approvals/{approval_id}", json={"approved": True})
    assert final.json()["status"] == "approved"
