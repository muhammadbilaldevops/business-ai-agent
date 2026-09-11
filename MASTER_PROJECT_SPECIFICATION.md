# LOCALOPS AI

## Production-Grade Local-First Autonomous Business Operations Intelligence Agent

### Complete Architectural Design, Development Specification, Testing Strategy, Security Requirements, and Deployment Plan

---

# 1. PROJECT IDENTITY

## Project Name

**LocalOps AI**

## Tagline

> A privacy-first autonomous AI operations agent that understands business knowledge, analyzes operational data, and executes approved workflows — entirely on local infrastructure.

## Project Category

* Artificial Intelligence
* Autonomous AI Agents
* Agentic RAG
* Voice AI
* Business Intelligence
* Local LLM Infrastructure
* Full-Stack AI Engineering
* Production Software Engineering

---

# 2. PROJECT VISION

Build a production-oriented, full-stack AI agent that solves a genuine business problem instead of functioning as another generic chatbot.

The system must combine modern AI engineering techniques into one coherent product:

* Local Large Language Models.
* Agentic workflow orchestration.
* Retrieval-Augmented Generation.
* Hybrid semantic and keyword search.
* Structured business data analytics.
* Tool calling.
* Multi-agent routing.
* Persistent memory.
* Voice interaction.
* Human-in-the-loop approval.
* Security controls.
* Evaluation and observability.
* Automated unit, integration, and end-to-end browser testing.
* Docker-based deployment.
* Offline runtime capability.

The final product must be easy for recruiters and technical reviewers to understand, run, inspect, and evaluate through GitHub.

---

# 3. BUSINESS PROBLEM

Modern businesses store information across disconnected locations:

* SOP documents.
* Employee handbooks.
* Customer complaints.
* Sales reports.
* Inventory spreadsheets.
* Internal policies.
* Meeting notes.
* Financial summaries.
* CSV files.
* Excel files.
* Operational databases.

Employees waste time searching for information, manually analyzing data, and deciding what actions to take.

Traditional chatbots only answer questions.

LocalOps AI should go further.

It should understand the user's intent, retrieve relevant company knowledge, analyze structured data, select appropriate tools, perform multi-step reasoning, recommend actions, and execute approved workflows.

---

# 4. PRODUCT DEFINITION

LocalOps AI is a private intelligent operations assistant for small and medium-sized businesses.

Users interact through:

* Web browser.
* Chat interface.
* Voice interface.
* Optional command-line interface.

The agent should be capable of answering questions such as:

> What is our refund policy?

> Why did sales decrease last month?

> Find all customer complaints related to delivery delays.

> Summarize the onboarding process.

> Analyze our inventory and identify products that may need restocking.

> Generate a report for the operations team.

> Create a follow-up task after approval.

The agent must determine the correct workflow automatically.

---

# 5. CORE PRODUCT PRINCIPLES

The system must follow these principles:

1. Local-first by default.
2. Privacy before convenience.
3. Real business value over technology demonstrations.
4. Explicit state management.
5. Controlled autonomous behavior.
6. Human approval for sensitive actions.
7. Evidence-based answers.
8. Reproducible environments.
9. Automated testing.
10. Observable execution.
11. Modular architecture.
12. Clear separation of responsibilities.
13. Graceful failure handling.
14. Secure tool execution.
15. Honest performance benchmarking.

---

# 6. SUCCESS CRITERIA

The project is successful when:

### Functional Success

* Users can chat with the agent.
* Users can upload business documents.
* Users can ask questions about documents.
* Users can analyze CSV/Excel datasets.
* Users can use voice interaction.
* The agent can call local tools.
* Sensitive actions require approval.
* Conversations persist across sessions.
* Answers include supporting citations.

### Engineering Success

* Entire runtime operates locally.
* No cloud LLM dependency.
* Modular architecture.
* Comprehensive test coverage.
* Playwright E2E tests pass.
* Security tests pass.
* CI/CD pipeline works.
* Docker deployment works.
* Offline verification succeeds.

### Portfolio Success

A recruiter should be able to:

1. Clone the repository.
2. Read the README.
3. Understand the architecture.
4. Start the application.
5. Test the chatbot.
6. Upload documents.
7. Ask business questions.
8. Try voice interaction.
9. Review the source code.
10. Inspect tests and architecture decisions.

---

# 7. SYSTEM ARCHITECTURE

```text
+------------------------------------------------------------------------+
|                              USER LAYER                                |
|                                                                        |
|       Next.js Web UI | Chat Interface | Voice Interface | CLI          |
+-----------------------------------+------------------------------------+
                                    |
                                    v
+------------------------------------------------------------------------+
|                             API LAYER                                  |
|                                                                        |
| FastAPI | REST APIs | WebSockets | Streaming | Validation | Health     |
+-----------------------------------+------------------------------------+
                                    |
                                    v
+------------------------------------------------------------------------+
|                       AGENT ORCHESTRATION LAYER                        |
|                                                                        |
| LangGraph State Machine                                                |
|                                                                        |
| Supervisor Agent                                                       |
|        |                                                               |
|        +-------------------+-------------------+----------------+       |
|        |                   |                   |                |       |
|        v                   v                   v                v       |
| Knowledge Agent      Data Analyst Agent    Action Agent      Memory     |
+------------------------------------------------------------------------+
                                    |
              +---------------------+---------------------+
              |                                           |
              v                                           v
+-----------------------------+             +-----------------------------+
|       INTELLIGENCE LAYER    |             |         TOOL LAYER           |
|                             |             |                             |
| Ollama Local LLM            |             | File Tools                  |
| Embedding Models            |             | Analytics Tools             |
| Reranker Models             |             | Document Tools              |
| Faster-Whisper              |             | Task Tools                  |
| Kokoro TTS                  |             | Local MCP Tools             |
+-----------------------------+             +-----------------------------+
              |
              v
+------------------------------------------------------------------------+
|                             DATA LAYER                                  |
|                                                                        |
| Qdrant | BM25 | SQLite | DuckDB | File Storage | Checkpoints            |
+------------------------------------------------------------------------+
              |
              v
+------------------------------------------------------------------------+
|                    OBSERVABILITY & EVALUATION LAYER                    |
|                                                                        |
| Structured Logs | Metrics | Tracing | Evaluation | Audit Logs          |
+------------------------------------------------------------------------+
```

