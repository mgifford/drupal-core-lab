// Optional background audits with Google Lighthouse (installed from npm into tools/compare/.deps, not vendored).
// Lighthouse runs in its own headless Chrome, so it audits a page as it LOADS (logged in, using the session cookie of the
// one-time login). It does not see states reached by clicking, and it cannot run inside the viewer's frames.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { labRoot, envInfo, loginPathAsync } from './lib.mjs';

const DEPS = path.join(labRoot, 'tools/compare/.deps/node_modules');
const PW = path.join(labRoot, 'tools/playwright/node_modules/@playwright/test/index.mjs');
const lhUrl = () => pathToFileURL(path.join(DEPS, 'lighthouse/core/index.js')).href;

export function lighthouseAvailable() {
  const missing = [];
  if (!fs.existsSync(path.join(DEPS, 'lighthouse'))) missing.push('lighthouse (npm install --prefix tools/compare/.deps lighthouse)');
  if (!fs.existsSync(PW)) missing.push('Playwright\'s Chromium (cd tools/playwright && npm install && npx playwright install chromium)');
  return { ok: missing.length === 0, missing };
}

// Audit one page of one environment. Returns scores and the audits that did not pass.
// A real (Playwright) browser logs in by normal navigation, so its cookie jar is right by construction, and Lighthouse is then
// pointed at that same browser through its debugging port.
export async function audit({ env, host: hostArg, pagePath, performance = false, width = 480 }) {
  const host = hostArg || envInfo(env).host;   // the host the login uses: Drupal names its session cookie after the host
  const { chromium } = await import(pathToFileURL(PW).href);
  const lighthouse = (await import(lhUrl())).default;
  const port = 9400 + Math.floor(Math.random() * 400);
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lh-profile-'));
  const ctx = await chromium.launchPersistentContext(userDataDir, { headless: true, ignoreHTTPSErrors: true, viewport: { width, height: 900 }, args: [`--remote-debugging-port=${port}`, '--ignore-certificate-errors'] });
  try {
    const page = ctx.pages()[0] || await ctx.newPage();
    await page.goto(`https://${host}${await loginPathAsync(env)}`);                                   // one-time login link, real navigation
    const categories = ['accessibility', 'best-practices', ...(performance ? ['performance'] : [])];
    const run = await lighthouse(`https://${host}${pagePath}`, {
      port, output: 'json', logLevel: 'error', onlyCategories: categories, disableStorageReset: true,
      formFactor: 'mobile', screenEmulation: { mobile: true, width, height: 900, deviceScaleFactor: 2, disabled: false },
    });
    const lhr = run.lhr;
    const scores = Object.fromEntries(Object.entries(lhr.categories).map(([k, c]) => [k, Math.round((c.score ?? 0) * 100)]));
    const perfIds = new Set(((lhr.categories.performance || {}).auditRefs || []).map((r) => r.id));
    const failed = Object.values(lhr.audits).filter((a) => a.score !== null && a.score < 1 && !['informative', 'notApplicable', 'manual'].includes(a.scoreDisplayMode))
      .map((a) => ({ id: a.id, title: a.title, score: a.score, items: (a.details && a.details.items ? a.details.items.length : 0), perf: perfIds.has(a.id) }));
    return { env, url: `https://${host}${pagePath}`, lighthouseVersion: lhr.lighthouseVersion, scores, failed, runtimeError: lhr.runtimeError ? lhr.runtimeError.message : null };
  } finally { await ctx.close().catch(() => {}); fs.rmSync(userDataDir, { recursive: true, force: true }); }
}
