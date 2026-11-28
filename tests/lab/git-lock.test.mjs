// Repo-scoped Git operation locks: one live owner, stale-owner recovery, different repositories do not block, release rules.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { acquireGitLock, releaseGitLock, readLock, lockPath, repoKey, withGitLock } from '../../tools/compare/git-lock.mjs';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-lock-'));
const repo = { dir: path.join(dir, 'core.git'), commonDir: path.join(dir, 'core.git') };
const opts = { env: { LAB_GIT_LOCK_DIR: path.join(dir, 'locks') }, home: dir };
const other = { dir: path.join(dir, 'other.git'), commonDir: path.join(dir, 'other.git') };

test('one live owner holds the repository lock; a second acquire is busy and cannot be forced', () => {
  const a = acquireGitLock({ repo, operation: 'fetch --deepen', session: 'a', pid: process.pid, now: 1000 }, opts);
  assert.equal(a.ok, true);
  const b = acquireGitLock({ repo, operation: 'fetch --shallow-since', session: 'b', pid: process.pid, now: 2000 }, opts);
  assert.equal(b.ok, false);
  assert.equal(b.busy, true);
  assert.match(b.reason, /pid/);
  assert.equal(readLock(repo, opts).session, 'a');
  assert.equal(releaseGitLock({ repo, pid: process.pid }, opts).released, true);
});

test('an owner that is gone is stale and may be replaced', () => {
  fs.rmSync(lockPath(repo, opts), { force: true });
  const stale = acquireGitLock({ repo, operation: 'fetch', session: 'gone', pid: 99999999, now: 1000 }, opts);
  assert.equal(stale.ok, true);
  const next = acquireGitLock({ repo, operation: 'new fetch', session: 'live', pid: process.pid, now: 2000 }, opts);
  assert.equal(next.ok, true);
  assert.equal(next.owner.session, 'live');
  releaseGitLock({ repo, pid: process.pid }, opts);
});

test('different repositories do not block each other', () => {
  const a = acquireGitLock({ repo, operation: 'fetch', session: 'a', pid: process.pid }, opts);
  const b = acquireGitLock({ repo: other, operation: 'fetch', session: 'b', pid: process.pid }, opts);
  assert.equal(a.ok, true); assert.equal(b.ok, true);
  assert.notEqual(repoKey(repo), repoKey(other));
  releaseGitLock({ repo, pid: process.pid }, opts); releaseGitLock({ repo: other, pid: process.pid }, opts);
});

test('release refuses a mismatched pid and leaves the live owner alone', () => {
  const a = acquireGitLock({ repo, operation: 'fetch', session: 'a', pid: process.pid }, opts);
  assert.equal(releaseGitLock({ repo, pid: process.pid + 1 }, opts).released, false);
  assert.equal(readLock(repo, opts).session, 'a');
  assert.equal(releaseGitLock({ repo, pid: process.pid }, opts).released, true);
});

test('withGitLock always releases, including when the operation throws', () => {
  assert.throws(() => withGitLock({ repo, operation: 'fetch', session: 'a', pid: process.pid }, () => { throw new Error('network down'); }, opts), /network down/);
  assert.equal(readLock(repo, opts), null);
  const again = withGitLock({ repo, operation: 'fetch', session: 'b', pid: process.pid }, () => 'ok', opts);
  assert.equal(again, 'ok');
});

test('a sandbox that cannot create ~/.dsh falls back to a lock inside the shared repository', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'git-lock-home-'));
  try {
    fs.writeFileSync(path.join(home, '.dsh'), 'not a directory');
    const localRepo = { dir: path.join(home, 'repo.git'), commonDir: path.join(home, 'repo.git') };
    fs.mkdirSync(localRepo.dir, { recursive: true });
    const p = lockPath(localRepo, { env: {}, home });
    assert.match(p, /\.lab-cache\/git-locks\//);
    const got = acquireGitLock({ repo: localRepo, operation: 'fetch', session: 's', pid: process.pid }, { env: {}, home });
    assert.equal(got.ok, true);
    assert.equal(releaseGitLock({ repo: localRepo, pid: process.pid }, { env: {}, home }).released, true);
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});
