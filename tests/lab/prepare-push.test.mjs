// Tests for tools/compare/prepare-push.mjs and scripts/prepare-push.mjs: an already-published contribution, a branch someone else changed,
// a shallow clone where merge-base fails (and the bounded fetch that recovers it without shortening anything), a linked worktree with an
// untracked test fixture, and the read-only default. Local temporary repositories only: "upstream" core, a bare issue fork and a bare
// shallow lab clone (like envs/core.git); remotes are folder paths. git runs with an empty configuration and safe.bareRepository=explicit.
// Run: node --test tests/lab/prepare-push.test.mjs
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { openRepo } from '../../tools/compare/patch-validate.mjs';
import { readIssue, prepare, fetchPlan, labRef } from '../../tools/compare/prepare-push.mjs';
import { acquireGitLock, releaseGitLock } from '../../tools/compare/git-lock.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'prepare-push-test-'));
after(() => fs.rmSync(root, { recursive: true, force: true }));
fs.writeFileSync(path.join(root, 'gitconfig'), '');
Object.assign(process.env, { GIT_CONFIG_GLOBAL: path.join(root, 'gitconfig'), GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_PARAMETERS: "'safe.bareRepository=explicit'", GIT_TERMINAL_PROMPT: '0', LAB_GIT_LOCK_DIR: path.join(root, 'git-locks') });
const labRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OWNER = ['Lab Owner', 'owner@example.test'], ALICE = ['Alice', 'alice@example.test'], BOB = ['Bob', 'bob@example.test'];
const day = (d) => new Date(Date.UTC(2026, 0, d, 12)).toISOString();
let n = 0;
const git = (args, o = {}) => spawnSync('git', ['-c', `user.name=${(o.who || OWNER)[0]}`, '-c', `user.email=${(o.who || OWNER)[1]}`, ...args], { encoding: 'utf8', cwd: o.cwd || root, env: { ...process.env, ...(o.day ? { GIT_AUTHOR_DATE: day(o.day), GIT_COMMITTER_DATE: day(o.day) } : {}) } });
const ok = (r) => { assert.equal(r.status, 0, `${r.stderr}${r.stdout}`); return r.stdout.trim(); };
const commit = (dir, file, text, msg, o) => { const f = path.join(dir, file); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); ok(git(['add', '-A'], { cwd: dir })); ok(git(['commit', '-qm', msg], { cwd: dir, ...o })); return ok(git(['rev-parse', 'HEAD'], { cwd: dir })); };

