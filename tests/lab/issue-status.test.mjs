// Status snapshots written by different generations of issue-status.mjs: validate the shape, normalize the legacy MR URL,
// and never turn missing comment metadata into NaN.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { normalizeStatus, validateStatus, readStatus } from '../../tools/compare/issue-status.mjs';
import { changes, saveStatus } from '../../tools/compare/issue-tracking.mjs';
import { issueMeta } from '../../tools/compare/lib.mjs';

const base = { nid: '3603162', title: 'Consolidate and cleanup media', url: 'https://www.drupal.org/project/drupal/issues/3603162', status: 'Needs review', statusCode: 8 };

test('a legacy MR URL becomes an object without discarding the URL', () => {
  const s = normalizeStatus({ ...base, mr: 'https://git.drupalcode.org/project/drupal/-/merge_requests/17967' });
  assert.equal(s.schemaVersion, 1);
  assert.equal(s.mr.iid, 17967);
  assert.equal(s.mr.state, null);
  assert.equal(s.mr.url, 'https://git.drupalcode.org/project/drupal/-/merge_requests/17967');
  assert.equal(validateStatus(s).ok, true);
});

test('missing comments and dates stay null instead of becoming NaN or invalid values', () => {
  const s = normalizeStatus({ ...base, comments: undefined, changed: undefined, since: undefined });
  assert.equal(s.comments, null);
  assert.equal(validateStatus(s).ok, true);
});

test('a complete modern snapshot validates and keeps multiple MRs', () => {
  const s = normalizeStatus({
    ...base, since: '2026-11-25', changed: '2026-11-25', comments: 9, tags: ['Accessibility'],
    mr: { iid: 18007, state: 'opened', branch: 'work', sha: '50833b75', updated: '2026-11-28', draft: false },
    otherMrs: [{ iid: 16166, state: 'closed', branch: 'old', sha: 'abc12345', updated: '2026-10-01', draft: false }],
  });
  assert.equal(validateStatus(s).ok, true);
  assert.equal(s.otherMrs.length, 1);
  assert.equal(s.otherMrs[0].iid, 16166);
});

test('an incomplete MR object is valid data but reports incomplete upstream metadata', () => {
  const s = normalizeStatus({ ...base, mr: { iid: 18007 } });
  assert.equal(validateStatus(s).ok, true);
  assert.equal(s.mr.sha, null);
});

test('a missing title is an actionable validation error', () => {
  const r = validateStatus({ ...base, title: '' });
  assert.equal(r.ok, false);
  assert.match(r.errors.map((e) => `${e.path} ${e.message}`).join(' '), /title/);
});

test('changes() reports a recorded comment count without NaN', () => {
  const prev = normalizeStatus({ ...base, comments: null });
  const next = normalizeStatus({ ...base, comments: 12 });
  assert.deepEqual(changes(next, prev), ['12 comment(s) recorded']);
  assert.equal(changes(normalizeStatus({ ...base, comments: 12 }), normalizeStatus({ ...base, comments: 12 })).some((x) => x.includes('NaN')), false);
});

test('saveStatus refuses malformed data instead of crashing the whole index', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'issue-status-'));
  try {
    assert.throws(() => saveStatus(dir, { ...base, title: '' }, {}), /refusing to write invalid status\.json/);
    const ok = normalizeStatus({ ...base, since: '2026-11-27', comments: 1 });
    saveStatus(dir, ok, {});
    assert.equal(readStatus(dir).schemaVersion, 1);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('issueMeta accepts a legacy status file and does not expose comment text', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'issue-meta-'));
  const dir = path.join(root, 'reports/issues/3603162');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'status.json'), JSON.stringify({ ...base, mr: 'https://git.drupalcode.org/project/drupal/-/merge_requests/17967', latest: [{ text: 'SECRET' }] }));
  try {
    const m = issueMeta({ issue: '3603162' }, { root });
    assert.equal(m.mr.sha, null);
    assert.equal('latest' in m, false);
    assert.equal(JSON.stringify(m).includes('SECRET'), false);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
