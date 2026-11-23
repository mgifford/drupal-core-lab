// Adapter for reports/issues/<nid>/resources/*.json produced by scripts/measure-resources.mjs. It preserves the
// native measurement and records what that file does not contain (cumulative CPU, disk, network, tokens).
import fs from 'node:fs';
import path from 'node:path';
import { labRoot } from '../ledger.mjs';
import { makeEvent, iso, safeText } from '../events.mjs';

export function collectMeasureResources({ issue = null, variant = null } = {}) {
  const issues = path.join(labRoot, 'reports/issues');
  const files = [];
  if (fs.existsSync(issues)) {
    for (const nid of fs.readdirSync(issues).sort()) {
      const dir = path.join(issues, nid, 'resources');
      if (!fs.existsSync(dir)) continue;
      if (issue && issue !== nid) continue;
      for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) files.push(path.join(dir, f));
    }
  }
  const events = [], errors = [];
  for (const file of files) {
    let data;
    try { data = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { errors.push(`${path.relative(labRoot, file)}: ${e.message}`); continue; }
    if (!data || !Array.isArray(data.summaries)) { errors.push(`${path.relative(labRoot, file)}: no summaries array`); continue; }
    for (const s of data.summaries) {
      const web = s.containers?.web || {}, db = s.containers?.db || {};
      const containerSamples = (Number(web.samples) || 0) + (Number(db.samples) || 0);
      const peakContainer = containerSamples > 0 ? Math.max(...[web.peakMemoryBytes, db.peakMemoryBytes].filter(Number.isFinite)) : null;
      const peakPhp = Number.isFinite(s.phpPeakMb) ? s.phpPeakMb : null;
      const peak = peakPhp != null || peakContainer != null ? Math.max(peakContainer || 0, peakPhp == null ? 0 : peakPhp * 1024 * 1024) : null;
      const cpuPercent = containerSamples > 0 ? Math.max(...[web.peakCpuPercent, db.peakCpuPercent].filter(Number.isFinite)) : null;
      const measuredMemory = peak != null;
      const measuredCpu = cpuPercent != null;
      events.push(makeEvent({
        event_type: 'process',
        occurred_at: data.measuredAt || iso(),
        duration_ms: Number.isFinite(s.medianResponseMs) ? s.medianResponseMs : null,
        issue: String(data.issue || '') || issue, variant: variant || data.slug || null,
        task: { id: `measure-resources:${path.basename(file)}:${s.env}`, label: `Resource measurement: ${data.slug || issue || 'comparison'}`, execution_id: path.basename(file) },
        activity: 'resource-measurement', tool: 'measure-resources', model: null, provider: null,
        environment: { os: data.system?.platform || null, node: data.system?.node || null, runner: 'local-ddev', ddev: data.system?.ddev || null, docker: data.system?.docker || null },
        outcome: (s.failures || 0) > 0 ? 'failure' : 'success', validation: 'not-run', commit: null, patch: null,
        source: { adapter: 'measure-resources', method: 'scripts/measure-resources.mjs', confidence: measuredMemory || measuredCpu ? 'measured' : 'unavailable', reference: path.relative(labRoot, file) },
        measurements: {
          cpu: { user_seconds: null, system_seconds: null, total_seconds: null, cpu_percent: cpuPercent, measurement: measuredCpu ? 'sampled' : 'unavailable', source: measuredCpu ? 'docker stats peak' : null },
          memory: { peak_rss_bytes: peakPhp == null ? null : Math.round(peakPhp * 1024 * 1024), peak_container_bytes: peakContainer, peak_php_mb: peakPhp, measurement: measuredMemory ? 'measured' : 'unavailable' },
          io: { read_ops: null, write_ops: null, read_bytes: null, write_bytes: null, measurement: 'unavailable' },
          network: { rx_bytes: null, tx_bytes: null, measurement: 'unavailable' },
        },
        quality: {
          completeness: 'partial',
          missing: ['tokens', 'cost', 'cumulative_cpu', 'disk_bytes', 'network', 'commit', 'validation'],
          notes: ['Durations are response medians from measure-resources.mjs, not total process time. CPU is a sampled peak percentage, not cumulative CPU-seconds. Memory is the higher of the PHP request peak and the sampled container peak. Database values are unavailable when DDEV uses SQLite without a db container.'],
        },
        source_key: `measure-resources:${path.relative(labRoot, file)}:${s.env}`,
        private: { env: s.env, label: s.label, requests: s.requests, failures: s.failures, medianResponseMs: s.medianResponseMs, slowestResponseMs: s.slowestResponseMs, containers: s.containers, phpLogLines: s.phpLogLines },
      }));
    }
  }
  return { events, errors, metadata: { files: files.length } };
}

export { safeText };
