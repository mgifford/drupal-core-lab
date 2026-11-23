// Deterministic performance check for the resource monitoring path. It times parsing the local ledger, aggregation and
// public-row construction, and reports sizes. No model, no network. Run after a collection change:
//   node scripts/resource-benchmark.mjs [--json=<file>]
import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { labRoot, loadEvents, LEDGER_FILE } from '../tools/resource/ledger.mjs';
import { aggregate, publicRows } from '../tools/resource/aggregate.mjs';
import { assertPublic } from '../tools/resource/public.mjs';

const jsonOut = process.argv.find((a) => a.startsWith('--json='))?.slice('--json='.length);
const time = (fn) => { const t = performance.now(); const value = fn(); return { value, ms: Math.round((performance.now() - t) * 100) / 100 }; };
const ledgerBytes = fs.existsSync(LEDGER_FILE) ? fs.statSync(LEDGER_FILE).size : 0;
const loaded = time(() => loadEvents({ includeMonitoring: true }));
const summary = time(() => aggregate(loaded.value.events));
const rows = time(() => publicRows(loaded.value.events));
const publicObj = { ...summary.value, events: rows.value, monitoring: summary.value.totals.monitoring, data_quality: summary.value.quality, privacy: { public_fields: 'aggregate', raw_ledger: 'local', missing_is_not_zero: true } };
assertPublic(publicObj, 'benchmark public summary');
const json = JSON.stringify(publicObj);
const result = {
  generated_at: new Date().toISOString(),
  ledger: { file: path.relative(labRoot, LEDGER_FILE), bytes: ledgerBytes, lines: loaded.value.lines, events: loaded.value.events.length, invalid: loaded.value.invalid.length },
  parse_ms: loaded.ms,
  aggregate_ms: summary.ms,
  public_rows_ms: rows.ms,
  public_rows: rows.value.length,
  public_json_bytes: Buffer.byteLength(json),
  events_by_type: Object.fromEntries([...new Set(loaded.value.events.map((e) => e.event_type))].sort().map((t) => [t, loaded.value.events.filter((e) => e.event_type === t).length])),
  memory_rss_bytes: process.memoryUsage().rss,
  note: 'Wall-clock timings on this host; not a performance target. The collector is on-demand, not a daemon.',
};
if (jsonOut) { fs.writeFileSync(jsonOut, `${JSON.stringify(result, null, 2)}\n`); console.log(`Wrote ${jsonOut}`); }
else console.log(JSON.stringify(result, null, 2));
