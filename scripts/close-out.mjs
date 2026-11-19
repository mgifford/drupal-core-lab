// Close an issue's work before the next one starts: nothing uncommitted, no orphaned evidence. Pushes nothing.
//   node scripts/close-out.mjs <nid> [--commit] [--message "<subject>"] [--no-refresh]
// 1. unless --no-refresh: regenerates COVERAGE.md (scripts/coverage.mjs) and the issue list (scripts/index-issues.mjs)
// 2. lists every uncommitted or untracked path (git status, each file) and sorts it into "this issue" (its report folder, recipes,
//    evaluator, variants.json, the generated issue list and cloud/) or "other" (not touched here: decide what it is)
// 3. flags incomplete evidence runs: a reports/issues/<nid>/playwright/<run> folder with no results.json, no infrastructure-error.json
//    and no ABORTED.md (a note saying why it stopped; the folder is kept as history, never deleted by this script)
// 4. says which of the issue's sites are still running (scripts/lab-env.mjs stop <slug>)
// --commit stages only the "this issue" paths and commits them locally (AI-assisted trailer included). Exit 0 only when the working
// tree is clean afterwards, no run is incomplete and nothing is "other". A push still needs the owner's approval (AGENTS.md rule 4).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot, variants } from '../tools/compare/lib.mjs';

const args = process.argv.slice(2);
const nid = args.find((a, i) => /^\d{5,8}$/.test(a) && args[i - 1] !== '--message');
if (!nid) { console.error('usage: node scripts/close-out.mjs <nid> [--commit] [--message "<subject>"] [--no-refresh]'); process.exit(2); }
const mi = args.indexOf('--message'), message = mi >= 0 && args[mi + 1] ? args[mi + 1] : `Close out #${nid}: retain evidence and record the final state`;
const run = (cmd, a, o = {}) => spawnSync(cmd, a, { cwd: labRoot, encoding: 'utf8', ...o });
const git = (a) => run('git', a);

if (!fs.existsSync(path.join(labRoot, 'reports/issues', nid))) { console.error(`No reports/issues/${nid}: nothing to close.`); process.exit(2); }

if (!args.includes('--no-refresh')) {
  for (const [label, a] of [['coverage', ['scripts/coverage.mjs', nid]], ['issue list', ['scripts/index-issues.mjs']]]) {
    const r = run('node', a); console.log(`${r.status === 0 ? 'refreshed' : 'COULD NOT REFRESH'} ${label}${r.status === 0 ? '' : `: ${(r.stderr || r.stdout).trim().split('\n')[0]}`}`);
  }
}

const mine = (p) => p.startsWith(`reports/issues/${nid}/`) || p.startsWith(`recipes/repro_${nid}`) || p.startsWith(`tools/playwright/evaluate-${nid}`)
  || p.startsWith('patches/') && p.includes(nid) || p === 'tools/compare/variants.json' || p === 'reports/issues/README.md' || p.startsWith('cloud/');
const changes = () => git(['status', '--porcelain', '-uall', '-z']).stdout.split('\0').filter(Boolean).map((l) => ({ code: l.slice(0, 2), file: l.slice(3).replace(/^.* -> /, '') }));

const incomplete = [];
const pw = path.join(labRoot, 'reports/issues', nid, 'playwright');
if (fs.existsSync(pw)) for (const d of fs.readdirSync(pw)) {
  const dir = path.join(pw, d);
  if (fs.statSync(dir).isDirectory() && !['results.json', 'infrastructure-error.json', 'ABORTED.md'].some((f) => fs.existsSync(path.join(dir, f)))) incomplete.push(`reports/issues/${nid}/playwright/${d}`);
}

let list = changes();
if (args.includes('--commit')) {
  const own = list.filter((c) => mine(c.file));
  if (!own.length) console.log('Nothing of this issue to commit.');
  else {
    const add = git(['add', '--', ...own.map((c) => c.file)]);
    if (add.status !== 0) { console.error(add.stderr); process.exit(1); }
    const body = `${message}\n\nAI-assisted draft evidence; unreviewed by a person.\n\nCo-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>\n`;
    const c = git(['commit', '-q', '-m', body]);
    if (c.status !== 0) { console.error(c.stderr || c.stdout); process.exit(1); }
    console.log(`Committed ${own.length} file(s): ${git(['log', '--oneline', '-1']).stdout.trim()}`);
  }
  list = changes();
}

const other = list.filter((c) => !mine(c.file)), own = list.filter((c) => mine(c.file));
const show = (title, items, f) => { if (items.length) { console.log(`\n${title} (${items.length}):`); for (const i of items.slice(0, 40)) console.log(`  ${f(i)}`); if (items.length > 40) console.log(`  ... and ${items.length - 40} more`); } };
show('Uncommitted, this issue (run with --commit)', own, (c) => `${c.code} ${c.file}`);
show('Uncommitted, NOT this issue (commit, ignore or delete it on purpose)', other, (c) => `${c.code} ${c.file}`);
show('Incomplete evidence runs (no results.json: re-run it, or add an ABORTED.md saying what is known)', incomplete, (x) => x);

const sites = variants().filter((v) => v.slug.startsWith(`${nid}-`) || String(v.issue) === nid).map((v) => v.slug);
const st = run('node', ['scripts/lab-env.mjs', 'status']);
const running = sites.filter((s) => new RegExp(`${s}[^\\n]*running`, 'i').test(st.stdout || ''));
if (running.length) console.log(`\nStill running: ${running.join(', ')}. Stop them: ${running.map((s) => `node scripts/lab-env.mjs stop ${s}`).join(' ; ')}`);

const ok = !list.length && !incomplete.length;
console.log(ok ? `\n#${nid} is closed out: working tree clean, no incomplete runs. Nothing is pushed; ask the owner before pushing.` : `\n#${nid} is NOT closed out.`);
process.exit(ok ? 0 : 1);
