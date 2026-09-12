# Future Improvement Roadmap

This is the implementation roadmap for evolving Business AI Agent from a document chatbot into a trusted business-work assistant. Build the phases in order so that trust, evidence, and feedback exist before adding more powerful automation.

## Guiding product rules

- Every workspace fact must be grounded in uploaded evidence and linked to its source.
- The agent must distinguish a fact, an inference, a recommendation, and missing information.
- Important external actions require explicit human approval.
- Feedback improves prompts, retrieval, and evaluation tests; never automatically train on one user's rating.
- Keep all integrations least-privileged and auditable.

## Phase 0 — Feedback, answer confidence, and citations

### Goal

Make answers transparent, trustworthy, and continuously improvable.

### Feedback buttons

Add **thumbs up** and **thumbs down** to every assistant message.

**Thumbs up flow**

- Open a compact popup: “What worked well?”
- Offer: `Accurate`, `Clear`, `Detailed enough`, `Good sources`, and `Fast`.
- Include an optional “Tell us more” comment field.

**Thumbs down flow**

- Open a popup: “What should improve?”
- Offer: `Incorrect`, `Too general`, `Missing details`, `Wrong source`, `Bad tone`, and `Did not understand my question`.
- Include optional corrected-answer/comment input.
- After either rating, show: “Thanks — your feedback helps improve the agent. 🙌”
- Do not interrupt the ongoing chat.

**Store with every feedback item**

- User question and assistant answer
- Conversation and workspace IDs
- File IDs and citations used
- Rating, selected category, optional comment, and timestamp
- App/model/version that produced the answer

**Feedback dashboard for workspace owners**

- Helpful versus unhelpful answer totals
- Common issue categories, documents, users, and dates
- Exact question, answer, citations, and comment for each item
- Review statuses: `Reviewed`, `Fixed`, `Needs document update`, and `Needs prompt/retrieval improvement`

**Safe improvement loop**

1. Group recurring down-vote patterns.
2. Determine whether the cause is retrieval, citations, prompting, or missing source content.
3. Turn the case into an evaluation/test example.
4. Improve the relevant logic.
5. Run the evaluation set before release.

### Answer confidence

Display a confidence label beside every answer:

| Level | Meaning |
| --- | --- |
| High | The answer is directly supported by strong source evidence. |
| Medium | Related evidence exists, but some interpretation was required. |
| Low | Evidence is weak, incomplete, or conflicting. |
| No source found | The agent could not verify the answer. |

Initial scoring should use retrieval score, number of supporting citations, source agreement, exact question-term matches, and document freshness. Never call an answer high-confidence simply because it sounds convincing.

### Better citations

Replace plain citation labels with evidence cards containing:

- File name
- PDF page number where available
- Section heading where available
- Short supporting quote
- Internal relevance score
- **Open source** and **Show surrounding text** actions

Example:

> **Muhammad_Bilal_DevOps_Resume_CV.pdf — Page 2, Skills**  
> “Python, Node.js, React.js, PostgreSQL, REST APIs”

**Acceptance checks:** factual file-based answers include at least one citation; the supporting passage opens in one click; and users can report a bad citation with thumbs down.

## Phase 1 — Saved workspaces and chat history

### Goal

Organize real work instead of mixing every document and conversation together.

### Workspaces

Create separate workspaces such as `My Career`, `Client: ABC Store`, `HR Documents`, `Sales Reports`, `Operations Manuals`, and `Legal Contracts`. Each workspace owns its documents, datasets, conversations, feedback, reports/tasks, settings, future members, and retention rules.

### Workspace UI

Add a sidebar workspace switcher with create, rename, description, icon/color, archive, delete-with-confirmation, document count, and last-activity date.

### Conversation history

Save every conversation under its workspace with an editable title generated from the first question, dates, message count, linked files, export/delete controls, and full-text search.

Suggested sidebar layout:

```text
Workspace: My Career
  Today
    DevOps resume skills
    Interview preparation
  This week
    Compare two resumes
  Older
    Certification summary
```

Search titles, questions, answers, filenames, and tags (for example `Kubernetes`, `interview`, `salary`, `March sales`, or `Client ABC`).

### Data model

```text
workspaces(id, name, description, owner_id, created_at, archived_at)
conversations(id, workspace_id, title, created_at, updated_at)
messages(id, conversation_id, role, content, metadata, created_at)
```

Documents, reports, tasks, feedback, and citations must also reference `workspace_id`.

**Acceptance checks:** a new workspace starts empty; Workspace A cannot surface Workspace B's files; a user can return later and continue a saved conversation.

## Phase 2 — Decision briefs, exports, and templates

