// Smoke check for the cloud comparison in a DDEV Coder workspace. Does not report success if anything it can run fails.
//   node scripts/cloud-smoke.mjs [slug]
// Exit code: 0 all runnable checks passed, 1 at least one FAILED, 3 none failed but a check could not run (NOT RUN).
// What it can and cannot show from inside the workspace:
//   - Routes: each Coder app hostname is requested through the DDEV router with that Host header. The two site proxies must answer
//     with a Drupal response (x-generator header), so nginx's own "no index file" 403 for an unmatched hostname is a failure.
//   - Frames: a second viewer instance is started on port 8200 with local frame origins (no Coder sign-in is needed), opened in
//     Chromium through Playwright, and both frames must contain a Drupal page. This proves sites, proxies and framing, not Coder.
//   - Frames at the real Coder origins need a signed-in browser (the workspace has no Coder session): always reported NOT CHECKED.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { labRoot, variants } from '../tools/compare/lib.mjs';

const slug = process.argv.slice(2).find((a) => !a.startsWith('--')) || variants()[0].slug;
const results = [];
const add = (name, status, detail = '') => { results.push({ name, status, detail }); console.log(`${status.padEnd(11)} ${name}${detail ? `  (${detail})` : ''}`); };

const ws = process.env.CODER_WORKSPACE_NAME, owner = process.env.CODER_WORKSPACE_OWNER_NAME, agent = process.env.CODER_AGENT_URL;
if (!ws || !owner || !agent) { console.error('Not inside a Coder workspace (CODER_WORKSPACE_NAME, CODER_WORKSPACE_OWNER_NAME or CODER_AGENT_URL unset).'); process.exit(1); }
const domain = agent.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
const appHost = (project) => `${project}--${ws}--${owner}.${domain}`;

const get = (port, host, p = '/') => new Promise((resolve) => {
  const req = http.request({ host: '127.0.0.1', port, path: p, headers: { host }, timeout: 20000 }, (res) => {
    let body = ''; res.on('data', (c) => { if (body.length < 2e6) body += c; }); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
  });
  req.on('timeout', () => { req.destroy(); resolve({ status: 0, headers: {}, body: '', error: 'timeout' }); });
  req.on('error', (e) => resolve({ status: 0, headers: {}, body: '', error: e.code || e.message }));
  req.end();
});

// DDEV's router HTTP port (8080 in Coder workspaces); ask DDEV, fall back to 8080.
let routerPort = 8080;
try { const d = spawnSync('ddev', ['describe', '-j'], { cwd: path.join(labRoot, 'tools/compare/site'), encoding: 'utf8' }); routerPort = Number(JSON.parse(d.stdout).raw.router_http_port) || 8080; } catch { /* keep default */ }

console.log(`Cloud smoke check for ${slug} in workspace ${ws} (router port ${routerPort})\n`);

// 1. Routes through the router, by Coder hostname.
// A route can take a few seconds to appear after `ddev start` (the Coder routes hook runs after start), so try for up to about 30 seconds.
const getRoute = async (project, kind) => {
  let r;
  for (let i = 0; i < 10; i++) {
    r = await get(routerPort, appHost(project));
    if (kind === 'viewer' ? r.status === 200 : /Drupal/i.test(String(r.headers['x-generator'] || ''))) break;
    await new Promise((res) => setTimeout(res, 3000));
  }
  return r;
};
for (const [project, kind] of [['drupal-compare', 'viewer'], ['drupal-compare-before', 'proxy'], ['drupal-compare-after', 'proxy']]) {
  const r = await getRoute(project, kind);
  if (kind === 'viewer') {
    if (r.status === 200 && /Drupal core compare/i.test(r.body)) add(`Route ${project}: viewer page`, 'PASS', `HTTP ${r.status}`);
    else add(`Route ${project}: viewer page`, 'FAIL', r.error || `HTTP ${r.status}${r.status === 403 ? ', nginx has no server block for this hostname (compare-cloud.conf not loaded?)' : r.status === 502 ? ', the viewer is not listening on 0.0.0.0:8100 (LAB_BIND)' : ''}`);
  } else if (/Drupal/i.test(String(r.headers['x-generator'] || ''))) add(`Route ${project}: Drupal response through the proxy`, 'PASS', `HTTP ${r.status}`);
  else add(`Route ${project}: Drupal response through the proxy`, 'FAIL', r.error || `HTTP ${r.status}, no Drupal x-generator header${r.status === 502 ? ' (proxy cannot reach the viewer proxy port; is the viewer running with LAB_BIND=0.0.0.0?)' : r.status === 403 ? ' (an unmatched nginx server_name gives a 403 with no Drupal header)' : ''}`);
}

