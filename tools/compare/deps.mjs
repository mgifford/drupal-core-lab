// The JavaScript packages the lab's own tools need, checked per task, and safe reuse of another checkout's installed tree.
// Two homes, both ignored by git and never committed:
//   playwright  tools/playwright/node_modules      from tools/playwright/package-lock.json (npm ci): Playwright, jsdom, Guidepup ...
//   deps        tools/compare/.deps/node_modules   ad hoc installs without a lockfile: axe-core@4, js-yaml@4, lighthouse
// A check RESOLVES each package the way the code that loads it does (ESM from tools/playwright/lib, CommonJS from .deps), so a
// dangling symlink, a tree made for another folder depth, or a package found in some parent folder is not reported as installed.
// Nothing here installs or deletes anything. linkPlan/applyLink only create a symlink where nothing that works would be replaced.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

export const HOMES = {
  playwright: { modules: 'tools/playwright/node_modules', lock: 'tools/playwright/package-lock.json', esmFrom: 'tools/playwright/lib',
    install: 'PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci --prefix tools/playwright' },
  deps: { modules: 'tools/compare/.deps/node_modules', lock: null, cjsFrom: 'tools/compare/.deps/node_modules/x.js',
    install: 'npm install --no-save --prefix tools/compare/.deps' },
};

export const PACKAGES = {
  '@playwright/test': { home: 'playwright' },
  '@axe-core/playwright': { home: 'playwright' },
  '@guidepup/virtual-screen-reader': { home: 'playwright' },
  jsdom: { home: 'playwright' },
  pngjs: { home: 'playwright' },
  gifenc: { home: 'playwright' },
  'js-yaml': { home: 'deps', major: 4 },
  'axe-core': { home: 'deps', major: 4 },
  lighthouse: { home: 'deps' },
};

// What each kind of work needs. `needs` names machine tools that scripts/doctor.mjs checks; a task without them does not fail on
// a missing Docker or DDEV. The packages listed for selftest are the ones its static unit tests load (js-yaml for issue packs and
// the usage baseline; jsdom and Guidepup for the unpublished-status speech tests). Browser binaries are only for browser tasks.
export const TASKS = {
  git: { packages: [], needs: [], what: 'git-only work (branches, commits, patches): no JavaScript packages' },
  selftest: { packages: ['js-yaml', 'jsdom', '@guidepup/virtual-screen-reader'], needs: [], what: 'node scripts/selftest.mjs (static: no DDEV, no browser)' },
  browser: { packages: ['@playwright/test', '@axe-core/playwright', 'jsdom', '@guidepup/virtual-screen-reader', 'pngjs', 'gifenc'], chromium: true, needs: ['docker', 'ddev'], what: 'evaluators, walkthroughs, tree-diff (a real browser against the sites)' },
  viewer: { packages: ['axe-core'], needs: ['docker', 'ddev'], what: 'the Before/After viewer with live axe' },
  lighthouse: { packages: ['lighthouse', '@playwright/test'], chromium: true, needs: ['docker', 'ddev'], what: 'Lighthouse in the viewer' },
};

const sha256 = (file) => { try { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); } catch { return null; } };
const readJson = (file) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } };
const inside = (child, parent) => { const r = path.relative(parent, child); return r === '' || (!r.startsWith('..') && !path.isAbsolute(r)); };

// What is at a node_modules path: absent, dir (a real folder), link (a symlink to a folder), dangling (a symlink to nothing), file.
export function pathState(p) {
  let st; try { st = fs.lstatSync(p); } catch { return { kind: 'absent' }; }
  if (st.isSymbolicLink()) {
    const target = fs.readlinkSync(p);
    try { return fs.statSync(p).isDirectory() ? { kind: 'link', target, real: fs.realpathSync(p) } : { kind: 'dangling', target }; } catch { return { kind: 'dangling', target }; }
  }
  return st.isDirectory() ? { kind: 'dir', real: fs.realpathSync(p) } : { kind: 'file' };
}

