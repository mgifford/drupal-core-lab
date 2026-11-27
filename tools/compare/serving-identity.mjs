// Is the site that answers a run really this checkout? A folder name is not enough: DDEV sends a command run in an unregistered
// nested folder to the registered project around it (DDEV 1.25), a project name can belong to another lab copy, and Mutagen can serve
// stale files. A PHPUnit run once reported success from another issue's installation. Per side, before any result is accepted:
//   project    `ddev describe -j` in the folder answers with this environment's project name, this folder as approot, running
//   container  the web container holds the same bytes as the host for the files that identify the side (core's Drupal.php and every
//              file the side's patches touch; Before and After differ in exactly those)
//   http       the web server at the project's URL serves a one-off file written into this checkout's sites/default/files (site
//              data, never code; removed again), so the URL really is this folder
// Read-only apart from that file. Nothing here starts, stops or reconfigures a project. ddev and get are injectable for tests.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { ddevName, envFetch } from './lib.mjs';
import { patchFileList } from './patch-state.mjs';

const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const real = (p) => { try { return fs.realpathSync(p); } catch { return path.resolve(p); } };
const q = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;
export const defaultDdev = (dir, args) => spawnSync('ddev', args, { cwd: dir, encoding: 'utf8', timeout: 120000 });

// The files whose bytes tell this side apart: core's version file plus every file the side's patches touch.
export function identifyingFiles(dir, labRoot, patchPaths = []) {
  const files = new Set(['core/lib/Drupal.php']);
  for (const p of patchPaths) { try { for (const f of patchFileList(fs.readFileSync(path.join(labRoot, p), 'utf8'))) files.add(f); } catch { /* a missing patch is reported by patch-state */ } }
  return [...files].filter((f) => fs.existsSync(path.join(dir, f))).sort();
}

