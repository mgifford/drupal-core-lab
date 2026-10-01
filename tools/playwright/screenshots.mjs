// Regenerate the viewer screenshots used in the README and docs/USER-GUIDE.md. Drives the viewer with real input.
//   node tools/playwright/screenshots.mjs [viewerUrl]     (default https://drupal-compare.ddev.site/)
// Needs the viewer running (node tools/compare/serve.mjs --ddev) and both sites up. Writes docs/images/*.png.
// Optional: pass --lighthouse to also capture the Lighthouse panel (needs Lighthouse installed; takes about a minute longer).
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { labRoot } from '../compare/lib.mjs';

const url = process.argv.slice(2).find((a) => !a.startsWith('--')) || 'https://drupal-compare.ddev.site/';
const LH = process.argv.includes('--lighthouse');
const out = path.join(labRoot, 'docs/images'); fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.addInitScript(() => { window.__loaded = {}; addEventListener('message', (e) => { const m = e.data; if (m && m.compare && m.type === 'loaded') window.__loaded[m.side] = Date.now(); }); });
const bothLoaded = (since) => page.waitForFunction((t) => window.__loaded.before > t && window.__loaded.after > t, since, { timeout: 60000 });
const shot = async (locator, name) => { await locator.scrollIntoViewIfNeeded(); await locator.screenshot({ path: path.join(out, name) }); console.log('saved', name); };

await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__loaded.before && window.__loaded.after, null, { timeout: 60000 });
await page.locator('#login').click(); await page.waitForTimeout(9000);
let t = Date.now(); await page.locator('#go').click(); await bothLoaded(t);
const fb = page.frameLocator('#fb'), fa = page.frameLocator('#fa');

// steps 6 to 9, done once in the After frame; Mirror repeats them in Before
await fa.locator('.meta-sidebar__trigger').click(); await page.waitForTimeout(1500);
await fa.locator('#edit-path-0 > summary').click(); await page.waitForTimeout(1000);
await fa.locator('[name="path[0][alias]"]').fill('no-slash'); await page.waitForTimeout(800);
await fa.locator('.meta-sidebar__trigger').click(); await page.waitForTimeout(1500);
t = Date.now(); await fa.locator('#edit-submit').click(); await bothLoaded(t); await page.waitForTimeout(1500);
// step 10: Mirror off, a real click in each frame
await page.locator('#mirror').uncheck();
await fa.locator('a[href$="#edit-path-0-alias"]').first().click(); await fb.locator('a[href$="#edit-path-0-alias"]').first().click();
await page.waitForTimeout(2500);
await page.locator('#tickrecipe').click();
for (let i = 3; i < 9; i++) await page.locator('#steps input[type=checkbox]').nth(i).check();
await page.locator('#runchecks').click(); await page.waitForTimeout(3500);
for (const [i, a] of [['0', 'yes'], ['1', 'yes'], ['2', 'yes'], ['3', 'no']]) { await page.locator(`input[name="obs-${i}-before"][value="no"]`).check(); await page.locator(`input[name="obs-${i}-after"][value="${a}"]`).check(); }

await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300);
await page.screenshot({ path: path.join(out, 'viewer-overview.png') }); console.log('saved viewer-overview.png');
await shot(page.locator('#panes'), 'viewer-frames.png');
await shot(page.locator('section[aria-labelledby="chkh"]'), 'viewer-checks.png');
await shot(page.locator('section[aria-labelledby="obsh"]'), 'viewer-manual.png');
await shot(page.locator('section[aria-labelledby="envh"]'), 'viewer-environment.png');

// Difference view: Before closed sidebar versus After open sidebar lights up
await page.locator('input[name="view"][value="diff"]').check(); await page.waitForTimeout(1500);
await page.locator('#panes').scrollIntoViewIfNeeded(); await page.waitForTimeout(2500);
const box = await page.locator('#fa').boundingBox();   // one frame wide: the overlay is half the page
await page.screenshot({ path: path.join(out, 'viewer-difference.png'), clip: box }); console.log('saved viewer-difference.png');
await page.locator('input[name="view"][value="side"]').check();

// Live accessibility alert: add two defects to the After frame only
const after = page.frames().find((f) => /compare-after/.test(f.url()));
await after.evaluate(() => { const i = document.createElement('img'); i.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACw='; i.width = 20; i.height = 20; const x = document.createElement('input'); x.type = 'text'; document.body.append(i, x); });
await page.waitForTimeout(6000);
await shot(page.locator('section.axe'), 'viewer-axe-alert.png');
if (LH) {
  await page.locator('#lhon').check();
  await page.waitForFunction(() => { const v = document.getElementById('lhverdict'); return v && !v.hidden && !/Running/.test(v.textContent); }, null, { timeout: 120000 }).catch(() => {});
  await shot(page.locator('section[aria-labelledby="lhh"]'), 'viewer-lighthouse.png');
}
await browser.close();
