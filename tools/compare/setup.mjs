// Build the two environments for a comparison from scratch, then bring them to the
// starting state (Standard install, admin/admin, recipe applied, patches on the "after" side).
//   node tools/compare/setup.mjs [slug] [--dry-run]
//   node tools/compare/setup.mjs [slug] --check-patches    only report whether the patches still apply to that core
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
import { labRoot, variants, envDir } from './lib.mjs';

const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const v = variants().find((x) => x.slug === (args.find((a) => !a.startsWith('--')) || variants()[0].slug));
if (!v) { console.error('unknown variant'); process.exit(1); }
const coreUrl = (args.find((a) => a.startsWith('--core-url=')) || '').slice('--core-url='.length);
const coreFrom = (args.find((a) => a.startsWith('--core-from=')) || '').slice('--core-from='.length);   // seed the core commit from a local checkout instead of the network
const core = { url: 'https://git.drupalcode.org/project/drupal.git', ref: 'main', ...(v.core || {}), ...(coreUrl ? { url: coreUrl } : {}) };
const coreRef = `refs/lab/${core.commit ? core.commit.slice(0, 12) : core.ref}`;   // where the chosen core lives in envs/core.git
const CHECK = args.includes('--check-patches');
const CHECKOUT_ONLY = args.includes('--checkout-only');   // worktrees and patches only, no DDEV
const REINSTALL = args.includes('--reinstall');   // wipe each site's database and files and install again (no re-clone, no composer): the cheap way to reset
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

// A variant may list contrib modules whose code is not in Drupal core (an issue that moved to a
// contrib project). Each is cloned once into envs/.contrib/<name>.git and its pinned commit is
// extracted, without a .git directory, into <env>/modules/contrib/<name>. The After side can then
// carry `contribPatches` (applied inside the module directory) instead of core `patches`.
function materializeContrib(m, dest) {
  const shared = path.join(labRoot, 'envs/.contrib', `${m.name}.git`);
  if (!have(shared)) { fs.mkdirSync(path.dirname(shared), { recursive: true }); run('git', ['clone', '--bare', m.url, shared]); }
  if (spawnSync('git', ['-C', shared, 'rev-parse', '--verify', '-q', `${m.commit}^{commit}`], { stdio: 'ignore' }).status !== 0) run('git', ['-C', shared, 'fetch', '--depth', '1', 'origin', m.commit]);
  fs.mkdirSync(dest, { recursive: true });
  run('bash', ['-c', `git -C '${shared}' archive '${m.commit}' | tar -x -C '${dest}'`]);
}

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
  // Do the patches still apply to this core? Applies them in order to a throwaway checkout, builds nothing.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'patchcheck-')); const wt = path.join(tmp, 'core');
  run('git', ['-C', bare, 'worktree', 'add', '-q', '--detach', wt, coreRef]);
  let failed = false; const rows = [];
  for (const p of v.after.patches || []) {
    if (failed) { rows.push(`| \`${p}\` | not tried (an earlier patch failed) |`); continue; }
    const r = spawnSync('git', ['apply', path.join(labRoot, p)], { cwd: wt, encoding: 'utf8' });
    if (r.status === 0) rows.push(`| \`${p}\` | applies cleanly |`);
    else { failed = true; rows.push(`| \`${p}\` | **does not apply**: ${String(r.stderr).split('\n').slice(0, 2).join(' ').slice(0, 160)} |`); }
  }
  spawnSync('git', ['-C', bare, 'worktree', 'remove', '--force', wt]); fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`\n| Patch (in order) | Result on core ${core.commit ? core.commit.slice(0, 12) : core.ref} |\n|---|---|\n${rows.join('\n')}`);
  console.log(failed ? '\nThe patch stack needs rerolling for this core (see reports/issues/<nid>/REPRODUCE.md).' : '\nAll patches apply. Build the environments and run the walkthrough to see whether the problem still reproduces and the fix still works.');
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
for (const [side, spec] of sides) {
  const dir = envDir(spec.env);
  const name = `repro-${spec.env}`.slice(0, 60);
  step(`${side}: ${spec.env}`);
  if (!have(dir)) run('git', ['-C', bare, 'worktree', 'add', '--detach', dir, coreRef]);

  // Patches (after side only), recorded so a re-run does not apply them twice.
  const marker = path.join(dir, '.lab-patches-applied');
  const modified = have(dir) && !dry && out('git', ['status', '--porcelain', '--untracked-files=no'], dir) !== '';
  for (const p of spec.patches || []) {
    if (modified && !have(marker)) { console.log(`tree already has changes; assuming patches are applied: ${p}`); continue; }
    const file = path.join(labRoot, p);
    if (!have(file)) { console.error(`patch missing: ${p}`); process.exit(1); }
    const done = have(marker) ? fs.readFileSync(marker, 'utf8').split('\n') : [];
    if (done.includes(p)) { console.log(`patch already applied: ${p}`); continue; }
    run('git', ['apply', file], { cwd: dir });
    if (!dry) fs.appendFileSync(marker, p + '\n');
  }
  if (CHECKOUT_ONLY) { console.log(`checkout only: ${path.relative(labRoot, dir)} at ${dry ? coreRef : out('git', ['rev-parse', '--short', 'HEAD'], dir)}${(spec.patches || []).length ? ' plus its patches' : ''}`); continue; }

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
  // Contrib modules (same on both sides), then the After side's patches inside the module.
  for (const m of v.contrib || []) {
    const dest = path.join(dir, 'modules/contrib', m.name);
    const cmarker = path.join(dir, `.lab-contrib-${m.name}`);
    if (have(cmarker)) { console.log(`contrib module already in place: ${m.name} @ ${m.commit.slice(0, 12)}`); continue; }
    step(`${side}: contrib ${m.name} @ ${m.commit.slice(0, 12)} (${m.url})`);
    materializeContrib(m, dest);
    if (!dry) fs.writeFileSync(cmarker, `${m.commit}\n`);
  }
  const cpMarker = path.join(dir, '.lab-contrib-patches-applied');
  for (const cp of spec.contribPatches || []) {
    const moddir = path.join(dir, 'modules/contrib', cp.module);
    const done = have(cpMarker) ? fs.readFileSync(cpMarker, 'utf8').split('\n') : [];
    if (done.includes(cp.patch)) { console.log(`contrib patch already applied: ${cp.patch}`); continue; }
    if (!have(path.join(labRoot, cp.patch))) { console.error(`contrib patch missing: ${cp.patch}`); process.exit(1); }
    // Run from the environment root, not the module directory: git apply in a subdirectory of a
    // work tree silently skips every path. --directory prefixes the module's relative path.
    run('git', ['apply', `--directory=${path.posix.join('modules/contrib', cp.module)}`, path.join(labRoot, cp.patch)], { cwd: dir });
    if (!dry) fs.appendFileSync(cpMarker, cp.patch + '\n');
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

if (CHECKOUT_ONLY) { console.log(`\nDone (checkouts only, no sites). Lint the change: node scripts/lint.mjs ${v.slug} --host`); process.exit(0); }
console.log(`\nDone. Both sites: log in as admin / admin.\nStart the viewer:  node tools/compare/serve.mjs ${v.slug}   then open http://localhost:8100/`);
