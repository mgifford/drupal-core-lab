// Browser-controlled CSS preferences for the two comparison frames only.
// Chromium isolates their origins into separate targets. Never emulate the viewer
// target or fall back to changing the whole page when isolation is unavailable.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { labRoot } from './lib.mjs';
import { FEATURES, defaults, observePreferences, mediaFeatures, applyFramePreferences } from './media-preferences.mjs';
const PW = path.join(labRoot, 'tools/playwright/node_modules/@playwright/test/index.mjs');
export const MODES = {
  normal: { forcedColors: null, colorScheme: null, contrast: null },
  'forced-light': { forcedColors: 'active', colorScheme: 'light', contrast: null },
  'forced-dark': { forcedColors: 'active', colorScheme: 'dark', contrast: null },
  contrast: { forcedColors: null, colorScheme: null, contrast: 'more' },
};
export const PROFILE = process.env.LAB_BROWSER_PROFILE || path.join(labRoot, '.lab-browser');
let ctx = null, page = null, mode = 'normal', allowedOrigins = [], lastError = '';
let preferences = defaults(), supported = {}, targets = new Map();
let pending = Promise.resolve();
const serial = action => { const task = pending.then(action); pending = task.catch(() => {}); return task; };
export const available = () => fs.existsSync(PW);
export const windowPage = () => page;
async function comparisonFrames() {
  if (!page || page.isClosed()) return [];
  return Promise.all(['fb', 'fa'].map(async id => {
    const element = await page.$(`#${id}`);
    try { return element ? await element.contentFrame() : null; }
    finally { await element?.dispose(); }
  }));
}
async function reconcile() {
  const frames = await comparisonFrames();
  const active = frames.filter(frame => frame && frame.parentFrame() === page?.mainFrame() && /^https?:/.test(frame.url()));
  for (const [frame, target] of targets) if (!active.includes(frame)) { targets.delete(frame); await target.detach().catch(() => {}); }
  for (const frame of active) {
    if (allowedOrigins.length && !allowedOrigins.includes(new URL(frame.url()).origin)) throw new Error('Comparison frame navigated outside its configured origin');
    if (!targets.has(frame)) {
      let target;
      try { target = await ctx.newCDPSession(frame); }
      catch { throw new Error('Frame preference emulation needs isolated comparison origins. Restart the lab browser with this update; the viewer will stay unchanged.'); }
      targets.set(frame, target);
    }
    try { await targets.get(frame).send('Emulation.setEmulatedMedia', { features: mediaFeatures(preferences) }); }
    catch (error) { targets.delete(frame); throw error; }
  }
  const observed = await Promise.all(active.map(frame => frame.evaluate(observePreferences, FEATURES)));
  supported = Object.fromEntries(Object.keys(FEATURES).map(key => [key, observed.length === 2 && observed.every(value => value[key].supported)]));
  lastError = '';
  return frames.map(frame => targets.get(frame)).filter(Boolean);
}
export async function open(url, initial = 'normal', origins = []) {
  if (!Object.hasOwn(MODES, initial)) throw new Error(`unknown mode: ${initial}`);
  if (!available()) throw new Error('Playwright is not installed: cd tools/playwright && npm install && npx playwright install chromium');
  if (page && !page.isClosed()) { await page.bringToFront(); if (initial !== 'normal') await setMode(initial); return; }
  allowedOrigins = origins.map(origin => new URL(origin).origin);
  const { chromium } = await import(pathToFileURL(PW).href);
  const headless = !!process.env.LAB_EMULATION_HEADLESS;
  const args = ['--window-size=1500,1000', '--site-per-process'];
  if (allowedOrigins.length) args.push(`--isolate-origins=${allowedOrigins.join(',')}`);
  ctx = await chromium.launchPersistentContext(PROFILE, { headless, viewport: headless ? { width: 1500, height: 1000 } : null, args,
    ignoreHTTPSErrors: true, handleSIGINT: false, handleSIGTERM: false, handleSIGHUP: false });
  page = ctx.pages()[0] || await ctx.newPage();
  preferences = { ...defaults(), ...MODES[initial] }; mode = initial;
  const refresh = () => serial(reconcile).catch(error => { lastError = error.message; });
  page.on('framenavigated', frame => serial(async () => {
    const previous = targets.get(frame); targets.delete(frame);
    if (previous) await previous.detach().catch(() => {});
    await reconcile();
  }).catch(error => { lastError = error.message; }));
  page.on('framedetached', refresh);
  page.on('close', () => { page = null; preferences = defaults(); mode = 'normal'; targets.clear(); const previous = ctx; ctx = null; previous?.close().catch(() => {}); });
  await page.goto(url);
  await refresh();
}
export function setMode(value) {
  if (!Object.hasOwn(MODES, value)) throw new Error(`unknown mode: ${value}`);
  return serial(async () => {
    if (!page || page.isClosed()) throw new Error('the emulation window is not open');
    const sessions = await reconcile();
    preferences = await applyFramePreferences(sessions, preferences, { ...defaults(), ...MODES[value] }, supported);
    mode = value;
  });
}
export function setPreferences(patch) {
  return serial(async () => {
    if (!page || page.isClosed()) throw new Error('the emulation window is not open');
    const sessions = await reconcile();
    preferences = await applyFramePreferences(sessions, preferences, patch, supported);
    mode = 'custom';
  });
}
export async function status() {
  const out = { available: available(), open: !!(page && !page.isClosed()), mode, preferences: { ...preferences }, supported: { ...supported }, error: lastError, frames: [] };
  if (!out.open) return out;
  for (const frame of await comparisonFrames()) {
    try { out.frames.push(frame ? { ...(await frame.evaluate(() => ({ forced: matchMedia('(forced-colors: active)').matches, dark: matchMedia('(prefers-color-scheme: dark)').matches, more: matchMedia('(prefers-contrast: more)').matches }))), media: await frame.evaluate(observePreferences, FEATURES) } : null); }
    catch { out.frames.push(null); }
  }
  return out;
}
export async function close() {
  const previous = ctx; ctx = null; page = null;
  if (previous) await previous.close().catch(() => {});
  targets.clear(); preferences = defaults(); supported = {}; mode = 'normal'; lastError = '';
}
