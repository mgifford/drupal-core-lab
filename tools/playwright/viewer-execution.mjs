// Accessibility and reflow check for the optional "Drupal execution evidence" section.
//
//   node tools/playwright/viewer-execution.mjs [--slug=3619127-pinned] [--live] [--json=<file>]
//
// Without --live it serves the generated cloud/ directory and checks the static section (the GitHub Pages presentation).
// With --live it uses an already-running `node tools/compare/serve.mjs <slug>` at http://localhost:8100 and checks the
// Execution tab, including keyboard activation. It runs axe-core scoped to the new section in light, dark, forced-colours
// and reduced-motion contexts, plus a 320 px reflow check. Exit 1 if the section is missing, a page error occurs, or axe
// reports a violation inside the section.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const labRoot = path.resolve(here, '../..');
const argv = process.argv.slice(2);
const opt = (name, fallback = null) => { const a = argv.find((x) => x.startsWith(`--${name}=`)); return a ? a.slice(name.length + 3) : fallback; };
const live = argv.includes('--live');
const jsonOut = opt('json');
const cloud = path.join(labRoot, 'cloud');
const variants = JSON.parse(fs.readFileSync(path.join(cloud, 'variants.json'), 'utf8')).variants;
const withEvidence = variants.filter((v) => v.executionEvidence);
const slug = opt('slug', withEvidence[0]?.slug);
const variant = withEvidence.find((v) => v.slug === slug);
if (!live && !variant) { console.error(`No execution evidence in cloud/variants.json for ${slug || '(any variant)'}. Collect and rebuild first.`); process.exit(2); }

const MIME = { '.html': 'text/html', '.json': 'application/json', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.gif': 'image/gif', '.svg': 'image/svg+xml' };
let server = null;
let base;
if (!live) {
  server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    const rel = u.pathname === '/' ? 'index.html' : u.pathname.replace(/^\//, '');
    const file = path.join(cloud, rel);
    if (!file.startsWith(cloud) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(fs.readFileSync(file));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}/index.html?variant=${encodeURIComponent(slug)}&mode=static`;
} else {
  base = `http://localhost:8100/?variant=${encodeURIComponent(slug)}`;
}

const browser = await chromium.launch();
const results = [];
for (const [name, width, contextOptions] of [
  ['light-desktop', 1280, { colorScheme: 'light' }],
  ['dark-desktop', 1280, { colorScheme: 'dark' }],
  ['forced-colours', 1280, { colorScheme: 'light', forcedColors: 'active' }],
  ['reduced-motion', 1280, { reducedMotion: 'reduce' }],
  ['mobile-320', 320, { colorScheme: 'light' }],
]) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, ...contextOptions });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message)));
  let found = false, section = null;
  try {
    await page.goto(base, { waitUntil: 'load' });
    if (live) {
      await page.waitForSelector('#tab-exec:not([hidden])', { timeout: 20000 });
      await page.locator('#tab-exec').focus();
      await page.keyboard.press('Enter');
      section = '#p-exec';
      found = await page.isVisible('#p-exec');
    } else {
      await page.waitForSelector('#static-exec:not([hidden])', { timeout: 20000 });
      section = '#static-exec';
      found = await page.isVisible('#static-exec');
    }
    if (found) {
      const geometry = await page.evaluate((sel) => {
        const root = document.querySelector(sel);
        const wrap = root.querySelector('.exec-tablewrap');
        return {
          documentScrollWidth: document.documentElement.scrollWidth, innerWidth,
          sectionWidth: root.getBoundingClientRect().width,
          tableWrapperWidth: wrap ? wrap.clientWidth : null, tableScrollWidth: wrap ? wrap.scrollWidth : null,
          tableWrapperTabIndex: wrap ? wrap.tabIndex : null, tableWrapperRole: wrap ? wrap.getAttribute('role') : null,
          heading: root.querySelector('h2')?.textContent || null, tables: root.querySelectorAll('table').length, captions: [...root.querySelectorAll('caption')].map((c) => c.textContent.trim()),
        };
      }, section);
      const axe = await new AxeBuilder({ page }).include(section).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
      results.push({ name, found, geometry, violations: axe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })), errors });
    } else {
      results.push({ name, found, errors, violations: [], geometry: null });
    }
  } catch (e) {
    results.push({ name, found, error: String(e.message).split('\n')[0], errors, violations: [], geometry: null });
  }
  await context.close();
}
await browser.close();
if (server) await new Promise((r) => server.close(r));

let failed = 0;
for (const r of results) {
  const bad = !r.found || r.errors.length || r.violations.length || r.error;
  if (bad) failed++;
  console.log(`${bad ? 'FAIL' : 'ok  '}  ${r.name}${r.found ? '' : ': execution section not found'}${r.error ? `: ${r.error}` : ''}`);
  if (r.errors.length) for (const e of r.errors) console.log(`      page error: ${e}`);
  for (const v of r.violations) console.log(`      axe ${v.id} (${v.impact}): ${v.nodes} node(s)`);
  if (r.geometry) {
    const g = r.geometry;
    console.log(`      heading: ${g.heading}; tables: ${g.tables}; captions: ${g.captions.length}; table region tabIndex ${g.tableWrapperTabIndex}, role ${g.tableWrapperRole}`);
    if (g.documentScrollWidth > g.innerWidth + 1) console.log(`      REFLOW: document is ${g.documentScrollWidth}px wide at ${g.innerWidth}px viewport`);
    if (g.tableWrapperWidth !== null && g.tableScrollWidth > g.tableWrapperWidth) console.log(`      table scrolls inside its ${g.tableWrapperRole} region (${g.tableWrapperWidth}px viewport, ${g.tableScrollWidth}px content) — expected for a data table`);
  }
}
if (jsonOut) { fs.mkdirSync(path.dirname(path.resolve(jsonOut)), { recursive: true }); fs.writeFileSync(path.resolve(jsonOut), JSON.stringify({ slug, live, checked_at: new Date().toISOString(), results }, null, 2)); }
console.log(`\n${failed ? `${failed} context(s) FAILED` : `All ${results.length} contexts passed`}: execution evidence section${live ? ' (live tab)' : ' (static GitHub Pages mode)'}.`);
process.exit(failed ? 1 : 0);