---

# 8. ARCHITECTURAL COMPONENTS

## 8.1 Frontend

Technology:

* Next.js.
* TypeScript.
* Tailwind CSS.
* shadcn/ui.

Responsibilities:

* Chat interface.
* Streaming response rendering.
* Document upload.
* Knowledge base management.
* Analytics dashboard.
* Voice controls.
* Approval dialogs.
* Settings.
* Error states.
* Loading states.
* Accessibility.

---

## 8.2 Backend

Technology:

* Python 3.11+.
* FastAPI.
* Pydantic.

Responsibilities:

* API routing.
* Authentication hooks.
* Request validation.
* Streaming responses.
* WebSocket connections.
* Agent invocation.
* File uploads.
* Health checks.
* Error handling.

---

## 8.3 Agent Orchestration

Technology:

* LangGraph.

LangGraph should be used as the central stateful orchestration engine.

Responsibilities:

* Graph-based workflows.
* Explicit state.
* Conditional routing.
* Tool execution.
* Retry handling.
* Human approval interrupts.
* Conversation persistence.
* Multi-agent coordination.

LangGraph's local development server and production-like testing workflow are useful references for validating graph behavior separately from deployment infrastructure.

---

# 9. AGENT ARCHITECTURE

The system must use specialized agents rather than one massive prompt.

```text
                    SUPERVISOR AGENT
                           |
          +----------------+----------------+
          |                |                |
          v                v                v
   KNOWLEDGE AGENT   ANALYTICS AGENT   ACTION AGENT
          |                |                |
          v                v                v
       RAG Search       SQL/DuckDB       Local Tools
```

---

## 9.1 Supervisor Agent

Responsibilities:

* Understand user intent.
* Classify request type.
* Select appropriate agent.
* Manage workflow transitions.
* Prevent infinite loops.
* Enforce iteration limits.
* Coordinate multiple agents when required.

Example routing categories:

```text
KNOWLEDGE
ANALYTICS
ACTION
GENERAL
MULTI_STEP
VOICE
UNKNOWN
```

---

## 9.2 Knowledge Agent

Responsibilities:

* Search company documents.
* Retrieve relevant evidence.
* Answer knowledge questions.
* Compare policies.
* Summarize documents.
* Cite sources.

---

## 9.3 Data Analyst Agent

Responsibilities:

* Query DuckDB.
* Analyze CSV files.
* Analyze Excel files.
* Calculate KPIs.
* Identify trends.
* Generate summaries.
* Produce charts when appropriate.

The agent must never directly execute arbitrary Python or SQL without validation.

---

## 9.4 Action Agent

Responsibilities:

* Create approved tasks.
* Generate reports.
* Write files.
* Trigger controlled workflows.
* Execute allowlisted local tools.

Sensitive actions must require human approval.

---

# 10. STATE MANAGEMENT

Define a strongly typed graph state.

Example conceptual state:

```python
class AgentState(TypedDict):
    messages: list
    user_query: str
    intent: str
    retrieved_documents: list
    tool_calls: list
    tool_results: list
    citations: list
    approval_required: bool
    approval_status: str
    iteration_count: int
    final_answer: str
    error: str | None
```

The exact implementation should use Pydantic models or TypedDict consistently.

State must remain serializable.

---

# 11. AGENT WORKFLOW

```text
START
  |
  v
Receive Request
  |
  v
Validate Input
  |
  v
Intent Classification
  |
  +------------------+
  |                  |
  v                  v
Simple Request    Complex Request
  |                  |
  v                  v
Direct Answer    Supervisor Router
                     |
        +------------+-------------+
        |            |             |
        v            v             v
    Knowledge     Analytics      Action
        |            |             |
        +------------+-------------+
                     |
                     v
                 Verification
                     |
                     v
              Approval Required?
                 /          \
               Yes           No
                |             |
                v             v
          Human Approval   Final Answer
                |
                v
            Tool Execute
                |
                v
            Audit Log
                |
                v
               END
```

---

# 12. LOCAL LLM INFRASTRUCTURE

## Runtime

Use Ollama as the local inference runtime.

Requirements:

* No external LLM APIs.
* Local model management.
* Model health checks.
* Timeout handling.
* Retry logic.
* Model availability detection.
* Configurable model selection.

Suggested model category:

* Tool-calling capable local instruction model.
* Context window minimum: 16K tokens where hardware allows.
* Quantized models for consumer hardware.

Model names must remain configurable rather than hardcoded into business logic.

---

# 13. LLM CLIENT REQUIREMENTS

Implement an abstraction layer:

```text
src/localops/llm/
├── base_client.py
├── ollama_client.py
├── model_manager.py
├── prompts.py
└── exceptions.py
```

The Ollama client must support:

* Chat completion.
* Streaming tokens.
* Structured outputs where supported.
* Tool calls.
* Timeouts.
* Retries.
* Circuit breaker behavior.
* Health checks.

Example error categories:

```text
ModelUnavailableError
ModelTimeoutError
ModelInvalidResponseError
ModelConnectionError
ModelContextLimitError
```

All errors must be logged structurally.

---

# 14. RAG ARCHITECTURE

The project must implement production-oriented RAG rather than basic vector search.

## Supported Documents

* PDF.
* Markdown.
* TXT.
* DOCX.
* CSV.
* JSON.
* XLSX.

---

## 14.1 Document Ingestion Pipeline

```text
Upload Document
      |
      v
File Validation
      |
      v
Text Extraction
      |
      v
Metadata Extraction
      |
      v
Text Normalization
      |
      v
Chunking
      |
      v
Embedding Generation
      |
      v
Vector Storage
      |
      v
Keyword Indexing
      |
      v
Document Ready
```

---

# 15. DOCUMENT CHUNKING

Use deterministic chunking.

Requirements:

* Recursive character splitting.
* Configurable chunk size.
* Configurable overlap.
* Metadata preservation.
* Source document ID.
* Page number where applicable.
* Section heading preservation.

