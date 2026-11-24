// Standalone regression for the viewer's comparison search, status filter and status-priority order.
// No DDEV, Drupal or external HTTP requests: the viewer runs against local variant and frame fixtures.
//   node tools/playwright/viewer-find.mjs [--chromium=/path/to/chrome]
import fs from 'node:fs';
import http from 'node:http';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const html = fs.readFileSync(new URL('../compare/index.html', import.meta.url));
const fixture = '<!doctype html><html><body><p id="fixture">frame</p></body></html>';
const meta = (status, status_code, title, extra = {}) => ({ status, status_code, priority: 'Normal', category: 'Bug report', changed: '2026-11-20', comments: 12, title, since: '2026-10-01', tags: ['Accessibility'], mr: null, ...extra });
const variants = [
  { slug: '1111111-latest', issue: '1111111', label: '#1111111: RTBC fixture', description: 'Fixture', issueMeta: meta('Reviewed & tested by the community', 14, 'RTBC fixture'), pages: ['/sample'], demo: { start: '/sample' }, steps: [], checks: [], observe: [] },
  { slug: '1111111-pinned', issue: '1111111', label: '#1111111: RTBC fixture, pinned core', description: 'Fixture', issueMeta: meta('Reviewed & tested by the community', 14, 'RTBC fixture'), pages: ['/sample'], demo: { start: '/sample' }, steps: [], checks: [], observe: [] },
  { slug: '2222222-latest', issue: '2222222', label: '#2222222: Review fixture', description: 'Fixture', issueMeta: meta('Needs review', 8, 'Review fixture', { changed: '2026-11-22' }), pages: ['/sample'], demo: { start: '/sample' }, steps: [], checks: [], observe: [] },
  { slug: '3333333-latest', issue: '3333333', label: '#3333333: Work fixture', description: 'Fixture', issueMeta: meta('Needs work', 13, 'Work fixture', { changed: '2026-11-21' }), pages: ['/sample'], demo: { start: '/sample' }, steps: [], checks: [], observe: [] },
  { slug: '4444444-latest', issue: '4444444', label: '#4444444: Active fixture', description: 'Fixture', issueMeta: meta('Active', 1, 'Active fixture', { changed: '2026-11-19' }), pages: ['/sample'], demo: { start: '/sample' }, steps: [], checks: [], observe: [] },
  { slug: '5555555-latest', issue: '5555555', label: '#5555555: Closed fixture', description: 'Fixture', issueMeta: meta('Closed (fixed)', 7, 'Closed fixture', { changed: '2026-11-18' }), pages: ['/sample'], demo: { start: '/sample' }, steps: [], checks: [], observe: [] },
  { slug: 'zz-lab', label: 'Lab-only fixture', description: 'Fixture', pages: ['/sample'], demo: { start: '/sample' }, steps: [], checks: [], observe: [] },
];
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/') { res.setHeader('content-type', 'text/html'); res.end(html); return; }
  for (const file of ['browser-handoff.mjs', 'media-preferences.mjs']) {
    if (url.pathname === `/${file}`) { res.setHeader('content-type', 'text/javascript'); res.end(fs.readFileSync(new URL(`../compare/${file}`, import.meta.url))); return; }
  }
  if (url.pathname.startsWith('/browser-icons/')) { res.setHeader('content-type', 'image/svg+xml'); res.end(fs.readFileSync(new URL(`../compare${url.pathname}`, import.meta.url))); return; }
  if (/^\/(before|after)\//.test(url.pathname)) { res.setHeader('content-type', 'text/html'); res.end(fixture); return; }
  res.setHeader('content-type', 'application/json');
  if (url.pathname === '/variants.json') {
    const origin = `http://127.0.0.1:${server.address().port}`;
    res.end(JSON.stringify({ variants, availability: Object.fromEntries(variants.map((v) => [v.slug, true])), origins: { before: origin + '/before', after: origin + '/after' }, state: { slug: '1111111-latest', theme: 'auto', darkos: false } }));
    return;
  }
  if (url.pathname === '/api/health') { res.end(JSON.stringify({ before: { ok: true }, after: { ok: true } })); return; }
  if (url.pathname === '/api/browsers') { res.end(JSON.stringify({ browsers: [] })); return; }
  if (req.method === 'POST') { let b = ''; req.on('data', (c) => b += c); req.on('end', () => res.end('{}')); return; }
  res.end('{}');
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const executablePath = process.argv.find((a) => a.startsWith('--chromium='))?.slice(11);
let browser;
try {
  browser = await chromium.launch(executablePath ? { executablePath } : {});
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(origin);
  await page.waitForFunction(() => /7 of 7/.test(document.getElementById('vcount').textContent));
  const groupLabels = () => page.locator('#variant optgroup').evaluateAll((gs) => gs.map((g) => g.label));
  assert.deepEqual((await groupLabels()).map((l) => l.split(' · ')[0]), ['#1111111', '#2222222', '#3333333', '#4444444', '#5555555', 'zz-lab'], 'status priority puts RTBC first and lab-only last');
  assert.match((await groupLabels())[0], /^#1111111 · RTBC/);
  assert.match((await groupLabels())[5], /No issue/);

  // Real keyboard input filters by issue title and status name.
  await page.locator('#vsearch').pressSequentially('needs review');
  await page.waitForFunction(() => /1 of 7/.test(document.getElementById('vcount').textContent));
  assert.deepEqual(await page.locator('#variant optgroup option').evaluateAll((os) => os.map((o) => o.value)), ['2222222-latest']);
  assert.match((await groupLabels())[0], /Needs review/);

  // RTBC is a label on the group, not only the drupal.org wording, so it must match too.
  await page.locator('#vsearch').fill('');
  await page.locator('#vsearch').pressSequentially('rtbc');
  await page.waitForFunction(() => /2 of 7/.test(document.getElementById('vcount').textContent));
  assert.deepEqual(await page.locator('#variant optgroup option').evaluateAll((os) => os.map((o) => o.value)), ['1111111-latest', '1111111-pinned']);

  // Status filter, and a filtered switch still loads the chosen variant.
  await page.locator('#vsearch').fill('');
  await page.locator('#vstatus').selectOption('rtbc');
  await page.waitForFunction(() => /2 of 7/.test(document.getElementById('vcount').textContent));
  assert.equal(await page.locator('#variant optgroup').count(), 1);
  assert.deepEqual(await page.locator('#variant option:not([disabled])').evaluateAll((os) => os.map((o) => o.value)), ['1111111-latest', '1111111-pinned']);
  await page.locator('#variant').selectOption('1111111-pinned');
  await page.waitForFunction(() => document.title === 'Compare: 1111111-pinned');

  // Order by issue number restores the registered order.
  await page.locator('#vstatus').selectOption('all');
  await page.locator('#vsort').selectOption('issue');
  await page.waitForFunction(() => /7 of 7/.test(document.getElementById('vcount').textContent));
  assert.deepEqual((await groupLabels()).map((l) => l.split(' · ')[0]), ['#1111111', '#2222222', '#3333333', '#4444444', '#5555555', 'zz-lab']);

  // Recently changed order uses the drupal.org change date, with lab-only last.
  await page.locator('#vsort').selectOption('changed');
  await page.waitForFunction(() => /7 of 7/.test(document.getElementById('vcount').textContent));
  assert.deepEqual((await groupLabels()).map((l) => l.split(' · ')[0]), ['#2222222', '#3333333', '#1111111', '#4444444', '#5555555', 'zz-lab']);

  // A search that matches nothing leaves the current choice visible and explains the empty result.
  await page.locator('#vsearch').fill('no-such-issue');
  await page.waitForFunction(() => /0 of 7/.test(document.getElementById('vcount').textContent));
  assert.equal(await page.locator('#vempty').isVisible(), true);
  assert.equal(await page.locator('#variant option[value="1111111-pinned"]').count(), 1, 'the current comparison stays selected');
  await page.locator('#vsearch').fill('');

  // The new controls are labelled and have no automated accessibility violations.
  const axe = await new AxeBuilder({ page }).include('.comparison-filters').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  assert.deepEqual(axe.violations.map((v) => v.id), []);

  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert(await page.locator('.topbar').evaluate((el) => el.scrollWidth <= el.clientWidth + 1), `toolbar overflow at ${width}px`);
  }
  assert.deepEqual(errors, [], `page errors: ${errors.join('; ')}`);
  await page.screenshot({ path: '/tmp/viewer-find.png' });
  await context.close();
  console.log(`ok: search/status/sort; ${variants.length} fixtures; 0 axe violations in the filter region; no page errors.`);
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
