// Measure comparable request and container resource use for the two unique
// environments in a selected variant, or optionally its comparison group.
//
//   node scripts/measure-resources.mjs <slug> [--runs=5] [--warmups=1]
//     [--page=/path] [--cold] [--group] [--out=directory]
//
// The selected pair is the default. --group expands a grouped review to every
// unique environment in that group (for example, three patch stacks). Requests
// are made serially, not through both viewer frames at once, so the versions do not
// compete during the operation being measured. Docker statistics are sampled
// for the web and database containers; an issue recipe may additionally write
// /tmp/lab-peak-memory.log for exact per-request PHP measurements.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawn } from 'node:child_process';
import {
  envDir,
  envFetch,
  envInfo,
  labRoot,
  loginPathAsync,
  variants,
} from '../tools/compare/lib.mjs';

const args = process.argv.slice(2);
const value = (name, fallback) => {
  const found = args.find((arg) => arg.startsWith(`--${name}=`));
  return found ? found.slice(name.length + 3) : fallback;
};
const has = (name) => args.includes(`--${name}`);
const slug = args.find((arg) => !arg.startsWith('--'));

function fail(message) {
  console.error(message);
  process.exit(1);
}

function numberArg(name, fallback, minimum = 0) {
  const parsed = Number(value(name, fallback));
  if (!Number.isInteger(parsed) || parsed < minimum) fail(`--${name} must be an integer of at least ${minimum}`);
  return parsed;
}

export function bytes(text) {
  const match = String(text || '').trim().match(/^([\d.]+)\s*([kmgt]?i?b)$/i);
  if (!match) return null;
  const powers = { b: 0, kb: 1, kib: 1, mb: 2, mib: 2, gb: 3, gib: 3, tb: 4, tib: 4 };
  const binary = /iB$/i.test(match[2]);
  return Number(match[1]) * (binary ? 1024 : 1000) ** powers[match[2].toLowerCase()];
}

