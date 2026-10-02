// Package one comparison as a self-contained zip that someone else can unpack and run.
//   node scripts/make-bundle.mjs [slug]      writes bundles/drupal-repro-<issue>-<date>.zip (replaces an older zip for the same issue)
// The zip is a slice of this lab with the same layout (so the tools run unchanged): the viewer,
// the recipe, the patches, the steps and checks, the evidence, and a setup command. It does not
// contain Drupal core; setup clones it.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { labRoot } from '../tools/compare/lib.mjs';

const all = JSON.parse(fs.readFileSync(path.join(labRoot, 'tools/compare/variants.json'), 'utf8'));
const v = all.find((x) => x.slug === (process.argv[2] || all[0].slug));
if (!v) { console.error('unknown variant'); process.exit(1); }
const name = `drupal-repro-${v.issue}`;
const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-'));
const root = path.join(stage, name);

const copy = (rel, filter = () => true) => {
  const src = path.join(labRoot, rel), dst = path.join(root, rel);
  if (!fs.existsSync(src)) { console.error(`missing: ${rel}`); process.exit(1); }
  fs.cpSync(src, dst, { recursive: true, filter: (f) => !/\.DS_Store$|node_modules/.test(f) && filter(f) });
};
for (const f of ['serve.mjs', 'index.html', 'lib.mjs', 'diff.mjs', 'setup.mjs', 'lighthouse.mjs', 'emulation.mjs', 'README.md']) copy(`tools/compare/${f}`);
for (const f of ['coverage.mjs', 'lab-env.mjs', 'doctor.mjs', 'add-language.php']) copy(`scripts/${f}`);
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
const rawAll = JSON.parse(fs.readFileSync(path.join(labRoot, 'tools/compare/variants.json'), 'utf8'));
const issueVariants = rawAll.filter((x) => String(x.issue || '') === String(v.issue) || rawAll.some((y) => y.slug === x.extends && String(y.issue) === String(v.issue)));
fs.writeFileSync(path.join(root, 'tools/compare/variants.json'), JSON.stringify(issueVariants, null, 2) + '\n');
const latestSlug = (issueVariants.find((x) => /-latest$/.test(x.slug)) || {}).slug;

const steps = (v.steps || []).map((s, i) => `${i + 1}. ${s.text}${s.lookFor ? `\n   *Look for:* ${s.lookFor}` : ''}`).join('\n');
const checks = (v.checks || []).map((c) => `| ${c.kind} | ${c.label} | ${c.expect === 'same' ? 'same on both sides' : c.expect} |`).join('\n');
const date = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(root, 'README.md'), `# Reproduce and review: Drupal core issue #${v.issue}

${v.label}

${v.description}

Bundle built ${date}. Issue: https://www.drupal.org/project/drupal/issues/${v.issue}

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

## Quick start
\`\`\`bash
cd ${name}
node tools/compare/setup.mjs ${v.slug}      # builds both sites (clones Drupal core, installs, applies the recipe and patches)
node tools/compare/serve.mjs ${v.slug}      # then open http://localhost:8100/
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
node tools/compare/setup.mjs ${v.slug} --check-patches    # do the patches still apply to the pinned core?
node tools/compare/setup.mjs ${latestSlug} --check-patches    # ...and to the current core main?
node tools/compare/setup.mjs ${latestSlug}                     # build Before and After on current main
node tools/playwright/walkthrough.mjs ${latestSlug}            # needs: cd tools/playwright && npm install && npx playwright install chromium
\`\`\`
` : ''}
\`reports/issues/${v.issue}/REPRODUCE.md\` explains what each outcome means (a patch that no longer applies, a problem that no longer
reproduces because upstream fixed it, a fix that no longer works) and how to re-pin.

## What is in this bundle
| Path | What |
|---|---|
| \`recipes/${v.recipe}/\` | Drupal recipe that creates the starting state (Article type, Path module, Inline Form Errors). |
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

fs.mkdirSync(path.join(labRoot, 'bundles'), { recursive: true });
for (const f of fs.readdirSync(path.join(labRoot, 'bundles'))) if (f.startsWith(`${name}-`) && f.endsWith('.zip')) fs.rmSync(path.join(labRoot, 'bundles', f));
const zip = path.join(labRoot, 'bundles', `${name}-${date}.zip`);
const r = spawnSync('zip', ['-qr', zip, name], { cwd: stage, stdio: 'inherit' });
if (r.status !== 0) { console.error('zip failed (is the zip command installed?)'); process.exit(1); }
fs.rmSync(stage, { recursive: true, force: true });
console.log(`${path.relative(labRoot, zip)}  (${(fs.statSync(zip).size / 1024).toFixed(0)} KB)`);
