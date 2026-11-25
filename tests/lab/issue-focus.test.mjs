// Deterministic "where to focus" tests. No network, no Docker: status.json/BRANCHES.md/ARCHIVED.md fixtures in a temp lab.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { focusIssue, focusIssues, focusMarkdown, focusSummary } from '../../tools/compare/issue-focus.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'issue-focus-'));
const issue = (nid, status = {}, extras = {}) => {
  const dir = path.join(root, 'reports/issues', nid);
  fs.mkdirSync(dir, { recursive: true });
  if (status) fs.writeFileSync(path.join(dir, 'status.json'), JSON.stringify({
    nid, title: `Issue ${nid}`, statusCode: 1, status: 'Active', priority: 'Normal', changed: '2026-11-01', comments: 3,
    since: '2026-11-01', tags: ['Accessibility'], url: `https://www.drupal.org/project/drupal/issues/${nid}`, mr: null, latest: [{ text: `SECRET comment for ${nid}` }], ...status,
  }));
  for (const [name, text] of Object.entries(extras)) fs.writeFileSync(path.join(dir, name), text);
  fs.writeFileSync(path.join(dir, 'SUMMARY.md'), `# Issue ${nid}\n`);
  return dir;
};
const branches = (mr, branch, tip) => `# Branch patches\n\n| Patch | Source | Tip | Base | Base date and subject | Files |\n|---|---|---|---|---|---|\n| [\`branches/x.patch\`](branches/x.patch) | MR !${mr}, https://git.drupalcode.org/issue/drupal-x.git \`${branch}\` | ${tip} | abc | 2026-10-01 s | 3 |\n`;
const mr = (iid, sha, extra = {}) => ({ iid, state: 'opened', branch: 'branch', sha, updated: '2026-11-01', draft: false, ...extra });

// 1002 review-ready, 1001 review-retest, 1003 draft, 1004 review-no-mr,
// 1005 RTBC, 1011 needs-work-no-mr, 1006 needs-work-retest, 1007 active, 1008 closed fixed,
// 1010 unchecked, 1009 archived.
issue('1002', { status: 'Needs review', statusCode: 8, priority: 'Major', mr: mr(22, '2222222') }, { 'BRANCHES.md': branches(22, 'branch', '2222222') });
issue('1001', { status: 'Needs review', statusCode: 8, priority: 'Major', mr: mr(11, 'bbbbbbb') }, { 'BRANCHES.md': branches(11, 'branch', 'aaaaaaa') });
issue('1003', { status: 'Needs review', statusCode: 8, mr: mr(33, '3333333', { draft: true }) }, { 'BRANCHES.md': branches(33, 'branch', '3333333') });
issue('1004', { status: 'Needs review', statusCode: 8 });
issue('1005', { status: 'Reviewed & tested by the community', statusCode: 14, mr: mr(55, '5555555') }, { 'BRANCHES.md': branches(55, 'branch', '5555555') });
issue('1011', { status: 'Needs work', statusCode: 13 });
issue('1006', { status: 'Needs work', statusCode: 13, mr: mr(66, '6666666') }, { 'BRANCHES.md': branches(66, 'branch', '5555555') });
issue('1007', { status: 'Active', statusCode: 1 });
issue('1008', { status: 'Closed (fixed)', statusCode: 7 });
issue('1010', null);
issue('1009', { status: 'Closed (duplicate)', statusCode: 3 }, { 'ARCHIVED.md': '# #1009 archived (2026-11-01)\n\n- Archived: 2026-11-01\n- Reason: Closed (duplicate)\n' });
issue('1012', { status: 'Active', statusCode: 1 }, { 'ARCHIVED.md': '# #1012 archived (2026-11-01)\n\n- Archived: 2026-11-01\n- Reason: Fixed upstream\n' });

test('focus ranks needs-review first, then RTBC, needs-work, watch, close-out, unchecked, archived', () => {
  const { rows, counts } = focusIssues(root);
  assert.deepEqual(rows.map((r) => r.nid), ['1012', '1002', '1001', '1003', '1004', '1005', '1011', '1006', '1007', '1008', '1010', '1009']);
  assert.deepEqual(counts, { reopen: 1, review: 4, rtbc: 1, work: 2, watch: 1, postponed: 0, closeout: 1, unchecked: 1, archived: 1 });
  assert.equal(rows[0].flag, 'reopen');
  assert.equal(rows[0].tier, 'reopen');
  assert.match(rows[0].action, /unarchive/);
  assert.equal(rows[1].flag, 'review-ready');
  assert.equal(rows[2].flag, 'review-retest');
  assert.equal(rows[3].flag, 'review-draft');
  assert.equal(rows[6].flag, 'work-no-mr');
  assert.equal(rows[7].flag, 'work-retest');
  assert.match(rows[2].action, /node scripts\/test-mr\.mjs 1001/);
  assert.match(rows[3].action, /Draft MR !33/);
  assert.match(rows[9].action, /node scripts\/issue-archive\.mjs 1008/);
});

test('the report is actionable, links the issue and MR, and does not copy comment text', () => {
  const { rows, counts } = focusIssues(root);
  const md = focusMarkdown(rows, counts);
  assert.match(md, /^# Where to focus/m);
  assert.match(md, /## P0 · Reopened archive \(1\)/);
  assert.match(md, /## P0 · Review now — Needs review \(4\)/);
  assert.match(md, /unarchive/);
  assert.match(md, /\[#1002\]\(1002\/SUMMARY\.md\)/);
  assert.match(md, /node scripts\/test-mr\.mjs 1001/);
  assert.match(md, /Draft MR !33/);
  assert.match(md, /## P2 · Unblock \/ refresh — Needs work \(2\)/);
  assert.match(md, /node scripts\/issue-intake\.mjs fetch 1011/);
  assert.match(md, /## P5 · Close out/);
  assert.match(md, /node scripts\/issue-archive\.mjs 1008/);
  assert.match(md, /Archived: 1/);
  assert.equal(md.includes('SECRET'), false);
  assert.equal(JSON.stringify(rows).includes('SECRET'), false);
});

test('the compact summary is suitable for the Action job page and PR body', () => {
  const { rows, counts } = focusIssues(root);
  const summary = focusSummary(rows, counts);
  assert.match(summary, /^## Where to focus/m);
  assert.match(summary, /1 reopened · 4 need review · 1 RTBC · 2 need work/);
  assert.match(summary, /\| P0 \| #1002 \|/);
  assert.match(summary, /reports\/issues\/FOCUS\.md/);
  assert.equal(summary.includes('SECRET'), false);
});

test('one issue can be classified without the rest of the lab', () => {
  const r = focusIssue(root, '1001');
  assert.equal(r.tier, 'review');
  assert.equal(r.flag, 'review-retest');
  assert.equal(r.status.title, 'Issue 1001');
  assert.equal(focusIssue(root, '1010').flag, 'unchecked');
  assert.equal(focusIssue(root, '1008').tier, 'closeout');
  assert.equal(focusIssue(root, '1009').tier, 'archived');
  assert.equal(focusIssue(root, '1012').tier, 'reopen');
});

test.after(() => fs.rmSync(root, { recursive: true, force: true }));
