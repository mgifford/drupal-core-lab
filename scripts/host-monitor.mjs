#!/usr/bin/env node
// Sample host capacity (disk, memory, swap, Docker lab memory, running pairs) on an interval, append the samples to the
// local resource ledger, and alert when a preflight threshold is crossed. It never starts, stops or deletes anything.
//
//   node scripts/host-monitor.mjs [--interval=180] [--once] [--notify] [--dry-run] [--json]
//
// --once samples once and exits (3 when the level is block, for cron/launchd); --notify uses a desktop notification on
// level changes. The ledger is .lab-cache/resource-ledger; reports are generated from it by scripts/resource.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot } from '../tools/compare/lib.mjs';
import { formatPreflight } from '../tools/compare/preflight.mjs';
import { appendEvents } from '../tools/resource/ledger.mjs';
import { collectHost } from '../tools/resource/adapters/host.mjs';

const args = process.argv.slice(2);
const has = (name) => args.some((a) => a === `--${name}` || a.startsWith(`--${name}=`));
const val = (name, fallback) => { const a = args.find((x) => x.startsWith(`--${name}=`)); return a ? a.slice(name.length + 3) : fallback; };
const interval = Math.max(15, Number(val('interval', '180')) || 180);
const once = has('once'), notify = has('notify'), dryRun = has('dry-run'), json = has('json');
const stateFile = path.join(labRoot, '.lab-cache/resource-ledger/host-monitor-state.json');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function readState() { try { return JSON.parse(fs.readFileSync(stateFile, 'utf8')); } catch { return {}; } }
function writeState(state) {
  try { fs.mkdirSync(path.dirname(stateFile), { recursive: true }); fs.writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 }); } catch { /* monitoring must not fail the run */ }
}

function desktopNotify(text) {
  const title = 'Drupal Core Lab host capacity';
  if (process.platform === 'darwin') {
    const script = `display notification ${JSON.stringify(text)} with title ${JSON.stringify(title)}`;
    const r = spawnSync('osascript', ['-e', script], { encoding: 'utf8', timeout: 10000 });
    if (r.status === 0) return true;
  } else {
    const r = spawnSync('notify-send', [title, text], { encoding: 'utf8', timeout: 10000 });
    if (r.status === 0) return true;
  }
  return false;
}

async function tick(state) {
  const { events, errors, metadata } = await collectHost({ samples: 1 });
  if (!metadata.latest) {
    console.error(`host-monitor: sample failed: ${errors.join('; ') || 'no snapshot'}`);
    return { level: 'unknown' };
  }
  const { event, assessment } = metadata.latest;
  if (!dryRun) {
    try { appendEvents(events); } catch (e) { console.error(`host-monitor: could not append to the ledger: ${e.message}`); }
  }
  const host = event.measurements.host;
  const line = `${new Date().toISOString()} host ${assessment.level.toUpperCase()}: disk ${host.disk_free_bytes == null ? '—' : `${(host.disk_free_bytes / 1024 ** 3).toFixed(1)} GB`} free, memory ${host.memory_free_percent == null ? '—' : `${host.memory_free_percent}%`} free, swap ${host.swap_used_percent == null ? '—' : `${host.swap_used_percent}%`}, Docker ${host.docker_used_percent == null ? '—' : `${host.docker_used_percent}%`}, ${host.lab_pairs ?? '—'} pair(s)`;
  console.log(line);
  if (json) console.log(JSON.stringify({ event, assessment }, null, 2));
  if (assessment.level !== 'pass' && assessment.level !== state.last_level) {
    const detail = formatPreflight(assessment).split('\n').slice(1).filter((l) => !/\bPASS\b/.test(l)).join('; ');
    if (notify && !desktopNotify(`${assessment.level.toUpperCase()}: ${detail}`)) console.error('host-monitor: desktop notification unavailable');
  }
  writeState({ ...state, last_level: assessment.level, last_at: new Date().toISOString() });
  return { level: assessment.level, event, assessment };
}

if (once) {
  const result = await tick(readState());
  process.exit(result.level === 'block' ? 3 : 0);
} else {
  const state = readState();
  let running = true;
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { running = false; });
  console.log(`host-monitor: sampling every ${interval}s; ledger ${path.relative(labRoot, path.join(labRoot, '.lab-cache/resource-ledger'))}. Ctrl-C to stop.`);
  while (running) {
    try { await tick(state); } catch (e) { console.error(`host-monitor: ${e.message}`); }
    if (!running) break;
    await sleep(interval * 1000);
  }
}