// A small subset of npm semver ranges, for `engines.node`: `||`, space-separated comparators, ^ ~ >= > <= < =, x and * parts.
// Returns true, false, or null (a range it does not understand: unknown, never a pass).
export function satisfies(version, range) {
  const v = String(version).replace(/^v/, '').split(/[.+-]/).slice(0, 3).map(Number);
  if (v.length < 3 || v.some(Number.isNaN)) return null;
  const cmp = (a, b) => { for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1; return 0; };
  const one = (c) => {
    const m = c.match(/^(\^|~|>=|<=|>|<|=)?v?(\d+|x|\*)(?:\.(\d+|x|\*))?(?:\.(\d+|x|\*))?$/); if (!m) return null;
    const op = m[1] || '', raw = [m[2], m[3], m[4]], wild = raw.findIndex((p) => p === undefined || p === 'x' || p === '*');
    const p = raw.map((x) => (x === undefined || x === 'x' || x === '*' ? 0 : Number(x)));
    if (op === '' || op === '=') { if (wild < 0) return cmp(v, p) === 0; return raw.slice(0, wild).every((x, i) => Number(x) === v[i]); }
    if (op === '>=') return cmp(v, p) >= 0; if (op === '>') return cmp(v, p) > 0; if (op === '<=') return cmp(v, p) <= 0; if (op === '<') return cmp(v, p) < 0;
    if (cmp(v, p) < 0) return false;
    if (op === '~') return v[0] === p[0] && (wild === 1 || v[1] === p[1]);
    const lead = p[0] > 0 || wild === 1 ? 0 : p[1] > 0 || wild === 2 ? 1 : 2;   // ^: the first non-zero part may not change
    return v.slice(0, lead + 1).every((x, i) => x === p[i]);
  };
  const alternatives = String(range || '').split('||').map((s) => s.trim().replace(/\s+-\s+/g, ' - '));
  let unknown = false;
  for (const alt of alternatives) {
    if (!alt || alt.includes(' - ')) { unknown = true; continue; }
    const results = alt.replace(/(\^|~|>=|<=|>|<|=)\s+/g, '$1').split(/\s+/).map(one);
    if (results.includes(null)) { unknown = true; continue; }
    if (results.every(Boolean)) return true;
  }
  return unknown ? null : false;
}

// Resolve packages as their users do. ESM needs a child process (import.meta.resolve takes no parent folder without a flag); it
// runs from the folder that imports them. CommonJS uses createRequire in this process (resolve only, nothing is loaded).
function resolveAll(labRoot, names, node = process.execPath) {
  const out = {};
  const esm = names.filter((n) => HOMES[PACKAGES[n].home].esmFrom), cjs = names.filter((n) => HOMES[PACKAGES[n].home].cjsFrom);
  if (esm.length) {
    const from = path.join(labRoot, HOMES.playwright.esmFrom);
    const code = `import {fileURLToPath} from 'node:url';const r={};for(const n of ${JSON.stringify(esm)}){try{r[n]={file:fileURLToPath(import.meta.resolve(n))}}catch(e){r[n]={error:e.code||e.message}}}console.log(JSON.stringify(r))`;
    const res = fs.existsSync(from) ? spawnSync(node, ['--input-type=module', '-e', code], { cwd: from, encoding: 'utf8', timeout: 30000 }) : { status: 1, stderr: `${from} does not exist` };
    let parsed = null; try { parsed = JSON.parse(res.stdout); } catch { /* the child failed */ }
    for (const n of esm) out[n] = parsed?.[n] || { error: `could not run the resolver: ${(res.stderr || res.error?.message || '').trim().split('\n')[0]}` };
  }
  for (const n of cjs) {
    try { out[n] = { file: createRequire(path.join(labRoot, HOMES.deps.cjsFrom)).resolve(n) }; } catch (e) { out[n] = { error: e.code || e.message }; }
  }
  return out;
}

// The package folder (node_modules/<name>) a resolved file belongs to.
function packageRoot(file, name) {
  const marker = `${path.sep}node_modules${path.sep}${name.split('/').join(path.sep)}${path.sep}`, i = file.lastIndexOf(marker);
  return i < 0 ? null : file.slice(0, i + marker.length - 1);
}

export function lockedVersion(labRoot, name, home = PACKAGES[name].home) {
  const lock = HOMES[home].lock && readJson(path.join(labRoot, HOMES[home].lock));
  return lock?.packages?.[`node_modules/${name}`]?.version || null;
}

// One row per package: status ok | missing | elsewhere | differs | wrong-major, plus engine (true, false, null) and the fix.
export function checkPackages(labRoot, names, { nodeVersion = process.versions.node, node } = {}) {
  const resolved = resolveAll(labRoot, names, node), rows = [];
  for (const name of names) {
    const spec = PACKAGES[name], home = HOMES[spec.home], modules = path.join(labRoot, home.modules), state = pathState(modules);
    const fix = spec.home === 'deps' ? `${home.install} ${name}${spec.major ? `@${spec.major}` : ''}` : home.install;
    const row = { name, home: spec.home, modules: home.modules, state: state.kind, status: 'ok', version: null, locked: lockedVersion(labRoot, name), engine: null, detail: '', fix };
    const r = resolved[name];
    if (r.error) {
      row.status = 'missing';
      row.detail = state.kind === 'dangling' ? `${home.modules} is a symlink to ${state.target}, which does not exist here` : `${r.error} (resolving from ${spec.home === 'deps' ? 'tools/compare/.deps' : HOMES.playwright.esmFrom})`;
      rows.push(row); continue;
    }
    const root = packageRoot(fs.realpathSync(r.file), name), pkg = root && readJson(path.join(root, 'package.json'));
    row.version = pkg?.version || null; row.resolved = root;
    const expected = state.kind === 'link' || state.kind === 'dir' ? state.real : null;
    if (!root || !expected || !inside(root, expected)) {
      row.status = 'elsewhere';
      row.detail = `resolved from ${root || r.file}, not from ${home.modules}${state.kind === 'absent' ? ' (which does not exist)' : ''}: a node_modules folder above this checkout answered`;
    } else if (row.locked && row.version !== row.locked) {
      row.status = 'differs'; row.detail = `installed ${row.version}, ${home.lock} locks ${row.locked}`;
    } else if (spec.major && Number(String(row.version).split('.')[0]) !== spec.major) {
      row.status = 'wrong-major'; row.detail = `installed ${row.version}, the lab expects ${spec.major}.x`;
    }
    const engines = pkg?.engines?.node;
    if (engines) { row.engine = satisfies(nodeVersion, engines); row.engines = engines; }
    rows.push(row);
  }
  return rows;
}