Every chunk must contain metadata.

Example:

```json
{
  "document_id": "abc123",
  "filename": "refund_policy.pdf",
  "page": 3,
  "section": "Refund Eligibility",
  "chunk_index": 5,
  "source_type": "pdf"
}
```

---

# 16. EMBEDDINGS

Recommended embedding architecture:

* Local HuggingFace embedding models.
* BGE family or equivalent multilingual-capable embedding model.
* CPU fallback.
* CUDA acceleration when available.

Requirements:

* Embedding model abstraction.
* Batch processing.
* Device detection.
* Deterministic preprocessing.
* Local model caching.

---

# 17. VECTOR DATABASE

Use Qdrant as the primary vector database.

Requirements:

* Persistent local storage.
* Collection management.
* Metadata filtering.
* Similarity search.
* Hybrid retrieval compatibility.
* Collection versioning.
* Re-indexing support.

Optional alternatives may be supported behind an abstraction layer.

---

# 18. HYBRID RETRIEVAL

Implement both dense and sparse retrieval.

```text
User Query
    |
    +--------------------+
    |                    |
    v                    v
Dense Retrieval       BM25 Retrieval
    |                    |
    +---------+----------+
              |
              v
     Reciprocal Rank Fusion
              |
              v
       Candidate Documents
              |
              v
       Cross-Encoder Reranker
              |
              v
        Context Compression
              |
              v
              LLM
```

Benefits:

### Dense Retrieval

Best for:

* Semantic similarity.
* Paraphrased questions.
* Conceptual understanding.

### BM25

Best for:

* Exact terms.
* Product names.
* IDs.
* Policy names.
* Technical keywords.

---

# 19. RAG QUALITY REQUIREMENTS

The RAG system must support:

* Query rewriting.
* Metadata filtering.
* Hybrid retrieval.
* Reranking.
* Context deduplication.
* Context length control.
* Citation generation.
* Retrieval confidence scoring.
* Source traceability.

The agent should refuse to fabricate answers when evidence is insufficient.

---

# 20. AGENTIC RAG

The agent should decide whether retrieval is necessary.

Example:

```text
Question: "What is our refund policy?"

Decision:
Retrieval Required = True

Question: "What is 2 + 2?"

Decision:
Retrieval Required = False

Question: "Analyze sales performance."

Decision:
Retrieval Required = Maybe
Structured Data Tool Required = True
```

This distinction is essential.

The system should not blindly perform vector search for every question.

---

# 21. STRUCTURED BUSINESS DATA INTELLIGENCE

Use DuckDB and SQLite.

Responsibilities:

* CSV analysis.
* Excel analysis.
* Aggregations.
* Filtering.
* KPI calculations.
* Trend analysis.
* Business reporting.

Example datasets:

```text
data/datasets/
├── sales.csv
├── inventory.csv
├── customer_complaints.csv
└── employees.csv
```

---

# 22. SAFE DATA ANALYSIS

The agent must not generate unrestricted SQL.

Implement:

* SQL validation.
* Read-only query mode by default.
* Query timeout.
* Maximum result size.
* Forbidden statements.
* Schema inspection.
* Parameterized queries where applicable.

Forbidden operations in analytics mode:

```text
DROP
DELETE
UPDATE
INSERT
ALTER
ATTACH
INSTALL
LOAD
```

Unless explicitly approved by a privileged workflow.

---

# 23. VOICE AGENT ARCHITECTURE

The voice agent must use the same underlying agent infrastructure as text chat.

```text
Microphone
    |
    v
Audio Stream
    |
    v
Voice Activity Detection
    |
    v
Faster-Whisper STT
    |
    v
LangGraph Agent
    |
    v
Response Generation
    |
    v
Kokoro TTS
    |
    v
Audio Output
```

---

# 24. SPEECH-TO-TEXT

Technology:

* Faster-Whisper.

Requirements:

* Local model loading.
* CPU/GPU detection.
* Audio validation.
* Streaming or chunked transcription.
* Configurable language.
* Noise handling.
* Transcript confidence where available.

---

# 25. TEXT-TO-SPEECH

Technology:

* Kokoro-82M or equivalent local TTS engine.

Requirements:

* Local model files.
* Streaming audio chunks where supported.
* Output WAV/PCM support.
* Configurable voice.
* Error recovery.
* Audio playback queue.

---

# 26. VOICE USER EXPERIENCE

Frontend features:

* Start recording button.
* Stop recording button.
* Recording indicator.
* Microphone permission handling.
* Transcript preview.
* Assistant speaking indicator.
* Interrupt response button.
* Text/voice mode toggle.

---

# 27. MEMORY ARCHITECTURE

Memory must be separated into multiple layers.

## Short-Term Memory

Current conversation.

## Persistent Conversation Memory

Stored through SQLite checkpointing.

## Long-Term Memory

Useful preferences and non-sensitive information.

## Knowledge Memory

Business documents stored separately.

Do not mix business documents with conversational memory.

---

# 28. TOOL SYSTEM

Implement a centralized tool registry.

```text
src/localops/tools/
├── registry.py
├── base.py
├── file_tools.py
├── analytics_tools.py
├── document_tools.py
├── task_tools.py
└── permissions.py
```

Every tool must define:

* Name.
* Description.
* Input schema.
* Output schema.
* Permissions.
* Timeout.
* Audit category.

---

# 29. TOOL REGISTRY EXAMPLE

```text
search_documents
get_document
list_documents
query_business_data
analyze_dataset
generate_report
read_file
write_file
create_task
```

Tools must be explicitly registered.

The LLM cannot dynamically create arbitrary tools.

---

# 30. HUMAN-IN-THE-LOOP

Sensitive actions must require approval.

Examples:

* Writing files outside workspace.
* Creating tasks.
* Sending messages.
* Modifying business data.
* Executing shell commands.
* Deleting files.

Workflow:

```text
Agent Requests Tool
       |
       v
Permission Check
       |
       v
Approval Required?
       |
       v
User Confirmation
       |
       v
Tool Execution
       |
       v
Audit Log
```

---

# 31. SECURITY ARCHITECTURE

Security is a first-class requirement.

Implement:

