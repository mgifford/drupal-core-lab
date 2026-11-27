// The lab's own JavaScript packages: are the ones this task needs really loadable here, and can a worktree reuse another checkout's?
//   node scripts/deps.mjs [check] [--for=<task>] [--json]   tasks: git, selftest, browser, viewer, lighthouse (tools/compare/deps.mjs)
//   node scripts/deps.mjs link [--from=<checkout>] [--dry-run]
// check   resolves each package the way the lab's code loads it and says where it came from. Without --for it reports every task and
//         exits 0; with --for it exits 1 when that task cannot run (a package missing, or found outside its home).
// link    for a secondary git worktree (or a second clone): symlink tools/playwright/node_modules and tools/compare/.deps/node_modules
//         to another checkout's installed trees instead of a second 90 MB install. --from defaults to the primary checkout. Only
//         when the lockfiles are identical and the source holds exactly the locked versions; a real folder or a working symlink
//         already here is never replaced. The links are local (ignored by git); remove one with `rm <path>` (no trailing slash).
// Installs nothing and deletes nothing. Exit 2 on a usage error.
import path from 'node:path';
import { labRoot } from '../tools/compare/lib.mjs';
import { TASKS, HOMES, checkTask, describeRow, linkPlan, applyLink, primaryCheckout } from '../tools/compare/deps.mjs';

const USAGE = `usage: node scripts/deps.mjs [check] [--for=<${Object.keys(TASKS).join('|')}>] [--json]\n       node scripts/deps.mjs link [--from=<checkout>] [--dry-run]`;
const args = process.argv.slice(2), cmd = args[0] && !args[0].startsWith('--') ? args[0] : 'check';
const val = (n) => { const a = args.find((x) => x.startsWith(`--${n}=`)); if (a) return a.slice(n.length + 3); const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null; };
const known = ['for', 'json', 'from', 'dry-run'];
for (const a of args.filter((x) => x.startsWith('--'))) if (!known.includes(a.slice(2).split('=')[0])) { console.error(`Unknown option ${a}.\n${USAGE}`); process.exit(2); }
if (!['check', 'link'].includes(cmd)) { console.error(USAGE); process.exit(2); }

if (cmd === 'check') {
  const only = val('for');
  if (only && !TASKS[only]) { console.error(`Unknown task ${only}.\n${USAGE}`); process.exit(2); }
  const results = (only ? [only] : Object.keys(TASKS)).map((t) => checkTask(labRoot, t));
  if (args.includes('--json')) { console.log(JSON.stringify({ node: process.versions.node, labRoot, results }, null, 2)); process.exit(only && !results[0].ok ? 1 : 0); }
  for (const r of results) {
    console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.task}: ${r.what}${r.rows.length ? '' : ' (nothing to check)'}`);
    for (const row of r.problems) console.log(`      missing: ${describeRow(row)}`);
    for (const row of r.warnings) console.log(`      warn:    ${describeRow(row)}`);
    if (r.chromium && !r.chromium.ok) console.log(`      missing: Playwright Chromium ${r.chromium.detail}\n      fix:     ${r.chromium.fix}`);
    for (const f of r.fixes) console.log(`      fix:     ${f}`);
  }
  const worktree = primaryCheckout(labRoot);
  if (results.some((r) => r.problems.length) && worktree && worktree !== labRoot) console.log(`\nThis is a secondary checkout of ${worktree}. To reuse its installed packages instead of installing again: node scripts/deps.mjs link`);
  process.exit(only && !results[0].ok ? 1 : 0);
}

// link
const from = path.resolve(val('from') || primaryCheckout(labRoot) || labRoot);
if (from === labRoot && !val('from')) { console.log(`This is the primary checkout (${labRoot}); there is nothing to link to. Install here:\n  ${HOMES.playwright.install}\n  ${HOMES.deps.install} js-yaml@4 axe-core@4`); process.exit(0); }
const plan = linkPlan(labRoot, from), dry = args.includes('--dry-run');
for (const p of plan) console.log(`${p.action.toUpperCase().padEnd(7)} ${p.dest}${p.action === 'link' ? ` -> ${p.target}` : ''}: ${p.reason}`);
if (dry) { console.log('\nDry run: nothing was changed.'); process.exit(0); }
applyLink(labRoot, plan);
const after = checkTask(labRoot, 'selftest');
console.log(`\nAfter linking, the static selftest's packages ${after.ok ? 'resolve' : 'do NOT all resolve'}:`);
for (const row of after.rows) console.log(`  ${row.status === 'ok' ? 'ok  ' : row.status.padEnd(4)} ${describeRow(row)}`);
process.exit(plan.some((p) => p.action === 'refuse') || !after.ok ? 1 : 0);
