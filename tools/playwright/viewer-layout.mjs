// Standalone viewer regression: no DDEV, Drupal, or external HTTP requests.
// node tools/playwright/viewer-layout.mjs [--chromium=/path/to/chrome]
// Uses the real viewer and its controls, with identical local frame fixtures.
import fs from 'node:fs';
import http from 'node:http';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { PNG } from 'pngjs';

const viewerPath = process.argv.find(a => a.startsWith('--viewer='))?.slice('--viewer='.length);
const html = fs.readFileSync(viewerPath || new URL('../compare/index.html', import.meta.url), 'utf8');
const executablePath = process.argv.find(a => a.startsWith('--chromium='))?.slice('--chromium='.length);
const fixture = '<!doctype html><html><head><style>html,body{margin:0;background:white}#sample{width:100px;height:100px;background:rgb(180,40,80)}</style></head><body><div id="sample"></div></body></html>';
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/') { res.setHeader('content-type', 'text/html'); res.end(html); return; }
  if (/^\/(before|after)\//.test(url.pathname)) { res.setHeader('content-type', 'text/html'); res.end(fixture); return; }
  res.setHeader('content-type', 'application/json');
  if (url.pathname === '/variants.json') {
    const origin = `http://127.0.0.1:${server.address().port}`;
    res.end(JSON.stringify({ origins: { before: origin + '/before', after: origin + '/after' }, state: { slug: 'layout', theme: 'auto', darkos: false }, variants: [{ slug: 'layout', label: 'Layout fixture', description: 'Identical pages', pages: ['/sample'], demo: { start: '/sample' }, steps: [], checks: [], observe: [] }] }));
  }
  else if (url.pathname === '/api/health') res.end(JSON.stringify({ before: { ok: true }, after: { ok: true } }));
  else res.end('{}');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
let combinations = 0;
try {
  browser = await chromium.launch(executablePath ? { executablePath } : {});
  for (const viewport of [{ width: 1500, height: 1000 }, { width: 760, height: 900 }]) {
    const page = await browser.newPage({ viewport });
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.waitForFunction(() => document.querySelector('#fa').src.includes('/sample'));
    await page.frameLocator('#fa').locator('#sample').waitFor();
    for (const colors of [{ colorScheme: 'light', forcedColors: 'none' }, { colorScheme: 'dark', forcedColors: 'none' }, { colorScheme: 'light', forcedColors: 'active' }]) {
      await page.emulateMedia(colors);
      for (const width of ['375px', '768px', 'half']) {
        await page.locator(`input[name=width][value="${width}"]`).check();
        for (const mode of ['onion', 'diff', 'side', 'diff', 'onion']) {
          await page.locator(`input[name=view][value="${mode}"]`).check();
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
          const geometry = await page.evaluate(() => ['fb', 'fa'].map(id => {
            const f = document.getElementById(id), p = f.parentElement, b = f.getBoundingClientRect(), s = getComputedStyle(p);
            return { x: b.x, y: b.y, width: b.width, height: b.height, availableWidth: p.clientWidth, availableHeight: p.clientHeight, heading: p.querySelector('h2').getBoundingClientRect().height, background: s.backgroundColor, viewportWidth: f.contentWindow.innerWidth };
          }));
          for (const g of geometry) {
            const expectedWidth = width === 'half' ? g.availableWidth : Number.parseInt(width, 10);
            assert(Math.abs(g.width - expectedWidth) < 2, `${mode}/${width}: width ${g.width}, expected ${expectedWidth}`);
            assert(Math.abs(g.viewportWidth - expectedWidth) < 2, `${mode}/${width}: embedded viewport differs`);
            if (mode !== 'side') {
              assert(Math.abs(g.height - g.availableHeight) < 2, `${mode}/${width}: unused vertical space (${g.height}/${g.availableHeight})`);
              assert.equal(g.heading, 0);
              assert(/rgba\([^)]*,\s*0\)$/.test(g.background), `Overlay wrapper is opaque: ${g.background}`);
            }
          }
          if (mode !== 'side') {
            assert(Math.abs(geometry[0].x - geometry[1].x) < 1 && Math.abs(geometry[0].y - geometry[1].y) < 1, 'Frames are misaligned');
            assert.equal(await page.locator('#syncscroll').isDisabled(), true);
            if (mode === 'diff' && colors.forcedColors === 'none') {
              const box = await page.frameLocator('#fa').locator('#sample').boundingBox();
              const image = PNG.sync.read(await page.screenshot({ clip: { x: box.x + 20, y: box.y + 20, width: 1, height: 1 } }));
              assert(image.data[0] < 5 && image.data[1] < 5 && image.data[2] < 5, `Identical pixels must be black, got ${[...image.data]}`);
            }
          }
          else assert.equal(await page.locator('#syncscroll').isDisabled(), false);
          combinations++;
        }
      }
    }
    await page.close();
  }
  console.log(`PASS: ${combinations} layout combinations; fixed device widths, full desktop width/overlay height, frame alignment, difference pixels, and scroll controls. Chromium ${browser.version()}.`);
}
finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
