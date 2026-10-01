// Start, stop and inspect the lab's DDEV environments by variant name. Two sites at a time is the normal state:
// a core, and the same core with an issue's patch.
//   node scripts/lab-env.mjs status                 what exists, what is running, which variant uses it
//   node scripts/lab-env.mjs start <slug> [--browser]  start both environments AND the side-by-side viewer (retries DDEV's router flake);
//                                                   --browser also opens the viewer in the lab browser (forced-colours switch built in, own profile in .lab-browser)
//   node scripts/lab-env.mjs browser [--reset]      open the viewer in the lab browser (needs the viewer running); --reset deletes its saved profile
//   node scripts/lab-env.mjs stop <slug|all>        stop the viewer and both environments (data is kept; start brings them back)
//   Viewer: https://drupal-compare.ddev.site (needs `ddev start` once in tools/compare/site) or http://localhost:8100. Log: .lab-viewer.log; pid: .lab-viewer.pid (both gitignored).
//   node scripts/lab-env.mjs delete <slug> --yes    DELETE both environments and their worktrees (rebuild with setup.mjs)
// `stop all` stops every lab environment but leaves the small drupal-compare address project running.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawnSync, execFileSync, spawn } from 'node:child_process';
import { labRoot, variants, envDir } from '../tools/compare/lib.mjs';

const [cmd, target] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const yes = process.argv.includes('--yes');
const wantBrowser = process.argv.includes('--browser');
const viewerApi = (body) => new Promise((resolve, reject) => { const q = http.request({ host: 'localhost', port: 8100, path: '/api/emulation', method: 'POST', timeout: 60000 }, (r) => { let b = ''; r.on('data', (c) => (b += c)); r.on('end', () => { if (r.statusCode === 200) resolve(b); else { const e = new Error(b || `HTTP ${r.statusCode}`); e.http = true; reject(e); } }); }); q.on('error', reject); q.on('timeout', () => q.destroy(new Error('timed out'))); q.end(JSON.stringify(body)); });
async function openLabBrowser() { for (let i = 0; i < 30; i++) { try { await viewerApi({ open: true, mode: 'normal' }); console.log('Opened the viewer in the lab browser (Browser colour emulation switch is on the page).'); return; } catch (e) { if (e.http) { console.error('Could not open the lab browser: ' + e.message); return; } await new Promise((r) => setTimeout(r, 1000)); } } console.error('The viewer did not answer; start it first.'); }
const vs = variants();
const envsDir = path.join(labRoot, 'envs');
const allEnvs = fs.existsSync(envsDir) ? fs.readdirSync(envsDir).filter((d) => fs.existsSync(path.join(envsDir, d, '.ddev/config.yaml'))) : [];
const envsOf = (slug) => { const v = vs.find((x) => x.slug === slug); if (!v) { console.error(`unknown variant: ${slug}. Variants: ${vs.map((x) => x.slug).join(', ')}`); process.exit(1); } return [v.before.env, v.after.env]; };
const ddev = (dir, args, opts = {}) => spawnSync('ddev', args, { cwd: dir, stdio: 'inherit', ...opts });
const pidFile = path.join(labRoot, '.lab-viewer.pid'), logFile = path.join(labRoot, '.lab-viewer.log');
function stopViewer() {
  try { const pid = Number(fs.readFileSync(pidFile, 'utf8')); if (pid) process.kill(pid); } catch { /* not running */ }
  spawnSync('pkill', ['-f', 'tools/compare/serve.mjs']); fs.rmSync(pidFile, { force: true });
}
function startViewer(slug) {
  stopViewer();
  // the address project (drupal-compare.ddev.site) forwards to the viewer; start it if present
  const site = path.join(labRoot, 'tools/compare/site');
  let ddevAddr = false;
  if (fs.existsSync(path.join(site, '.ddev/config.yaml'))) ddevAddr = ddev(site, ['start'], { stdio: 'ignore' }).status === 0;
  const out = fs.openSync(logFile, 'w');
  const child = spawn('node', ['tools/compare/serve.mjs', ...(ddevAddr ? ['--ddev'] : []), slug], { cwd: labRoot, detached: true, stdio: ['ignore', out, out] });
  child.unref(); fs.writeFileSync(pidFile, String(child.pid));
  return ddevAddr ? 'https://drupal-compare.ddev.site' : 'http://localhost:8100';
}
const state = () => { try { const raw = JSON.parse(execFileSync('ddev', ['list', '-j'], { encoding: 'utf8' })).raw; return Object.fromEntries(raw.filter((p) => p.approot).map((p) => [p.approot, p])); } catch { return {}; } };

