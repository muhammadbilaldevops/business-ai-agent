# LocalOps web workspace

Next.js + React + TypeScript frontend with Shadcn primitives and Recharts. `app/page.tsx` composes the workspace; `lib/api.ts` calls the local backend; `lib/demo.ts` is explicitly deterministic and browser-only. Uploaded demo files stay on the device.

Run `pnpm install --frozen-lockfile` here. Build the complete local app with `node scripts/build-web.mjs` from the repository root, then start FastAPI. The root `dist/` is also the Sites deployment artifact.

Use `pnpm exec tsc --noEmit` and `pnpm exec playwright test` for checks. Browser tests require a completed static build and the root Python environment. See the root README for supported versions and setup.

The bundled Sites/Vinext development scripts and component catalog are retained for supported preview environments. They are not the Python runtime and do not provide cloud inference.