// Upstream core, built once and never changed by a test: 30 commits on main, one a day in January 2026, and one more on day 30.
let UP = null;
function upstream() {
  if (UP) return UP;
  const up = path.join(root, 'upstream'); fs.mkdirSync(up); ok(git(['init', '-q', '-b', 'main'], { cwd: up }));
  const mains = []; let log = '';
  for (let d = 1; d <= 30; d++) { log += `day ${d}\n`; mains.push(commit(up, 'core/log.txt', log, `core ${d}`, { day: d })); }
  mains.push(commit(up, 'core/b.txt', 'b1\nb2\n', 'core 30b', { day: 30 }));
  return (UP = { up, mains });
}
// upstream core: 30 commits on main, one a day in January 2026. The issue fork (bare) has branch 123-fix from main's commit of day `forkAt`,
// with one commit by Alice. The lab clone (bare, like envs/core.git) fetched main and the fork branch at the given depths, and the
// owner's contribution is a commit on the fork branch in a linked worktree of the lab clone (branch review/123).
function world({ forkAt = 25, mainDepth = 40, branchDepth = 40, aliceCommits = 1 } = {}) {
  const w = path.join(root, `w${++n}`), fork = path.join(w, 'fork.git'), lab = path.join(w, 'core.git'), wt = path.join(w, 'wt');
  fs.mkdirSync(w, { recursive: true });
  const { up, mains } = upstream();
  ok(git(['clone', '-q', '--bare', up, fork]));
  const work = path.join(w, 'alice'); ok(git(['clone', '-q', fork, work])); ok(git(['checkout', '-q', '-b', '123-fix', mains[forkAt - 1]], { cwd: work }));
  let aliceSha = '';
  for (let i = 1; i <= aliceCommits; i++) aliceSha = commit(work, 'core/a.txt', i === aliceCommits ? 'alice\n' : `alice draft ${i}\n`, i === aliceCommits ? 'Alice: start the fix' : `Alice: draft ${i}`, { who: ALICE, day: forkAt + i - 1 });
  ok(git(['push', '-q', 'origin', '123-fix'], { cwd: work }));
  ok(git(['init', '-q', '--bare', lab]));
  ok(git([`--git-dir=${lab}`, 'fetch', '-q', '--depth', String(mainDepth), up, '+refs/heads/main:refs/lab/new-issue/main']));
  ok(git([`--git-dir=${lab}`, 'fetch', '-q', '--depth', String(branchDepth), fork, '+refs/heads/123-fix:refs/lab/issue-123/123-fix']));
  ok(git([`--git-dir=${lab}`, 'worktree', 'add', '-q', '-b', 'review/123', wt, 'refs/lab/issue-123/123-fix']));
  const local = commit(wt, 'core/a.txt', 'alice\nowner\n', 'Owner: finish the fix', { day: 31 });
  const opts = (o = {}) => ({ repo: openRepo(lab), nid: '123', local: 'review/123', sourceBranch: '123-fix', target: 'main', fetchUrl: fork, pushUrl: 'git@example.test:issue/drupal-123.git', coreUrl: up, ...o });
  return { w, up, fork, lab, wt, work, mains, aliceSha, local, opts };
}
const revOf = (lab, ref) => ok(git([`--git-dir=${lab}`, 'rev-parse', ref]));
const find = (rep, name) => rep.checks.find((c) => c.name === name) || {};
const snapshot = (lab) => ({ refs: ok(git([`--git-dir=${lab}`, 'for-each-ref'])), shallow: fs.existsSync(path.join(lab, 'shallow')) ? fs.readFileSync(path.join(lab, 'shallow'), 'utf8') : 'not shallow' });

test('not yet published: the fork tip is an ancestor, so a plain push would do; the push command has no force and is not run', () => {
  const x = world(), before = snapshot(x.lab);
  const rep = prepare(x.opts());
  assert.equal(rep.verdict, 'ready', JSON.stringify(rep.checks, null, 1)); assert.equal(rep.exit, 0);
  assert.match(find(rep, 'published').detail, /1 commit\(s\) ahead of the fork tip/);
  assert.equal(rep.push, `git --git-dir=${x.lab} push git@example.test:issue/drupal-123.git ${x.local}:refs/heads/123-fix`);
  assert.doesNotMatch(rep.push, /force|\+/);
  assert.equal(ok(git([`--git-dir=${x.fork}`, 'rev-parse', 'refs/heads/123-fix'])), x.aliceSha, 'the fork was not touched');
  assert.deepEqual(snapshot(x.lab), before, 'the default run wrote no ref and no shallow boundary');
});

test('already published: the fork tip equals the local commit, or contains it with later commits (which name their author)', () => {
  const x = world();
  ok(git([`--git-dir=${x.lab}`, 'push', '-q', x.fork, `${x.local}:refs/heads/123-fix`]));
  let rep = prepare(x.opts());
  assert.equal(rep.verdict, 'published'); assert.equal(rep.exit, 0); assert.equal(rep.push, '');
  assert.match(find(rep, 'published').detail, /is at the local commit/);
  ok(git(['pull', '-q', 'origin', '123-fix'], { cwd: x.work, who: BOB })); commit(x.work, 'core/c.txt', 'bob\n', 'Bob: add a test', { who: BOB, day: 32 }); ok(git(['push', '-q', 'origin', '123-fix'], { cwd: x.work }));
  ok(git([`--git-dir=${x.lab}`, 'fetch', '-q', x.fork, `+refs/heads/123-fix:${labRef('123', 'source')}`]));
  rep = prepare(x.opts());
  assert.equal(rep.verdict, 'published', JSON.stringify(rep.checks, null, 1));
  assert.match(find(rep, 'published').detail, /contains the local commit, with 1 commit\(s\) after it/);
  assert.equal(find(rep, 'changed by someone else').status, 'WARN'); assert.match(find(rep, 'changed by someone else').detail, /Bob: Bob: add a test/);
});

