#!/usr/bin/env node
// Track whether a finding has been communicated upstream. This never posts, comments, changes an issue or opens an MR.
//   node scripts/communication.mjs add <nid> --summary "..." [--state new] [--discovered-by human|ai|joint]
//        [--tested-revision "MR !18007 @ 50833b75"] [--evidence <path>]... [--draft <path>] [--note "..."]
//   node scripts/communication.mjs update <nid> <id> [--state ready-to-post|posted|...] [--posted-url <url>]
//        [--independently-addressed <who/url>] [--superseded-by <id/url>] [--decision "..."]... [--note "..."]
//   node scripts/communication.mjs list [<nid>|--all] [--json]     regenerate COMMUNICATION.md
//   node scripts/communication.mjs check                          validate every communication.json
import fs from 'node:fs';
import path from 'node:path';
import { labRoot } from '../tools/compare/lib.mjs';
import { STATES, DISCOVERED_BY, readCommunication, writeCommunication, communicationPath, validateFile, normalizeEntry, rows, issueMarkdown, aggregateMarkdown, needsUpdate } from '../tools/compare/communication.mjs';

const args = process.argv.slice(2);
const cmd = args[0];
const val = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null; };
const vals = (name) => args.flatMap((a, i) => (args[i - 1] === `--${name}` ? [a] : []));
const nid = args[1] && /^\d{5,8}$/.test(args[1]) ? args[1] : null;
const id = args[2] && /^C\d{3}$/.test(args[2]) ? args[2] : null;
const today = () => new Date().toISOString().slice(0, 10);
const usage = () => {
  console.error('usage: node scripts/communication.mjs add <nid> --summary "..." [--state new] [--discovered-by human|ai|joint] [--tested-revision "..."] [--evidence path]... [--draft path] [--note "..."]\n' +
    '       node scripts/communication.mjs update <nid> <C001> [--state ...] [--posted-url URL] [--independently-addressed "who URL"] [--superseded-by ID] [--decision "..."]... [--note "..."]\n' +
    '       node scripts/communication.mjs list [<nid>|--all] [--json] | check');
  process.exit(2);
};

function readAll() {
  const dir = path.join(labRoot, 'reports/issues');
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((d) => /^\d{5,8}$/.test(d)).sort().map((issue) => ({ issue, file: readCommunication(labRoot, issue) })).filter((x) => fs.existsSync(communicationPath(labRoot, x.issue))) : [];
}

function writeIssue(nid, file) {
  const normalized = writeCommunication(labRoot, nid, file);
  fs.writeFileSync(path.join(labRoot, 'reports/issues', nid, 'COMMUNICATION.md'), issueMarkdown(nid, normalized));
  console.log(`#${nid}: ${normalized.entries.length} finding(s); wrote COMMUNICATION.md`);
}
function writeAll() {
  const all = readAll();
  fs.writeFileSync(path.join(labRoot, 'reports/issues/COMMUNICATION.md'), aggregateMarkdown(all));
  const pending = rows(all).filter(needsUpdate).length;
  console.log(`${rows(all).length} finding(s) across ${all.length} issue(s); ${pending} need a next human step. Wrote reports/issues/COMMUNICATION.md`);
  return all;
}

if (cmd === 'add') {
  if (!nid || !val('summary')) usage();
  const state = val('state') || 'new';
  if (!STATES.includes(state)) { console.error(`unknown state ${state}; one of ${STATES.join(', ')}`); process.exit(2); }
  const by = val('discovered-by') || 'unknown';
  if (!DISCOVERED_BY.includes(by)) { console.error(`unknown discovered-by ${by}; one of ${DISCOVERED_BY.join(', ')}`); process.exit(2); }
  const file = readCommunication(labRoot, nid);
  const next = `C${String(file.entries.reduce((m, e) => Math.max(m, Number(e.id.slice(1)) || 0), 0) + 1).padStart(3, '0')}`;
  const entry = normalizeEntry({
    id: next, summary: val('summary'), state, discovered: { by, date: today(), note: val('note') },
    tested_revision: val('tested-revision'), evidence: vals('evidence'), draft: val('draft'),
    decisions: vals('decision'), updated: today(),
  });
  file.entries.push(entry);
  writeIssue(nid, file);
  console.log(`added ${next} in ${state}; no comment was posted.`);
} else if (cmd === 'update') {
  if (!nid || !id) usage();
  const file = readCommunication(labRoot, nid);
  const entry = file.entries.find((e) => e.id === id);
  if (!entry) { console.error(`#${nid} has no ${id}`); process.exit(1); }
  const before = entry.state;
  const state = val('state');
  if (state && !STATES.includes(state)) { console.error(`unknown state ${state}; one of ${STATES.join(', ')}`); process.exit(2); }
  if (state) entry.state = state;
  if (val('posted-url')) entry.posted = { url: val('posted-url'), date: today() };
  if (val('posted-url') && !state) entry.state = 'posted';
  if (val('independently-addressed')) entry.independently_addressed = { by: val('independently-addressed'), url: null, date: today() };
  if (val('superseded-by')) { entry.superseded_by = val('superseded-by'); if (!state) entry.state = 'superseded'; }
  for (const d of vals('decision')) entry.decisions.push(d);
  entry.updated = today();
  entry.history.push({ at: today(), from: before, to: entry.state, note: val('note') || null });
  writeIssue(nid, file);
  console.log(`updated ${id}: ${before} -> ${entry.state}; no comment was posted.`);
} else if (cmd === 'list') {
  if (nid) { const file = readCommunication(labRoot, nid); if (!fs.existsSync(communicationPath(labRoot, nid))) { console.error(`#${nid} has no communication.json; add a finding first`); process.exit(1); } writeIssue(nid, file); }
  else writeAll();
} else if (cmd === 'check') {
  const all = readAll(); const bad = [];
  for (const { issue, file } of all) { const r = validateFile(file); if (!r.ok) bad.push(`#${issue}: ${r.errors.slice(0, 4).map((e) => `${e.path || '/'} ${e.message}`).join('; ')}`); }
  if (bad.length) { for (const b of bad) console.error(`ERROR ${b}`); process.exit(1); }
  console.log(`${all.length} communication file(s) valid; ${rows(all).length} finding(s).`);
} else usage();
