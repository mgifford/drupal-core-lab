// Per-agent path scope: normalize, allow descendants, report outside paths, and parse rename records from git status -z.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { makeScope, normalizeScopePath, isAllowed, outsidePaths, parseStatusZ, scopePath, writeScope, readScope, removeScope } from '../../tools/compare/agent-scope.mjs';

test('a scope path is relative, normalized and cannot escape the checkout', () => {
  assert.equal(normalizeScopePath('./reports/issues/123/'), 'reports/issues/123');
  assert.equal(normalizeScopePath('scripts'), 'scripts');
  assert.throws(() => normalizeScopePath('/etc'), /relative path/);
  assert.throws(() => normalizeScopePath('../out'), /relative path/);
  assert.throws(() => normalizeScopePath(''), /relative path/);
});

test('a path is allowed when it is the claim or below it', () => {
  const s = makeScope({ issue: '123', paths: ['reports/issues/123', 'docs/COMMANDS.md'] });
  assert.equal(isAllowed(s, 'reports/issues/123/SUMMARY.md'), true);
  assert.equal(isAllowed(s, 'reports/issues/123'), true);
  assert.equal(isAllowed(s, 'docs/COMMANDS.md'), true);
  assert.equal(isAllowed(s, 'docs/OTHER.md'), false);
  assert.equal(isAllowed(s, 'reports/issues/124/SUMMARY.md'), false);
  assert.deepEqual(outsidePaths(s, ['reports/issues/123/A.md', 'reports/issues/124/B.md', 'docs/COMMANDS.md']), ['reports/issues/124/B.md']);
});

test('git status -z rename and copy records include both paths', () => {
  const text = 'R  new-name.md\0old-name.md\0 M reports/issues/1/A.md\0?? scratch.txt\0';
  assert.deepEqual(parseStatusZ(text), ['new-name.md', 'old-name.md', 'reports/issues/1/A.md', 'scratch.txt']);
});

test('scope files are local, per session and removable without touching the index', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-scope-'));
  try {
    const scope = makeScope({ issue: '123', paths: ['reports/issues/123'], session: 'session-test' });
    assert.equal(scope.session, 'session-test');
    writeScope(root, scope);
    assert.equal(readScope(root, 'session-test').issue, '123');
    assert.equal(fs.existsSync(scopePath(root, 'session-test')), true);
    removeScope(root, 'session-test');
    assert.equal(readScope(root, 'session-test'), null);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
