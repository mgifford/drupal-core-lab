// Bring a DDEV Coder Freeform workspace to a working cloud comparison, safe to run again.
// For people and agents, scripts/test-mr.mjs is the one command to start from: it updates the checkout, stops other comparisons and calls this.
//   node scripts/cloud-bootstrap.mjs <slug | issue number> [--check] [--rebuild] [--no-smoke-deps] [--install-autostart]
//                                          [--core-url=<url>] [--use-existing-core[=<path>]]
//     --check           preflight only: report what is missing and change nothing
//     --rebuild         run tools/compare/setup.mjs even when both sites already exist (when they exist but a patch file changed since
//                       they were built, setup.mjs --refresh-patches runs by itself: the After site never keeps serving an older patch)
//     --no-smoke-deps   do not install Playwright and Chromium (the smoke check then reports its frame check as NOT RUN)
//     --install-autostart  write ~/.coder-startup.sh so this script runs again at every workspace start (a workspace restart stops
//                       all DDEV projects and the viewer). The template runs that file detached after Docker is ready; log: /tmp/lab-cloud-bootstrap.log
//     --core-url=<url>  fetch core from a mirror (e.g. https://github.com/drupal/drupal.git) when git.drupalcode.org is filtered.
//                       Also read from $LAB_CORE_URL. Forwarded to tools/compare/setup.mjs.
//     --use-existing-core[=<path>]  seed the core commit from a checkout already in the workspace (a drupal-core issue-picker clone;
//                       default ~/drupal-core, or $LAB_EXISTING_CORE) instead of the network. Forwarded as setup.mjs --core-from.
// Steps: preflight, build both sites (setup.mjs, skipped when they exist), register and start the three proxy projects
// with `ddev coder-setup`, start the sites and the viewer with the Coder origins, smoke check (scripts/cloud-smoke.mjs).
// Prerequisite that this script cannot do: the workspace's "DDEV project names" must include drupal-compare,
// drupal-compare-before and drupal-compare-after (a Coder workspace setting). See tools/compare/cloud/README.md.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot, resolveVariant, envDir } from '../tools/compare/lib.mjs';
import { PROXY_PROJECTS } from '../tools/compare/cloud/config.mjs';
import { sideState } from '../tools/compare/contrib-state.mjs';
import { runBlockReason } from '../tools/compare/patch-state.mjs';

const args = process.argv.slice(2);
const CHECK = args.includes('--check'), REBUILD = args.includes('--rebuild'), NO_DEPS = args.includes('--no-smoke-deps');
// No default: building whichever variant happens to be first is how a workspace ended up showing another issue.
const found = resolveVariant(args.find((a) => !a.startsWith('--')));
if (found.error) { console.error(found.error); process.exit(2); }
const v = found.v, slug = v.slug;
if (found.note) console.log(found.note);

// Filtered egress inside a workspace often cannot reach git.drupalcode.org; a mirror (--core-url/$LAB_CORE_URL) or a checkout
// already in the workspace (--use-existing-core/$LAB_EXISTING_CORE, such as a drupal-core issue-picker clone) is the way round it.
const coreUrl = (args.find((a) => a.startsWith('--core-url=')) || '').slice('--core-url='.length) || process.env.LAB_CORE_URL || '';
const existingArg = args.find((a) => a === '--use-existing-core' || a.startsWith('--use-existing-core='));
const existingCore = existingArg ? ((existingArg.includes('=') ? existingArg.slice(existingArg.indexOf('=') + 1) : '') || process.env.LAB_EXISTING_CORE || path.join(os.homedir(), 'drupal-core')) : null;

const problems = [];
const need = (ok, msg) => { if (!ok) problems.push(msg); return ok; };
const sh = (cmd, argv, opts = {}) => spawnSync(cmd, argv, { encoding: 'utf8', ...opts });
const say = (t) => console.log(`\n== ${t}`);
const have = (p) => fs.existsSync(path.join(labRoot, p));

say(`Preflight for variant ${slug}`);
const inCoder = need(['CODER_WORKSPACE_NAME', 'CODER_WORKSPACE_OWNER_NAME', 'CODER_AGENT_URL'].every((k) => process.env[k]),
  'Not inside a Coder workspace (CODER_WORKSPACE_NAME, CODER_WORKSPACE_OWNER_NAME or CODER_AGENT_URL is unset). This path is for DDEV Freeform workspaces; locally use scripts/lab-env.mjs.');
