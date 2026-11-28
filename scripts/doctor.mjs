// Preflight: is this machine ready to run the lab? Prints PASS / WARN / FAIL with the command that fixes each problem.
//   node scripts/doctor.mjs [slug]      (with a slug, also checks that variant's environments and the viewer)
//   node scripts/doctor.mjs <slug> --network [--core-url=<mirror>]   also: can the hosts a build of that variant needs be reached? (before a build fails ten minutes in)
//   node scripts/doctor.mjs --for=<git|selftest|browser|viewer|lighthouse>   only what that task needs (tools/compare/deps.mjs): a git-only
//        task does not fail on a missing Docker, a static selftest does not need a browser; that task's missing packages FAIL
// Exit code 1 if anything FAILs. Read-only: it changes nothing.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { labRoot, variants, envDir } from '../tools/compare/lib.mjs';
import { hostsFor, checkHosts } from '../tools/compare/hosts.mjs';
import { TASKS, checkTask, describeRow, primaryCheckout } from '../tools/compare/deps.mjs';
import { measure, assessResources } from '../tools/compare/preflight.mjs';


// A publication check is not a machine preflight: it needs the network. It is explicit and delegates to the existing
// preparation tool, which never pushes. Default doctor remains fast and read-only.
const argv = process.argv.slice(2);
const flag = (name) => { const eq = argv.find((a) => a.startsWith(`--${name}=`)); if (eq) return eq.slice(name.length + 3); const i = argv.indexOf(`--${name}`); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : ''; };
const purpose = flag('purpose');
if (purpose) {
  if (purpose !== 'publish') { console.error(`Unknown --purpose=${purpose}; known: publish`); process.exit(2); }
  const issue = flag('issue');
  if (!/^\d{5,8}$/.test(issue)) { console.error('doctor --purpose publish needs --issue <nid>'); process.exit(2); }
  const a = [path.join(labRoot, 'scripts/prepare-push.mjs'), issue];
  for (const [from, to] of [['worktree', 'repo'], ['branch', 'source-branch'], ['remote', 'push-url'], ['fetch-url', 'fetch-url'], ['local', 'local'], ['target', 'target'], ['core-url', 'core-url'], ['patch', 'patch'], ['base', 'base']]) { const v = flag(from); if (v) a.push(`--${to}`, v); }
  if (argv.includes('--offline')) a.push('--offline');
  if (argv.includes('--json')) a.push('--json');
  if (argv.includes('--repair-history')) a.push('--fetch');
  if (argv.includes('--repair-history')) console.error('doctor: --repair-history runs only the bounded fetch plan; it never pushes or publishes.');
  const r = spawnSync(process.execPath, a, { cwd: labRoot, stdio: 'inherit', env: process.env });
  process.exit(r.status == null ? 2 : r.status);
}
const slug = argv.find((a) => !a.startsWith('--'));
const task = (argv.find((a) => a.startsWith('--for=')) || '').slice('--for='.length);
if (task && !TASKS[task]) { console.error(`Unknown task --for=${task}. Known: ${Object.keys(TASKS).join(', ')}`); process.exit(2); }
// Without --for: the whole lab (build and run comparisons), as before. With it: only that task's machine tools.
const needs = task ? TASKS[task].needs : ['docker', 'ddev'];
const rows = []; let failed = 0;
const add = (level, what, detail, fix) => { rows.push({ level, what, detail, fix }); if (level === 'FAIL') failed++; };
const sh = (cmd, args, opts = {}) => { const r = spawnSync(cmd, args, { encoding: 'utf8', timeout: 20000, ...opts }); return { ok: r.status === 0, out: `${r.stdout || ''}${r.stderr || ''}`.trim() }; };
const ver = (s) => (String(s).match(/(\d+)\.(\d+)(?:\.(\d+))?/) || []).slice(1).map((n) => Number(n || 0));
const atLeast = (have, want) => { for (let i = 0; i < want.length; i++) { if ((have[i] || 0) > want[i]) return true; if ((have[i] || 0) < want[i]) return false; } return true; };

