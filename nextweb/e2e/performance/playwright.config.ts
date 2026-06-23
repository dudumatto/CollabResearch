import { defineConfig, devices } from '@playwright/test'

const port = 4173

export default defineConfig({
  testDir: '.',
  testIgnore: ['unit/**'],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  outputDir: '../test-results/performance',
  reporter: [['list'], ['json', { outputFile: '../test-results/performance/results.json' }]],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  webServer: {
    command: `npm run build && npm run start -- --hostname 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
})