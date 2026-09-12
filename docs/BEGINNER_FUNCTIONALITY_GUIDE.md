# Business AI Agent: Beginner Functionality Guide

This guide explains what the project does, why it exists, and how its main features work from the moment a user uploads a file to the moment the app returns an answer or proposes an approved action.

## 1. Product vision

Business AI Agent is a **local-first, evidence-based business operations assistant**. It helps a person or small team turn scattered documents and spreadsheets into answers, analysis, and carefully controlled actions.

In one sentence: it combines a company knowledge assistant, a data analyst, a voice-enabled chat interface, and an approval-gated task/report assistant in one workspace.

The design principle is simple: every technology exists to solve a business problem, not merely to add an AI feature.

## 2. The business problem it solves

Business information is often scattered across PDFs, Word files, policies, resumes, CSV files, and Excel sheets. Staff lose time searching documents, manually checking policies, calculating spreadsheets, and converting findings into follow-up work.

Examples:

- “What does our refund policy say?” requires manually searching a PDF.
- “Which products need restocking?” requires opening a spreadsheet and calculating stock gaps.
- “Create a follow-up task from this finding” risks an unwanted action if automation is not controlled.
- Sensitive business files should not automatically be sent to an unrelated external service.

The agent addresses those problems by identifying the task type, selecting a safe capability, returning evidence with the answer, and asking a human before changing business state.

## 3. Two ways the product runs

The application deliberately supports two modes.

| Mode | When it is used | What happens |
| --- | --- | --- |
| **Document mode** | The public/static web app does not detect a local API. | Files and conversations remain in browser storage. The browser reads supported files and gives deterministic source-grounded document answers. |
| **Local API mode** | The FastAPI backend is reachable, normally on the local computer. | The Next.js app uses the backend for persistent documents, retrieval, agent orchestration, analytics, approvals, and optional local-model responses. |

This split lets the public demo remain useful without uploading a user's business files to a shared server, while the local runtime provides the full agent workflow.

## 4. End-to-end user journey

```text
Upload a document or dataset
        ↓
Validate and read the file
        ↓
Store the usable text or table data
        ↓
User asks a question by text or voice
        ↓
Classify the request: knowledge, analytics, action, or general
        ↓
Retrieve evidence / run safe analysis / prepare an approval
        ↓
Return a clear answer with citations or a proposed action
        ↓
Record conversation and audit activity
```

If the workspace is empty, document mode gently asks the user to upload a document, CSV, or Excel file first. It does not pretend to know private business facts without a source.

## 5. Chat interface and conversation flow

### What the user sees

The main Next.js page provides chat, file upload, suggested questions, source cards, a dataset view, approvals, activity, settings, copy controls, and voice controls.

### How a message is handled

1. The user types a message or chooses a suggested question.
2. The frontend prevents empty submissions and shows a pending state.
3. It creates or reuses a conversation ID stored in browser storage.
4. In local mode, it sends the request to `POST /api/chat/stream`; in document mode, it calls the browser workspace directly.
5. The answer is added to the chat, source citations are displayed, and the workspace snapshot refreshes.
6. If a request fails, the original message is restored so the user can retry instead of retyping it.

### Follow-ups and natural conversation

Document mode keeps the message history. Short follow-ups such as `continue`, `more`, or `next` use the prior answer’s cited document chunk to show the next relevant detail. Friendly messages such as `nice`, `wow`, `thanks`, and greetings receive a short natural reply instead of being incorrectly treated as a document search.

## 6. File upload and document reading

### Supported user inputs

- Documents: PDF, DOCX, text, Markdown, JSON, and supported images in document mode.
- Data: CSV and XLSX.
- Voice: microphone recording when the browser/local voice capability is available.

### Browser document mode

1. The user selects files using the **+** button.
2. The frontend identifies CSV/XLSX as datasets and other supported files as documents.
3. The browser document reader extracts readable text. PDF text is read with PDF.js; DOCX uses Mammoth; spreadsheets use ExcelJS; images/scanned content can use browser OCR.
4. The file content and lightweight metadata are stored in browser `localStorage`.
5. The app creates document-specific suggested questions.

### Local API mode

