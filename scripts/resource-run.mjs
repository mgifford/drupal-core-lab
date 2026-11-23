#!/usr/bin/env node
// Run a command, measure it, record it, and apply the resource budget. This is the only place where a budget can
// actually refuse to start work; it never kills a running process unless the person explicitly passes --timeout.
//
//   node scripts/resource-run.mjs --activity=phpunit-execution --issue=3619127 --variant=3619127-pinned \
//     [--task=phpunit] [--timeout=900] [--approve --reason="..."] -- ddev phpunit path/to/Test.php
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { labRoot, loadEvents, appendEvents, monitoringEvent } from '../tools/resource/ledger.mjs';
import { loadBudgets, evaluateBudget, formatBudget, readRunning, registerRunning, unregisterRunning } from '../tools/resource/budgets.mjs';
import { makeEvent, iso, sha256 } from '../tools/resource/events.mjs';
import { classifyCommand, issueFromText } from '../tools/resource/classify.mjs';
import { runMeasured } from '../tools/resource/time-command.mjs';

const argv = process.argv.slice(2);
const sep = argv.indexOf('--');
const flags = sep >= 0 ? argv.slice(0, sep) : argv.filter((a) => a.startsWith('--'));
const command = sep >= 0 ? argv.slice(sep + 1) : argv.filter((a) => !a.startsWith('--'));
const val = (name, fallback = null) => { const a = flags.find((x) => x.startsWith(`--${name}=`)); return a ? a.slice(name.length + 3) : fallback; };
const has = (name) => flags.some((x) => x === `--${name}` || x.startsWith(`--${name}=`));
if (!command.length || has('help')) {
  console.error('usage: node scripts/resource-run.mjs --activity=<category> [--issue=<nid>] [--variant=<slug>] [--task=<id>] [--timeout=<seconds>] [--approve --reason="..."] -- <command...>');
  process.exit(2);
}
const activity = val('activity', classifyCommand(command));
const issue = val('issue', issueFromText(command.join(' ')));
const variant = val('variant', null);
const taskId = val('task', `run:${new Date().toISOString().replace(/[:.]/g, '-')}`);
const label = val('label', command.slice(0, 2).map((x) => path.basename(x)).join(' '));
const timeoutSeconds = Number(val('timeout', '0')) || 0;
const approve = has('approve');
const reason = val('reason', '');
const noRecord = has('no-record');
const budgetFile = val('budget-file', undefined);
const startedAt = iso();
const started = Date.now();
if (approve && !reason) { console.error('--approve requires --reason="<why this operation is worth the extra budget>"'); process.exit(2); }

const budgetLoad = loadBudgets(budgetFile ? path.resolve(budgetFile) : undefined);
if (budgetLoad.problems.length) { console.error(`Budget configuration problems:\n  ${budgetLoad.problems.join('\n  ')}`); process.exit(2); }
const ledger = loadEvents({ includeMonitoring: false });
const running = readRunning();
const budget = evaluateBudget({ config: { ...budgetLoad.config, mode: val('mode', budgetLoad.config.mode) }, events: ledger.events, task: taskId, issue, running, starting: true });
console.log(formatBudget(budget));

