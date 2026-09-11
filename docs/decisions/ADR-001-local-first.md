# ADR 001-local-first: Keep inference and business data local

Status: accepted for the current baseline.

## Decision

A browser demo lowers reviewer setup friction, while a local FastAPI application owns real uploads and model inference. No cloud model is introduced to make the public demo appear intelligent.

## Tradeoff

Cloud-only hosting would make onboarding simpler but contradict the privacy and offline requirements.