test('changed by someone else: the new fork tip is fetched only when asked, then the divergence stops the push and names Bob', () => {
  const x = world();
  commit(x.work, 'core/a.txt', 'alice\nbob\n', 'Bob: a different fix', { who: BOB, day: 32 }); ok(git(['push', '-q', 'origin', '123-fix'], { cwd: x.work }));
  let rep = prepare(x.opts({ recordedTip: x.aliceSha.slice(0, 8) }));
  assert.equal(rep.verdict, 'needs-history'); assert.equal(rep.exit, 3);
  assert.match(find(rep, 'published').detail, /not in this repository; fetch it/);
  assert.match(find(rep, 'merge request moved').detail, new RegExp(`recorded ${x.aliceSha.slice(0, 8)}`));
  assert.equal(rep.fetch.length, 1); assert.equal(rep.fetch[0].ref, labRef('123', 'source'));
  for (const f of rep.fetch) ok(git([`--git-dir=${x.lab}`, ...f.args]));
  rep = prepare(x.opts());
  assert.equal(rep.verdict, 'diverged', JSON.stringify(rep.checks, null, 1)); assert.equal(rep.exit, 1); assert.equal(rep.push, '');
  const c = find(rep, 'changed by someone else'); assert.equal(c.status, 'STOP');
  assert.match(c.detail, /^yes: the fork branch has 1 commit\(s\) the local commit lacks \(\w+ Bob: Bob: a different fix\)/); assert.match(c.detail, /never force-push/);
});

test('shallow clone: merge-base fails, which is reported as unknown (not unrelated) with a bounded fetch; the fetch recovers it and shortens nothing', () => {
  const x = world({ forkAt: 10, mainDepth: 3, branchDepth: 2 }), repo = openRepo(x.lab);
  assert.equal(repo.shallow, true);
  assert.notEqual(git([`--git-dir=${x.lab}`, 'merge-base', 'review/123', 'refs/lab/new-issue/main']).status, 0, 'the fixture really fails merge-base');
  let rep = prepare(x.opts());
  assert.equal(rep.verdict, 'needs-history'); assert.equal(rep.exit, 3);
  assert.match(find(rep, 'common ancestry with main').detail, /shallow, not because the histories are unrelated/);
  assert.match(find(rep, 'shallow history').detail, /local from 2026-01-10/);
  assert.equal(rep.fetch.length, 1);
  assert.deepEqual(rep.fetch[0].args, ['fetch', '--no-tags', '--shallow-since=2026-01-09', x.up, `+refs/heads/main:${labRef('123', 'target')}`]);
  assert.doesNotMatch(rep.fetch.map((f) => f.text).join(' '), /unshallow|--depth/);
  const count = (ref) => Number(ok(git([`--git-dir=${x.lab}`, 'rev-list', '--count', ref])));
  const localBefore = count('review/123'), branchBefore = count('refs/lab/issue-123/123-fix');
  for (const f of rep.fetch) ok(git([`--git-dir=${x.lab}`, ...f.args]));
  assert.ok(count('review/123') >= localBefore && count('refs/lab/issue-123/123-fix') >= branchBefore, 'no history was shortened');
  rep = prepare(x.opts());
  assert.equal(rep.verdict, 'ready', JSON.stringify(rep.checks, null, 1));
  assert.match(find(rep, 'common ancestry with main').detail, new RegExp(`merge-base ${x.mains[9].slice(0, 12)}; main \\w+ has 21 commit\\(s\\)`));
});