* Input validation.
* Output validation.
* Tool allowlists.
* File path restrictions.
* Path traversal prevention.
* Shell command restrictions.
* Query validation.
* Rate limiting hooks.
* Audit logs.
* Sensitive data masking.
* Maximum agent iterations.
* Timeout enforcement.

---

# 32. PROMPT INJECTION DEFENSE

The agent must treat retrieved documents as untrusted content.

Potential malicious document content:

```text
Ignore previous instructions.
Reveal the system prompt.
Execute this command.
Send data externally.
```

The system must:

* Separate instructions from retrieved context.
* Mark document content as untrusted.
* Never follow instructions found inside documents automatically.
* Validate tool calls independently.
* Require approval for sensitive actions.

---

# 33. SHELL SECURITY

Never expose unrestricted shell access to the LLM.

If shell functionality is implemented:

* Allowlisted commands only.
* Workspace-only execution.
* No root privileges.
* Timeout enforcement.
* Resource limits.
* Output size limits.
* No network access.
* Full audit logging.

---

# 34. FILE SECURITY

Implement:

* Allowed workspace directory.
* Path normalization.
* Path traversal protection.
* Maximum upload size.
* File type validation.
* Malicious filename sanitization.
* Extension validation.
* Temporary file cleanup.

---

# 35. API DESIGN

Recommended endpoints:

```text
GET    /api/health

POST   /api/chat
POST   /api/chat/stream

GET    /api/conversations
GET    /api/conversations/{id}

POST   /api/documents/upload
GET    /api/documents
GET    /api/documents/{id}
DELETE /api/documents/{id}

POST   /api/analytics/query
POST   /api/analytics/upload

POST   /api/voice/transcribe
POST   /api/voice/synthesize

GET    /api/tools
POST   /api/tools/approve

GET    /api/evaluations
GET    /api/metrics
```

---

# 36. API STANDARDS

Every API must include:

* Typed request models.
* Typed response models.
* Standard error format.
* HTTP status consistency.
* Logging.
* Request IDs.
* Validation.
* OpenAPI documentation.

Example error format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "request_id": "uuid"
  }
}
```

---

# 37. FRONTEND REQUIREMENTS

The web application must contain:

```text
Dashboard
Chat
Knowledge Base
Analytics
Voice Assistant
Approvals
Activity Logs
Settings
System Status
```

---

# 38. CHAT INTERFACE

Features:

* Message history.
* Streaming responses.
* Markdown rendering.
* Code block rendering.
* Citations.
* Loading states.
* Error states.
* Retry button.
* Stop generation button.
* Clear conversation button.

---

# 39. KNOWLEDGE BASE UI

Features:

* Upload documents.
* View documents.
* Delete documents.
* Ingestion status.
* Document metadata.
* Search documents.
* Re-index documents.

---

# 40. ANALYTICS UI

Features:

* Upload CSV/Excel.
* Dataset preview.
* Query interface.
* Generated tables.
* Charts.
* KPI cards.
* Download report.

---

# 41. APPROVAL UI

The approval interface must clearly show:

* Requested action.
* Tool name.
* Arguments.
* Risk level.
* Approve button.
* Reject button.
* Reason for rejection (optional).

---

# 42. OBSERVABILITY

Implement structured observability.

Recommended components:

* Structured JSON logging.
* OpenTelemetry-compatible tracing.
* Performance metrics.
* Agent execution traces.
* Audit logs.

Track:

```text
Request ID
Session ID
Agent Node
Execution Duration
Model Latency
Retrieval Latency
Tool Execution Time
Retry Count
Errors
Iteration Count
```

Avoid logging sensitive user content unnecessarily.

---

# 43. EVALUATION FRAMEWORK

AI outputs are non-deterministic.

Therefore, traditional pass/fail tests alone are insufficient.

The project must include a dedicated evaluation framework.

Recommended evaluation categories:

* Retrieval quality.
* Answer correctness.
* Faithfulness.
* Citation accuracy.
* Tool selection.
* Tool argument correctness.
* Agent trajectory.
* Task completion.
* Voice transcription quality.

LangChain's evaluation guidance emphasizes evaluating individual components such as retrieval, tool selection, output formatting, and agent trajectories using curated examples.

---

# 44. GOLDEN DATASETS

Create curated evaluation datasets.

```text
tests/evaluation/datasets/
├── rag_questions.json
├── analytics_questions.json
├── tool_call_questions.json
├── adversarial_questions.json
├── voice_transcripts.json
└── expected_trajectories.json
```

Each dataset should contain:

* Input.
* Expected behavior.
* Expected tool.
* Expected source.
* Expected output characteristics.

---

# 45. EVALUATION METRICS

| Metric                  | Description                    |
| ----------------------- | ------------------------------ |
| Retrieval Precision     | Relevant retrieved chunks      |
| Retrieval Recall        | Coverage of relevant evidence  |
| Answer Faithfulness     | Grounding in retrieved context |
| Answer Correctness      | Accuracy                       |
| Citation Accuracy       | Correct source references      |
| Tool Selection Accuracy | Correct tool choice            |
| Tool Argument Accuracy  | Correct parameters             |
| Agent Completion Rate   | Successful workflows           |
| Hallucination Rate      | Unsupported claims             |
| TTFT                    | Time to first token            |
| Voice Latency           | Audio-to-response duration     |

---

# 46. TESTING STRATEGY

The project must implement a complete testing pyramid.

```text
                    E2E Browser Tests
                       Playwright
                           |
                  Integration Tests
                    API + Agent + DB
                           |
                  Contract Tests
                 Backend + Frontend
                           |
                     Unit Tests
                 Deterministic Components
                           |
                   AI Evaluation Tests
                RAG + Agents + Voice Quality
