// Start, stop and inspect the lab's DDEV environments by variant name. Two sites at a time is the normal state:
// a core, and the same core with an issue's patch.
//   node scripts/lab-env.mjs status                 what exists, what is running, which variant uses it
//   node scripts/lab-env.mjs start <slug> [--browser]  start both environments AND the side-by-side viewer (retries DDEV's router flake);
//                                                   --browser also opens the viewer in the lab browser (forced-colours switch built in, own profile in .lab-browser)
//   node scripts/lab-env.mjs browser [--reset]      open the viewer in the lab browser (needs the viewer running); --reset deletes its saved profile
//   node scripts/lab-env.mjs stop <slug|all>        stop the viewer and both environments (data is kept; start brings them back)
//   Viewer: https://drupal-compare.ddev.site (needs `ddev start` once in tools/compare/site) or http://localhost:8100. Log: .lab-viewer.log; pid: .lab-viewer.pid (both gitignored).
//   node scripts/lab-env.mjs delete <slug> --yes    DELETE both environments and their worktrees (rebuild with setup.mjs)
//   node scripts/lab-env.mjs retire <slug> --yes    delete, but only once the issue's evidence is safe: refuses while reports/issues/<nid>/ has
//                                                   uncommitted or unpushed changes, or while the baseline has undeclared edits (--force overrides)
//   node scripts/lab-env.mjs reset <slug> --yes     reset both SITES (database and files) to the variant's starting state: minutes, almost no disk, keeps checkout and patches
//   node scripts/lab-env.mjs trim <slug|all> [--deep]  free regenerable disk space (test output, snapshots); --deep also removes core/node_modules (about 400 MB each)
//   node scripts/lab-env.mjs disk                   free space, what each environment uses, and what is safe to remove
// `stop all` stops every lab environment but leaves the small drupal-compare address project running.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawnSync, execFileSync, spawn } from 'node:child_process';
import { labRoot, variants, envDir } from '../tools/compare/lib.mjs';
import { identity, headOf } from '../tools/compare/env-state.mjs';
import { patchState } from '../tools/compare/patch-state.mjs';

