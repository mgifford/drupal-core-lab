// The one command to start a Before/After comparison, in a DDEV Coder workspace or on a computer with DDEV. Safe to run again.
//   node scripts/test-mr.mjs <issue number | variant slug> [--diff=<file|url>] [--mr=<number|url>] [--patch=<path>]
//                            [--no-update] [--no-start] [--dry-run] [--core-url=<url>]
// Works from any folder (it uses the lab checkout it is in). `--x=y` and `--x y` both work. In order:
//   1. update the checkout: fast-forward to its upstream branch. Local changes that block that are set aside with `git stash`
//      (kept, never deleted; `git stash list` shows them). Skipped with --no-update, or when the branch has commits of its own.
//   2. pick the variant: an issue number means <nid>-latest, else <nid>-pinned (scripts and docs name variants; people use numbers).
//   3. only with --diff or --mr: write that diff over the variant's After patch and record the change (scripts/patch-change.mjs).
//      A Coder workspace usually cannot reach git.drupalcode.org; when a download fails this says how to bring the diff in by hand.
//   4. check DDEV's project names: a name another copy of the lab holds (a second clone, often one cloned inside the first) would stop
//      the build part-way, so this stops first and names the copy to use. Then stop the sites of other comparisons (DDEV projects
//      under envs/ this variant does not use). The proxy projects stay.
//   5. build and start: in Coder, scripts/cloud-bootstrap.mjs with the GitHub core mirror and autostart (it builds what is missing,
//      reapplies a changed patch, starts the sites and the viewer, and runs the smoke check); elsewhere tools/compare/setup.mjs and
//      scripts/lab-env.mjs start.
//   6. print the viewer address.
// --dry-run prints the plan and changes nothing (no fetch, no writes, nothing stopped). --no-start ends after step 3.
// Do not run tools/compare/cloud/start-viewer.sh, `ddev stop --all` or `git clean` around this: step 5 starts the viewer for the
// right variant, the proxy projects must keep running, and an untracked file may be someone's work.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { labRoot, resolveVariant, envDir, ddevName, parseDdevList, ddevNameClashes } from '../tools/compare/lib.mjs';
import { PROXY_PROJECTS } from '../tools/compare/cloud/config.mjs';

const USAGE = 'Usage: node scripts/test-mr.mjs <issue number | variant slug> [--diff=<file|url>] [--mr=<number|url>] [--patch=<path>] [--no-update] [--no-start] [--dry-run] [--core-url=<url>]';
const VALUED = ['diff', 'mr', 'patch', 'core-url', 'issue'], SWITCHES = ['no-update', 'no-start', 'dry-run', 'help'];
const argv = process.argv.slice(2), flags = {}, positional = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith('--')) { positional.push(a); continue; }
  const [key, ...rest] = a.slice(2).split('=');
  if (VALUED.includes(key)) flags[key] = rest.length ? rest.join('=') : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : '');
  else if (SWITCHES.includes(key)) flags[key] = true;
  else { console.error(`Unknown option --${key}. There is no such option; do not invent flags.\n${USAGE}`); process.exit(2); }
}
if (flags.help) { console.log(USAGE); process.exit(0); }
const DRY = !!flags['dry-run'];
const self = fileURLToPath(import.meta.url);
const inCoder = ['CODER_WORKSPACE_NAME', 'CODER_WORKSPACE_OWNER_NAME', 'CODER_AGENT_URL'].every((k) => process.env[k]);
const sh = (cmd, args, opts = {}) => spawnSync(cmd, args, { cwd: labRoot, encoding: 'utf8', ...opts });
const git = (...args) => sh('git', args);
const firstLine = (r) => `${r.stderr || ''}${r.stdout || ''}`.trim().split('\n')[0] || `exit ${r.status}`;
let stepNo = 0;
const step = (t) => console.log(`\n== ${++stepNo}/6 ${t}`);
const note = (t) => console.log(t);
const fail = (t, next) => { console.error(`\nSTOPPED: ${t}${next ? `\nNext: ${next}` : ''}`); process.exit(1); };
const run = (cmd, args) => { console.log(`$ ${[cmd, ...args].map((x) => (/\s/.test(x) ? `'${x}'` : x)).join(' ')}`); return spawnSync(cmd, args, { cwd: labRoot, stdio: 'inherit' }).status; };
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

