FROM node:22-bookworm-slim AS web
WORKDIR /build/apps/web
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate
COPY apps/web/package.json apps/web/pnpm-lock.yaml apps/web/.npmrc ./
RUN pnpm install --frozen-lockfile
WORKDIR /build
COPY apps/web ./apps/web
COPY scripts/build-web.mjs scripts/build-runtime-compat.mjs ./scripts/
RUN node scripts/build-web.mjs

FROM python:3.12-slim-bookworm AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 LOCALOPS_DATA_DIR=/app/data/runtime
WORKDIR /app
COPY requirements.txt pyproject.toml ./
COPY src ./src
RUN pip install --no-cache-dir -r requirements.txt && pip install --no-deps --no-build-isolation -e .
COPY apps/api ./apps/api
COPY apps/__init__.py ./apps/__init__.py
COPY scripts ./scripts
COPY data/samples ./data/samples
COPY --from=web /build/dist ./dist
RUN useradd --uid 10001 --create-home appuser && mkdir -p /app/data/runtime && chown -R appuser:appuser /app/data
USER appuser
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=3)"
CMD ["uvicorn", "apps.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
