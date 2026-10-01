/**
 * @file
 * Capture before/after screenshots of the #2847425 reproduction form.
 *
 * Run against your own instance (this cannot be pre-baked — the images have to
 * come from your running site):
 *
 *   npm install
 *   npx playwright install chromium
 *   SS_LABEL=before node capture.mjs     # on plain core
 *   SS_LABEL=after  node capture.mjs     # with MR !7305 applied
 *
 * Override the URL with SS_URL. Images land in ./screenshots/.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const URL = (process.env.SS_URL || "https://drupal-core.ddev.site") + "/file-managed-states-test";
const LABEL = process.env.SS_LABEL || "run";

mkdirSync("screenshots", { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 1400 } });
await page.goto(URL, { waitUntil: "networkidle" });

// Give the diagnostics panel a moment to run its checks and settle.
await page.waitForTimeout(1200);
await page.screenshot({ path: `screenshots/${LABEL}-01-default.png`, fullPage: true });

// Toggle every scenario, then capture again.
await page.selectOption('select[name="type"]', "audio").catch(() => {});
await page.check('input[name="toggle"]').catch(() => {});
await page.check('input[name="show_details"]').catch(() => {});
await page.waitForTimeout(600);
await page.screenshot({ path: `screenshots/${LABEL}-02-toggled.png`, fullPage: true });

// Capture just the diagnostics verdict panel.
const panel = page.locator("#state-diagnostics");
if (await panel.count()) {
  await panel.screenshot({ path: `screenshots/${LABEL}-03-diagnostics.png` });
}

await browser.close();
console.log(`Saved screenshots/${LABEL}-*.png`);