console.log(`drupal-core-lab at ${labRoot}${inCoder ? ` (Coder workspace ${process.env.CODER_WORKSPACE_NAME})` : ''}${DRY ? '  DRY RUN: nothing will be changed' : ''}`);

// 1. Update the checkout. Variants, patches and this script may all have changed upstream, so this comes first.
step('Update the checkout');
if (flags['no-update']) note('Skipped (--no-update).');
else {
  const up = git('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}');
  if (up.status !== 0) note('This branch has no upstream; using the checkout as it is.');
  else if (DRY) note(`Would fetch and fast-forward to ${up.stdout.trim()}.`);
  else {
    const upstream = up.stdout.trim(), before = sha(fs.readFileSync(self));
    const f = git('fetch', '--quiet', upstream.split('/')[0]);
    if (f.status !== 0) note(`Could not fetch (${firstLine(f)}); using the checkout as it is.`);
    else {
      const [ahead, behind] = git('rev-list', '--left-right', '--count', `HEAD...${upstream}`).stdout.trim().split(/\s+/).map(Number);
      if (!behind) note(`Up to date with ${upstream}.`);
      else if (ahead) note(`This branch has ${ahead} commit(s) of its own and is ${behind} behind ${upstream}; not updating it automatically.`);
      else {
        if (git('merge', '--ff-only', '--quiet', upstream).status !== 0) {
          const label = `test-mr ${new Date().toISOString()}: local changes set aside to update to ${upstream}`;
          const st = git('stash', 'push', '--include-untracked', '-m', label);
          if (st.status !== 0) fail(`local changes block the update and could not be set aside (${firstLine(st)}).`, 'commit or move them (git status shows them), then run this again.');
          note(`Local changes were in the way. They are kept in the stash as "${label}".\n  See them: git stash list    Bring them back later: git stash pop`);
          const m = git('merge', '--ff-only', '--quiet', upstream);
          if (m.status !== 0) fail(`could not update to ${upstream} (${firstLine(m)}).`, 'run `git status` and report what it shows.');
        }
        note(`Updated to ${upstream} (${behind} new commit${behind === 1 ? '' : 's'}).`);
        // A newer version of this script came with the update: run that one for the remaining steps.
        if (sha(fs.readFileSync(self)) !== before) {
          note('This script changed in the update; running the new version.');
          process.exit(spawnSync(process.execPath, [self, ...argv, '--no-update'], { stdio: 'inherit' }).status ?? 1);
        }
      }
    }
  }
}

// 2. The variant.
step('Pick the comparison');
const found = resolveVariant(positional[0] || flags.issue);
if (found.error) fail(found.error, `run \`node scripts/test-mr.mjs <issue number>\`; registered variants are listed in tools/compare/variants.json.`);
const v = found.v, slug = v.slug;
note(found.note || `Variant ${slug}.`);
note(`${v.label || ''}\nBefore: ${v.before.env}   After: ${v.after.env} with ${(v.after.patches || []).join(', ') || 'no patch'}`);

