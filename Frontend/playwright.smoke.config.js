import { defineConfig, devices } from '@playwright/test';

/** UI-only e2e (frontend only — no MongoDB required). */
export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: 'landing-to-login.spec.js',
  outputDir: 'test-results',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:3000',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
