"""Bound total streamed request bytes even when Content-Length is absent."""

from starlette.responses import JSONResponse


class BodyLimitMiddleware:
    def __init__(self, app, maximum: int):
        self.app, self.maximum = app, maximum

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        total = 0

        class TooLarge(Exception):
            pass

        async def bounded():
            nonlocal total
            message = await receive()
            if message["type"] == "http.request":
                total += len(message.get("body", b""))
                if total > self.maximum:
                    raise TooLarge()
            return message

        try:
            await self.app(scope, bounded, send)
        except TooLarge:
            await JSONResponse(
                {
                    "error": {
                        "code": "UPLOAD_TOO_LARGE",
                        "message": "Request body is too large",
                        "request_id": scope.get("state", {}).get("request_id", ""),
                    }
                },
                status_code=413,
            )(scope, receive, send)
