// Accessibility check for the static CLEER page. Serves cloud/ locally and checks light, dark, forced-colours light and
// dark, reduced-motion, 320 px and 200% text contexts with axe-core, plus static structure and the absence of any
// off-origin request.
//   node tools/playwright/cleer-page.mjs [--json=<file>]
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
  const rel = u.pathname === '/' ? 'cleer.html' : u.pathname.replace(/^\//, '');
  const file = path.join(cloud, rel);
  if (!file.startsWith(cloud) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  res.end(fs.readFileSync(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;
const base = `${origin}/cleer.html`;
const browser = await chromium.launch();
const results = [];
for (const [name, width, options, setup] of [
  ['light-desktop', 1280, { colorScheme: 'light' }],
  ['dark-desktop', 1280, { colorScheme: 'dark' }],
  ['forced-colours-light', 1280, { colorScheme: 'light', forcedColors: 'active' }],
  ['forced-colours-dark', 1280, { colorScheme: 'dark', forcedColors: 'active' }],
  ['reduced-motion', 1280, { reducedMotion: 'reduce' }],
  ['mobile-320', 320, { colorScheme: 'light' }],
  ['large-text-200', 1280, { colorScheme: 'light' }, (page) => page.addStyleTag({ content: 'html { font-size: 32px; }' })],
]) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, ...options });
  const page = await context.newPage();
  const errors = [], offOrigin = [];
  page.on('pageerror', (e) => errors.push(String(e.message)));
  page.on('request', (r) => { const u = r.url(); if (!u.startsWith(origin) && !u.startsWith('data:') && !u.startsWith('blob:')) offOrigin.push(u); });
  await page.goto(base, { waitUntil: 'load' });
  if (setup) await setup(page);
  await page.waitForSelector('main h1', { timeout: 15000 });
  const structure = await page.evaluate(() => ({
    h1: document.querySelectorAll('h1').length,
    tables: document.querySelectorAll('table').length,
    tablesWithCaption: [...document.querySelectorAll('table')].filter((t) => t.querySelector('caption')).length,
    thWithoutScope: [...document.querySelectorAll('th')].filter((t) => !['col', 'row'].includes(t.getAttribute('scope'))).length,
    documentScrollWidth: document.documentElement.scrollWidth,
    innerWidth,
    title: document.title,
    lang: document.documentElement.lang,
    skipLink: Boolean(document.querySelector('a.skip')),
  }));
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
  results.push({ name, structure, violations: axe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })), errors, offOrigin: [...new Set(offOrigin)] });
  await context.close();
}
await browser.close();
await new Promise((r) => server.close(r));
let failed = 0;
for (const r of results) {
  const bad = r.errors.length || r.violations.length || r.offOrigin.length || r.structure.h1 !== 1 || !r.structure.skipLink || !r.structure.lang
    || r.structure.tablesWithCaption !== r.structure.tables || r.structure.thWithoutScope > 0 || r.structure.documentScrollWidth > r.structure.innerWidth + 1;
  if (bad) failed++;
  console.log(`${bad ? 'FAIL' : 'ok  '}  ${r.name}: h1 ${r.structure.h1}, ${r.structure.tables} tables (${r.structure.tablesWithCaption} with caption), th without scope ${r.structure.thWithoutScope}; axe ${r.violations.length}; page errors ${r.errors.length}; off-origin ${r.offOrigin.length}`);
  if (r.structure.documentScrollWidth > r.structure.innerWidth + 1) console.log(`      REFLOW: ${r.structure.documentScrollWidth}px at ${r.structure.innerWidth}px`);
  for (const v of r.violations) console.log(`      axe ${v.id} (${v.impact}): ${v.nodes} node(s)`);
  for (const e of r.errors) console.log(`      page error: ${e}`);
  for (const u of r.offOrigin) console.log(`      off-origin request: ${u}`);
}
if (jsonOut) { fs.mkdirSync(path.dirname(path.resolve(jsonOut)), { recursive: true }); fs.writeFileSync(path.resolve(jsonOut), JSON.stringify({ checked_at: new Date().toISOString(), page: 'cleer.html', results }, null, 2)); }
console.log(`\n${failed ? `${failed} context(s) FAILED` : `All ${results.length} contexts passed`}: static CLEER page.`);
process.exit(failed ? 1 : 0);
