// Unit tests for dependency identity and release planning. No Docker, no environments.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { hashFile, dependencyKeys, releasePlan, planSummary } from '../../tools/compare/deps.mjs';

test('dependencyKeys hashes both lockfiles and tolerates missing ones', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'deps-'));
  try {
    fs.writeFileSync(path.join(dir, 'composer.lock'), '{"packages":[]}');
    fs.mkdirSync(path.join(dir, 'core'));
    fs.writeFileSync(path.join(dir, 'core/yarn.lock'), 'yarn lock');
    const keys = dependencyKeys(dir);
    assert.match(keys.composer, /^[0-9a-f]{12}$/);
    assert.match(keys.yarn, /^[0-9a-f]{12}$/);
    assert.notEqual(keys.composer, keys.yarn);
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'deps-empty-'));
    assert.deepEqual(dependencyKeys(empty), { composer: null, yarn: null });
    assert.equal(hashFile(path.join(empty, 'nope')), null);
    fs.rmSync(empty, { recursive: true, force: true });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('releasePlan removes stopped environments only', () => {
  const plan = releasePlan({
    envs: ['baseline-a', 'issue-a', 'baseline-b', 'issue-b'],
    states: { 'baseline-a': 'stopped', 'issue-a': 'paused', 'baseline-b': 'running', 'issue-b': 'unknown' },
  });
  assert.deepEqual(plan, [
    { env: 'baseline-a', action: 'remove', reason: 'stopped', paths: ['core/node_modules'] },
    { env: 'issue-a', action: 'remove', reason: 'paused', paths: ['core/node_modules'] },
    { env: 'baseline-b', action: 'skip', reason: 'running', paths: [] },
    { env: 'issue-b', action: 'skip', reason: 'state unknown', paths: [] },
  ]);
});

test('releasePlan skips an actively leased environment', () => {
  const plan = releasePlan({
    envs: ['baseline-a', 'issue-a'],
    states: { 'baseline-a': 'stopped', 'issue-a': 'stopped' },
    protectedEnvs: new Set(['issue-a']),
  });
  assert.equal(plan.find((p) => p.env === 'issue-a').action, 'skip');
  assert.equal(plan.find((p) => p.env === 'issue-a').reason, 'active lease');
});

test('releasePlan can include vendor only when asked', () => {
  const one = releasePlan({ envs: ['a'], states: { a: 'stopped' }, vendor: false });
  assert.deepEqual(one[0].paths, ['core/node_modules']);
  const two = releasePlan({ envs: ['a'], states: { a: 'stopped' }, vendor: true });
  assert.deepEqual(two[0].paths, ['core/node_modules', 'vendor']);
});

test('planSummary counts removals and skips', () => {
  const plan = releasePlan({ envs: ['a', 'b', 'c'], states: { a: 'stopped', b: 'running', c: 'paused' } });
  assert.deepEqual(planSummary(plan), { remove: 2, skip: 1, total: 3 });
});
