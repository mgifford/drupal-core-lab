// Start, stop and inspect the lab's DDEV environments by variant name. Two sites at a time is the normal state:
// a core, and the same core with an issue's patch.
//   node scripts/lab-env.mjs status                 what exists, what is running, which variant uses it
//   node scripts/lab-env.mjs resources [--json]    read-only: containers, Chrome, Mutagen, memory/CPU and task association
//   node scripts/lab-env.mjs chrome <slug> start|stop  start or stop only the pair's Chrome services (Drupal keeps running)
//   node scripts/lab-env.mjs capacity [--kind=test] [--json]  observe-only advice from active leases, wrapped operations and Docker memory
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
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawnSync, execFileSync, spawn } from 'node:child_process';
import { labRoot, variants, envDir, reportsDir, ddevName } from '../tools/compare/lib.mjs';
import { identity, headOf } from '../tools/compare/env-state.mjs';
import { sideState } from '../tools/compare/contrib-state.mjs';
import { claimLease, releaseLease, leaseRows, protectionMessage } from '../tools/compare/leases.mjs';
import { dockerContainers } from '../tools/resource/adapters/docker.mjs';
import { parsePair } from '../tools/resource/units.mjs';
import { loadTasks } from '../tools/resource/tasks.mjs';
import { readRunning, loadBudgets } from '../tools/resource/budgets.mjs';
import { capacityDecision } from '../tools/compare/scheduler.mjs';

const [cmd, target, action] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const yes = process.argv.includes('--yes');
const wantBrowser = process.argv.includes('--browser');
const LEASE_FILE = path.join(labRoot, '.lab-cache/lab-env-leases.json');
const force = process.argv.includes('--force');
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

