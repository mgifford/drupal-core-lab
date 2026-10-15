// Check and import an issue pack (docs/ISSUE-PACK.md): one YAML file that describes how to reproduce a Drupal core issue.
//   node scripts/issue-pack.mjs prepare <issue URL or number> [--mr N] [--out FILE] [--no-copy] [--ai-recipe] [--compact]
//                                                               fetch the issue text and merge request diff, fill in the prompt, write it to a file, copy it, print the path
//                                                               --ai-recipe lets the assistant draft recipe.yml and config/*.yml (prompts/issue-pack-recipe-rule.md) instead of catalogue blocks only
//   node scripts/issue-pack.mjs prompt [--ai-recipe]            print the blank chat prompt (prompts/issue-pack-chat-prompt.md with the current example filled in)
//   node scripts/issue-pack.mjs validate <pack.yml> [--recipe <dir>] [--repair [--attach-recipe <dir>] [--no-copy]]
//                                                               --recipe <dir> checks the pack with a recipe folder you trust in place of the assistant's own recipe
//                                                               check only: no network, nothing is written. --repair also prints (and copies) a message to paste back
//                                                               into the chat that fixes what the validator found; --attach-recipe adds a recipe folder you trust to that message
//                                                               --targeted (with --repair) asks for a small edit (JSON Patch, see tools/compare/pack-edit.mjs) instead of the whole file again
//   node scripts/issue-pack.mjs edit <pack.yml> <edit.json> [--require-valid] [--dry-run] [--no-backup]
//                                                               apply a pack edit: refused when it was made for another version of the pack (the hash), when any operation does not
//                                                               hold, when it would add a validator error, or (--require-valid) when errors would remain. The pack is only replaced, atomically,
//                                                               when all of that passes; the old file is kept as <pack.yml>.before-<hash>
//   node scripts/issue-pack.mjs sync-issue <pack.yml> [--write]   the issue block (title, url, fork branch, merge request) from the fetched issue (scripts/issue-intake.mjs fetch), not from a model
//   node scripts/issue-pack.mjs import <pack.yml> [--recipe <dir>] [--dry-run] [--depth 300]
// import validates, then runs scripts/new-issue.mjs (fetches the issue fork branch and writes the patch and the issue folder),
// writes the recipe to recipes/repro_<nid>/ with a copy in reports/issues/<nid>/recipe/, merges the pack's steps and checks into
// reports/issues/<nid>/variants.json (never tools/compare/variants.json) and keeps the pack and a SUMMARY.md next to them.
// The result is a DRAFT: a person must run it, read the checks and confirm the steps before anyone relies on it.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot } from '../tools/compare/lib.mjs';
import { validatePack, loadYaml, repairMessage, readRecipeDir, graftRecipe, markReproduceUnverified } from '../tools/compare/pack-validate.mjs';
import { loadCatalogue, catalogueText, describeSetup } from '../tools/compare/pack-blocks.mjs';
import { loadChecks, checkCatalogueText } from '../tools/compare/pack-checks.mjs';

