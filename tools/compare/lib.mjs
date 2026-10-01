// Shared helpers: find environments, talk to DDEV, normalise pages for diffing.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const labRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const variants = () => JSON.parse(fs.readFileSync(path.join(labRoot, 'tools/compare/variants.json'), 'utf8'));
export const envDir = (env) => path.join(labRoot, 'envs', env);

// DDEV hostname and router port for an environment (the router needs a Host header).
export function envInfo(env) {
  const out = execFileSync('ddev', ['describe', '-j'], { cwd: envDir(env), encoding: 'utf8' });
  const raw = JSON.parse(out).raw;
  return { host: raw.hostname, hosts: raw.hostnames || [raw.hostname], routerPort: Number(raw.router_http_port || 80), status: raw.status };
}

// One-time login path (e.g. /user/reset/1/123/abc/login) for user 1, via the DDEV add-on.
export function loginPath(env) {
  const out = execFileSync('ddev', ['drupal', 'login'], { cwd: envDir(env), encoding: 'utf8' }).trim().split('\n').pop();
  // The add-on's link ends at the 'set password' form; '/login' completes the login directly.
  return new URL(out).pathname.replace(/\/login$/, '') + '/login';
}

// Fetch from an environment through the router, following redirects and keeping cookies.
// Uses node:http because fetch() ignores a custom Host header, which the router needs.
function httpGet(port, host, pathAndQuery, jar) {
  return new Promise((resolve, reject) => {
    const cookie = Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ');
    const req = http.request({ host: '127.0.0.1', port, path: pathAndQuery, method: 'GET', headers: { host, cookie, 'accept-encoding': 'identity' } }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ res, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject); req.end();
  });
}

export async function envFetch(env, info, pathAndQuery, jar = {}) {
  let p = pathAndQuery;
  for (let i = 0; i < 8; i++) {
    const { res, body } = await httpGet(info.routerPort, info.host, p, jar);
    for (const c of res.headers['set-cookie'] || []) {
      const [kv] = c.split(';'); const eq = kv.indexOf('=');
      jar[kv.slice(0, eq)] = kv.slice(eq + 1);
    }
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      const loc = new URL(res.headers.location, `http://${info.host}/`);
      p = `${loc.pathname}${loc.search}`;
      continue;
    }
    return { status: res.statusCode, type: res.headers['content-type'] || '', body };
  }
  throw new Error('too many redirects');
}

// Remove per-site and per-request noise so only real differences remain.
export function normalise(text, hosts) {
  let t = text;
  for (const h of hosts) t = t.split(h).join('HOST');
  t = t.replace(/(<script type="application\/json" data-drupal-selector="drupal-settings-json">)[\s\S]*?(<\/script>)/g, '$1SETTINGS$2');
  t = t.replace(/(name="form_build_id" value=")[^"]*/g, '$1BUILD_ID').replace(/(name="form_token" value=")[^"]*/g, '$1TOKEN');
  t = t.replace(/(id="form-)[A-Za-z0-9_-]+/g, '$1BUILD_ID').replace(/([?&]token=)[A-Za-z0-9_-]+/g, '$1TOKEN');
  t = t.replace(/(\b[a-z][a-z0-9_-]*-)\d{6,10}\b/g, '$1RANDOM');
  t = t.replace(/(name="changed" value=")\d+/g, '$1TS');
  t = t.replace(/(name="created\[0\]\[value\]\[(?:time|date)\]" value=")[^"]*/g, '$1CREATED');
  t = t.replace(/(js-view-dom-id-)[a-f0-9]+/g, '$1ID');
  t = t.replace(/(data-drupal-selector="form-)[A-Za-z0-9_-]+/g, '$1BUILD_ID');
  t = t.replace(/(data-autocomplete-path="[^"?]*\/default\/)[A-Za-z0-9_-]+/g, '$1TOKEN');
  t = t.replace(/(\.(?:css|js))\?[A-Za-z0-9._=&-]+/g, '$1');
  t = t.replace(/\/sites\/[^/"']+\/files\/(css|js)\/(?:css|js)_[A-Za-z0-9_-]+\.(?:css|js)/g, '/AGGREGATE-$1');
  return t;
}

// Local stylesheet and script URLs in document order, with aggregate files keyed by position.
export function assetsOf(html) {
  const urls = [];
  for (const m of html.matchAll(/<(?:script[^>]*\ssrc|link[^>]*\shref)="([^"]+\.(?:js|css)(?:\?[^"]*)?)"/g)) {
    if (!/^https?:\/\//.test(m[1]) || /\.ddev\.site|localhost/.test(m[1])) urls.push(m[1]);
  }
  const counts = {};
  return urls.map((u) => {
    const p = new URL(u, 'http://x/');
    const agg = /\/sites\/[^/]+\/files\/(css|js)\/(?:css|js)_/.test(p.pathname);
    const kind = p.pathname.split('.').pop();
    const key = agg ? `AGGREGATE-${kind}#${counts[kind] = (counts[kind] || 0) + 1}` : p.pathname;
    return { key, fetchPath: p.pathname + p.search };
  });
}
