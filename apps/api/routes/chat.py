import json
import queue
import threading
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import AliasChoices, BaseModel, ConfigDict, Field

from apps.api.dependencies import services
from localops.llm.ollama_client import ModelError

router = APIRouter(tags=["chat"])


class ChatRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    message: str = Field(
        min_length=1, max_length=4000, validation_alias=AliasChoices("message", "query")
    )
    conversation_id: str = Field(
        default_factory=lambda: str(uuid4()),
        min_length=1,
        max_length=100,
        validation_alias=AliasChoices("conversation_id", "session_id"),
    )
    dataset_id: str | None = Field(default=None, max_length=100)


class ChatResponse(BaseModel):
    answer: str
    citations: list[dict]
    analytics: dict | None = None
    approval: dict | None = None
    trajectory: list[str]
    conversation_id: str
    mode: str


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest, svc=Depends(services)):
    return svc.agent.run(request.message, request.conversation_id, request.dataset_id)


@router.post("/chat/stream")
def stream(request: ChatRequest, svc=Depends(services)):
    events = queue.Queue(maxsize=2048)
    cancelled = threading.Event()

    def emit(token):
        if cancelled.is_set():
            raise RuntimeError("Generation cancelled")
        events.put(("token", {"text": token}), timeout=5)

    def work():
        try:
            result = svc.agent.run(
                request.message, request.conversation_id, request.dataset_id, emit=emit
            )
            events.put(("result", result), timeout=5)
        except Exception as exc:
            events.put(
                (
                    "error",
                    {"message": str(exc) if isinstance(exc, ModelError) else "Response could not finish. Please retry."},
                ),
                timeout=5,
            )
        finally:
            try:
                events.put(("done", {}), timeout=1)
            except queue.Full:
                pass

    def generate():
        worker = threading.Thread(target=work, daemon=True)
        worker.start()
        try:
            yield 'event: status\ndata: {"message":"Working on your request"}\n\n'
            while True:
                try:
                    kind, data = events.get(timeout=15)
                except queue.Empty:
                    yield ": keep-alive\n\n"
                    continue
                yield f"event: {kind}\ndata: {json.dumps(data)}\n\n"
                if kind == "done":
                    break
        finally:
            cancelled.set()

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/conversations")
def conversations(svc=Depends(services)):
    return svc.store.rows("SELECT * FROM conversations ORDER BY created_at DESC LIMIT 100")


@router.get("/conversations/{conversation_id}")
def conversation(conversation_id: str, svc=Depends(services)):
    if not svc.store.rows("SELECT id FROM conversations WHERE id=?", (conversation_id,)):
        raise HTTPException(404, "Conversation not found")
    return [
        {**r, "metadata": json.loads(r["metadata"])}
        for r in svc.store.rows(
            "SELECT * FROM messages WHERE conversation_id=? ORDER BY id", (conversation_id,)
        )
    ]


@router.delete("/conversations/{conversation_id}")
def clear(conversation_id: str, svc=Depends(services)):
    with svc.store.connect() as c:
        c.execute("DELETE FROM conversations WHERE id=?", (conversation_id,))
    return {"status": "deleted", "note": "Workflow checkpoints are retained for approval recovery."}
