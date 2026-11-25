#!/usr/bin/env node
// Run one command under the lab's capacity and lease rules. This is the enforcement point that `lab-env capacity` only advises
// about: default observe mode records and allows; enforce mode refuses before starting when the existing max_concurrent_cpu_jobs
// or Docker memory check is exceeded. It never kills a running command and only sees work started through this wrapper (or
// registered by resource-run) and active leases.
//   node scripts/lab-run.mjs <slug> --kind=test|build|composer|setup|lint [--side=before|after] [--task=<id>] [--minutes=240] [--cwd=lab] [--mode=observe|warn|enforce] [--limit=N] -- <command...>
import path from 'node:path';
import { spawn } from 'node:child_process';
import { labRoot, variants, envDir } from '../tools/compare/lib.mjs';
import { loadBudgets, readRunning, registerRunning, unregisterRunning } from '../tools/resource/budgets.mjs';
import { claimLease, releaseLease, leaseRows } from '../tools/compare/leases.mjs';
import { capacityDecision } from '../tools/compare/scheduler.mjs';

const USAGE = 'usage: node scripts/lab-run.mjs <slug> --kind=test|build|composer|setup|lint [--side=before|after] [--task=<id>] [--minutes=240] [--cwd=lab] [--mode=observe|warn|enforce] [--limit=N] -- <command...>';
const argv = process.argv.slice(2), split = argv.indexOf('--');
if (split < 0 || split === argv.length - 1) { console.error(USAGE); process.exit(2); }
const head = argv.slice(0, split), command = argv.slice(split + 1);
const slug = head.find((a) => !a.startsWith('--'));
const opt = Object.fromEntries(head.filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.split(/=(.*)/s); return [k.slice(2), v ?? true]; }));
if (!slug || !command.length) { console.error(USAGE); process.exit(2); }
const v = variants().find((x) => x.slug === slug);
if (!v) { console.error(`unknown variant: ${slug}. Variants: ${variants().map((x) => x.slug).join(', ')}`); process.exit(2); }
const side = opt.side === 'before' ? 'before' : 'after';
const cwd = opt.cwd === 'lab' ? labRoot : envDir(v[side].env);
const kind = String(opt.kind || 'test');
const minutes = Number(opt.minutes || 240);
const leaseFile = path.join(labRoot, '.lab-cache/lab-env-leases.json');
const budgets = loadBudgets();
const mode = opt.mode || budgets.config.mode;
if (!['observe', 'warn', 'enforce'].includes(mode)) { console.error(`lab-run: invalid --mode=${mode}`); process.exit(2); }
const limit = opt.limit != null ? Number(opt.limit) : budgets.config.limits.max_concurrent_cpu_jobs;
if (!Number.isFinite(limit) || limit < 0) { console.error(`lab-run: invalid --limit=${opt.limit}`); process.exit(2); }
const decision = capacityDecision({ running: readRunning(), leases: leaseRows(leaseFile), kind, mode, limit, memoryPercent: null });
if (decision.action === 'refuse') {
  console.error(`lab-run refused (${decision.mode}): ${decision.reasons.join('; ')}`);
  console.error('No command was started. Finish or release the active work, or change the explicit budget after measuring it.');
  process.exit(3);
}
if (decision.action === 'warn') console.error(`lab-run warning: ${decision.reasons.join('; ')}`);
if (decision.action === 'record') console.error(`lab-run observe: ${decision.active_count} active heavy operation(s); limit ${decision.limit || 'not set'}`);
let cleaned = false, claimed = false, child = null;
const cleanup = () => {
  if (cleaned) return;
  cleaned = true;
  try { unregisterRunning(process.pid); } catch { /* not registered */ }
  if (claimed) { try { releaseLease(leaseFile, { slug, pid: process.pid }); } catch { /* already gone */ } }
};
process.on('exit', cleanup);
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { if (child && !child.killed) { try { child.kill(signal); } catch { /* already gone */ } } cleanup(); process.exit(signal === 'SIGINT' ? 130 : 143); });
const existingLease = leaseRows(leaseFile).find((l) => l.slug === slug && l.status === 'active');
if (existingLease) {
  console.error(`lab-run refused: ${slug} already has an active lease (${existingLease.operation}${existingLease.task ? `, ${existingLease.task}` : ''}, pid ${existingLease.pid ?? 'n/a'}). Release it before starting another wrapped operation.`);
  process.exit(3);
}
try {
  claimLease(leaseFile, { slug, operation: kind, task: opt.task || null, pid: process.pid, minutes });
  claimed = true;
  registerRunning({ pid: process.pid, activity: kind, task: opt.task || null, issue: v.issue || null, started_at: new Date().toISOString() });
  console.error(`lab-run ${slug} [${side}] kind=${kind}: ${command.join(' ')} (cwd ${cwd})`);
} catch (e) {
  console.error(e.message); cleanup(); process.exit(3);
}
child = spawn(command[0], command.slice(1), { cwd, stdio: 'inherit', env: process.env });
child.on('error', (e) => { console.error(`lab-run could not start ${command[0]}: ${e.message}`); cleanup(); process.exit(127); });
child.on('close', (code) => { cleanup(); process.exit(code ?? 1); });
