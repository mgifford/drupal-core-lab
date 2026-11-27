// Point-in-time host capacity samples. This adapter reads the same snapshot the build/run preflight uses and turns it
// into a resource event, so swap, disk, Docker memory and pair count can be trended instead of only checked at a gate.
// It never starts, stops or deletes anything.
import { measure, assessResources } from '../../compare/preflight.mjs';
import { labRoot } from '../../compare/lib.mjs';
import { makeEvent, iso } from '../events.mjs';

const pct = (used, total) => (used == null || total == null || !total ? null : Math.round((used / total) * 1000) / 10);
const int = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : null);

export function hostEvent({ snapshot, assessment, now = new Date(), durationMs = null }) {
  const host = snapshot?.host || {};
  const disk = host.disk || {};
  const memory = host.memory || {};
  const docker = snapshot?.docker || {};
  const swapUsed = int(memory.swapUsedBytes), swapTotal = int(memory.swapTotalBytes);
  const dockerUsed = int(docker.labUsedBytes), dockerTotal = int(docker.memTotalBytes);
  return makeEvent({
    event_type: 'host-sample',
    occurred_at: iso(now),
    duration_ms: durationMs,
    task: { id: 'host-sample', label: 'Host capacity sample', execution_id: null },
    activity: 'monitoring',
    tool: 'preflight',
    environment: { os: `${process.platform} ${process.arch}`, node: process.version, runner: 'local-host', ddev: null, docker: null },
    outcome: 'unknown',
    validation: 'not-run',
    source: { adapter: 'host-preflight', method: 'df, memory_pressure/vm_stat, sysctl, docker ps, docker stats', confidence: 'measured', reference: null },
    measurements: {
      host: {
        disk_free_bytes: int(disk.freeBytes),
        disk_total_bytes: int(disk.totalBytes),
        memory_free_percent: memory.freePercent == null ? null : Math.round(memory.freePercent * 10) / 10,
        swap_used_bytes: swapUsed,
        swap_total_bytes: swapTotal,
        swap_used_percent: pct(swapUsed, swapTotal),
        docker_lab_used_bytes: dockerUsed,
        docker_mem_total_bytes: dockerTotal,
        docker_used_percent: pct(dockerUsed, dockerTotal),
        lab_pairs: int(docker.pairs),
        lab_containers: int(docker.labContainers),
        lab_projects: int(docker.projects),
        level: assessment?.level || 'unknown',
        measurement: 'measured',
      },
    },
    quality: {
      completeness: 'partial',
      missing: ['tokens', 'cost', 'github', 'commit'],
      notes: [
        'One point-in-time host sample. It is not a continuous monitor; a gap between samples is not proof of idle time.',
        'Docker memory is the sum of running lab containers and is compared with the Docker VM memory limit. It is not host memory.',
        'The threshold levels are the same conservative values used by scripts/preflight.mjs.',
      ],
    },
    private: { checks: assessment?.checks || [] },
  });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function collectHost({ samples = 1, intervalMs = 1000, root = labRoot } = {}) {
  const events = [], errors = [];
  let latest = null;
  for (let i = 0; i < Math.max(1, samples); i++) {
    const started = Date.now();
    let snapshot;
    try { snapshot = measure({ root }); } catch (e) { errors.push(`host sample failed: ${e.message}`); break; }
    const assessment = assessResources(snapshot);
    const event = hostEvent({ snapshot, assessment, durationMs: Date.now() - started });
    events.push(event);
    latest = { event, assessment, snapshot, event_id: event.event_id };
    if (i < samples - 1) await sleep(intervalMs);
  }
  return { events, errors, metadata: { samples: Math.max(1, samples), latest, errors } };
}
