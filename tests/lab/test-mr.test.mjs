// Tests for scripts/test-mr.mjs (the one command for a Coder or local comparison), resolveVariant and the DDEV name helpers in
// tools/compare/lib.mjs, and the patch-state message scripts/cloud-bootstrap.mjs relies on to reapply a changed patch. No DDEV (a
// stand-in `ddev` on PATH where one is needed), no network; temp folders only.
//   node --test tests/lab/test-mr.test.mjs
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot, variants, resolveVariant, envDir, ddevName, parseDdevList, labCheckoutOf, ddevNameClashes } from '../../tools/compare/lib.mjs';
import { ensurePatches, runBlockReason } from '../../tools/compare/patch-state.mjs';
import { sideState } from '../../tools/compare/contrib-state.mjs';

const all = variants();
// An issue that has a -latest variant, chosen from the registry so the test does not depend on one issue staying registered.
const latest = all.find((x) => /-latest$/.test(x.slug) && all.some((y) => y.slug === `${x.issue}-pinned`));
const noCoder = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('CODER_')));
const cli = (args, env = noCoder) => spawnSync(process.execPath, [path.join(labRoot, 'scripts/test-mr.mjs'), ...args], { cwd: os.tmpdir(), encoding: 'utf8', env });

test('resolveVariant: a slug, an issue number (with or without #), and errors that say what to type', () => {
  assert.ok(latest, 'the registry has an issue with -latest and -pinned variants');
  assert.equal(resolveVariant(latest.slug).v.slug, latest.slug);
  const byNumber = resolveVariant(String(latest.issue));
  assert.equal(byNumber.v.slug, `${latest.issue}-latest`, 'an issue number means its -latest variant');
  assert.match(byNumber.note, /using variant/);
  assert.equal(resolveVariant(`#${latest.issue}`).v.slug, `${latest.issue}-latest`);
  const onlyPinned = [{ slug: '1111111-pinned', issue: '1111111' }];
  assert.equal(resolveVariant('1111111', onlyPinned).v.slug, '1111111-pinned', 'no -latest: the -pinned one');
  assert.match(resolveVariant('9999999', all).error, /No variant is registered for issue 9999999.*new-issue\.mjs/);
  assert.match(resolveVariant(`${latest.issue}-lates`, all).error, new RegExp(`Did you mean .*${latest.issue}-latest`));
  assert.match(resolveVariant('', all).error, /Name a variant or an issue number/);
  const two = [{ slug: '2222222-a', issue: '2222222' }, { slug: '2222222-b', issue: '2222222' }];
  assert.match(resolveVariant('2222222', two).error, /several variants: 2222222-a, 2222222-b/);
});

test('a patch file changed after the site was built is reported as "does not match its patches" (cloud-bootstrap reapplies on it)', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'test-mr-'));
  after(() => fs.rmSync(root, { recursive: true, force: true }));
  const git = (cwd, ...a) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd, encoding: 'utf8' });
  const dir = path.join(root, 'env'), lab = path.join(root, 'lab');
  fs.mkdirSync(path.join(dir, 'core'), { recursive: true }); fs.mkdirSync(path.join(lab, 'p'), { recursive: true });
  git(dir, 'init', '-q', '-b', 'main'); fs.writeFileSync(path.join(dir, 'core/a.txt'), 'one\ntwo\nthree\n');
  git(dir, 'add', '.'); git(dir, 'commit', '-q', '-m', 'base');
  const patch = (word) => `diff --git a/core/a.txt b/core/a.txt\n--- a/core/a.txt\n+++ b/core/a.txt\n@@ -1,3 +1,3 @@\n one\n-two\n+${word}\n three\n`;
  fs.writeFileSync(path.join(lab, 'p/mr.patch'), patch('REVISION-1'));
  assert.equal(ensurePatches({ dir, labRoot: lab, patchPaths: ['p/mr.patch'], slug: 'zz', env: 'zz-env', side: 'after' }).status, 'applied');
  const states = () => ({ after: sideState(dir, lab, ['p/mr.patch']) });
  assert.equal(runBlockReason(states(), 'zz'), '', 'built and unchanged: nothing to do, setup.mjs can be skipped');
  fs.writeFileSync(path.join(lab, 'p/mr.patch'), patch('REVISION-2'));   // a newer MR revision arrives with `git pull`
  assert.match(runBlockReason(states(), 'zz'), /does not match its patches/);
});

test('test-mr.mjs: --help, an invented flag, an unknown issue, and dry runs that change nothing', () => {
  const help = cli(['--help']);
  assert.equal(help.status, 0); assert.match(help.stdout, /^Usage: node scripts\/test-mr\.mjs/);
  const invented = cli([String(latest.issue), '--force']);
  assert.equal(invented.status, 2); assert.match(invented.stderr, /Unknown option --force\. There is no such option/);
  const unknown = cli(['9999999', '--no-update']);
  assert.equal(unknown.status, 1); assert.match(unknown.stderr, /STOPPED: No variant is registered for issue 9999999/);

  const before = spawnSync('git', ['status', '--porcelain'], { cwd: labRoot, encoding: 'utf8' }).stdout;
  const local = cli([String(latest.issue), '--dry-run']);
  assert.equal(local.status, 0, local.stderr);
  assert.match(local.stdout, new RegExp(`using variant ${latest.issue}-latest`));
  assert.match(local.stdout, new RegExp(`Would run: node tools/compare/setup\\.mjs ${latest.issue}-latest`));
  assert.match(local.stdout, /Dry run finished; nothing was changed\./);
  const coder = cli([String(latest.issue), '--dry-run', '--no-update'], { ...noCoder, CODER_WORKSPACE_NAME: 'ws', CODER_WORKSPACE_OWNER_NAME: 'me', CODER_AGENT_URL: 'https://coder.example' });
  assert.equal(coder.status, 0, coder.stderr);
  assert.match(coder.stdout, new RegExp(`Would run: node scripts/cloud-bootstrap\\.mjs ${latest.issue}-latest --install-autostart --core-url=https://github\\.com/drupal/drupal\\.git`));
  assert.equal(spawnSync('git', ['status', '--porcelain'], { cwd: labRoot, encoding: 'utf8' }).stdout, before, 'a dry run leaves the checkout as it was');
});

