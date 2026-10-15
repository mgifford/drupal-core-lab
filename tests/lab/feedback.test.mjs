// Tests for scripts/feedback.mjs: feedback tied to the run and patch revision it was about, and to the run that answered it (AI-usage Phase 4).
// A throwaway issue folder with fixture runs; no DDEV, no network. Run: node --test tests/lab/feedback.test.mjs
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot } from '../../tools/compare/lib.mjs';
import { sha256 } from '../../tools/compare/patch-state.mjs';

const issueDir = path.join(labRoot, 'reports/issues/99000009'), PATCH = 'reports/issues/99000009/p.patch';
after(() => fs.rmSync(issueDir, { recursive: true, force: true }));
const w = (f, text) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); };
const fb = (...a) => spawnSync('node', [path.join(labRoot, 'scripts/feedback.mjs'), ...a], { cwd: labRoot, encoding: 'utf8' });
const read = (f) => JSON.parse(fs.readFileSync(path.join(issueDir, f), 'utf8'));
const results = (name) => path.join(issueDir, 'playwright', name, 'results.json');
const run = (name, { record = true, patch = 'patch v1\n', when = '2026-10-15T10:00:00Z' } = {}) => w(results(name), JSON.stringify({ variant: 'zz-fb-latest', issue: '99000009', when, verdict: 'reproduced-and-fixed', unexpected: 0, commits: { before: 'abc 2026-10-15', after: 'abc 2026-10-15' }, patches: [PATCH], ...(record ? { patchState: { before: { current: [] }, after: { current: [{ path: PATCH, sha256: sha256(patch) }] } } } : {}) }));

test('add records the run, its patch revision and the open action; list writes FEEDBACK.md; bad input is refused', () => {
  fs.rmSync(issueDir, { recursive: true, force: true }); w(path.join(labRoot, PATCH), 'patch v1\n');
  w(path.join(issueDir, 'variants.json'), JSON.stringify([{ slug: 'zz-fb-latest', issue: '99000009', core: { ref: 'main' }, before: { env: 'zz-fb-b' }, after: { env: 'zz-fb-a', patches: [PATCH] } }]));
  run('run-1'); run('run-unrecorded', { record: false });
  let r = fb('add', '99000009', '--run', 'run-1', '--source', 'the owner, manual check 2026-10-14', '--action', 'check aria-invalid after a failed upload', '--expected', 'the input stays aria-invalid');
  assert.equal(r.status, 0, r.stderr); assert.match(r.stdout, new RegExp(`FB-001 recorded against run-1 \\(patch revision ${sha256('patch v1\n').slice(0, 8)}; run is current\\)`));
  const item = read('feedback.json')[0]; assert.equal(item.status, 'open'); assert.equal(item.observed, null); assert.equal(item.run.revision.patches.after[0].sha256, sha256('patch v1\n')); assert.equal(item.source, 'the owner, manual check 2026-10-14');
  r = fb('add', '99000009', '--run', 'run-unrecorded', '--source', 's', '--action', 'a', '--expected', 'e'); assert.equal(r.status, 0); assert.match(r.stdout, /FB-002 recorded[\s\S]*unrecorded: the run predates recorded hashes/);
  assert.equal(fb('add', '99000009', '--run', 'no-such-run', '--source', 's', '--action', 'a', '--expected', 'e').status, 1);
  assert.equal(fb('add', '99000009', '--run', 'run-1').status, 2, 'missing --source, --action, --expected'); assert.equal(fb('nonsense', '99000009').status, 2); assert.equal(fb('list', 'abc').status, 2);
  const md = fb('list', '99000009').stdout; assert.match(md, /\| FB-001 \| the owner, manual check 2026-10-14 \| check aria-invalid after a failed upload \| the input stays aria-invalid \| `run-1` \([0-9a-f]{8}\) \|  \|  \| open \|/);
  assert.match(fs.readFileSync(path.join(issueDir, 'FEEDBACK.md'), 'utf8'), /\| FB-002 [\s\S]*`run-unrecorded` \(unrecorded\)/);
});