// 2. Viewer health and origins, as the browser would be told.
const viewerHost = appHost('drupal-compare');
const health = await get(8100, viewerHost, '/api/health');
try { const h = JSON.parse(health.body); add('Viewer /api/health: both sites answer', h.before.ok && h.after.ok ? 'PASS' : 'FAIL', `${h.before.text}; ${h.after.text}`); }
catch { add('Viewer /api/health: both sites answer', 'FAIL', health.error || `HTTP ${health.status}, not JSON`); }
const vj = await get(8100, viewerHost, '/variants.json');
try {
  const o = JSON.parse(vj.body).origins; const want = { before: `https://${appHost('drupal-compare-before')}`, after: `https://${appHost('drupal-compare-after')}` };
  add('Viewer frame origins are the Coder app URLs', o.before === want.before && o.after === want.after ? 'PASS' : 'FAIL', o.before === want.before && o.after === want.after ? '' : `got ${o.before} and ${o.after}; start the viewer with tools/compare/cloud/start-viewer.sh`);
} catch { add('Viewer frame origins are the Coder app URLs', 'FAIL', vj.error || `HTTP ${vj.status}`); }

// 3. Frames load Drupal pages, in a real browser, through a temporary viewer on port 8200 (local frame origins).
const PW = path.join(labRoot, 'tools/playwright/node_modules/@playwright/test/index.mjs');
if (!fs.existsSync(PW)) add('Frames load a Drupal page in each of the two viewer frames', 'NOT RUN', 'Playwright is not installed: cd tools/playwright && npm install && npx playwright install chromium');
else {
  const viewer = spawn('node', [path.join(labRoot, 'tools/compare/serve.mjs'), slug], { cwd: labRoot, env: { ...process.env, PORT: '8200', LAB_BIND: '', LAB_EXTRA_ORIGINS: '', LAB_BEFORE_ORIGIN: '', LAB_AFTER_ORIGIN: '' }, stdio: 'ignore' });
  try {
    let up = false; for (let i = 0; i < 30 && !up; i++) { up = (await get(8200, 'localhost:8200')).status === 200; if (!up) await new Promise((r) => setTimeout(r, 1000)); }
    if (!up) add('Frames load a Drupal page in each of the two viewer frames', 'FAIL', 'the temporary viewer on port 8200 did not start (is the port in use?)');
    else {
      const { chromium } = await import(pathToFileURL(PW).href);
      let browser;
      try { browser = await chromium.launch(); }
      catch (e) { add('Frames load a Drupal page in each of the two viewer frames', 'NOT RUN', `Chromium would not start: ${String(e.message).split('\n')[0]}`); }
      if (browser) {
        try {
          const page = await browser.newPage();
          await page.goto('http://localhost:8200/', { waitUntil: 'domcontentloaded' });
          const check = async (id, port) => {
            const deadline = Date.now() + 60000; let last = 'frame not found';
            while (Date.now() < deadline) {
              const f = page.frames().find((x) => x.url().includes(`:${port}`));
              if (f) {
                try {
                  const info = await f.evaluate(() => ({ gen: (document.querySelector('meta[name=Generator]') || {}).content || '', text: (document.body && document.body.innerText || '').slice(0, 300) }));
                  if (/Drupal/i.test(info.gen)) return { ok: true };
                  last = `frame loaded but is not a Drupal page: ${info.text.replace(/\s+/g, ' ').slice(0, 120)}`;
                } catch (e) { last = String(e.message).split('\n')[0]; }
              }
              await new Promise((r) => setTimeout(r, 1500));
            }
            return { ok: false, why: `${id}: ${last}` };
          };
          const [b, a] = [await check('Before', 8201), await check('After', 8202)];
          add('Frames load a Drupal page in each of the two viewer frames', b.ok && a.ok ? 'PASS' : 'FAIL', b.ok && a.ok ? 'Before and After, local frame origins' : [b.why, a.why].filter(Boolean).join('; '));
        } finally { await browser.close().catch(() => {}); }
      }
    }
  } finally { viewer.kill('SIGTERM'); }
}
add('Frames load at the Coder app URLs (drupal-compare-before/after--…)', 'NOT CHECKED', 'needs a signed-in browser; open the viewer URL and confirm both frames load');

const failed = results.filter((r) => r.status === 'FAIL').length, notRun = results.filter((r) => r.status === 'NOT RUN').length;
console.log(`\n${failed ? 'SMOKE CHECK FAILED' : notRun ? 'SMOKE CHECK INCOMPLETE' : 'SMOKE CHECK PASSED (runnable checks)'}: ${results.filter((r) => r.status === 'PASS').length} passed, ${failed} failed, ${notRun} not run, ${results.filter((r) => r.status === 'NOT CHECKED').length} not checked.`);
console.log(`Viewer: https://${viewerHost}/`);
process.exit(failed ? 1 : notRun ? 3 : 0);
