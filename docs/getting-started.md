# Getting started

## For recruiters: a five-minute review

1. Open the browser demo and ask about the sample refund policy.
2. Open a citation and confirm the displayed answer comes from that document.
3. Analyze sample sales and inspect the exact output table.
4. Ask for a follow-up task. Verify it remains pending until you approve it.
5. Read the architecture and validation report. Distinguish test results from unverified model integrations.

## For your own local files

Use the root README's Docker commands. The app opens with an empty local workspace; sample files are opt-in. Upload a policy in **Knowledge base**, wait for “ready,” and ask a question in **Workspace**. PDF must contain extractable text; scanned/image-only PDFs need OCR before upload. Word extraction includes paragraphs and tables. Excel analytics uses the first sheet and cached values; formulas are not executed.

Upload a CSV or XLSX file in **Analytics**. Use unique column headers, at most 100 columns, and at most 10,000 data rows. Select a dataset, preview rows, then enter a supported SELECT. `month`/`revenue` columns enable the revenue template; `stock`/`reorder_level` enable inventory analysis. Other schemas support preview and manually entered validated SQL.

Tasks and reports stay inside this workspace. They are not sent to a project management service. Approve or reject the exact stored arguments in **Approvals**. Download approved reports as Markdown.

## Native development

Activate the virtual environment in every new terminal. Install the exact lock files before installing this project with `--no-deps`. Use `node scripts/build-web.mjs` at the repository root; it creates the `dist/` directory served by FastAPI. UI edits require rebuilding this static export for the single-origin local workflow.

`apps/web` also retains the Sites/Vinext development scripts for supported development environments. A standalone frontend preview uses browser-demo mode until the local API is served alongside it. Do not expect `pnpm dev` alone to start FastAPI or Ollama.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Root URL is 404 but `/docs` works | Build the web export first; restart FastAPI after `dist/index.html` exists. |
| “Not sufficient local evidence” | Upload a relevant source and use more specific terminology. BM25 mode is lexical. |
| Model unavailable | Start Ollama; check `GET /api/health/model`; explicitly pull the exact configured model. |
| UI shows browser demo on a static preview | Use the built app at `http://localhost:8000` for the backend. |
| API asks for a token | Enter `LOCALOPS_API_KEY` in Settings. It stays in tab memory. |
| Missing semantic/voice dependency | Install the matching optional extra and configure existing model paths. |
| CSV query fails | Check exact column names; only the documented SELECT subset is permitted. |
| PDF cannot be read | Check for encryption, scanned pages, corruption, or the 200-page limit. |
| Browser demo storage is full | Remove sources or reset demo data. It has a 2 MB serialized state budget. |
| Port 8000 is occupied | Stop the other local service or change both the bind command and the URL you open. |
| Linux build reports `uv_resident_set_memory` | The build-only compatibility hook handles missing `/proc`; it does not change application logic. |

## Data retention

Docker uses named volumes. Native mode stores data under `LOCALOPS_DATA_DIR`, default `data/runtime`. Back up the entire data directory with the application stopped. Deleting a conversation removes its visible messages; workflow checkpoints remain for approval recovery. To remove every trace, stop the application and deliberately remove its data directory/volume after backing up anything needed.