test('resolve records the answering run and the revised patch, and --supersede marks the older run superseded by it', () => {
  run('run-2', { when: '2026-10-15T12:00:00Z' }); w(path.join(issueDir, 'revised.patch'), 'revised tests\n');
  assert.equal(fb('resolve', '99000009', 'FB-001', '--run', 'run-2', '--outcome', 'met').status, 2, '--observed is required');
  assert.equal(fb('resolve', '99000009', 'FB-099', '--run', 'run-2', '--outcome', 'met', '--observed', 'x').status, 1);
  let r = fb('resolve', '99000009', 'FB-001', '--run', 'run-1', '--outcome', 'met', '--observed', 'x'); assert.equal(r.status, 1); assert.match(r.stderr, /must be a different run/);
  r = fb('resolve', '99000009', 'FB-001', '--run', 'run-2', '--outcome', 'met', '--observed', 'the input kept aria-invalid=true on Before and After', '--revised-patch', path.join(issueDir, 'revised.patch'), '--supersede', 'run-1', '--reason', 'run-2 has the aria-invalid check');
  assert.equal(r.status, 0, r.stderr); assert.match(r.stdout, /FB-001 resolved \(met\) by run-2; run-1 marked superseded/);
  const item = read('feedback.json')[0]; assert.equal(item.status, 'resolved'); assert.equal(item.observed, 'the input kept aria-invalid=true on Before and After'); assert.equal(item.answer.run.name, 'run-2'); assert.equal(item.answer.revisedPatches[0].sha256, sha256('revised tests\n')); assert.equal(item.answer.superseded.run, 'run-1');
  const old = JSON.parse(fs.readFileSync(results('run-1'), 'utf8')); assert.equal(old.superseded.by, 'run-2'); assert.equal(old.superseded.reason, 'run-2 has the aria-invalid check');
  assert.equal(fb('resolve', '99000009', 'FB-001', '--run', 'run-2', '--outcome', 'met', '--observed', 'again').status, 1, 'a resolved item is not resolved twice');
  assert.match(fs.readFileSync(path.join(issueDir, 'FEEDBACK.md'), 'utf8'), /FB-001[\s\S]*`run-2` \([0-9a-f]{8}; revised: revised\.patch [0-9a-f]{8}\) \| the input kept aria-invalid=true[\s\S]*resolved \(met\)/);
});

test('what automation cannot decide stays open; an unrecorded run may answer, with a note; a stale run may not', () => {
  let r = fb('resolve', '99000009', 'FB-002', '--run', 'run-2', '--outcome', 'needs-person', '--observed', 'the announcement fired twice in the synthetic reader; whether a person hears it twice is not known');
  assert.equal(r.status, 0, r.stderr + r.stdout); assert.equal(read('feedback.json')[1].status, 'needs-person'); assert.match(r.stdout, /needs-person/);
  run('run-unrecorded-2', { record: false, when: '2026-10-15T13:00:00Z' });
  r = fb('resolve', '99000009', 'FB-002', '--run', 'run-unrecorded-2', '--outcome', 'not-met', '--observed', 'a second run with no recorded hashes'); assert.equal(r.status, 0, r.stderr); assert.match(r.stdout, /note: the answering run recorded no hashes/); assert.equal(read('feedback.json')[1].status, 'resolved');
  w(path.join(labRoot, PATCH), 'patch v2\n');   // the patch changes: run-2 is now about an older patch
  fb('add', '99000009', '--run', 'run-2', '--source', 's', '--action', 'again', '--expected', 'e');
  r = fb('resolve', '99000009', 'FB-003', '--run', 'run-2', '--outcome', 'met', '--observed', 'x'); assert.equal(r.status, 1); assert.match(r.stderr, /run-2 is stale \(after patch reports\/issues\/99000009\/p\.patch changed since the run/);
});