need(Number(process.versions.node.split('.')[0]) >= 20, `Node ${process.versions.node} is too old; the lab needs Node 20+ (Lighthouse needs 22.19+).`);
need(sh('ddev', ['--version']).status === 0, 'The ddev command is not available.');
need(sh('docker', ['info'], { stdio: 'ignore' }).status === 0, 'Docker is not reachable (docker info failed). In a Coder workspace the Docker daemon starts with the workspace; wait for the startup scripts to finish and retry.');
need(fs.existsSync(path.join(os.homedir(), '.ddev/commands/host/coder-setup')),
  'The host command `ddev coder-setup` is missing (~/.ddev/commands/host/coder-setup). This workspace template differs from ddev/coder-ddev freeform; record the template version and stop.');
if (inCoder) {
  const registered = (process.env.CODER_PROJECT_NAMES || '').split(',').map((s) => s.trim()).filter(Boolean);
  const missing = PROXY_PROJECTS.map((p) => p.name).filter((n) => !registered.includes(n));
  if (missing.length) {
    const want = [...registered, ...missing].join(',');
    problems.push(`These DDEV project names are not registered in the workspace: ${missing.join(', ')}. Without them Coder creates no app URL for them.\n` +
      `  Fix in the browser (not tested): the workspace page > Settings > Parameters, set "DDEV project names" to the line below, then update and restart.\n` +
      `  Or from a machine with the Coder CLI (tested; this restarts the workspace):  coder update ${process.env.CODER_WORKSPACE_NAME} --always-prompt\n` +
      `  and enter at "DDEV project names":  ${want}\n  Keep Public Sharing at false. (Setting names with \`coder restart --parameter\` did not take effect in testing.)\n` +
      `  If neither works, create a new Freeform workspace with those names set at creation.`);
  }
}
for (const p of PROXY_PROJECTS) need(have(`${p.dir}/.ddev/config.yaml`), `Missing ${p.dir}/.ddev/config.yaml (is this checkout the cloud branch?).`);
need(have('tools/compare/site/.ddev/nginx_full/compare-cloud.conf'), 'Missing tools/compare/site/.ddev/nginx_full/compare-cloud.conf.');
need(have('tools/compare/cloud/start-viewer.sh'), 'Missing tools/compare/cloud/start-viewer.sh.');
if (existingCore) need(fs.existsSync(path.join(existingCore, 'HEAD')) || fs.existsSync(path.join(existingCore, '.git')),
  `--use-existing-core: ${existingCore} is not a git checkout. Pass the path to a Drupal core clone (the issue picker uses ~/drupal-core), or drop the flag and use --core-url=<mirror>.`);

if (problems.length) {
  console.error('\nPreflight failed:');
  problems.forEach((p, i) => console.error(`  ${i + 1}. ${p}`));
  process.exit(1);
}
console.log('Preflight OK.');
if (CHECK) process.exit(0);

const run = (cmd, argv, opts = {}) => {
  console.log(`$ ${[cmd, ...argv].join(' ')}${opts.cwd ? `   (in ${path.relative(labRoot, opts.cwd) || '.'})` : ''}`);
  const r = spawnSync(cmd, argv, { stdio: 'inherit', ...opts });
  if (r.status !== 0) { console.error(`\nFailed (exit ${r.status}): ${cmd} ${argv.join(' ')}`); process.exit(r.status || 1); }
};

say('Build both sites');
const built = (env) => have(`envs/${env}/vendor/autoload.php`) && have(`envs/${env}/sites/default/settings.php`);
const setupArgs = [path.join(labRoot, 'tools/compare/setup.mjs'), slug];
if (coreUrl) setupArgs.push(`--core-url=${coreUrl}`);
if (existingCore) setupArgs.push(`--core-from=${existingCore}`);
if (!REBUILD && built(v.before.env) && built(v.after.env)) {
  // Skipping setup.mjs keeps a restart fast, but must not leave the After site on an older patch after the patch file changed
  // (an MR push brought in by `git pull`): check both sides against their patch files first (read-only, no network).
  let states;
  try { states = Object.fromEntries(['before', 'after'].map((s) => [s, sideState(envDir(v[s].env), labRoot, v[s].patches || [], { modules: v.contrib || [], patches: v[s].contribPatches || [] })])); }
  catch (e) { console.error(`\nCannot check the sites against their patches: ${e.message}`); process.exit(1); }
  const blocked = runBlockReason(states, slug, { before: v.before.env, after: v.after.env });
  if (!blocked) console.log('Both sites already exist and match their patch files; skipping setup.mjs (use --rebuild to run it again).');
  else if (/does not match its patches/.test(blocked)) {
    console.log(`A patch file changed since the sites were built (${blocked.replace(/^BLOCKED: /, '').replace(/ Nothing was run\..*$/, '')}).\nApplying the current patch files with setup.mjs --refresh-patches.`);
    run('node', [...setupArgs, '--refresh-patches']);
  } else { console.error(`\n${blocked}`); process.exit(4); }   // the Before site has undeclared edits: never change the baseline from here
} else run('node', setupArgs);

