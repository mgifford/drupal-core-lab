// Tests for tools/compare/run-record.mjs and its use in scripts/coverage.mjs: is a recorded run still about what the variant says now?
// (AI-usage slice F.) Fixture runs; no network, no DDEV. Run: node --test tests/lab/run-record.test.mjs
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot } from '../../tools/compare/lib.mjs';
import { runStaleness } from '../../tools/compare/run-record.mjs';
import { sha256 } from '../../tools/compare/patch-state.mjs';
import { dirHash } from '../../tools/compare/env-state.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'run-record-test-'));
const issueDir = path.join(labRoot, 'reports/issues/99000008');
after(() => { fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(issueDir, { recursive: true, force: true }); });
const w = (f, text) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); };

// A lab with one core patch, one contrib patch and a recipe, and a run record as lab-run.mjs writes it.
function lab() {
  const L = fs.mkdtempSync(path.join(root, 'lab')); w(path.join(L, 'p/core.patch'), 'core v1\n'); w(path.join(L, 'p/contrib.patch'), 'contrib v1\n'); w(path.join(L, 'recipes/rcp/recipe.yml'), 'name: rcp\n');
  const variant = (extra = {}) => ({ slug: 'zz-latest', core: { ref: 'main' }, recipe: 'rcp', contrib: [{ name: 'zmod', url: 'u', commit: 'c'.repeat(40) }], before: { env: 'b' }, after: { env: 'a', patches: ['p/core.patch'], contribPatches: [{ module: 'zmod', patch: 'p/contrib.patch' }] }, ...extra });
  const h = (p) => sha256(fs.readFileSync(path.join(L, p)));
  const results = (extra = {}) => ({ variant: 'zz-latest', when: '2026-10-15T10:00:00Z',
    patchState: { before: { current: [], contrib: {} }, after: { current: [{ path: 'p/core.patch', sha256: h('p/core.patch') }], contrib: { zmod: { patches: [{ path: 'p/contrib.patch', sha256: h('p/contrib.patch') }] } } } },
    identity: { pin: null, recipe: { name: 'rcp', current: dirHash(path.join(L, 'recipes/rcp')) }, base: {} }, ...extra });
  return { L, variant, results, st: (r, v, opt = {}) => runStaleness(r, v, { labRoot: L, lastChange: () => '', ...opt }) };
}

test('a run that recorded its patch hashes, contrib patch hashes and recipe, all unchanged, is current', () => {
  const f = lab(), s = f.st(f.results(), f.variant());
  assert.equal(s.status, 'current'); assert.deepEqual(s.reasons, []); assert.deepEqual(s.checked.sort(), ['after contrib patches', 'after patches', 'before contrib patches', 'before patches', 'recipe'].sort());
});

test('a core patch whose bytes changed under the same name makes the run stale, naming the patch and both hashes', () => {
  const f = lab(), r = f.results(); w(path.join(f.L, 'p/core.patch'), 'core v2\n');
  const s = f.st(r, f.variant()); assert.equal(s.status, 'stale'); assert.match(s.reasons.join('\n'), /^after patch p\/core\.patch changed since the run \(run [0-9a-f]{8}, now [0-9a-f]{8}\)$/m);
});

test('a patch added to or removed from the variant makes the run stale', () => {
  const f = lab(), r = f.results(); w(path.join(f.L, 'p/more.patch'), 'x\n');
  let s = f.st(r, f.variant({ after: { env: 'a', patches: ['p/core.patch', 'p/more.patch'], contribPatches: [{ module: 'zmod', patch: 'p/contrib.patch' }] } })); assert.equal(s.status, 'stale'); assert.match(s.reasons.join('\n'), /after patch p\/more\.patch is used now and was not used by the run/);
  s = f.st(r, f.variant({ after: { env: 'a', patches: [], contribPatches: [{ module: 'zmod', patch: 'p/contrib.patch' }] } })); assert.equal(s.status, 'stale'); assert.match(s.reasons.join('\n'), /after patch p\/core\.patch was used by the run and the variant no longer lists it/);
});

