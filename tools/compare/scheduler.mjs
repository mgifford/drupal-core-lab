// Observe-first capacity advice for heavy lab operations. It counts existing resource-run operations and active environment
// leases, not processes it cannot see. The default is to record advice; `warn` prints it; `enforce` can refuse a new operation
// only when a caller asks this module before starting. Nothing here kills or stops a running operation.
import { readRunning } from '../resource/budgets.mjs';
import { leaseRows } from './leases.mjs';

export const HEAVY_OPERATIONS = Object.freeze(['test', 'tests', 'phpunit', 'playwright', 'browser', 'build', 'css-build', 'lint', 'composer', 'setup', 'reset', 'trim']);
const isHeavy = (s) => HEAVY_OPERATIONS.includes(String(s || '').toLowerCase());

// A lease may have operation=review (not CPU-heavy) or test/build/setup. Running operations started by resource-run carry an
// activity. Deduplicate by pid so a wrapped operation and its own lease are not counted twice.
export function activeHeavyWork({ running = [], leases = [] } = {}) {
  const rows = [];
  for (const r of running) rows.push({ source: 'operation', pid: r.pid, activity: r.activity || 'unknown', task: r.task || null, issue: r.issue || null });
  for (const l of leases) if (l.status === 'active' && isHeavy(l.operation)) rows.push({ source: 'lease', pid: l.pid, activity: l.operation, task: l.task || null, issue: null });
  const seen = new Set(), unique = [];
  for (const r of rows) { const key = r.pid == null ? `ttl:${r.source}:${r.activity}:${r.task}` : String(r.pid); if (seen.has(key)) continue; seen.add(key); unique.push(r); }
  return unique;
}

export function capacityDecision({ running = [], leases = [], kind = 'test', mode = 'observe', limit = 2, memoryPercent = null } = {}) {
  const active = activeHeavyWork({ running, leases });
  const heavy = isHeavy(kind);
  const count = heavy ? active.length : 0;
  const reasons = [];
  if (heavy && Number(limit) > 0 && count >= Number(limit)) reasons.push(`${count} active heavy operation(s); limit ${limit}`);
  if (memoryPercent != null && memoryPercent >= 85) reasons.push(`Docker memory pressure ${memoryPercent}%`);
  const over = reasons.length > 0;
  const action = !over ? 'allow' : mode === 'enforce' ? 'refuse' : mode === 'warn' ? 'warn' : 'record';
  return {
    kind, mode, limit, memory_percent: memoryPercent, active, active_count: count, heavy, status: over ? 'over' : 'ok', action, reasons,
    note: 'Advisory only unless a caller checks it before starting; it never stops a running operation and cannot see unwrapped work.',
  };
}

export function currentActive({ runningFile, leaseFile, now = Date.now(), host } = {}) {
  return {
    running: runningFile ? readRunning(runningFile) : [],
    leases: leaseFile ? leaseRows(leaseFile, { now, host }) : [],
  };
}
