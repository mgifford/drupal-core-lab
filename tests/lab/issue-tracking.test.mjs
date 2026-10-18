// Tests for issue tracking and archiving (tools/compare/issue-tracking.mjs, scripts/issue-status.mjs, scripts/issue-archive.mjs,
// scripts/index-issues.mjs), retired variants (tools/compare/lib.mjs) and the "already in core" patch message
// (tools/compare/patch-state.mjs). No network: drupal.org and GitLab answers come from a stub. Temp folders only.
//   node --test tests/lab/issue-tracking.test.mjs
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot, variants, resolveVariants, resolveVariant } from '../../tools/compare/lib.mjs';
import { ensurePatches } from '../../tools/compare/patch-state.mjs';
import { fetchStatus, changes, retestReason, nextStep, saveStatus, readStatus, readArchived, archivedMarkdown, markRetired, buildIndex, reasonFromStatus } from '../../tools/compare/issue-tracking.mjs';

const tmp = (name) => { const d = fs.mkdtempSync(path.join(os.tmpdir(), `${name}-`)); after(() => fs.rmSync(d, { recursive: true, force: true })); return d; };
const branchesMd = (branch, tip) => `# Branch patches\n\n| Patch | Source | Tip | Base | Base date and subject | Files |\n|---|---|---|---|---|---|\n| [\`branches/x.patch\`](branches/x.patch) | MR !1, https://git.drupalcode.org/issue/drupal-1.git \`${branch}\` | ${tip} | abc | 2026-10-17 s | 3 |\n`;
const fakeLab = () => { const root = tmp('lab'); fs.mkdirSync(path.join(root, 'reports/issues'), { recursive: true }); return root; };
const addIssue = (root, nid, files = {}) => { const d = path.join(root, 'reports/issues', nid); fs.mkdirSync(d, { recursive: true }); for (const [f, t] of Object.entries(files)) fs.writeFileSync(path.join(d, f), t); return d; };

// drupal.org and GitLab as the stub sees them: two pages of comments, a tag, an issue fork with a recorded branch that has no number in
// its name, and a same-named branch's MR from ANOTHER fork that must be ignored.
function stub({ status = 13, sha = '175e6f17aaaa' } = {}) {
  const calls = [];
  const answers = {
    'https://www.drupal.org/api-d7/node/3619154.json': { type: 'project_issue', title: 'Sidebar toggle fixes', field_issue_status: String(status), field_issue_priority: '200', field_issue_category: '1', field_issue_component: 'Admin theme', field_issue_version: 'main', changed: '1792300000', taxonomy_vocabulary_9: [{ id: '42' }] },
    'https://www.drupal.org/api-d7/comment.json?node=3619154&limit=50&page=0': { list: Array.from({ length: 50 }, (_, i) => ({ cid: String(i + 1), name: 'a', created: '1792200000', comment_body: { value: `<p>c${i + 1}</p>` } })) },
    'https://www.drupal.org/api-d7/comment.json?node=3619154&limit=50&page=1': { list: [{ cid: '51', name: 'b', created: '1792300000', comment_body: { value: '<p>last</p>' } }] },
    'https://www.drupal.org/api-d7/taxonomy_term/42.json': { name: 'Accessibility' },
    'https://git.drupalcode.org/api/v4/projects/issue%2Fdrupal-3619154': { id: 777 },
    'https://git.drupalcode.org/api/v4/projects/777/repository/branches?search=3619154&per_page=100': [],
    'https://git.drupalcode.org/api/v4/projects/project%2Fdrupal/merge_requests?source_branch=sidebar-toggle-fixes&scope=all&state=all': [
      { iid: 16911, state: 'opened', source_branch: 'sidebar-toggle-fixes', sha, updated_at: '2026-10-17T10:00:00Z', source_project_id: 777 },
      { iid: 99, state: 'opened', source_branch: 'sidebar-toggle-fixes', sha: 'deadbeef', updated_at: '2026-10-18T10:00:00Z', source_project_id: 555 },
    ],
  };
  return { calls, getJson: async (url) => { calls.push(url); if (!(url in answers)) throw new Error(`unexpected ${url}`); return answers[url]; } };
}