// 3. Optional: bring a newer merge request diff in.
step('Patch');
if (!flags.diff && !flags.mr) note('Using the patch in the checkout (pass --diff=<file> or --mr=<number> to test a newer merge request revision).');
else {
  const list = v.after.patches || [];
  const target = flags.patch || (list.length === 1 ? list[0] : '');
  if (!target) fail(`${slug} has ${list.length} After patches; say which one the diff replaces.`, `add --patch=<one of: ${list.join(', ')}>`);
  if (!list.includes(target)) fail(`${target} is not one of ${slug}'s After patches (${list.join(', ')}).`);
  const mrNo = flags.mr && (String(flags.mr).match(/merge_requests\/(\d+)/) || String(flags.mr).match(/^!?(\d+)$/) || [])[1];
  if (flags.mr && !mrNo) fail(`--mr=${flags.mr} is neither a merge request number nor a merge request URL.`);
  const source = flags.diff || `https://git.drupalcode.org/project/drupal/-/merge_requests/${mrNo}.diff`;
  let text = '';
  if (/^https?:\/\//.test(source)) {
    if (DRY) note(`Would download ${source}.`);
    else {
      try {
        const res = await fetch(source, { signal: AbortSignal.timeout(30000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        text = await res.text();
      } catch (e) {
        const dest = `reports/issues/${v.issue}/incoming/`;
        fail(`could not download ${source} (${e.cause?.code || e.message}). DDEV Coder workspaces usually cannot reach git.drupalcode.org.`,
          `bring the diff in by hand. 1) In a browser open ${source} and save it (plain text). 2) Upload it on GitHub into ${dest} ` +
          `with "Add file > Upload files". 3) Run: node scripts/test-mr.mjs ${v.issue} --diff=${dest}<file name>   (this pulls it first).`);
      }
    }
  } else {
    const file = [path.resolve(process.cwd(), source), path.resolve(labRoot, source)].find((p) => fs.existsSync(p));
    if (!file) fail(`no file ${source} (looked in ${process.cwd()} and ${labRoot}).`);
    text = fs.readFileSync(file, 'utf8');
  }
  if (!DRY) {
    if (!/^diff --git /m.test(text)) fail(`${source} is not a diff (no "diff --git" line). A saved login or error page looks like this.`, 'open the MR\'s "plain diff" link in a browser and save exactly what it shows.');
    const targetFile = path.join(labRoot, target);
    if (fs.existsSync(targetFile) && sha(fs.readFileSync(targetFile)) === sha(Buffer.from(text))) note(`${target} already holds this diff; nothing to change.`);
    else {
      fs.mkdirSync(path.dirname(targetFile), { recursive: true });
      fs.writeFileSync(targetFile, text);
      const who = process.env.CODER_WORKSPACE_OWNER_NAME || os.userInfo().username;
      const why = `${mrNo ? `MR !${mrNo}` : 'diff'} from ${source}, ${new Date().toISOString().slice(0, 10)}; brought in by scripts/test-mr.mjs (tip not read from git)`;
      const rec = sh(process.execPath, [path.join(labRoot, 'scripts/patch-change.mjs'), 'record', target, '--by', who, '--reason', why]);
      if (rec.status === 0) note(`Wrote ${target} and recorded the change (reports/issues/${v.issue}/PATCH-CHANGES.md; the previous version is kept in original-patches/).`);
      else if (/new patch, not a changed one/.test(`${rec.stdout}${rec.stderr}`)) note(`Wrote ${target} (a new patch file; nothing earlier to record).`);
      else note(`Wrote ${target}, but recording the change failed: ${firstLine(rec)}`);
      note(`These are local changes in the checkout. BRANCHES.md still names the previous tip; on a machine that reaches git.drupalcode.org,\n  node scripts/new-issue.mjs ${v.issue} --branch <fork branch> --refresh   records the tip and base.`);
    }
  }
}
if (flags['no-start']) { note('\nStopping here (--no-start).'); process.exit(0); }

// 4. DDEV projects. DDEV allows each project name once, so a name held by another copy of the lab stops `ddev config` part-way through
// the build ("project root is already set to …"): check before building. Then other comparisons' sites: two pairs at once is more
// than a workspace has room for, and a stale pair confuses everyone.
step('Check DDEV projects');
const list = sh('ddev', ['list', '-j']);
if (list.error || list.status !== 0) note('DDEV is not available here, so there is nothing to check or stop.');
else {
  const projects = parseDdevList(list.stdout);
  const wanted = [v.before.env, v.after.env].map((env) => ({ name: ddevName(env), dir: envDir(env) }));
  if (inCoder) wanted.push(...PROXY_PROJECTS.map((p) => ({ name: p.name, dir: path.join(labRoot, p.dir) })));
  const held = ddevNameClashes(projects, wanted);
  if (held.length) {
    const other = held[0].lab, nested = other && labRoot.startsWith(other + path.sep), names = held.map((c) => c.name).join(' ');
    const again = `node scripts/test-mr.mjs ${positional[0] || slug}`;
    fail(`DDEV already has ${held.map((c) => `${c.name} at ${c.approot}`).join(', ')}. DDEV allows each project name once` +
      `${other ? `, and ${held.length === 1 ? 'it belongs' : 'they belong'} to the lab copy in ${other}` : ''}; this copy is ${labRoot}.` +
      `${nested ? ' This copy is a second clone made inside that one.' : ''}`,
      nested ? `remove this copy (check first that nothing of yours is in it: git -C ${labRoot} status) and use the other one:\n  cd ${other} && rm -rf ${labRoot} && ${again}`
        : other ? `use that copy: cd ${other} && ${again}\n  (To build in this copy instead, free the names first: ddev stop --unlist ${names}; the other copy's files are kept.)`
          : `free the names (their files are kept): ddev stop --unlist ${names}, then run this again.`);
  }
  const envsRoot = path.join(labRoot, 'envs') + path.sep, keep = new Set([envDir(v.before.env), envDir(v.after.env)]);
  const others = projects.filter((p) => p.status === 'running' && p.approot && p.approot.startsWith(envsRoot) && !keep.has(p.approot));
  if (!others.length) note('No other comparison is running.');
  for (const p of others) {
    if (DRY) { note(`Would stop ${p.name} (${path.relative(labRoot, p.approot)}).`); continue; }
    note(`Stopping ${p.name} (${path.relative(labRoot, p.approot)}); its data is kept.`);
    sh('ddev', ['stop', p.name], { stdio: 'inherit' });
  }
}

// 5. Build and start.
step('Build and start');
const evaluator = `tools/playwright/evaluate-${v.issue}.mjs`;
let status = 0;
if (inCoder) {
  const coreUrl = flags['core-url'] || process.env.LAB_CORE_URL || 'https://github.com/drupal/drupal.git';
  const args = [path.join(labRoot, 'scripts/cloud-bootstrap.mjs'), slug, '--install-autostart', `--core-url=${coreUrl}`];
  if (DRY) note(`Would run: node scripts/cloud-bootstrap.mjs ${slug} --install-autostart --core-url=${coreUrl}`);
  else status = run(process.execPath, args);
} else {
  if (DRY) note(`Would run: node tools/compare/setup.mjs ${slug}${(flags['core-url'] || process.env.LAB_CORE_URL) ? ` --core-url=${flags['core-url'] || process.env.LAB_CORE_URL}` : ''}   (again with --refresh-patches if a patch changed), then node scripts/lab-env.mjs start ${slug}`);
  else {
    if (sh('ddev', ['--version']).status !== 0) fail('DDEV is not installed here.', 'use a DDEV Coder workspace (docs/CLOUD-QUICKSTART.md), or install DDEV (docs/FIRST-RUN.md).');
    // Outside Coder core comes from git.drupalcode.org unless a mirror is named (a filtered network: --core-url or $LAB_CORE_URL).
    const setup = [path.join(labRoot, 'tools/compare/setup.mjs'), slug, ...((flags['core-url'] || process.env.LAB_CORE_URL) ? [`--core-url=${flags['core-url'] || process.env.LAB_CORE_URL}`] : [])];
    let s = run(process.execPath, setup);
    if (s === 4) { note('A patch changed since the sites were built; applying the current patch files.'); s = run(process.execPath, [...setup, '--refresh-patches']); }
    if (s !== 0) fail(`tools/compare/setup.mjs ${slug} failed (exit ${s}).`, 'read its last lines above; docs/PITFALLS.md lists known errors.');
    status = run(process.execPath, [path.join(labRoot, 'scripts/lab-env.mjs'), 'start', slug]);
  }
}
if (DRY) { note('\nDry run finished; nothing was changed.'); process.exit(0); }

// 6. Where to look. The smoke check exits 3 when a check could not run (often Chromium in a filtered network): the comparison is up.
step('Open the comparison');
const domain = (process.env.CODER_AGENT_URL || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
const viewer = inCoder ? `https://${PROXY_PROJECTS.find((p) => p.role === 'viewer').name}--${process.env.CODER_WORKSPACE_NAME}--${process.env.CODER_WORKSPACE_OWNER_NAME}.${domain}/` : 'the Viewer address printed above (https://drupal-compare.ddev.site or http://localhost:8100)';
if (status !== 0 && status !== 3) fail(`${inCoder ? 'scripts/cloud-bootstrap.mjs' : 'scripts/lab-env.mjs start'} ended with exit ${status}.`, `read the lines above it; the "If something fails" table in reports/issues/${v.issue}/CODER-PROMPT.md maps known messages to fixes.`);
const bar = '='.repeat(78);
console.log(`\n${bar}\n Before/After for #${v.issue} (${slug}) is running.\n\n   ${viewer}\n\n` +
  `${inCoder ? ' Open it in a browser signed in to Coder. ' : ' '}Press "Log in both as admin", then follow the Steps tab.\n` +
  `${status === 3 ? ' The smoke check could not run every check (see NOT RUN above); confirm both frames load by eye.\n' : ''}` +
  `${fs.existsSync(path.join(labRoot, evaluator)) ? ` Scripted Before/After: node ${evaluator} ${slug}   (add --forced-colors for forced colours)\n` : ''}${bar}`);
