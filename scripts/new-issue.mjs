// Scaffold a new issue in the lab: folder, patch from the issue fork branch (with provenance), REPRODUCE.md,
// status and evidence templates, a recipe stub, and pinned + latest variants in tools/compare/variants.json.
//   node scripts/new-issue.mjs <nid> --branch <fork-branch> [--title "<title>"] [--depth 300] [--dry-run]
// The core commit the patch was based on is pinned, so the reproduction can be repeated later exactly.
// Needs envs/core.git (created by tools/compare/setup.mjs). Network access to git.drupalcode.org.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot } from '../tools/compare/lib.mjs';

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const nid = args.find((a) => /^\d{5,8}$/.test(a));
const branch = flag('branch'); const title = flag('title', `Issue ${nid}`); const depth = flag('depth', '300');
const dry = args.includes('--dry-run');
if (!nid || !branch) { console.error('usage: node scripts/new-issue.mjs <nid> --branch <fork-branch> [--title "<title>"] [--depth 300] [--dry-run]'); process.exit(2); }
const bare = path.join(labRoot, 'envs/core.git');
if (!fs.existsSync(bare)) { console.error('envs/core.git does not exist yet. Run: node tools/compare/setup.mjs <any-slug> (it creates the shared core clone), or: git init --bare envs/core.git && git -C envs/core.git remote add origin https://git.drupalcode.org/project/drupal.git'); process.exit(1); }
const git = (a, o = {}) => spawnSync('git', ['-C', bare, ...a], { encoding: 'utf8', ...o });
const must = (r, what) => { if (r.status !== 0) { console.error(`${what} failed:\n${r.stderr || r.stdout}`); process.exit(1); } return r.stdout.trim(); };
const dir = path.join(labRoot, 'reports/issues', nid);
const date = new Date().toISOString().slice(0, 10);
const forkUrl = `https://git.drupalcode.org/issue/drupal-${nid}.git`;
const branchRef = `refs/lab/issue-${nid}/${branch}`;

console.log(`Fetching core main and ${forkUrl} ${branch} (depth ${depth}) ...`);
if (dry) { console.log('(dry run: nothing is fetched or written)'); process.exit(0); }
must(git(['fetch', '--depth', depth, 'origin', '+refs/heads/main:refs/lab/new-issue/main']), 'fetch core main');
if (git(['remote', 'get-url', `f${nid}`]).status !== 0) must(git(['remote', 'add', `f${nid}`, forkUrl]), 'add fork remote');
must(git(['fetch', '--depth', depth, `f${nid}`, `+refs/heads/${branch}:${branchRef}`]), 'fetch issue branch');
const mb = git(['merge-base', 'refs/lab/new-issue/main', branchRef]);
if (mb.status !== 0) { console.error(`No common ancestor within depth ${depth}. The branch is older than the fetched history: re-run with a larger --depth (for example 1500).`); process.exit(1); }
const base = mb.stdout.trim();
const tip = must(git(['rev-parse', '--short', branchRef]), 'rev-parse');
const files = must(git(['diff', '--name-only', base, branchRef]), 'diff').split('\n').filter(Boolean);
const patch = must(git(['diff', '--no-color', base, branchRef], { maxBuffer: 256 * 1024 * 1024 }), 'diff');
const baseInfo = must(git(['log', '-1', '--format=%cs %s', base]), 'log');

