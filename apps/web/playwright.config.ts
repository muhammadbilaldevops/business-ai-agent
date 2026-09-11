import { defineConfig } from "@playwright/test";
import path from "node:path";
const root = path.resolve(process.cwd(), "../..");
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:8000",
    browserName: "chromium",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    viewport: { width: 1440, height: 1000 },
  },
  reporter: [["list"], ["html", { open: "never" }]],
  webServer: {
    command: ".venv/bin/uvicorn apps.api.main:app --host 127.0.0.1 --port 8000",
    cwd: root,
    url: "http://127.0.0.1:8000/api/health",
    reuseExistingServer: !process.env.CI,
    env: {
      LOCALOPS_MODE: "extractive",
      LOCALOPS_DATA_DIR: path.join(root, ".pytest-tmp/e2e"),
      LOCALOPS_API_KEY: "",
    },
    timeout: 30000,
  },
});
