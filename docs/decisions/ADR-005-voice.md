# ADR 005-voice: Use short local audio clips

Status: accepted for the current baseline.

## Decision

Faster-Whisper transcribes clips; reviewed text goes to the same graph; Kokoro ONNX returns WAV. Models are configured explicitly.

## Tradeoff

Realtime streaming audio needs cancellation, queues, timing tests and hardware validation beyond this release.
