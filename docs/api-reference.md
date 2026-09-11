# API reference

Open `/docs` for generated request schemas and interactive examples, or `/openapi.json` for the machine-readable contract. All supported endpoints use `/api`; original foundation routes remain aliases for compatibility.

| Method | Endpoint | Behavior |
| --- | --- | --- |
| GET | `/api/health` | Mode and configured capabilities; no secret values |
| GET | `/api/health/model` | Check the configured local Ollama model |
| POST | `/api/chat` | Return typed answer, citations, trajectory, optional analytics/approval |
| POST | `/api/chat/stream` | SSE status, actual Ollama token events, final result, done/error |
| GET | `/api/conversations` | Recent conversation identifiers |
| GET / DELETE | `/api/conversations/{id}` | Read / clear visible messages |
| GET | `/api/documents` | Source inventory |
| POST | `/api/documents/upload` | Multipart document upload |
| GET | `/api/documents/search?q=...` | Retrieve evidence |
| GET / DELETE | `/api/documents/{id}` | Read / remove source |
| POST | `/api/documents/{id}/reindex` | Rebuild optional vectors for a source |
| GET | `/api/analytics/datasets` | Dataset inventory |
| POST | `/api/analytics/upload` | Multipart CSV/XLSX upload |
| GET / DELETE | `/api/analytics/datasets/{id}` | Preview / remove dataset |
| POST | `/api/analytics/query` | Execute a bounded, validated SELECT |
| GET | `/api/tools` | Mutating tool registry and input schemas |
| POST | `/api/actions` | Stage a validated task/report directly |
| GET | `/api/approvals` | Pending/completed requests |
| POST | `/api/approvals/{id}` | Resume approval with `{"approved":true}` or false |
| POST | `/api/tools/approve` | Same decision with `approval_id` in the payload |
| GET | `/api/tasks`, `/api/reports` | Read completed local artifacts |
| GET | `/api/reports/{id}` | Download approved Markdown report |
| POST | `/api/voice/transcribe` | Local STT of an uploaded recording |
| POST | `/api/voice/synthesize` | Local WAV response |
| GET / PUT | `/api/settings` | Workspace name; runtime settings are environment-owned |
| GET | `/api/activity`, `/api/metrics` | Audit events and stored entity counts |
| GET | `/api/evaluations` | Instructions to generate the local evaluation report |

Example request:

```json
{"message":"What is our refund policy?","conversation_id":"review-01"}
```

`query` is accepted as a legacy alias for `message`; `session_id` is accepted for `conversation_id`. Dataset IDs are optional on chat. The UI's general chat chooses a suitable uploaded dataset using filename/schema hints; direct API callers can specify one explicitly.

Error response:

```json
{"error":{"code":"VALIDATION_ERROR","message":"Invalid request...","request_id":"..."}}
```

Configured authentication uses `Authorization: Bearer <LOCALOPS_API_KEY>`. The health endpoint remains readable for startup probes. Tokens are never included in the static bundle. The API is single-operator; a token does not create per-user data isolation.

In extractive mode SSE returns status and final result events. It does not fabricate token-by-token LLM output. In Ollama mode token events are delivered while generation runs; final structured metadata follows. Cancellation stops client consumption and interrupts subsequent emitted tokens; it cannot instantly terminate a model request currently blocked in an HTTP read.