// Database identity without credentials: the kind, the version, and where it lives (SQLite file or host and database name).
export function databaseIdentity(raw, dir) {
  const db = { type: raw.database_type || null, version: raw.database_version || null };
  if (raw.dbinfo && typeof raw.dbinfo === 'object') { db.host = raw.dbinfo.host || null; db.name = raw.dbinfo.dbname || null; }
  try {
    const settings = fs.readFileSync(path.join(dir, 'sites/default/settings.php'), 'utf8');
    if (/'driver'\s*=>\s*'sqlite'/.test(settings)) { db.type = 'sqlite'; db.file = (settings.match(/'database'\s*=>\s*'([^']+)'/) || [])[1] || null; delete db.host; delete db.name; }
  } catch { /* no settings.php: the site is not installed */ }
  return db;
}

// 1. The project DDEV answers with from this folder.
export function projectCheck({ env, dir, ddev = defaultDdev }) {
  const d = ddev(dir, ['describe', '-j']); let raw = null;
  try { raw = String(d.stdout || '').split('\n').map((l) => { try { return JSON.parse(l); } catch { return null; } }).find((o) => o && o.raw)?.raw || null; } catch { /* below */ }
  if (!raw) return { raw: null, problems: [`DDEV gave no project description in ${dir} (${String(d.stderr || d.error?.message || `exit ${d.status}`).trim().split('\n')[0]})`] };
  const problems = [], want = ddevName(env);
  if (raw.approot && real(raw.approot) !== real(dir)) problems.push(`DDEV answered from ${dir} with project ${raw.name} at ${raw.approot}, not this folder: the folder is not a registered project (DDEV falls back to the one around it) or the name belongs to another checkout. Register it there: cd ${dir} && ddev config --project-name=${want}`);
  else if (raw.name !== want) problems.push(`DDEV's project in ${dir} is ${raw.name}, but ${env} should be ${want}`);
  if (raw.status !== 'running') problems.push(`${raw.name || want} is ${raw.status || 'in an unknown state'}, not running`);
  return { raw, problems };
}

// 2. The container holds the host's bytes for the identifying files (one `ddev exec`, sha256sum in the container).
export function containerCheck({ dir, files, ddev = defaultDdev }) {
  if (!files.length) return { checked: 0, problems: [] };
  const r = ddev(dir, ['exec', `sha256sum ${files.map(q).join(' ')}`]);
  const inside = Object.fromEntries(String(r.stdout || '').split('\n').map((l) => l.match(/^([0-9a-f]{64})\s+\*?(.+)$/)).filter(Boolean).map((m) => [m[2].trim(), m[1]]));
  const differ = files.filter((f) => inside[f] !== sha(fs.readFileSync(path.join(dir, f))));
  if (r.status !== 0 && !Object.keys(inside).length) return { checked: 0, problems: [`could not read the files in the web container (${String(r.stderr || `exit ${r.status}`).trim().split('\n')[0]})`] };
  return { checked: files.length, problems: differ.length ? [`the web container's copy differs from this checkout for ${differ.slice(0, 4).join(', ')}${differ.length > 4 ? ` and ${differ.length - 4} more` : ''}: it is another installation, or Mutagen has not synced (ddev mutagen status)`] : [] };
}

// 3. The web server serves this folder: a one-off file in sites/default/files, fetched over HTTP, then removed.
export async function httpCheck({ env, dir, raw, get = (pathAndQuery) => envFetch(env, { host: raw.hostname, routerHttpsPort: Number(raw.router_https_port || 443) }, pathAndQuery), waitMs = 15000 }) {
  const filesDir = path.join(dir, 'sites/default/files');
  if (!fs.existsSync(filesDir)) return { problems: [`${filesDir} does not exist (is the site installed?), so the web server could not be checked`] };
  const token = crypto.randomBytes(12).toString('hex'), name = `.lab-identity-${token}.txt`, file = path.join(filesDir, name);
  const basePath = (() => { try { return new URL(raw.primary_url || raw.httpsurl || 'https://x/').pathname.replace(/\/$/, ''); } catch { return ''; } })();
  fs.writeFileSync(file, token);
  try {
    let last = '';
    for (const start = Date.now(); Date.now() - start < waitMs;) {   // Mutagen needs a moment to put the file in the container
      try { const r = await get(`${basePath}/sites/default/files/${name}`); if (r.status === 200 && String(r.body).trim() === token) return { basePath: basePath || '/', problems: [] }; last = `HTTP ${r.status}`; } catch (e) { last = e.code || e.message; }
      await new Promise((res) => setTimeout(res, 500));
    }
    return { basePath: basePath || '/', problems: [`${raw.primary_url || env} did not serve a file written into ${dir} (${last}): the URL is answered by another installation, or the file never reached the container`] };
  } finally { fs.rmSync(file, { force: true }); }
}

// All three for one side: { record, problems }. record never holds credentials.
export async function servingIdentity({ side, env, dir, labRoot, patchPaths = [], ddev = defaultDdev, get, http = true }) {
  const p = projectCheck({ env, dir, ddev }), record = { side, env, dir, ddevProject: p.raw?.name || null, approot: p.raw?.approot || null, status: p.raw?.status || null };
  if (!p.raw || p.problems.length) return { record, problems: p.problems };
  const web = p.raw.services?.web || {};
  Object.assign(record, { url: p.raw.primary_url || null, container: { name: web.full_name || `ddev-${p.raw.name}-web`, image: web.image || null }, database: databaseIdentity(p.raw, dir) });
  const files = identifyingFiles(dir, labRoot, patchPaths), c = containerCheck({ dir, files, ddev });
  record.containerFiles = { checked: c.checked, sha256: Object.fromEntries(files.map((f) => [f, sha(fs.readFileSync(path.join(dir, f))).slice(0, 16)])) };
  if (c.problems.length) return { record, problems: c.problems };
  if (!http) { record.http = 'not checked'; return { record, problems: [] }; }
  const h = await httpCheck({ env, dir, raw: p.raw, ...(get ? { get } : {}) });
  record.basePath = h.basePath || null; record.http = h.problems.length ? 'MISMATCH' : 'served a file written into this checkout';
  return { record, problems: h.problems };
}