const args = process.argv.slice(2);
const copyToClipboard = (text) => { for (const c of [['pbcopy'], ['wl-copy'], ['xclip', '-selection', 'clipboard'], ['xsel', '--clipboard', '--input']]) { if (spawnSync(c[0], c.slice(1), { input: text }).status === 0) return c[0]; } return null; };
const [cmd, file] = args.filter((a) => !a.startsWith('--'));
// --ai-recipe swaps rule 6 (catalogue blocks only) for the recipe-drafting rule (prompts/issue-pack-recipe-rule.md) and shows the
// recipe.files shape. Nothing else in the prompt changes.
const RECIPE_FORMAT = [
  'RECIPE FORMAT (recipe-drafting mode only; the worked example below uses setup blocks instead)',
  'recipe:',
  '  name: "repro_<nid>"                     the issue number, exactly this form',
  '  files:',
  '    recipe.yml: |',
  '      name: "<short title of the starting state>"',
  '      description: "<what the state is and that it is safe to apply more than once>"',
  '      type: "Testing"',
  '      recipes:                            optional: other recipes to apply first, for example core/tests/fixtures/recipes/article_content_type',
  '        - <a recipe name in this repo, or a core/recipes/... path>',
  '      install:                            optional: module machine names to install',
  '        - <module>',
  '      config:                             optional: change configuration that a module or recipe already provides',
  '        actions:',
  '          <config object name>:',
  '            <method>: ...',
  '    config/<config object name>.yml: |   optional: a whole config object, for example config/system.site.yml',
  '      <the config object>',
].join('\n');
const promptTemplate = () => {
  let tpl = fs.readFileSync(path.join(labRoot, 'prompts/issue-pack-chat-prompt.md'), 'utf8');
  const ai = args.includes('--ai-recipe');
  if (ai) {
    const rule = fs.readFileSync(path.join(labRoot, 'prompts/issue-pack-recipe-rule.md'), 'utf8').trimEnd();
    const out = tpl.replace(/^6\. Setup: do NOT write recipe files.*$/m, () => rule);
    if (out === tpl) { console.error('--ai-recipe: could not find rule 6 in prompts/issue-pack-chat-prompt.md'); process.exit(2); }
    tpl = out;
  }
  return tpl.replace('{{RECIPE_FORMAT}}\n', () => (ai ? `${RECIPE_FORMAT}\n` : ''));
};
if (cmd === 'prepare') {
  const { parseIssue, gather, composePrompt } = await import('../tools/compare/pack-prepare.mjs');
  const os = await import('node:os');
  let nid; try { nid = parseIssue(file); } catch (e) { console.error(e.message); process.exit(2); }
  const valueOf = (flag) => { const i = args.indexOf(flag); if (i < 0) return undefined; const v = args[i + 1]; if (v === undefined || v.startsWith('--')) { console.error(`${flag} needs a value`); process.exit(2); } return v; };
  const mr = valueOf('--mr');
  if (mr !== undefined && !/^\d{1,7}$/.test(mr)) { console.error('--mr must be the merge request number, for example 16777'); process.exit(2); }
  let g; try { g = await gather(nid, { mr, log: (m) => console.log(m) }); } catch (e) { console.error(`Could not fetch: ${e.message}`); process.exit(1); }
  if (g.missing.issue) { console.error(g.missing.issue); process.exit(1); }
  if (args.includes('--compact')) {
    // The issue text becomes the compact brief (tools/compare/issue-intake.mjs): identity, limits, the comments that carry decisions, proposals, questions
    // and revisions verbatim, the latest ones, and what was left out. It is deterministic, and shorter only when the thread is long.
    const { buildSnapshot, indexComments, renderBrief } = await import('../tools/compare/issue-intake.mjs');
    const snap = buildSnapshot(g), brief = renderBrief(snap, indexComments(snap.comments));
    // A short thread does not get shorter (the brief adds an identity table and the limits), so the compact form is used only when it is smaller.
    if (Buffer.byteLength(brief) < Buffer.byteLength(g.issueText)) { console.log(`--compact: the issue text is the compact brief (${Buffer.byteLength(brief)} bytes instead of ${Buffer.byteLength(g.issueText)}); ${snap.comments.length} comments, the rest are listed as not shown. Complete text: node scripts/issue-intake.mjs fetch ${nid}`); g.issueText = brief; }
    else console.log(`--compact: the compact brief (${Buffer.byteLength(brief)} bytes) is not smaller than the full issue text (${Buffer.byteLength(g.issueText)} bytes, ${snap.comments.length} comments), so the full text is used.`);
  }
  const tpl = promptTemplate();
  const ex = fs.readFileSync(path.join(labRoot, 'docs/examples/issue-pack-3415961.yml'), 'utf8').trimEnd();
  const yamlP = loadYaml(); if (!yamlP) { console.error('js-yaml is not installed. Run: npm install --prefix tools/compare/.deps js-yaml@4'); process.exit(2); }
  const { text, missing } = composePrompt(tpl, ex, g, { catalogue: catalogueText(loadCatalogue(yamlP)), checks: checkCatalogueText(loadChecks(yamlP)) });
  const desktop = path.join(os.homedir(), 'Desktop');
  const outArg = valueOf('--out') ?? null;
  const out = path.resolve(outArg || path.join(fs.existsSync(desktop) ? desktop : process.cwd(), `issue-pack-prompt-${nid}.txt`));
  fs.writeFileSync(out, text);
  const copied = args.includes('--no-copy') ? null : copyToClipboard(text);
  console.log(`\nIssue #${nid}: ${g.issueText.split('\n')[0].replace(/^ISSUE #\d+: /, '')}`);
  console.log(g.mr ? `Merge request !${g.mr.iid} (${g.mr.state}), branch ${g.mr.branch}${g.diff ? `, diff ${Math.round(g.diff.length / 1024) || 1} KB` : ', diff NOT fetched'}` : `Merge request: NOT FOUND (${g.missing.mr})`);
  for (const n of g.notes) console.log(`Note: ${n}`);
  console.log(`\nWrote ${out} (${Math.round(text.length / 1024)} KB)${copied ? `\nCopied to the clipboard (${copied}).` : '\nNot copied to the clipboard: open the file and copy it.'}`);
  console.log(missing ? `\n${missing} of 3 inputs are still marked @@MISSING@@ in the file: paste them in before sending.` : '\nAll three inputs are filled in. Check them, then paste the whole prompt into a new chat with your assistant.');
  process.exit(0);
}
if (cmd === 'prompt') {
  const tpl = promptTemplate();
  const ex = fs.readFileSync(path.join(labRoot, 'docs/examples/issue-pack-3415961.yml'), 'utf8').trimEnd();
  const yamlP = loadYaml(); if (!yamlP) { console.error('js-yaml is not installed. Run: npm install --prefix tools/compare/.deps js-yaml@4'); process.exit(2); }
  process.stdout.write(tpl.replace('{{CATALOGUE}}', () => catalogueText(loadCatalogue(yamlP))).replace('{{CHECKS}}', () => checkCatalogueText(loadChecks(yamlP))).replace('{{EXAMPLE}}', () => ex));
  process.exit(0);
}
if (cmd === 'edit' || cmd === 'sync-issue') {
  const yamlE = loadYaml(); if (!yamlE) { console.error('js-yaml is not installed. Run: npm install --prefix tools/compare/.deps js-yaml@4'); process.exit(2); }
  const { applyEdit, issueSyncEdit } = await import('../tools/compare/pack-edit.mjs');
  const die = (m, c = 1) => { console.error(m); process.exit(c); };
  if (!file || !fs.existsSync(file)) die(`usage: node scripts/issue-pack.mjs ${cmd === 'edit' ? 'edit <pack.yml> <edit.json> [--require-valid] [--dry-run] [--no-backup]' : 'sync-issue <pack.yml> [--write]'}`, 2);
  const cur = fs.readFileSync(file, 'utf8'); let input;
  if (cmd === 'edit') { const ef = args.filter((a) => !a.startsWith('--'))[2]; if (!ef || !fs.existsSync(ef)) die('usage: node scripts/issue-pack.mjs edit <pack.yml> <edit.json>', 2); input = fs.readFileSync(ef, 'utf8'); }
  else {
    let nid0; try { nid0 = String(yamlE.load(cur, { schema: yamlE.CORE_SCHEMA }).issue.nid); } catch { die('The pack has no readable issue block, so there is nothing to sync.'); }
    const sf = path.join(labRoot, '.lab-cache/sources', nid0, 'snapshot.json'); if (!fs.existsSync(sf)) die(`No snapshot for #${nid0}. Run: node scripts/issue-intake.mjs fetch ${nid0}`);
    const r = issueSyncEdit(cur, JSON.parse(fs.readFileSync(sf, 'utf8')), { yaml: yamlE }); if (r.problems.length) die(r.problems.join('\n'));
    if (!r.edit) { console.log('The issue block already agrees with the fetched issue.'); process.exit(0); }
    if (!args.includes('--write')) { console.log(`The issue block differs from the fetched issue. This edit would fix it (apply with --write):\n${JSON.stringify(r.edit)}`); process.exit(0); }
    input = r.edit;
  }
  const res = applyEdit(cur, input, { yaml: yamlE, requireValid: args.includes('--require-valid') });
  if (!res.ok) die(`Not applied; ${file} is as it was.\n${res.problems.join('\n')}`);
  console.log(`Edit holds: ${res.touched.length} change(s) at ${res.touched.join(', ')}; pack ${res.hashBefore} -> ${res.hashAfter}.`);
  console.log(`Validator: ${res.before.errors.length} error(s) and ${res.before.warnings.length} warning(s) before; ${res.after.errors.length} and ${res.after.warnings.length} after.${res.fixed.length ? ` Fixed: ${res.fixed.map((x) => x.at).join(', ')}.` : ''}${res.newWarnings.length ? ` New warning(s): ${res.newWarnings.map((x) => x.at).join(', ')}.` : ''}`);
  for (const e of res.after.errors) console.log(`ERROR    ${e.at}: ${e.msg}`);
  if (args.includes('--dry-run')) { console.log('(dry run: nothing written)'); process.exit(0); }
  if (!args.includes('--no-backup')) fs.writeFileSync(`${file}.before-${res.hashBefore}`, cur);
  const tmp = `${file}.${process.pid}.tmp`; fs.writeFileSync(tmp, res.text); fs.renameSync(tmp, file);
  console.log(`Wrote ${file}${args.includes('--no-backup') ? '' : ` (the old file is kept as ${path.basename(file)}.before-${res.hashBefore})`}. YAML comments in the pack are not kept; every value is.`);
  process.exit(res.after.errors.length ? 1 : 0);
}
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
if (!['validate', 'import'].includes(cmd) || !file) { console.error('usage: node scripts/issue-pack.mjs prepare <issue URL or number> [--ai-recipe] | prompt [--ai-recipe] | validate <pack.yml> | import <pack.yml> [--dry-run] [--depth 300]'); process.exit(2); }
if (!fs.existsSync(file)) { console.error(`No such file: ${file}`); process.exit(2); }

