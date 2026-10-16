// Standalone toolbar and browser-handoff integration test. No DDEV or native applications are launched.
// node tools/playwright/viewer-handoff.mjs [--chromium=/path/to/chrome]
import fs from 'node:fs';
import http from 'node:http';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { handoffHash } from '../compare/browser-handoff.mjs';

const html = fs.readFileSync(new URL('../compare/index.html', import.meta.url));
const posts = [];
let origin;
const frameOrigins = {};
const frameServers = ['before', 'after'].map(side => http.createServer((req, res) => {
  res.setHeader('content-type', 'text/html');
  res.end(`<!doctype html><body style="height:3000px"><p>Fixture</p><script>addEventListener('load',()=>parent.postMessage({compare:1,side:'${side}',type:'loaded'},'${origin}'));addEventListener('message',e=>{if(e.data.type==='scroll')scrollTo(e.data.x,e.data.y)});addEventListener('scroll',()=>parent.postMessage({compare:1,type:'scroll',x:scrollX,y:scrollY},'${origin}'));<\/script>`);
}));
for (const [i, side] of ['before', 'after'].entries()) {
  await new Promise(resolve => frameServers[i].listen(0, '127.0.0.1', resolve));
  frameOrigins[side] = `http://127.0.0.1:${frameServers[i].address().port}`;
}
const variants = [{ slug: '3615469-pinned', issue: '3615469', label: '#3615469: Maintenance form login link, pinned core', description: 'Fixture', pages: ['/sample'], steps: [], checks: [], observe: [] }, { slug: 'not-built', issue: '1', label: 'Not built', pages: ['/'], steps: [], checks: [], observe: [] }];
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/') { res.setHeader('content-type', 'text/html'); res.end(html); return; }
  if (pathname === '/browser-handoff.mjs') { res.setHeader('content-type', 'text/javascript'); res.end(fs.readFileSync(new URL('../compare/browser-handoff.mjs', import.meta.url))); return; }
  if (pathname.startsWith('/browser-icons/')) { res.setHeader('content-type', 'image/svg+xml'); res.end(fs.readFileSync(new URL('../compare' + pathname, import.meta.url))); return; }
  res.setHeader('content-type', 'application/json');
  if (pathname === '/variants.json') { res.end(JSON.stringify({ variants, availability: { '3615469-pinned': true, 'not-built': false }, origins: { before: frameOrigins.before, after: frameOrigins.after }, state: { slug: '3615469-pinned', theme: 'auto', darkos: false } })); return; }
  if (pathname === '/api/browsers') { res.end(JSON.stringify({ browsers: ['chrome', 'edge', 'firefox', 'safari'].map(id => ({ id, label: { chrome: 'Google Chrome', edge: 'Microsoft Edge', firefox: 'Firefox', safari: 'Safari' }[id] })) })); return; }
  if (pathname === '/api/health') { res.end(JSON.stringify({ before: { ok: true }, after: { ok: true } })); return; }
  if (req.method === 'POST') { let b = ''; req.on('data', c => b += c); req.on('end', () => { posts.push({ pathname, body: JSON.parse(b) }); res.end('{}'); }); return; }
  res.end('{}');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
origin = `http://127.0.0.1:${server.address().port}`;
const executablePath = process.argv.find(a => a.startsWith('--chromium='))?.slice(11);
let browser;
try {
  browser = await chromium.launch(executablePath ? { executablePath } : {});
  const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/134.0.0.0 Safari/537.36' });
  const page = await context.newPage();
  await page.goto(origin);
  await page.locator('#browsers button').first().waitFor();
  assert.equal(await page.getByRole('button', { name: 'Open this comparison in Google Chrome', exact: true }).count(), 0);
  assert.equal(await page.locator('#browsers button').count(), 3);
  assert.equal(await page.locator('#variant option[value="not-built"]').count(), 0);
  assert.equal(await page.locator('#cache').isVisible(), true);
  assert.equal(await page.getByRole('button', { name: 'Log in both', exact: true }).count(), 1);
  for (const width of [375, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    assert(await page.locator('.topbar').evaluate(el => el.scrollWidth <= el.clientWidth), `Toolbar overflow at ${width}px`);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.waitForFunction(() => [...document.querySelectorAll('#browsers img')].every(i => i.complete && i.naturalWidth));
  await page.screenshot({ path: '/tmp/viewer-browser-toolbar.png' });
  await page.locator('input[name=width][value="768px"]').check();
  await page.locator('input[name=view][value="onion"]').check();
  await page.locator('input[name=theme][value="dark"]').check();
  await page.getByRole('button', { name: 'Open this comparison in Firefox', exact: true }).click();
  await page.waitForFunction(() => document.getElementById('status').textContent.includes('Opened Firefox'));
  const sent = posts.find(p => p.pathname === '/api/browser/open');
  assert.equal(sent.body.browser, 'firefox'); assert.equal(sent.body.snapshot.controls.width, '768px'); assert.equal(sent.body.snapshot.controls.view, 'onion'); assert.equal(sent.body.snapshot.controls.theme, 'dark');
  const snapshot = { ...sent.body.snapshot, dock: { tab: 'checks', collapsed: false, large: true }, paths: { before: '/sample', after: '/different' }, scroll: { before: { x: 0, y: 700 }, after: { x: 0, y: 900 } }, forcedColors: true };
  const second = await context.newPage(); await second.goto(origin + '/' + handoffHash(snapshot));
  await second.locator('#handoffnote:not([hidden])').waitFor();
  assert(await second.locator('input[name=width][value="768px"]').isChecked());
  assert(await second.locator('input[name=view][value="onion"]').isChecked());
  assert(await second.locator('input[name=theme][value="dark"]').isChecked());
  for (const side of ['before', 'after']) {
    const frame = second.frames().find(f => f.url().startsWith(frameOrigins[side]));
    assert.equal(new URL(frame.url()).pathname, snapshot.paths[side]);
    await frame.waitForFunction(y => scrollY === y, snapshot.scroll[side].y);
  }
  assert.equal(await second.locator('#dock').getAttribute('data-size'), 'large');
  assert.equal(await second.locator('#tabs [aria-selected=true]').getAttribute('data-tab'), 'checks');
  assert((await second.locator('#handoffnote').textContent()).includes('cannot be transferred automatically'));
  console.log('PASS: current-browser filtering, compact built comparison list, visible cache/login, launch payload, restored controls/paths/scroll, and forced-colour limitation notice.');
}
finally { if (browser) await browser.close(); await Promise.all([server, ...frameServers].map(s => new Promise(resolve => s.close(resolve)))); }
