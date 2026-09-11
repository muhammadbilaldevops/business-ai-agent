# ADR 002-langgraph: Use durable graph interrupts

Status: accepted for the current baseline.

## Decision

LangGraph stores serializable state in SQLite and resumes the exact run after approval. A deterministic supervisor makes the initial routes reproducible.

## Tradeoff

An LLM planner is more flexible but adds nondeterminism and requires a separate routing evaluation corpus.
