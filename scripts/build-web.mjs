import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
const web = fileURLToPath(new URL("../apps/web/", import.meta.url));
const prepare = spawnSync(process.execPath, ["scripts/prepare-document-assets.mjs"], {cwd:web,stdio:"inherit"});
if(prepare.status !== 0)process.exit(prepare.status || 1);
const result = spawnSync(
  process.execPath,
  [
    "--import",
    "../../scripts/build-runtime-compat.mjs",
    "node_modules/next/dist/bin/next",
    "build",
    "--webpack",
  ],
  {
    cwd: web,
    stdio: "inherit",
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  },
);
if (result.status !== 0) process.exit(result.status || 1);
const out = fileURLToPath(new URL("../dist/", import.meta.url));
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(web + "/out", out, { recursive: true });
