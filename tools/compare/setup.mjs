// Build the two environments for a comparison from scratch, then bring them to the
// starting state (Standard install, admin/admin, recipe applied, patches on the "after" side).
//   node tools/compare/setup.mjs [slug] [--dry-run]
//   node tools/compare/setup.mjs [slug] --check-patches    only report whether the patches still apply to that core
//   node tools/compare/setup.mjs [slug] --refresh-patches  an environment whose patched files no longer match the patch files (setup stops with BLOCKED, exit 4): restore
//                                                           the files the patches touch (local edits in them are saved as a diff first), then apply the current patches;
//                                                           contrib modules are extracted again at their pinned commit and patched (the old folder is kept as a backup)
//   node tools/compare/setup.mjs [slug] --reinstall        reset both sites (database and files) and reapply recipe and languages; keeps the checkout, vendor and patches
//   (a variant with "testExtensions": true gets `ddev drupal test:extensions-enable` before its recipe, so it can install test modules)
//   node tools/compare/setup.mjs [slug] --with-lighthouse   also install Lighthouse (optional background audits in the viewer; Node 22.19+)
//   node tools/compare/setup.mjs [slug] --checkout-only     only the git worktrees with their patches: no DDEV, no site (enough for scripts/lint.mjs --host);
//                                                           a later run without the flag carries on from there
//   node tools/compare/setup.mjs [slug] --core-url=<url>    fetch core from another remote (e.g. https://github.com/drupal/drupal.git when
//                                                           git.drupalcode.org is unreachable); a pinned commit must exist there too
//   node tools/compare/setup.mjs [slug] --core-from=<path>  seed the core commit from a checkout already on disk (a Coder issue-picker
//                                                           workspace, or a mirror) instead of the network; falls back to --core-url
//
// A variant's `core` says which Drupal core to use: `{ "ref": "main" }` follows the branch (fetched when an
// environment is first created), `{ "commit": "<sha>" }` pins one exact commit so a reproduction can be repeated
// later exactly as it was verified.
// Needs: git, Docker, DDEV, Node 20+. Local development only. Safe to re-run: steps that are
// already done are skipped. The first run clones Drupal core and runs Composer (about 10 to 20 minutes).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { labRoot, variants, envDir, ddevName } from './lib.mjs';
import { ensurePatches } from './patch-state.mjs';
import { identity, blockMessage, headOf, recipeStatus } from './env-state.mjs';
import { ensureContrib } from './contrib-state.mjs';
import { noChangeProblem } from './change-under-test.mjs';

const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const v = variants().find((x) => x.slug === (args.find((a) => !a.startsWith('--')) || variants()[0].slug));
if (!v) { console.error('unknown variant'); process.exit(1); }
// An archived issue's variant that follows core main is retired: core main already holds its change, so its patch no longer applies.
if (v.retired) { console.error(`${v.slug} is retired: ${v.retired}.\nIts issue is archived (reports/issues/${v.issue}/ARCHIVED.md); the pinned variant still builds. To build this one anyway, remove "retired" from its entry in variants.json.`); process.exit(2); }
const coreUrl = (args.find((a) => a.startsWith('--core-url=')) || '').slice('--core-url='.length);
const coreFrom = (args.find((a) => a.startsWith('--core-from=')) || '').slice('--core-from='.length);   // seed the core commit from a local checkout instead of the network
const core = { url: 'https://git.drupalcode.org/project/drupal.git', ref: 'main', ...(v.core || {}), ...(coreUrl ? { url: coreUrl } : {}) };
const coreRef = `refs/lab/${core.commit ? core.commit.slice(0, 12) : core.ref}`;   // where the chosen core lives in envs/core.git
const CHECK = args.includes('--check-patches');
const REFRESH_PATCHES = args.includes('--refresh-patches');   // restore the files the patches touch, then apply the current patch files again
const CHECKOUT_ONLY = args.includes('--checkout-only');   // worktrees and patches only, no DDEV
const REINSTALL = args.includes('--reinstall');   // wipe each site's database and files and install again (no re-clone, no composer): the cheap way to reset
// An After with nothing to test would equal Before and every check would say "no difference": stop before building one (exit 4, like a patch mismatch).
{ const none = noChangeProblem(v); if (none) { console.error(`BLOCKED: ${none}.`); process.exit(4); } }
const bare = path.join(labRoot, 'envs/core.git');

