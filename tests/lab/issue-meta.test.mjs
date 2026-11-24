// The viewer's public issue snapshot: only status metadata, never comment text or local paths.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { issueMeta } from '../../tools/compare/lib.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'issue-meta-'));
const write = (nid, value) => {
  const dir = path.join(root, 'reports/issues', nid);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'status.json'), typeof value === 'string' ? value : JSON.stringify(value));
};

test('issueMeta exposes the public status fields and never comment text', () => {
  write('99000001', {
    status: 'Needs review', statusCode: 8, priority: 'Major', category: 'Bug report', changed: '2026-11-20',
    comments: 12, title: 'A public issue title', since: '2026-10-01', tags: ['Accessibility'],
    latest: [{ n: 12, by: 'someone', on: '2026-11-20', text: 'SECRET COMMENT BODY' }],
    mr: { iid: 12, state: 'opened', sha: 'abc12345', draft: false, branch: 'private-branch' },
  });
  const m = issueMeta({ issue: '99000001' }, { root });
  assert.equal(m.status, 'Needs review');
  assert.equal(m.status_code, 8);
  assert.equal(m.priority, 'Major');
  assert.equal(m.title, 'A public issue title');
  assert.deepEqual(m.tags, ['Accessibility']);
  assert.equal(m.mr.state, 'opened');
  assert.equal(m.mr.sha, 'abc12345');
  assert.equal('latest' in m, false);
  assert.equal('branch' in m.mr, false);
  assert.equal(JSON.stringify(m).includes('SECRET'), false);
  assert.equal(JSON.stringify(m).includes('private-branch'), false);
});

test('issueMeta is null for a lab-only variant, a missing file or invalid JSON', () => {
  assert.equal(issueMeta({ slug: 'lab-only' }, { root }), null);
  assert.equal(issueMeta({ issue: '99000002' }, { root }), null);
  write('99000003', '{not json');
  assert.equal(issueMeta({ issue: '99000003' }, { root }), null);
  fs.rmSync(root, { recursive: true, force: true });
});
