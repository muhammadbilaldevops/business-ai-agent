# Deployment

## Local application

Docker Compose runs the static Next.js export and FastAPI in one non-root application container, with an optional Ollama service. SQLite and graph checkpoints persist in a named volume. Native setup serves the same export from `dist/`.

Do not expose the default single-operator API directly to the internet. Read the security document before designing a public full-stack deployment.

## Recruiter browser demo

The Sites build publishes only the static `dist/` output. It has no server-side business database, Python process, model weights, cloud LLM, or shared visitor files. Its deterministic demo adapter stores supported uploads and workflows in the visitor's browser. The label explicitly identifies it as a demo without an LLM.

Publishing source and packaging happen from the same Git commit. `.openai/hosting.json` records the project identity; it contains no secret values. The root build script builds the frontend and copies its export to `dist/`.

## Custom domain

No paid domain has been purchased or registered in this work. A name being suggested here does not establish that it is available. Register a chosen domain through a registrar you control, then configure it using the selected hosting provider's supported custom-domain process. Sites capabilities exposed in this session do not provide registrar purchase or custom-domain configuration.

A Sites-generated URL can be used immediately after successful deployment. If a public audience is not available under the account's policy, the delivery report must state that access is restricted.

## Reproducibility limits

Python base/development dependencies and frontend dependencies are version locked. Base Docker images use version-family tags; optional Ollama defaults to a mutable tag, configurable with `OLLAMA_IMAGE`. For stricter reproducibility, verify the desired image/model on your target hardware and pin digests and model revisions. No unverified digest is invented in this repository.