test('a changed contrib patch, a changed contrib pin, a changed recipe and a changed pinned commit each make it stale', () => {
  const f = lab(), r = f.results();
  w(path.join(f.L, 'p/contrib.patch'), 'contrib v2\n'); assert.match(f.st(r, f.variant()).reasons.join('\n'), /after contrib patch \(zmod\) p\/contrib\.patch changed since the run/);
  w(path.join(f.L, 'p/contrib.patch'), 'contrib v1\n'); assert.equal(f.st(r, f.variant()).status, 'current');
  w(path.join(f.L, 'recipes/rcp/recipe.yml'), 'name: rcp\nweight: 10\n'); const sr = f.st(r, f.variant()); assert.equal(sr.status, 'stale'); assert.match(sr.reasons.join('\n'), /^recipes\/rcp changed since the run \(run [0-9a-f]{8}, now [0-9a-f]{8}\)$/m);
  w(path.join(f.L, 'recipes/rcp/recipe.yml'), 'name: rcp\n'); assert.equal(f.st(r, f.variant()).status, 'current');
  const pinned = f.results({ identity: { pin: 'a'.repeat(40), recipe: { name: 'rcp', current: dirHash(path.join(f.L, 'recipes/rcp')) }, base: {} } });
  assert.equal(f.st(pinned, f.variant({ core: { commit: 'a'.repeat(40) } })).status, 'current'); assert.match(f.st(pinned, f.variant({ core: { commit: 'b'.repeat(40) } })).reasons.join('\n'), /the variant pins bbbbbbbb now, the run was on aaaaaaaa/);
  const oldContrib = f.results({ contrib: [{ name: 'zmod', url: 'u', commit: 'd'.repeat(40) }] }); assert.match(f.st(oldContrib, f.variant()).reasons.join('\n'), /contrib module zmod is pinned at cccccccc now, the run used dddddddd/);
});

test('an older run that recorded no hashes is unrecorded: never current, never stale; a hint says when git shows a patch file changed after it', () => {
  const f = lab(), old = { variant: 'zz-latest', when: '2026-10-01T10:00:00Z', patches: ['p/core.patch'], commits: { after: 'abc 2026-10-01' } };
  let s = f.st(old, f.variant()); assert.equal(s.status, 'unrecorded'); assert.deepEqual(s.reasons, []); assert.deepEqual(s.hints, []); assert.match(s.notes.join(), /recipe not recorded/);
  s = f.st(old, f.variant(), { lastChange: (p) => (p === 'p/core.patch' ? '2026-10-14T09:00:00+02:00' : '') }); assert.equal(s.status, 'unrecorded'); assert.match(s.hints[0], /p\/core\.patch was committed 2026-10-14, after this run \(2026-10-01\)/);
  s = f.st(old, f.variant(), { lastChange: () => '2026-09-01T09:00:00+02:00' }); assert.deepEqual(s.hints, [], 'a patch committed before the run gives no hint');
  assert.equal(f.st(old, undefined).status, 'unrecorded'); assert.match(f.st(old, undefined).notes[0], /not in this checkout/);
  assert.equal(f.st(old, f.variant({ core: { commit: 'a'.repeat(40) } }), {}).status, 'unrecorded');
  const oldPin = { ...old, core: { commit: 'e'.repeat(40) } }; assert.equal(f.st(oldPin, f.variant({ core: { commit: 'a'.repeat(40) } })).status, 'stale', 'a pin the older record does hold can still show it stale');
});

test('a run that recorded the patches but not everything says what it did not record', () => {
  const f = lab(), r = f.results(); delete r.identity; delete r.patchState.after.contrib;
  const s = f.st(r, f.variant()); assert.equal(s.status, 'current'); assert.match(s.notes.join(), /recipe not recorded/); assert.match(s.notes.join(), /after contrib patches not recorded/);
});

