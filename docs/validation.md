# Validation evidence

## Observed in the coding environment

| Check | Result | Scope |
| --- | --- | --- |
| Pytest | 64 passed | Unit, API, SQLite/DuckDB, approval/restart, contracts, security, golden evaluation |
| Golden evaluation | 12 / 12 passed | Deterministic routing and lexical source retrieval only |
| Ruff | Passed | Authored Python code, tests, scripts |
| MyPy | Passed | Four selected core modules; not full backend typing |
| TypeScript | Passed | Strict frontend project check |
| ESLint | Passed | Authored product UI and adapters |
| Next.js static export | Passed | Compiled and prerendered `/` and not-found pages |
| Browser demo logic | 3 Node tests passed | Upload/citation, CSV calculations, idempotent approvals and validation; no browser UI claim |
| Browser Playwright / axe | Not run in this environment | Supervised browser-preview service unavailable; CI suite included |
| WebMCP | Not runtime-validated | No permitted supported browser context available |
| Docker | Not run in this environment | Docker executable/service unavailable; CI job included |
| Live Ollama | Not run | HTTP contracts tested with mock transport, no model weights loaded |
| BGE / Qdrant / reranker | Not run with real models | Optional adapter implementation, model setup required |
| Faster-Whisper / Kokoro | Not run with real models | Optional adapters; unavailable-state tests pass |
| Full offline model stack | Not verified | Extractive network-block test passed; full stack needs separate validation |

The backend emits one upstream Starlette/AnyIO deprecation warning during tests. No test is disabled to hide it. Model quality, production scale, and universal prompt-injection resistance are not claimed.

Build note: this container lacks `/proc`. The build-only compatibility hook uses V8 heap information and process peak RSS for unavailable build metrics; it does not alter application behavior or test assertions. Normal hosts are untouched.

## CI and publication

GitHub Actions results and deployment status are checked separately after pushing. An authored workflow is not a passing workflow. See the actual run links in the delivery record.
