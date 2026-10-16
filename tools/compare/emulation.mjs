// A separate Chromium window, controlled by this server, in which the viewer can switch forced colours (and a few related browser settings)
// on and off for the whole tab, including both frames. A web page cannot change these settings for itself, so the browser has to be told from
// outside the page; the Chromium DevTools protocol does that. This is EMULATION, not a real Windows contrast theme or Firefox's high-contrast colours.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { labRoot } from './lib.mjs';
import { FEATURES, defaults, observePreferences, applyPreferences } from './media-preferences.mjs';

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
let ctx = null, page = null, mode = 'normal', session = null;
let preferences = defaults(), supported = {};
let pending = Promise.resolve();
const serial = action => { const task = pending.then(action); pending = task.catch(() => {}); return task; };

export const available = () => fs.existsSync(PW);
export const windowPage = () => page;          // for tests

export async function open(url, initial = 'normal') {
  if (!Object.hasOwn(MODES, initial)) throw new Error(`unknown mode: ${initial}`);
  if (!available()) throw new Error('Playwright is not installed: cd tools/playwright && npm install && npx playwright install chromium');
  if (page && !page.isClosed()) { await page.bringToFront(); if (initial !== 'normal') await setMode(initial); return; }
  const { chromium } = await import(pathToFileURL(PW).href);
  const headless = !!process.env.LAB_EMULATION_HEADLESS;
  // Playwright's own SIGINT/SIGTERM handlers would swallow the signal and keep the server alive; serve.mjs closes the window and exits itself.
  ctx = await chromium.launchPersistentContext(PROFILE, { headless, viewport: headless ? { width: 1500, height: 1000 } : null, args: ['--window-size=1500,1000'],
    ignoreHTTPSErrors: true, handleSIGINT: false, handleSIGTERM: false, handleSIGHUP: false });
  page = ctx.pages()[0] || await ctx.newPage();
  session = await ctx.newCDPSession(page);
  const observed = await page.evaluate(observePreferences, FEATURES);
  supported = Object.fromEntries(Object.entries(observed).map(([key, value]) => [key, value.supported]));
  preferences = defaults();
  await setMode(initial);
  page.on('close', () => { page = null; session = null; preferences = defaults(); mode = 'normal'; ctx && ctx.close().catch(() => {}); ctx = null; });
  await page.goto(url);
}

export function setMode(m) {
  if (!Object.hasOwn(MODES, m)) throw new Error(`unknown mode: ${m}`);
  return serial(async () => {
    if (!page || page.isClosed()) throw new Error('the emulation window is not open');
    preferences = await applyPreferences(session, preferences, { ...defaults(), ...MODES[m] }, supported);
    mode = m;
  });
}

export function setPreferences(patch) {
  return serial(async () => {
    if (!page || page.isClosed()) throw new Error('the emulation window is not open');
    preferences = await applyPreferences(session, preferences, patch, supported);
    mode = 'custom';
  });
}

// What each frame actually reports, so the viewer can show proof that the setting reached it.
export async function status() {
  const out = { available: available(), open: !!(page && !page.isClosed()), mode, preferences: { ...preferences }, supported: { ...supported }, frames: [] };
  if (!out.open) return out;
  for (const f of page.frames()) {
    if (f === page.mainFrame()) continue;
    try { out.frames.push({ ...(await f.evaluate(() => ({ forced: matchMedia('(forced-colors: active)').matches, dark: matchMedia('(prefers-color-scheme: dark)').matches, more: matchMedia('(prefers-contrast: more)').matches }))), media: await f.evaluate(observePreferences, FEATURES) }); }
    catch { out.frames.push(null); }
  }
  return out;
}

export async function close() { if (ctx) await ctx.close().catch(() => {}); ctx = null; page = null; session = null; preferences = defaults(); supported = {}; mode = 'normal'; }
