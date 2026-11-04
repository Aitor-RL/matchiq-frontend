import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: true, workers: 2,
  use: { baseURL: 'http://127.0.0.1:4176', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
  webServer: { command: 'node scripts/preview.mjs', url: 'http://127.0.0.1:4176/inicio', env: { MATCHIQ_PREVIEW_PORT: '4176', MATCHIQ_PREVIEW_API_URL: '' }, reuseExistingServer: false },
});