say('Register and start the proxy projects');
for (const p of PROXY_PROJECTS) {
  const dir = path.join(labRoot, p.dir);
  if (!fs.existsSync(path.join(dir, '.ddev/config.coder.yaml'))) { run('ddev', ['coder-setup'], { cwd: dir }); run('ddev', ['restart'], { cwd: dir }); }
  else {
    const d = sh('ddev', ['describe', '-j'], { cwd: dir });
    let status = ''; try { status = JSON.parse(d.stdout).raw.status; } catch { /* not started */ }
    if (status !== 'running') run('ddev', ['start'], { cwd: dir }); else console.log(`${p.name}: already registered and running.`);
  }
}

say('Start the sites and the viewer');
run('node', [path.join(labRoot, 'scripts/lab-env.mjs'), 'start', slug]);
run('bash', [path.join(labRoot, 'tools/compare/cloud/start-viewer.sh'), slug]);

if (args.includes('--install-autostart')) {
  say('Install the workspace startup hook');
  const hook = path.join(os.homedir(), '.coder-startup.sh'), marker = '# lab-cloud-bootstrap';
  const line = `cd ${labRoot} && node scripts/cloud-bootstrap.mjs ${slug} >> /tmp/lab-cloud-bootstrap.log 2>&1`;
  const existing = fs.existsSync(hook) ? fs.readFileSync(hook, 'utf8') : '';
  if (existing && !existing.includes(marker)) console.log(`${hook} exists and was not written by this script, so it is left alone. Add this line to it:\n  ${line}`);
  else {
    fs.writeFileSync(hook, `#!/usr/bin/env bash\n${marker}: bring the cloud comparison back after a workspace restart (written by scripts/cloud-bootstrap.mjs --install-autostart)\n${line}\n`, { mode: 0o755 });
    console.log(`Wrote ${hook}: ${slug} comes back by itself at each workspace start.`);
  }
}

if (!NO_DEPS) {
  say('Smoke check dependencies (Playwright and Chromium)');
  const pw = path.join(labRoot, 'tools/playwright');
  // The sites and the viewer are already up, so a failed download (the workspace's egress is filtered) must not end the run as
  // "Failed": say so and let the smoke check report its frame check as NOT RUN.
  const soft = (cmd, argv) => { console.log(`$ ${[cmd, ...argv].join(' ')}   (in tools/playwright)`); return spawnSync(cmd, argv, { stdio: 'inherit', cwd: pw }).status === 0; };
  const pwOk = (fs.existsSync(path.join(pw, 'node_modules/@playwright/test')) || soft('npm', ['install'])) && soft('npx', ['playwright', 'install', 'chromium']);
  if (!pwOk) console.log('\nPlaywright or Chromium could not be installed (often the workspace network filter). The sites and the viewer are running;\n' +
    'only the smoke check\'s frame check will be NOT RUN. Check the frames by hand at the viewer URL.');
  else {
    // Chromium's files live in the persistent home directory, but the system libraries it needs do not survive a workspace restart
    // (the container is recreated), so check for them each time and reinstall only when some are missing.
    const missingLibs = sh('bash', ['-c', 'ldd ~/.cache/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell 2>&1 | grep -c "not found"']);
    if (Number(missingLibs.stdout.trim()) === 0) console.log('Chromium system libraries are present.');
    else if (sh('sudo', ['-n', 'true']).status === 0) { if (!soft('sudo', ['-n', 'npx', 'playwright', 'install-deps', 'chromium'])) console.log('Installing Chromium\'s system libraries failed; the smoke check\'s frame check will be NOT RUN.'); }
    else console.log('Chromium system libraries are missing and passwordless sudo is not available; run `npx playwright install-deps chromium` in tools/playwright.');
  }
}

say('Smoke check');
const r = spawnSync('node', [path.join(labRoot, 'scripts/cloud-smoke.mjs'), slug], { stdio: 'inherit' });
process.exit(r.status ?? 1);
