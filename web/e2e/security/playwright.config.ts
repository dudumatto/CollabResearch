import { defineConfig, devices } from "@playwright/test";

const apiURL =
  process.env.E2E_API_URL ??
  process.env.VITE_API_URL ??
  "http://127.0.0.1:8081";

export default defineConfig({
  testDir: ".",
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  retries: 0,
  fullyParallel: false,
  reporter: [
    ["list"],
    ["json", { outputFile: "../test-results/security/results.json" }],
    ["html", { outputFolder: "../playwright-report-security", open: "never" }],
  ],
  use: {
    baseURL: apiURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
