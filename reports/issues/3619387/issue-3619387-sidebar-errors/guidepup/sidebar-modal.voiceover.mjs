// Guidepup before/after screen-reader analysis for the admin sidebar.
//
// Run this twice: once on the code BEFORE the patch, once AFTER.
// Diff the two log files to produce the before/after analysis.
//
// Requires macOS + VoiceOver with "VoiceOver Automation" enabled in
// System Settings > Privacy & Security > Accessibility (for the terminal/
// node process). Guidepup cannot run inside a Linux container.
//
//   npm i -D @guidepup/guidepup playwright
//   node guidepup/sidebar-modal.voiceover.mjs > before.txt
//   # apply patch, clear caches, then:
//   node guidepup/sidebar-modal.voiceover.mjs > after.txt
//   diff before.txt after.txt

import { chromium } from 'playwright';
import { voiceOver } from '@guidepup/guidepup';

const BASE = process.env.SITE_URL || 'https://drupal-core.ddev.site';
const out = [];
const record = async (label) => {
  const phrase = await voiceOver.lastSpokenPhrase;
  out.push(`[${label}] VO says: ${phrase}`);
};

const main = async () => {
  await voiceOver.start();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`${BASE}/node/add/article`, { waitUntil: 'networkidle' });

  // Start interacting with web content.
  await voiceOver.interact();

  // Produce a child error inside the sidebar/advanced group.
  await page.fill('input[name="title[0][value]"]', 'Test article');
  await page.fill('input[name="path[0][alias]"]', 'about'); // no leading slash
  await page.click('#edit-submit');
  await page.waitForSelector('text=The alias path has to start with a slash');
  await record('after-submit');

  // Open the sidebar via the toggle control.
  await page.click('a.meta-sidebar__trigger');
  await page.waitForTimeout(400);
  await record('sidebar-opened');

  // Move VoiceOver into the panel and read what is announced.
  await voiceOver.next();
  await record('vo-enters-panel');

  // Attempt to Tab past the end of the panel (should be trapped).
  await page.keyboard.press('Tab');
  await record('after-tab');

  // Close with Escape and confirm focus returns to the toggle.
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  await record('after-escape');

  await voiceOver.stop();
  await browser.close();

  console.log(out.join('\n'));
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
