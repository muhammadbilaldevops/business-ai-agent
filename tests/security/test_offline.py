import socket


def test_extractive_runtime_makes_no_network_calls(client, document, monkeypatch):
    def blocked(*args, **kwargs):
        raise AssertionError("Network access attempted")

    monkeypatch.setattr(socket.socket, "connect", blocked)
    response = client.post("/api/chat", json={"message": "refund policy"})
    assert response.status_code == 200
    assert "30 days" in response.json()["answer"]
