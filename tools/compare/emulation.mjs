// A separate Chromium window, controlled by this server, in which the viewer can switch forced colours (and a few related browser settings)
// on and off for the whole tab, including both frames. A web page cannot change these settings for itself, so the browser has to be told from
// outside the page; Playwright's page.emulateMedia does that. This is EMULATION, not a real Windows contrast theme or Firefox's high-contrast colours.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { labRoot } from './lib.mjs';

const PW = path.join(labRoot, 'tools/playwright/node_modules/@playwright/test/index.mjs');
export const MODES = {
  normal: { forcedColors: null, colorScheme: null, contrast: null },
  'forced-light': { forcedColors: 'active', colorScheme: 'light', contrast: null },
  'forced-dark': { forcedColors: 'active', colorScheme: 'dark', contrast: null },
  contrast: { forcedColors: null, colorScheme: null, contrast: 'more' },
};
let browser = null, page = null, mode = 'normal';

export const available = () => fs.existsSync(PW);

export async function open(url) {
  if (!available()) throw new Error('Playwright is not installed: cd tools/playwright && npm install && npx playwright install chromium');
  if (page && !page.isClosed()) { await page.bringToFront(); return; }
  const { chromium } = await import(pathToFileURL(PW).href);
  browser = await chromium.launch({ headless: !!process.env.LAB_EMULATION_HEADLESS, args: ['--window-size=1500,1000'] });
  const ctx = await browser.newContext({ viewport: process.env.LAB_EMULATION_HEADLESS ? { width: 1500, height: 1000 } : null, ignoreHTTPSErrors: true });
  page = await ctx.newPage(); mode = 'normal';
  page.on('close', () => { page = null; mode = 'normal'; browser && browser.close().catch(() => {}); browser = null; });
  await page.goto(url);
}

export async function setMode(m) {
  if (!MODES[m]) throw new Error(`unknown mode: ${m}`);
  if (!page || page.isClosed()) throw new Error('the emulation window is not open');
  await page.emulateMedia(MODES[m]); mode = m;
}

// What each frame actually reports, so the viewer can show proof that the setting reached it.
export async function status() {
  const out = { available: available(), open: !!(page && !page.isClosed()), mode, frames: [] };
  if (!out.open) return out;
  for (const f of page.frames()) {
    if (f === page.mainFrame()) continue;
    try { out.frames.push(await f.evaluate(() => ({ forced: matchMedia('(forced-colors: active)').matches, dark: matchMedia('(prefers-color-scheme: dark)').matches, more: matchMedia('(prefers-contrast: more)').matches }))); }
    catch { out.frames.push(null); }
  }
  return out;
}

export async function close() { if (browser) await browser.close().catch(() => {}); browser = null; page = null; }