// Is Playwright's own Chromium on this machine? Only browser tasks ask. Browsers live in a per-user cache, shared by checkouts.
export function chromiumState(labRoot, node = process.execPath) {
  const cwd = path.join(labRoot, 'tools/playwright');
  if (!fs.existsSync(cwd)) return { ok: false, detail: 'tools/playwright is missing' };
  const code = "Promise.all([import('@playwright/test'),import('node:fs')]).then(([{chromium},fs])=>{const p=chromium.executablePath();console.log(JSON.stringify({p,ok:fs.existsSync(p)}))}).catch((e)=>console.log(JSON.stringify({error:e.code||e.message})))";
  const r = spawnSync(node, ['--input-type=module', '-e', code], { cwd, encoding: 'utf8', timeout: 30000 });
  let j = null; try { j = JSON.parse(r.stdout.trim().split('\n').pop()); } catch { /* ignore */ }
  if (!j || j.error) return { ok: false, detail: `Playwright did not load (${j?.error || 'no answer'})` };
  return { ok: j.ok, detail: j.ok ? j.p : `not installed (${j.p})`, fix: 'cd tools/playwright && npx playwright install chromium   (about 150 MB, shared by every checkout on this machine)' };
}

// The verdict for a task: a required package that does not resolve, or resolves from outside its home (some parent folder's
// node_modules: an unknown version the lab's own loaders do not look at), is a problem. A version that differs from the lockfile, a
// major the lab does not expect, or a Node.js outside a package's declared engines is a warning: the code may still run; say so.
export function checkTask(labRoot, task, options = {}) {
  const t = TASKS[task]; if (!t) throw new Error(`unknown task ${task}; known: ${Object.keys(TASKS).join(', ')}`);
  const rows = checkPackages(labRoot, t.packages, options);
  const problems = rows.filter((r) => r.status === 'missing' || r.status === 'elsewhere');
  const warnings = rows.filter((r) => r.status === 'differs' || r.status === 'wrong-major' || r.engine === false);
  const chromium = t.chromium && !problems.some((r) => r.name === '@playwright/test') ? chromiumState(labRoot, options.node) : null;
  const fixes = [...new Set(problems.map((r) => r.fix))];
  return { task, what: t.what, ok: !problems.length && (!chromium || chromium.ok), rows, problems, warnings, chromium, fixes };
}

export function describeRow(r, nodeVersion = process.versions.node) {
  const engine = r.engine === false ? `; declares node ${r.engines}, this is ${nodeVersion}` : r.engine === null && r.engines ? `; engines "${r.engines}" not understood` : '';
  return `${r.name}${r.version ? ` ${r.version}` : ''} (${r.modules})${r.detail ? `: ${r.detail}` : ''}${engine}`;
}

// The checkout git calls primary (the one whose .git is a folder). In a secondary worktree `.git` is a file, so this asks git.
export function primaryCheckout(dir) {
  const r = spawnSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd: dir, encoding: 'utf8' });
  if (r.status !== 0) return null;
  const common = r.stdout.trim();
  return path.basename(common) === '.git' ? path.dirname(common) : null;
}