function run(cmd, argv, opts = {}) {
  console.log(`$ ${[cmd, ...argv].join(' ')}${opts.cwd ? `   (in ${path.relative(labRoot, opts.cwd) || '.'})` : ''}`);
  if (dry) return '';
  const r = spawnSync(cmd, argv, { stdio: 'inherit', ...opts });
  if (r.status !== 0) { console.error(`\nFailed: ${cmd} ${argv.join(' ')}`); process.exit(r.status || 1); }
  return '';
}
// DDEV's shared router sometimes misses its 60 second health check when it restarts to add a
// project. It recovers on its own, so retry start/restart a couple of times.
function runRetry(cmd, argv, opts) {
  for (let i = 1; i <= 3; i++) {
    console.log(`$ ${[cmd, ...argv].join(' ')}${opts.cwd ? `   (in ${path.relative(labRoot, opts.cwd) || '.'})` : ''}${i > 1 ? `   [retry ${i - 1}]` : ''}`);
    if (dry) return;
    if (spawnSync(cmd, argv, { stdio: 'inherit', ...opts }).status === 0) return;
    console.log('Failed. If the DDEV router timed out, it usually recovers; waiting 20 seconds and retrying.');
    spawnSync('sleep', ['20']);
  }
  console.error(`\nFailed after retries: ${cmd} ${argv.join(' ')}`); process.exit(1);
}
const have = (p) => fs.existsSync(p);
const out = (cmd, argv, cwd) => execFileSync(cmd, argv, { cwd, encoding: 'utf8' }).trim();
const step = (t) => console.log(`\n== ${t}`);

// Contrib modules (a variant's `contrib`, and `contribPatches` on a side) are handled by tools/compare/contrib-state.mjs.

for (const tool of CHECK || CHECKOUT_ONLY ? ['git'] : ['git', 'ddev', 'docker']) {
  if (spawnSync(tool, ['--version'], { stdio: 'ignore' }).status !== 0) { console.error(`Missing prerequisite: ${tool}`); if (!dry) process.exit(1); }
}

// One setup at a time. Two runs against the same envs/ start the same DDEV project twice (container name conflict)
// and fetch into envs/core.git at once ("shallow file has changed"). A lock left by a run that died is taken over.
if (!dry) {
  const lock = path.join(labRoot, 'envs/.setup.lock');
  fs.mkdirSync(path.dirname(lock), { recursive: true });
  try { fs.writeFileSync(lock, String(process.pid), { flag: 'wx' }); }
  catch (e) {
    const other = Number(fs.readFileSync(lock, 'utf8')) || 0;
    let alive = false; if (other) { try { process.kill(other, 0); alive = true; } catch { /* not running */ } }
    if (alive) { console.error(`Another setup is already running (pid ${other}). Wait for it to finish; do not start a second one.`); process.exit(2); }
    fs.writeFileSync(lock, String(process.pid));
  }
  const unlock = () => { try { if (fs.readFileSync(lock, 'utf8') === String(process.pid)) fs.unlinkSync(lock); } catch { /* already gone */ } };
  process.on('exit', unlock);
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => process.exit(130));
}

