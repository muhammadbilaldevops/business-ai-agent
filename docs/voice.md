# Optional local models and voice

The default package does not download neural models. Use the native development setup when enabling these optional integrations; the default Docker image intentionally installs only the base dependency lock.

## Semantic retrieval

```bash
python -m pip install -e '.[semantic]'
python scripts/setup_models.py --semantic
```

Then configure these existing directories in `.env` and restart:

```dotenv
LOCALOPS_EMBEDDING_PATH=data/models/bge-small-en-v1.5
LOCALOPS_RERANKER_PATH=data/models/bge-reranker-base
```

Re-index existing documents through the Knowledge base. New uploads are indexed automatically. Qdrant runs in embedded local mode under the runtime data directory; no separate Qdrant service is needed. The embedding dimension is determined from the configured model. To change model families/dimensions, stop the app and rebuild the vector index from the retained document text. Keep a backup first.

## Local speech

```bash
python -m pip install -e '.[voice]'
```

Provide a compatible local Faster-Whisper model directory, Kokoro ONNX model file, and Kokoro voice bank. Obtain these through the upstream projects' documented bootstrap process, review their licenses, and record their revisions/checksums. Configure:

```dotenv
LOCALOPS_STT_PATH=data/models/whisper-base
LOCALOPS_TTS_MODEL=data/models/kokoro/kokoro-v1.0.onnx
LOCALOPS_TTS_VOICES=data/models/kokoro/voices-v1.0.bin
```

The backend uses CPU/int8 Whisper with VAD filtering and the `af_heart` Kokoro voice. The UI records a bounded clip, sends it to the local API, lets you review/edit the transcript, and passes the submitted text through the same graph as chat. Playback uses locally synthesized WAV audio. No browser cloud speech API is used.

These adapters are implemented but real-model STT/TTS accuracy, microphone handling across browsers, GPU support, and audio streaming were not verified in the coding environment. They return actionable unavailable/error responses when configuration or dependencies are missing. This release processes clips; it is not a realtime bidirectional audio streaming implementation.

Optional dependency sets are not fully locked alongside the base runtime because they require separate hardware/model validation. After selecting and testing them on your machine, capture that environment and model revisions before distributing it.
