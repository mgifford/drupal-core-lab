// A patch file that was changed says so (see tools/compare/patch-change.mjs).
//   node scripts/patch-change.mjs check [--base <ref>]     patch files changed since the base (default origin/main, else main) that have no record: exit 1
//   node scripts/patch-change.mjs record <patch> --by <who> --reason "<why>" [--base <ref>]
//        keeps the version the base had in reports/issues/<nid>/original-patches/ and adds a row to reports/issues/<nid>/PATCH-CHANGES.md
//   node scripts/patch-change.mjs list [<nid>]             print the records
// An auto-fix that has to change a patch file records it with --by auto-fix, in the same commit. See "Auto-fix" in AGENTS.md.
import fs from 'node:fs';
import path from 'node:path';
import { labRoot } from '../tools/compare/lib.mjs';
import { resolveBase, changedPatches, unrecorded, recordChange, readRecord } from '../tools/compare/patch-change.mjs';

const args = process.argv.slice(2), cmd = args[0], val = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null; };
const usage = () => { console.error('usage: node scripts/patch-change.mjs check [--base <ref>] | record <patch> --by <who> --reason "<why>" [--base <ref>] | list [<nid>]'); process.exit(2); };
if (!['check', 'record', 'list'].includes(cmd)) usage();
if (cmd === 'list') {
  const ids = args[1] && /^\d+$/.test(args[1]) ? [args[1]] : fs.readdirSync(path.join(labRoot, 'reports/issues')).filter((d) => fs.existsSync(path.join(labRoot, 'reports/issues', d, 'PATCH-CHANGES.md')));
  for (const nid of ids) for (const e of readRecord(labRoot, nid)) console.log(`#${nid} ${e.date} ${e.patch} ${e.was} -> ${e.now} (${e.lines}) by ${e.by}: ${e.why}`);
  if (!ids.length) console.log('No patch has been changed since it was recorded.');
  process.exit(0);
}
const base = resolveBase(labRoot, val('base'));
if (!base) { console.log(`patch changes: skipped (no base to compare with${val('base') ? `: ${val('base')} does not resolve` : '; fetch origin/main'}). That is not a pass.`); process.exit(0); }
if (cmd === 'check') {
  const all = changedPatches(labRoot, base), miss = unrecorded(labRoot, base);
  if (!all.length) { console.log(`patch changes: no patch file differs from ${base}.`); process.exit(0); }
  console.log(`patch changes since ${base}: ${all.length} changed, ${all.length - miss.length} recorded${miss.length ? `, ${miss.length} NOT recorded:` : '.'}`);
  for (const m of miss) console.log(`  ${m.status} ${m.path}\n    record it: node scripts/patch-change.mjs record ${m.path} --by "<who>" --reason "<why>"`);
  process.exit(miss.length ? 1 : 0);
}
const patch = args[1]; if (!patch || patch.startsWith('--')) usage();
const r = recordChange(labRoot, path.relative(labRoot, path.resolve(patch)), { base, by: val('by'), reason: val('reason') });
if (r.status === 'error') { console.error(r.error); process.exit(1); }
console.log(r.status === 'recorded' ? `Recorded in ${r.row}: ${r.was} -> ${r.now} (${r.lines}). The version it replaced is kept at ${r.kept}.` : `${r.status} (${r.was} -> ${r.now}); nothing written.`);
