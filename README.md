# LocalOps AI

Privacy-first business operations assistant that runs on local infrastructure. It provides evidence-backed knowledge search, safe CSV analytics, and approval-gated local actions through a FastAPI API.

## What is included now

- FastAPI service with health, chat, document, analytics, and approval endpoints
- Local SQLite persistence and deterministic BM25-style document retrieval
- CSV ingestion and read-only, validated DuckDB queries
- Approval queue plus append-only audit events for sensitive actions
- Ollama-compatible local model adapter (optional; the service remains usable without a model)
- Docker Compose, automated tests, and GitHub Actions

## Quick start

```bash
cp .env.example .env
python -m venv .venv
.venv/bin/pip install -e '.[dev]'
uvicorn apps.api.main:app --reload
```

Open `http://localhost:8000/docs`. For a local model, run Ollama and set `LOCALOPS_OLLAMA_URL` and `LOCALOPS_MODEL` in `.env`.

## Example API flow

1. `POST /documents` with a UTF-8 text/markdown file.
2. `POST /chat` with `{"query":"What is our refund policy?"}`.
3. `POST /analytics/datasets` with a CSV, then `POST /analytics/query` with a read-only `SELECT`.
4. `POST /actions` to create an approval-gated report request; `POST /approvals/{id}` to approve or reject it.

## Safety boundaries

The API accepts only local uploads, blocks path traversal, validates analytics SQL against an allowlist, caps result sets, and never executes an action before approval. It deliberately does not download models or contact cloud LLM services at runtime.

## Roadmap

This is the working foundation for the full LocalOps specification: Qdrant hybrid retrieval, LangGraph orchestration, web UI, voice pipeline, and evaluation suites can be added without changing these API contracts.
