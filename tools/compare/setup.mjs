// Build the two environments for a comparison from scratch, then bring them to the
// starting state (Standard install, admin/admin, recipe applied, patches on the "after" side).
//   node tools/compare/setup.mjs [slug] [--dry-run]
// Needs: git, Docker, DDEV, Node 20+. Local development only. Safe to re-run: steps that are
// already done are skipped. The first run clones Drupal core and runs Composer (about 10 to 20 minutes).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { labRoot, variants, envDir } from './lib.mjs';

const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const v = variants().find((x) => x.slug === (args.find((a) => !a.startsWith('--')) || variants()[0].slug));
if (!v) { console.error('unknown variant'); process.exit(1); }
const core = v.core || { url: 'https://git.drupalcode.org/project/drupal.git', ref: 'main' };
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

for (const tool of ['git', 'ddev', 'docker']) {
  if (spawnSync(tool, ['--version'], { stdio: 'ignore' }).status !== 0) { console.error(`Missing prerequisite: ${tool}`); if (!dry) process.exit(1); }
}

step(`Drupal core (${core.url} ${core.ref}), shared shallow clone`);
fs.mkdirSync(path.join(labRoot, 'envs'), { recursive: true });
if (!have(bare)) run('git', ['clone', '--bare', '--depth', '1', '--branch', core.ref, core.url, bare]);

step('axe-core (live accessibility checks), installed from npm, not vendored');
if (!have(path.join(labRoot, 'tools/compare/.deps/node_modules/axe-core/axe.min.js'))) run('npm', ['install', '--prefix', path.join(labRoot, 'tools/compare/.deps'), '--no-audit', '--no-fund', '--no-save', 'axe-core@4']);

const sides = [['before', v.before], ['after', v.after]];
for (const [side, spec] of sides) {
  const dir = envDir(spec.env);
  const name = `repro-${spec.env}`.slice(0, 60);
  step(`${side}: ${spec.env}`);
  if (!have(dir)) run('git', ['-C', bare, 'worktree', 'add', '--detach', dir, `refs/heads/${core.ref}`]);

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
  if (!have(path.join(dir, 'core/phpunit.xml')) && !dry) fs.copyFileSync(path.join(dir, 'core/phpunit.xml.dist'), path.join(dir, 'core/phpunit.xml'));
  const installed = !dry && have(path.join(dir, 'sites/default/settings.php')) && spawnSync('ddev', ['drupal', 'login'], { cwd: dir, stdio: 'ignore' }).status === 0;
  if (installed) console.log('already installed; applying the recipe again (safe)');
  else run('ddev', ['drupal', 'install', 'standard', '--password=admin', '--site-name=Drupal core test site'], { cwd: dir });
  run('bash', [path.join(labRoot, 'scripts/lab-site.sh'), 'apply', spec.env, v.recipe || 'ife_sidebar_repro']);
}

console.log(`\nDone. Both sites: log in as admin / admin.\nStart the viewer:  node tools/compare/serve.mjs ${v.slug}   then open http://localhost:8100/`);
