// Package one comparison as a self-contained zip that someone else can unpack and run.
//   node scripts/make-bundle.mjs [slug] [--revision=N]
// Writes bundles/drupal-repro-<issue>-<date>-v<N>.zip and never removes an
// earlier revision. When --revision is omitted, the next revision number for
// that issue and date is selected.
// The zip is a slice of this lab with the same layout (so the tools run unchanged): the viewer,
// the recipe, the patches, the steps and checks, the evidence, and a setup command. It does not
// contain Drupal core; setup clones it.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { labRoot, rawVariants } from '../tools/compare/lib.mjs';

const args = process.argv.slice(2);
const all = rawVariants();
const slug = args.find((x) => !x.startsWith('--')) || all[0].slug;
const v = all.find((x) => x.slug === slug);
if (!v) { console.error('unknown variant'); process.exit(1); }
const name = `drupal-repro-${v.issue}`;
const date = new Date().toISOString().slice(0, 10);
const bundles = path.join(labRoot, 'bundles');
fs.mkdirSync(bundles, { recursive: true });
const revisionArg = (args.find((x) => x.startsWith('--revision=')) || '').slice('--revision='.length);
if (revisionArg && !/^\d+$/.test(revisionArg)) { console.error('--revision must be a positive integer'); process.exit(2); }
const used = fs.readdirSync(bundles).flatMap((f) => {
  const m = f.match(new RegExp(`^${name}-${date}-v(\\d+)\\.zip$`));
  return m ? [Number(m[1])] : [];
});
const revision = revisionArg ? Number(revisionArg) : Math.max(0, ...used) + 1;
if (revision < 1) { console.error('--revision must be a positive integer'); process.exit(2); }
const archiveName = `${name}-${date}-v${revision}`;
const zip = path.join(bundles, `${archiveName}.zip`);
if (fs.existsSync(zip)) { console.error(`${path.relative(labRoot, zip)} already exists; choose another --revision`); process.exit(2); }
const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-'));
const root = path.join(stage, archiveName);

const copy = (rel, filter = () => true) => {
  const src = path.join(labRoot, rel), dst = path.join(root, rel);
  if (!fs.existsSync(src)) { console.error(`missing: ${rel}`); process.exit(1); }
  fs.cpSync(src, dst, { recursive: true, filter: (f) => !/\.DS_Store$|node_modules/.test(f) && filter(f) });
};
for (const f of ['serve.mjs', 'index.html', 'lib.mjs', 'diff.mjs', 'setup.mjs', 'lighthouse.mjs', 'emulation.mjs', 'README.md']) copy(`tools/compare/${f}`);
for (const f of ['coverage.mjs', 'lab-env.mjs', 'doctor.mjs', 'add-language.php', 'make-bundle.mjs']) copy(`scripts/${f}`);
for (const f of ['USER-GUIDE.md', 'FORCED-COLORS.md']) copy(`docs/${f}`);
copy('docs/images');
copy('scripts/lab-site.sh');
copy('tools/compare/site/.ddev/config.yaml');
copy('tools/compare/site/.ddev/nginx_full/compare.conf');
copy('tools/compare/site/README.md');
for (const f of fs.readdirSync(path.join(labRoot, 'tools/playwright')).filter((n) => /\.mjs$|^package(-lock)?\.json$|^README\.md$/.test(n) && n !== 'make-demo-gif.mjs')) copy(`tools/playwright/${f}`);
copy(`recipes/${v.recipe}`);
// Evidence images stay in the repository (they are large); the zip keeps the written reports, patches, proposals and JSON.
copy(`reports/issues/${v.issue}`, (f) => !/\/(playwright|compare|screenreader)\/.*\.(png|gif|jpe?g|webp)$/i.test(f));

fs.mkdirSync(path.join(root, 'tools/compare'), { recursive: true });
const rawAll = rawVariants();
const issueVariants = rawAll.filter((x) => String(x.issue || '') === String(v.issue) || rawAll.some((y) => y.slug === x.extends && String(y.issue) === String(v.issue)));
fs.writeFileSync(path.join(root, 'tools/compare/variants.json'), JSON.stringify(issueVariants, null, 2) + '\n');
const latestSlug = (issueVariants.find((x) => /-latest$/.test(x.slug)) || {}).slug;
const evaluator = fs.existsSync(path.join(labRoot, 'tools/playwright', `evaluate-${v.issue}.mjs`))
  ? `evaluate-${v.issue}.mjs`
  : 'walkthrough.mjs';