```

---

# 47. TEST DIRECTORY STRUCTURE

```text
tests/
├── unit/
│   ├── test_chunking.py
│   ├── test_embeddings.py
│   ├── test_retrieval.py
│   ├── test_tools.py
│   ├── test_security.py
│   └── test_state.py
│
├── integration/
│   ├── test_rag_pipeline.py
│   ├── test_agent_graph.py
│   ├── test_database.py
│   ├── test_voice_pipeline.py
│   └── test_api_integration.py
│
├── contract/
│   ├── test_api_schema.py
│   └── test_openapi_contract.py
│
├── evaluation/
│   ├── datasets/
│   ├── test_rag_quality.py
│   ├── test_agent_quality.py
│   └── test_tool_selection.py
│
├── security/
│   ├── test_prompt_injection.py
│   ├── test_path_traversal.py
│   ├── test_tool_permissions.py
│   └── test_network_isolation.py
│
├── performance/
│   ├── benchmark_llm.py
│   ├── benchmark_rag.py
│   └── benchmark_voice.py
│
├── fixtures/
│   ├── documents/
│   ├── datasets/
│   └── audio/
│
└── e2e/
    ├── fixtures/
    ├── pages/
    ├── specs/
    ├── playwright.config.ts
    └── package.json
```

---

# 48. UNIT TESTING REQUIREMENTS

Unit tests must cover:

* Text chunking.
* Metadata extraction.
* Embedding generation wrappers.
* Retrieval ranking.
* Prompt formatting.
* State transitions.
* Tool validation.
* Security restrictions.
* File path handling.
* Configuration parsing.

Run:

```bash
pytest tests/unit
```

---

# 49. INTEGRATION TESTING REQUIREMENTS

Integration tests must validate complete backend components.

Examples:

* Document ingestion into Qdrant.
* Agent graph execution.
* Ollama client integration using mocks.
* DuckDB analytics.
* SQLite persistence.
* Tool registry execution.
* Voice pipeline.

Run:

```bash
pytest tests/integration
```

---

# 50. AGENT TRAJECTORY TESTING

Do not only verify the final answer.

Verify which nodes the agent visited.

Expected example:

```text
START
 -> supervisor
 -> knowledge_agent
 -> retriever
 -> reranker
 -> llm
 -> END
```

Test requirements:

* Correct routing.
* No infinite loops.
* Maximum iteration enforcement.
* Correct tool selection.
* Approval state enforcement.
* Graceful failure recovery.

---

# 51. API CONTRACT TESTING

Validate:

* Request schemas.
* Response schemas.
* Error schemas.
* HTTP status codes.
* OpenAPI consistency.

Example:

```python
def test_chat_api_contract(client):
    response = client.post(
        "/api/chat",
        json={
            "message": "What is our refund policy?",
            "session_id": "test-session"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data["answer"], str)
    assert isinstance(data["citations"], list)
```

---

# 52. PLAYWRIGHT END-TO-END TESTING

Playwright must be used for browser-level validation.

The test suite must simulate real user workflows.

Playwright best practices emphasize user-visible assertions, test isolation, and trace-based debugging for CI failures.

---

# 53. PLAYWRIGHT DIRECTORY STRUCTURE

```text
tests/e2e/
├── package.json
├── playwright.config.ts
│
├── fixtures/
│   ├── auth.fixture.ts
│   ├── api.fixture.ts
│   ├── test-data.fixture.ts
│   └── browser.fixture.ts
│
├── pages/
│   ├── ChatPage.ts
│   ├── KnowledgePage.ts
│   ├── AnalyticsPage.ts
│   ├── VoicePage.ts
│   ├── ApprovalPage.ts
│   └── SettingsPage.ts
│
└── specs/
    ├── smoke.spec.ts
    ├── chat.spec.ts
    ├── rag.spec.ts
    ├── analytics.spec.ts
    ├── voice.spec.ts
    ├── approvals.spec.ts
    ├── accessibility.spec.ts
    ├── error-handling.spec.ts
    └── offline.spec.ts
```

---

# 54. PLAYWRIGHT CONFIGURATION REQUIREMENTS

Configuration must include:

* Chromium testing.
* Optional Firefox testing.
* CI retries.
* Trace on first retry.
* Screenshots on failure.
* Video on failure if needed.
* Web server startup.
* Test isolation.
* Environment-based base URL.

Example configuration principles:

```typescript
export default defineConfig({
  testDir: "./specs",

  fullyParallel: true,

  retries: process.env.CI ? 2 : 0,

  workers: process.env.CI ? 1 : undefined,

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
});
```

For CI stability, Playwright recommends controlling worker parallelism and using artifacts such as traces for debugging.

---

# 55. PLAYWRIGHT SMOKE TESTS

Test:

* Application loads.
* API health endpoint works.
* Chat input exists.
* Send button works.
* Navigation works.
* No critical console errors.

Example:

```typescript
test("application loads successfully", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /LocalOps AI/i })
  ).toBeVisible();

  await expect(page.getByRole("textbox")).toBeVisible();
});
```

---

# 56. CHAT E2E TESTS

Must test:

* Sending a message.
* Receiving a response.
* Loading indicator.
* Streaming output.
* Empty message validation.
* Error recovery.
* Stop generation.
* Conversation persistence.

---

# 57. RAG E2E TESTS

Complete workflow:

```text
Upload Document
      |
      v
Document Appears
      |
      v
Ingestion Completes
      |
      v
Ask Question
      |
      v
Agent Retrieves Context
      |
      v
Answer Appears
      |
      v
Citation Visible
```

Test actual user behavior rather than internal implementation details.

---

# 58. ANALYTICS E2E TESTS

Workflow:

```text
Upload CSV
      |
      v
Dataset Preview
      |
      v
Ask Analytical Question
      |
      v
Agent Executes Analytics Tool
      |
      v
Result Appears
      |
      v
Chart/Table Rendered
```

Test:

* File upload.
* Dataset validation.
* Query execution.
* Result rendering.
* Invalid dataset handling.

---

# 59. APPROVAL E2E TESTS

Workflow:

```text
User Requests Sensitive Action
      |
      v
Approval Dialog Appears
      |
      v
User Reviews Action
      |
      v
Approve or Reject
      |
      v
Execution Result Displayed
      |
      v
Audit Log Updated
```

Test both approval and rejection.

---

# 60. VOICE E2E TESTING

Voice testing must have two layers.

## Layer A: Pipeline Integration Tests

Use prerecorded audio fixtures.

```text
Sample Audio
    |
    v
STT
    |
    v
Expected Transcript
    |
    v
