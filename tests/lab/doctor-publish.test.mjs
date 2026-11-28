// The doctor publication mode is explicit and delegates; its usage errors must not start any network work.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const run = (...a) => spawnSync(process.execPath, [path.join(root, 'scripts/doctor.mjs'), ...a], { encoding: 'utf8', cwd: root, timeout: 20000 });

test('an unknown purpose is refused before any check', () => {
  const r = run('--purpose=bogus');
  assert.equal(r.status, 2);
  assert.match(r.stderr, /Unknown --purpose/);
});

test('publish mode requires an issue number', () => {
  const r = run('--purpose=publish');
  assert.equal(r.status, 2);
  assert.match(r.stderr, /needs --issue/);
});
