// Accessibility and filter check for the static resource dashboard.
//   node tools/playwright/resource-dashboard.mjs [--json=<file>]
// Serves cloud/ locally, opens resources.html, and checks light, dark, forced-colours, reduced-motion and 320 px contexts
// with axe-core scoped to the page. It also exercises the native filters and the focusable table regions.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const labRoot = path.resolve(here, '../..');
const cloud = path.join(labRoot, 'cloud');
const jsonOut = process.argv.find((a) => a.startsWith('--json='))?.slice('--json='.length);
const MIME = { '.html': 'text/html', '.json': 'application/json', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.gif': 'image/gif', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  const rel = u.pathname === '/' ? 'index.html' : u.pathname.replace(/^\//, '');
  const file = path.join(cloud, rel);
  if (!file.startsWith(cloud) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  res.end(fs.readFileSync(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/resources.html`;
const browser = await chromium.launch();
const results = [];
for (const [name, width, options, setup] of [
  ['light-desktop', 1280, { colorScheme: 'light' }],
  ['dark-desktop', 1280, { colorScheme: 'dark' }],
  ['forced-colours', 1280, { colorScheme: 'light', forcedColors: 'active' }],
  ['reduced-motion', 1280, { reducedMotion: 'reduce' }],
  ['mobile-320', 320, { colorScheme: 'light' }],
  ['large-text-200', 1280, { colorScheme: 'light' }, (page) => page.addStyleTag({ content: 'html { font-size: 32px; }' })],
]) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, ...options });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message)));
  await page.goto(base, { waitUntil: 'load' });
  if (setup) await setup(page);
  await page.waitForSelector('#summary:not([hidden])', { timeout: 15000 });
  const geometry = await page.evaluate(() => ({
    status: document.getElementById('status').textContent,
    cards: document.querySelectorAll('#cards .card').length,
    tables: document.querySelectorAll('table').length,
    rows: document.querySelectorAll('#rows-table tbody tr').length,
    opportunities: document.querySelectorAll('.opportunity').length,
    tableRegions: [...document.querySelectorAll('.tablewrap')].every((w) => w.getAttribute('role') === 'region' && w.tabIndex === 0),
    documentScrollWidth: document.documentElement.scrollWidth, innerWidth,
    summary: document.getElementById('summary').textContent.slice(0, 120),
  }));
  // Native filters: choose one activity, then reset.
  const before = await page.locator('#rows-table tbody tr').count();
  await page.selectOption('#activity', 'code-exploration');
  await page.waitForFunction(() => document.getElementById('status').textContent.startsWith('Showing'));
  const filtered = await page.locator('#rows-table tbody tr').count();
  await page.locator('#filters button[type=reset]').click();
  await page.waitForTimeout(50);
  const reset = await page.locator('#rows-table tbody tr').count();
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
  results.push({ name, geometry, filter: { before, filtered, reset }, violations: axe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })), errors });
  await context.close();
}
await browser.close();
await new Promise((r) => server.close(r));
let failed = 0;
for (const r of results) {
  const bad = r.errors.length || r.violations.length || !r.geometry.tableRegions || r.geometry.cards < 5 || r.geometry.rows < 1 || r.filter.filtered >= r.filter.before || r.filter.reset !== r.filter.before || r.geometry.documentScrollWidth > r.geometry.innerWidth + 1;
  if (bad) failed++;
  console.log(`${bad ? 'FAIL' : 'ok  '}  ${r.name}: ${r.geometry.cards} cards, ${r.geometry.tables} tables, ${r.geometry.rows} rows, ${r.geometry.opportunities} opportunities; filter ${r.filter.before}->${r.filter.filtered}->${r.filter.reset}; axe ${r.violations.length}; page errors ${r.errors.length}`);
  if (r.geometry.documentScrollWidth > r.geometry.innerWidth + 1) console.log(`      REFLOW: ${r.geometry.documentScrollWidth}px at ${r.geometry.innerWidth}px`);
  for (const v of r.violations) console.log(`      axe ${v.id} (${v.impact}): ${v.nodes} node(s)`);
  for (const e of r.errors) console.log(`      page error: ${e}`);
}
if (jsonOut) { fs.mkdirSync(path.dirname(path.resolve(jsonOut)), { recursive: true }); fs.writeFileSync(path.resolve(jsonOut), JSON.stringify({ checked_at: new Date().toISOString(), results }, null, 2)); }
console.log(`\n${failed ? `${failed} context(s) FAILED` : `All ${results.length} contexts passed`}: static resource dashboard.`);
process.exit(failed ? 1 : 0);