step(`Drupal core: ${core.commit ? `pinned commit ${core.commit.slice(0, 12)}` : `branch ${core.ref} (latest)`}${coreFrom ? ` from the local checkout ${coreFrom}` : ` from ${core.url}`}`);
fs.mkdirSync(path.join(labRoot, 'envs'), { recursive: true });
if (!have(bare)) { run('git', ['init', '--bare', bare]); run('git', ['-C', bare, 'remote', 'add', 'origin', core.url]); }
else if (coreUrl && !dry) run('git', ['-C', bare, 'remote', 'set-url', 'origin', core.url]);
const hasRef = () => !dry && spawnSync('git', ['-C', bare, 'rev-parse', '--verify', '-q', `${coreRef}^{commit}`], { stdio: 'ignore' }).status === 0;
// A pinned commit is fetched once. A branch is fetched again whenever an environment still has to be created,
// so a new environment starts from current core while existing ones are left alone.
const needEnv = [v.before, v.after].some((x) => !have(envDir(x.env)));
const fetchSpec = `${core.commit ? core.commit : `+refs/heads/${core.ref}`}:${coreRef}`;
if (core.commit ? !hasRef() : (CHECK || needEnv || !hasRef())) {
  // --core-from seeds the commit from a checkout already on disk (a Coder issue-picker workspace, or a mirror) so no network
  // clone is needed; a non-tip commit can be fetched from a local path directly. It falls back to the origin remote, and
  // --core-url=<mirror> is the other way to survive filtered egress (see tools/compare/cloud/README.md).
  let done = false;
  if (coreFrom && !dry) {
    const src = path.resolve(coreFrom);
    if (!have(path.join(src, 'HEAD')) && !have(path.join(src, '.git'))) { console.error(`--core-from=${coreFrom} is not a git checkout (no HEAD or .git directory).`); process.exit(1); }
    done = spawnSync('git', ['-C', bare, 'fetch', '--depth', '1', src, fetchSpec], { stdio: 'inherit' }).status === 0;
    if (!done) console.log(`\n--core-from: could not fetch ${core.commit || core.ref} from ${src}; trying ${core.url}. Pass --core-url=<mirror> if the network is filtered.`);
  }
  if (!done) run('git', ['-C', bare, 'fetch', '--depth', '1', 'origin', fetchSpec]);
}
if (!dry) console.log('core is at: ' + out('git', ['-C', bare, 'log', '-1', '--format=%H %cs %s', coreRef]));

if (CHECK) {
  // Do both patch stacks still apply to this core? Each side starts from its
  // own clean throwaway checkout. This matters when Before is an earlier MR or
  // patch revision rather than pristine core.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'patchcheck-'));
  let failed = false; const rows = [];
  for (const side of ['before', 'after']) {
    const wt = path.join(tmp, side);
    run('git', ['-C', bare, 'worktree', 'add', '-q', '--detach', wt, coreRef]);
    let sideFailed = false;
    const patches = v[side].patches || [];
    if (!patches.length) rows.push(`| ${side} | _(pristine core)_ | no patches |`);
    for (const p of patches) {
      if (sideFailed) { rows.push(`| ${side} | \`${p}\` | not tried (an earlier patch failed) |`); continue; }
      const r = spawnSync('git', ['apply', path.join(labRoot, p)], { cwd: wt, encoding: 'utf8' });
      if (r.status === 0) rows.push(`| ${side} | \`${p}\` | applies cleanly |`);
      else {
        failed = true; sideFailed = true;
        const inCore = spawnSync('git', ['apply', '--check', '--reverse', path.join(labRoot, p)], { cwd: wt, encoding: 'utf8' }).status === 0;
        rows.push(`| ${side} | \`${p}\` | **does not apply**: ${inCore ? 'it applies in reverse, so this core already has its changes (fixed upstream?)' : String(r.stderr).split('\n').slice(0, 2).join(' ').slice(0, 160)} |`);
      }
    }
    spawnSync('git', ['-C', bare, 'worktree', 'remove', '--force', wt]);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`\n| Side | Patch (in order) | Result on core ${core.commit ? core.commit.slice(0, 12) : core.ref} |\n|---|---|---|\n${rows.join('\n')}`);
  console.log(failed ? '\nAt least one patch stack needs rerolling for this core (see reports/issues/<nid>/REPRODUCE.md).' : '\nBoth patch stacks apply. Build the environments and run the walkthrough to compare them.');
  process.exit(failed ? 3 : 0);
}

if (!CHECKOUT_ONLY) step('axe-core (live accessibility checks), installed from npm, not vendored');
const deps = path.join(labRoot, 'tools/compare/.deps');
// Everything is recorded in .deps/package.json (no --no-save): npm removes installed packages it does not know about, so an
// untracked install would be pruned by the next one. js-yaml reads issue packs (scripts/issue-pack.mjs); Lighthouse is kept once installed.
const withLighthouse = args.includes('--with-lighthouse') || have(path.join(deps, 'node_modules/lighthouse'));
const want = ['axe-core@4', 'js-yaml@4', ...(withLighthouse ? ['lighthouse'] : [])];
if (!CHECKOUT_ONLY && (!have(path.join(deps, 'node_modules/axe-core/axe.min.js')) || !have(path.join(deps, 'node_modules/js-yaml')) || (withLighthouse && !have(path.join(deps, 'node_modules/lighthouse'))))) run('npm', ['install', '--prefix', deps, '--no-audit', '--no-fund', ...want]);

