# Security model

## Intended boundary

One trusted operator runs this application on a local computer. Documents may contain untrusted instructions, and SQL inputs may be hostile. This is not a public multi-tenant service or a hardened sandbox for arbitrary files.

| Threat | Control | Remaining limit |
| --- | --- | --- |
| Instructions in retrieved documents | Separate untrusted evidence; no direct model-owned execution | Models can still produce misleading text; inspect citations |
| Unauthorized side effect | Persisted approval plus server-side tool schema; atomic execution | One operator/token; no role-based authorization |
| Duplicate approval or retry | One SQLite transaction, existing result returned on repeat | Single process graph lock; no distributed job system |
| File path traversal | Reject path separators/control characters; generated document IDs | Operator has normal access to its own data directory |
| SQL filesystem/extension access | AST table/function allowlist, external access disabled | Not an OS sandbox; queries also have memory and process deadlines |
| Large datasets | Byte, column, row, text, result, and deadline limits | Public hostile workloads need stricter ingress/concurrency quotas |
| Office ZIP expansion | Validate archive entry count/expanded byte total | Parser bugs still require timely dependency updates |
| Cross-origin requests | Same-origin request check, no permissive CORS | TLS/reverse proxy must preserve a trusted origin if deployed remotely |
| Data disclosure in logs | IDs/events only, standardized client errors | Database and checkpoint files contain business/conversation text |

Default Compose publishes only `127.0.0.1:8000`. The image runs as a non-root user with dropped capabilities. There is no shell-execution endpoint. No generated Python is evaluated. Reports are stored as data and downloaded as text.

Local BGE/Whisper/Kokoro files are loaded explicitly. Normal runtime does not automatically download them. Model bootstrap requires internet and should be completed before an offline session. The optional Ollama image tag and model weights need deliberate digest/revision pinning for strict supply-chain reproducibility.

## Before any public full-stack deployment

Provide authentication with actual user/workspace isolation, TLS, restrictive trusted-host/proxy configuration, managed secrets, quotas, parser/voice worker isolation, backups, retention controls, and operational monitoring. The static demo can be public because it has no shared business database or inference service.

## Tests and disclosure

See `tests/security/` for malicious filenames, archive expansion, tool arguments, origin/auth checks, SQL bypass attempts, and extractive network blocking. These tests demonstrate specific defenses, not a guarantee against all attacks. Report suspected vulnerabilities privately using GitHub's private vulnerability reporting if enabled; do not include business data or credentials in public issues.