const yaml = loadYaml();
if (!yaml) { console.error('js-yaml is not installed. Run: npm install --prefix tools/compare/.deps js-yaml@4'); process.exit(2); }
let text = fs.readFileSync(file, 'utf8');
const ri0 = args.indexOf('--recipe');
if (ri0 >= 0) {
  const d = args[ri0 + 1];
  if (!d || d.startsWith('--')) { console.error('--recipe needs a folder'); process.exit(2); }
  let files; try { files = readRecipeDir(path.resolve(d)); } catch (e) { console.error(`--recipe: ${e.message}`); process.exit(2); }
  text = graftRecipe(text, yaml, files, d);
  console.log(`Using the recipe from ${d} (${Object.keys(files).length} file(s)) instead of the one in the pack.`);
}
const { errors, warnings, pack, setupUsed } = validatePack(text, { yaml });
for (const w of warnings) console.log(`warning  ${w.at}: ${w.msg}`);
for (const e of errors) console.log(`ERROR    ${e.at}: ${e.msg}`);
if (pack) {
  const checks = pack.variant.checks || [], obs = pack.variant.observe || [], kinds = (k) => checks.filter((c) => c.kind === k).length;
  let rdoc = {}; try { rdoc = yaml.load(pack.recipe.files['recipe.yml'], { schema: yaml.CORE_SCHEMA }) || {}; } catch { /* reported above */ }
  const cfgFiles = Object.keys(pack.recipe.files).filter((f) => f.startsWith('config/')).length;
  console.log('\nWhat this pack can test:');
  console.log(`  automatic checks: ${checks.length} (precondition ${kinds('precondition')}, fix ${kinds('fix')}, regression ${kinds('regression')})`);
  console.log(`  manual questions that expect a different answer on Before and After: ${obs.filter((o) => o.expectBefore !== o.expectAfter).length} of ${obs.length}`);
  if (setupUsed) console.log(`  setup blocks: ${setupUsed.map((u) => u.name + (u.auto ? ' (added automatically)' : '')).join(', ')}`);
  console.log(`  recipe: applies ${(rdoc.recipes || []).length} other recipe(s), ${rdoc.config ? 'has a config section' : 'no config section'}, ${cfgFiles} config file(s)`);
}
if (cmd === 'validate' && args.includes('--repair')) {
  const ri = args.indexOf('--attach-recipe');
  let recipeFiles = null;
  if (ri >= 0) { const d = args[ri + 1]; if (!d || d.startsWith('--')) { console.error('--attach-recipe needs a folder'); process.exit(2); } try { recipeFiles = readRecipeDir(path.resolve(d)); } catch (e) { console.error(`--attach-recipe: ${e.message}`); process.exit(2); } }
  let msg;
  if (args.includes('--targeted')) {
    if (ri0 >= 0 || recipeFiles) { console.error('--targeted edits the pack file as it is; it cannot be combined with --recipe or --attach-recipe (replace the recipe files with an edit instead).'); process.exit(2); }
    const { targetedRepairMessage } = await import('../tools/compare/pack-edit.mjs');
    msg = pack ? targetedRepairMessage({ errors, warnings }, text, { yaml }) : repairMessage({ errors, warnings }, { recipeFiles });   // an unreadable pack cannot be edited field by field
    if (!pack) console.log('\n(The pack is not readable YAML, so it cannot be repaired field by field: the message asks for the whole file.)');
  } else msg = repairMessage({ errors, warnings }, { recipeFiles });
  if (!msg) console.log('\nNothing to repair: no errors and no warnings.');
  else {
    console.log('\n----- COPY EVERYTHING BETWEEN THESE LINES INTO THE SAME CHAT -----\n' + msg + '\n----- END -----');
    const c = args.includes('--no-copy') ? null : copyToClipboard(msg);
    console.log(c ? `\n(Copied to the clipboard with ${c}. Paste it into the chat that wrote the pack.)` : '\n(Not copied to the clipboard: select the text above.)');
  }
}
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
  ...(v.coverage ? { coverage: v.coverage } : {}),   // otherwise keep the matrix new-issue.mjs wrote
  status: 'draft: written from an issue pack; steps and checks have not been confirmed by a person',
});
fs.writeFileSync(vf, JSON.stringify(all, null, 2) + '\n');