test('DDEV names: parse `ddev list -j`, find the lab copy a folder is in, and report names another folder holds', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'test-mr-ddev-'));
  after(() => fs.rmSync(root, { recursive: true, force: true }));
  const first = path.join(root, 'drupal-core-lab'), second = path.join(first, 'drupal-core-lab');   // a clone made inside the first
  for (const d of [first, second]) { fs.mkdirSync(path.join(d, 'tools/compare'), { recursive: true }); fs.writeFileSync(path.join(d, 'tools/compare/variants.json'), '[]'); }
  fs.mkdirSync(path.join(first, 'envs/baseline-x'), { recursive: true });
  assert.equal(labCheckoutOf(path.join(first, 'envs/baseline-x')), first);
  assert.equal(labCheckoutOf(path.join(second, 'envs/not-built-yet')), second, 'a folder that does not exist yet still has a checkout above it');
  assert.equal(labCheckoutOf(root), '');

  const lines = ['{"level":"warning","msg":"a warning comes first"}', JSON.stringify({ level: 'info', raw: [
    { name: 'repro-baseline-x', approot: path.join(first, 'envs/baseline-x'), status: 'stopped' },
    { name: 'repro-issue-x', approot: path.join(root, 'elsewhere/envs/issue-x'), status: 'stopped' },
  ] })].join('\n');
  const projects = parseDdevList(lines);
  assert.equal(projects.length, 2); assert.deepEqual(parseDdevList('not json'), []);

  const wanted = (lab) => ['baseline-x', 'issue-x', 'other-x'].map((env) => ({ name: ddevName(env), dir: path.join(lab, 'envs', env) }));
  assert.deepEqual(ddevNameClashes(projects, wanted(first)).map((c) => [c.name, c.lab]), [['repro-issue-x', '']], 'its own folder is not a clash; one outside any lab copy is');
  assert.deepEqual(ddevNameClashes(projects, wanted(second)).map((c) => [c.name, c.lab]), [['repro-baseline-x', first], ['repro-issue-x', '']], 'from the clone inside: the first copy holds the name');
  assert.equal(ddevName('x'.repeat(80)).length, 60, 'the name setup.mjs gives to ddev config');
});

test('test-mr.mjs stops before building when another lab copy holds a DDEV name, and goes on when the names are its own', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'test-mr-clash-'));
  after(() => fs.rmSync(root, { recursive: true, force: true }));
  const other = path.join(root, 'drupal-core-lab'), bin = path.join(root, 'bin'), listFile = path.join(root, 'list.json');
  fs.mkdirSync(path.join(other, 'tools/compare'), { recursive: true }); fs.writeFileSync(path.join(other, 'tools/compare/variants.json'), '[]');
  fs.mkdirSync(path.join(other, 'envs', latest.before.env), { recursive: true }); fs.mkdirSync(bin);
  // A stand-in for ddev: `ddev list -j` prints the list file; anything else succeeds and does nothing.
  fs.writeFileSync(path.join(bin, 'ddev'), `#!/bin/sh\nif [ "$1" = list ]; then cat '${listFile}'; fi\nexit 0\n`, { mode: 0o755 });
  const env = { ...noCoder, PATH: `${bin}${path.delimiter}${process.env.PATH}` };
  const list = (raw) => fs.writeFileSync(listFile, `{"level":"warning","msg":"first"}\n${JSON.stringify({ level: 'info', raw })}\n`);

  list([{ name: ddevName(latest.before.env), approot: path.join(other, 'envs', latest.before.env), status: 'running' }]);
  const held = cli([String(latest.issue), '--dry-run', '--no-update'], env);
  assert.equal(held.status, 1, held.stdout);
  assert.match(held.stderr, new RegExp(`STOPPED: DDEV already has ${ddevName(latest.before.env)} at .*DDEV allows each project name once, and it belongs to the lab copy in ${other.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  assert.match(held.stderr, new RegExp(`Next: use that copy: cd .* && node scripts/test-mr\\.mjs ${latest.issue}`));
  assert.doesNotMatch(held.stdout, /Would run/, 'nothing is built');

  list([{ name: ddevName(latest.before.env), approot: envDir(latest.before.env), status: 'stopped' }]);
  const own = cli([String(latest.issue), '--dry-run', '--no-update'], env);
  assert.equal(own.status, 0, own.stderr);
  assert.match(own.stdout, /Would run: node tools\/compare\/setup\.mjs/);
});