fs.mkdirSync(path.join(dir, 'branches'), { recursive: true });
fs.writeFileSync(path.join(dir, 'branches', `${branch}.patch`), patch + '\n');
fs.writeFileSync(path.join(dir, 'BRANCHES.md'), `# Branch patches for #${nid}\n\nExtracted ${date} from ${forkUrl} with \`git diff <merge-base> <branch tip>\`: only the branch's own changes.\nNot rebased onto current \`main\`. The MR on drupal.org is the source of truth.\n\n| Patch | Source | Tip | Base | Base date and subject | Files |\n|---|---|---|---|---|---|\n| \`branches/${branch}.patch\` | ${forkUrl} \`${branch}\` | ${tip} | ${base.slice(0, 12)} | ${baseInfo} | ${files.length} |\n`);
const sub = (t) => t.replaceAll('<NID>', nid).replaceAll('<TITLE>', title).replaceAll('<PINNED>', base.slice(0, 12)).replaceAll('<DATE>', date).replaceAll('<nid>', nid);
for (const [tpl, out] of [['REPRODUCE.md', 'REPRODUCE.md'], ['EVIDENCE.md', 'EVIDENCE.md'], ['ISSUE-COMMENT-DRAFT.md', 'ISSUE-COMMENT-DRAFT.md']]) {
  const dst = path.join(dir, out); if (fs.existsSync(dst)) { console.log(`kept existing ${out}`); continue; }
  fs.writeFileSync(dst, sub(fs.readFileSync(path.join(labRoot, 'reports/_templates', tpl), 'utf8')));
}
const status = path.join(dir, `STATUS-${date}.md`);
if (!fs.existsSync(status)) fs.writeFileSync(status, `# #${nid} status snapshot (${date})\n\nFill in from the issue page: title, status, tags, MR link, related issues, unresolved review threads, blockers.\nRe-check on drupal.org before relying on it.\n`);

// recipe stub
const recipe = `repro_${nid}`; const rdir = path.join(labRoot, 'recipes', recipe);
if (!fs.existsSync(rdir)) { fs.mkdirSync(rdir, { recursive: true }); fs.writeFileSync(path.join(rdir, 'recipe.yml'), `name: 'Repro: #${nid} ${title.replace(/'/g, '')}'\ndescription: 'Starting state for the steps to reproduce #${nid}. Edit: list the modules to install and any content types or config the steps need.'\ntype: 'Testing'\n# A dependency name containing '/' is resolved from the Drupal root, for example:\n# recipes:\n#   - core/tests/fixtures/recipes/article_content_type\ninstall: []\n`); }

// variants: pinned (to the commit the patch was based on) and latest
const vf = path.join(labRoot, 'tools/compare/variants.json'); const all = JSON.parse(fs.readFileSync(vf, 'utf8'));
const pinned = `${nid}-pinned`, latest = `${nid}-latest`;
if (!all.some((x) => x.slug === pinned)) {
  all.push({ slug: pinned, issue: nid, label: `#${nid}: ${title}, pinned core`, description: 'TODO: what to do and what to look for.', status: 'stub: fill in pages, steps, expected, checks, observe',
    core: { url: 'https://git.drupalcode.org/project/drupal.git', commit: base },
    before: { env: `baseline-${nid}` }, after: { env: `issue-${nid}`, patches: [`reports/issues/${nid}/branches/${branch}.patch`] },
    pages: ['/'], login: true, recipe, steps: [], expected: 'TODO', actual: 'TODO', checks: [], observe: [] });
  all.push({ slug: latest, extends: pinned, label: `#${nid}: same steps against the LATEST core main`, core: { ref: 'main', commit: null }, before: { env: `baseline-${nid}-latest` }, after: { env: `issue-${nid}-latest` } });
  fs.writeFileSync(vf, JSON.stringify(all, null, 2) + '\n');
}
console.log(`\nCreated reports/issues/${nid}/ (patch: ${files.length} files, base ${base.slice(0, 12)} ${baseInfo}), recipes/${recipe}/, variants ${pinned} and ${latest}.\n\nNext:\n  1. Edit tools/compare/variants.json (${pinned}): pages, steps, expected, checks, observe.\n  2. Edit recipes/${recipe}/recipe.yml so the starting state exists.\n  3. node tools/compare/setup.mjs ${pinned} --check-patches   then   node tools/compare/setup.mjs ${pinned}\n  4. node tools/compare/serve.mjs ${pinned}   and follow reports/issues/${nid}/REPRODUCE.md`);