const median = (numbers) => {
  if (!numbers.length) return null;
  const sorted = numbers.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const round = (number, digits = 1) => number == null ? null : Number(number.toFixed(digits));
const mb = (number) => number == null ? null : round(number / 1048576);
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

if (has('self-test')) {
  const cases = { '1B': 1, '1kB': 1000, '1KiB': 1024, '1.5MiB': 1572864, '2GB': 2000000000 };
  for (const [input, expected] of Object.entries(cases)) if (bytes(input) !== expected) fail(`byte parser failed for ${input}`);
  console.log('resource measurement helpers: PASS');
  process.exit(0);
}

if (!slug || has('help')) {
  console.log('Usage: node scripts/measure-resources.mjs <slug> [--runs=5] [--warmups=1] [--page=/path] [--cold] [--group] [--out=directory]');
  process.exit(slug ? 0 : 1);
}

const all = variants();
const selected = all.find((variant) => variant.slug === slug);
if (!selected) fail(`Unknown variant: ${slug}`);
const scope = selected.comparisonGroup && has('group')
  ? all.filter((variant) => variant.comparisonGroup === selected.comparisonGroup)
  : [selected];
const envs = new Map();
for (const variant of scope) {
  for (const side of ['before', 'after']) {
    const spec = variant[side];
    if (!envs.has(spec.env)) envs.set(spec.env, { env: spec.env, label: spec.label || spec.env });
  }
}

function projectName(env) {
  const config = path.join(envDir(env), '.ddev/config.yaml');
  if (!fs.existsSync(config)) fail(`${env} is not built. Run: node tools/compare/setup.mjs ${slug}`);
  const match = fs.readFileSync(config, 'utf8').match(/^name:\s*["']?([^\s"']+)/m);
  return match ? match[1] : path.basename(envDir(env));
}

for (const item of envs.values()) {
  item.project = projectName(item.env);
  item.dir = envDir(item.env);
  item.info = envInfo(item.env);
  item.containers = {
    web: `ddev-${item.project}-web`,
    db: `ddev-${item.project}-db`,
  };
  const config = fs.readFileSync(path.join(item.dir, '.ddev/config.yaml'), 'utf8');
  item.performanceMode = config.match(/^performance_mode:\s*["']?([^\s"']+)/m)?.[1] || 'global default';
}

const containerNames = [...envs.values()].flatMap((item) => Object.values(item.containers));
try {
  execFileSync('docker', ['inspect', ...containerNames], { stdio: 'ignore' });
} catch {
  fail(`The required containers are not running:\n${containerNames.join('\n')}\nStart the selected comparison${has('group') ? ' group' : ''} before measuring.`);
}

const runs = numberArg('runs', 5, 1);
const warmups = numberArg('warmups', 1, 0);
const pagePath = value('page', selected.demo?.start || selected.pages?.[0] || '/');
const issue = String(selected.issue || 'unfiled');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = path.resolve(labRoot, value('out', `reports/issues/${issue}/resources`));
fs.mkdirSync(outDir, { recursive: true });

const phase = { kind: 'initialising', env: null, round: null };
const samples = [];
let statsBuffer = '';
const stats = spawn('docker', ['stats', '--format', '{{json .}}', ...containerNames], { stdio: ['ignore', 'pipe', 'pipe'] });
stats.stdout.setEncoding('utf8');
stats.stdout.on('data', (chunk) => {
  statsBuffer += chunk;
  const lines = statsBuffer.split('\n'); statsBuffer = lines.pop();
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const raw = JSON.parse(line); const usage = String(raw.MemUsage || '').split('/')[0].trim();
      samples.push({
        at: new Date().toISOString(), phase: { ...phase }, container: raw.Name,
        cpuPercent: Number.parseFloat(raw.CPUPerc) || 0, memoryBytes: bytes(usage),
        memoryPercent: Number.parseFloat(raw.MemPerc) || 0, netIO: raw.NetIO,
        blockIO: raw.BlockIO, pids: Number(raw.PIDs) || 0,
      });
    } catch { /* Docker may emit a partial line while stopping. */ }
  }
});

const requestResults = [];
const jars = new Map();
async function request(item, measured, roundNumber) {
  if (has('cold')) {
    phase.kind = 'cache-clear'; phase.env = item.env; phase.round = roundNumber;
    execFileSync('ddev', ['drupal', 'cache'], { cwd: item.dir, stdio: 'ignore', timeout: 120000 });
  }
  phase.kind = measured ? 'measured-request' : 'warmup'; phase.env = item.env; phase.round = roundNumber;
  const started = performance.now();
  const response = await envFetch(item.env, item.info, pagePath, jars.get(item.env));
  const durationMs = performance.now() - started;
  if (measured) requestResults.push({ env: item.env, round: roundNumber, status: response.status, bytes: response.body.length, durationMs: round(durationMs) });
  // Docker updates stats about once per second. Keep the phase assigned long
  // enough to obtain a sample after a short request has completed.
  await delay(1100);
}

function clearPhpLog(item) {
  try { execFileSync('ddev', ['exec', 'truncate', '-s', '0', '/tmp/lab-peak-memory.log'], { cwd: item.dir, stdio: 'ignore' }); } catch { /* optional */ }
}
function readPhpLog(item) {
  try {
    return execFileSync('ddev', ['exec', 'cat', '/tmp/lab-peak-memory.log'], { cwd: item.dir, encoding: 'utf8' })
      .split('\n').filter(Boolean);
  } catch { return []; }
}
function phpValues(lines, key) {
  return lines.flatMap((line) => {
    const match = line.match(new RegExp(`(?:^|\\s)${key}=([\\d.]+)`));
    return match ? [Number(match[1])] : [];
  });
}

try {
  // Authenticate before sampling so login and one-time-token work is excluded.
  for (const item of envs.values()) {
    const jar = {}; jars.set(item.env, jar);
    await envFetch(item.env, item.info, await loginPathAsync(item.env), jar);
  }
  for (let warmup = 0; warmup < warmups; warmup++) for (const item of envs.values()) await request(item, false, warmup + 1);
  for (const item of envs.values()) clearPhpLog(item);
  phase.kind = 'idle'; phase.env = null; phase.round = null; await delay(3500);

  const list = [...envs.values()];
  for (let run = 0; run < runs; run++) {
    const rotated = list.slice(run % list.length).concat(list.slice(0, run % list.length));
    for (const item of rotated) await request(item, true, run + 1);
  }
  phase.kind = 'cooldown'; phase.env = null; phase.round = null; await delay(2200);
} finally {
  stats.kill('SIGINT');
  await Promise.race([new Promise((resolve) => stats.once('close', resolve)), delay(2000)]);
}

const summaries = [];
for (const item of envs.values()) {
  const requests = requestResults.filter((result) => result.env === item.env);
  const phpLines = readPhpLog(item);
  const containers = {};
  for (const [service, name] of Object.entries(item.containers)) {
    const idle = samples.filter((sample) => sample.container === name && sample.phase.kind === 'idle');
    const active = samples.filter((sample) => sample.container === name && sample.phase.env === item.env && sample.phase.kind === 'measured-request');
    const idleMemory = median(idle.map((sample) => sample.memoryBytes).filter(Number.isFinite));
    const peakMemory = Math.max(...active.map((sample) => sample.memoryBytes).filter(Number.isFinite), 0) || null;
    containers[service] = {
      samples: active.length, idleMemoryBytes: round(idleMemory, 0), peakMemoryBytes: round(peakMemory, 0),
      peakAboveIdleBytes: idleMemory == null || peakMemory == null ? null : round(Math.max(0, peakMemory - idleMemory), 0),
      peakCpuPercent: round(Math.max(...active.map((sample) => sample.cpuPercent), 0)),
      peakPids: Math.max(...active.map((sample) => sample.pids), 0),
    };
  }
  const durations = requests.map((request) => request.durationMs);
  const phpPeak = phpValues(phpLines, 'peak_mb');
  const allocatedPeak = phpValues(phpLines, 'allocated_peak_mb');
  summaries.push({
    env: item.env, label: item.label, performanceMode: item.performanceMode,
    requests: requests.length, failures: requests.filter((request) => request.status >= 400).length,
    medianResponseMs: round(median(durations)), slowestResponseMs: round(Math.max(...durations)),
    medianResponseBytes: round(median(requests.map((request) => request.bytes)), 0),
    phpPeakMb: phpPeak.length ? round(Math.max(...phpPeak)) : null,
    phpAllocatedPeakMb: allocatedPeak.length ? round(Math.max(...allocatedPeak)) : null,
    phpLogLines: phpLines.length, containers,
  });
}

const result = {
  schemaVersion: 1, measuredAt: new Date().toISOString(), issue, slug,
  comparisonGroup: selected.comparisonGroup || null, page: pagePath,
  settings: { runs, warmups, cold: has('cold'), serial: true, group: has('group') },
  system: {
    platform: `${os.platform()} ${os.release()} ${os.arch()}`, node: process.version,
    ddev: execFileSync('ddev', ['--version'], { encoding: 'utf8' }).trim(),
    docker: execFileSync('docker', ['version', '--format', '{{.Server.Version}}'], { encoding: 'utf8' }).trim(),
  },
  summaries, requests: requestResults, samples,
};
const base = `${stamp}-${slug}`;
const jsonPath = path.join(outDir, `${base}.json`);
const mdPath = path.join(outDir, `${base}.md`);
fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2) + '\n');

const display = (number, suffix = '') => number == null ? 'not recorded' : `${number}${suffix}`;
let markdown = `# Resource measurement: ${slug}\n\n`;
markdown += `Measured ${result.measuredAt}. Page: \`${pagePath}\`. ${runs} measured request${runs === 1 ? '' : 's'} per environment after ${warmups} warm-up request${warmups === 1 ? '' : 's'}. Requests were serial. Cache mode: ${has('cold') ? 'cold before each request' : 'warm'}.\n\n`;
markdown += `| Version | Median response | Slowest | PHP peak | PHP allocated peak | Web memory peak | Web above idle | DB memory peak | Peak sampled CPU (web/db) | Failures |\n`;
markdown += `|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n`;
for (const summary of summaries) {
  markdown += `| ${summary.label} | ${display(summary.medianResponseMs, ' ms')} | ${display(summary.slowestResponseMs, ' ms')} | ${display(summary.phpPeakMb, ' MB')} | ${display(summary.phpAllocatedPeakMb, ' MB')} | ${display(mb(summary.containers.web.peakMemoryBytes), ' MB')} | ${display(mb(summary.containers.web.peakAboveIdleBytes), ' MB')} | ${display(mb(summary.containers.db.peakMemoryBytes), ' MB')} | ${display(summary.containers.web.peakCpuPercent, '%')} / ${display(summary.containers.db.peakCpuPercent, '%')} | ${summary.failures} |\n`;
}
markdown += `\n## Environment\n\n- ${result.system.platform}\n- Node ${result.system.node}\n- ${result.system.ddev}\n- Docker server ${result.system.docker}\n`;
for (const summary of summaries) markdown += `- ${summary.label}: DDEV performance mode \`${summary.performanceMode}\`\n`;
markdown += `\nContainer values are sampled and may miss very short peaks. PHP peak values come from the issue recipe's request logger when installed. Mutagen is shared host-side infrastructure and is recorded as configuration, not attributed to one Drupal version.\n`;
fs.writeFileSync(mdPath, markdown);
console.log(path.relative(labRoot, mdPath));
console.log(path.relative(labRoot, jsonPath));
