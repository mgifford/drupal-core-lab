import { defineConfig } from "@playwright/test";

/**
 * Screen readers are a single, shared, stateful resource, so everything runs
 * serially in one worker with generous timeouts. Guidepup ships its own
 * VoiceOver/NVDA drivers; do not enable Playwright's own browsers in parallel.
 */
export default defineConfig({
  testDir: ".",
  testMatch: /screenreader\.spec\.mjs/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 5 * 60 * 1000,
  reporter: [["list"]],
  use: {
    // Point at your local instance; override with SR_URL.
    baseURL: process.env.SR_URL || "https://drupal-core.ddev.site",
    headless: false,
  },
});
