// Diagnostic: how long until BOTH frames of the compare viewer finish loading, over N reloads.
//   node tools/playwright/frameload.mjs [viewerUrl] [N] [--login]     (default https://drupal-compare.ddev.site/, 25)
// --login first presses "Log in both as admin", so the frames load the heavy logged-in form page.
// Use when frames sometimes fail to load. Reports each frame's load time and any that exceed 5 s or never load.
import { chromium } from '@playwright/test';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const url = args[0] || 'https://drupal-compare.ddev.site/';
const N = Number(args[1] || 25);
const LOGIN = process.argv.includes('--login');
const browser = await chromium.launch();
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
await page.addInitScript(() => {
  window.__loads = {}; window.__t0 = performance.now();
  addEventListener('message', (e) => { const m = e.data; if (m && m.compare && m.type === 'loaded') window.__loads[m.side] = Math.round(performance.now() - window.__t0); });
});
const rows = [];
if (LOGIN) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__loads.before !== undefined, null, { timeout: 60000 }).catch(() => {});
  await page.locator('#login').click();
  await page.waitForTimeout(8000);
  console.log('logged in; frames now load /node/add/article');
}
for (let i = 1; i <= N; i++) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  let res = 'timeout';
  try { await page.waitForFunction(() => window.__loads.before !== undefined && window.__loads.after !== undefined, null, { timeout: 60000 }); res = 'ok'; } catch { /* keep timeout */ }
  const l = await page.evaluate(() => window.__loads);
  rows.push({ i, res, before: l.before ?? null, after: l.after ?? null });
  process.stdout.write(`${i}:${res === 'ok' ? Math.max(l.before, l.after) + 'ms' : 'TIMEOUT(' + JSON.stringify(l) + ')'} `);
}
await browser.close();
const ok = rows.filter((r) => r.res === 'ok'); const worst = ok.map((r) => Math.max(r.before, r.after)).sort((a, b) => a - b);
console.log(`\n\n${ok.length}/${N} reloads had both frames loaded. Median ${worst[Math.floor(worst.length / 2)]} ms, worst ${worst[worst.length - 1]} ms. Over 5 s: ${worst.filter((x) => x > 5000).length}. Never loaded: ${N - ok.length}.`);