const labPatch = `reports/issues/${v.issue}/lab/patch-stack-baselines.patch`;
const labPatchInstructions = fs.existsSync(path.join(labRoot, labPatch)) ? `
Apply the focused lab infrastructure patch before regenerating indexes:

\`\`\`shell
git apply --check ${labPatch}
git apply ${labPatch}
\`\`\`
` : '';

const steps = (v.steps || []).map((s, i) => `${i + 1}. ${s.text}${s.lookFor ? `\n   *Look for:* ${s.lookFor}` : ''}`).join('\n');
const checks = (v.checks || []).map((c) => `| ${c.kind} | ${c.label} | ${c.expect === 'same' ? 'same on both sides' : c.expect} |`).join('\n');
const builtAt = new Date().toISOString();
let labCommit = null;
try { labCommit = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: labRoot, encoding: 'utf8' }).stdout.trim() || null; } catch { /* not a checkout */ }
fs.writeFileSync(path.join(root, 'BUNDLE-MANIFEST.json'), JSON.stringify({
  bundle: archiveName,
  issue: String(v.issue),
  slug: v.slug,
  revision,
  builtAt,
  labCommit,
}, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'README.md'), `# Reproduce and review: Drupal core issue #${v.issue}

${v.label}

${v.description}

Bundle revision v${revision}, built ${builtAt}. Issue: https://www.drupal.org/project/drupal/issues/${v.issue}

**Local development only.** Everything runs on your machine. The sites use \`admin\` / \`admin\`.
Nothing here is sent anywhere except downloads (Drupal core from git.drupalcode.org, Composer
packages, the DDEV add-on).

## What this lets you do
Run two copies of Drupal side by side: **Before** (pristine upstream \`main\`) and **After**
(the same code plus the patches in \`reports/issues/${v.issue}/\`), and see the difference in one browser
window, with the steps, the expected result, and pass/fail checks on the page.

## You need
- [Docker](https://www.docker.com/) and [DDEV](https://ddev.com/) (1.24 or newer), git, Node.js 20+.
- About 10 GB of disk and 8 GB of memory free. First setup takes 10 to 20 minutes.
- Network access: Drupal core (git.drupalcode.org), Composer, npm (axe-core, installed by setup), the DDEV add-on.

## Add this issue to an existing drupal-core-lab checkout

This is the recommended path when you already have the complete lab. From the
root of this extracted bundle, copy only the issue-specific files and the
bundle-generator correction into the matching paths:

\`\`\`shell
rsync -a recipes/${v.recipe}/ "$HOME/drupal-core-lab/recipes/${v.recipe}/"
rsync -a reports/issues/${v.issue}/ "$HOME/drupal-core-lab/reports/issues/${v.issue}/"
cp tools/playwright/evaluate-${v.issue}.mjs "$HOME/drupal-core-lab/tools/playwright/"
cp scripts/make-bundle.mjs "$HOME/drupal-core-lab/scripts/"
cd "$HOME/drupal-core-lab"

\`\`\`
${labPatchInstructions}
\`\`\`shell
node scripts/index-issues.mjs
node scripts/build-cloud.mjs
git status --short
\`\`\`

Keep \`reports/issues/${v.issue}/variants.json\` in the issue report. The lab
loads it automatically. Do not replace the existing checkout's global
\`tools/compare/variants.json\` with the bundle's reduced standalone copy.

Stop the currently running comparison before starting this one:

\`\`\`shell
node scripts/lab-env.mjs status
node scripts/lab-env.mjs stop all
node scripts/doctor.mjs ${v.slug}
node tools/compare/setup.mjs ${v.slug} --check-patches
node tools/compare/setup.mjs ${v.slug}
node scripts/lab-env.mjs start ${v.slug} --browser
\`\`\`

Do not append explanatory comments to commands pasted into interactive zsh.
Depending on its options, zsh can treat the text after \`#\` as command input.

If ports 8100, 8101, or 8102 are already in use, another viewer is still
running. Stop it from the lab that started it. To identify the process:

\`\`\`shell
lsof -nP -iTCP:8100 -sTCP:LISTEN
\`\`\`

## Run this bundle as a separate standalone lab

Use this only when you do not want to add the issue to an existing checkout.

\`\`\`shell
cd ${archiveName}
node tools/compare/setup.mjs ${v.slug} --check-patches
node tools/compare/setup.mjs ${v.slug}
node scripts/lab-env.mjs start ${v.slug} --browser
\`\`\`
In the page: press **Log in both as admin**, choose **Phone** frame width, and follow the steps.
**Mirror clicks and typing** repeats your actions in both frames; turn it off for the final step,
which must be done in each frame by hand (and by keyboard). Then press **Run checks**.
Switch **View** to **Difference** to see anything that looks different (black means identical).
The **Accessibility, live (axe-core)** panel compares both sides after every page load and interaction and
alerts when After has more (or fewer) violations than Before.

## Coming back later, or trying updated Drupal core
\`${v.slug}\` uses ${v.core && v.core.commit ? 'the pinned core commit `' + v.core.commit.slice(0, 12) + '`, so it reproduces exactly as verified' : 'core as configured in variants.json'}.${latestSlug ? `
To see whether it still works on current core:

\`\`\`bash
node tools/compare/setup.mjs ${v.slug} --check-patches
node tools/compare/setup.mjs ${latestSlug} --check-patches
node tools/compare/setup.mjs ${latestSlug}
node tools/playwright/${evaluator} ${latestSlug}
\`\`\`
` : ''}
\`reports/issues/${v.issue}/REPRODUCE.md\` explains what each outcome means (a patch that no longer applies, a problem that no longer
reproduces because upstream fixed it, a fix that no longer works) and how to re-pin.

## What is in this bundle
| Path | What |
|---|---|
| \`recipes/${v.recipe}/\` | Drupal recipe and post-setup scripts that create this issue's starting state on both sides. |
| \`reports/issues/${v.issue}/\` | The patches (\`*.patch\`, \`branches/\`), validation steps, status of related issues, and diff evidence. |
| \`tools/compare/variants.json\` | This comparison: environments, patches, steps, expected result, checks. |
| \`tools/compare/\` | The viewer (\`serve.mjs\`, \`index.html\`), the diff report (\`diff.mjs\`), and \`setup.mjs\`. |
| \`scripts/lab-site.sh\` | \`apply\` or \`reset\` a site to the recipe's state. |

## Steps to reproduce
${steps}

**Expected:** ${v.expected || ''}
**Actual (before the change):** ${v.actual || ''}

## Checks run by the page
| Type | Check | Expected |
|---|---|---|
${checks}

"Fix" checks should differ between Before and After. "Regression" checks should pass on both.

## Useful commands
- Clear Drupal caches on both sites: the button in the page, or \`ddev drupal cache\` in each \`envs/<name>/\`.
- Rebuild a site from scratch: \`scripts/lab-site.sh reset <env>\` (destroys that site's content).
- Diff what the two sites serve: \`node tools/compare/diff.mjs ${v.slug}\` (writes to \`reports/issues/${v.issue}/compare/\`).
- Stop and remove: in each \`envs/<name>/\` run \`ddev delete --omit-snapshot --yes\`.
- If setup stops with \`ddev-router failed to become ready\` (DDEV's shared router sometimes misses its 60 second health check, more often with many DDEV projects running): just run the same \`setup.mjs\` command again, it resumes where it stopped. Running \`ddev poweroff\` first (stops all DDEV projects) makes it much less likely.
- If a site will not start after moving the folder: \`ddev stop\`, \`ddev mutagen reset\`, \`ddev start\`.

## What this does not replace
It compares behaviour in a browser and the files served. It does not replace testing with a
keyboard and a screen reader, which is the point of an accessibility change. The evidence here
is a DRAFT until a person has done that and reviewed it.

## Licence and provenance
The patches are changes to Drupal core (GPL-2.0-or-later). Drupal core is cloned from
git.drupalcode.org, not included. The viewer and scripts were written with AI assistance
(Claude Code) for the Drupal accessibility testing workflow. See \`reports/issues/${v.issue}/\`
for sources and dates. Always check the issue on drupal.org: it is the source of truth.
`);

const r = spawnSync('zip', ['-qr', zip, archiveName], { cwd: stage, stdio: 'inherit' });
if (r.status !== 0) { console.error('zip failed (is the zip command installed?)'); process.exit(1); }
fs.rmSync(stage, { recursive: true, force: true });
console.log(`${path.relative(labRoot, zip)}  (${(fs.statSync(zip).size / 1024).toFixed(0)} KB)`);
