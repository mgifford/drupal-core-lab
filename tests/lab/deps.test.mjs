// Tests for tools/compare/deps.mjs (scripts/deps.mjs, the doctor's package rows and the selftest preflight): packages are checked by
// resolving them, a worktree reuses another checkout's tree only when it is the locked tree, nothing that works is replaced, and
// dependency trees or machine-specific symlinks are never tracked. Temp folders and temp git repositories only; no network, no npm.
//   node --test tests/lab/deps.test.mjs
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { replacedByFolders } from '../../tools/compare/lib.mjs';
import { checkTask, satisfies, linkPlan, applyLink, pathState, trackedDependencyProblems, primaryCheckout } from '../../tools/compare/deps.mjs';

const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'lab-deps-')));
after(() => fs.rmSync(tmp, { recursive: true, force: true }));
let n = 0;
const git = (cwd, ...a) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'init.defaultBranch=main', '-c', 'core.symlinks=true', ...a], { cwd, encoding: 'utf8' });
const write = (f, text) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); };
const pkg = (dir, name, version, extra = {}) => { write(path.join(dir, name, 'package.json'), JSON.stringify({ name, version, main: 'index.js', ...extra })); write(path.join(dir, name, 'index.js'), 'module.exports = {};\n'); };
const LOCKED = { jsdom: '31.0.1', '@guidepup/virtual-screen-reader': '0.33.0' };

// A lab checkout shaped like the real one: the lockfile, the folder that imports the packages, and (optionally) installed trees.
function lab({ install = true, yaml = '4.3.2', versions = LOCKED } = {}) {
  const root = path.join(tmp, `lab-${++n}`);
  fs.mkdirSync(path.join(root, 'tools/playwright/lib'), { recursive: true });
  const packages = { '': { name: 'x' } };
  for (const [name, version] of Object.entries(LOCKED)) packages[`node_modules/${name}`] = { version, dev: true };
  write(path.join(root, 'tools/playwright/package-lock.json'), JSON.stringify({ lockfileVersion: 3, packages }));
  if (install) for (const [name, version] of Object.entries(versions)) pkg(path.join(root, 'tools/playwright/node_modules'), name, version);
  if (yaml) pkg(path.join(root, 'tools/compare/.deps/node_modules'), 'js-yaml', yaml);
  return root;
}

test('satisfies: the engines ranges real packages declare, and unknown is never a pass', () => {
  const range = '^22.22.2 || ^24.15.0 || >=26.0.0';   // jsdom 31.0.1
  assert.equal(satisfies('22.21.1', range), false, 'the Node.js this lab ran on 2026-11-26');
  for (const v of ['22.22.2', '24.15.0', '26.1.0', 'v22.30.0']) assert.equal(satisfies(v, range), true, v);
  assert.equal(satisfies('0.3.9', '^0.3.1'), true); assert.equal(satisfies('0.4.0', '^0.3.1'), false);
  assert.equal(satisfies('1.2.9', '~1.2'), true); assert.equal(satisfies('1.3.0', '~1.2.0'), false);
  assert.equal(satisfies('20.1.0', '>=18 <21'), true); assert.equal(satisfies('21.0.0', '>= 18 < 21'), false);
  assert.equal(satisfies('18.0.0', '*'), true); assert.equal(satisfies('18.0.0', '18.x'), true);
  assert.equal(satisfies('18.0.0', 'lts/*'), null); assert.equal(satisfies('18.0.0', '1.0.0 - 2.0.0'), null);
});

test('installed trees resolve: the selftest task is ready, a git-only task needs nothing', () => {
  const root = lab();
  const r = checkTask(root, 'selftest', { nodeVersion: '24.15.0' });
  assert.equal(r.ok, true, JSON.stringify(r.problems));
  assert.deepEqual(r.rows.map((x) => [x.name, x.status, x.version]), [['js-yaml', 'ok', '4.3.2'], ['jsdom', 'ok', '31.0.1'], ['@guidepup/virtual-screen-reader', 'ok', '0.33.0']]);
  const g = checkTask(root, 'git'); assert.equal(g.ok, true); assert.equal(g.rows.length, 0);
});

