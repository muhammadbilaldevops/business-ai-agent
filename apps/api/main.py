"""FastAPI composition root. Loopback deployment by default; optional bearer authentication."""

import json
import logging
import secrets
import time
from collections import deque
from contextlib import asynccontextmanager
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from apps.api.routes import actions, analytics, chat, documents, health, settings, voice
from localops.config import Settings
from localops.llm.ollama_client import ModelError
from localops.security.body_limit import BodyLimitMiddleware
from localops.services import Services

logger = logging.getLogger("localops")


def create_app(config: Settings | None = None):
    config = config or Settings()

    @asynccontextmanager
    async def lifespan(app):
        app.state.services = Services(config)
        yield
        app.state.services.close()

    app = FastAPI(title="Business AI Agent", version="0.2.0", lifespan=lifespan)
    app.add_middleware(BodyLimitMiddleware, maximum=config.max_upload_bytes + 65536)
    requests = deque()

    def error(request, code, message, status):
        return JSONResponse(
            {
                "error": {
                    "code": code,
                    "message": message,
                    "request_id": getattr(request.state, "request_id", ""),
                }
            },
            status_code=status,
        )

    @app.middleware("http")
    async def boundary(request: Request, call_next):
        request.state.request_id = str(uuid4())
        started = time.monotonic()
        path = request.url.path
        is_api = path.startswith("/api/") or path.startswith(
            (
                "/chat",
                "/documents",
                "/analytics",
                "/actions",
                "/approvals",
                "/tasks",
                "/reports",
                "/conversations",
                "/tools",
                "/voice",
                "/settings",
                "/activity",
                "/metrics",
                "/evaluations",
            )
        )
        if is_api and path != "/api/health" and request.method != "OPTIONS":
            origin = request.headers.get("origin")
            if origin and origin.rstrip("/") != str(request.base_url).rstrip("/") and origin.rstrip("/") not in config.allowed_origins:
                return error(
                    request, "ORIGIN_REJECTED", "This website is not an allowed workspace origin", 403
                )
            if config.api_key:
                supplied = request.headers.get("authorization", "").removeprefix("Bearer ")
                if not secrets.compare_digest(supplied, config.api_key):
                    return error(
                        request, "UNAUTHORIZED", "Enter your workspace access token in Settings", 401
                    )
            while requests and started - requests[0] > 60:
                requests.popleft()
            if len(requests) >= 120:
                return error(request, "RATE_LIMIT", "Workspace is busy. Retry in one minute.", 429)
            requests.append(started)
            content_length = request.headers.get("content-length", "0")
            if (
                not content_length.isdigit()
                or int(content_length) > config.max_upload_bytes + 65536
            ):
                return error(request, "UPLOAD_TOO_LARGE", "Request body is too large", 413)
        try:
            response = await call_next(request)
        except Exception as exc:
            logger.error(
                json.dumps(
                    {
                        "event": "request_error",
                        "request_id": request.state.request_id,
                        "type": type(exc).__name__,
                    }
                )
            )
            response = error(
                request, "INTERNAL_ERROR", "Request failed. Inspect the local service logs.", 500
            )
        response.headers["X-Request-ID"] = request.state.request_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "same-origin"
        if is_api:
            response.headers["Cache-Control"] = "no-store"
        logger.info(
            json.dumps(
                {
                    "event": "request",
                    "request_id": request.state.request_id,
                    "method": request.method,
                    "status": response.status_code,
                    "duration_ms": round((time.monotonic() - started) * 1000, 2),
                }
            )
        )
        return response

    @app.exception_handler(HTTPException)
    async def http_error(request, exc):
        return error(request, "HTTP_ERROR", str(exc.detail), exc.status_code)

    @app.exception_handler(RequestValidationError)
    @app.exception_handler(ValidationError)
    async def validation_error(request, exc):
        return error(
            request,
            "VALIDATION_ERROR",
            "Invalid request. Check required fields, lengths, and file formats.",
            422,
        )

    @app.exception_handler(ModelError)
    async def model_error(request, exc):
        return error(request, "MODEL_UNAVAILABLE", str(exc), 503)

    for route in (health, chat, documents, analytics, actions, voice, settings):
        app.include_router(route.router, prefix="/api")
        app.include_router(route.router, include_in_schema=False)
    web = Path(__file__).resolve().parents[2] / "dist"
    if web.is_dir() and (web / "index.html").exists():
        app.mount("/", StaticFiles(directory=web, html=True), name="web")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(config.allowed_origins),
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
        expose_headers=["X-Request-ID"],
    )
    return app


app = create_app()
