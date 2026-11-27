// Decide which running lab environments are safe to stop. The decision is deliberately conservative: a recent
// evidence write, a live lease/session, a running process or a project that just started is protected or unknown.
// The operator still has to pass --apply; this module never stops anything.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function decideEnvironment({ lease = null, sessionAgeMinutes = null, processActive = false, recentEvidence = false, projectAgeMinutes = null, graceMinutes = 30 } = {}) {
  if (processActive) return { action: 'protect', reason: 'a setup/evaluate/test process is using it' };
  if (recentEvidence) return { action: 'protect', reason: 'issue evidence was written within the grace period' };
  const status = lease?.status || null;
  if (status === 'unknown') return { action: 'unknown', reason: 'lease record is unreadable' };
  if (lease?.session) {
    // A session that is still writing protects the environment even if its TTL lease has expired.
    if (sessionAgeMinutes == null) return { action: 'unknown', reason: 'lease names a session that cannot be read' };
    if (sessionAgeMinutes < graceMinutes) return { action: 'protect', reason: 'active session lease' };
    return { action: 'stop', reason: `lease session idle for ${Math.round(sessionAgeMinutes)} min` };
  }
  if (status === 'active') return { action: 'protect', reason: 'active lease (no session: assume a person is using it)' };
  if (projectAgeMinutes != null && projectAgeMinutes < graceMinutes) {
    return { action: 'unknown', reason: `started ${Math.round(projectAgeMinutes)} min ago (grace ${graceMinutes} min)` };
  }
  if (status === 'expired' || status === 'stale') return { action: 'stop', reason: `${status} lease` };
  return { action: 'stop', reason: 'no lease, no recent evidence and no recent start' };
}

// The newest event time of a DSH session, so the lease's session field can be checked without parsing prompts.
export function findSessionActivity(sessionId, { dshHome = process.env.DSH_HOME || path.join(os.homedir(), '.dsh'), now = Date.now() } = {}) {
  if (!sessionId) return null;
  const root = path.join(dshHome, 'sessions');
  let dirs = [];
  try { dirs = fs.readdirSync(root); } catch { return null; }
  for (const cwd of dirs) {
    for (const name of [`session-${sessionId}`, sessionId]) {
      const file = path.join(root, cwd, name, 'session.v4.jsonl.zstd');
      if (!fs.existsSync(file)) continue;
      try { return { file, ageMinutes: (now - fs.statSync(file).mtimeMs) / 60000 }; } catch { return null; }
    }
  }
  return null;
}
