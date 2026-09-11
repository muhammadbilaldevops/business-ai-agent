# ADR 006-human-approval: Commit approval and side effects atomically

Status: accepted for the current baseline.

## Decision

The stored payload is validated again inside a SQLite transaction. Repeated decisions return the existing result. No document or LLM output can authorize a tool.

## Tradeoff

A status-only approval table would allow approved-but-unexecuted or duplicated actions; the foundation is replaced with real transactional execution.
