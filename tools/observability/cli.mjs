#!/usr/bin/env node
// Optional observability layer for one Core Lab comparison.
//
//   node tools/observability/cli.mjs enable  <slug> [--no-collector] [--sample=1.0] [--no-database]
//   node tools/observability/cli.mjs disable <slug>
//   node tools/observability/cli.mjs status  [slug]
//   node tools/observability/cli.mjs collect <slug> --run <playwright-run-dir> [--out <dir>]
//   node tools/observability/cli.mjs validate <evidence.json>
//   node tools/observability/cli.mjs compare <before.json> <after.json>
//
// Disabled by default. Enabling copies a small Drupal module into both disposable checkouts, writes a per-environment
// settings block, and adds one pinned OpenTelemetry Collector container to each DDEV project. Nothing is added to a
// core composer.json and no hosted service is used.
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { labRoot, resolveVariant, envDir } from '../compare/lib.mjs';
import { safeId, sha256, redactSecrets } from './sanitize.mjs';
import { validateEvidence, assertEvidence } from './schema.mjs';
import { compareEvidence, referentialProblems } from './evidence.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const MODULE_SRC = path.join(here, 'drupal/core_lab_observability');
const COLLECTOR_CONFIG = path.join(here, 'collector/otel-collector-config.yaml');
const COLLECTOR_IMAGE = 'otel/opentelemetry-collector-contrib:0.165.0';
const BEGIN = '// BEGIN core-lab observability (managed by tools/observability/cli.mjs)';
const END = '// END core-lab observability';

const args = process.argv.slice(2);
const cmd = args[0];
const opt = (name, fallback = null) => {
  const eq = args.find((x) => x.startsWith(`--${name}=`));
  if (eq) return eq.slice(name.length + 3);
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};
const has = (name) => args.includes(`--${name}`);
const positional = args.slice(1).filter((x) => !x.startsWith('--'));
const say = (s = '') => console.log(s);

function fail(message) { console.error(`ERROR: ${message}`); process.exit(1); }

function variantOrExit(slugArg = positional[0]) {
  const r = resolveVariant(slugArg);
  if (r.error) fail(r.error);
  if (r.note) say(r.note);
  return r.v;
}

function ddev(env, argv, { input, timeout = 300000 } = {}) {
  const r = spawnSync('ddev', argv, { cwd: envDir(env), encoding: 'utf8', input, timeout, maxBuffer: 32 * 1024 * 1024 });
  if (r.status !== 0) {
    const detail = `${r.stderr || ''}${r.stdout || ''}`.trim().split('\n').slice(-6).join('\n');
    throw new Error(`ddev ${argv.join(' ')} failed in ${env}${detail ? `:\n${detail}` : ''}`);
  }
  return r.stdout || '';
}

function probe(env, action = 'status') {
  const argv = action === 'status' ? ['exec', 'php'] : ['exec', 'env', `CORE_LAB_ACTION=${action}`, 'php'];
  const out = ddev(env, argv, { input: fs.readFileSync(path.join(here, 'drupal/admin.php')), timeout: 120000 });
  const line = out.split('\n').find((l) => l.startsWith('CORE_LAB_JSON:'));
  if (!line) throw new Error(`the Drupal probe in ${env} returned no result:\n${out.slice(-800)}`);
  return JSON.parse(line.slice('CORE_LAB_JSON:'.length));
}

