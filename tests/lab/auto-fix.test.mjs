// Tests for the auto-fix settings and transparency (AI-usage): tools/compare/lab-config.mjs and tools/compare/patch-change.mjs.
// Throwaway git repositories in a temp folder; no network. Run: node --test tests/lab/auto-fix.test.mjs
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot } from '../../tools/compare/lib.mjs';
import { parseConfig, resolveConfig, readLabConfig, getKey, DEFAULTS } from '../../tools/compare/lab-config.mjs';
import { resolveBase, changedPatches, unrecorded, recordChange, readRecord } from '../../tools/compare/patch-change.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'auto-fix-test-')); after(() => fs.rmSync(root, { recursive: true, force: true }));

// ---- the settings file
const cfg = (text) => { const p = parseConfig(text), r = resolveConfig(p.value); return { ...r, problems: [...p.problems, ...r.problems] }; };

test('auto-fix is on by default: no file, an empty file, or a file that does not mention it', () => {
  assert.equal(readLabConfig(path.join(root, 'nowhere')).config.auto_fix.enabled, true);
  assert.equal(cfg('').config.auto_fix.enabled, true); assert.equal(cfg('# only a comment\n').config.auto_fix.enabled, true);
  assert.equal(cfg('auto_fix:\n').config.auto_fix.enabled, true); assert.deepEqual(DEFAULTS, { auto_fix: { enabled: true } });
});

test('it can be switched off in the file, with comments around it', () => {
  const r = cfg('# note\nauto_fix:\n  # why\n  enabled: false   # off for now\n'); assert.deepEqual(r.problems, []); assert.equal(r.config.auto_fix.enabled, false);
  assert.equal(getKey(r.config, 'auto_fix.enabled'), false); assert.equal(getKey(r.config, 'auto_fix.nope'), undefined);
  assert.equal(cfg('auto_fix:\n  enabled: true\n').config.auto_fix.enabled, true);
});

test('a setting that cannot be read is an error, never replaced by a default', () => {
  assert.match(cfg('auto_fix:\n  enabled: maybe\n').problems.join(), /"auto_fix.enabled" must be true or false/);
  assert.match(cfg('auto_fix:\n  enabld: false\n').problems.join(), /unknown setting "auto_fix.enabld"/);
  assert.match(cfg('autofix:\n  enabled: false\n').problems.join(), /unknown setting "autofix"/);
  assert.match(cfg('auto_fix:\n\tenabled: false\n').problems.join(), /tabs are not allowed/);
  assert.match(cfg('auto_fix:\n - enabled\n').problems.join(), /not a "key: value" line/);
  assert.match(cfg('auto_fix:\n   enabled: false\n').problems.join(), /indent by two spaces/);
  assert.match(cfg('auto_fix:\n  enabled: false\n  enabled: true\n').problems.join(), /set twice/);
  assert.match(cfg('auto_fix: false\n').problems.join(), /must contain settings/);
  assert.ok(cfg('auto_fix:\n  enabled: maybe\n').config.auto_fix.enabled === true, 'the returned config is still the default, but problems is not empty, so the command refuses');
});

test('the repository\'s own lab.config.yml is valid and switches auto-fix on', () => {
  const r = readLabConfig(labRoot); assert.deepEqual(r.problems, []); assert.equal(r.source, 'lab.config.yml'); assert.equal(r.config.auto_fix.enabled, true);
  const cmd = spawnSync('node', [path.join(labRoot, 'scripts/lab-config.mjs'), 'auto_fix.enabled'], { encoding: 'utf8' }); assert.equal(cmd.status, 0); assert.equal(cmd.stdout.trim(), 'true');
  assert.equal(spawnSync('node', [path.join(labRoot, 'scripts/lab-config.mjs'), 'auto_fix.nope'], { encoding: 'utf8' }).status, 2);
});

// ---- patch changes
let n = 0;
const git = (cwd, ...a) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd, encoding: 'utf8' });
const write = (f, text) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); };
const P = (nid, name) => `reports/issues/${nid}/branches/${name}.patch`;
function repo() {
  const dir = path.join(root, `r${++n}`); fs.mkdirSync(dir); git(dir, 'init', '-q', '-b', 'main');
  write(path.join(dir, P(1, 'a')), 'patch one\n'); write(path.join(dir, P(1, 'keep')), 'keep\n'); write(path.join(dir, 'other.txt'), 'x\n'); git(dir, 'add', '.'); git(dir, 'commit', '-q', '-m', 'base');
  git(dir, 'checkout', '-q', '-b', 'work'); return dir;
}
const commit = (dir, msg = 'c') => { git(dir, 'add', '-A'); git(dir, 'commit', '-q', '-m', msg); };