// Read-only resource view. It never starts or stops anything and classifies an environment as unknown when it cannot tell.
const dockerAvailable = () => { try { execFileSync('docker', ['info'], { stdio: 'ignore', timeout: 15000 }); return true; } catch { return false; } };
const dockerMemory = () => { try { const out = execFileSync('docker', ['info', '--format', '{{.MemTotal}}|{{.NCPU}}'], { encoding: 'utf8', timeout: 15000 }).trim().split('|'); return { total: Number(out[0]) || null, cpus: Number(out[1]) || null }; } catch { return { total: null, cpus: null }; } };
function dockerDisk() { try { return execFileSync('docker', ['system', 'df', '--format', '{{json .}}'], { encoding: 'utf8', timeout: 30000 }).split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } catch { return null; } }
function containerStats(containers) {
  const out = {};
  if (!containers.length) return out;
  try {
    const text = execFileSync('docker', ['stats', '--no-stream', '--format', '{{json .}}', ...containers.map((c) => c.name)], { encoding: 'utf8', timeout: 60000, maxBuffer: 8 * 1024 * 1024 });
    for (const line of text.split('\n').filter(Boolean)) {
      try {
        const r = JSON.parse(line), mem = parsePair(r.MemUsage);
        out[r.Name] = { cpu: Number.parseFloat(String(r.CPUPerc || '').replace('%', '')), memory: mem ? mem[0] : null };
      } catch { /* skip a malformed stats row */ }
    }
  } catch { /* Docker stats are optional; the rest of the view still works */ }
  return out;
}
function mutagenOf(dir) {
  const r = spawnSync('ddev', ['mutagen', 'status', '-l'], { cwd: dir, encoding: 'utf8', timeout: 20000 });
  if (r.status !== 0) return null;
  const text = r.stdout || '';
  const files = text.match(/^\s*([\d,]+) files \(([^)]+)\)/m);
  let config = '';
  try { config = fs.readdirSync(path.join(dir, '.ddev')).filter((f) => /^config(\..+)?\.yaml$/.test(f)).map((f) => fs.readFileSync(path.join(dir, '.ddev', f), 'utf8')).join('\n'); } catch { /* no config */ }
  return {
    status: (text.match(/^Status:\s*(.+)$/m) || [])[1] || null,
    files: files ? Number(files[1].replace(/,/g, '')) : null,
    size: files ? files[2] : null,
    node_modules_excluded: /core\/node_modules/.test(config),
  };
}
function chromeLifecycle() {
  if (!target || !['start', 'stop'].includes(action)) {
    console.error('usage: node scripts/lab-env.mjs chrome <slug> start|stop');
    process.exit(2);
  }
  if (action === 'stop') {
    const blocked = protectionMessage(LEASE_FILE, [target], { force, action: 'stop Chrome' });
    if (blocked) { console.error(blocked); process.exit(1); }
  }
  const envs = present(envsOf(target));
  if (!envs.length) { console.error(`No built environment for ${target}.`); process.exit(1); }
  let failed = false;
  for (const e of envs) {
    const name = `ddev-${ddevName(e)}-chrome`;
    const exists = spawnSync('docker', ['inspect', name], { stdio: 'ignore' }).status === 0;
    if (!exists) { console.error(`No Chrome container for ${e} (${name}). Start the environment first.`); failed = true; continue; }
    const r = spawnSync('docker', [action, name], { stdio: 'inherit' });
    if (r.status !== 0) { console.error(`Could not ${action} ${name}.`); failed = true; continue; }
    // docker start/stop return before the container has settled. Wait so the command's report is true.
    let running = null;
    for (let i = 0; i < 30; i++) {
      running = spawnSync('docker', ['inspect', '--format', '{{.State.Running}}', name], { encoding: 'utf8' }).stdout?.trim() === 'true';
      if ((action === 'start' && running) || (action === 'stop' && !running)) break;
      spawnSync('sleep', ['1']);
    }
    if (action === 'start' && running) {
      let ready = false;
      for (let i = 0; i < 20; i++) {
        const probe = spawnSync('docker', ['exec', name, 'sh', '-c', 'curl -sf http://localhost:4444/status >/dev/null 2>&1'], { stdio: 'ignore' });
        if (probe.status === 0) { ready = true; break; }
        spawnSync('sleep', ['1']);
      }
      console.log(`Started ${name}${ready ? '; Selenium ready' : '; container running, Selenium not ready yet (check `docker logs ' + name + '`)'}.`);
    } else if (action === 'stop' && !running) console.log(`Stopped ${name}.`);
    else { console.error(`${name} did not become ${action === 'start' ? 'running' : 'stopped'} within 30 s.`); failed = true; }
  }
  if (failed) process.exit(1);
  if (action === 'stop') console.log('Chrome is off; Drupal stays up. Browser tests (ddev phpunit FunctionalJavascript, ddev nightwatch) need it: run chrome <slug> start first.');
  else console.log('Chrome is available to this pair only; browser preferences and sessions stay isolated in its container.');
}

