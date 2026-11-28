// A short, machine-global lock for operations that modify the shared Git object store or its shallow boundaries. The key is
// the canonical shared repository (git-common-dir), so every worktree and every checkout of the lab on this machine agrees.
// It is advisory coordination, not a replacement for git's own locks; it is held only around a fetch/deepen, never around
// browser tests, PHPUnit or DDEV work. A live owner is never killed or overridden.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { coordinationDir } from './lease-path.mjs';

export const DEFAULT_TTL_MS = 15 * 60 * 1000;
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex').slice(0, 20);
const pidAlive = (pid) => { if (!Number.isInteger(pid) || pid <= 0) return false; try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };

export function lockDirectory({ env = process.env, home = os.homedir() } = {}) {
  return env.LAB_GIT_LOCK_DIR ? path.resolve(env.LAB_GIT_LOCK_DIR) : path.join(coordinationDir({ env, home }), 'git-locks');
}
const commonDirOf = (repo) => (typeof repo === 'string' ? repo : repo.commonDir || repo.dir);
export function repoKey(repo) {
  let canonical = commonDirOf(repo);
  try { canonical = fs.realpathSync(canonical); } catch { /* keep the given path */ }
  return sha(canonical);
}
export function lockPath(repo, opts = {}) {
  const preferred = path.join(lockDirectory(opts), `${repoKey(repo)}.json`);
  try { fs.mkdirSync(path.dirname(preferred), { recursive: true }); fs.accessSync(path.dirname(preferred), fs.constants.W_OK); return preferred; }
  catch { return path.join(commonDirOf(repo), '.lab-cache', 'git-locks', `${repoKey(repo)}.json`); }
}

export function readLock(repo, opts = {}) {
  const file = lockPath(repo, opts);
  try { const data = JSON.parse(fs.readFileSync(file, 'utf8')); return data && typeof data === 'object' ? { ...data, path: file } : null; } catch { return null; }
}

// { ok, busy, owner, path, reason }. A malformed or owner-dead lock is stale and may be replaced; a live owner is returned
// as busy even after the TTL, with a reason that says how old it is.
export function acquireGitLock({ repo, operation, session = process.env.DSH_SESSION_ID || 'unknown', pid = process.pid, ttlMs = DEFAULT_TTL_MS, now = Date.now() } = {}, opts = {}) {
  const file = lockPath(repo, opts);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const owner = { repository: commonDirOf(repo), operation: String(operation || 'git operation'), session: String(session), pid, host: os.hostname(), started: now, expires: now + ttlMs, ttlMs };
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      fs.writeFileSync(file, `${JSON.stringify(owner, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
      return { ok: true, busy: false, owner, path: file };
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      const existing = readLock(repo, opts);
      if (!existing) {
        // Empty/corrupt file: stale only after the TTL, so a process writing it has time to finish.
        let age = 0; try { age = now - fs.statSync(file).mtimeMs; } catch { age = ttlMs + 1; }
        if (age > ttlMs) { try { fs.rmSync(file); } catch { /* someone else may have removed it */ } continue; }
        return { ok: false, busy: true, owner: null, path: file, reason: `an unreadable lock file is ${Math.round(age / 1000)}s old; retry shortly` };
      }
      const age = now - Number(existing.started || 0);
      if (!pidAlive(Number(existing.pid))) { try { fs.rmSync(file); } catch { /* raced */ } continue; }
      return { ok: false, busy: true, owner: existing, path: file, reason: `pid ${existing.pid} (${existing.session}) has held it for ${Math.round(age / 1000)}s` };
    }
  }
  return { ok: false, busy: true, owner: readLock(repo, opts), path: file, reason: 'the lock changed while acquiring it; retry shortly' };
}

export function releaseGitLock({ repo, pid = process.pid } = {}, opts = {}) {
  const file = lockPath(repo, opts);
  const existing = readLock(repo, opts);
  if (!existing || Number(existing.pid) !== Number(pid)) return { released: false, owner: existing, path: file };
  try { fs.rmSync(file); return { released: true, owner: existing, path: file }; } catch { return { released: false, owner: existing, path: file }; }
}

export function gitLockStatus(repo, opts = {}) {
  const lock = readLock(repo, opts);
  if (!lock) return { held: false, path: lockPath(repo, opts) };
  return { held: true, live: pidAlive(Number(lock.pid)), age_seconds: Math.round((Date.now() - Number(lock.started || 0)) / 1000), owner: lock, path: lock.path };
}

// Run fn while holding the lock; always release. Throws a lock error when another live owner holds it.
export function withGitLock({ repo, operation, session, pid, ttlMs, now } = {}, fn, opts = {}) {
  const got = acquireGitLock({ repo, operation, session, pid, ttlMs, now }, opts);
  if (!got.ok) { const e = new Error(`shared Git repository busy: ${got.reason}`); e.lock = got; throw e; }
  try { return fn(got); } finally { releaseGitLock({ repo, pid: got.owner.pid }, opts); }
}
