// Where to focus among the issues the lab has evaluated. Offline: reads reports/issues/<nid>/status.json, BRANCHES.md and
// ARCHIVED.md; no model, no network and nothing posted. The weekly issue-status Action writes reports/issues/FOCUS.md from this.
//   node scripts/focus-issues.mjs                  print the full report
//   node scripts/focus-issues.mjs --write          write reports/issues/FOCUS.md
//   node scripts/focus-issues.mjs --summary        print the compact Action/PR summary
//   node scripts/focus-issues.mjs --json=<file>    write the classification as JSON (local inspection)
import fs from 'node:fs';
import path from 'node:path';
import { labRoot } from '../tools/compare/lib.mjs';
import { focusIssues, focusMarkdown, focusSummary } from '../tools/compare/issue-focus.mjs';

const args = process.argv.slice(2);
const val = (n) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const { rows, counts } = focusIssues(labRoot);
const full = focusMarkdown(rows, counts);
if (args.includes('--write')) {
  const file = path.join(labRoot, 'reports/issues/FOCUS.md');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, full);
  console.log(`Wrote ${path.relative(labRoot, file)}: ${counts.review} review, ${counts.rtbc} RTBC, ${counts.work} needs work, ${counts.watch} active, ${counts.closeout} close-out.`);
} else if (args.includes('--summary')) {
  console.log(focusSummary(rows, counts));
} else {
  console.log(full);
}
if (val('json')) {
  fs.writeFileSync(path.resolve(val('json')), `${JSON.stringify({ counts, rows: rows.map(({ dir, status, rec, archived, ...r }) => r) }, null, 2)}\n`);
  console.log(`Wrote ${val('json')}.`);
}