function claim() {
  if (!target) { console.error('usage: node scripts/lab-env.mjs claim <slug> [--task=<id>] [--operation=<name>] [--minutes=60] [--force]'); process.exit(2); }
  present(envsOf(target));
  const minutes = Number(process.argv.find((a) => a.startsWith('--minutes='))?.slice('--minutes='.length) || 60);
  const task = process.argv.find((a) => a.startsWith('--task='))?.slice('--task='.length) || null;
  const operation = process.argv.find((a) => a.startsWith('--operation='))?.slice('--operation='.length) || 'manual';
  try { const lease = claimLease(LEASE_FILE, { slug: target, task, operation, minutes, force }); console.log(`Lease ${lease.slug}: ${lease.operation}${lease.task ? ` (task ${lease.task})` : ''}, pid ${lease.pid}, expires ${lease.expires_at}. Release with: node scripts/lab-env.mjs release ${lease.slug}`); }
  catch (e) { console.error(e.message); process.exit(1); }
}
function release() {
  if (!target) { console.error('usage: node scripts/lab-env.mjs release <slug> [--force]'); process.exit(2); }
  const r = releaseLease(LEASE_FILE, { slug: target, force });
  if (!r.released) { console.error(r.reason); process.exit(1); }
  console.log(`Released lease on ${target} (${r.lease.operation}${r.lease.task ? `, task ${r.lease.task}` : ''}).`);
}
function leases() {
  const rows = leaseRows(LEASE_FILE);
  if (!rows.length) { console.log('No leases. Activity is unknown, not idle.'); return; }
  for (const l of rows) console.log(`${l.slug}	${l.status}	${l.operation}	${l.task || '—'}	pid ${l.pid}	expires ${l.expires_at}`);
}
function capacity() {
  const kind = (process.argv.find((a) => a.startsWith('--kind='))?.slice('--kind='.length)) || 'test';
  const budgets = loadBudgets();
  const running = readRunning();
  const leases = leaseRows(LEASE_FILE);
  const containers = dockerContainers();
  const stats = containerStats(containers);
  const mem = dockerMemory();
  const labMemory = containers.reduce((n, c) => n + (stats[c.name]?.memory || 0), 0);
  const memoryPercent = mem.total && labMemory ? Math.round((1000 * labMemory) / mem.total) / 10 : null;
  const decision = capacityDecision({ running, leases, kind, mode: budgets.config.mode, limit: budgets.config.limits.max_concurrent_cpu_jobs, memoryPercent });
  if (process.argv.includes('--json')) { console.log(JSON.stringify(decision, null, 2)); return; }
  console.log(`Capacity advice (${decision.mode}, not enforced here): ${decision.action} for kind=${kind}`);
  console.log(`Heavy work: ${decision.active_count}/${decision.limit || '—'} (${decision.active.map((a) => `${a.source}:${a.activity}${a.task ? `/${a.task}` : ''}`).join(', ') || 'none'}).`);
  if (memoryPercent != null) console.log(`Docker memory: ${memoryPercent}% of the VM (${Math.round(labMemory / 1048576)} MiB lab containers).`);
  for (const r of decision.reasons) console.log(`  ${r}`);
  console.log('This is advice only; no operation was started, stopped or refused. Leases and resource-run operations are the only work it can see.');
}