1. FastAPI validates the filename, extension, size, and upload limits.
2. The server extracts text page by page or table data from the uploaded file.
3. Document text is split into chunks with document ID, filename, page, section, chunk index, and character-position metadata.
4. Chunks are saved in SQLite; optional vector indexing is performed when enabled.
5. The API returns `ready`, the document ID, chunk count, and retrieval mode.

Why chunking matters: an entire PDF is usually too large and too noisy to pass to an AI model. Smaller labeled passages let the system retrieve only the evidence relevant to the question.

## 7. Knowledge questions, retrieval, and citations

### What happens for a knowledge question

Example question: “What does the refund policy say about returns after 30 days?”

1. The supervisor routes it to the knowledge path.
2. The retriever searches uploaded document chunks.
3. BM25 keyword ranking finds exact terms and close word forms.
4. If optional local embedding models and Qdrant are configured, dense semantic results are also retrieved.
5. Rankings are combined using reciprocal-rank fusion; an optional cross-encoder reranker can place the most relevant passages first.
6. Duplicate excerpts are removed and a context character budget is applied.
7. The agent either returns extractive evidence or provides that evidence to the configured local model.
8. The UI shows file-based citations so the user can inspect the source.

### Why this is RAG

RAG means **retrieval-augmented generation**: retrieve relevant private evidence first, then answer from that evidence. This avoids relying only on general model knowledge for company-specific facts.

### Browser-mode retrieval

The static browser mode uses deterministic keyword and intent matching instead of a server model. It selects the most relevant chunks, keeps answers focused, handles continuations, and refuses to invent facts when no evidence is found.

### Accuracy boundary

BM25-only retrieval is keyword-based, not fully semantic. Dense retrieval, Qdrant, and reranking are optional local components. Confidence scoring, broader semantic evaluation, and automatic embedding-index migration are planned improvements documented in [FUTURE_IMPROVEMENTS.md](FUTURE_IMPROVEMENTS.md).

## 8. Agent routing and workflow

The local API uses a LangGraph state machine. This is controlled orchestration, not an unrestricted autonomous planner.

```text
START → Supervisor → Knowledge Agent → END
                   → Analytics Agent → END
                   → Action Agent → Human Approval → END
                   → General response → END
```

### Supervisor

The supervisor applies auditable rules to classify a request as:

- **Knowledge:** questions about documents or uploaded content.
- **Analytics:** sales, inventory, revenue, stock, datasets, or analysis.
- **Action:** create a task, report, or follow-up.
- **Multi-step:** an analytics question that also asks for a report/task.
- **General:** simple greetings and messages not requiring business evidence.

### State and limits

The workflow state contains the query, conversation ID, dataset ID, citations, analytics result, approval state, trajectory, and iteration count. A maximum-iteration limit protects against loops. An in-process lock serializes graph runs in the local single-operator runtime.

### Streaming

The chat endpoint uses Server-Sent Events. It can send status, partial tokens from the local model, the final result, and safe error messages to the web interface.

## 9. Optional local language model

In local API mode, the app can use Ollama or the configured Gemini client. The local model receives:

- System instructions defining safe behavior
- Recent conversation history
- The user’s current question
- Retrieved evidence marked as untrusted data

The prompt requires direct, concise, source-based responses; friendly handling of conversational messages; and an occasional purposeful emoji without excessive decoration. The model is not given unrestricted shell, filesystem, or external-service control.

If no local model is enabled, the knowledge path can return the relevant source excerpts directly instead of pretending a generated answer exists.

## 10. Analytics for CSV and Excel data

### User flow

1. Upload a CSV or XLSX file.
2. The app reads column names and rows.
3. Ask a data question or open the Analytics view.
4. The agent selects a safe analysis recipe, or the user enters an allowed read-only query.
5. Results appear as a table and can support reporting/action workflows.

### What the analytics agent currently does

The agent looks at available columns and chooses constrained recipes. For example:

- If `stock` and `reorder_level` exist, it finds rows where stock is below reorder level.
- If `month` and `revenue` exist, it calculates monthly revenue totals.
- Otherwise it previews a bounded number of rows.

It reports descriptive results only. It does not claim that the data proves why a business result happened.

### Why the SQL boundary is safe