// Node
const nv = process.versions.node.split('.').map(Number);
add(atLeast(nv, [20]) ? (atLeast(nv, [22, 19]) ? 'PASS' : 'WARN') : 'FAIL', 'Node.js', process.versions.node, atLeast(nv, [20]) ? 'Lighthouse (optional) needs 22.19 or newer' : 'Install Node 20 or newer');
// git
const g = sh('git', ['--version']); add(g.ok ? 'PASS' : 'FAIL', 'git', g.out, 'Install git');
// Docker
if (needs.includes('docker')) {
  const d = sh('docker', ['info', '--format', '{{.ServerVersion}}']);
  add(d.ok ? 'PASS' : 'FAIL', 'Docker running', d.ok ? d.out : 'not reachable', 'Start Docker Desktop (or Colima / OrbStack)');
}
// DDEV
if (needs.includes('ddev')) {
  const dv = sh('ddev', ['--version']);
  add(dv.ok ? (atLeast(ver(dv.out), [1, 24]) ? 'PASS' : 'WARN') : 'FAIL', 'DDEV', dv.out || 'not installed', dv.ok ? 'Upgrade: DDEV 1.24 or newer is expected' : 'Install DDEV: https://ddev.com/get-started/');
  // Disk, memory, Docker memory and running pairs: the same checks setup.mjs and lab-run.mjs enforce before a build. Work that uses no
  // sites (--for=git, --for=selftest) does not need them.
  for (const c of assessResources(measure({ root: labRoot })).checks) {
    add(c.status === 'block' ? 'FAIL' : c.status === 'warn' ? 'WARN' : 'PASS', c.label, c.value, c.detail);
  }
}
// Shared core clone
const bare = path.join(labRoot, 'envs/core.git');
add(fs.existsSync(bare) ? 'PASS' : 'WARN', 'Shared core clone (envs/core.git)', fs.existsSync(bare) ? 'present' : 'not yet created', 'Created by: node tools/compare/setup.mjs <slug>');
// JavaScript packages, resolved the way the lab loads them (tools/compare/deps.mjs). With --for, that task's are required; without it,
// each kind of work is reported and nothing here fails (optional until that work is done).
const secondary = primaryCheckout(labRoot), linkHint = secondary && secondary !== labRoot ? `; in this worktree, reuse ${secondary}'s: node scripts/deps.mjs link` : '';
for (const t of task ? [task] : ['selftest', 'browser', 'viewer']) {
  const r = checkTask(labRoot, t), level = task ? 'FAIL' : 'WARN';
  if (!TASKS[t].packages.length) { add('PASS', `Packages for ${t}`, 'none needed'); continue; }
  if (!r.problems.length) add('PASS', `Packages for ${t}`, r.rows.map((x) => `${x.name} ${x.version}`).join(', '));
  for (const x of r.problems) add(level, `Package for ${t}`, describeRow(x), `${x.fix}${linkHint}`);
  for (const x of r.warnings) add('WARN', `Package for ${t}`, describeRow(x), x.engine === false ? `Use a Node.js inside ${x.engines} (the code may still run; the package does not promise it)` : x.fix);
  if (r.chromium) add(r.chromium.ok ? 'PASS' : level, `Playwright Chromium (${t})`, r.chromium.ok ? 'installed' : r.chromium.detail, r.chromium.fix || 'cd tools/playwright && npx playwright install chromium');
}
// Running DDEV projects and the viewer: only for work that uses the sites
if (needs.includes('ddev')) {
  const ls = sh('ddev', ['list', '-j']);
  let running = {};
  try { for (const p of JSON.parse(ls.out).raw || []) if (p.approot) running[p.approot] = p.status; } catch { /* ddev list unavailable */ }
  if (slug) {
    const v = variants().find((x) => x.slug === slug);
    if (!v) add('FAIL', `Variant ${slug}`, 'unknown', `Known: ${variants().map((x) => x.slug).join(', ')}`);
    else for (const side of ['before', 'after']) {
      const e = v[side].env, dir = envDir(e);
      if (!fs.existsSync(path.join(dir, '.ddev/config.yaml'))) add('WARN', `${side}: ${e}`, 'not built', `node tools/compare/setup.mjs ${slug}`);
      else add(running[dir] === 'running' ? 'PASS' : 'WARN', `${side}: ${e}`, running[dir] || 'stopped', `node scripts/lab-env.mjs start ${slug}`);
    }
  }
  if (process.argv.includes('--network')) {
    const v = slug && variants().find((x) => x.slug === slug);
    if (!v) add('FAIL', 'Network check', 'needs a known variant: node scripts/doctor.mjs <slug> --network', `Known: ${variants().map((x) => x.slug).join(', ')}`);
    else {
      const coreUrl = (process.argv.find((a) => a.startsWith('--core-url=')) || '').slice('--core-url='.length) || process.env.LAB_CORE_URL || '';
      for (const h of await checkHosts(hostsFor(v, { coreUrl }))) {
        const contrib = h.why.some((w) => w.startsWith('contrib module') || w.startsWith('contrib theme') || w.startsWith('contrib project'));
        add(h.ok ? 'PASS' : 'FAIL', `Network: ${h.host}`, `${h.ok ? 'reachable' : 'NOT reachable'} (${h.detail}); needed for ${h.why.join('; ')}`,
          contrib ? 'a contrib project is cloned from its own URL; seed it from a machine that can reach it, or build where it is reachable' : /Drupal core/.test(h.why.join()) ? `use a mirror (--core-url=<url>) or seed from a checkout (--core-from=<path>, --use-existing-core); see tools/compare/cloud/README.md` : 'this host is needed for the build; no lab option replaces it');
      }
    }
  }
  const viewer = await new Promise((res) => { const q = http.get('http://localhost:8100/api/health', { timeout: 3000 }, (r) => { let b = ''; r.on('data', (c) => (b += c)); r.on('end', () => res(b)); }); q.on('error', () => res(null)); q.on('timeout', () => { q.destroy(); res(null); }); });
  add(viewer ? 'PASS' : 'WARN', 'Viewer (localhost:8100)', viewer ? viewer.slice(0, 120) : 'not running', 'node scripts/lab-env.mjs start <slug>   (also starts the viewer)');
}

const mark = { PASS: 'PASS', WARN: 'WARN', FAIL: 'FAIL' };
for (const r of rows) console.log(`${mark[r.level]}  ${r.what}: ${r.detail}${r.level === 'PASS' ? '' : `\n      fix: ${r.fix}`}`);
console.log(`\n${failed ? `${failed} problem(s) must be fixed first.` : 'Nothing blocking.'} WARN lines are optional or not needed yet.`);
process.exit(failed ? 1 : 0);
