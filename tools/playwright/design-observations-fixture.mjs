// Real-browser regression fixture, no DDEV or Drupal required.
// node tools/playwright/design-observations-fixture.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import AxeBuilder from '@axe-core/playwright';
import { chromium } from '@playwright/test';
import { browserThemeContext } from '../compare/theme-context.mjs';
import { observeDesign, printDelta, compareObservations } from './lib/design-observations.mjs';
const root = path.resolve('tools/compare');
let base;
const fixture = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Fixture</title><link rel="stylesheet" href="/core/themes/default_admin/css/base/fixture.css"><style>#print-only{display:none}@media print{#screen-only{display:none}#print-only{display:block}#restyled{font-style:italic}}@media (prefers-contrast:more){#restyled{border-inline-start:3px double}}#restyled{animation:lab-pulse 5s infinite}@keyframes lab-pulse{from{opacity:1}to{opacity:.8}}@media(prefers-reduced-motion:reduce){#restyled{animation:none;scroll-behavior:auto}}@page{margin:12mm}</style><body><h1>Fixture</h1><p id="screen-only">Screen only</p><p id="print-only">Print only</p><p id="restyled">Changed style</p><span id="generated-123456">Navigation</span><nav id="named-nav" aria-labelledby="generated-123456"></nav><label for="test-input">Test</label><input id="test-input"><script>window.drupalSettings={ajaxPageState:{theme:'default_admin'}};const read=${browserThemeContext.toString()};function send(){parent.postMessage({compare:1,type:'theme-context',context:read()},location.origin)}addEventListener('load',send);setInterval(send,200);</script></body></html>`;
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const json = data => { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(data)); };
  if (url.pathname === '/variants.json') return json({ variants: [{ slug: 'fixture', issue: '0', label: 'Fixture', description: 'Fixture', before: { env: 'before', label: 'Before' }, after: { env: 'after', label: 'After' }, pages: ['/fixture'], steps: [], checks: [], observe: [], expected: 'Fixture', actual: '' }], availability: { fixture: true }, state: { slug: 'fixture', theme: 'auto', darkos: false }, origins: { before: base, after: base }, sites: { before: base, after: base } });
  if (url.pathname === '/api/health') return json({ before: { ok: true }, after: { ok: true } });
  if (url.pathname === '/api/browsers') return json({ browsers: [] });
  if (url.pathname === '/api/resources/latest') return json({ found: false, command: 'fixture' });
  if (url.pathname.startsWith('/api/')) return json({});
  if (url.pathname === '/core/themes/default_admin/css/base/fixture.css') { res.writeHead(200, { 'content-type': 'text/css' }); res.end(''); return; }
  if (url.pathname === '/fixture') { res.writeHead(200, { 'content-type': 'text/html' }); res.end(fixture); return; }
  if (url.pathname === '/' || ['/browser-handoff.mjs', '/media-preferences.mjs'].includes(url.pathname)) {
    const file = path.join(root, url.pathname === '/' ? 'index.html' : path.basename(url.pathname));
    res.writeHead(200, { 'content-type': file.endsWith('.mjs') ? 'text/javascript' : 'text/html' }); res.end(fs.readFileSync(file)); return;
  }
  res.writeHead(404); res.end('Not found');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
base = 'http://127.0.0.1:' + server.address().port;
let browser;
try {
  browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(base + '/fixture');
  const screen = await observeDesign(page);
  assert.equal(compareObservations(screen, await observeDesign(page)).changes.length, 0, 'unchanged control');
  await page.locator('#generated-123456').evaluate(el => el.id = 'generated-789012');
  await page.locator('#named-nav').evaluate(el => el.setAttribute('aria-labelledby', 'generated-789012'));
  const renumbered = await observeDesign(page);
  const idDelta = compareObservations(screen, renumbered);
  assert.equal(idDelta.changes.length, 0); assert.equal(idDelta.referenceIdChanges.length, 1);
  await page.locator('#restyled').evaluate(el => el.style.fontWeight = '700');
  assert.ok(compareObservations(renumbered, await observeDesign(page)).changes.some(row => row.key === '#restyled' && row.different.style));
  await page.locator('#restyled').evaluate(el => el.style.removeProperty('font-weight'));
  await page.locator('#named-nav').evaluate(el => el.setAttribute('aria-labelledby', 'missing'));
  assert.ok(compareObservations(renumbered, await observeDesign(page)).changes.some(row => row.key === '#named-nav' && row.different.references));
  await page.locator('#named-nav').evaluate(el => el.setAttribute('aria-labelledby', 'generated-789012'));
  await page.evaluate(() => { delete window.drupalSettings; });
  const unknown = await observeDesign(page);
  assert.equal(unknown.context.theme, null); assert.equal(unknown.context.themeAssets[0].name, 'default_admin');
  await page.evaluate(() => { window.drupalSettings = { ajaxPageState: { theme: 'default_admin' } }; });
  console.log('PASS: unchanged control, deliberate bold change, generated IDs, broken references and anonymous theme assets');
  await page.emulateMedia({ media: 'print', contrast: 'more', forcedColors: 'active', reducedMotion: 'reduce' });
  const printed = await observeDesign(page), delta = printDelta(screen, printed);
  assert.ok(delta.hiddenInPrint.includes('#screen-only'));
  assert.ok(delta.revealedInPrint.includes('#print-only'));
  assert.equal(printed.context.reducedMotion, 'reduce');
  assert.equal(printed.nodes.find(node => node.key === '#restyled').style.animationName, 'none');
  assert.equal(printed.context.prefersContrast, 'more'); assert.equal(printed.context.forcedColors, true);
  assert.ok(printed.printRules.some(rule => rule.type === 'page'));
  assert.ok(delta.changes.some(row => row.key === '#restyled' && row.different.style));
  console.log('PASS: real browser screen/print, print CSS and independent contrast preferences');
  await page.emulateMedia({ media: 'screen', contrast: 'no-preference', forcedColors: 'none', reducedMotion: 'no-preference' });
  await page.goto(base);
  await page.waitForFunction(() => document.querySelector('#theme-before')?.textContent.includes('default_admin'));
  const frame = page.frameLocator('#fa');
  await frame.locator('body').evaluate(() => { window.drupalSettings.ajaxPageState.theme = 'other_theme'; document.documentElement.classList.add('high-contrast'); });
  await page.waitForFunction(() => document.querySelector('#theme-after')?.textContent.includes('other_theme'));
  await page.locator('#tab-env').click();
  assert.match(await page.locator('#theme-comparison').textContent(), /Different rendered themes/);
  assert.match(await page.locator('#theme-history').textContent(), /THEME CHANGED/);
  const before = await page.locator('#theme-before').textContent();
  await page.evaluate(() => window.postMessage({ compare: 1, type: 'theme-context', context: { theme: 'spoofed' } }, location.origin));
  assert.equal(await page.locator('#theme-before').textContent(), before);
  await page.locator('#theme-download').focus();
  assert.equal(await page.locator('#theme-download').evaluate(el => el === document.activeElement), true);
  const downloadPromise = page.waitForEvent('download'); await page.keyboard.press('Enter');
  const download = await downloadPromise; assert.match(download.suggestedFilename(), /theme-evidence/);
  const audit = await new AxeBuilder({ page }).include('#p-env').analyze();
  assert.equal(audit.violations.filter(rule => ['critical', 'serious'].includes(rule.impact)).length, 0);
  console.log('PASS: viewer labels, transitions, source guard, keyboard download and panel axe');
} finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
