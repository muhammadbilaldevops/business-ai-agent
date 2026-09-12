# 🚀 API service

FastAPI composition lives in `main.py`; dependency injection and authentication are in `dependencies.py`. Routes cover health, chat, documents, analytics, actions, settings, and voice. The service delegates domain behavior to `src/localops` and is designed for Render deployment through `render.yaml`.

```mermaid
flowchart LR
 HTTP[HTTP request] --> Auth[API key + CORS + limits]
 Auth --> Route[Route handler]
 Route --> Core[src/localops services]
 Core --> Reply[Typed response]
```
