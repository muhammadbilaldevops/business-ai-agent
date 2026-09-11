def test_health(client):
    assert client.get("/health").json()["status"] == "ok"


def test_action_requires_approval(client):
    created = client.post(
        "/actions", json={"action_type": "create_report", "payload": {"title": "Weekly"}}
    )
    assert created.status_code == 200
    approval_id = created.json()["approval_id"]
    assert client.get("/api/reports").json() == []
    final = client.post(f"/approvals/{approval_id}", json={"approved": True})
    assert final.json()["status"] == "approved"
    assert len(client.get("/api/reports").json()) == 1