test('a branch cut short inside its own commits, with main already reaching further back: the source is deepened, never given a later --shallow-since', () => {
  const x = world({ forkAt: 10, mainDepth: 3, branchDepth: 2, aliceCommits: 5 });
  ok(git([`--git-dir=${x.lab}`, 'fetch', '-q', '--shallow-since=2026-01-02', x.up, `+refs/heads/main:${labRef('123', 'target')}`]));
  assert.notEqual(git([`--git-dir=${x.lab}`, 'merge-base', 'review/123', labRef('123', 'target')]).status, 0, 'the local side is still cut short');
  let rep = prepare(x.opts({ offline: true }));
  assert.equal(rep.verdict, 'needs-history', JSON.stringify(rep.checks, null, 1));
  assert.equal(rep.fetch.length, 1); assert.equal(rep.fetch[0].ref, labRef('123', 'source'));
  assert.match(rep.fetch[0].args.join(' '), /--deepen=100 /); assert.doesNotMatch(rep.fetch[0].args.join(' '), /shallow-since|unshallow/);
  const mainBefore = Number(ok(git([`--git-dir=${x.lab}`, 'rev-list', '--count', labRef('123', 'target')])));
  ok(git([`--git-dir=${x.lab}`, ...rep.fetch[0].args]));
  assert.ok(Number(ok(git([`--git-dir=${x.lab}`, 'rev-list', '--count', labRef('123', 'target')]))) >= mainBefore, 'main was not shortened');
  rep = prepare(x.opts({ offline: true }));
  assert.match(find(rep, 'common ancestry with main').detail, new RegExp(`merge-base ${x.mains[9].slice(0, 12)}`));
});

test('the shared clone is never shortened: a new tip with a recent --base gets a date no later than the oldest commit any ref reaches', () => {
  // review finding 2026-11-27: --shallow-since moves the boundary of EVERY ref through that history, not only the fetched one
  const x = world({ mainDepth: 25, branchDepth: 2 }), repo = openRepo(x.lab);
  const up2 = path.join(x.w, 'upstream2'); ok(git(['clone', '-q', x.up, up2])); const newTip = commit(up2, 'core/new.txt', 'new\n', 'core 31', { day: 31 });
  const count = (ref) => Number(ok(git([`--git-dir=${x.lab}`, 'rev-list', '--count', ref])));
  const reach = count('refs/lab/new-issue/main');
  // the control: the day the base alone asks for (day 27) is later than refs/lab/new-issue/main reaches, and cuts it
  const ctl = path.join(x.w, 'control.git'); ok(git(['clone', '-q', '--bare', '--no-local', `--depth=25`, `file://${x.up}`, ctl]));
  const ctlBefore = Number(ok(git([`--git-dir=${ctl}`, 'rev-list', '--count', 'HEAD'])));
  ok(git([`--git-dir=${ctl}`, 'fetch', '-q', '--no-tags', '--shallow-since=2026-01-27', up2, '+refs/heads/main:refs/lab/x']));
  assert.ok(Number(ok(git([`--git-dir=${ctl}`, 'rev-list', '--count', 'HEAD']))) < ctlBefore, 'git still shortens other refs (the reason for the rule)');
  // the plan: a new tip, so --shallow-since, but no later than the day before the oldest commit here, and it says why
  const plan = fetchPlan(repo, { nid: '123', need: { target: true }, local: '', base: x.mains[27], targetUrl: up2, targetBranch: 'main', targetSha: newTip });
  assert.equal(plan.length, 1);
  const since = plan[0].args.find((a) => a.startsWith('--shallow-since=')).slice('--shallow-since='.length);
  const oldest = Math.min(...ok(git([`--git-dir=${x.lab}`, 'log', '--max-parents=0', '--all', '--format=%cs'])).split('\n').map((d) => Date.parse(d)));
  assert.ok(Date.parse(since) < oldest, `${since} is before every commit here`); assert.match(plan[0].why, /earlier than the 2026-01-27 needed: history here already reaches/);
  ok(git([`--git-dir=${x.lab}`, ...plan[0].args]));
  assert.ok(count('refs/lab/new-issue/main') >= reach, 'nothing here was shortened'); assert.equal(revOf(x.lab, labRef('123', 'target')), newTip);
  // a tip that is already here is deepened instead (bounded, never shortens)
  const again = fetchPlan(repo, { nid: '123', need: { target: true }, local: '', base: x.mains[27], targetUrl: up2, targetBranch: 'main', targetSha: newTip });
  assert.match(again[0].args.join(' '), /--deepen=\d+/); assert.doesNotMatch(again[0].args.join(' '), /--depth|shallow-since|unshallow/);
});