const sides = [['before', v.before], ['after', v.after]];
// Both checkouts first, so the pair can be checked before anything slow runs. A `latest` environment that is missing next to one that
// exists is created at that one's commit, not at the newest core: a pair must stand on one base (a pinned variant always uses its pin).
const addCheckout = (side, spec) => {
  const dir = envDir(spec.env); if (have(dir)) return;
  const other = envDir((side === 'before' ? v.after : v.before).env), otherHead = headOf(other), base = !core.commit && otherHead ? otherHead : coreRef;
  if (base !== coreRef) console.log(`${spec.env}: created at ${base.slice(0, 12)}, the commit of ${path.basename(other)}, so that Before and After stand on one base (to move both to newer core: node scripts/lab-env.mjs delete ${v.slug} --yes, then run setup again)`);
  run('git', ['-C', bare, 'worktree', 'add', '--detach', dir, base]);
};
for (const [side, spec] of sides) addCheckout(side, spec);
if (!dry) { const id = identity(v, { labRoot, envDir, checks: ['base', 'pin'] }); if (id.problems.length) { console.error(blockMessage(id)); process.exit(4); } }
for (const [side, spec] of sides) {
  const dir = envDir(spec.env);
  const name = ddevName(spec.env);
  step(`${side}: ${spec.env}`);

  // Patches, tracked by content (tools/compare/patch-state.mjs): a re-run reuses them only when the recorded hashes and the files still
  // match, and stops with BLOCKED (exit 4) when they do not. --refresh-patches puts the files the patches touch back and applies again.
  if (dry) for (const p of spec.patches || []) run('git', ['apply', path.join(labRoot, p)], { cwd: dir });
  else {
    let r; try { r = ensurePatches({ dir, labRoot, patchPaths: spec.patches || [], refresh: REFRESH_PATCHES, slug: v.slug, env: spec.env, side }); } catch (e) { console.error(e.message); process.exit(1); }
    for (const l of r.lines) (r.status === 'blocked' || r.status === 'failed' ? console.error : console.log)(l);
    if (r.status === 'blocked') process.exit(4);
    if (r.status === 'failed') process.exit(1);
  }
  if (CHECKOUT_ONLY) { console.log(`checkout only: ${path.relative(labRoot, dir)} at ${dry ? coreRef : out('git', ['rev-parse', '--short', 'HEAD'], dir)}${(spec.patches || []).length ? ' plus its patches' : ''}`); continue; }

  // A site that exists keeps what an earlier recipe did (recipes install and change, never uninstall), so a changed recipe applied on top is
  // not the state the recipe describes: stop, and say how to start from a clean install (--reinstall, which lab-env.mjs reset runs).
  if (v.recipe && !REINSTALL && !dry && have(path.join(dir, 'sites/default/settings.php')) && ['differs', 'missing-in-lab'].includes(recipeStatus(dir, labRoot, v.recipe).status)) { console.error(blockMessage(identity(v, { labRoot, envDir, checks: ['recipe'] }))); process.exit(4); }

  if (!have(path.join(dir, '.ddev/config.yaml'))) {
    run('ddev', ['config', '--project-type=drupal12', '--docroot=.', '--php-version=8.5', `--project-name=${name}`, '--omit-containers=db', '--disable-settings-management'], { cwd: dir });
  }
  runRetry('ddev', ['start'], { cwd: dir });
  if (!have(path.join(dir, 'vendor/autoload.php'))) run('ddev', ['composer', 'install', '--no-interaction'], { cwd: dir });
  if (!have(path.join(dir, '.ddev/commands/web/drupal'))) {
    // The add-on's own post-install restart can hit the router flake; the files are in place by then.
    console.log('$ ddev add-on get justafish/ddev-drupal-core-dev');
    if (!dry) spawnSync('ddev', ['add-on', 'get', 'justafish/ddev-drupal-core-dev'], { stdio: 'inherit', cwd: dir });
    if (!dry && !have(path.join(dir, '.ddev/commands/web/drupal'))) { console.error('The add-on was not installed (see output above).'); process.exit(1); }
    runRetry('ddev', ['restart'], { cwd: dir });
  }
  // Contrib modules (same on both sides), then the patches inside them (tools/compare/contrib-state.mjs): extracted at the pinned commit,
  // recorded by content, verified on a re-run, BLOCKED (exit 4) on a mismatch; --refresh-patches extracts them again (the old folder is kept as a backup).
  if ((v.contrib || []).length) {
    if (dry) for (const m of v.contrib) console.log(`$ (plan) contrib ${m.name} @ ${m.commit.slice(0, 12)} from ${m.url}${(spec.contribPatches || []).filter((cp) => cp.module === m.name).map((cp) => `, patch ${cp.patch}`).join('')}`);
    else {
      step(`${side}: contrib ${v.contrib.map((m) => `${m.name} @ ${m.commit.slice(0, 12)}`).join(', ')}`);
      const r = ensureContrib({ dir, labRoot, modules: v.contrib, patches: spec.contribPatches || [], refresh: REFRESH_PATCHES, slug: v.slug, env: spec.env, side, sharedRoot: path.join(labRoot, 'envs/.contrib'), log: (l) => console.log(l) });
      for (const l of r.lines) (r.status === 'blocked' || r.status === 'failed' ? console.error : console.log)(l);
      if (r.status === 'blocked') process.exit(4);
      if (r.status === 'failed') process.exit(1);
    }
  }

  if (!have(path.join(dir, 'core/phpunit.xml')) && !dry) fs.copyFileSync(path.join(dir, 'core/phpunit.xml.dist'), path.join(dir, 'core/phpunit.xml'));
  // `ddev phpunit` sources core/.env (SIMPLETEST_BASE_URL and the browser settings). The add-on ships the template in
  // .ddev/core-dev/.env and says to copy it; without it every PHPUnit run errors before its first assertion.
  if (!dry && !have(path.join(dir, 'core/.env')) && have(path.join(dir, '.ddev/core-dev/.env'))) fs.copyFileSync(path.join(dir, '.ddev/core-dev/.env'), path.join(dir, 'core/.env'));
  if (!dry) fs.mkdirSync(path.join(dir, 'sites/simpletest/browser_output'), { recursive: true });
  if (REINSTALL && !dry && have(path.join(dir, 'sites/default/settings.php'))) {
    // Local test data only. The add-on has no db container (SQLite), so a snapshot is attempted but usually unavailable.
    spawnSync('ddev', ['snapshot', '--name', `before-reset-${Date.now()}`], { cwd: dir, stdio: 'ignore' });
    spawnSync('ddev', ['drupal', 'uninstall'], { cwd: dir, stdio: 'inherit' });
    try { fs.chmodSync(path.join(dir, 'sites/default'), 0o755); } catch { /* already writable */ }
    fs.rmSync(path.join(dir, 'sites/default/files'), { recursive: true, force: true });
    fs.rmSync(path.join(dir, 'sites/default/settings.php'), { force: true });
    runRetry('ddev', ['restart'], { cwd: dir });
  }
  const installed = !REINSTALL && !dry && have(path.join(dir, 'sites/default/settings.php')) && spawnSync('ddev', ['drupal', 'login'], { cwd: dir, stdio: 'ignore' }).status === 0;
  if (installed) console.log('already installed; applying the recipe again (safe)');
  else run('ddev', ['drupal', 'install', 'standard', '--password=admin', '--site-name=Drupal core test site'], { cwd: dir });
  if (v.testExtensions) run('ddev', ['drupal', 'test:extensions-enable'], { cwd: dir });   // lets the recipe install test modules such as form_test
  if (v.recipe) run('bash', [path.join(labRoot, 'scripts/lab-site.sh'), 'apply', spec.env, v.recipe]);
  else console.log('no recipe set for this variant: the site is a plain Standard install');
  for (const code of v.languages || []) run('bash', [path.join(labRoot, 'scripts/lab-site.sh'), 'language', spec.env, code]);   // e.g. fa: right-to-left, browse /fa/...
}

if (!dry && !CHECKOUT_ONLY) { const id = identity(v, { labRoot, envDir }); if (id.problems.length) { console.error(blockMessage(id)); process.exit(4); } }   // the post-condition: what was built is what the variant asks for
if (CHECKOUT_ONLY) { console.log(`\nDone (checkouts only, no sites). Lint the change: node scripts/lint.mjs ${v.slug} --host`); process.exit(0); }
console.log(`\nDone. Both sites: log in as admin / admin.\nStart the viewer:  node tools/compare/serve.mjs ${v.slug}   then open http://localhost:8100/`);