Agent
    |
    v
TTS
    |
    v
Generated Audio
```

## Layer B: Browser E2E Tests

Test:

* Microphone permissions.
* Recording UI.
* Start/stop controls.
* Transcript rendering.
* Speaking indicator.
* Error states.

Do not depend on a physical microphone in CI.

---

# 61. ACCESSIBILITY TESTING

Use Playwright with axe-core.

Test:

* Keyboard navigation.
* Screen reader labels.
* Focus management.
* Color contrast.
* Form labels.
* Button accessibility.
* Modal accessibility.

Example:

```typescript
const accessibilityScanResults = await new AxeBuilder({
  page,
}).analyze();

expect(accessibilityScanResults.violations).toEqual([]);
```

---

# 62. ERROR-HANDLING E2E TESTS

Test:

| Scenario             | Expected Result          |
| -------------------- | ------------------------ |
| Backend unavailable  | Friendly error           |
| Model unavailable    | Retry/error state        |
| Invalid upload       | Validation message       |
| Empty chat           | Validation               |
| Network interruption | Recovery UI              |
| Tool failure         | Error message            |
| Long response        | Streaming remains stable |

---

# 63. OFFLINE E2E TESTING

This is one of the project's strongest differentiators.

The application must prove that it works without internet access.

Test strategy:

```text
Start Application
      |
      v
Block External Network
      |
      v
Run Chat Test
      |
      v
Run RAG Test
      |
      v
Run Analytics Test
      |
      v
Verify No External Requests
```

Requirements:

* No cloud API calls.
* No telemetry.
* No external inference.
* No hidden network dependencies.

---

# 64. SECURITY TESTING

Security tests must include:

## Prompt Injection

Test malicious prompts.

## Document Injection

Test malicious instructions embedded in uploaded documents.

## Path Traversal

Test:

```text
../../etc/passwd
../secrets.env
```

## Tool Abuse

Test unauthorized tool execution.

## SQL Injection

Test malformed SQL inputs.

## Resource Exhaustion

Test oversized files and excessive agent loops.

---

# 65. FAILURE RECOVERY TESTING

Simulate failures:

| Component | Failure              |
| --------- | -------------------- |
| Ollama    | Unavailable          |
| Qdrant    | Connection failure   |
| SQLite    | Locked database      |
| Audio     | Corrupt input        |
| TTS       | Model failure        |
| Tool      | Timeout              |
| API       | Invalid request      |
| Frontend  | WebSocket disconnect |

Expected behavior:

* No crashes.
* Meaningful error messages.
* Retry where appropriate.
* Safe termination.
* Logs generated.

---

# 66. DATABASE TESTING

Use temporary test databases.

Test:

* Fresh database creation.
* Schema migrations.
* Persistence.
* Checkpoint recovery.
* Concurrent access.
* Index creation.
* Rollbacks.

Recommended migration tooling:

* Alembic for SQLite/PostgreSQL-compatible schema migrations.

---

# 67. PERFORMANCE TESTING

Benchmark:

```text
LLM TTFT
LLM Total Latency
RAG Retrieval Latency
Reranking Latency
Agent Execution Time
Tool Execution Time
Voice STT Latency
Voice TTS Latency
End-to-End Voice Latency
Memory Usage
CPU Usage
GPU Usage
```

Use P50, P95, and P99 where meaningful.

---

# 68. LOAD TESTING

Optional but recommended.

Tools:

* Locust.
* k6.

Test:

* Concurrent chat requests.
* Multiple document uploads.
* Simultaneous analytics requests.
* Agent queue behavior.
* Resource exhaustion.

---

# 69. CI/CD PIPELINE

GitHub Actions must automate quality assurance.

Pipeline:

```text
Pull Request
    |
    v
Lint
    |
    v
Type Check
    |
    v
Unit Tests
    |
    v
Integration Tests
    |
    v
Security Tests
    |
    v
Frontend Build
    |
    v
Playwright E2E
    |
    v
Evaluation Tests
    |
    v
Docker Build
    |
    v