test('the committed symlink (five folders up, nothing there) is reported as missing, with the dangling target and the fix', () => {
  const root = lab({ install: false });
  fs.symlinkSync('../../../../../tools/playwright/node_modules', path.join(root, 'tools/playwright/node_modules'));
  assert.equal(pathState(path.join(root, 'tools/playwright/node_modules')).kind, 'dangling');
  const r = checkTask(root, 'selftest');
  assert.equal(r.ok, false);
  const jsdom = r.problems.find((x) => x.name === 'jsdom');
  assert.ok(['missing', 'elsewhere'].includes(jsdom.status));
  if (jsdom.status === 'missing') assert.match(jsdom.detail, /symlink to \.\.\/\.\.\/\.\.\/\.\.\/\.\.\/tools\/playwright\/node_modules, which does not exist/);
  assert.deepEqual(r.fixes, ['PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci --prefix tools/playwright'], 'one fix, no browser download for a static selftest');
});

test('a package found in a node_modules above the checkout is a problem, not "installed" (the lab loads from its own home)', () => {
  const outer = path.join(tmp, `outer-${++n}`);
  pkg(path.join(outer, 'node_modules'), 'jsdom', '9.9.9');
  const root = path.join(outer, 'lab'); fs.renameSync(lab({ install: false }), root);
  pkg(path.join(root, 'tools/playwright/node_modules'), '@guidepup/virtual-screen-reader', '0.33.0');
  const r = checkTask(root, 'selftest');
  const jsdom = r.rows.find((x) => x.name === 'jsdom');
  assert.equal(jsdom.status, 'elsewhere'); assert.equal(jsdom.version, '9.9.9');
  assert.match(jsdom.detail, /resolved from .*outer-\d+\/node_modules\/jsdom, not from tools\/playwright\/node_modules/);
  assert.equal(r.ok, false);
});

test('a version other than the locked one, a wrong major, or a Node.js outside the engines is a warning, not a failure', () => {
  const root = lab({ yaml: '3.14.0', versions: { ...LOCKED, jsdom: '30.0.0' } });
  write(path.join(root, 'tools/playwright/node_modules/@guidepup/virtual-screen-reader/package.json'), JSON.stringify({ name: '@guidepup/virtual-screen-reader', version: '0.33.0', main: 'index.js', engines: { node: '>=99' } }));
  const r = checkTask(root, 'selftest', { nodeVersion: '22.21.1' });
  assert.equal(r.ok, true);
  const by = Object.fromEntries(r.rows.map((x) => [x.name, x]));
  assert.equal(by.jsdom.status, 'differs'); assert.match(by.jsdom.detail, /installed 30\.0\.0, tools\/playwright\/package-lock\.json locks 31\.0\.1/);
  assert.equal(by['js-yaml'].status, 'wrong-major');
  assert.equal(by['@guidepup/virtual-screen-reader'].engine, false);
  assert.equal(r.warnings.length, 3);
});

test('link: a worktree with nothing installed links to the primary tree when the locks match, and then resolves through it', () => {
  const primary = lab(), wt = lab({ install: false, yaml: null });
  const plan = linkPlan(wt, primary);
  assert.deepEqual(plan.map((p) => [p.home, p.action]), [['playwright', 'link'], ['deps', 'link']]);
  applyLink(wt, plan);
  assert.equal(pathState(path.join(wt, 'tools/playwright/node_modules')).kind, 'link');
  const r = checkTask(wt, 'selftest');
  assert.equal(r.ok, true, JSON.stringify(r.problems));
  assert.ok(r.rows.every((x) => x.resolved.startsWith(primary)), 'the packages are the primary checkout\'s, not a copy');
  assert.deepEqual(linkPlan(wt, primary).map((p) => p.action), ['already', 'already'], 'running it again changes nothing');
});