The API uses SQLGlot validation and an in-memory DuckDB process. Only one read-only `SELECT` over the dataset is permitted. Writes, filesystem reads, extensions, arbitrary table functions, joins, CTEs, and unsafe statements are rejected. Limits include one thread, memory limits, a deadline, and a maximum result size.

## 11. Actions and human approval

The action path supports controlled creation of tasks and reports.

1. A user asks to create, prepare, generate, make, or draft a task/report/follow-up.
2. The action agent builds a structured payload rather than immediately writing data.
3. The tool registry creates a durable pending approval request.
4. LangGraph pauses at a human approval interrupt.
5. The Approvals screen shows the proposed action.
6. The human approves or rejects it.
7. On approval, the registry revalidates the stored payload and commits the result, request status, task/report, and audit event together.
8. A repeated decision returns the original result rather than repeating the action.

This is the core human-in-the-loop rule: the agent can recommend and prepare, but a person remains responsible for changes.

## 12. Voice interaction

The web interface includes recording, transcription review, text-to-speech playback, stop controls, and microphone permission handling.

- In browser document mode, browser speech capabilities and local browser processing are used where available.
- In local API mode, the voice routes support transcription and synthesis adapters. The architecture includes Faster-Whisper-style speech-to-text and a local Kokoro-style text-to-speech option, depending on configured local assets.

The voice result enters the same text-chat workflow; voice is an input/output layer, not a separate ungoverned agent.

## 13. Memory, persistence, and activity

SQLite stores local-mode documents, datasets, conversations, messages, preferences, requests, tasks, reports, and audit events. LangGraph workflow checkpoints are kept in a separate SQLite database so workflow recovery remains separate from business knowledge.

Browser document mode stores its workspace and message history in browser storage. This is convenient for a static demo, but browser clearing or using another device does not provide the same persistence as the local API.

The Activity view records useful events such as uploads, completed queries, proposed actions, and approval decisions.

## 14. Security boundaries

The project is intentionally conservative.

- Uploaded files are treated as untrusted data, never instructions for the system.
- Filenames are sanitized; user filenames are not used as server paths.
- Upload size and content limits are enforced.
- The default API binds locally; optional bearer authentication is supported.
- Cross-origin requests are rejected.
- No arbitrary shell, code execution, or external-network tool exists in the agent.
- SQL is restricted to safe read-only analytics.
- Mutating actions require approval and are audited.

Before exposing the API as a public multi-user service, add stronger workload isolation, quotas, multi-tenant authentication, encryption, and operational monitoring.

## 15. Testing and quality checks

The repository includes multiple layers of tests:

| Layer | What it checks |
| --- | --- |
| Unit tests | Small functions such as parsing, chunking, validation, and state behavior. |
| Integration tests | API, SQLite, DuckDB, retrieval, routing, and approval behavior together. |
| Contract tests | The frontend/backend response shapes remain compatible. |
| Evaluation tests | Curated question/source/expected-answer scenarios. |
| Browser tests | Playwright user journeys, including chat, uploads, approvals, and accessibility checks. |
| Security tests | File, input, SQL, and permission boundaries. |

Some optional real-model, real-audio, Docker, and browser checks require suitable local hardware or CI infrastructure. Read [requirements-coverage.md](requirements-coverage.md) for precise implemented-versus-planned status.

## 16. How to explain this project in an interview

> “I built Business AI Agent to solve the problem of scattered business knowledge and spreadsheet-based decision-making. Users can upload private documents or data, ask questions in natural language, receive evidence-backed answers, analyze structured datasets through constrained read-only queries, and prepare actions that require human approval. The project separates a browser-only privacy-focused mode from a local API mode with LangGraph orchestration, SQLite persistence, retrieval, optional local models, and auditability.”

## 17. Simple mental model

```text
Business files + user question
          ↓
Choose the correct safe capability
          ↓
Retrieve evidence / analyze data / prepare action
          ↓
Show answer, source, result, or approval request
          ↓
Keep humans in control of changes
```

The product is strongest when every feature has a clear business purpose: documents become searchable knowledge, spreadsheets become safe analysis, answers are traceable to evidence, and automation remains subject to human approval.
