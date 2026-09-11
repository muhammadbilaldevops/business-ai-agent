# ADR 003-qdrant: Make neural retrieval optional

Status: accepted for the current baseline.

## Decision

Use embedded local Qdrant with cached BGE models, keeping SQLite text as the source of truth. Baseline BM25 avoids mandatory model downloads.

## Tradeoff

A separate vector service scales farther but adds deployment burden; automatic index-version migration remains future work.
