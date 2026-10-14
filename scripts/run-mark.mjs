// Mark a recorded run as superseded instead of deleting it: the folder stays as history, scripts/coverage.mjs stops counting it
// and lists it under "Superseded runs" with the reason.
//   node scripts/run-mark.mjs <run folder> --superseded --reason "<why>" [--by <newer run folder>]
//   node scripts/run-mark.mjs <run folder> --clear          undo
// <run folder> is reports/issues/<nid>/playwright/<stamp>-<env> (or just its last part, with --issue <nid>).
import fs from 'node:fs';
import path from 'node:path';
import { labRoot } from '../tools/compare/lib.mjs';

const args = process.argv.slice(2);
const val = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null; };
const target = args.find((a, i) => !a.startsWith('--') && !['--reason', '--by', '--issue'].includes(args[i - 1]));
const usage = () => { console.error('usage: node scripts/run-mark.mjs <run folder> --superseded --reason "<why>" [--by <newer run folder>] | --clear   [--issue <nid>]'); process.exit(2); };
if (!target) usage();
const resolveRun = (p) => {
  const issue = val('issue');
  const cands = [path.resolve(p), path.join(labRoot, p), ...(issue ? [path.join(labRoot, 'reports/issues', issue, 'playwright', p)] : [])];
  return cands.find((c) => fs.existsSync(path.join(c, 'results.json')));
};
const dir = resolveRun(target);
if (!dir) { console.error(`No results.json found for ${target}${val('issue') ? '' : ' (give the full path, or --issue <nid>)'}`); process.exit(1); }
const f = path.join(dir, 'results.json');
const r = JSON.parse(fs.readFileSync(f, 'utf8'));
if (args.includes('--clear')) { delete r.superseded; }
else if (args.includes('--superseded')) {
  const reason = val('reason'); if (!reason) usage();
  const byArg = val('by'); let by = null;
  if (byArg) { const b = resolveRun(byArg); if (!b) { console.error(`--by: no results.json found for ${byArg}`); process.exit(1); } if (b === dir) { console.error('--by cannot be the run itself'); process.exit(1); } by = path.basename(b); }
  r.superseded = { on: new Date().toISOString().slice(0, 10), reason, by };
} else usage();
fs.writeFileSync(f, JSON.stringify(r, null, 2) + '\n');
const sumF = path.join(dir, 'SUMMARY.md');
if (fs.existsSync(sumF)) {
  const BANNER = /^> \*\*Superseded[^\n]*\n\n/;
  let md = fs.readFileSync(sumF, 'utf8').replace(BANNER, '');
  if (r.superseded) md = `> **Superseded** ${r.superseded.on}: ${r.superseded.reason.replace(/[.!?]?$/, '.')}${r.superseded.by ? ` See \`${r.superseded.by}\`.` : ''} Not counted in COVERAGE.md.\n\n` + md;
  fs.writeFileSync(sumF, md);
}
console.log(`${r.superseded ? 'Marked superseded' : 'Cleared'}: ${path.relative(labRoot, dir)}. Refresh: node scripts/coverage.mjs ${r.issue || '<nid>'}`);
