// Local, expiring leases that protect an environment while a person is working on it. A lease is runtime coordination, not a
// second task tracker: it may name an existing resource-task id, but the task record and issue evidence remain authoritative.
// A missing/expired/stale lease is NEVER proof that an environment is idle; it is only "unknown".
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const LEASE_FILE_VERSION = 1;
const nowIso = (now) => new Date(now).toISOString();
const pidAlive = (pid) => { if (!Number.isInteger(pid) || pid <= 0) return false; try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };

export function readLeases(file) {
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!data || typeof data !== 'object' || !data.leases || typeof data.leases !== 'object') return {};
    return data.leases;
  } catch { return {}; }
}

function writeLeases(file, leases) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify({ schema_version: LEASE_FILE_VERSION, leases }, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(tmp, file);
}

// active: unexpired and, when the lease names a PID, that process is alive (or the lease came from another host).
// A TTL-only lease (pid null, used by the one-shot `claim` command) is active until it expires or is released.
// expired: past expires_at. stale: unexpired but the local PID is gone. unknown: invalid record.
export function leaseStatus(lease, { now = Date.now(), host = os.hostname(), alive = pidAlive } = {}) {
  if (!lease || typeof lease !== 'object' || !lease.slug) return 'unknown';
  const expires = Date.parse(lease.expires_at);
  if (!Number.isFinite(expires)) return 'unknown';
  if (expires <= now) return 'expired';
  if (lease.pid == null) return 'active';
  if (lease.host && lease.host !== host) return 'active';
  return alive(Number(lease.pid)) ? 'active' : 'stale';
}

export function leaseRows(file, options = {}) {
  const leases = readLeases(file);
  return Object.values(leases).map((lease) => ({ ...lease, status: leaseStatus(lease, options) })).sort((a, b) => String(a.slug).localeCompare(String(b.slug)));
}

export function activeLease(file, slug, options = {}) {
  const lease = readLeases(file)[slug];
  return lease && leaseStatus(lease, options) === 'active' ? lease : null;
}

// A new claim by another live pid is refused. An expired/stale lease is replaceable; a remote active lease is protected.
export function claimLease(file, { slug, task = null, operation = 'working', minutes = 60, pid = null, session = null, host = os.hostname(), now = Date.now(), force = false } = {}) {
  if (!slug) throw new Error('claimLease needs a slug');
  if (!Number.isFinite(minutes) || minutes <= 0) throw new Error('minutes must be greater than 0');
  const leases = readLeases(file);
  const prev = leases[slug];
  if (prev && leaseStatus(prev, { now, host }) === 'active' && !force
    && (prev.pid != null ? Number(prev.pid) !== Number(pid) : prev.host !== host)) {
    throw new Error(`active lease on ${slug} held by pid ${prev.pid ?? 'n/a'} on ${prev.host}${prev.task ? ` (task ${prev.task})` : ''}; release it or use --force only if that work has ended`);
  }
  const at = nowIso(now);
  const lease = {
    slug, task: task || null, operation: operation || 'working', pid: pid == null ? null : Number(pid), session: session || null, host,
    started_at: prev && prev.pid === pid ? prev.started_at : at,
    heartbeat_at: at, expires_at: nowIso(now + minutes * 60 * 1000),
  };
  leases[slug] = lease;
  writeLeases(file, leases);
  return lease;
}

export function releaseLease(file, { slug, pid = null, force = false, now = Date.now(), host = os.hostname() } = {}) {
  const leases = readLeases(file);
  const lease = leases[slug];
  if (!lease) return { released: false, reason: 'no lease' };
  const status = leaseStatus(lease, { now, host });
  if (status === 'active' && !force && (lease.pid != null ? Number(lease.pid) !== Number(pid) : lease.host !== host)) return { released: false, reason: `active lease held by pid ${lease.pid ?? 'n/a'} on ${lease.host}; use --force only if that work has ended` };
  delete leases[slug];
  writeLeases(file, leases);
  return { released: true, lease };
}

// The message a destructive lifecycle action should show, or '' when every affected slug is unprotected.
export function protectionMessage(file, slugs, { force = false, now = Date.now(), host = os.hostname(), action = 'stop' } = {}) {
  if (force) return '';
  const leases = readLeases(file);
  const blocked = [...new Set(slugs)].filter((slug) => leases[slug] && leaseStatus(leases[slug], { now, host }) === 'active');
  if (!blocked.length) return '';
  return `Refusing to ${action}: active lease on ${blocked.map((slug) => `${slug} (${leases[slug].operation}${leases[slug].task ? `, task ${leases[slug].task}` : ''}, pid ${leases[slug].pid})`).join(', ')}. Release the lease or use --force only after the work has ended.`;
}