function recordBudget(decision) {
  if (noRecord) return;
  const event = makeEvent({
    event_type: 'budget', occurred_at: startedAt, duration_ms: Date.now() - started,
    issue, variant, task: { id: taskId, label: `Budget ${decision}`, execution_id: null },
    activity: 'monitoring', tool: 'resource-budget', model: null, provider: null,
    outcome: decision === 'refused' ? 'failure' : 'success', validation: 'not-run', commit: (() => { try { return execFileSync('git', ['-C', labRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { return null; } })(),
    source: { adapter: 'resource-budget', method: 'scripts/resource-run.mjs', confidence: 'measured', reference: budgetLoad.source },
    measurements: {}, quality: { completeness: 'complete', missing: [], notes: ['Budget decision recorded separately from the measured activity.'] },
    private: { decision, mode: budget.mode, reason: reason || null, exceeded: budget.exceeded, command_hash: sha256(command.join('\0')) },
  });
  appendEvents([event]);
}
if (budget.action === 'refuse' && !approve) {
  recordBudget('refused');
  console.error(`Refused: the ${budget.mode} budget is exceeded (${budget.exceeded.join(', ')}). Re-run with --approve --reason="..." to proceed; the override is recorded.`);
  process.exit(3);
}
if (approve) console.log(`Approved override: ${reason}`);
recordBudget(approve ? 'approved' : 'allowed');
registerRunning({ pid: process.pid, task: taskId, activity, started_at: startedAt, mode: budget.mode });

let result;
try {
  result = await runMeasured(command[0], command.slice(1), { cwd: process.cwd(), timeoutMs: timeoutSeconds > 0 ? timeoutSeconds * 1000 : null });
} finally {
  unregisterRunning(process.pid);
}
const totalCpu = result.user_seconds == null || result.system_seconds == null ? null : result.user_seconds + result.system_seconds;
const outcome = result.timedOut ? 'cancelled' : (result.status === 0 ? 'success' : 'failure');
const commit = (() => { try { return execFileSync('git', ['-C', labRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { return null; } })();
const missing = [];
if (result.time_format === 'none') missing.push('cpu', 'memory');
if (result.read_ops == null) missing.push('disk_bytes');
missing.push('network', 'tokens', 'cost');
const event = makeEvent({
  event_type: 'process', occurred_at: startedAt, duration_ms: result.wall_ms,
  issue, variant, task: { id: taskId, label, execution_id: `run:${startedAt}` },
  activity, tool: path.basename(command[0]) || 'command', model: null, provider: null,
  environment: { os: `${process.platform} ${process.arch}`, node: process.version, runner: 'local', ddev: null, docker: null },
  outcome, validation: 'not-run', commit, patch: null,
  source: { adapter: 'process-wrapper', method: '/usr/bin/time -l|-v plus wall clock', confidence: result.time_format === 'none' ? 'unavailable' : 'measured', reference: null },
  measurements: {
    cpu: { user_seconds: result.user_seconds, system_seconds: result.system_seconds, total_seconds: totalCpu, cpu_percent: totalCpu != null && result.wall_ms ? Math.round(100 * totalCpu / (result.wall_ms / 1000) * 100) / 100 : null, measurement: totalCpu == null ? 'unavailable' : 'measured', source: result.time_format === 'none' ? null : '/usr/bin/time' },
    memory: { peak_rss_bytes: result.max_rss_bytes, measurement: result.max_rss_bytes == null ? 'unavailable' : 'measured' },
    io: { read_ops: result.read_ops, write_ops: result.write_ops, read_bytes: null, write_bytes: null, measurement: result.read_ops == null ? 'unavailable' : 'measured' },
    network: { rx_bytes: null, tx_bytes: null, measurement: 'unavailable' },
  },
  quality: { completeness: totalCpu != null && result.max_rss_bytes != null ? 'complete' : 'partial', missing, notes: ['Block I/O is recorded as operations, not bytes. Network, tokens and cost are not measured by this wrapper.'] },
  private: { command_hash: sha256(command.join('\0') + '\0' + process.cwd()), command_label: label, exit_status: result.status, signal: result.signal, timed_out: result.timedOut, error: result.error, budget_mode: budget.mode },
});
if (!noRecord) {
  appendEvents([event]);
  appendEvents([monitoringEvent({ adapter: 'resource-run', startedAt, durationMs: Date.now() - started, note: 'Wrapper and ledger overhead for one measured command; does not include the child CPU already in the process event.' })]);
}
console.log(`\n${outcome}: ${result.status ?? result.signal ?? 'error'} in ${(result.wall_ms / 1000).toFixed(1)} s; CPU ${totalCpu == null ? 'unavailable' : `${totalCpu.toFixed(2)} s`}; peak RSS ${result.max_rss_bytes == null ? 'unavailable' : `${(result.max_rss_bytes / 1048576).toFixed(1)} MiB`}.`);
if (result.stderr) console.error(result.stderr);
if (val('json', null)) fs.writeFileSync(path.resolve(val('json', null)), JSON.stringify({ budget, event }, null, 2));
if (result.timedOut) process.exit(124);
process.exit(result.status ?? 1);
