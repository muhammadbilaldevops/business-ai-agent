.PHONY: setup build run test lint evaluate seed docker
setup:
	python -m pip install -r requirements-dev.txt
	python -m pip install --no-deps -e .
	cd apps/web && corepack pnpm install --frozen-lockfile
build:
	node scripts/build-web.mjs
run:
	uvicorn apps.api.main:app --host 127.0.0.1 --port 8000
lint:
	ruff check src apps/api tests scripts
	ruff format --check src apps/api tests scripts
	mypy
	cd apps/web && pnpm exec tsc --noEmit
	cd apps/web && pnpm exec eslint app/page.tsx lib/api.ts lib/demo.ts lib/localops-types.ts components/analysis-result.tsx components/voice-panel.tsx

test:
	pytest -q
evaluate:
	python scripts/run_evaluation.py
seed:
	python scripts/seed_demo.py
docker:
	docker compose up --build