test('fetchStatus: status, all comment pages, tags asked for once, and only merge requests from the issue\'s own fork', async () => {
  const root = fakeLab(); addIssue(root, '3619154', { 'BRANCHES.md': branchesMd('sidebar-toggle-fixes', '175e6f17') });
  const terms = new Map(), net = stub();
  const s = await fetchStatus('3619154', { getJson: net.getJson, labRoot: root, today: '2026-10-19', terms });
  assert.equal(s.status, 'Needs work'); assert.equal(s.statusCode, 13); assert.equal(s.comments, 51); assert.deepEqual(s.tags, ['Accessibility']);
  assert.equal(s.mr.iid, 16911, 'the MR from another fork with the same branch name is left out'); assert.equal(s.otherMrs.length, 0);
  assert.equal(s.mr.sha, '175e6f17'); assert.equal(s.since, '2026-10-19'); assert.equal(s.latest.at(-1).text, 'last');
  await fetchStatus('3619154', { getJson: net.getJson, labRoot: root, today: '2026-10-19', terms });
  assert.equal(net.calls.filter((u) => u.includes('taxonomy_term')).length, 1, 'a tag name is asked for once per run');
  assert.equal((await fetchStatus('3619154', { getJson: stub({ status: 17 }).getJson, labRoot: root, terms })).status, 'Closed (outdated)');
});

test('changes, retestReason and nextStep: what changed, whether to re-test, and where an issue goes in the list', () => {
  const base = { status: 'Needs review', statusCode: 8, comments: 10, title: 't', priority: 'Normal', tags: ['A'], mr: { iid: 1, state: 'opened', branch: 'b', sha: '175e6f17' } };
  assert.deepEqual(changes(base, null), []);
  assert.deepEqual(changes(base, { ...base }), []);
  assert.deepEqual(changes({ ...base, status: 'Needs work', comments: 12, mr: { ...base.mr, sha: 'aaaa1111' } }, base), ['status Needs review → Needs work', '2 new comment(s)', 'MR head 175e6f17 → aaaa1111']);
  assert.deepEqual(changes({ ...base, mr: { ...base.mr, state: 'merged' } }, base), ['MR opened → merged']);
  const rec = { branch: 'b', tip: '175e6f17' };
  assert.equal(retestReason(base.mr, rec), '');
  assert.equal(retestReason(base.mr, { branch: 'b', tip: '175e6f17c0ffee' }), '', 'a longer recorded tip matches its prefix');
  assert.match(retestReason({ ...base.mr, sha: 'aaaa1111' }, rec), /MR !1 is at aaaa1111; the lab tested 175e6f17/);
  assert.match(retestReason({ ...base.mr, branch: 'other' }, rec), /on branch other; the lab tested b/);
  const step = (s, r = rec, archived = null) => nextStep({ nid: '1', status: s, rec: r, archived });
  assert.equal(step(null).group, 'unchecked');
  assert.deepEqual(step(base, rec, { date: '2026-10-20', reason: 'Fixed upstream' }), { group: 'archived', text: 'Archived 2026-10-20: Fixed upstream' });
  assert.match(step({ ...base, status: 'Closed (fixed)', statusCode: 7 }).text, /^Closed \(fixed\) upstream: confirm on core main, then archive \(node scripts\/issue-archive\.mjs 1\)/);
  assert.match(step({ ...base, status: 'Closed (duplicate)', statusCode: 3 }).text, /^Closed \(duplicate\): archive/);
  assert.match(step({ ...base, mr: { ...base.mr, state: 'merged' } }).text, /MR !1 is merged/);
  assert.deepEqual(step({ ...base, mr: { ...base.mr, sha: 'aaaa1111' } }).group, 'attention');
  assert.match(step({ ...base, status: 'Reviewed & tested by the community', statusCode: 14 }).text, /^RTBC/);
  assert.deepEqual(step({ ...base, status: 'Needs work', statusCode: 13 }), { group: 'waiting', text: 'Needs work: waiting on the MR' });
  assert.match(step(base).text, /the lab has tested the current MR head/);
  assert.match(step(base, null).text, /no MR patch recorded/);
  assert.equal(reasonFromStatus(7), 'fixed'); assert.equal(reasonFromStatus(17), 'outdated'); assert.equal(reasonFromStatus(13), '');
});

test('saveStatus: the first check writes status.json only; no change writes nothing; a change also writes STATUS-<date>.md', () => {
  const dir = addIssue(fakeLab(), '1');
  const s = { nid: '1', since: '2026-10-19', title: 't', url: 'u', status: 'Needs review', statusCode: 8, priority: 'Normal', category: 'Bug report', component: 'c', version: 'main', tags: [], changed: '2026-10-18', comments: 3, latest: [], mr: null, otherMrs: [] };
  assert.deepEqual(saveStatus(dir, s).wrote, ['status.json']);
  assert.deepEqual(fs.readdirSync(dir), ['status.json']);
  assert.deepEqual(saveStatus(dir, { ...s, since: '2026-10-26' }).wrote, [], 'nothing new: no file is touched');
  assert.equal(readStatus(dir).since, '2026-10-19', 'since keeps the date the state was first seen');
  const moved = { ...s, since: '2026-11-02', status: 'Needs work', statusCode: 13 };
  assert.deepEqual(saveStatus(dir, moved).wrote, ['status.json', 'STATUS-2026-11-02.md']);
  assert.match(fs.readFileSync(path.join(dir, 'STATUS-2026-11-02.md'), 'utf8'), /Since the last check: status Needs review → Needs work/);
  fs.writeFileSync(path.join(dir, 'STATUS-2026-11-09.md'), 'hand-written');
  assert.deepEqual(saveStatus(dir, { ...moved, since: '2026-11-09', comments: 4 }).wrote, ['status.json'], 'an existing note for that date is kept');
  assert.equal(fs.readFileSync(path.join(dir, 'STATUS-2026-11-09.md'), 'utf8'), 'hand-written');
});

