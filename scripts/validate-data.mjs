#!/usr/bin/env node
// Validate the repository data the lab publishes, not just synthetic fixtures: issue status snapshots, the generated issue
// index and FOCUS report, and the variants/patch/recipe references. No network, no Docker, no writes.
//
//   node scripts/validate-data.mjs [--json] [--warn]
//
// A malformed status.json is reported against its issue and does not stop the other checks. Exit 1 when any hard problem is
// found; --warn exits 0 and is for a migration window.
import fs from 'node:fs';
import path from 'node:path';
import { labRoot, variants } from '../tools/compare/lib.mjs';
import { issueNids, issueDir, buildIndex } from '../tools/compare/issue-tracking.mjs';
import { validateStatus } from '../tools/compare/issue-status.mjs';
import { readCommunication, validateFile as validateCommunication, communicationPath } from '../tools/compare/communication.mjs';
import { focusIssues, focusMarkdown } from '../tools/compare/issue-focus.mjs';

const args = process.argv.slice(2);
const json = args.includes('--json'), warn = args.includes('--warn');
const errors = [], warnings = [];

for (const nid of issueNids(labRoot)) {
  const file = path.join(issueDir(labRoot, nid), 'status.json');
  if (!fs.existsSync(file)) continue;
  let raw;
  try { raw = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { errors.push(`#${nid}: status.json is not JSON: ${e.message}`); continue; }
  const result = validateStatus(raw);
  for (const e of result.errors || []) errors.push(`#${nid}: status.json ${e.path || '/'} ${e.message}`);
  if (fs.existsSync(communicationPath(labRoot, nid))) {
    const comm = validateCommunication(readCommunication(labRoot, nid));
    for (const e of comm.errors || []) errors.push(`#${nid}: communication.json ${e.path || '/'} ${e.message}`);
  }
}

try {
  const { md } = buildIndex(labRoot);
  const file = path.join(labRoot, 'reports/issues/README.md');
  const actual = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (actual !== md) errors.push('reports/issues/README.md is out of date: run node scripts/index-issues.mjs');
} catch (e) { errors.push(`issue index could not be generated: ${e.message}`); }

try {
  const { rows, counts } = focusIssues(labRoot);
  const expected = focusMarkdown(rows, counts);
  const file = path.join(labRoot, 'reports/issues/FOCUS.md');
  const actual = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (actual !== expected) errors.push('reports/issues/FOCUS.md is out of date: run node scripts/focus-issues.mjs --write');
} catch (e) { errors.push(`FOCUS report could not be generated: ${e.message}`); }

try {
  const all = variants();
  for (const v of all) {
    if (!v.before?.env || !v.after?.env) errors.push(`${v.slug}: before.env and after.env are required`);
    for (const p of [...(v.before?.patches || []), ...(v.after?.patches || [])]) {
      if (!fs.existsSync(path.join(labRoot, p))) errors.push(`${v.slug}: patch missing ${p}`);
    }
    if (v.recipe && !fs.existsSync(path.join(labRoot, 'recipes', v.recipe))) errors.push(`${v.slug}: recipe missing recipes/${v.recipe}`);
  }
} catch (e) { errors.push(`variants do not resolve: ${e.message}`); }

const result = { generated_at: new Date().toISOString(), errors, warnings, ok: errors.length === 0 };
if (json) console.log(JSON.stringify(result, null, 2));
else {
  console.log(`Data validation: ${result.ok ? 'OK' : `${errors.length} problem(s)`}`);
  for (const e of errors) console.log(`  ERROR ${e}`);
  for (const w of warnings) console.log(`  WARN  ${w}`);
  if (!result.ok) console.log('  Run the named generator or fix the status record; nothing was written.');
}
process.exit(errors.length && !warn ? 1 : 0);
