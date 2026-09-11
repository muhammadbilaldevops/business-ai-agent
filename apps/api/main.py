from fastapi import FastAPI

from apps.api.routes import actions, analytics, chat, documents, health

app = FastAPI(title="LocalOps AI", version="0.1.0")
app.include_router(health.router)
app.include_router(chat.router)
app.include_router(documents.router)
app.include_router(analytics.router)
app.include_router(actions.router)
