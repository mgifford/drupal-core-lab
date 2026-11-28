#!/usr/bin/env node
// Warn-only evidence inventory and budget report. Nothing is deleted, moved or untracked.
//   node scripts/evidence-budget.mjs <nid> [--json] [--strict]
//   node scripts/evidence-budget.mjs --all [--write] [--json] [--strict]
import fs from 'node:fs';
import path from 'node:path';
import { labRoot } from '../tools/compare/lib.mjs';
import { loadBudgets, summarizeIssue, aggregateMarkdown, issueMarkdown, BUDGET_FILE } from '../tools/compare/evidence-budget.mjs';

const args = process.argv.slice(2);
const all = args.includes('--all');
const nid = args.find((a) => /^\d{5,8}$/.test(a)) || null;
const json = args.includes('--json'), write = args.includes('--write'), strict = args.includes('--strict');
if (!all && !nid) { console.error('usage: node scripts/evidence-budget.mjs <nid>|--all [--json] [--write] [--strict]'); process.exit(2); }
const loaded = loadBudgets(labRoot);
if (loaded.problems.length) { console.error(`evidence-budgets.yml is not valid:\n  ${loaded.problems.join('\n  ')}`); process.exit(2); }
const issues = all ? fs.readdirSync(path.join(labRoot, 'reports/issues')).filter((d) => /^\d{5,8}$/.test(d)).sort() : [nid];
const rows = issues.map((n) => summarizeIssue(labRoot, n, loaded.config));
const warnings = rows.flatMap((r) => r.warnings.map((w) => `#${r.nid}: ${w}`));
if (json) console.log(JSON.stringify({ source: loaded.source, mode: loaded.config.mode, limits: loaded.config.limits, rows, warnings }, null, 2));
else {
  console.log(`Evidence budget (${loaded.config.mode}; ${loaded.source})\n`);
  console.log(`${'Issue'.padEnd(10)} ${'Files'.padStart(6)} ${'Size'.padStart(10)} ${'Human'.padStart(6)} ${'Structured'.padStart(10)} ${'Raw'.padStart(6)} ${'Images'.padStart(7)} ${'Runs'.padStart(5)} ${'Duplicates'.padStart(10)}  Warnings`);
  for (const r of rows.sort((a, b) => b.bytes - a.bytes)) {
    const size = `${(r.bytes / 1024 ** 2).toFixed(1)} MiB`;
    console.log(`${`#${r.nid}`.padEnd(10)} ${String(r.files).padStart(6)} ${size.padStart(10)} ${String(r.categories.human.files).padStart(6)} ${String(r.categories.structured.files).padStart(10)} ${String(r.categories.raw.files).padStart(6)} ${String(r.images).padStart(7)} ${String(r.runs).padStart(5)} ${String(r.duplicate_runs).padStart(10)}  ${r.warnings.join('; ') || '—'}`);
  }
  if (warnings.length) console.log(`\n${warnings.length} warning(s). Warn-only: nothing was deleted, moved or untracked.`);
  else console.log('\nNo budget warnings.');
}
if (write) {
  if (!all) { console.error('--write writes the cross-issue report; use --all --write'); process.exit(2); }
  const md = aggregateMarkdown(rows, { source: loaded.source, mode: loaded.config.mode, generated: new Date().toISOString() });
  fs.writeFileSync(path.join(labRoot, 'reports/issues/EVIDENCE-BUDGET.md'), md);
  console.log('Wrote reports/issues/EVIDENCE-BUDGET.md');
}
process.exit(strict && warnings.length ? 1 : 0);
