// Preflight: is this machine ready to run the lab? Prints PASS / WARN / FAIL with the command that fixes each problem.
//   node scripts/doctor.mjs [slug]      (with a slug, also checks that variant's environments and the viewer)
// Exit code 1 if anything FAILs. Read-only: it changes nothing.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { labRoot, variants, envDir } from '../tools/compare/lib.mjs';

const slug = process.argv.slice(2).find((a) => !a.startsWith('--'));
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
const d = sh('docker', ['info', '--format', '{{.ServerVersion}}']);
add(d.ok ? 'PASS' : 'FAIL', 'Docker running', d.ok ? d.out : 'not reachable', 'Start Docker Desktop (or Colima / OrbStack)');
// DDEV
const dv = sh('ddev', ['--version']);
add(dv.ok ? (atLeast(ver(dv.out), [1, 24]) ? 'PASS' : 'WARN') : 'FAIL', 'DDEV', dv.out || 'not installed', dv.ok ? 'Upgrade: DDEV 1.24 or newer is expected' : 'Install DDEV: https://ddev.com/get-started/');
// Disk
try {
  const df = sh('df', ['-k', labRoot]).out.split('\n').pop().split(/\s+/); const freeGB = Number(df[3]) / 1048576;
  add(freeGB >= 15 ? 'PASS' : freeGB >= 3 ? 'WARN' : 'FAIL', 'Free disk', `${freeGB.toFixed(1)} GB`, 'Building two environments needs about 10 GB; running ones need little. Below 3 GB things fail in odd ways. Free space: node scripts/lab-env.mjs delete <slug> --yes (a variant you are not using), docker builder prune, remove ~/Library/Caches/ms-playwright (reinstall later)');
} catch { add('WARN', 'Free disk', 'could not read', 'Check with df -h'); }
// Shared core clone
const bare = path.join(labRoot, 'envs/core.git');
add(fs.existsSync(bare) ? 'PASS' : 'WARN', 'Shared core clone (envs/core.git)', fs.existsSync(bare) ? 'present' : 'not yet created', 'Created by: node tools/compare/setup.mjs <slug>');
// Viewer dependencies
const axe = path.join(labRoot, 'tools/compare/.deps/node_modules/axe-core');
add(fs.existsSync(axe) ? 'PASS' : 'WARN', 'axe-core for the live checks (optional)', fs.existsSync(axe) ? 'installed' : 'missing', 'node tools/compare/setup.mjs <slug>   or   npm install --prefix tools/compare/.deps axe-core@4');
const pw = path.join(labRoot, 'tools/playwright/node_modules/@playwright/test');
add(fs.existsSync(pw) ? 'PASS' : 'WARN', 'Playwright package (walkthroughs)', fs.existsSync(pw) ? 'installed' : 'missing', 'cd tools/playwright && npm install');
if (fs.existsSync(pw)) {
  const r = sh('node', ['-e', "const {chromium}=require('@playwright/test');console.log(require('fs').existsSync(chromium.executablePath()))"], { cwd: path.join(labRoot, 'tools/playwright') });
  add(r.out.endsWith('true') ? 'PASS' : 'WARN', 'Playwright Chromium', r.out.endsWith('true') ? 'installed' : 'not installed', 'cd tools/playwright && npx playwright install chromium (about 150 MB)');
}
// Running DDEV projects and the viewer
const ls = sh('ddev', ['list', '-j']);
let running = {};
try { for (const p of JSON.parse(ls.out).raw || []) if (p.approot) running[p.approot] = p.status; } catch { /* ddev list unavailable */ }
const labRunning = Object.entries(running).filter(([a, s]) => a.startsWith(path.join(labRoot, 'envs')) && s === 'running').length;
add(labRunning <= 3 ? 'PASS' : 'WARN', 'Lab DDEV projects running', String(labRunning), 'Normal is 2. Stop others: node scripts/lab-env.mjs stop <slug|all>');
if (slug) {
  const v = variants().find((x) => x.slug === slug);
  if (!v) add('FAIL', `Variant ${slug}`, 'unknown', `Known: ${variants().map((x) => x.slug).join(', ')}`);
  else for (const side of ['before', 'after']) {
    const e = v[side].env, dir = envDir(e);
    if (!fs.existsSync(path.join(dir, '.ddev/config.yaml'))) add('WARN', `${side}: ${e}`, 'not built', `node tools/compare/setup.mjs ${slug}`);
    else add(running[dir] === 'running' ? 'PASS' : 'WARN', `${side}: ${e}`, running[dir] || 'stopped', `node scripts/lab-env.mjs start ${slug}`);
  }
}
const viewer = await new Promise((res) => { const q = http.get('http://localhost:8100/api/health', { timeout: 3000 }, (r) => { let b = ''; r.on('data', (c) => (b += c)); r.on('end', () => res(b)); }); q.on('error', () => res(null)); q.on('timeout', () => { q.destroy(); res(null); }); });
add(viewer ? 'PASS' : 'WARN', 'Viewer (localhost:8100)', viewer ? viewer.slice(0, 120) : 'not running', 'node scripts/lab-env.mjs start <slug>   (also starts the viewer)');

const mark = { PASS: 'PASS', WARN: 'WARN', FAIL: 'FAIL' };
for (const r of rows) console.log(`${mark[r.level]}  ${r.what}: ${r.detail}${r.level === 'PASS' ? '' : `\n      fix: ${r.fix}`}`);
console.log(`\n${failed ? `${failed} problem(s) must be fixed first.` : 'Nothing blocking.'} WARN lines are optional or not needed yet.`);
process.exit(failed ? 1 : 0);