test('ARCHIVED.md round trip, and markRetired changes nothing but the one variant', () => {
  const dir = addIssue(fakeLab(), '1');
  fs.writeFileSync(path.join(dir, 'ARCHIVED.md'), archivedMarkdown({ nid: '1', title: 'T', date: '2026-10-20', reason: 'Fixed upstream', status: null, commit: 'abc1234', duplicateOf: '', retired: ['1-latest'], kept: ['1-pinned'], note: '' }));
  assert.deepEqual(readArchived(dir), { date: '2026-10-20', reason: 'Fixed upstream' });
  assert.equal(readArchived(addIssue(fakeLab(), '2')), null);
  const text = '[\n  { "slug": "1-pinned", "issue": "1", "core": { "commit": "abc" } },\n  {"slug":"1-latest","extends":"1-pinned"}\n]\n';
  const out = markRetired(text, '1-latest', '2026-10-20: archived');
  assert.equal(out, text.replace('"slug":"1-latest"', '"slug":"1-latest", "retired": "2026-10-20: archived"'));
  const lines = '[\n  {\n    "slug": "1-latest",\n    "issue": "1"\n  }\n]\n';
  assert.equal(markRetired(lines, '1-latest', 'r'), '[\n  {\n    "slug": "1-latest",\n    "retired": "r",\n    "issue": "1"\n  }\n]\n', 'on its own line, indented like the slug');
  assert.throws(() => markRetired(text, '1-gone', 'x'), /found it 0 times/);
  assert.throws(() => markRetired(text + text.replace(/^\[|\]\n$/g, ''), '1-latest', 'x'), /found it 2 times|JSON/);
});

test('retired variants: not inherited, passed over for an issue number, and an all-retired issue says so', () => {
  const raw = [
    { slug: '9-latest', issue: '9', core: { ref: 'main', commit: null }, retired: '2026-10-20: archived' },
    { slug: '9-pinned', issue: '9', extends: '9-latest', core: { commit: 'abc' } },
  ];
  const all = resolveVariants(raw);
  assert.equal(all.find((v) => v.slug === '9-pinned').retired, undefined, 'the pinned variant extends the retired one but still builds');
  assert.equal(resolveVariant('9', all).v.slug, '9-pinned');
  assert.equal(resolveVariant('9-latest', all).v.retired, '2026-10-20: archived', 'a slug still resolves; setup.mjs refuses it');
  assert.match(resolveVariant('9', resolveVariants([raw[0]])).error, /Every variant of issue 9 is retired/);
});

