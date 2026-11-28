#!/usr/bin/env node
// Claim and check an agent session's path scope in a shared checkout. This is advisory and read-only for the repository:
// it creates local scope/index files under .lab-cache, and `check` only reports files outside the claim.
//   node scripts/agent-scope.mjs start --issue <nid> --path <dir-or-file>... [--session <id>] [--force]
//   node scripts/agent-scope.mjs check [--session <id>] [--json]
//   node scripts/agent-scope.mjs show  [--session <id>]
//   node scripts/agent-scope.mjs index [--session <id>]    create a per-session GIT_INDEX_FILE
//   node scripts/agent-scope.mjs clear [--session <id>]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot } from '../tools/compare/lib.mjs';
import { sessionId, indexPath, readScope, writeScope, removeScope, makeScope, outsidePaths, parseStatusZ } from '../tools/compare/agent-scope.mjs';

const args = process.argv.slice(2);
const cmd = args[0];
const val = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null; };
const vals = (name) => args.flatMap((a, i) => (args[i - 1] === `--${name}` ? [a] : []));
const session = val('session') || sessionId();
const json = args.includes('--json');
const force = args.includes('--force');
const run = (a, o = {}) => spawnSync('git', ['-C', labRoot, ...a], { encoding: 'utf8', ...o });
const git = (a) => { const r = run(a); return r.status === 0 ? (r.stdout || '').trim() : ''; };
if (!['start', 'check', 'show', 'index', 'clear'].includes(cmd)) {
  console.error('usage: agent-scope.mjs start --issue <nid> --path <path>... [--session id] [--force] | check [--json] | show | index | clear');
  process.exit(2);
}

if (cmd === 'start') {
  const existing = readScope(labRoot, session);
  if (existing && !force) { console.error(`session ${session} already has a scope (started ${existing.started}). Use --force only after the earlier claim has ended.`); process.exit(1); }
  const issue = val('issue');
  const paths = vals('path');
  if (!paths.length) { console.error('start needs at least one --path (a directory or file relative to the checkout)'); process.exit(2); }
  let scope;
  try { scope = makeScope({ issue, paths, session, branch: git(['branch', '--show-current']) || null, head: git(['rev-parse', '--short', 'HEAD']) || null }); }
  catch (e) { console.error(e.message); process.exit(2); }
  console.log(`scope ${session}: ${scope.paths.join(', ')}${issue ? ` (issue #${issue})` : ''}`);
  console.log(`wrote ${path.relative(labRoot, writeScope(labRoot, scope))}`);
} else if (cmd === 'check') {
  const scope = readScope(labRoot, session);
  if (!scope) { console.error(`no scope for session ${session}; run: node scripts/agent-scope.mjs start --issue <nid> --path <path>...`); process.exit(1); }
  const status = parseStatusZ(run(['status', '--porcelain', '-z']).stdout || '');
  const outside = outsidePaths(scope, status);
  const branch = git(['branch', '--show-current']);
  const head = git(['rev-parse', '--short', 'HEAD']);
  const result = { session, issue: scope.issue, paths: scope.paths, branch, head, stated_branch: scope.branch, stated_head: scope.head, dirty: status.length, outside };
  if (json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`Scope ${session}${scope.issue ? ` (#${scope.issue})` : ''}: ${scope.paths.join(', ')}`);
    console.log(`  ${status.length} changed path(s); ${outside.length} outside the scope.`);
    if (scope.head && head !== scope.head) console.log(`  WARN HEAD moved ${scope.head} -> ${head}; confirm the work is still yours.`);
    if (outside.length) { console.log('  Outside the scope:'); for (const f of outside.slice(0, 40)) console.log(`    ${f}`); if (outside.length > 40) console.log(`    ... and ${outside.length - 40} more`); }
    console.log('  Advisory only: nothing was staged, reverted, stashed or deleted.');
  }
  process.exit(outside.length ? 1 : 0);
} else if (cmd === 'show') {
  const scope = readScope(labRoot, session);
  if (!scope) { console.error(`no scope for session ${session}`); process.exit(1); }
  console.log(JSON.stringify(scope, null, 2));
} else if (cmd === 'index') {
  const target = indexPath(labRoot, session);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (!fs.existsSync(target)) {
    const r = spawnSync('git', ['-C', labRoot, 'read-tree', 'HEAD'], { encoding: 'utf8', env: { ...process.env, GIT_INDEX_FILE: target } });
    if (r.status !== 0) { console.error(`could not initialise the per-session index: ${(r.stderr || '').trim()}`); process.exit(1); }
  }
  console.log(`GIT_INDEX_FILE=${target}`);
  console.log('Use it for staging/committing this session only, for example:');
  console.log(`  GIT_INDEX_FILE=${target} git add -- <your paths>`);
  console.log(`  GIT_INDEX_FILE=${target} git commit -m "..."`);
} else if (cmd === 'clear') {
  removeScope(labRoot, session);
  console.log(`cleared scope for ${session}; the per-session index, if any, was not touched`);
}
