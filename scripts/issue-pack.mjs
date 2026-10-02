// Check and import an issue pack (docs/ISSUE-PACK.md): one YAML file that describes how to reproduce a Drupal core issue.
//   node scripts/issue-pack.mjs prompt                          print the chat prompt (prompts/issue-pack-chat-prompt.md with the current example filled in)
//   node scripts/issue-pack.mjs validate <pack.yml>             check only: no network, nothing is written
//   node scripts/issue-pack.mjs import <pack.yml> [--dry-run] [--depth 300]
// import validates, then runs scripts/new-issue.mjs (fetches the issue fork branch and writes the patch and the issue folder),
// writes the recipe to recipes/repro_<nid>/ with a copy in reports/issues/<nid>/recipe/, merges the pack's steps and checks into
// reports/issues/<nid>/variants.json (never tools/compare/variants.json) and keeps the pack and a SUMMARY.md next to them.
// The result is a DRAFT: a person must run it, read the checks and confirm the steps before anyone relies on it.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot } from '../tools/compare/lib.mjs';
import { validatePack, loadYaml } from '../tools/compare/pack-validate.mjs';

const args = process.argv.slice(2);
const [cmd, file] = args.filter((a) => !a.startsWith('--'));
if (cmd === 'prompt') {
  const tpl = fs.readFileSync(path.join(labRoot, 'prompts/issue-pack-chat-prompt.md'), 'utf8');
  const ex = fs.readFileSync(path.join(labRoot, 'docs/examples/issue-pack-3415961.yml'), 'utf8').trimEnd();
  process.stdout.write(tpl.replace('{{EXAMPLE}}', () => ex));
  process.exit(0);
}
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
if (!['validate', 'import'].includes(cmd) || !file) { console.error('usage: node scripts/issue-pack.mjs prompt | validate <pack.yml> | import <pack.yml> [--dry-run] [--depth 300]'); process.exit(2); }
if (!fs.existsSync(file)) { console.error(`No such file: ${file}`); process.exit(2); }

const yaml = loadYaml();
if (!yaml) { console.error('js-yaml is not installed. Run: npm install --prefix tools/compare/.deps js-yaml@4'); process.exit(2); }
const text = fs.readFileSync(file, 'utf8');
const { errors, warnings, pack } = validatePack(text, { yaml });
for (const w of warnings) console.log(`warning  ${w.at}: ${w.msg}`);
for (const e of errors) console.log(`ERROR    ${e.at}: ${e.msg}`);
if (errors.length) { console.error(`\nNot valid: ${errors.length} error(s), ${warnings.length} warning(s). Nothing was written.`); process.exit(1); }
console.log(`\nValid issue pack for #${pack.issue.nid} (${warnings.length} warning(s)). This is a DRAFT: its steps and checks have not been confirmed by a person.`);
if (cmd === 'validate') process.exit(0);

const nid = String(pack.issue.nid), slug = `${nid}-pinned`;
const issueDir = path.join(labRoot, 'reports/issues', nid), recipeDir = path.join(labRoot, 'recipes', pack.recipe.name);
for (const p of [issueDir, recipeDir]) if (fs.existsSync(p)) { console.error(`\nRefusing to import: ${path.relative(labRoot, p)} already exists. Move or delete it first (nothing was changed).`); process.exit(1); }
const dry = args.includes('--dry-run');
console.log(`\nImport plan for #${nid} ("${pack.issue.title}"):`);
console.log(`  1. node scripts/new-issue.mjs ${nid} --branch ${pack.issue.fork_branch} --variants-file reports/issues/${nid}/variants.json  (needs network and envs/core.git)`);
console.log(`  2. write recipes/${pack.recipe.name}/ (${Object.keys(pack.recipe.files).length} file(s)) and a copy under reports/issues/${nid}/recipe/`);
console.log(`  3. merge the steps, checks and questions into reports/issues/${nid}/variants.json as ${slug} (marked draft)`);
console.log(`  4. save the pack as reports/issues/${nid}/PACK.yml and write SUMMARY.md`);
if (dry) { console.log('\n(dry run: nothing was fetched or written)'); process.exit(0); }

const r = spawnSync('node', [path.join(labRoot, 'scripts/new-issue.mjs'), nid, '--branch', pack.issue.fork_branch, '--title', pack.issue.title, '--depth', String(flag('depth', '300')), '--variants-file', `reports/issues/${nid}/variants.json`], { stdio: 'inherit' });
if (r.status !== 0) { console.error('\nnew-issue.mjs failed; the pack was not imported. Fix the cause (network, envs/core.git, the branch name) and run import again.'); process.exit(r.status || 1); }

// 2. the recipe: replace the stub new-issue.mjs wrote
fs.rmSync(recipeDir, { recursive: true, force: true });
for (const base of [recipeDir, path.join(issueDir, 'recipe')]) {
  for (const [f, body] of Object.entries(pack.recipe.files)) {
    const dest = path.join(base, f); fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, body.endsWith('\n') ? body : `${body}\n`);
  }
}

// 3. the variant: keep what new-issue.mjs pinned (core, environments, patches); take the pack's description of the test
const vf = path.join(issueDir, 'variants.json');
const all = JSON.parse(fs.readFileSync(vf, 'utf8'));
const pinned = all.find((x) => x.slug === slug);
if (!pinned) { console.error(`\nExpected a ${slug} variant in ${path.relative(labRoot, vf)} and found none; not merged.`); process.exit(1); }
const v = pack.variant;
Object.assign(pinned, {
  description: v.description, pages: v.pages, login: v.login ?? true, ...(v.demo ? { demo: v.demo } : {}), recipe: pack.recipe.name,
  steps: v.steps, expected: v.expected, actual: v.actual, checks: v.checks, observe: v.observe,
  status: 'draft: written from an issue pack; steps and checks have not been confirmed by a person',
});
fs.writeFileSync(vf, JSON.stringify(all, null, 2) + '\n');

// 4. the pack and a readable summary
fs.writeFileSync(path.join(issueDir, 'PACK.yml'), text.endsWith('\n') ? text : `${text}\n`);
const md = [`# #${nid}: ${pack.issue.title}`, '', `**DRAFT.** Written from an issue pack (${pack.review.generated_by}). A person has not yet confirmed the steps or the checks.`, '',
  `Issue: ${pack.issue.url}${pack.issue.merge_request ? `  \nMerge request: ${pack.issue.merge_request}` : ''}  \nFork branch: \`${pack.issue.fork_branch}\``, '', '## Summary', '', pack.summary.trim(), '',
  '## Sources', '', ...pack.sources.map((s) => `- ${s.url}${s.date ? ` (${s.date})` : ''}: ${s.note}`), '', '## Not verified', '', ...pack.review.unverified.map((u) => `- ${u}`),
  ...(pack.notes ? ['', '## Notes', '', pack.notes.trim()] : []), ''].join('\n');
fs.writeFileSync(path.join(issueDir, 'SUMMARY.md'), md);

console.log(`\nImported #${nid} as a DRAFT. Next:`);
console.log(`  node tools/compare/setup.mjs ${slug} --check-patches    do the patches apply to the pinned core?`);
console.log(`  node tools/compare/setup.mjs ${nid}-latest               build the day-to-day pair (current core), then run the viewer`);
console.log(`  Read reports/issues/${nid}/SUMMARY.md, then run every step and check yourself before trusting them.`);
console.log(`  If you commit it: node scripts/build-cloud.mjs and commit cloud/ as well (CI fails if it is stale).`);