function resources() {
  const json = process.argv.includes('--json');
  const dockerOk = dockerAvailable();
  const containers = dockerContainers();
  const stats = containerStats(containers);
  const memInfo = dockerMemory();
  const disk = dockerDisk();
  const st = state();
  const ops = readRunning();
  const tasks = loadTasks();
  const leases = leaseRows(LEASE_FILE);
  const leaseForEnv = (e) => leases.find((l) => { const v = vs.find((x) => x.slug === l.slug); return v && [v.before.env, v.after.env].includes(e); });
  const sum = (xs) => { const v = xs.filter((x) => typeof x === 'number' && Number.isFinite(x)); return v.length ? v.reduce((a, b) => a + b, 0) : null; };
  const envRows = allEnvs.map((e) => {
    const p = st[envDir(e)] || {};
    const mine = containers.filter((c) => c.env === e);
    const by = (role) => mine.find((c) => c.role === role);
    const used = vs.filter((v) => v.before.env === e || v.after.env === e).map((v) => v.slug);
    const mem = sum(mine.map((c) => stats[c.name]?.memory));
    const cpu = sum(mine.map((c) => stats[c.name]?.cpu));
    return {
      env: e, state: p.status || 'unknown', core: headOf(envDir(e)).slice(0, 11) || null, variants: used,
      web: by('web')?.name || null, chrome: by('chrome')?.name || null, otel: by('otel-collector')?.name || null,
      memory_bytes: mem, cpu_percent: cpu, mutagen: p.status === 'running' ? mutagenOf(envDir(e)) : null,
      task: (() => { const t = tasks.find((x) => x.issue && used.some((s) => s.startsWith(`${x.issue}-`))); return t ? { id: t.task_id, state: t.state, sessions: (t.sessions || []).length } : null; })(),
      lease: leaseForEnv(e) || null,
      activity: (() => { const l = leaseForEnv(e); return !l ? 'unknown (no lease)' : l.status === 'active' ? `active (${l.operation}${l.task ? `, ${l.task}` : ''})` : `unknown (${l.status} lease)`; })(),
    };
  });
  const shared = containers.filter((c) => ['viewer', 'router', 'ssh-agent'].includes(c.role)).map((c) => ({ role: c.role, name: c.name, site: c.site || null, ...stats[c.name] }));
  const out = {
    generated_at: new Date().toISOString(), docker: { available: dockerOk, cpus: memInfo.cpus, memory_total_bytes: memInfo.total },
    host: { cpus: os.cpus().length, load_1m: os.loadavg()[0], memory_total_bytes: os.totalmem() },
    environments: envRows, leases, shared, running_operations: ops, declared_tasks: tasks.map((t) => ({ task_id: t.task_id, issue: t.issue, state: t.state })), disk,
    lab_memory_bytes: sum(containers.map((c) => stats[c.name]?.memory)), lab_cpu_percent: sum(containers.map((c) => stats[c.name]?.cpu)),
    unregistered: dockerOk ? allEnvs.filter((e) => !st[envDir(e)]) : [],
    note: 'Read-only. No environment is started or stopped. Activity is unknown without a task lease; do not treat it as idle.',
  };
  if (json) { console.log(JSON.stringify(out, null, 2)); return; }
  const mb = (n) => (n == null ? '—' : `${Math.round(n / 1048576)} MiB`);
  const pct = (n) => (n == null ? '—' : `${n.toFixed(1)}%`);
  console.log('Lab resources (read-only; nothing is started or stopped)');
  console.log(`Host: ${out.host.cpus} CPU, load ${out.host.load_1m.toFixed(2)}, ${mb(out.host.memory_total_bytes)} RAM`);
  console.log(`Docker: ${dockerOk ? `${memInfo.cpus ?? '?'} CPU / ${mb(memInfo.total)}` : 'unavailable'}${out.lab_memory_bytes != null ? `, lab containers ${mb(out.lab_memory_bytes)}` : ''}`);
  if (disk) for (const d of disk) console.log(`  ${d.Type}: ${d.Size}${d.Reclaimable ? ` (${d.Reclaimable} reclaimable)` : ''}`);
  console.log('\nEnvironments');
  console.log('Environment                    State     Core         Variants                         Web   Chrome       OTel        Mutagen                         Mem     CPU     Declared task');
  for (const r of envRows) {
    const mut = r.mutagen ? `${r.mutagen.files ?? '?'} files / ${r.mutagen.size || '?'} (${r.mutagen.status || '?'})` : '—';
    const cm = r.chrome ? stats[r.chrome]?.memory : null;
    const om = r.otel ? stats[r.otel]?.memory : null;
    const task = r.task ? `${r.task.id} (${r.task.state}${r.task.sessions ? '' : ', no session'})` : 'none declared';
    console.log(`${r.env.padEnd(30)} ${r.state.padEnd(9)} ${(r.core || '—').padEnd(12)} ${(r.variants.join(', ') || '—').padEnd(33)} ${(r.web ? 'yes' : '—').padEnd(5)} ${(r.chrome ? `yes ${mb(cm)}` : '—').padEnd(12)} ${(r.otel ? `yes ${mb(om)}` : '—').padEnd(11)} ${mut.padEnd(31)} ${mb(r.memory_bytes).padEnd(7)} ${pct(r.cpu_percent).padEnd(7)} ${task}`);
  }
  const unfixed = envRows.filter((r) => r.mutagen && !r.mutagen.node_modules_excluded && fs.existsSync(path.join(envDir(r.env), 'core/node_modules')));
  if (unfixed.length) console.log(`\nMutagen warning: core/node_modules is not excluded in ${unfixed.map((r) => r.env).join(', ')}. New builds get the lab override; an existing environment needs a deliberate restart/reset to apply it.`);
  if (leases.length) {
    console.log('\nLeases');
    console.log('Slug                           Status     Operation            Task                     PID      Expires');
    for (const l of leases) console.log(`${l.slug.padEnd(30)} ${l.status.padEnd(10)} ${String(l.operation || '—').padEnd(20)} ${String(l.task || '—').padEnd(24)} ${String(l.pid).padEnd(8)} ${l.expires_at}`);
    console.log('A lease is runtime protection, not a task record; activity is still unknown when no lease is active.');
  }
  if (shared.length) {
    console.log('\nShared services');
    console.log('Role          Container                    Site                 CPU     Mem');
    for (const s of shared) console.log(`${s.role.padEnd(13)} ${s.name.padEnd(28)} ${(s.site || '—').padEnd(20)} ${pct(s.cpu).padEnd(7)} ${mb(s.memory)}`);
  }
  if (ops.length) { console.log('\nRunning wrapped operations'); for (const o of ops) console.log(`  pid ${o.pid} ${o.activity} task=${o.task} since ${o.started_at}`); }
  else console.log('\nRunning wrapped operations: none recorded.');
  console.log(`\nDeclared tasks: ${tasks.length ? tasks.map((t) => `${t.task_id} (${t.state})`).join(', ') : 'none'}.`);
  console.log('Activity: unknown for every environment; there is no task lease. The declared task is matched by issue only, not proof of current work. Review before stopping anything.');
  if (out.unregistered.length) console.log(`Environments not in ddev list: ${out.unregistered.join(', ')}`);
  const pressure = memInfo.total && out.lab_memory_bytes != null && out.lab_memory_bytes / memInfo.total >= 0.75;
  if (pressure) console.log(`WARNING: lab containers use ${Math.round(100 * out.lab_memory_bytes / memInfo.total)}% of the Docker VM memory.`);
}