// 4. the pack and a readable summary
const repro = path.join(issueDir, 'REPRODUCE.md');
if (fs.existsSync(repro)) fs.writeFileSync(repro, markReproduceUnverified(fs.readFileSync(repro, 'utf8')));
fs.writeFileSync(path.join(issueDir, 'PACK.yml'), text.endsWith('\n') ? text : `${text}\n`);
const md = [`# #${nid}: ${pack.issue.title}`, '', `**DRAFT.** Written from an issue pack (${pack.review.generated_by}). A person has not yet confirmed the steps or the checks.`, '',
  `Issue: ${pack.issue.url}${pack.issue.merge_request ? `  \nMerge request: ${pack.issue.merge_request}` : ''}  \nFork branch: \`${pack.issue.fork_branch}\``, '', '## Summary', '', pack.summary.trim(), '',
  '## Sources', '', ...pack.sources.map((s) => `- ${s.url}${s.date ? ` (${s.date})` : ''}: ${s.note}`), '',
  ...(setupUsed ? ['## Setup blocks', '', ...describeSetup(setupUsed), ''] : []),
  '## Not verified', '', ...pack.review.unverified.map((u) => `- ${u}`), ...(pack.needs || []).map((n) => `- Needs a building block that does not exist yet: ${n.block}: ${n.why}`),
  ...(pack.notes ? ['', '## Notes', '', pack.notes.trim()] : []), ''].join('\n');
fs.writeFileSync(path.join(issueDir, 'SUMMARY.md'), md);

console.log(`\nImported #${nid} as a DRAFT. Next:`);
console.log(`  node tools/compare/setup.mjs ${slug} --check-patches    do the patches apply to the pinned core?`);
console.log(`  node tools/compare/setup.mjs ${nid}-latest               build the day-to-day pair (current core), then run the viewer`);
console.log(`  Read reports/issues/${nid}/SUMMARY.md, then run every step and check yourself before trusting them.`);
console.log(`  If you commit it: node scripts/build-cloud.mjs and commit cloud/ as well (CI fails if it is stale).`);
