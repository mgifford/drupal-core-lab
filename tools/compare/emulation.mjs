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
// The lab browser keeps its own profile folder, so the viewer's remembered choices, step ticks and notes (localStorage) survive between launches.
// Delete it to start clean:  node scripts/lab-env.mjs browser --reset
export const PROFILE = process.env.LAB_BROWSER_PROFILE || path.join(labRoot, '.lab-browser');
let ctx = null, page = null, mode = 'normal';

export const available = () => fs.existsSync(PW);
export const windowPage = () => page;          // for tests

export async function open(url, initial = 'normal') {
  if (!available()) throw new Error('Playwright is not installed: cd tools/playwright && npm install && npx playwright install chromium');
  if (page && !page.isClosed()) { await page.bringToFront(); if (initial !== 'normal') await setMode(initial); return; }
  const { chromium } = await import(pathToFileURL(PW).href);
  const headless = !!process.env.LAB_EMULATION_HEADLESS;
  // Playwright's own SIGINT/SIGTERM handlers would swallow the signal and keep the server alive; serve.mjs closes the window and exits itself.
  ctx = await chromium.launchPersistentContext(PROFILE, { headless, viewport: headless ? { width: 1500, height: 1000 } : null, args: ['--window-size=1500,1000'],
    ignoreHTTPSErrors: true, handleSIGINT: false, handleSIGTERM: false, handleSIGHUP: false });
  page = ctx.pages()[0] || await ctx.newPage();
  await page.emulateMedia(MODES[initial]); mode = initial;
  page.on('close', () => { page = null; mode = 'normal'; ctx && ctx.close().catch(() => {}); ctx = null; });
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

export async function close() { if (ctx) await ctx.close().catch(() => {}); ctx = null; page = null; }