function status() {
  const st = state(); const usedBy = {};
  for (const v of vs) for (const e of [v.before.env, v.after.env]) (usedBy[e] ||= []).push(v.slug);
  // the commit each checkout stands on, and the shared core ref its variant follows when that has moved on
  const bare = path.join(envsDir, 'core.git'), refTip = (v) => (fs.existsSync(bare) ? execFileSync('git', [`--git-dir=${bare}`, 'rev-parse', '--verify', '--quiet', '--short=11', `refs/lab/${v.core && v.core.commit ? String(v.core.commit).slice(0, 12) : (v.core && v.core.ref) || 'main'}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() : '');
  const safeTip = (v) => { try { return refTip(v); } catch { return ''; } };
  const coreOf = (e) => { const h = headOf(envDir(e)).slice(0, 11); const v = vs.find((x) => x.before.env === e || x.after.env === e); const t = v ? safeTip(v) : ''; return h ? (t && t !== h ? `${h} (ref ${t})` : h) : '-'; };
  console.log('Environment                    State     Core                       Project / URL                                     Used by');
  for (const e of allEnvs) { const p = st[envDir(e)] || {}; console.log(`${e.padEnd(30)} ${(p.status || 'unknown').padEnd(9)} ${coreOf(e).padEnd(26)} ${(p.name ? p.name + ' ' + (p.httpsurl || '') : '').padEnd(49).slice(0, 49)} ${(usedBy[e] || ['(no variant)']).join(', ')}`); }
  const bad = vs.map((v) => identity(v, { labRoot, envDir })).filter((id) => id.problems.length);
  const sideOf = (v, side) => (fs.existsSync(envDir(v[side].env)) ? sideState(envDir(v[side].env), labRoot, v[side].patches || [], { modules: v.contrib || [], patches: v[side].contribPatches || [] }) : null);
  const dirty = vs.map((v) => ({ v, st: sideOf(v, 'before') })).filter((x) => x.st && x.st.outside.length);
  const patchBad = vs.flatMap((v) => ['before', 'after'].map((side) => ({ v, side, st: sideOf(v, side) }))).filter((x) => x.st && ['mismatch', 'fresh'].includes(x.st.state));
  if (bad.length) { console.log('\nNot in the state the variant asks for (a run or setup stops on these):'); for (const id of bad) for (const p of id.problems) console.log(`  ${id.slug}: ${p.text}`); }
  if (patchBad.length) { console.log('\nPatches or contrib modules that do not match what is in the checkout (a run stops on these; setup.mjs <slug> --refresh-patches):'); for (const x of patchBad) console.log(`  ${x.v.slug} ${x.side}: ${x.st.reasons.length ? x.st.reasons.join('; ') : 'the patches are not applied'}`); }
  if (dirty.length) { console.log('\nBaselines with tracked changes their variant does not declare (setup warns, a run refuses until they are reverted):'); for (const x of dirty) console.log(`  ${x.v.slug}: ${x.v.before.env}: ${x.st.outside.slice(0, 6).join(', ')}${x.st.outside.length > 6 ? ', ...' : ''}`); }
  const running = allEnvs.filter((e) => (st[envDir(e)] || {}).status === 'running').length;
  if (!allEnvs.length) console.log(noEnvsHere());
  console.log(`\n${running} lab environment(s) running. Normal state: 2 (a core and the same core with an issue's patch).`);
}

switch (cmd) {
  case 'status': case undefined: status(); break;
  case 'resources': resources(); break;
  case 'capacity': capacity(); break;
  case 'claim': claim(); break;
  case 'release': release(); break;
  case 'leases': leases(); break;
  case 'chrome': chromeLifecycle(); break;
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
    if (!target) { console.error('usage: reset <slug> --yes [--force]'); process.exit(2); }
    const blocked = protectionMessage(LEASE_FILE, [target], { force, action: 'reset' });
    if (blocked) { console.error(blocked); process.exit(1); }
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
    if (!target) { console.error('usage: stop <slug|all> [--force]'); process.exit(2); }
    const blocked = protectionMessage(LEASE_FILE, target === 'all' ? vs.map((v) => v.slug) : [target], { force, action: 'stop' });
    if (blocked) { console.error(blocked); process.exit(1); }
    const list = present(target === 'all' ? allEnvs : envsOf(target));   // before stopViewer: it stops every viewer on the machine
    stopViewer();
    for (const e of list) { process.stdout.write(`${e}: `); ddev(envDir(e), ['stop']); }
    break; }
  case 'retire': {
    if (!target) { console.error('usage: retire <slug> --yes [--force]'); process.exit(2); }
    const blocked = protectionMessage(LEASE_FILE, [target], { force, action: 'retire' });
    if (blocked) { console.error(blocked); process.exit(1); }
    const v = vs.find((x) => x.slug === target); const list = present(envsOf(target));
    const rel = reportsDir(v); const git = (a) => spawnSync('git', ['-C', labRoot, ...a], { encoding: 'utf8' });
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
    if (!yes) { console.error(`Evidence for ${v.issue ? `#${v.issue}` : rel} is safe${why.length ? ' (checks overridden with --force)' : ''}. This DELETES ${list.join(' and ') || 'nothing (not built)'}. Re-run with --yes.`); process.exit(2); }
    for (const e of list) { ddev(envDir(e), ['delete', '--omit-snapshot', '--yes']); spawnSync('git', [`--git-dir=${path.join(envsDir, 'core.git')}`, 'worktree', 'remove', '--force', envDir(e)], { stdio: 'inherit' }); }
    console.log(`Retired ${target}. Evidence stays in ${rel}/; rebuild with node tools/compare/setup.mjs ${target}`);
    break; }
  case 'delete': {
    if (!target) { console.error('usage: delete <slug> --yes [--force]'); process.exit(2); }
    const blocked = protectionMessage(LEASE_FILE, [target], { force, action: 'delete' });
    if (blocked) { console.error(blocked); process.exit(1); }
    const list = present(envsOf(target)); if (!yes) { console.error(`This DELETES ${list.join(' and ')} (containers, database and worktree). Evidence in reports/ is kept. Re-run with --yes.`); process.exit(2); }
    for (const e of list) { ddev(envDir(e), ['delete', '--omit-snapshot', '--yes']); spawnSync('git', [`--git-dir=${path.join(envsDir, 'core.git')}`, 'worktree', 'remove', '--force', envDir(e)], { stdio: 'inherit' }); }
    break; }
  default: console.error('usage: lab-env.mjs status | resources [--json] | chrome <slug> start|stop | disk | start <slug> [--browser] | browser [--reset] | stop <slug|all> | reset <slug> --yes | trim <slug|all> [--deep] | delete <slug> --yes | retire <slug> --yes [--force]'); process.exit(2);
}
