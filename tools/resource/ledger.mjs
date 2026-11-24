// Append-only local ledger. The file is under .lab-cache/ and is never committed. Reading it is deterministic: a later
// snapshot of the same mutable source (source_key) supersedes the earlier one, so re-collecting a growing transcript
// does not double-count it.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeEvent, validateEvent, iso, safeText } from './events.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
export const labRoot = path.resolve(here, '../..');
export const LEDGER_DIR = path.join(labRoot, '.lab-cache/resource-ledger');
export const LEDGER_FILE = path.join(LEDGER_DIR, 'events.jsonl');

export function ensureLedger() { fs.mkdirSync(LEDGER_DIR, { recursive: true }); }

export function readRaw(file = LEDGER_FILE) {
  if (!fs.existsSync(file)) return { events: [], invalid: [], lines: 0 };
  const rows = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
  const events = [], invalid = [];
  for (const [i, line] of rows.entries()) {
    try {
      const event = JSON.parse(line);
      const result = validateEvent(event);
      if (!result.ok) invalid.push({ line: i + 1, problems: result.errors.slice(0, 3).map((e) => `${e.path || '/'} ${e.message}`) });
      else events.push(event);
    } catch (e) { invalid.push({ line: i + 1, problems: [safeText(e.message, 160)] }); }
  }
  return { events, invalid, lines: rows.length };
}

// Latest revision per mutable source, all immutable events. A malformed line is skipped and reported, never allowed to
// make the whole ledger unreadable.
export function loadEvents({ file = LEDGER_FILE, includeSuperseded = false, includeMonitoring = true } = {}) {
  const raw = readRaw(file);
  const latest = new Map(), immutable = [];
  for (const event of raw.events) {
    if (!includeMonitoring && event.activity === 'monitoring') continue;
    if (!event.source_key) { immutable.push(event); continue; }
    const prev = latest.get(event.source_key);
    if (!prev) { latest.set(event.source_key, event); continue; }
    const better = (event.revision || 1) > (prev.revision || 1) || ((event.revision || 1) === (prev.revision || 1) && String(event.recorded_at) > String(prev.recorded_at));
    if (better) { if (!includeSuperseded && prev) event.__superseded = [prev.event_id, ...(prev.__superseded || [])]; latest.set(event.source_key, event); }
    else if (includeSuperseded) immutable.push(event);
  }
  const events = [...immutable, ...[...latest.values()]].sort((a, b) => String(a.occurred_at).localeCompare(String(b.occurred_at)) || a.event_id.localeCompare(b.event_id));
  return { events, invalid: raw.invalid, lines: raw.lines };
}

export function appendEvents(input, { file = LEDGER_FILE, now = iso() } = {}) {
  ensureLedger();
  const existing = readRaw(file).events;
  const byId = new Set(existing.map((e) => e.event_id));
  const latestBySource = new Map();
  for (const e of existing) if (e.source_key && (!latestBySource.has(e.source_key) || (e.revision || 1) > (latestBySource.get(e.source_key).revision || 1))) latestBySource.set(e.source_key, e);
  const added = [], skipped = [];
  for (const candidate of input) {
    let event = candidate;
    if (!event.event_id) event = makeEvent(event);
    const check = validateEvent(event);
    if (!check.ok) throw new Error(`refusing to append an invalid resource event: ${check.errors.slice(0, 5).map((e) => `${e.path || '/'} ${e.message}`).join('; ')}`);
    if (byId.has(event.event_id)) { skipped.push({ event_id: event.event_id, reason: 'identical event already in the ledger' }); continue; }
    if (event.source_key) {
      const prev = latestBySource.get(event.source_key);
      if (prev) {
        // A newer snapshot of the same mutable source replaces the previous one in aggregation.
        event = { ...event, supersedes: prev.event_id, revision: (prev.revision || 1) + 1 };
        const recheck = validateEvent(event); if (!recheck.ok) throw new Error(`invalid superseding event: ${recheck.errors[0]?.message}`);
        if (byId.has(event.event_id)) { skipped.push({ event_id: event.event_id, reason: 'snapshot already recorded' }); continue; }
      }
    }
    fs.appendFileSync(file, `${JSON.stringify(event)}\n`);
    byId.add(event.event_id); if (event.source_key) latestBySource.set(event.source_key, event); added.push(event);
  }
  return { added, skipped, recorded_at: now };
}

export function compact({ file = LEDGER_FILE } = {}) {
  const { events } = loadEvents({ file });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const archive = path.join(LEDGER_DIR, `events-${stamp}.archive.jsonl`);
  if (fs.existsSync(file)) fs.copyFileSync(file, archive);
  fs.writeFileSync(file, events.map((e) => JSON.stringify({ ...e, __superseded: undefined })).join('\n') + (events.length ? '\n' : ''));
  return { kept: events.length, archive: path.relative(labRoot, archive) };
}

export function recent({ file = LEDGER_FILE, limit = 20 } = {}) {
  const { events, invalid } = loadEvents({ file, includeSuperseded: false });
  return { events: events.slice(-Math.max(1, limit)).reverse(), invalid };
}

// The collector's own cost. `process.resourceUsage()` is the collector process, not the child it measured; it is
// recorded as a separate monitoring event and never mixed into the activity totals.
export function monitoringEvent({ adapter, startedAt, durationMs, note }) {
  const usage = process.resourceUsage();
  const cpuSeconds = (usage.userCPUTime + usage.systemCPUTime) / 1_000_000;
  return makeEvent({
    event_type: 'monitoring', occurred_at: startedAt, duration_ms: durationMs || 0,
    task: { id: `monitor:${adapter}`, label: 'Resource collection overhead', execution_id: null },
    activity: 'monitoring', tool: 'resource-collect', provider: null, model: null,
    outcome: 'success', validation: 'not-run',
    source: { adapter: 'self', method: 'process.resourceUsage()', confidence: 'measured', reference: null },
    measurements: {
      cpu: { user_seconds: usage.userCPUTime / 1_000_000, system_seconds: usage.systemCPUTime / 1_000_000, total_seconds: cpuSeconds, cpu_percent: null, measurement: 'measured', source: 'Node process.resourceUsage()' },
      memory: { peak_rss_bytes: usage.maxRSS * 1024, measurement: 'measured' },
      io: { read_bytes: null, write_bytes: null, read_ops: usage.fsRead ?? null, write_ops: usage.fsWrite ?? null, measurement: usage.fsRead == null ? 'unavailable' : 'measured' },
      network: { rx_bytes: null, tx_bytes: null, measurement: 'unavailable' },
    },
    quality: { completeness: 'complete', missing: ['network'], notes: [note || 'Collector process overhead, not the activity it measured.'] },
    private: { collector: adapter },
  });
}
