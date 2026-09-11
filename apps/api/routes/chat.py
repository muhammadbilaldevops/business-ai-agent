from pydantic import BaseModel, Field
from fastapi import APIRouter
from localops.rag import search

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatRequest(BaseModel):
    query: str = Field(min_length=1, max_length=4000)

@router.post("")
def chat(request: ChatRequest) -> dict:
    evidence = search(request.query)
    if not evidence:
        return {"answer": "I do not have sufficient local evidence to answer that.", "citations": []}
    citations = [{"document_id": e.document_id, "filename": e.filename, "excerpt": e.excerpt} for e in evidence]
    answer = "I found relevant local evidence: " + " ".join(e.excerpt for e in evidence[:2])
    return {"answer": answer, "citations": citations}
