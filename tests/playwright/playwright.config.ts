/**
 * Playwright config for Guidepup virtual screen reader tests.
 *
 * This config is separate from the core Playwright test suite so that
 * virtual SR tests don't ship with Drupal core updates.
 *
 * Run locally:
 *   cd tests/playwright && npx playwright test
 *
 * Or from repo root:
 *   yarn test:guidepup
 */
import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

const baseURL = process.env.DRUPAL_BASE_URL ?? 'https://drupal-core.ddev.site';

export default defineConfig({
  testDir: './tests',
  outputDir: './reports/test-results',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  // Log in as admin once and save session cookies for admin page tests.
  globalSetup: path.resolve(__dirname, './lib/auth-setup.ts'),
  reporter: [
    ['list'],
    ['json', { outputFile: './reports/playwright-results.json' }],
  ],
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
    timeout: 120000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