test('buildIndex: issues grouped by next step, from files in the lab only', () => {
  const root = fakeLab();
  const st = (o) => JSON.stringify({ nid: '1', since: '2026-10-19', title: 'T', status: 'Needs work', statusCode: 13, changed: '2026-10-18', comments: 1, tags: [], mr: { iid: 5, state: 'opened', branch: 'b', sha: '175e6f17' }, otherMrs: [], latest: [], ...o });
  addIssue(root, '1000001', { 'status.json': st({ title: 'Waiting | with a pipe' }), 'BRANCHES.md': branchesMd('b', '175e6f17'), 'REPRODUCE.md': '# Reproduce #1000001: x\n' });
  addIssue(root, '1000002', { 'status.json': st({ mr: { iid: 5, state: 'opened', branch: 'b', sha: 'aaaa1111' } }), 'BRANCHES.md': branchesMd('b', '175e6f17') });
  addIssue(root, '1000003', { 'SUMMARY.md': '# Not checked\n' });
  addIssue(root, '1000004', { 'status.json': st({ status: 'Closed (fixed)', statusCode: 7 }), 'ARCHIVED.md': archivedMarkdown({ nid: '1000004', date: '2026-10-20', reason: 'Fixed upstream', retired: [], kept: [] }) });
  const { md, counts } = buildIndex(root);
  assert.deepEqual(counts, { attention: 1, waiting: 1, unchecked: 1, archived: 1 });
  assert.match(md, /## Needs attention \(1\)[\s\S]*\[1000002\]\(1000002\/\)[^\n]*Re-test: MR !5 is at aaaa1111; the lab tested 175e6f17/);
  assert.match(md, /## Waiting \(1\)[\s\S]*Waiting \\\| with a pipe \| Needs work, updated 2026-10-18 \| !5 opened at `175e6f17` \| `175e6f17` \(\[how\]\(1000001\/REPRODUCE\.md\)\) \| Needs work: waiting on the MR \|/);
  assert.match(md, /## Not checked yet \(1\)[\s\S]*\| \[1000003\]\(1000003\/SUMMARY\.md\) \| Not checked \| no MR patch \|/);
  assert.match(md, /## Archived \(1\)[\s\S]*\| \[1000004\]\(1000004\/\) \| T \| 2026-10-20 \| Fixed upstream \|/);
});

test('a patch that applies in reverse is reported as already in core, not as needing a reroll', () => {
  const root = tmp('in-core'), dir = path.join(root, 'env'), lab = path.join(root, 'lab');
  const git = (cwd, ...a) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd, encoding: 'utf8' });
  fs.mkdirSync(path.join(dir, 'core'), { recursive: true }); fs.mkdirSync(path.join(lab, 'reports/issues/1234567/branches'), { recursive: true });
  git(dir, 'init', '-q', '-b', 'main'); fs.writeFileSync(path.join(dir, 'core/a.txt'), 'one\nFIXED\nthree\n');   // core already has the change
  git(dir, 'add', '.'); git(dir, 'commit', '-q', '-m', 'base');
  const p = 'reports/issues/1234567/branches/mr.patch';
  fs.writeFileSync(path.join(lab, p), 'diff --git a/core/a.txt b/core/a.txt\n--- a/core/a.txt\n+++ b/core/a.txt\n@@ -1,3 +1,3 @@\n one\n-two\n+FIXED\n three\n');
  const r = ensurePatches({ dir, labRoot: lab, patchPaths: [p], slug: 'x', env: 'x-env', side: 'after' });
  assert.equal(r.status, 'failed'); assert.match(r.lines.join('\n'), /already in this core commit .*node scripts\/issue-archive\.mjs 1234567/);
  fs.writeFileSync(path.join(lab, p), 'diff --git a/core/a.txt b/core/a.txt\n--- a/core/a.txt\n+++ b/core/a.txt\n@@ -1,3 +1,3 @@\n one\n-zzz\n+yyy\n three\n');
  const other = ensurePatches({ dir, labRoot: lab, patchPaths: [p], slug: 'x', env: 'x-env', side: 'after' });
  assert.equal(other.status, 'failed'); assert.doesNotMatch(other.lines.join('\n'), /already in this core commit/);
});

test('issue-archive.mjs: usage, a refusal without a reason, and a dry run that changes nothing', (t) => {
  const cli = (...a) => spawnSync(process.execPath, [path.join(labRoot, 'scripts/issue-archive.mjs'), ...a], { cwd: labRoot, encoding: 'utf8' });
  assert.equal(cli().status, 2);
  // An issue not archived yet, with a variant that follows core main and one pinned to a commit, chosen from the registry so the test
  // does not depend on one issue staying active.
  const all = variants(), follows = (v) => !v.retired && !(v.core && v.core.commit);
  const nid = [...new Set(all.map((v) => String(v.issue)))].find((n) => !fs.existsSync(path.join(labRoot, 'reports/issues', n, 'ARCHIVED.md'))
    && all.some((v) => String(v.issue) === n && follows(v)) && all.some((v) => String(v.issue) === n && v.core && v.core.commit && !v.retired));
  if (!nid) { t.skip('no active issue has both a branch-following and a pinned variant'); return; }
  const latest = all.find((v) => String(v.issue) === nid && follows(v)).slug;
  const before = spawnSync('git', ['status', '--porcelain'], { cwd: labRoot, encoding: 'utf8' }).stdout;
  const dry = cli(nid, '--reason', 'fixed', '--dry-run');
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(dry.stdout, new RegExp(`would retire ${latest} \\(follows core `));
  assert.match(dry.stdout, /keeps .*\(pinned to a core commit; still builds\)/);
  assert.match(cli(nid, '--reason', 'nonsense', '--dry-run').stderr, /--reason <fixed\|duplicate/);
  assert.match(cli(nid, '--reason', 'fixed', '--commit', 'zz', '--dry-run').stderr, /not a commit hash/);
  assert.equal(spawnSync('git', ['status', '--porcelain'], { cwd: labRoot, encoding: 'utf8' }).stdout, before, 'a dry run leaves the checkout as it was');
});