test('a patch changed since the base is found, and is not "recorded" until someone says why', () => {
  const d = repo(); assert.deepEqual(changedPatches(d, 'main'), []); assert.deepEqual(unrecorded(d, 'main'), []);
  write(path.join(d, P(1, 'a')), 'patch one, edited\n'); commit(d);
  assert.deepEqual(changedPatches(d, 'main').map((x) => `${x.status} ${x.path} #${x.nid}`), [`M ${P(1, 'a')} #1`]); assert.equal(unrecorded(d, 'main').length, 1);
  const r = recordChange(d, P(1, 'a'), { base: 'main', by: 'auto-fix', reason: 'CI said the patch no longer applied', date: '2026-10-15' });
  assert.equal(r.status, 'recorded'); assert.equal(unrecorded(d, 'main').length, 0);
  assert.equal(fs.readFileSync(path.join(d, `reports/issues/1/original-patches/a.${r.was}.patch`), 'utf8'), 'patch one\n', 'the version it replaced is kept');
  const e = readRecord(d, '1'); assert.equal(e.length, 1); assert.deepEqual([e[0].patch, e[0].by, e[0].why, e[0].was, e[0].now], ['branches/a.patch', 'auto-fix', 'CI said the patch no longer applied', r.was, r.now]);
  assert.equal(recordChange(d, P(1, 'a'), { base: 'main', by: 'auto-fix', reason: 'again' }).status, 'already recorded'); assert.equal(readRecord(d, '1').length, 1, 'idempotent');
});

test('changing it again needs a new record, and the file keeps both rows and both originals', () => {
  const d = repo(); write(path.join(d, P(1, 'a')), 'v2\n'); commit(d); recordChange(d, P(1, 'a'), { base: 'main', by: 'person', reason: 'first' });
  write(path.join(d, P(1, 'a')), 'v3\n'); commit(d); assert.equal(unrecorded(d, 'main').length, 1, 'the record names the hash it ended at, which is no longer the hash');
  recordChange(d, P(1, 'a'), { base: 'main', by: 'auto-fix', reason: 'second' }); assert.equal(unrecorded(d, 'main').length, 0);
  assert.deepEqual(readRecord(d, '1').map((x) => x.why), ['first', 'second']); assert.equal(fs.readdirSync(path.join(d, 'reports/issues/1/original-patches')).length, 1, 'recorded against the base, so one original (the base version)');
});

test('an uncommitted change counts, a deleted patch is recorded as deleted, a new patch is not a change', () => {
  const d = repo(); write(path.join(d, P(1, 'a')), 'uncommitted\n'); assert.equal(changedPatches(d, 'main').length, 1);
  fs.rmSync(path.join(d, P(1, 'keep'))); const ch = changedPatches(d, 'main'); assert.deepEqual(ch.map((x) => x.status).sort(), ['D', 'M']);
  const del = recordChange(d, P(1, 'keep'), { base: 'main', by: 'person', reason: 'dropped: superseded' }); assert.equal(del.status, 'recorded'); assert.equal(del.now, 'deleted'); assert.equal(del.lines, 'deleted');
  write(path.join(d, P(2, 'new')), 'brand new\n'); commit(d); assert.ok(!changedPatches(d, 'main').some((x) => x.nid === '2'), 'added files need no record');
  assert.match(recordChange(d, P(2, 'new'), { base: 'main', by: 'x', reason: 'y' }).error, /new patch, not a changed one/);
});

test('who and why are required, other paths are refused, table characters cannot break the record', () => {
  const d = repo(); write(path.join(d, P(1, 'a')), 'v2\n'); commit(d);
  assert.match(recordChange(d, P(1, 'a'), { base: 'main', by: '', reason: 'x' }).error, /who changed it/); assert.match(recordChange(d, 'other.txt', { base: 'main', by: 'x', reason: 'y' }).error, /is not reports\/issues/);
  recordChange(d, P(1, 'a'), { base: 'main', by: 'a | b', reason: 'line one\nline two | pipe' }); const e = readRecord(d, '1')[0]; assert.equal(e.by, 'a / b'); assert.equal(e.why, 'line one line two / pipe');
});

test('resolveBase finds origin/main or main, and says null rather than guessing', () => {
  const d = repo(); assert.equal(resolveBase(d), 'main'); assert.equal(resolveBase(d, 'work'), 'work'); assert.equal(resolveBase(d, 'nope'), null);
  const e = path.join(root, 'nomain'); fs.mkdirSync(e); git(e, 'init', '-q', '-b', 'dev'); write(path.join(e, 'f'), 'x'); git(e, 'add', '.'); git(e, 'commit', '-q', '-m', 'c'); assert.equal(resolveBase(e), null);
});