// Can `labRoot` use `from`'s installed packages through a symlink? One entry per home: link | already | refuse | skip, with the reason.
// A real folder at the destination is never replaced, nor a working symlink to somewhere else; a dangling symlink (it holds no data)
// is. The playwright home is shared only when both lockfiles are byte-identical and every locked package is installed at its locked
// version in the source; the deps home only when the source has each package at the major the lab expects.
export function linkPlan(labRoot, from) {
  const plan = [];
  for (const [home, h] of Object.entries(HOMES)) {
    const dest = path.join(labRoot, h.modules), src = path.join(from, h.modules), d = pathState(dest), s = pathState(src);
    const entry = { home, dest: h.modules, source: src };
    if (path.resolve(from) === path.resolve(labRoot)) { plan.push({ ...entry, action: 'refuse', reason: 'the source is this checkout' }); continue; }
    if (s.kind !== 'dir' && s.kind !== 'link') { plan.push({ ...entry, action: 'skip', reason: `${src} is not installed (${s.kind})` }); continue; }
    if (d.kind === 'link' && d.real === s.real) { plan.push({ ...entry, action: 'already', reason: `already a link to ${s.real}` }); continue; }
    if (d.kind === 'dir') { plan.push({ ...entry, action: 'refuse', reason: `${h.modules} is a real folder here (installed packages); it is not replaced. Use it, or move it aside yourself first` }); continue; }
    if (d.kind === 'link') { plan.push({ ...entry, action: 'refuse', reason: `${h.modules} is already a working symlink to ${d.real}; not replaced` }); continue; }
    if (d.kind === 'file') { plan.push({ ...entry, action: 'refuse', reason: `${h.modules} is a file; not replaced` }); continue; }
    if (h.lock) {
      const a = sha256(path.join(labRoot, h.lock)), b = sha256(path.join(from, h.lock));
      if (!a || a !== b) { plan.push({ ...entry, action: 'refuse', reason: `${h.lock} differs between the two checkouts (${a ? a.slice(0, 12) : 'missing'} here, ${b ? b.slice(0, 12) : 'missing'} there): install here instead (${h.install})` }); continue; }
      const lock = readJson(path.join(labRoot, h.lock)), off = [];
      for (const [key, meta] of Object.entries(lock?.packages || {})) {
        if (!key.startsWith('node_modules/') || meta.optional || meta.peer) continue;
        const got = readJson(path.join(s.real, key.slice('node_modules/'.length), 'package.json'))?.version;
        if (got !== meta.version) off.push(`${key.slice(13)} ${got || 'missing'} (locked ${meta.version})`);
      }
      if (off.length) { plan.push({ ...entry, action: 'refuse', reason: `the source tree is not the locked tree: ${off.slice(0, 4).join(', ')}${off.length > 4 ? ` and ${off.length - 4} more` : ''}. Run ${h.install} there first` }); continue; }
    } else {
      const off = Object.entries(PACKAGES).filter(([, p]) => p.home === home && p.major).map(([n, p]) => [n, p.major, readJson(path.join(s.real, n, 'package.json'))?.version])
        .filter(([, major, got]) => got && Number(got.split('.')[0]) !== major);
      if (off.length) { plan.push({ ...entry, action: 'refuse', reason: `the source has ${off.map(([n, m, g]) => `${n} ${g} (the lab expects ${m}.x)`).join(', ')}` }); continue; }
    }
    plan.push({ ...entry, action: 'link', reason: d.kind === 'dangling' ? `replaces a dangling symlink (${d.target})` : 'nothing there yet', target: s.real, replaceDangling: d.kind === 'dangling' });
  }
  return plan;
}

// Carry out the `link` entries of a plan. Absolute targets: the link is local to this machine and never committed.
export function applyLink(labRoot, plan) {
  for (const p of plan.filter((x) => x.action === 'link')) {
    const dest = path.join(labRoot, p.dest);
    if (p.replaceDangling && pathState(dest).kind === 'dangling') fs.unlinkSync(dest);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.symlinkSync(p.target, dest, 'dir');
  }
}

// Dependency trees and machine-specific symlinks must not be tracked: a node_modules or .deps path, or a symlink whose target is
// absolute or leaves the repository (tools/playwright/node_modules was one: `../../../../../tools/playwright/node_modules`).
export function trackedDependencyProblems(repo) {
  const ls = spawnSync('git', ['ls-files', '-s', '-z'], { cwd: repo, encoding: 'utf8', maxBuffer: 1 << 28 });
  if (ls.status !== 0) return [{ path: '.', problem: `git ls-files failed: ${ls.stderr.trim()}` }];
  const problems = [];
  for (const rec of ls.stdout.split('\0').filter(Boolean)) {
    const [meta, file] = rec.split('\t'), [mode, blob] = meta.split(' ');
    if (file.split('/').some((seg) => seg === 'node_modules' || seg === '.deps')) problems.push({ path: file, problem: `a dependency tree is tracked${mode === '120000' ? ' (as a symlink)' : ''}` });
    else if (mode === '120000') {
      const target = spawnSync('git', ['cat-file', 'blob', blob], { cwd: repo, encoding: 'utf8' }).stdout;
      const norm = path.posix.normalize(path.posix.join(path.posix.dirname(file), target));
      if (path.posix.isAbsolute(target) || norm.startsWith('../') || norm === '..') problems.push({ path: file, problem: `a symlink to ${target}, outside the repository` });
    }
  }
  return problems;
}