// coverage.mjs end to end on a throwaway issue folder
test('coverage.mjs: a stale run is listed and not counted (its row is a gap), a current run is counted and marked, an unrecorded run is counted and never called current', () => {
  fs.rmSync(issueDir, { recursive: true, force: true }); fs.mkdirSync(issueDir, { recursive: true });
  const PATCH = 'reports/issues/99000008/p.patch'; w(path.join(labRoot, PATCH), 'patch v1\n');
  fs.writeFileSync(path.join(issueDir, 'variants.json'), JSON.stringify([{ slug: 'zz-cov-pinned', issue: '99000008', core: { commit: 'a'.repeat(40) }, before: { env: 'zz-cov-b' }, after: { env: 'zz-cov-a', patches: [PATCH] }, coverage: { matrix: [{ browser: 'chromium', scheme: 'light', forced: false, width: 480 }, { browser: 'chromium', scheme: 'dark', forced: false, width: 480 }] } }]));
  const run = (name, extra) => w(path.join(issueDir, 'playwright', name, 'results.json'), JSON.stringify({ variant: 'zz-cov-pinned', issue: '99000008', when: '2026-10-15T10:00:00Z', environment: { browser: 'chromium', colorScheme: name.includes('dark') ? 'dark' : 'light', forcedColors: false, viewport: { width: 480 } }, verdict: 'reproduced-and-fixed', unexpected: 0, commits: { after: 'abc1234 2026-10-15' }, sides: { before: { pages: [{ theme: 'default_admin' }] } }, ...extra }));
  const rec = { patchState: { before: { current: [] }, after: { current: [{ path: PATCH, sha256: sha256('patch v1\n') }] } } };
  run('2026-10-15T10-00-00-chromium-light', rec); run('2026-10-15T10-05-00-chromium-dark', { patches: [PATCH] });   // the second recorded no hashes
  const cov = () => { const r = spawnSync('node', [path.join(labRoot, 'scripts/coverage.mjs'), '99000008'], { cwd: labRoot, encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr); return { out: r.stdout, md: fs.readFileSync(path.join(issueDir, 'COVERAGE.md'), 'utf8') }; };
  let c = cov(); assert.match(c.md, /chromium · light · 480px wide \| ✓ reproduced and fixed \(theme default_admin\) \(record: current\)/); assert.match(c.md, /chromium · dark · 480px wide \| ✓ reproduced and fixed \(theme default_admin\) \(record: none, not checked against the current patches/);
  assert.match(c.out, /runs: 1 current, 1 unrecorded, 0 stale/); assert.doesNotMatch(c.md, /Stale runs/);
  w(path.join(labRoot, PATCH), 'patch v2\n');   // the patch changes: the recorded run is now about an older patch
  c = cov(); assert.match(c.out, /runs: 0 current, 1 unrecorded, 1 stale/);
  assert.match(c.md, /chromium · light · 480px wide \| \*\*NOT TESTED against the current patches\*\* \(1 stale run, see below\)/); assert.match(c.md, /Stale runs \(kept, not counted[^)]*\)[^`]*`2026-10-15T10-00-00-chromium-light` \(after patch reports\/issues\/99000008\/p\.patch changed since the run/);
  assert.match(c.md, /Gaps: 1 automated environment[\s\S]*chromium · light · 480px wide \(only stale runs\)/);
  assert.doesNotMatch(c.md, /record: current/);
});

// a run outside the issue's matrix is listed under "Other runs" and carries the same record mark as a matrix row
test('coverage.mjs: a run outside the matrix is listed under Other runs with its record mark', () => {
  fs.rmSync(issueDir, { recursive: true, force: true }); fs.mkdirSync(issueDir, { recursive: true });
  const PATCH = 'reports/issues/99000008/p.patch'; w(path.join(labRoot, PATCH), 'patch v1\n');
  fs.writeFileSync(path.join(issueDir, 'variants.json'), JSON.stringify([{ slug: 'zz-cov-pinned', issue: '99000008', core: { commit: 'a'.repeat(40) }, before: { env: 'zz-cov-b' }, after: { env: 'zz-cov-a', patches: [PATCH] }, coverage: { matrix: [{ browser: 'chromium', scheme: 'light', forced: false, width: 480 }] } }]));
  const res = (width, extra) => ({ variant: 'zz-cov-pinned', issue: '99000008', when: '2026-10-15T10:00:00Z', environment: { browser: 'chromium', colorScheme: 'light', forcedColors: false, viewport: { width } }, verdict: 'reproduced-and-fixed', unexpected: 0, commits: { after: 'abc1234 2026-10-15' }, sides: { before: { pages: [{ theme: 'default_admin' }] } }, ...extra });
  w(path.join(issueDir, 'playwright', '2026-10-15T10-00-00-wide', 'results.json'), JSON.stringify(res(1280, { patchState: { before: { current: [] }, after: { current: [{ path: PATCH, sha256: sha256('patch v1\n') }] } } })));
  w(path.join(issueDir, 'playwright', '2026-10-15T10-01-00-wide-old', 'results.json'), JSON.stringify(res(1024, { patches: [PATCH] })));
  const r = spawnSync('node', [path.join(labRoot, 'scripts/coverage.mjs'), '99000008'], { cwd: labRoot, encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr);
  const md = fs.readFileSync(path.join(issueDir, 'COVERAGE.md'), 'utf8');
  assert.match(md, /Other runs: chromium · light · 1280px wide \(2026-10-15[^)]*\) \(record: current\)/);
  assert.match(md, /chromium · light · 1024px wide \(2026-10-15[^)]*\) \(record: none, not checked against the current patches/);
});
