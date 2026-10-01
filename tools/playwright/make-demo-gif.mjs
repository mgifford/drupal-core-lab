// Makes a short, low-resolution animated GIF that shows what the side-by-side viewer does, for the project page and the documentation.
//   node tools/playwright/make-demo-gif.mjs [slug] [--out=docs/images/viewer-demo.gif] [--width=900]
// It drives the real viewer with real input (Playwright), takes a screenshot after each step, adds a one-line caption, and joins them with gifenc.
// Needs: the viewer running on :8100 with the sites up (node scripts/lab-env.mjs start <slug>) and the 3604037 steps; for another issue, edit SCENES below.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { PNG } from 'pngjs';
import gifenc from 'gifenc';
const { GIFEncoder, quantize, applyPalette } = gifenc;

const argv = process.argv.slice(2);
const opt = (n, d) => { const a = argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const labRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const OUT = path.resolve(labRoot, opt('out', 'docs/images/viewer-demo.gif'));
const W = Number(opt('width', 900)), H = Math.round(W * 0.72);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, ignoreHTTPSErrors: true });
const page = await ctx.newPage();
await page.goto('http://localhost:8100/'); await page.waitForTimeout(3000);
await page.check('input[name="theme"][value="auto"]'); await page.check('input[name="width"][value="half"]');     // start from the defaults
// Keep only the bar and the two frames: hide the long header (steps) and everything below the frames.
await page.addStyleTag({ content: 'header, .opts details:not([data-sec="width"]):not([data-sec="colour"]), body > section, body > p, footer { display: none !important; } .pane iframe { height: calc(100vh - 275px) !important; } #legend { display: none !important; } .opts { grid-template-columns: 1fr 1fr !important; } .opts .secbody label { display: inline-flex !important; margin-right: 1rem !important; }' });
await page.evaluate(() => { document.getElementById('cap')?.remove(); const c = document.createElement('div'); c.id = 'cap'; c.setAttribute('aria-hidden', 'true');
  c.style.cssText = 'position:fixed;left:0;right:0;bottom:0;background:#111;color:#fff;font:600 17px system-ui;padding:9px 14px;z-index:99999'; document.body.append(c); });
const caption = (t) => page.evaluate((x) => { document.getElementById('cap').textContent = x; }, t);

const frames = [];
const snap = async (text, holdMs = 2200) => { await caption(text); await page.mouse.move(0, 0); await page.waitForTimeout(450); frames.push({ png: await page.screenshot(), delay: holdMs }); };
const fb = page.frameLocator('#fb'), fa = page.frameLocator('#fa');
const go = async (p) => { await page.fill('#goto', p); await page.click('#go'); await page.waitForTimeout(9000); };

await page.click('#login'); await page.waitForTimeout(8000);
await go('form_test/details-contains-required-fields');
await snap('Two Drupal sites side by side: core (Before) and core plus the change (After).', 3200);
await fb.locator('#edit-submit').first().click(); await page.waitForTimeout(2500);
await snap('Do a step once. It is repeated on the other side.');
const sum = fb.locator('details.details > summary').first(); await sum.click(); await page.waitForTimeout(1200);
for (const f of [fb, fa]) await f.locator('details.details').first().evaluate((e) => e.scrollIntoView({ block: 'center' })); await page.waitForTimeout(600);
await snap('Spot the difference: After marks the closed group that contains errors.', 3200);
await page.check('input[name="theme"][value="dark"]'); await page.waitForTimeout(2000);
await snap('Switch colour mode with one click: light, dark, or follow the OS.');
await page.check('input[name="theme"][value="light"]'); await page.check('input[name="width"][value="375px"]'); await page.waitForTimeout(2500);
await snap('Check mobile, tablet and desktop widths.');
await page.check('input[name="width"][value="half"]'); await page.waitForTimeout(1500);
await caption('Optional: live accessibility checks, forced colours, right to left, Lighthouse.'); await page.waitForTimeout(300);
frames.push({ png: await page.screenshot(), delay: 3000 });
await browser.close();

// ---- optional: keep the frames as PNGs for review (--keep=/some/dir) ----
if (opt('keep', '')) { fs.mkdirSync(opt('keep', ''), { recursive: true }); frames.forEach((f, i) => fs.writeFileSync(path.join(opt('keep', ''), `frame-${i + 1}.png`), f.png)); }

// ---- encode ----
const gif = GIFEncoder();
for (const f of frames) {
  const { width, height, data } = PNG.sync.read(f.png);
  const palette = quantize(data, 256, { format: 'rgb565' });
  gif.writeFrame(applyPalette(data, palette, 'rgb565'), width, height, { palette, delay: f.delay, repeat: 0 });
}
gif.finish();
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, gif.bytes());
console.log(`${path.relative(labRoot, OUT)}: ${frames.length} frames, ${W}x${H}, ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB`);
