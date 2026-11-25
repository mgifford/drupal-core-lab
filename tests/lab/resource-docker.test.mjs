// Deterministic Docker coverage tests: labels decide which containers are lab resources, and roles are explicit.
// No Docker daemon is needed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDockerPs } from '../../tools/resource/adapters/docker.mjs';

const ps = [
  'ddev-repro-baseline-main-web\trepro-baseline-main\t/Users/me/envs/baseline-main\tddev-repro-baseline-main',
  'ddev-repro-baseline-main-chrome\trepro-baseline-main\t/Users/me/envs/baseline-main\tddev-repro-baseline-main',
  'ddev-repro-baseline-main-otel-collector\trepro-baseline-main\t/Users/me/envs/baseline-main\tddev-repro-baseline-main',
  'ddev-repro-issue-3619127-vanilla-web\trepro-issue-3619127-vanilla\t/Users/me/envs/issue-3619127-vanilla\tddev-repro-issue-3619127-vanilla',
  'ddev-repro-issue-3619127-vanilla-db\trepro-issue-3619127-vanilla\t/Users/me/envs/issue-3619127-vanilla\tddev-repro-issue-3619127-vanilla',
  'ddev-drupal-compare-web\tdrupal-compare\t/Users/me/drupal-core-lab/tools/compare/site\tddev-drupal-compare',
  'ddev-router\t\t\t',
  'ddev-ssh-agent\t\t\t',
  'primero-web\t\t\t',
  'ddev-unknown-web\t\t\t',
].join('\n');

test('DDEV labels include web, Chrome, OTEL, viewer and shared services; unrelated containers are excluded', () => {
  const rows = parseDockerPs(ps);
  assert.deepEqual(rows.map((r) => [r.name, r.role, r.site || null]), [
    ['ddev-repro-baseline-main-web', 'web', 'repro-baseline-main'],
    ['ddev-repro-baseline-main-chrome', 'chrome', 'repro-baseline-main'],
    ['ddev-repro-baseline-main-otel-collector', 'otel-collector', 'repro-baseline-main'],
    ['ddev-repro-issue-3619127-vanilla-web', 'web', 'repro-issue-3619127-vanilla'],
    ['ddev-repro-issue-3619127-vanilla-db', 'db', 'repro-issue-3619127-vanilla'],
    ['ddev-drupal-compare-web', 'viewer', 'drupal-compare'],
    ['ddev-router', 'router', null],
    ['ddev-ssh-agent', 'ssh-agent', null],
  ]);
  assert.equal(rows.some((r) => r.name === 'primero-web'), false, 'an unrelated Docker project is not lab usage');
  assert.equal(rows.some((r) => r.name === 'ddev-unknown-web'), false, 'a ddev-named container without the site label is not guessed');
  assert.equal(rows.find((r) => r.name.endsWith('issue-3619127-vanilla-web')).env, 'issue-3619127-vanilla');
  assert.equal(rows.find((r) => r.name.endsWith('issue-3619127-vanilla-web')).issue, '3619127');
  assert.equal(rows.find((r) => r.role === 'viewer').shared, false);
  assert.equal(rows.find((r) => r.role === 'router').shared, true);
});

test('a Chrome-only project and a DB-less SQLite project are still represented', () => {
  const rows = parseDockerPs([
    'ddev-repro-x-chrome\trepro-x\t/tmp/x\tddev-repro-x',
    'ddev-repro-x-web\trepro-x\t/tmp/x\tddev-repro-x',
  ].join('\n'));
  assert.deepEqual(rows.map((r) => r.role), ['chrome', 'web']);
  assert.equal(rows.some((r) => r.role === 'db'), false);
});
