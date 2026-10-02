// Bring a DDEV Coder Freeform workspace to a working cloud comparison, safe to run again.
//   node scripts/cloud-bootstrap.mjs <slug> [--check] [--rebuild] [--no-smoke-deps]
//     --check           preflight only: report what is missing and change nothing
//     --rebuild         run tools/compare/setup.mjs even when both sites already exist
//     --no-smoke-deps   do not install Playwright and Chromium (the smoke check then reports its frame check as NOT RUN)
// Steps: preflight, build both sites (setup.mjs, skipped when they exist), register and start the three proxy projects
// with `ddev coder-setup`, start the sites and the viewer with the Coder origins, smoke check (scripts/cloud-smoke.mjs).
// Prerequisite that this script cannot do: the workspace's "DDEV project names" must include drupal-compare,
// drupal-compare-before and drupal-compare-after (a Coder workspace setting). See tools/compare/cloud/README.md.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot, variants } from '../tools/compare/lib.mjs';

const args = process.argv.slice(2);
const CHECK = args.includes('--check'), REBUILD = args.includes('--rebuild'), NO_DEPS = args.includes('--no-smoke-deps');
const all = variants();
const slug = args.find((a) => !a.startsWith('--')) || all[0].slug;
const v = all.find((x) => x.slug === slug);
if (!v) { console.error(`Unknown variant: ${slug}. Variants: ${all.map((x) => x.slug).join(', ')}`); process.exit(2); }

const PROXY_PROJECTS = [
  { name: 'drupal-compare', dir: 'tools/compare/site' },
  { name: 'drupal-compare-before', dir: 'tools/compare/cloud/before' },
  { name: 'drupal-compare-after', dir: 'tools/compare/cloud/after' },
];
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
      `  Fix, from a machine with the Coder CLI (this restarts the workspace):  coder update ${process.env.CODER_WORKSPACE_NAME} --always-prompt\n` +
      `  and enter at "DDEV project names":  ${want}\n  Keep Public Sharing at false. (Setting names with \`coder restart --parameter\` did not take effect in testing.)`);
  }
}
for (const p of PROXY_PROJECTS) need(have(`${p.dir}/.ddev/config.yaml`), `Missing ${p.dir}/.ddev/config.yaml (is this checkout the cloud branch?).`);
need(have('tools/compare/site/.ddev/nginx_full/compare-cloud.conf'), 'Missing tools/compare/site/.ddev/nginx_full/compare-cloud.conf.');
need(have('tools/compare/cloud/start-viewer.sh'), 'Missing tools/compare/cloud/start-viewer.sh.');

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
if (!REBUILD && built(v.before.env) && built(v.after.env)) console.log('Both sites already exist; skipping setup.mjs (use --rebuild to run it again).');
else run('node', [path.join(labRoot, 'tools/compare/setup.mjs'), slug]);

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

if (!NO_DEPS) {
  say('Smoke check dependencies (Playwright and Chromium)');
  const pw = path.join(labRoot, 'tools/playwright');
  if (!fs.existsSync(path.join(pw, 'node_modules/@playwright/test'))) run('npm', ['install'], { cwd: pw });
  run('npx', ['playwright', 'install', 'chromium'], { cwd: pw });
  if (sh('sudo', ['-n', 'true']).status === 0) run('sudo', ['-n', 'npx', 'playwright', 'install-deps', 'chromium'], { cwd: pw });
  else console.log('Passwordless sudo is not available; if Chromium reports missing libraries, run `npx playwright install-deps chromium` in tools/playwright.');
}

say('Smoke check');
const r = spawnSync('node', [path.join(labRoot, 'scripts/cloud-smoke.mjs'), slug], { stdio: 'inherit' });
process.exit(r.status ?? 1);
