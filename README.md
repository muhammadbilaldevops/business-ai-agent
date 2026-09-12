# ✨ Business AI Agent

> Evidence-first AI workspace for business documents, datasets, voice questions, analytics, and human-approved actions.

[![Frontend](https://img.shields.io/badge/frontend-Next.js%2016%20%7C%20React%2019-111827?logo=next.js)](apps/web) [![Backend](https://img.shields.io/badge/backend-FastAPI%20%7C%20Python%203.12-0f766e?logo=fastapi)](apps/api) [![AI](https://img.shields.io/badge/AI-Gemini%20%7C%20Ollama-7c3aed)](src/localops/llm) [![Tests](https://img.shields.io/badge/tests-pytest%20%2B%20Playwright-16a34a)](tests)

Built by **Muhammad Bilal**. Upload a résumé, policy, report, spreadsheet, or scanned PDF; ask a grounded question; inspect evidence; and send operational actions through human approval.

🌐 [GitHub](https://github.com/muhammadbilaldevops/business-ai-agent) · 🔗 [LinkedIn](https://www.linkedin.com/in/muhammadbilaldevops/)

## 🎯 What it demonstrates

- Production-style Next.js frontend + FastAPI backend monorepo.
- Local-first PDF, DOCX, spreadsheet, image, and OCR intelligence.
- RAG pipeline: load → normalize → chunk → retrieve → cite → answer.
- Gemini streaming with an Ollama local-model alternative.
- Typed agent routing, allowlisted tools, durable approvals, and security boundaries.
- On-device Whisper transcription for microphone questions.
- Responsive, colorful Gemini-inspired chat UX with multi-file upload and Thinking states.

## 🧭 Architecture

```text
🌐 Browser
   │
   ▼
⚡ Vercel Next.js frontend
   │
   ├── No API URL ──► Browser workspace
   │                  ├── localStorage
   │                  ├── PDF/DOCX/XLSX readers
   │                  ├── OCR and local Whisper voice
   │                  └── source-grounded answers
   │
   └── API URL ─────► 🚀 Render FastAPI backend
                          ├── authentication, CORS, validation
                          ├── supervisor and workflow graph
                          ├── RAG retrieval and citations
                          ├── analytics and validated queries
                          ├── tools and human approvals
                          ├── Gemini API or local Ollama
                          └── SQLite / configured persistence
```

## 🌈 Features

| Feature | Implementation |
| --- | --- |
| 💬 Chat | Next.js, React, TypeScript, Tailwind, Radix/Base UI, Lucide, responsive dark UI. |
| 📎 Multi-file upload | Up to 10 files per batch, progress, partial-error handling, local persistence. |
| 📄 Résumé QA | PDF.js text extraction, page citations, evidence-ranked answers, no invented facts. |
| 🧾 Scanned PDFs/images | Canvas rendering + Tesseract.js English OCR. |
| 📝 Word | Mammoth raw-text extraction from DOCX. |
| 📊 Data | ExcelJS XLSX reader, quoted CSV parser, normalized JSON, analytics tables/charts. |
| 🎙️ Voice | MediaRecorder → 16 kHz audio → Transformers.js/ONNX Whisper Tiny English in browser. |
| 🔊 Read aloud | Browser SpeechSynthesis with stop/error handling. |
| 🧠 Suggestions | Questions generated from the actual uploaded document or résumé. |
| ✅ Operations | Tasks/reports/actions are proposed and require durable human approval. |
| 🔒 Privacy | Browser mode keeps files and conversations in localStorage; no default telemetry. |

## 🧱 Technologies

**Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS, Radix UI, Base UI, shadcn-style components, PDF.js, Mammoth, ExcelJS, Tesseract.js, Transformers.js, ONNX WebAssembly, localStorage.

**Backend:** Python 3.12, FastAPI, Uvicorn, Pydantic, httpx, Gemini HTTP streaming client, Ollama client, SQLite/configured store, DuckDB validation boundaries.

**AI architecture:** typed supervisor state, deterministic intent routing, RAG loaders/chunking/retriever, BM25/local vectors/fusion/reranking, citations, allowlisted tools, approval interrupts.

**Delivery:** pnpm workspaces, frozen lockfile, Docker Compose, Vercel, Render, pytest, Ruff, mypy, Playwright, axe accessibility checks, golden evaluations.

## 🗂️ Repository map

| Path | Responsibility |
| --- | --- |
| `apps/web/app/page.tsx` | Main chat UI, navigation, upload flow, suggestions, sources, actions. |
| `apps/web/app/globals.css` | Visual system, gradients, responsive layout, states, composer. |
| `apps/web/components/voice-controls.tsx` | Recording, local transcription handoff, read-aloud. |
| `apps/web/lib/browser-workspace.ts` | Browser storage, upload routing, chat, analytics, actions, migration. |
| `apps/web/lib/document-readers.ts` | PDF, DOCX, XLSX, CSV, JSON, images, OCR. |
| `apps/web/lib/document-answers.ts` | Ranking, résumé matching, citations, suggestions, no-evidence responses. |
| `apps/web/lib/local-speech.ts` | Decode, resample, silence checks, Whisper model loading. |
| `apps/web/lib/api.ts` | Typed backend HTTP adapter and health checks. |
| `apps/web/public/document-assets/` | PDF.js, Tesseract, OCR data, fonts, maps, and WASM assets. |
| `apps/api/main.py` | FastAPI app, middleware, CORS, route registration. |
| `apps/api/routes/` | Health, chat, documents, analytics, actions, settings, voice. |
| `src/localops/config.py` | Environment and runtime configuration. |
| `src/localops/agents/` | Typed agent state and supervisor routing. |
| `src/localops/orchestration/graph.py` | Multi-step workflow and approval interrupts. |
| `src/localops/rag/` | Loaders, chunking, retrieval, ranking, citations. |
| `src/localops/llm/` | Gemini and Ollama adapters. |
| `src/localops/tools/registry.py` | Validated allowlisted operational tools. |
| `src/localops/security/` | Validation, path boundaries, body limits. |
| `src/localops/voice/` | Optional server-side speech adapters. |
| `tests/` | Unit, API, integration, contract, security, evaluation. |
| `render.yaml` / `apps/web/vercel.json` | Render and Vercel deployment definitions. |

## 🚀 Run locally

```bash
git clone https://github.com/muhammadbilaldevops/business-ai-agent.git
cd business-ai-agent
docker compose up --build
```

Open `http://localhost:8000` and `http://localhost:8000/docs`.

Native setup requires Python 3.12+, Node.js 22+, and pnpm 11.25.0:

```bash
python -m venv .venv
python -m pip install -r requirements-dev.txt
python -m pip install --no-deps -e .
corepack enable
corepack prepare pnpm@11.25.0 --activate
cd apps/web && pnpm install --frozen-lockfile && cd ../..
node scripts/build-web.mjs
uvicorn apps.api.main:app --host 127.0.0.1 --port 8000
```

## ☁️ Deploy

### Vercel frontend

```text
Root Directory: apps/web
Framework: Other
Install: pnpm install --frozen-lockfile
Build: pnpm run build
Output: out
```

Optional variable: `NEXT_PUBLIC_API_BASE_URL=https://your-render-service.onrender.com`.

### Render backend

Create a Blueprint from this repository. `render.yaml` defines the FastAPI service. Set `LOCALOPS_API_KEY` and `GEMINI_API_KEY`, then add the Render URL to Vercel as `NEXT_PUBLIC_API_BASE_URL` and redeploy.

## 🧪 Quality checks

```bash
pytest -q
ruff check src apps/api tests scripts
ruff format --check src apps/api tests scripts
mypy
python scripts/run_evaluation.py
cd apps/web && pnpm exec tsc --noEmit && pnpm exec playwright install chromium && pnpm exec playwright test
```

Validation covers API contracts, routing, retrieval, workflows, security boundaries, accessibility, multi-file PDF/DOCX upload, résumé questions, scanned-PDF OCR, CSV/XLSX handling, citations, and thinking states.

## 🔐 Safety and runtime modes

| Mode | AI generation | Persistence |
| --- | --- | --- |
| Browser workspace | Deterministic evidence answers + local Whisper | Browser localStorage |
| Local extractive | No model required | Local store |
| Local Ollama | Generated streamed answers | Local store |
| Hosted Gemini | Gemini-generated answers | Configured backend store |

Uploaded text is untrusted evidence. Actions require human approval. Requests, files, paths, queries, and results are bounded. Browser mode does not send files by default. Local documents and conversations are not encrypted at rest. Hosted Gemini requires a deployed Render backend and a valid Gemini key; without the API URL the Vercel app remains a browser document assistant.

## 🤝 Contributing and license

Read [CONTRIBUTING.md](CONTRIBUTING.md), run focused tests, and include evidence for quality claims. See [LICENSE](LICENSE).

## 📚 Folder documentation map

Each engineering area has its own guide so a reviewer can browse the repository without guessing where a responsibility lives:

- [`apps/web/README.md`](apps/web/README.md) — frontend runtime and UI structure
- [`apps/web/lib/README.md`](apps/web/lib/README.md) — browser engine, readers, retrieval, and voice
- [`apps/api/README.md`](apps/api/README.md) — FastAPI service and endpoints
- [`apps/api/routes/README.md`](apps/api/routes/README.md) — route-by-route contract map
- [`src/localops/README.md`](src/localops/README.md) — reusable Python domain package
- [`src/localops/agents/README.md`](src/localops/agents/README.md) — agent state and supervision
- [`src/localops/orchestration/README.md`](src/localops/orchestration/README.md) — workflow graph
- [`src/localops/rag/README.md`](src/localops/rag/README.md) — retrieval pipeline
- [`src/localops/llm/README.md`](src/localops/llm/README.md) — Gemini and Ollama adapters
- [`src/localops/tools/README.md`](src/localops/tools/README.md) — safe business tools
- [`src/localops/security/README.md`](src/localops/security/README.md) — validation boundaries
- [`src/localops/voice/README.md`](src/localops/voice/README.md) — speech adapters
- [`src/localops/evaluation/README.md`](src/localops/evaluation/README.md) — evaluation runner
- [`tests/README.md`](tests/README.md) — test strategy and commands

### 🔭 Future improvements

1. Add authenticated multi-user workspaces with encrypted object storage.
2. Add streaming Gemini responses with token-level citations and confidence signals.
3. Add multilingual Whisper models and server-side voice fallback.
4. Add background ingestion jobs, vector database persistence, and document versioning.
5. Add richer spreadsheet formulas, dashboard exports, and scheduled reports.
6. Add approval webhooks, audit-log search, role-based tool permissions, and rate limits.
7. Add observability with traces, latency dashboards, error budgets, and model evaluations in CI.
8. Add automated deployment previews, custom domains, backup/restore, and disaster recovery.
