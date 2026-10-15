// Tests for tools/compare/lint-contrib.mjs: which contrib files get which check, and what an empty or failed check is called (AI-usage Phase 5).
// No DDEV: only the pure parts. The PHPCS run itself was checked live (see reports/ai-usage/phase-5). Run: node --test tests/lab/lint-contrib.test.mjs
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { contribFileList, classify, phpcsScript, verdict, PHPCS_EXT } from '../../tools/compare/lint-contrib.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lint-contrib-test-')); after(() => fs.rmSync(root, { recursive: true, force: true }));
const lab = path.join(root, 'lab'), dir = path.join(root, 'env');
const put = (f, text) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); };
const diffFor = (...files) => files.map((f) => `diff --git a/${f} b/${f}\n--- a/${f}\n+++ b/${f}\n@@ -1 +1 @@\n-a\n+b\n`).join('');

test('the files a contrib patch changes become checkout paths under modules/contrib/<module>, once each', () => {
  put(path.join(lab, 'p/one.patch'), diffFor('src/A.php', 'css/a.css')); put(path.join(lab, 'p/two.patch'), diffFor('src/A.php', 'toolbar.module'));
  for (const f of ['src/A.php', 'css/a.css', 'toolbar.module']) put(path.join(dir, 'modules/contrib/toolbar', f), 'x');
  const l = contribFileList([{ module: 'toolbar', patch: 'p/one.patch' }, { module: 'toolbar', patch: 'p/two.patch' }], lab, dir);
  assert.deepEqual(l.map((x) => x.file), ['modules/contrib/toolbar/src/A.php', 'modules/contrib/toolbar/css/a.css', 'modules/contrib/toolbar/toolbar.module']);
  assert.deepEqual(l.map((x) => x.ext), ['php', 'css', 'module']); assert.ok(l.every((x) => x.exists));
});

test('PHP-family files go to PHPCS; every other type is listed as not checked; a file the checkout lacks is reported, not skipped', () => {
  put(path.join(lab, 'p/m.patch'), diffFor('src/A.php', 'm.install', 'js/x.js', 'config/c.yml', 'templates/t.html.twig', 'README.md', 'gone.php'));
  for (const f of ['src/A.php', 'm.install', 'js/x.js', 'config/c.yml', 'templates/t.html.twig', 'README.md']) put(path.join(dir, 'modules/contrib/m', f), 'x');
  const c = classify(contribFileList([{ module: 'm', patch: 'p/m.patch' }], lab, dir));
  assert.deepEqual(c.php, ['modules/contrib/m/src/A.php', 'modules/contrib/m/m.install']);
  assert.deepEqual(Object.keys(c.other).sort(), ['js', 'md', 'twig', 'yml']); assert.deepEqual(c.missing, ['modules/contrib/m/gone.php']);
  assert.ok(PHPCS_EXT.includes('module') && PHPCS_EXT.includes('install') && !PHPCS_EXT.includes('css'));
});

test('a deleted file has nothing to check and does not appear', () => {
  put(path.join(lab, 'p/d.patch'), 'diff --git a/src/Old.php b/src/Old.php\ndeleted file mode 100644\n--- a/src/Old.php\n+++ /dev/null\n@@ -1 +0,0 @@\n-x\n');
  assert.deepEqual(contribFileList([{ module: 'm', patch: 'p/d.patch' }], lab, dir), []);
});

test('the PHPCS command quotes every path, uses the Drupal standards, and ends options with --', () => {
  const s = phpcsScript(['modules/contrib/m/src/A b.php', "modules/contrib/m/it's.php"]);
  assert.match(s, /^vendor\/bin\/phpcs --standard=Drupal,DrupalPractice --extensions=php,module,inc,install,theme,profile,test,engine -- /);
  assert.ok(s.includes("'modules/contrib/m/src/A b.php'")); assert.ok(s.includes(`'modules/contrib/m/it'\\''s.php'`));
});

test('no PHP file means NOTHING CHECKED, never a pass; exit codes map to PASS, FAIL, ERROR', () => {
  assert.equal(verdict(0, 0), 'NOTHING CHECKED'); assert.equal(verdict(0, 1), 'NOTHING CHECKED');
  assert.equal(verdict(2, 0), 'PASS'); assert.equal(verdict(2, 1), 'FAIL'); assert.equal(verdict(2, 2), 'FAIL'); assert.equal(verdict(2, 3), 'ERROR'); assert.equal(verdict(2, 127), 'ERROR');
});
