// Check, and where the policy allows rebuild, the compiled .css of every .pcss.css source a variant's patch stack or working tree changes, with core's own
// toolchain (`yarn run build:css`). Core's CI fails a merge request whose .css does not match its .pcss.css ("Recompile the CSS with: yarn run build:css").
//   node scripts/css-build.mjs <slug>                    same as --check
//   node scripts/css-build.mjs <slug> --check            read-only: PASS, FAIL (missing or stale), BLOCKED (toolchain missing) or SKIPPED (no PostCSS source changed)
//   node scripts/css-build.mjs <slug> --build            rebuild the stale or missing compiled files of the author's own edits (After checkout only), then check again
//   node scripts/css-build.mjs <slug> --build --corrective   also rebuild files that come from an IMPORTED patch. The imported patch stays as it is: the result is
//                                                        a working-tree change, written up as a follow-up patch and an interdiff under reports/issues/<nid>/css-build/
//   options: --side=after|before (default after; --build is refused for before), --dry-run (say what would be built, write nothing), --json (machine-readable result on
//            stdout), --host | --ddev (where to run; default: host when core/node_modules exists, else the DDEV project), --no-install (never run yarn install),
//            --stylelint (also run core's Stylelint on the affected files, as a separate step), --no-save (write no report)
// Exit code: 0 PASS or SKIPPED, 1 FAIL, 3 BLOCKED, 2 usage. A passing build says nothing about accessibility.
import fs from 'node:fs';
import path from 'node:path';
import { labRoot, variants, envDir } from '../tools/compare/lib.mjs';
import { analyze, emitFollowup } from '../tools/compare/css-build.mjs';
import { makeInEnv, resolveYarn, withEnv } from '../tools/compare/core-toolchain.mjs';

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith('--'));
const flag = (n) => args.includes(`--${n}`);
const side = (args.find((a) => a.startsWith('--side=')) || '--side=after').split('=')[1];
if (!slug || !['before', 'after'].includes(side) || (flag('build') && flag('check'))) { console.error('usage: node scripts/css-build.mjs <slug> [--check | --build [--corrective]] [--side=after|before] [--dry-run] [--json] [--host|--ddev] [--no-install] [--stylelint] [--no-save]'); process.exit(2); }
const mode = flag('ddev') ? 'ddev' : flag('host') ? 'host' : 'auto';
const res = analyze({ slug, side, build: flag('build'), corrective: flag('corrective'), dryRun: flag('dry-run'), mode, install: !flag('no-install') });

// Stylelint: a separate step on the affected files, with core's own configuration.
res.stylelint = { result: 'NOT VERIFIED', detail: 'Not run here. node scripts/lint.mjs runs core\'s Stylelint on the patched files.' };
if (flag('stylelint') && ['PASS', 'FAIL'].includes(res.overall)) {
  const v = variants().find((x) => x.slug === slug), dir = envDir(v[side].env), useDdev = res.runtime === 'DDEV web container';
  const inEnv = makeInEnv({ dir, useDdev }), yarn = resolveYarn({ dir, inEnv, useDdev, binDir: '.lab-css/bin' });
  const files = res.entries.filter((e) => e.sourceState !== 'deleted').flatMap((e) => [e.source, e.compiled]).filter((f) => fs.existsSync(path.join(dir, f)));
  if (yarn.error || !files.length) res.stylelint = { result: 'BLOCKED', detail: yarn.error || 'no file to check' };
  else {
    const cmd = `cd core && yarn stylelint ${files.map((f) => `'${f.replace(/^core\//, '')}'`).join(' ')}`; res.commands.push(cmd);
    const r = inEnv(withEnv(yarn.pathPrefix, cmd)); fs.rmSync(path.join(dir, '.lab-css'), { recursive: true, force: true });
    res.stylelint = r.status === 0 ? { result: 'PASS', detail: `${files.length} file(s)` } : { result: 'FAIL', detail: `${r.stdout || ''}${r.stderr || ''}`.trim().split('\n').slice(-12).join('\n') };
  }
}

// A corrective or authoring build leaves a working-tree change. Write it up as a follow-up patch (the interdiff against the declared patches) and the full proposal.
if (flag('build') && !flag('dry-run') && res.built.length) {
  const v = variants().find((x) => x.slug === slug), dir = envDir(v[side].env), nid = String(v.issue || slug.split('-')[0]);
  const f = emitFollowup({ variant: v, side, dir, res, outDir: path.join(labRoot, 'reports/issues', nid, 'css-build') });
  if (f && !f.error) {
    res.followup = { ...f, interdiff: path.relative(labRoot, f.interdiff), full: path.relative(labRoot, f.full) };
    res.notes.push(`Follow-up written. The declared patch(es) were not modified. Interdiff: ${res.followup.interdiff}; full proposal: ${res.followup.full}. To keep it as a patch of this variant: node scripts/capture-patch.mjs ${slug} --name css-build`);
  } else if (f) res.notes.push(`The follow-up patch could not be written: ${f.error}`);
}

