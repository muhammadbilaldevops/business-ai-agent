import httpx
import pytest

from localops.config import Settings
from localops.llm.ollama_client import ModelError, OllamaClient


def test_ollama_stream_and_payload(monkeypatch, tmp_path):
    original = httpx.Client
    seen = []

    def handle(request):
        seen.append(request)
        return httpx.Response(
            200,
            content=b'{"message":{"content":"Hello "}}\n{"message":{"content":"world"},"done":true}\n',
        )

    monkeypatch.setattr(
        httpx, "Client", lambda **kw: original(transport=httpx.MockTransport(handle), **kw)
    )
    client = OllamaClient(Settings(data_dir=tmp_path))
    assert client.chat([{"role": "user", "content": "hello"}]) == "Hello world"
    assert str(seen[0].url) == "http://127.0.0.1:11434/api/chat"


def test_circuit_breaker(monkeypatch, tmp_path):
    original = httpx.Client
    monkeypatch.setattr(
        httpx,
        "Client",
        lambda **kw: original(transport=httpx.MockTransport(lambda r: httpx.Response(503)), **kw),
    )
    c = OllamaClient(Settings(data_dir=tmp_path))
    with pytest.raises(ModelError):
        c.chat([{"role": "user", "content": "hello"}])
    with pytest.raises(ModelError):
        c.chat([{"role": "user", "content": "hello"}])
    assert c.open_until > 0
    with pytest.raises(ModelError, match="circuit breaker"):
        c.chat([])
