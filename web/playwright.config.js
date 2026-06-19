import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 5173);
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`;
const apiURL = process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

export default defineConfig({
  testDir: "./e2e/tests",
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: `cmd /c "set VITE_API_URL=${apiURL}&& npm run dev -- --host 127.0.0.1 --port ${port} --clearScreen false"`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
