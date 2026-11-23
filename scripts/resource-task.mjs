#!/usr/bin/env node
// Local explicit-task records for the resource ledger. This is metadata for attribution, not a second issue tracker.
//   node scripts/resource-task.mjs start <task-id> --kind=<kind> --deliverable=<deliverable> [--issue=<nid>] [--variant=<slug>] [--label=...] [--session=<transcript.jsonl>] [--description=...]
//   node scripts/resource-task.mjs update <task-id> [--state=...] [--verified|--unverified] [--session=<file>] [--evidence=<ref>] [--deliverable=...]
//   node scripts/resource-task.mjs list [--json=<file>]
//   node scripts/resource-task.mjs show <task-id>
// Description, evidence and session names are local-only. Never add a public report or dashboard field from them.
import fs from 'node:fs';
import { loadTasks, recordTask, TASK_STATES, TASK_KINDS, DELIVERABLES, taskFileRelative } from '../tools/resource/tasks.mjs';
import { iso } from '../tools/resource/events.mjs';

const args = process.argv.slice(2), cmd = args[0];
const val = (n, d = null) => { const a = args.find((x) => x.startsWith(`--${n}=`)); if (a) return a.slice(n.length + 3); const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const all = (n) => args.filter((x) => x.startsWith(`--${n}=`)).map((x) => x.slice(n.length + 3)).concat(args.flatMap((x, i) => x === `--${n}` && args[i + 1] && !args[i + 1].startsWith('--') ? [args[i + 1]] : []));
const id = args[1] && !args[1].startsWith('--') ? args[1] : null;
const tasks = loadTasks();
const current = id ? tasks.find((t) => t.task_id === id) : null;

function start() {
  if (!id) { console.error('usage: node scripts/resource-task.mjs start <task-id> --kind=<kind> --deliverable=<deliverable>'); process.exit(2); }
  const record = recordTask({
    ...(current || {}), task_id: id,
    issue: val('issue', current?.issue), variant: val('variant', current?.variant), label: val('label', current?.label),
    description: val('description', current?.description), kind: val('kind', current?.kind),
    state: val('state', 'in_progress'), expected_deliverable: val('deliverable', current?.expected_deliverable),
    verified: current?.verified ?? null, sessions: [...(current?.sessions || []), ...all('session')],
    evidence: [...(current?.evidence || []), ...all('evidence')],
    started_at: current?.started_at || iso(), ended_at: current?.ended_at || null,
  });
  console.log(`Recorded task ${record.task_id} (${record.state}). Local record: ${taskFileRelative}`);
}

function update() {
  if (!id || !current) { console.error(current ? 'task id required' : `No task record for ${id}. Start it first.`); process.exit(current ? 2 : 1); }
  const verified = args.includes('--verified') ? true : args.includes('--unverified') ? false : current.verified ?? null;
  const state = val('state', current.state);
  if (!TASK_STATES.includes(state)) { console.error(`state must be one of ${TASK_STATES.join(', ')}`); process.exit(2); }
  const record = recordTask({
    ...current, state, verified,
    expected_deliverable: val('deliverable', current.expected_deliverable),
    sessions: [...(current.sessions || []), ...all('session')],
    evidence: [...(current.evidence || []), ...all('evidence')],
    ended_at: ['completed_claimed', 'completed_verified', 'abandoned'].includes(state) ? (current.ended_at || iso()) : current.ended_at,
  });
  console.log(`Updated task ${record.task_id}: state=${record.state}, verified=${record.verified}. Local record: ${taskFileRelative}`);
}

function list() {
  const out = { generated_at: iso(), local_only: true, note: 'Descriptions and evidence are local-only; do not publish.', file: taskFileRelative, states: TASK_STATES, kinds: TASK_KINDS, deliverables: DELIVERABLES, tasks };
  if (val('json')) { fs.writeFileSync(val('json'), `${JSON.stringify(out, null, 2)}\n`); console.log(`Wrote ${val('json')} (local-only).`); return; }
  if (!tasks.length) { console.log(`No explicit tasks in ${taskFileRelative}.`); return; }
  console.log('task_id                          state                 kind                     deliverable               sessions  verified');
  for (const t of tasks) console.log([String(t.task_id).padEnd(32), String(t.state || '—').padEnd(21), String(t.kind || '—').padEnd(24), String(t.expected_deliverable || '—').padEnd(25), String((t.sessions || []).length).padStart(8), String(t.verified ?? '—').padStart(8)].join(' '));
  console.log(`\nLocal record: ${taskFileRelative} (descriptions and evidence are not published).`);
}

function show() {
  if (!current) { console.error(`No task record for ${id}.`); process.exit(1); }
  console.log(JSON.stringify({ ...current, local_only: true }, null, 2));
}

if (cmd === 'start') start();
else if (cmd === 'update') update();
else if (cmd === 'list') list();
else if (cmd === 'show') show();
else { console.error('usage: node scripts/resource-task.mjs start|update|list|show ...'); process.exit(2); }