function status() {
  const st = state(); const usedBy = {};
  for (const v of vs) for (const e of [v.before.env, v.after.env]) (usedBy[e] ||= []).push(v.slug);
  console.log('Environment                    State     Project / URL                                     Used by');
  for (const e of allEnvs) { const p = st[envDir(e)] || {}; console.log(`${e.padEnd(30)} ${(p.status || 'unknown').padEnd(9)} ${(p.name ? p.name + ' ' + (p.httpsurl || '') : '').padEnd(49).slice(0, 49)} ${(usedBy[e] || ['(no variant)']).join(', ')}`); }
  const running = allEnvs.filter((e) => (st[envDir(e)] || {}).status === 'running').length;
  console.log(`\n${running} lab environment(s) running. Normal state: 2 (a core and the same core with an issue's patch).`);
}

switch (cmd) {
  case 'status': case undefined: status(); break;
  case 'start': {
    if (!target) { console.error('usage: start <slug>'); process.exit(2); }
    for (const e of envsOf(target)) {
      if (!fs.existsSync(path.join(envDir(e), '.ddev/config.yaml'))) { console.error(`${e} does not exist yet. Build it: node tools/compare/setup.mjs ${target}`); process.exit(1); }
      let ok = false; for (let i = 1; i <= 3 && !ok; i++) { ok = ddev(envDir(e), ['start']).status === 0; if (!ok) { console.log('Failed; DDEV\'s router sometimes times out and recovers. Waiting 20 s and retrying.'); spawnSync('sleep', ['20']); } }
      if (!ok) { console.error(`could not start ${e}`); process.exit(1); }
    }
    const url = startViewer(target);
    if (wantBrowser) await openLabBrowser();
    console.log(`\nStarted both environments of ${target} and the viewer: ${url}\n(The viewer shows a "still loading" message until both sites answer.) Stop everything: node scripts/lab-env.mjs stop ${target}`); break; }
  case 'browser': {
    if (process.argv.includes('--reset')) { try { await viewerApi({ close: true }); } catch { /* viewer not running */ } fs.rmSync(path.join(labRoot, '.lab-browser'), { recursive: true, force: true }); console.log('Deleted the lab browser profile (saved choices, ticks and notes).'); break; }
    await openLabBrowser(); break; }
  case 'stop': {
    if (!target) { console.error('usage: stop <slug|all>'); process.exit(2); }
    stopViewer();
    for (const e of target === 'all' ? allEnvs : envsOf(target)) { if (fs.existsSync(envDir(e))) { process.stdout.write(`${e}: `); ddev(envDir(e), ['stop']); } }
    break; }
  case 'delete': {
    if (!target) { console.error('usage: delete <slug> --yes'); process.exit(2); }
    const list = envsOf(target); if (!yes) { console.error(`This DELETES ${list.join(' and ')} (containers, database and worktree). Evidence in reports/ is kept. Re-run with --yes.`); process.exit(2); }
    for (const e of list) { if (!fs.existsSync(envDir(e))) continue; ddev(envDir(e), ['delete', '--omit-snapshot', '--yes']); spawnSync('git', ['-C', path.join(envsDir, 'core.git'), 'worktree', 'remove', '--force', envDir(e)], { stdio: 'inherit' }); }
    break; }
  default: console.error('usage: lab-env.mjs status | start <slug> [--browser] | browser [--reset] | stop <slug|all> | delete <slug> --yes'); process.exit(2);
}