### Goal

Turn answers into useful business outputs.

### Decision briefs

After an answer, offer **Summarize for a manager**, **List risks**, **Recommend next steps**, **Create action plan**, **Draft email**, **Create meeting agenda**, and **Turn into report**.

Each brief should contain:

1. Situation
2. Key findings
3. Evidence/source links
4. Risks and unknowns
5. Recommended next action
6. Owner and due date when relevant

Example:

```text
Decision: Restock Product A
Why: Stock is below reorder level and sales are increasing.
Risk: Stockout within the next two weeks.
Recommended action: Request a supplier quote today; approve the purchase order by Friday.
```

### Exports

Support PDF, Word, Markdown, CSV for analytics, clipboard copy, and shareable read-only links. Include title, date, workspace, answer, citations, confidence, and optional company logo.

### Templates

Provide structured templates for resume review, interview preparation, contract review, invoice review, sales summary, customer complaint summary, meeting notes, and proposal review. Templates should enforce useful output sections rather than return an unstructured long answer.

**Acceptance checks:** users can produce a manager-ready cited PDF from an answer in under one minute; exported facts retain citations.

## Phase 3 — Semantic search and document comparison

### Goal

Find meaning beyond exact keywords and compare business documents reliably.

### Semantic search

Example: “What cloud experience does Bilal have?” should find “AWS, Azure, Docker, and Kubernetes” even if the phrase “cloud experience” is absent.

Implementation sequence:

1. Extract text from uploads.
2. Split into meaningful chunks: PDF page/section, resume section, table row group, or heading with related paragraphs.
3. Generate embeddings for chunks.
4. Store them in a vector database.
5. Embed the user's question and retrieve relevant chunks.
6. Re-rank using keyword matches, page/section relevance, and recency.
7. Generate only from selected chunks.
8. Cite every selected chunk.

Show upload progress: `Reading document`, `Extracting text`, `Detecting headings`, `Building search index`, and `Ready`. For poor scanned PDFs, gently explain that clearer source material improves results.

### Document comparison

Allow users to select multiple documents and choose a comparison type: resumes, contracts, proposals, policies, invoices, or monthly reports.

| Area | Document A | Document B | Difference |
| --- | --- | --- | --- |
| Python | Listed | Listed | Same |
| Kubernetes | Listed | Not listed | Only in A |
| Availability | Immediate | 30 days | Different |
| Salary | Not stated | Not stated | Unknown |

Clearly label found differences, missing information, inference, and recommendation. Never invent differences.

**Acceptance checks:** paraphrased questions return correct cited answers; comparisons do not invent facts for absent data.

## Phase 4 — Team sharing, roles, reminders, and integrations

### Goal

Support real teams while preserving data control and human oversight.

### Roles and sharing

| Role | Permissions |
| --- | --- |
| Owner | Full control, billing, and workspace deletion |
| Admin | Manage users, files, templates, and settings |
| Editor | Upload files, chat, create reports/tasks |
| Viewer | Read chats, files, and reports only |

Share at workspace level. Support email invitations, member removal, role changes, activity views, and optional download restrictions.

### Reminders

Extract possible follow-ups such as contract renewals, invoice due dates, certification expiry, interviews, client follow-ups, low stock, and weekly sales reports. Always require approval before saving a reminder:

> “I found that this invoice is due on 20 September. Would you like a reminder three days before? ⏰”

### Integrations

Recommended rollout order:

1. Google Drive / Dropbox for importing files
2. Google Calendar / Outlook for approved reminders
3. Gmail / Outlook for approved email drafts
4. Slack / Microsoft Teams for approved summaries
5. Todoist / Trello / Asana for approved tasks
6. HubSpot or Salesforce for customer workflows

Use least-privilege access, clearly preview shared data/actions, and require approval before sending, creating, or changing anything externally.

### Audit log

Record file uploads/deletions, generated answers, opened citations, feedback, exports, reminders, membership changes, and every proposed/approved/completed integration action.

**Acceptance checks:** Viewers cannot upload or delete; external actions cannot run without approval; owners can see who did what and when.

## Security and governance requirements

Uploaded documents can contain malicious instructions. Treat them as untrusted data, not agent instructions. Defend against prompt injection, sensitive-data exposure, and excessive tool permissions. Use audit logs, source provenance, human approval, role-based access, and documented incident handling. These controls align with the [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/) and the [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework).

## Recommended delivery order

1. Feedback buttons, confidence labels, better citations
2. Saved workspaces and searchable chat history
3. Decision briefs, exports, and templates
4. Semantic search and document comparison
5. Team sharing, roles, reminders, and integrations