const [cmd, target] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const yes = process.argv.includes('--yes');
const wantBrowser = process.argv.includes('--browser');
const viewerApi = (body) => new Promise((resolve, reject) => { const q = http.request({ host: 'localhost', port: 8100, path: '/api/emulation', method: 'POST', timeout: 60000 }, (r) => { let b = ''; r.on('data', (c) => (b += c)); r.on('end', () => { if (r.statusCode === 200) resolve(b); else { const e = new Error(b || `HTTP ${r.statusCode}`); e.http = true; reject(e); } }); }); q.on('error', reject); q.on('timeout', () => q.destroy(new Error('timed out'))); q.end(JSON.stringify(body)); });
async function openLabBrowser() { for (let i = 0; i < 30; i++) { try { await viewerApi({ open: true, mode: 'normal' }); console.log('Opened the viewer in the lab browser (Browser colour emulation switch is on the page).'); return; } catch (e) { if (e.http) { console.error('Could not open the lab browser: ' + e.message); return; } await new Promise((r) => setTimeout(r, 1000)); } } console.error('The viewer did not answer; start it first.'); }
const vs = variants();
const envsDir = path.join(labRoot, 'envs');
const allEnvs = fs.existsSync(envsDir) ? fs.readdirSync(envsDir).filter((d) => fs.existsSync(path.join(envsDir, d, '.ddev/config.yaml'))) : [];
// Environments live in envs/ of the checkout they were built in. A git worktree of this repository (for example
// .claude/worktrees/<name>) has none, so a command run there used to skip every environment and exit 0 without a word.
const noEnvsHere = () => {
  let main = '';
  try { main = path.dirname(path.resolve(labRoot, execFileSync('git', ['rev-parse', '--git-common-dir'], { cwd: labRoot, encoding: 'utf8' }).trim())); } catch { /* not a git checkout */ }
  return `No lab environments in ${envsDir}.${main && main !== labRoot ? ` This is a git worktree; the environments are probably in the main checkout. Run it there:\n  cd ${main} && node scripts/lab-env.mjs ${process.argv.slice(2).join(' ')}` : ''}`;
};
// The environments of a command that exist here; stops with an error when there are none, instead of doing nothing.
const present = (list) => { const found = list.filter((e) => fs.existsSync(envDir(e))); if (!found.length) { console.error(`${list.length ? `${list.join(' and ')}: not found. ` : ''}${noEnvsHere()}`); process.exit(1); } return found; };
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
  // the commit each checkout stands on, and the shared core ref its variant follows when that has moved on
  const bare = path.join(envsDir, 'core.git'), refTip = (v) => (fs.existsSync(bare) ? execFileSync('git', ['-C', bare, 'rev-parse', '--verify', '--quiet', '--short=11', `refs/lab/${v.core && v.core.commit ? String(v.core.commit).slice(0, 12) : (v.core && v.core.ref) || 'main'}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() : '');
  const safeTip = (v) => { try { return refTip(v); } catch { return ''; } };
  const coreOf = (e) => { const h = headOf(envDir(e)).slice(0, 11); const v = vs.find((x) => x.before.env === e || x.after.env === e); const t = v ? safeTip(v) : ''; return h ? (t && t !== h ? `${h} (ref ${t})` : h) : '-'; };
  console.log('Environment                    State     Core                       Project / URL                                     Used by');
  for (const e of allEnvs) { const p = st[envDir(e)] || {}; console.log(`${e.padEnd(30)} ${(p.status || 'unknown').padEnd(9)} ${coreOf(e).padEnd(26)} ${(p.name ? p.name + ' ' + (p.httpsurl || '') : '').padEnd(49).slice(0, 49)} ${(usedBy[e] || ['(no variant)']).join(', ')}`); }
  const bad = vs.map((v) => identity(v, { labRoot, envDir })).filter((id) => id.problems.length);
  const dirty = vs.map((v) => ({ v, st: fs.existsSync(envDir(v.before.env)) ? patchState(envDir(v.before.env), labRoot, v.before.patches || []) : null })).filter((x) => x.st && x.st.outside.length);
  if (bad.length) { console.log('\nNot in the state the variant asks for (a run or setup stops on these):'); for (const id of bad) for (const p of id.problems) console.log(`  ${id.slug}: ${p.text}`); }
  if (dirty.length) { console.log('\nBaselines with tracked changes their variant does not declare (setup warns, a run refuses until they are reverted):'); for (const x of dirty) console.log(`  ${x.v.slug}: ${x.v.before.env}: ${x.st.outside.slice(0, 6).join(', ')}${x.st.outside.length > 6 ? ', ...' : ''}`); }
  const running = allEnvs.filter((e) => (st[envDir(e)] || {}).status === 'running').length;
  if (!allEnvs.length) console.log(noEnvsHere());
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
  case 'reset': {
    if (!target) { console.error('usage: reset <slug> --yes'); process.exit(2); }
    if (!yes) { console.error(`This RESETS the sites of ${envsOf(target).join(' and ')}: all content and settings made in them are lost (the Drupal checkout, vendor and patches stay). Re-run with --yes.`); process.exit(2); }
    const r = spawnSync('node', [path.join(labRoot, 'tools/compare/setup.mjs'), target, '--reinstall'], { cwd: labRoot, stdio: 'inherit' });
    process.exit(r.status ?? 1); }
  case 'trim': {
    if (!target) { console.error('usage: trim <slug|all> [--deep]'); process.exit(2); }
    const deep = process.argv.includes('--deep'); const dirs = present(target === 'all' ? allEnvs : envsOf(target)).map(envDir);
    const kb = (p) => { try { return Number(execFileSync('du', ['-sk', p], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\t')[0]); } catch { return 0; } };
    let freed = 0;
    for (const d of dirs) {
      const targets = [path.join(d, 'sites/simpletest/browser_output'), path.join(d, 'core/phpunit-results'), ...(deep ? [path.join(d, 'core/node_modules')] : [])];
      for (const t of targets) { if (!fs.existsSync(t)) continue; const k = kb(t); fs.rmSync(t, { recursive: true, force: true }); if (t.endsWith('browser_output')) fs.mkdirSync(t, { recursive: true }); freed += k; }
      spawnSync('ddev', ['snapshot', '--cleanup', '--yes'], { cwd: d, stdio: 'ignore' });
      console.log(`${path.basename(d)}: trimmed${deep ? ' (including node_modules)' : ''}`);
    }
    console.log(`\nFreed about ${(freed / 1024).toFixed(0)} MB.${deep ? ' To use CSS builds or lint again: cd envs/<name>/core && yarn install (needs network).' : ' --deep also removes core/node_modules (about 400 MB each).'}`); break; }
  case 'disk': {
    const df = spawnSync('df', ['-k', labRoot], { encoding: 'utf8' }).stdout.trim().split('\n').pop().split(/\s+/);
    console.log(`Free disk: ${(Number(df[3]) / 1048576).toFixed(1)} GB\n`);
    const kb = (p) => { try { return Number(execFileSync('du', ['-sk', p], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\t')[0]); } catch { return 0; } };
    const st = state();
    for (const e of allEnvs) { const d = envDir(e); console.log(`${e.padEnd(30)} ${String(Math.round(kb(d) / 1024)).padStart(5)} MB  (node_modules ${String(Math.round(kb(path.join(d, 'core/node_modules')) / 1024)).padStart(4)} MB, site files ${String(Math.round(kb(path.join(d, 'sites/default/files')) / 1024)).padStart(3)} MB)  ${(st[d] || {}).status || 'unknown'}`); }
    console.log(`${'envs/core.git (shared clone)'.padEnd(30)} ${String(Math.round(kb(path.join(envsDir, 'core.git')) / 1024)).padStart(5)} MB`);
    const dk = spawnSync('docker', ['system', 'df'], { encoding: 'utf8' }); if (dk.status === 0) console.log(`\nDocker:\n${dk.stdout.trim()}`);
    console.log(`\nSafe things to free, smallest effort first:
  node scripts/lab-env.mjs trim all            test output and snapshots
  node scripts/lab-env.mjs trim all --deep     also core/node_modules (about 400 MB per environment, reinstallable)
  node scripts/lab-env.mjs delete <slug> --yes an unused pair (about 0.6 GB each; rebuild with setup.mjs, 10-20 min)
  docker builder prune -af                     unused build cache
  npm cache clean --force                      npm's cache (reinstalls on demand)`); break; }
  case 'stop': {
    if (!target) { console.error('usage: stop <slug|all>'); process.exit(2); }
    const list = present(target === 'all' ? allEnvs : envsOf(target));   // before stopViewer: it stops every viewer on the machine
    stopViewer();
    for (const e of list) { process.stdout.write(`${e}: `); ddev(envDir(e), ['stop']); }
    break; }
  case 'retire': {
    if (!target) { console.error('usage: retire <slug> --yes [--force]'); process.exit(2); }
    const v = vs.find((x) => x.slug === target); const list = present(envsOf(target));
    const rel = `reports/issues/${v.issue}`; const git = (a) => spawnSync('git', ['-C', labRoot, ...a], { encoding: 'utf8' });
    const why = [];
    const dirty = git(['status', '--porcelain', '--', rel]).stdout.trimEnd();
    if (dirty) why.push(`${rel}/ has uncommitted changes:\n${dirty.split('\n').map((l) => '    ' + l).join('\n')}`);
    const up = git(['rev-parse', '--abbrev-ref', '@{u}']);
    if (up.status !== 0) why.push('this branch has no upstream, so it cannot tell whether the evidence is pushed');
    else { const ahead = git(['log', '--oneline', '@{u}..HEAD', '--', rel]).stdout.trim(); if (ahead) why.push(`commits touching ${rel}/ are not pushed to ${up.stdout.trim()}:\n${ahead.split('\n').map((l) => '    ' + l).join('\n')}`); }
    if (!(v.before.patches || []).length && fs.existsSync(envDir(v.before.env))) {
      const t = spawnSync('git', ['-C', envDir(v.before.env), 'status', '--porcelain', '--untracked-files=no'], { encoding: 'utf8' }).stdout.trimEnd();
      if (t) why.push(`the baseline ${v.before.env} has tracked changes that the variant does not declare (rule 1); find out why before deleting it:\n${t.split('\n').map((l) => '    ' + l).join('\n')}`);
    }
    if (why.length && !process.argv.includes('--force')) { console.error(`Not retiring ${target}:\n- ${why.join('\n- ')}\nCommit and push the evidence (or use --force to delete anyway).`); process.exit(1); }
    if (!yes) { console.error(`Evidence for #${v.issue} is safe${why.length ? ' (checks overridden with --force)' : ''}. This DELETES ${list.join(' and ') || 'nothing (not built)'}. Re-run with --yes.`); process.exit(2); }
    for (const e of list) { ddev(envDir(e), ['delete', '--omit-snapshot', '--yes']); spawnSync('git', ['-C', path.join(envsDir, 'core.git'), 'worktree', 'remove', '--force', envDir(e)], { stdio: 'inherit' }); }
    console.log(`Retired ${target}. Evidence stays in ${rel}/; rebuild with node tools/compare/setup.mjs ${target}`);
    break; }
  case 'delete': {
    if (!target) { console.error('usage: delete <slug> --yes'); process.exit(2); }
    const list = present(envsOf(target)); if (!yes) { console.error(`This DELETES ${list.join(' and ')} (containers, database and worktree). Evidence in reports/ is kept. Re-run with --yes.`); process.exit(2); }
    for (const e of list) { ddev(envDir(e), ['delete', '--omit-snapshot', '--yes']); spawnSync('git', ['-C', path.join(envsDir, 'core.git'), 'worktree', 'remove', '--force', envDir(e)], { stdio: 'inherit' }); }
    break; }
  default: console.error('usage: lab-env.mjs status | disk | start <slug> [--browser] | browser [--reset] | stop <slug|all> | reset <slug> --yes | trim <slug|all> [--deep] | delete <slug> --yes | retire <slug> --yes [--force]'); process.exit(2);
}