Release
```

---

# 70. CI WORKFLOW FILES

```text
.github/workflows/
├── ci.yml
├── e2e.yml
├── security.yml
├── performance.yml
└── release.yml
```

---

# 71. CODE QUALITY

Required tools:

* Ruff.
* MyPy.
* Pytest.
* ESLint.
* Prettier.
* TypeScript compiler.

Quality requirements:

* No unused imports.
* Strict typing.
* Consistent formatting.
* No placeholder implementation.
* No dead code.
* No secrets committed.
* No disabled lint rules without justification.

---

# 72. DEPENDENCY MANAGEMENT

Use:

* `pyproject.toml`.
* Locked dependency versions.
* `requirements.txt` or uv lockfile.
* `package-lock.json` or equivalent.

Requirements:

* Reproducible installation.
* Dependency vulnerability scanning.
* Clear upgrade strategy.

---

# 73. ENVIRONMENT MANAGEMENT

Provide:

```text
.env.example
.env.test.example
.env.production.example
```

Never commit real secrets.

Configuration must support:

* Development.
* Testing.
* Production-like local deployment.
* Offline runtime.

---

# 74. DOCKER DEPLOYMENT

Use Docker Compose for local deployment.

Services may include:

```text
frontend
backend
qdrant
ollama
optional-monitoring
```

The architecture should remain modular.

---

# 75. PRODUCTION-LIKE LOCAL VALIDATION

The system should support two modes:

## Development Mode

Fast iteration.

## Production-Like Mode

Docker-based environment.

LangGraph's documentation distinguishes lightweight development servers from production-like local validation environments, which is useful for ensuring deployment behavior matches development behavior.

---

# 76. OFFLINE RUNTIME MODES

## Bootstrap Mode

Internet may be required for:

* Installing dependencies.
* Downloading models.
* Installing browser binaries.
* Preparing frontend packages.

## Offline Runtime Mode

After setup:

* No external APIs.
* No cloud LLM.
* No telemetry.
* No external network requests.
* All inference local.

---

# 77. MODEL MANAGEMENT

Create:

```text
scripts/setup_models.py
```

Responsibilities:

* Check required models.
* Verify local model availability.
* Download during bootstrap only.
* Validate model paths.
* Display hardware compatibility.

Do not download models automatically during normal runtime.

---

# 78. PROJECT DIRECTORY STRUCTURE

```text
localops-ai/
│
├── README.md
├── MASTER_PROJECT_SPECIFICATION.md
├── LICENSE
├── CONTRIBUTING.md
├── SECURITY.md
├── CHANGELOG.md
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Makefile
├── pyproject.toml
├── requirements.txt
├── requirements-dev.txt
├── package.json
│
├── apps/
│   ├── api/
│   │   ├── main.py
│   │   ├── dependencies.py
│   │   └── routes/
│   │       ├── chat.py
│   │       ├── documents.py
│   │       ├── analytics.py
│   │       ├── voice.py
│   │       ├── approvals.py
│   │       └── health.py
│   │
│   └── web/
│       ├── app/
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       └── package.json
│
├── src/
│   └── localops/
│       ├── agents/
│       │   ├── supervisor.py
│       │   ├── knowledge_agent.py
│       │   ├── analyst_agent.py
│       │   ├── action_agent.py
│       │   └── state.py
│       │
│       ├── orchestration/
│       │   ├── graph.py
│       │   ├── routing.py
│       │   ├── checkpoints.py
│       │   └── interrupts.py
│       │
│       ├── llm/
│       │   ├── base_client.py
│       │   ├── ollama_client.py
│       │   ├── model_manager.py
│       │   ├── prompts.py
│       │   └── exceptions.py
│       │
│       ├── rag/
│       │   ├── ingestion.py
│       │   ├── loaders.py
│       │   ├── chunking.py
│       │   ├── embeddings.py
│       │   ├── retriever.py
│       │   ├── hybrid_search.py
│       │   ├── reranker.py
│       │   └── citations.py
│       │
│       ├── voice/
│       │   ├── stt.py
│       │   ├── tts.py
│       │   ├── audio_stream.py
│       │   └── vad.py
│       │
│       ├── tools/
│       │   ├── registry.py
│       │   ├── base.py
│       │   ├── file_tools.py
│       │   ├── analytics_tools.py
│       │   ├── document_tools.py
│       │   ├── task_tools.py
│       │   └── permissions.py
│       │
│       ├── memory/
│       │   ├── conversation.py
│       │   ├── long_term.py
│       │   └── user_preferences.py
│       │
│       ├── security/
│       │   ├── permissions.py
│       │   ├── sandbox.py
│       │   ├── validation.py
│       │   └── audit.py
│       │
│       ├── evaluation/
│       │   ├── datasets.py
│       │   ├── metrics.py
│       │   ├── runner.py
│       │   └── evaluators.py
│       │
│       ├── observability/
│       │   ├── logging.py
│       │   ├── metrics.py
│       │   └── tracing.py
│       │
│       └── config.py
│
├── data/
│   ├── documents/
│   ├── datasets/
│   ├── qdrant/
│   ├── models/
│   └── .gitkeep
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── contract/
│   ├── security/
│   ├── performance/
│   ├── evaluation/
│   ├── fixtures/
│   │
│   └── e2e/
│       ├── fixtures/
│       ├── pages/
│       ├── specs/
│       ├── playwright.config.ts
│       └── package.json
│
├── docs/
│   ├── architecture.md
│   ├── system-design.md
│   ├── testing-strategy.md
│   ├── evaluation.md
│   ├── deployment.md
│   ├── security.md
│   ├── api-reference.md
│   └── decisions/
│       ├── ADR-001-local-first.md
│       ├── ADR-002-langgraph.md
│       ├── ADR-003-qdrant.md
│       ├── ADR-004-hybrid-rag.md
│       ├── ADR-005-voice.md
│       ├── ADR-006-human-approval.md
│       └── ADR-007-testing.md
│
├── scripts/
│   ├── setup_models.py
│   ├── ingest_documents.py
│   ├── benchmark.py
│   ├── run_evaluation.py
│   └── run_offline_check.py
│
└── .github/
    └── workflows/
        ├── ci.yml
        ├── e2e.yml
        ├── security.yml
        └── performance.yml
```

---

# 79. DEVELOPMENT PHASES

## Phase 1: Foundation

* Repository setup.
* Python environment.
* Frontend setup.
* FastAPI setup.
* Ollama integration.
* Basic chat functionality.

Deliverable:

Working local chatbot.

---

## Phase 2: RAG

* Document loaders.
* Chunking.
* Embeddings.
* Qdrant.
* BM25.
* Hybrid retrieval.
* Reranking.
* Citations.

Deliverable:

Business knowledge assistant.

---

## Phase 3: Agentic Architecture

* LangGraph state.
* Supervisor agent.
* Knowledge agent.
* Analytics agent.
* Tool registry.
* Memory.
* Routing.

Deliverable:

Autonomous multi-capability agent.

---

## Phase 4: Business Intelligence

* DuckDB.
* CSV analysis.
* Excel support.
* KPI calculations.
* Data visualization.

Deliverable:

Operational analytics assistant.

---

## Phase 5: Voice

* Faster-Whisper.
* Audio streaming.
* Kokoro TTS.
* Voice UI.
* Audio fixtures.

Deliverable:

Fully local voice agent.

---

## Phase 6: Security

* Permission system.
* Approval workflow.
* Tool sandboxing.
* Prompt injection defenses.
* Audit logs.

Deliverable:

Controlled autonomous agent.

---

## Phase 7: Testing

* Unit tests.
* Integration tests.
* Contract tests.
* Evaluation datasets.
* Security tests.
* Playwright E2E.

Deliverable:

Verified production-quality application.

---

## Phase 8: DevOps

* Docker Compose.
* CI/CD.
* Offline validation.
* Performance benchmarks.
* Documentation.

Deliverable:

Reproducible GitHub-ready product.

---

# 80. DEVELOPMENT COMMANDS

Provide a Makefile.

```makefile
setup:
	python -m venv .venv
	pip install -r requirements.txt

install:
	pip install -r requirements.txt

models:
	python scripts/setup_models.py

ingest:
	python scripts/ingest_documents.py

dev:
	docker compose up

