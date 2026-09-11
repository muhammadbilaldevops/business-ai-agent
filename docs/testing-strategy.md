# Testing strategy

The test suite separates deterministic behavior from model-dependent quality.

| Layer | Command / location | Establishes |
| --- | --- | --- |
| Unit | `pytest tests/unit` | Chunk boundaries, fusion, routing, names, SQL allowlist |
| Integration | `pytest tests/integration` | Real SQLite/DuckDB/API workflows, restart recovery, mock Ollama contracts |
| Contract | `pytest tests/contract` | OpenAPI endpoints, response fields, standardized errors |
| Security | `pytest tests/security` | Untrusted content cannot create actions, auth/origin limits, file/query attacks |
| Evaluation | `python scripts/run_evaluation.py` | Curated routing and lexical source retrieval |
| Browser | `cd apps/web && pnpm exec playwright test` | Upload/chat/citations, analytics, approvals, voice text fallback, mobile layout, axe, external-request blocking |
| Container | GitHub Actions `docker` job | Build, Compose startup, health endpoint |

Use Python 3.12 and the dependency locks. Tests use temporary databases and deterministic extractive mode. HTTP model tests use `httpx.MockTransport`; they do not imply a real model ran. Browser voice tests cover controls and transcript submission, not recognition accuracy. The optional real-model checks need downloaded models and measured hardware.

CI retains JUnit, evaluation JSON, Playwright reports, screenshots on failure, and retry traces. Backend and browser jobs can run independently. The dependency review job is separate so its findings are visible rather than hidden by application test success.

Python MyPy is currently applied to selected core modules. Expanding typing to dependency integration surfaces is future work. Frontend TypeScript uses strict mode. Ruff checks authored Python; ESLint checks authored product UI/adapters. Vendored Shadcn catalog files are retained rather than rewritten as part of product lint fixes.

Read [validation.md](validation.md) for actual observed results. A test file being present is not evidence that it passed.
