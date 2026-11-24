// Docker container sampling for lab environments. This is a point-in-time sample, not continuous monitoring; CPU
// seconds are derived by multiplying the sampled percentage by the sample interval and are labelled derived, never
// presented as exact hardware cycles.
import { execFileSync } from 'node:child_process';
import { makeEvent, iso, safeText } from '../events.mjs';
import { parseBytes, parsePair } from '../units.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function dockerContainers() {
  try {
    return execFileSync('docker', ['ps', '--format', '{{.Names}}'], { encoding: 'utf8', timeout: 30000 })
      .split('\n').map((x) => x.trim()).filter((n) => /^ddev-.*-(web|db|otel-collector)$/.test(n));
  } catch { return []; }
}

export async function collectDocker({ samples = 1, intervalMs = 1000, issue = null, variant = null } = {}) {
  const containers = dockerContainers();
  if (!containers.length) return { events: [], errors: ['no running DDEV web/db/collector containers found'], metadata: { containers: 0, samples: 0 } };
  const events = [], errors = [];
  for (let i = 0; i < Math.max(1, samples); i++) {
    const at = iso();
    let rows = [];
    try {
      const out = execFileSync('docker', ['stats', '--no-stream', '--format', '{{json .}}', ...containers], { encoding: 'utf8', timeout: 60000, maxBuffer: 8 * 1024 * 1024 });
      rows = out.split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    } catch (e) { errors.push(`docker stats failed: ${safeText(e.message, 200)}`); break; }
    for (const raw of rows) {
      const mem = parsePair(raw.MemUsage);
      const net = parsePair(raw.NetIO);
      const block = parsePair(raw.BlockIO);
      const cpuPercent = Number.parseFloat(String(raw.CPUPerc || '').replace('%', ''));
      const intervalSeconds = Math.max(1, samples) > 1 ? intervalMs / 1000 : null;
      const derivedSeconds = Number.isFinite(cpuPercent) && intervalSeconds ? Math.round(cpuPercent / 100 * intervalSeconds * 1000) / 1000 : null;
      const env = String(raw.Name || '').match(/^ddev-repro-(.+)-(?:web|db|otel-collector)$/)?.[1] || null;
      const envIssue = issue || (env ? (env.match(/issue-(\d{5,7})/) || [])[1] || null : null);
      events.push(makeEvent({
        event_type: 'container', occurred_at: at, duration_ms: intervalSeconds == null ? null : intervalSeconds * 1000,
        issue: envIssue, variant,
        task: { id: `docker-sample:${raw.Name}`, label: 'Docker container sample', execution_id: null },
        activity: 'infrastructure', tool: 'docker', model: null, provider: null,
        environment: { os: `${process.platform} ${process.arch}`, node: process.version, runner: 'local-docker', ddev: null, docker: null },
        outcome: 'unknown', validation: 'not-run', commit: null, patch: null,
        source: { adapter: 'docker-stats', method: 'docker stats --no-stream', confidence: 'measured', reference: null },
        measurements: {
          cpu: { user_seconds: null, system_seconds: null, total_seconds: derivedSeconds, cpu_percent: Number.isFinite(cpuPercent) ? cpuPercent : null, measurement: derivedSeconds == null ? 'sampled' : 'derived', source: 'docker stats CPUPerc' },
          memory: { peak_rss_bytes: null, peak_container_bytes: mem ? Math.round(mem[0]) : null, peak_php_mb: null, measurement: mem ? 'sampled' : 'unavailable' },
          io: { read_ops: null, write_ops: null, read_bytes: block ? Math.round(block[0]) : null, write_bytes: block ? Math.round(block[1]) : null, measurement: block ? 'sampled' : 'unavailable' },
          network: { rx_bytes: net ? Math.round(net[0]) : null, tx_bytes: net ? Math.round(net[1]) : null, measurement: net ? 'sampled' : 'unavailable' },
        },
        quality: {
          completeness: 'partial', missing: ['tokens', 'cost', 'commit', 'validation', 'exact_cpu'],
          notes: ['Docker statistics are sampled. CPU-seconds, when present, are derived from CPUPerc over the sample interval, not measured CPU cycles. Memory is container usage, not PHP peak memory.'],
        },
        private: { container: raw.Name, mem_percent: raw.MemPerc, pids: raw.PIDs, env },
      }));
    }
    if (i < samples - 1) await sleep(intervalMs);
  }
  return { events, errors, metadata: { containers: containers.length, samples: Math.max(1, samples) } };
}

export { parseBytes };