function fullCommit(env) {
  return execFileSync('git', ['-C', envDir(env), 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
}

function copyModule(env) {
  const dest = path.join(envDir(env), 'modules/contrib/core_lab_observability');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(MODULE_SRC, dest, { recursive: true });
  // Keep `git status` clean in the disposable checkout without touching a tracked file.
  const exclude = path.join(envDir(env), '.git');
  try {
    const gitDir = execFileSync('git', ['-C', envDir(env), 'rev-parse', '--git-common-dir'], { encoding: 'utf8' }).trim();
    const excludeFile = path.join(path.isAbsolute(gitDir) ? gitDir : path.join(envDir(env), gitDir), 'info', 'exclude');
    const current = fs.existsSync(excludeFile) ? fs.readFileSync(excludeFile, 'utf8') : '';
    if (!current.split('\n').includes('modules/contrib/core_lab_observability/')) {
      fs.appendFileSync(excludeFile, `${current && !current.endsWith('\n') ? '\n' : ''}modules/contrib/core_lab_observability/\n`);
    }
  }
  catch { /* worktrees share .git/info/exclude; a missing one is not fatal */ }
  void exclude;
}

function removeModule(env) {
  fs.rmSync(path.join(envDir(env), 'modules/contrib/core_lab_observability'), { recursive: true, force: true });
}

const phpString = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

function writeSettings(env, side, { enabled, endpoint, sample, database, exceptions }) {
  const file = path.join(envDir(env), 'sites/default/settings.php');
  if (!fs.existsSync(file)) throw new Error(`${env} has no sites/default/settings.php. Build the pair first.`);
  let text = fs.readFileSync(file, 'utf8');
  text = text.replace(new RegExp(`\\n?${BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${END}\\n?`, 'g'), '\n');
  const block = `${BEGIN}
$settings['core_lab_observability'] = [
  'enabled' => ${enabled ? 'TRUE' : 'FALSE'},
  'endpoint' => ${phpString(endpoint)},
  'environment' => ${phpString(env)},
  'side' => ${phpString(side)},
  'drupal_commit' => ${phpString(fullCommit(env))},
  'run_id' => 'server',
  'sample_ratio' => ${Number(sample)},
  'capture' => [
    'requests' => TRUE,
    'database' => ${database ? 'TRUE' : 'FALSE'},
    'exceptions' => ${exceptions ? 'TRUE' : 'FALSE'},
  ],
  'privacy' => [
    'capture_request_bodies' => FALSE,
    'capture_sensitive_headers' => FALSE,
    'capture_query_text' => FALSE,
  ],
  'storage' => [
    'directory' => '/tmp/core-lab-observability',
  ],
];
${END}`;
  const output = text.replace(/\s*$/, '\n\n') + block + '\n';
  fs.writeFileSync(file, output);
}

function writeCompose(env, side, { collector = true } = {}) {
  const dir = path.join(envDir(env), 'observability');
  fs.mkdirSync(path.join(dir, 'data'), { recursive: true });
  fs.copyFileSync(COLLECTOR_CONFIG, path.join(dir, 'otel-collector-config.yaml'));
  const compose = `# Generated by tools/observability/cli.mjs. Remove with: node tools/observability/cli.mjs disable <slug>
services:
  otel-collector:
    image: ${COLLECTOR_IMAGE}
    container_name: ddev-\${DDEV_SITENAME}-otel-collector
    command: ["--config=/etc/otelcol-contrib/config.yaml"]
    restart: "no"
    environment:
      - CORE_LAB_SIDE=${side}
    volumes:
      - ../observability/otel-collector-config.yaml:/etc/otelcol-contrib/config.yaml:ro
      - ../observability/data:/data
    labels:
      com.ddev.site-name: \${DDEV_SITENAME}
      com.ddev.approot: \${DDEV_APPROOT}
`;
  if (collector) fs.writeFileSync(path.join(envDir(env), '.ddev/docker-compose.observability.yaml'), compose);
  else fs.rmSync(path.join(envDir(env), '.ddev/docker-compose.observability.yaml'), { force: true });
}

function removeCompose(env) {
  fs.rmSync(path.join(envDir(env), '.ddev/docker-compose.observability.yaml'), { force: true });
}

function installModule(env) {
  const before = probe(env, 'status');
  if (before.module) return before;
  ddev(env, ['drupal', 'cache']);
  ddev(env, ['drupal', 'module:install', 'core_lab_observability']);
  const after = probe(env, 'status');
  if (!after.module) throw new Error(`the module did not install in ${env}: ${after.error || 'not listed'}`);
  return after;
}

// The response header is the end-to-end proof that Drupal ran the module for a real request. It does not prove that the
// collector accepted the trace; collect.mjs compares the local span file with the collector's file for that.
async function headerCheck(env, retries = 12) {
  const info = JSON.parse(execFileSync('ddev', ['describe', '-j'], { cwd: envDir(env), encoding: 'utf8' })).raw;
  const host = info.hostname, port = Number(info.router_https_port || 443);
  for (let i = 1; i <= retries; i++) {
    const result = await new Promise((resolve) => {
      const req = https.request({ host: '127.0.0.1', port, servername: host, path: '/user/login', method: 'GET', headers: { host, 'accept-encoding': 'identity' }, rejectUnauthorized: false, timeout: 8000 }, (res) => {
        res.resume();
        resolve({ status: res.statusCode, headers: res.headers });
      });
      req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout' }); });
      req.on('error', (e) => resolve({ error: e.message }));
      req.end();
    });
    if (result.headers) return { ok: true, status: result.status, trace: result.headers['x-core-lab-trace-id'] || null, observability: result.headers['x-core-lab-observability'] || null, export: result.headers['x-core-lab-export'] || null };
    if (i < retries) await new Promise((r) => setTimeout(r, 2500));
    else return { ok: false, error: result.error };
  }
  return { ok: false };
}

async function enable(v) {
  const collector = !has('no-collector');
  const sample = Number(opt('sample', '1'));
  if (!Number.isFinite(sample) || sample < 0 || sample > 1) fail('--sample must be between 0 and 1');
  const database = !has('no-database');
  const exceptions = !has('no-exceptions');
  const endpoint = collector ? 'http://otel-collector:4318/v1/traces' : '';
  say(`Observability for ${v.slug}: ${collector ? `collector ${COLLECTOR_IMAGE}` : 'local spans only, no collector'}, sample ${sample}.`);
  for (const side of ['before', 'after']) {
    const env = v[side].env;
    say(`\n== ${side}: ${env}`);
    copyModule(env);
    writeSettings(env, side, { enabled: true, endpoint, sample, database, exceptions });
    writeCompose(env, side, { collector });
    const state = installModule(env);
    say(`   module installed; SDK ${state.sdk ? 'present' : 'MISSING'}; endpoint ${state.settings.endpoint || '(local only)'}`);
  }
  for (const side of ['before', 'after']) {
    say(`\nrestarting ${v[side].env} to ${collector ? 'start the collector' : 'apply settings'}`);
    ddev(v[side].env, ['restart']);
  }
  for (const side of ['before', 'after']) {
    const check = await headerCheck(v[side].env);
    if (!check.ok) fail(`${v[side].env}: no response from the site (${check.error}). Is DDEV running?`);
    if (!check.trace) fail(`${v[side].env}: the response has no X-Core-Lab-Trace-Id. Observability is not active; check ddev logs and the module settings.`);
    say(`   ${side}: HTTP ${check.status}, trace ${check.trace.slice(0, 16)}…, observability ${check.observability}, export ${check.export}`);
  }
  say(`\nEnabled. Run an instrumented scenario, then:\n  node tools/observability/cli.mjs collect ${v.slug} --run <reports/${v.issue}/playwright/RUN>`);
}

function disable(v) {
  for (const side of ['before', 'after']) {
    const env = v[side].env;
    say(`\n== ${side}: ${env}`);
    try { const state = probe(env, 'status'); if (state.module) { probe(env, 'uninstall'); say('   module uninstalled'); } }
    catch (e) { say(`   module uninstall skipped: ${String(e.message).split('\n')[0]}`); }
    removeCompose(env);
    removeModule(env);
    const file = path.join(envDir(env), 'sites/default/settings.php');
    if (fs.existsSync(file)) {
      let text = fs.readFileSync(file, 'utf8');
      text = text.replace(new RegExp(`\\n?${BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${END}\\n?`, 'g'), '\n');
      fs.writeFileSync(file, text.replace(/\s*$/, '\n'));
      say('   settings block removed');
    }
    ddev(env, ['restart']);
    say('   restarted without the collector');
  }
  say('\nDisabled. Existing evidence under reports/issues/*/observability/ is untouched.');
}

function status(v) {
  const rows = [];
  for (const side of ['before', 'after']) {
    const env = v[side].env;
    let state = { ok: false, error: 'not built' };
    try { state = probe(env, 'status'); } catch (e) { state.error = String(e.message).split('\n')[0]; }
    const dataDir = path.join(envDir(env), 'observability/data');
    const files = fs.existsSync(dataDir) ? fs.readdirSync(dataDir) : [];
    rows.push({
      side, env, commit: (() => { try { return fullCommit(env); } catch { return 'unknown'; } })(),
      module: state.module ?? false, enabled: state.enabled ?? false, sdk: state.sdk ?? false,
      endpoint: state.settings?.endpoint || '', collector: fs.existsSync(path.join(envDir(env), '.ddev/docker-compose.observability.yaml')),
      data: files.map((f) => `${f} (${fs.statSync(path.join(dataDir, f)).size} B)`).join(', ') || 'none',
      error: state.error || null,
    });
  }
  say(`\nObservability status for ${v.slug}\n`);
  say('Side   Environment             Module  Enabled  SDK    Collector  Endpoint                           Local data');
  for (const r of rows) say(`${r.side.padEnd(6)} ${r.env.padEnd(23)} ${String(r.module).padEnd(7)} ${String(r.enabled).padEnd(8)} ${String(r.sdk).padEnd(6)} ${String(r.collector).padEnd(10)} ${(r.endpoint || '(none)').padEnd(34)} ${r.data}`);
  for (const r of rows) if (r.error) say(`\n${r.side}: ${r.error}`);
  if (!rows.some((r) => r.module)) say('\nNot enabled. Enable with: node tools/observability/cli.mjs enable <slug>');
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`no such file: ${file}`);
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { fail(`${file} is not valid JSON: ${e.message}`); }
}

async function main() {
  if (!cmd || has('help') || cmd === 'help') {
    console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(2, 17).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
    return;
  }
  if (cmd === 'validate') {
    const file = positional[0]; if (!file) fail('usage: validate <evidence.json>');
    const result = validateEvidence(readJson(file));
    if (!result.ok) { for (const e of result.errors.slice(0, 40)) console.error(`  ${e.path || '/'}: ${e.message}`); fail(`${result.errors.length} schema error(s) in ${file}`); }
    const refs = referentialProblems(readJson(file));
    if (refs.length) { for (const p of refs.slice(0, 40)) console.error(`  ${p}`); fail(`${refs.length} reference error(s) in ${file}`); }
    say(`OK: ${file} validates against evidence schema 1.0.0.`);
    return;
  }
  if (cmd === 'compare') {
    const [bf, af] = positional; if (!bf || !af) fail('usage: compare <before.json> <after.json>');
    const before = assertEvidence(readJson(bf), bf), after = assertEvidence(readJson(af), af);
    const comparison = compareEvidence(before, after);
    say(JSON.stringify(comparison, null, 2));
    return;
  }
  const v = variantOrExit();
  if (cmd === 'enable') return enable(v);
  if (cmd === 'disable') return disable(v);
  if (cmd === 'status') return status(v);
  if (cmd === 'collect') {
    const { collect } = await import('./collect.mjs');
    return collect(v, { runDir: opt('run'), out: opt('out') });
  }
  fail(`unknown command "${cmd}". Use enable, disable, status, collect, validate or compare.`);
}

main().catch((e) => fail(redactSecrets(e.stack || e.message)));