test('link replaces only a dangling symlink; a real folder, a working symlink elsewhere, or a file is never replaced', () => {
  const primary = lab();
  const dangling = lab({ install: false, yaml: null });
  fs.symlinkSync('../../../../../tools/playwright/node_modules', path.join(dangling, 'tools/playwright/node_modules'));
  const p1 = linkPlan(dangling, primary).find((p) => p.home === 'playwright');
  assert.equal(p1.action, 'link'); assert.match(p1.reason, /replaces a dangling symlink/);
  applyLink(dangling, [p1]); assert.equal(checkTask(dangling, 'selftest').rows.find((x) => x.name === 'jsdom').status, 'ok');

  const real = lab();   // its own install: 90 MB someone may be using
  const p2 = linkPlan(real, primary).find((p) => p.home === 'playwright');
  assert.equal(p2.action, 'refuse'); assert.match(p2.reason, /is a real folder here .* not replaced/);
  applyLink(real, [p2]); assert.equal(pathState(path.join(real, 'tools/playwright/node_modules')).kind, 'dir', 'applying a refusal does nothing');

  const other = lab(), linked = lab({ install: false });
  fs.symlinkSync(path.join(other, 'tools/playwright/node_modules'), path.join(linked, 'tools/playwright/node_modules'));
  assert.match(linkPlan(linked, primary).find((p) => p.home === 'playwright').reason, /already a working symlink to .* not replaced/);
  assert.equal(linkPlan(primary, primary)[0].action, 'refuse');
});

test('link refuses a source whose lockfile differs, or whose installed tree is not the locked tree', () => {
  const primary = lab(), wt = lab({ install: false, yaml: null });
  write(path.join(primary, 'tools/playwright/package-lock.json'), JSON.stringify({ lockfileVersion: 3, packages: { 'node_modules/jsdom': { version: '32.0.0' } } }));
  assert.match(linkPlan(wt, primary)[0].reason, /package-lock\.json differs between the two checkouts/);
  const drifted = lab({ versions: { ...LOCKED, jsdom: '30.0.0' } });
  const plan = linkPlan(wt, drifted)[0];
  assert.equal(plan.action, 'refuse'); assert.match(plan.reason, /not the locked tree: jsdom 30\.0\.0 \(locked 31\.0\.1\)/);
  const oldYaml = lab({ yaml: '3.14.0' });
  assert.match(linkPlan(wt, oldYaml)[1].reason, /js-yaml 3\.14\.0 \(the lab expects 4\.x\)/);
});

test('tracked dependency trees and symlinks that leave the repository are found; an in-repository symlink is fine', () => {
  const repo = path.join(tmp, `repo-${++n}`); fs.mkdirSync(repo); git(repo, 'init', '-q');
  write(path.join(repo, 'docs/a.md'), 'a\n');
  fs.mkdirSync(path.join(repo, 'tools/playwright'), { recursive: true });
  fs.symlinkSync('../../../../../tools/playwright/node_modules', path.join(repo, 'tools/playwright/node_modules'));
  fs.symlinkSync('a.md', path.join(repo, 'docs/b.md'));
  fs.symlinkSync('/etc/hosts', path.join(repo, 'docs/abs'));
  write(path.join(repo, 'kit/node_modules/x/index.js'), '');
  git(repo, 'add', '-f', '.');
  const found = trackedDependencyProblems(repo).map((x) => [x.path, x.problem]);
  assert.deepEqual(found, [
    ['docs/abs', 'a symlink to /etc/hosts, outside the repository'],
    ['kit/node_modules/x/index.js', 'a dependency tree is tracked'],
    ['tools/playwright/node_modules', 'a dependency tree is tracked (as a symlink)'],
  ]);
});

