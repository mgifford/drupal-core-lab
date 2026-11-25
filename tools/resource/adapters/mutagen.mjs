// DDEV Mutagen snapshots. This is a read-only `ddev mutagen status -l` per running project; it does not flush, reset or start
// anything. File counts and declared content sizes are sampled from the session, not a directory walk or disk usage.
import { execFileSync, spawnSync } from 'node:child_process';
import { makeEvent, iso, safeText } from '../events.mjs';
import { parseBytes } from '../units.mjs';

export function parseMutagenStatus(text) {
  const s = String(text || '');
  const m = s.match(/Synchronizable contents:\s*\n(?:[^\n]*\n)*?\s*([\d,]+) files \(([^)]+)\)/);
  const name = (s.match(/^Name:\s*(.+)$/m) || [])[1] || null;
  const status = (s.match(/^Status:\s*(.+)$/m) || [])[1] || null;
  const files = m ? Number(m[1].replace(/,/g, '')) : null;
  const size = m ? m[2] : null;
  return { name, status, files, size, bytes: size ? parseBytes(size) : null };
}

export function runningProjects() {
  try {
    const data = JSON.parse(execFileSync('ddev', ['list', '-j'], { encoding: 'utf8', timeout: 30000 }));
    return (data.raw || []).filter((p) => p && p.status === 'running' && p.approot && p.name);
  } catch { return []; }
}

export function collectMutagen() {
  const projects = runningProjects();
  if (!projects.length) return { events: [], errors: ['no running DDEV projects found'], metadata: { projects: 0 } };
  const events = [], errors = [];
  for (const p of projects) {
    const started = performance.now();
    const r = spawnSync('ddev', ['mutagen', 'status', '-l'], { cwd: p.approot, encoding: 'utf8', timeout: 30000, maxBuffer: 4 * 1024 * 1024 });
    if (r.status !== 0) { errors.push(`${p.name}: ddev mutagen status failed: ${safeText(r.stderr || r.error?.message || 'unknown', 200)}`); continue; }
    const parsed = parseMutagenStatus(`${r.stdout || ''}\n${r.stderr || ''}`);
    const issue = (String(p.name).match(/issue-(\d{5,7})/) || [])[1] || null;
    const variant = p.name === 'drupal-compare' ? 'viewer' : issue ? `issue-${issue}` : /baseline/.test(String(p.name)) ? 'baseline' : null;
    const available = parsed.files != null && parsed.bytes != null;
    events.push(makeEvent({
      event_type: 'process', occurred_at: iso(), duration_ms: Math.round(performance.now() - started),
      issue, variant,
      task: { id: `mutagen-status:${p.name}`, label: `Mutagen status ${p.name}`, execution_id: null },
      activity: 'infrastructure', tool: 'ddev-mutagen', model: null, provider: null,
      environment: { os: `${process.platform} ${process.arch}`, node: process.version, runner: 'local-ddev', ddev: p.name, docker: null },
      outcome: 'unknown', validation: 'not-run', commit: null, patch: null,
      source: { adapter: 'mutagen-status', method: 'ddev mutagen status -l', confidence: 'measured', reference: null },
      measurements: { mutagen: { files: parsed.files, bytes: parsed.bytes, sessions: 1, measurement: available ? 'sampled' : 'unavailable' } },
      quality: {
        completeness: 'partial', missing: ['tokens', 'cost', 'cpu', 'memory', 'disk_usage', ...(available ? [] : ['mutagen'])],
        notes: ['File count and content size are reported by Mutagen for the sync session. They are not a host directory walk or disk usage; a flush or reset can change them.'],
      },
      private: { project: p.name, status: parsed.status, size_text: parsed.size },
    }));
  }
  return { events, errors, metadata: { projects: projects.length } };
}
