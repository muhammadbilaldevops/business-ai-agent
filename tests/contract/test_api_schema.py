def test_openapi(client):
    schema = client.get("/openapi.json").json()
    for path in [
        "/api/chat",
        "/api/documents/upload",
        "/api/analytics/query",
        "/api/tools/approve",
        "/api/voice/transcribe",
    ]:
        assert path in schema["paths"]
    assert "ChatResponse" in schema["components"]["schemas"]


def test_error_contract(client):
    r = client.post("/api/chat", json={"message": "   "})
    assert r.status_code == 422
    assert set(r.json()["error"]) == {"code", "message", "request_id"}
    assert r.headers["x-request-id"] == r.json()["error"]["request_id"]


def test_voice_unavailable(client):
    assert (
        client.post("/api/voice/transcribe", files={"file": ("audio.wav", b"RIFFtest")}).status_code
        == 503
    )
    assert client.post("/api/voice/synthesize", json={"text": "Hello"}).status_code == 503
