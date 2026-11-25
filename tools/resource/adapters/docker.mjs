// Docker container sampling for lab environments. This is a point-in-time sample, not continuous monitoring. Every event names
// its container role (web, chrome, db, otel-collector, router, ssh-agent, viewer) and the DDEV site it belongs to, so the
// dashboard can separate Drupal work from idle browser and shared services. CPU-seconds are derived from the sampled CPUPerc
// over the interval; I/O and network are derived from the difference between two cumulative Docker counters. Neither is exact
// hardware accounting.
import { execFileSync } from 'node:child_process';
import { makeEvent, iso, safeText } from '../events.mjs';
import { parseBytes, parsePair } from '../units.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SHARED = new Set(['ddev-router', 'ddev-ssh-agent']);

// `docker ps` is the source of truth for what is running. A container belongs to the lab when it carries DDEV's site label,
// or is one of DDEV's two shared services. An unrelated project (for example Primero) never has either and is skipped.
export function parseDockerPs(text) {
  return String(text || '').split('\n').filter(Boolean).map((line) => {
    const [name, site, approot, project] = line.split('\t');
    const container = { name: String(name || '').trim(), site: String(site || '').trim(), approot: String(approot || '').trim(), project: String(project || '').trim() };
    if (!container.name) return null;
    const shared = SHARED.has(container.name);
    if (!container.site && !shared) return null;
    const role = shared ? (container.name === 'ddev-router' ? 'router' : 'ssh-agent')
      : /-chrome$/.test(container.name) ? 'chrome'
        : /-otel-collector$/.test(container.name) ? 'otel-collector'
          : /-db$/.test(container.name) ? 'db'
            : /-web$/.test(container.name) ? (container.site === 'drupal-compare' ? 'viewer' : 'web')
              : 'other';
    const env = container.site ? container.site.replace(/^repro-/, '') : null;
    return { ...container, shared, role, env, issue: env ? (env.match(/issue-(\d{5,7})/) || [])[1] || null : null };
  }).filter(Boolean);
}

export function dockerContainers() {
  try {
    const out = execFileSync('docker', ['ps', '--format', '{{.Names}}\t{{.Label "com.ddev.site-name"}}\t{{.Label "com.ddev.approot"}}\t{{.Label "com.docker.compose.project"}}'], { encoding: 'utf8', timeout: 30000 });
    return parseDockerPs(out);
  } catch { return []; }
}

const roleTool = (role) => ({ web: 'ddev-web', viewer: 'ddev-viewer', chrome: 'ddev-chrome', db: 'ddev-db', 'otel-collector': 'ddev-otel-collector', router: 'ddev-router', 'ssh-agent': 'ddev-ssh-agent' }[role] || 'docker');

export async function collectDocker({ samples = 1, intervalMs = 1000, issue = null, variant = null } = {}) {
  const containers = dockerContainers();
  if (!containers.length) return { events: [], errors: ['no running lab containers found'], metadata: { containers: 0, samples: 0 } };
  const events = [], errors = [];
  const previous = new Map();
  for (let i = 0; i < Math.max(1, samples); i++) {
    const at = iso();
    let rows = [];
    try {
      const out = execFileSync('docker', ['stats', '--no-stream', '--format', '{{json .}}', ...containers.map((c) => c.name)], { encoding: 'utf8', timeout: 60000, maxBuffer: 8 * 1024 * 1024 });
      rows = out.split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    } catch (e) { errors.push(`docker stats failed: ${safeText(e.message, 200)}`); break; }
    const intervalSeconds = samples > 1 ? intervalMs / 1000 : null;
    for (const raw of rows) {
      const container = containers.find((c) => c.name === raw.Name);
      if (!container) continue;
      const mem = parsePair(raw.MemUsage);
      const net = parsePair(raw.NetIO);
      const block = parsePair(raw.BlockIO);
      const cpuPercent = Number.parseFloat(String(raw.CPUPerc || '').replace('%', ''));
      const derivedSeconds = Number.isFinite(cpuPercent) && intervalSeconds ? Math.round(cpuPercent / 100 * intervalSeconds * 1000) / 1000 : null;
      const prev = previous.get(container.name);
      const delta = (pair, old) => (pair && old ? [Math.max(0, pair[0] - old[0]), Math.max(0, pair[1] - old[1])] : null);
      const ioDelta = delta(block, prev?.block);
      const netDelta = delta(net, prev?.net);
      const ioMeasurement = ioDelta ? 'derived' : 'unavailable';
      const netMeasurement = netDelta ? 'sampled' : 'unavailable';
      events.push(makeEvent({
        event_type: 'container', occurred_at: at, duration_ms: intervalSeconds == null ? null : intervalSeconds * 1000,
        issue: issue || container.issue, variant,
        task: { id: `docker-sample:${container.name}`, label: `Docker ${container.role} sample`, execution_id: null },
        activity: 'infrastructure', tool: roleTool(container.role), model: null, provider: null,
        environment: { os: `${process.platform} ${process.arch}`, node: process.version, runner: 'local-docker', ddev: container.site || null, docker: null },
        outcome: 'unknown', validation: 'not-run', commit: null, patch: null,
        source: { adapter: 'docker-stats', method: 'docker ps labels + docker stats --no-stream', confidence: 'measured', reference: null },
        measurements: {
          cpu: { user_seconds: null, system_seconds: null, total_seconds: derivedSeconds, cpu_percent: Number.isFinite(cpuPercent) ? cpuPercent : null, measurement: derivedSeconds == null ? 'sampled' : 'derived', source: 'docker stats CPUPerc' },
          memory: { peak_rss_bytes: null, peak_container_bytes: mem ? Math.round(mem[0]) : null, peak_php_mb: null, measurement: mem ? 'sampled' : 'unavailable' },
          io: { read_ops: null, write_ops: null, read_bytes: ioDelta ? Math.round(ioDelta[0]) : null, write_bytes: ioDelta ? Math.round(ioDelta[1]) : null, measurement: ioMeasurement },
          network: { rx_bytes: netDelta ? Math.round(netDelta[0]) : null, tx_bytes: netDelta ? Math.round(netDelta[1]) : null, measurement: netMeasurement },
        },
        quality: {
          completeness: 'partial', missing: ['tokens', 'cost', 'commit', 'validation', 'exact_cpu', ...(mem ? [] : ['memory']), ...(ioDelta ? [] : ['disk_bytes']), ...(netDelta ? [] : ['network'])],
          notes: ['Docker statistics are sampled. CPU-seconds are derived from CPUPerc over the sample interval; I/O and network are intervals derived from cumulative counters, not cumulative totals. Memory is container usage, not PHP peak memory.'],
        },
        private: {
          container: container.name, site: container.site, env: container.env, role: container.role, project: container.project,
          shared: container.shared, mem_percent: raw.MemPerc, pids: raw.PIDs,
          io_cumulative: block ? { read_bytes: Math.round(block[0]), write_bytes: Math.round(block[1]) } : null,
          net_cumulative: net ? { rx_bytes: Math.round(net[0]), tx_bytes: Math.round(net[1]) } : null,
        },
      }));
      previous.set(container.name, { block, net });
    }
    if (i < samples - 1) await sleep(intervalMs);
  }
  const roles = Object.fromEntries([...new Set(containers.map((c) => c.role))].sort().map((role) => [role, containers.filter((c) => c.role === role).length]));
  return { events, errors, metadata: { containers: containers.length, roles, samples: Math.max(1, samples) } };
}

export { parseBytes };