test('the primary checkout is found from a secondary worktree, whose .git is a file', () => {
  const repo = path.join(tmp, `repo-${++n}`); fs.mkdirSync(repo); git(repo, 'init', '-q'); write(path.join(repo, 'a'), 'a'); git(repo, 'add', '.'); git(repo, 'commit', '-qm', 'a');
  const wt = path.join(tmp, `wt-${n}`); assert.equal(git(repo, 'worktree', 'add', '-q', wt).status, 0);
  assert.ok(fs.statSync(path.join(wt, '.git')).isFile());
  assert.equal(primaryCheckout(wt), repo); assert.equal(primaryCheckout(repo), repo); assert.equal(primaryCheckout(tmp), null);
});

test('migration: an installed folder blocks the pull that untracks the symlink; git rm --cached is the safe step; a stash would delete it', () => {
  const upstream = path.join(tmp, `up-${++n}`); fs.mkdirSync(path.join(upstream, 'tools/playwright'), { recursive: true }); git(upstream, 'init', '-q');
  write(path.join(upstream, '.gitignore'), 'node_modules/\n');
  fs.symlinkSync('../../../../../tools/playwright/node_modules', path.join(upstream, 'tools/playwright/node_modules'));
  git(upstream, 'add', '-f', '.'); git(upstream, 'commit', '-qm', 'symlink committed');
  const owner = path.join(tmp, `owner-${n}`), stasher = path.join(tmp, `stasher-${n}`), plain = path.join(tmp, `plain-${n}`);
  for (const d of [owner, stasher, plain]) assert.equal(git(tmp, 'clone', '-q', upstream, d).status, 0);
  // The owner ran npm ci: the symlink became a real folder (a tracked deletion in git status).
  const install = (d) => { fs.unlinkSync(path.join(d, 'tools/playwright/node_modules')); pkg(path.join(d, 'tools/playwright/node_modules'), 'jsdom', '31.0.1'); };
  install(owner); install(stasher);
  assert.match(git(owner, 'status', '--porcelain').stdout, /^ D tools\/playwright\/node_modules$/m);
  assert.deepEqual(replacedByFolders(owner), ['tools/playwright/node_modules'], 'test-mr.mjs stops on this instead of stashing');
  assert.deepEqual(replacedByFolders(plain), []);
  // Why test-mr must not stash here: the stash restores the dangling symlink and the installed packages are gone, not stashed.
  git(stasher, 'stash', 'push', '--include-untracked', '-m', 'test-mr');
  assert.equal(pathState(path.join(stasher, 'tools/playwright/node_modules')).kind, 'dangling');
  assert.equal(fs.existsSync(path.join(stasher, 'tools/playwright/node_modules/jsdom')), false);

  // Upstream untracks it and ignores symlinks too.
  git(upstream, 'rm', '-q', '--cached', 'tools/playwright/node_modules'); write(path.join(upstream, '.gitignore'), 'node_modules\n');
  git(upstream, 'add', '.gitignore'); git(upstream, 'commit', '-qm', 'untrack');
  const refused = git(owner, 'pull', '--ff-only');
  assert.notEqual(refused.status, 0); assert.match(refused.stderr, /Your local changes to the following files would be overwritten by merge:\s+tools\/playwright\/node_modules/);
  assert.equal(git(owner, 'rm', '-q', '--cached', 'tools/playwright/node_modules').status, 0);
  assert.equal(git(owner, 'pull', '-q', '--ff-only').status, 0, 'with the index updated, the pull fast-forwards');
  assert.ok(fs.existsSync(path.join(owner, 'tools/playwright/node_modules/jsdom/package.json')), 'the install is kept');
  assert.equal(git(owner, 'status', '--porcelain').stdout, '', 'and git status is clean');
  assert.equal(git(plain, 'pull', '-q', '--ff-only').status, 0);
  assert.equal(pathState(path.join(plain, 'tools/playwright/node_modules')).kind, 'absent', 'an untouched clone loses only the dangling link');
});
