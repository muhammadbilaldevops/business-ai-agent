# ADR 007-testing: Separate deterministic tests from model quality

Status: accepted for the current baseline.

## Decision

Use real local stores/queries, mock model transport contracts, explicit browser suites, and an independently recorded evaluation report.

## Tradeoff

Passing mocks cannot establish generative accuracy, microphone quality, large-scale latency or a full offline model deployment.
