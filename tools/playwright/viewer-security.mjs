// Regression tests for the viewer's local-network protections and for navigation sync. Needs the viewer running on :8100 (node scripts/lab-env.mjs start <slug>).
//   node tools/playwright/viewer-security.mjs
// 1. API: actions are POST-only; foreign Host, foreign Origin and cross-site requests are refused. 2. A page on another origin cannot frame a proxied site (so it cannot
// send it commands). 3. Following a link in Before makes After follow (Sync navigation).
import http from 'node:http';
import { chromium } from '@playwright/test';

let ok = true; const check = (label, pass, extra = '') => { console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}${extra ? '  (' + extra + ')' : ''}`); if (!pass) ok = false; };
const raw = (method, path, headers = {}, body = '') => new Promise((resolve, reject) => {
  const q = http.request({ host: 'localhost', port: 8100, path, method, headers: { host: 'localhost:8100', ...headers } }, (r) => { r.resume(); r.on('end', () => resolve(r.statusCode)); });
  q.on('error', reject); q.end(body);
});

// ---- 1. API ----
check('GET /api/cache is refused (actions are POST-only)', (await raw('GET', '/api/cache')) === 405);
check('GET /api/login is refused', (await raw('GET', '/api/login')) === 405);
check('POST /api/cache with a foreign Origin is refused', (await raw('POST', '/api/cache', { origin: 'https://evil.example' })) === 403);
check('POST /api/state with Sec-Fetch-Site: cross-site is refused', (await raw('POST', '/api/state', { 'sec-fetch-site': 'cross-site' }, '{}')) === 403);
check('GET /api/state with Sec-Fetch-Site: cross-site is refused', (await raw('GET', '/api/state', { 'sec-fetch-site': 'cross-site' })) === 403);
check('a foreign Host header is refused', (await raw('GET', '/api/state', { host: 'attacker.example' })) === 403);
check('the viewer\'s own origin still works', (await raw('POST', '/api/state', { origin: 'http://localhost:8100', 'sec-fetch-site': 'same-origin' }, '{}')) === 200);
check('a plain local client (no Origin) still works', (await raw('GET', '/api/state')) === 200);

// ---- 2. A page on another origin cannot frame a proxied site ----
const origins = await new Promise((res) => http.get('http://localhost:8100/variants.json', (r) => { let b = ''; r.on('data', (c) => (b += c)); r.on('end', () => res(JSON.parse(b).origins)); }));
const attacker = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end(`<!doctype html><iframe id="f" src="${origins.before}/user/login" width="600" height="400"></iframe>`); }).listen(8300, '127.0.0.1');
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1500, height: 900 }, ignoreHTTPSErrors: true });
const a = await ctx.newPage(); await a.goto('http://localhost:8300/'); await a.waitForTimeout(6000);
const framed = a.frames().find((f) => f !== a.mainFrame());
let loaded = false; try { loaded = !!framed && !/^chrome-error:|^about:blank$/.test(framed.url()) && (await framed.evaluate(() => !!document.body)); } catch { loaded = false; }
check('a page on another origin cannot frame a proxied site (frame-ancestors)', !loaded, framed ? framed.url().slice(0, 40) : 'no frame');
attacker.close();

// ---- 3. Sync navigation ----
const p = await ctx.newPage(); await p.goto('http://localhost:8100/'); await p.waitForTimeout(4000);
await p.click('#login'); await p.waitForTimeout(8000);
await p.fill('#goto', 'admin/config'); await p.click('#go'); await p.waitForTimeout(8000);
await p.frameLocator('#fb').locator('a[href*="/admin/config/people/accounts"]').first().evaluate((a) => a.click()); await p.waitForTimeout(6000);
const pb = (await p.locator('#pb').textContent()).trim(), pa = (await p.locator('#pa').textContent()).trim();
check('following a link in Before makes After follow', /people\/accounts/.test(pb) && /people\/accounts/.test(pa), `Before ${pb}, After ${pa}`);
await b.close();
console.log(ok ? 'PASS: protections and sync navigation work' : 'FAIL'); process.exit(ok ? 0 : 1);
