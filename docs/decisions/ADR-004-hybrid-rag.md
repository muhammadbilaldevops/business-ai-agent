# ADR 004-hybrid-rag: Fuse lexical and dense evidence

Status: accepted for the current baseline.

## Decision

BM25 preserves exact business terms; reciprocal rank fusion combines independently ranked vectors. Optional cross-encoder reranking and context budgets precede generation.

## Tradeoff

A single vector score is insufficient for IDs and exact policy terms. Thresholds are heuristic and need corpus-specific evaluation.