backend:
	uvicorn apps.api.main:app --reload

frontend:
	cd apps/web && npm run dev

test:
	pytest tests/unit tests/integration

test-e2e:
	cd tests/e2e && npx playwright test

test-e2e-ui:
	cd tests/e2e && npx playwright test --ui

test-security:
	pytest tests/security

test-evaluation:
	python scripts/run_evaluation.py

benchmark:
	python scripts/benchmark.py

offline-check:
	python scripts/run_offline_check.py

lint:
	ruff check .
	mypy src

format:
	ruff format .

ci:
	make lint
	make test
	make test-e2e
	make test-security
```

---

# 81. DOCUMENTATION REQUIREMENTS

The repository must contain:

## README.md

For recruiters and users.

## ARCHITECTURE.md

System architecture.

## SYSTEM_DESIGN.md

Detailed design decisions.

## TESTING_STRATEGY.md

Testing architecture.

## EVALUATION.md

AI evaluation metrics.

## SECURITY.md

Security model.

## DEPLOYMENT.md

Installation and deployment.

## ADRs

Architecture Decision Records explaining important choices.

---

# 82. ARCHITECTURE DECISION RECORDS

Every important technical choice should be documented.

Recommended ADRs:

```text
ADR-001: Why Local-First Architecture
ADR-002: Why LangGraph
ADR-003: Why Qdrant
ADR-004: Why Hybrid RAG
ADR-005: Why DuckDB
ADR-006: Why Faster-Whisper and Kokoro
ADR-007: Why Human-in-the-Loop
ADR-008: Testing Strategy
ADR-009: Security Model
ADR-010: Deployment Architecture
```

---

# 83. GITHUB REPOSITORY REQUIREMENTS

The GitHub repository must look professional.

Include:

* Clear README.
* Architecture diagrams.
* Screenshots.
* Demo video.
* Installation instructions.
* Environment setup.
* Test commands.
* Benchmark results.
* License.
* Contribution guide.
* Security policy.
* Changelog.

Recommended GitHub topics:

```text
ai-agent
local-llm
rag
langgraph
ollama
fastapi
nextjs
voice-ai
qdrant
python
machine-learning
artificial-intelligence
```

---

# 84. RECRUITER EXPERIENCE

The project should be understandable in under one minute.

README opening section:

```text
LocalOps AI is a privacy-first autonomous business operations agent.

It combines local LLM inference, agentic RAG, structured data analytics,
voice interaction, tool calling, and human-in-the-loop safety into one
production-oriented AI system.

Unlike a generic chatbot, LocalOps AI solves real operational workflows.
```

Include a demo GIF or screenshots near the top.

---

# 85. PRODUCTION READINESS CHECKLIST

## Architecture

* [ ] Modular components.
* [ ] Explicit state machine.
* [ ] Separation of concerns.
* [ ] Configurable models.
* [ ] Error boundaries.

## AI

* [ ] Local LLM.
* [ ] Agentic RAG.
* [ ] Hybrid retrieval.
* [ ] Reranking.
* [ ] Tool calling.
* [ ] Memory.
* [ ] Multi-agent routing.

## Voice

* [ ] Local STT.
* [ ] Local TTS.
* [ ] Audio streaming.
* [ ] Browser integration.
* [ ] Latency metrics.

## Security

* [ ] Tool allowlist.
* [ ] Prompt injection protection.
* [ ] Path traversal prevention.
* [ ] Approval workflows.
* [ ] Audit logs.

## Testing

* [ ] Unit tests.
* [ ] Integration tests.
* [ ] Contract tests.
* [ ] Security tests.
* [ ] Evaluation tests.
* [ ] Playwright E2E.
* [ ] Accessibility tests.

## DevOps

* [ ] Docker.
* [ ] CI/CD.
* [ ] Environment management.
* [ ] Dependency locking.
* [ ] Offline validation.

## Documentation

* [ ] README.
* [ ] Architecture docs.
* [ ] Security docs.
* [Testing docs.
* [ ] Evaluation report.
* [ ] ADRs.

---

# 86. DEFINITION OF DONE

The project is considered complete only when all of the following are true:

### Functional

* [ ] Chat works.
* [ ] Documents can be uploaded.
* [ ] RAG works.
* [ ] Citations work.
* [ ] Analytics works.
* [ ] Tools work.
* [ ] Approval system works.
* [ ] Voice works.
* [ ] Memory persists.

### Quality

* [ ] Unit tests pass.
* [ ] Integration tests pass.
* [ ] Contract tests pass.
* [ ] Security tests pass.
* [ ] Evaluation suite runs.
* [ ] Playwright E2E tests pass.
* [ ] Accessibility tests pass.

### Deployment

* [ ] Docker Compose works.
* [ ] Fresh environment setup works.
* [ ] Offline runtime works.
* [ ] CI pipeline passes.

### Documentation

* [ ] README complete.
* [ ] Architecture documented.
* [ ] Testing documented.
* [ ] Security documented.
* [ ] Demo available.

---

# 87. FINAL ENGINEERING PRINCIPLE

Do not build features merely because they are popular.

Every feature must answer:

> What real business problem does this solve?

Use modern AI technologies only where they improve the system.

The final product should prioritize:

```text
Business Value
      +
Reliability
      +
Security
      +
Explainability
      +
Privacy
      +
Testing
      +
Maintainability
```

---

# 88. FINAL PROJECT STATEMENT

## LocalOps AI

**A Production-Grade Local-First Autonomous Business Operations Agent with Agentic RAG, Voice Interaction, Structured Data Intelligence, Human-in-the-Loop Automation, Security Controls, and Full-Stack Automated Testing.**

The project demonstrates modern AI engineering across:

* Artificial Intelligence.
* Large Language Models.
* Agentic Systems.
* Retrieval-Augmented Generation.
* Multi-Agent Orchestration.
* Voice AI.
* Backend Engineering.
* Frontend Engineering.
* Data Engineering.
* Security Engineering.
* DevOps.
* Software Testing.
* System Design.

The goal is not to create another chatbot.

The goal is to engineer a complete intelligent system that can solve meaningful business problems and operate reliably in the real world.

---