const n = res.entries.length, present = res.entries.filter((e) => !['missing', 'orphan'].includes(e.state) && e.sourceState !== 'deleted').length;
const need = res.entries.filter((e) => ['missing', 'stale'].includes(e.state)).length;
const rows = [
  ['PostCSS source detected', res.relevant ? 'YES' : 'NO'],
  ['Affected source files', String(res.entries.filter((e) => e.sourceState !== 'absent').length)],
  ['Compiled output present', res.relevant ? (res.entries.filter((e) => e.sourceState === 'present').every((e) => e.state !== 'missing') ? 'YES' : `NO (${res.entries.filter((e) => e.state === 'missing').length} missing)`) : 'n/a'],
  ['Rebuild required', res.relevant ? (need || res.built.length ? `YES (${need || res.built.length})` : 'NO') : 'n/a'],
  ['Compilation completed', !res.relevant ? 'SKIPPED' : res.built.length ? 'PASS' : flag('build') ? (res.entries.some((e) => e.refused) ? 'FAIL (refused by policy, see below)' : 'SKIPPED (nothing needed building)') : 'SKIPPED (check only; use --build)'],
  ['Source/output consistency', !res.relevant ? 'SKIPPED' : res.overall === 'BLOCKED' ? 'BLOCKED' : res.entries.some((e) => ['FAIL'].includes(e.result)) ? 'FAIL' : 'PASS'],
  ['Stylelint', res.stylelint.result],
  ['Patch includes generated CSS', !res.relevant ? 'SKIPPED' : res.entries.every((e) => e.result === 'SKIPPED' || e.inPatch) ? 'PASS' : 'FAIL'],
  ['Ready for submission', res.ready && res.stylelint.result !== 'FAIL' ? 'YES' : 'NO'],
];
const day = res.generated.slice(0, 10);
const md = `# CSS build: ${slug}, ${side} side (${day})

DRAFT until a person has reviewed it. Generated by \`node scripts/css-build.mjs ${args.join(' ')}\`.

**Result: ${res.overall}**. This is about whether core's compiled CSS matches its PostCSS source. **It is not accessibility evidence**, and it is separate from CSS linting and from browser tests.

| Check | Result |
|---|---|
${rows.map(([a, b]) => `| ${a} | ${b} |`).join('\n')}

| | |
|---|---|
| Environment | \`${res.env}\` (${res.runtime || 'not reached'}) |
| Core commit | \`${res.coreCommit || 'unknown'}\` |
| Patches (in order) | ${(res.patches || []).map((p) => `\`${p.path}\` (sha256 ${p.sha256.slice(0, 12)}, ${p.authored ? 'authored in the lab' : 'imported'})`).join('<br>') || 'none'} |
| Tools | ${res.tools ? `Node ${res.tools.node}, Yarn ${res.tools.yarn}${res.tools.yarnWanted ? ` (core pins ${res.tools.yarnWanted}${res.tools.corepack ? ', via Corepack' : ''})` : ''}` : 'not reached'} |
| Cache | ${res.cache || 'n/a'} |

## Files
${res.entries.length ? res.entries.map((e) => `- ${e.result === 'PASS' ? 'PASS' : e.result} \`${e.source}\` -> \`${e.compiled}\` (${e.origin}; ${e.state}${e.built ? e.changed ? ', rebuilt' : ', rebuilt (no change)' : ''}): ${e.detail}${e.refused ? ` Refused: ${e.refused}` : ''}`).join('\n') : 'None.'}

${res.notes.length ? `## Notes\n${res.notes.map((x) => `- ${x}`).join('\n')}\n\n` : ''}${res.followup ? `## Follow-up written (not applied to any patch)\n- Interdiff against the declared patches: \`${res.followup.interdiff}\`\n- Full proposal from core \`${res.followup.base}\`: \`${res.followup.full}\`\n- Files: ${res.followup.files.join(', ')}\n- The declared (imported) patches were not changed.\n\n` : ''}## Commands run
${res.commands.length ? res.commands.map((c) => `- \`${c}\``).join('\n') : 'None.'}

${res.overall === 'FAIL' ? `## What to do\n${res.entries.filter((e) => e.result === 'FAIL').map((e) => `- ${e.detail} Rebuild it in the After environment before capturing or submitting the patch: \`node scripts/css-build.mjs ${slug} --build${e.origin === 'imported' ? ' --corrective' : ''}\`${e.origin === 'imported' ? ' (the imported patch is not changed; this makes a follow-up)' : ''}.`).join('\n')}\n` : ''}`;
if (!flag('no-save') && res.relevant && !flag('dry-run')) {
  const v = variants().find((x) => x.slug === slug), nid = String(v.issue || slug.split('-')[0]), outDir = path.join(labRoot, 'reports/issues', nid, 'css-build');
  fs.mkdirSync(outDir, { recursive: true });
  const base = path.join(outDir, `${day}-${slug}-${side}`);
  fs.writeFileSync(`${base}.md`, md); fs.writeFileSync(`${base}.json`, `${JSON.stringify({ ...res, table: Object.fromEntries(rows) }, null, 2)}\n`);
  res.report = path.relative(labRoot, `${base}.md`);
}
if (flag('json')) console.log(JSON.stringify({ ...res, table: Object.fromEntries(rows) }, null, 2));
else {
  console.log(`${slug} ${side} (${res.env}): CSS build ${res.overall}`);
  for (const [a, b] of rows) console.log(`  ${a.padEnd(30)} ${b}`);
  for (const e of res.entries) console.log(`  - ${e.result.padEnd(7)} ${e.source}: ${e.detail}${e.refused ? ` Refused: ${e.refused}` : ''}`);
  for (const t of res.notes) console.log(`  note: ${t}`);
  if (res.report) console.log(`Report: ${res.report}`);
}
process.exit(res.overall === 'PASS' || res.overall === 'SKIPPED' ? (res.stylelint.result === 'FAIL' ? 1 : 0) : res.overall === 'FAIL' ? 1 : 3);
