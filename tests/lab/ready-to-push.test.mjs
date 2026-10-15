// Tests for scripts/ready-to-push.mjs: a branch that is behind its base is stopped before the selftest, because CI tests the merge. Throwaway repositories; no network.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot } from '../../tools/compare/lib.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ready-test-')); after(() => fs.rmSync(root, { recursive: true, force: true }));
const git = (cwd, ...a) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd, encoding: 'utf8' });
const commit = (cwd, f) => { fs.writeFileSync(path.join(cwd, f), f); git(cwd, 'add', '.'); git(cwd, 'commit', '-q', '-m', f); };
const run = (repo, ...a) => spawnSync('node', [path.join(labRoot, 'scripts/ready-to-push.mjs'), '--repo', repo, '--skip-selftest', ...a], { encoding: 'utf8' });
function setup() {
  const origin = path.join(root, `o${Math.random().toString(36).slice(2)}`), work = `${origin}-w`, other = `${origin}-x`;
  fs.mkdirSync(origin); git(origin, 'init', '-q', '--bare', '-b', 'main'); git(root, 'clone', '-q', origin, work); commit(work, 'a'); git(work, 'push', '-q', 'origin', 'main'); git(root, 'clone', '-q', origin, other);
  return { work, other };
}

test('a branch level with its base, or ahead of it, may go on to the selftest', () => {
  const { work } = setup(); let r = run(work); assert.equal(r.status, 0, r.stderr); assert.match(r.stdout, /0 commit\(s\) ahead of origin\/main and 0 behind/);
  commit(work, 'b'); r = run(work); assert.equal(r.status, 0); assert.match(r.stdout, /1 commit\(s\) ahead of origin\/main and 0 behind/);
});

test('a branch behind its base is stopped, with the command to fix it, unless --allow-behind is given', () => {
  const { work, other } = setup(); commit(other, 'c'); git(other, 'push', '-q', 'origin', 'main'); commit(work, 'b');
  let r = run(work); assert.equal(r.status, 1); assert.match(r.stdout, /1 commit\(s\) ahead of origin\/main and 1 behind/); assert.match(r.stderr, /STOP: origin\/main has 1 commit\(s\) this branch lacks, and CI tests the merge/); assert.match(r.stderr, /git merge origin\/main/);
  r = run(work, '--allow-behind'); assert.equal(r.status, 0);
  git(work, 'merge', '-q', 'origin/main'); r = run(work); assert.equal(r.status, 0, 'after merging the base it is fine');
});

test('--install-hook writes a pre-push hook, and does not overwrite a different one', () => {
  const { work } = setup(); let r = run(work, '--install-hook'); assert.equal(r.status, 0, r.stderr);
  const hook = path.join(work, '.git/hooks/pre-push'); assert.ok(fs.existsSync(hook)); assert.match(fs.readFileSync(hook, 'utf8'), /ready-to-push\.mjs/); assert.ok(fs.statSync(hook).mode & 0o100);
  assert.equal(run(work, '--install-hook').status, 0, 'its own hook can be written again');
  fs.writeFileSync(hook, '#!/bin/sh\necho mine\n'); r = run(work, '--install-hook'); assert.equal(r.status, 1); assert.match(r.stderr, /not overwritten/); assert.match(fs.readFileSync(hook, 'utf8'), /echo mine/);
});