test('a linked worktree (its .git is a file) is found through --git-common-dir; an untracked test fixture stops the push', () => {
  const x = world();
  assert.equal(fs.statSync(path.join(x.wt, '.git')).isFile(), true);
  const repo = openRepo(x.wt);
  assert.equal(fs.realpathSync(repo.commonDir), fs.realpathSync(x.lab)); assert.equal(repo.bare, false);
  fs.mkdirSync(path.join(x.wt, 'core/tests/fixtures'), { recursive: true }); fs.writeFileSync(path.join(x.wt, 'core/tests/fixtures/page.html'), '<p>fixture</p>\n');
  const rep = prepare(x.opts({ repo }));
  assert.equal(rep.verdict, 'blocked'); assert.equal(find(rep, 'untracked test files').status, 'STOP');
  assert.match(find(rep, 'untracked test files').detail, /core\/tests\/fixtures\/page\.html/);
  assert.match(rep.checks.map((c) => c.name).join(','), /published/);
});

test('the patch: equals the local commit, and a commit with a test file the patch lacks is stopped', () => {
  const x = world();
  const full = ok(git(['diff', '--full-index', x.mains[24], 'HEAD'], { cwd: x.wt })) + '\n';
  let rep = prepare(x.opts({ patch: Buffer.from(full) }));
  assert.equal(rep.verdict, 'ready', JSON.stringify(rep.checks, null, 1));
  assert.equal(find(rep, 'patch equals the local commit').status, 'ok'); assert.equal(find(rep, 'patch: whitespace of the resulting source').status, 'ok');
  assert.equal(find(rep, 'patch applies to current main').status, 'ok');
  assert.equal(find(rep, 'upstream changes to the same files').status, 'ok');
  commit(x.wt, 'core/tests/fixture.txt', 'needed by the test\n', 'Owner: add the test fixture', { day: 31 });
  rep = prepare(x.opts({ patch: Buffer.from(full) }));
  assert.equal(rep.verdict, 'blocked');
  assert.match(find(rep, 'patch: expected files').detail, /missing: core\/tests\/fixture\.txt/);
  assert.match(find(rep, 'patch equals the local commit').detail, /core\/tests\/fixture\.txt/);
});

test('a value that git would read as an option is refused before any git call', () => {
  const x = world();
  for (const bad of [{ fetchUrl: '--upload-pack=touch pwned' }, { local: '-x' }, { coreUrl: '-c' }]) {
    const rep = prepare(x.opts(bad));
    assert.equal(rep.verdict, 'blocked'); assert.match(rep.checks[0].detail, /git would read it as an option; refused/);
  }
  assert.equal(fs.existsSync(path.join(root, 'pwned')), false);
});

test('readIssue: status.json and BRANCHES.md give the MR, branch, recorded tip, fork and local branch', () => {
  const lab = path.join(root, `issues${++n}`), dir = path.join(lab, 'reports/issues/4567');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'status.json'), JSON.stringify({ nid: '4567', mr: { iid: 999, branch: '4567-fix', sha: 'abcdef12' } }));
  fs.writeFileSync(path.join(dir, 'BRANCHES.md'), 'Issue fork: https://git.drupalcode.org/issue/drupal-4567.git\n\n| Property | Value |\n|---|---|\n| Upstream source branch | `4567-fix` |\n| Local integration branch | `review/4567-improvements` |\n');
  assert.deepEqual(readIssue(lab, '4567'), { nid: '4567', hasStatus: true, hasBranches: true, iid: 999, sourceBranch: '4567-fix', recordedTip: 'abcdef12', fetchUrl: 'https://git.drupalcode.org/issue/drupal-4567.git', localBranch: 'review/4567-improvements' });
  fs.writeFileSync(path.join(dir, 'status.json'), JSON.stringify({ nid: '4567', mr: 'https://git.drupalcode.org/project/drupal/-/merge_requests/17967' }));
  fs.writeFileSync(path.join(dir, 'BRANCHES.md'), '- Local branch: `4567-svg-revision`\n- Issue fork branch: [x](https://git.drupalcode.org/issue/drupal-4567/-/tree/4567-svg-revision)\n');
  const r = readIssue(lab, '4567');
  assert.equal(r.iid, 17967); assert.equal(r.localBranch, '4567-svg-revision'); assert.equal(r.fetchUrl, 'https://git.drupalcode.org/issue/drupal-4567.git');
  assert.equal(readIssue(lab, '1').hasStatus, false);
});

test('scripts/prepare-push.mjs: exit 3 and the fetch to run, then --fetch recovers the shallow history; READY prints the push for the owner', () => {
  const x = world({ forkAt: 10, mainDepth: 3, branchDepth: 2 }), lab = path.join(x.w, 'lab'), dir = path.join(lab, 'reports/issues/123');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'status.json'), JSON.stringify({ nid: '123', mr: { iid: 7, branch: '123-fix', sha: x.aliceSha.slice(0, 8) } }));
  fs.writeFileSync(path.join(dir, 'BRANCHES.md'), '| Local integration branch | `review/123` |\n');
  const run = (...a) => spawnSync('node', [path.join(labRoot, 'scripts/prepare-push.mjs'), '123', '--lab-root', lab, '--repo', x.lab, '--fetch-url', x.fork, '--core-url', x.up, ...a], { encoding: 'utf8', cwd: root });
  let r = run();
  assert.equal(r.status, 3, r.stdout + r.stderr);
  assert.match(r.stdout, /read-only: nothing was fetched, pushed or written/); assert.match(r.stdout, /Minimum history to fetch[\s\S]*--shallow-since=2026-01-09/);
  assert.match(r.stdout, /NEEDS HISTORY OR NETWORK/); assert.match(r.stdout, /push {6}git@git\.drupal\.org:issue\/drupal-123\.git {3}\(never run by this tool\)/);
  const held = acquireGitLock({ repo: openRepo(x.lab), operation: 'a concurrent fetch', session: 'other-session', pid: process.pid });
  assert.equal(held.ok, true);
  r = run('--fetch');
  assert.equal(r.status, 3, r.stdout + r.stderr);
  assert.match(r.stderr, /Shared Git repository is busy/);
  releaseGitLock({ repo: openRepo(x.lab), pid: process.pid });
  r = run('--fetch');
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^fetched {2}git --git-dir=/m); assert.match(r.stdout, /READY: a plain push/);
  assert.match(r.stdout, new RegExp(`push git@git\\.drupal\\.org:issue/drupal-123\\.git ${x.local}:refs/heads/123-fix`));
  assert.equal(ok(git([`--git-dir=${x.fork}`, 'rev-parse', 'refs/heads/123-fix'])), x.aliceSha, 'nothing was pushed');
  r = run('--json'); assert.equal(JSON.parse(r.stdout).verdict, 'ready');
});
