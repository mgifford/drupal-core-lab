// Tests for scripts/try-tests.mjs: reading PHPUnit, PHPCS and PHPStan output (fixture strings), the Before/After verdicts, and the
// script itself against a fake `ddev` (no Docker). The fake runs show that the copied test files are removed on every way out.
// Run: node --test tests/lab/*.test.mjs
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot } from '../../tools/compare/lib.mjs';
import { parsePhpunit, summaryLine, testMethods, methodStatus, verdictFor, verdictExisting, classifyLint, renderTable, renderMarkdownTable, stripAnsi } from '../../tools/compare/phpunit-output.mjs';

// Output copied in shape from reports/issues/3604037/phpunit/ (colours included: PHPUnit writes them even without a terminal).
const C = 'Drupal\\FunctionalJavascriptTests\\Core\\Form\\FormGroupingElementsTest';
const FAILED = `Clearing old webdriver sessions
PHPUnit 12.5.34 by Sebastian Bergmann and contributors.

Runtime:       PHP 8.5.7
Configuration: /var/www/html/core/phpunit.xml

..EFE                                                               5 / 5 (100%)

HTML output was generated.
http://web/sites/simpletest/browser_output/Drupal_FunctionalJavascriptTests_Core_Form_FormGroupingElementsTest-1-32220901.html

Time: 00:32.035, Memory: 10.00 MB

There were 2 errors:

1) ${C}::testVerticalTabValidationVisibility
Error: Call to a member function getText() on null

/var/www/html/core/tests/Drupal/FunctionalJavascriptTests/Core/Form/FormGroupingElementsTest.php:171

2) ${C}::testDetailsContainsRequiredTextfieldAjaxForm
WebDriver\\Exception\\StaleElementReference: stale element reference: stale element not found
  (Session info: chrome=143.0.7499.169)

--

There was 1 failure:

1) ${C}::testDetailsContainsRequiredTextfield
Failed asserting that null matches expected '2'.

/var/www/html/core/tests/Drupal/FunctionalJavascriptTests/Core/Form/FormGroupingElementsTest.php:213

\x1b[37;41mERRORS!\x1b[0m
\x1b[37;41mTests: 5\x1b[0m\x1b[37;41m, Assertions: 38\x1b[0m\x1b[37;41m, Errors: 2\x1b[0m\x1b[37;41m, Failures: 1\x1b[0m\x1b[37;41m.\x1b[0m
Failed to run phpunit core/tests/Drupal/FunctionalJavascriptTests/Core/Form/FormGroupingElementsTest.php: exit status 2
`;
const PASSED = `PHPUnit 12.5.34 by Sebastian Bergmann and contributors.\n\n.....  5 / 5 (100%)\n\nTime: 00:21.5, Memory: 10.00 MB\n\n\x1b[30;42mOK (5 tests, 48 assertions)\x1b[0m\n`;

test('a failed run is read: totals, each numbered item, first message line, versions', () => {
  const p = parsePhpunit(FAILED);
  assert.equal(p.ok, false); assert.equal(p.tests, 5); assert.equal(p.assertions, 38);
  assert.deepEqual(p.counts, { Errors: 2, Failures: 1 });
  assert.deepEqual(p.problems.map((x) => `${x.kind} ${x.method}`), ['ERROR testVerticalTabValidationVisibility', 'ERROR testDetailsContainsRequiredTextfieldAjaxForm', 'FAIL testDetailsContainsRequiredTextfield']);
  assert.equal(p.problems[0].message, 'Error: Call to a member function getText() on null');
  assert.equal(p.problems[2].message, "Failed asserting that null matches expected '2'.");
  assert.equal(p.phpunit, '12.5.34'); assert.equal(p.php, '8.5.7'); assert.equal(p.time, '00:32.035');
  assert.equal(summaryLine(p), 'Tests: 5, Assertions: 38, Errors: 2, Failures: 1');
});

test('a passing run is read, with or without colour codes', () => {
  for (const text of [PASSED, stripAnsi(PASSED)]) { const p = parsePhpunit(text); assert.equal(p.ok, true); assert.equal(p.tests, 5); assert.equal(p.assertions, 48); assert.deepEqual(p.problems, []); }
  assert.equal(summaryLine(parsePhpunit(PASSED)), 'OK (5 tests, 48 assertions)');
  assert.equal(summaryLine(parsePhpunit('OK (1 test, 1 assertion)')), 'OK (1 test, 1 assertion)');
});

test('"OK, but there were issues" is a pass; a skipped test is not a failure', () => {
  const p = parsePhpunit(`There was 1 skipped test:\n\n1) A\\B\\FooTest::testSkipped\nNo browser.\n\nOK, but there were issues!\nTests: 3, Assertions: 5, Skipped: 1.\n`);
  assert.equal(p.ok, true); assert.deepEqual(p.counts, { Skipped: 1 });
  assert.equal(methodStatus(p, 'FooTest', 'testSkipped'), 'skip'); assert.equal(methodStatus(p, 'FooTest', 'testOther'), 'pass');
  assert.equal(parsePhpunit('Tests: 1, Assertions: 1, Failures: 1.').ok, false);
});

test('a data-set failure is named by its method; deprecation sections are not tests', () => {
  const p = parsePhpunit(`There was 1 failure:\n\n1) A\\B\\FooTest::testSizes with data set "big" (1024)\nFailed asserting that 1 is 2.\n\n1 test triggered 1 deprecation:\n\n1) /var/www/html/core/lib/X.php:41\nOld thing.\n\nFAILURES!\nTests: 4, Assertions: 4, Failures: 1, Deprecations: 1.\n`);
  assert.deepEqual(p.problems.map((x) => x.method), ['testSizes']); assert.equal(methodStatus(p, 'FooTest', 'testSizes'), 'FAIL');
  assert.equal(methodStatus(p, 'OtherTest', 'testSizes'), 'pass');
});

test('output with no result is a crash, never a pass (negative control)', () => {
  for (const text of ['', 'Clearing old webdriver sessions\nPHP Fatal error:  Uncaught Error: Class "X" not found in /var/www/html/a.php:3\nFailed to run phpunit a.php: exit status 255\n', 'No tests executed!\n']) {
    const p = parsePhpunit(text); assert.equal(p.ok, null, text); assert.equal(methodStatus(p, 'FooTest', 'testA'), 'crash');
  }
  assert.match(parsePhpunit('Clearing old webdriver sessions\nPHP Fatal error:  Uncaught Error: Class "X" not found\n').detail, /Class "X" not found/);
  assert.match(summaryLine(parsePhpunit('')), /^no result/);
});

test('test methods: public test* and #[Test], not helpers', () => {
  const php = `<?php
class FooTest {
  public function testA(): void {}
  function testB() {}
  protected function testHelper() {}
  public function helper() {}
  #[Test]
  public function usesAttribute(): void {}
  /**
   * Doc.
   */
  #[DataProvider('p')]
  public function testWithProvider(int $x): void {}
  public function notATest() {}
}`;
  assert.deepEqual(testMethods(php), ['testA', 'testB', 'usesAttribute', 'testWithProvider']);
});

test('the verdict of a Before/After pair, all cases', () => {
  const k = (b, a) => verdictFor(b, a).kind;
  assert.equal(k('FAIL', 'pass'), 'useful'); assert.equal(k('ERROR', 'pass'), 'useful'); assert.equal(k('crash', 'pass'), 'useful');
  assert.equal(k('pass', 'pass'), 'guard'); assert.equal(k('pass', 'risky'), 'guard');
  assert.equal(k('FAIL', 'FAIL'), 'both-fail'); assert.equal(k('pass', 'FAIL'), 'only-before');
  assert.equal(k('skip', 'pass'), 'not-run'); assert.match(verdictFor('pass', 'skip').text, /skipped on After/);
  assert.deepEqual([verdictFor('FAIL', 'pass').problem, verdictFor('pass', 'pass').problem, verdictFor('FAIL', 'FAIL').problem, verdictFor('pass', 'FAIL').problem], [false, false, true, true]);
  assert.equal(verdictFor('FAIL', 'pass').text, 'fails without the change, passes with it');
  assert.equal(verdictFor('pass', 'pass').text, 'passes on both (regression guard)');
});

test('an existing test is a problem only when it fails on After and not on Before', () => {
  const ok = parsePhpunit(PASSED), bad = parsePhpunit(FAILED), crash = parsePhpunit('');
  assert.equal(verdictExisting(ok, ok).kind, 'same-pass');
  assert.equal(verdictExisting(ok, bad).kind, 'regression'); assert.equal(verdictExisting(ok, crash).kind, 'regression');
  assert.equal(verdictExisting(bad, ok).kind, 'fixed');
  assert.equal(verdictExisting(bad, bad).kind, 'same-fail'); assert.equal(verdictExisting(bad, bad).problem, false);
  const one = parsePhpunit(`There was 1 failure:\n\n1) ${C}::testDetailsContainsRequiredTextfield\nFailed.\n\nFAILURES!\nTests: 5, Assertions: 38, Failures: 1.\n`);
  assert.equal(verdictExisting(one, bad).kind, 'regression');   // the same file fails on both, but After fails two more tests
  assert.equal(verdictExisting(bad, one).kind, 'same-fail');
});

// Real output of this lab's own run (a probe file with style and typing mistakes), colour codes and padding included.
const PHPCS_FAIL = `\nFILE: /var/www/html/core/modules/file/tests/src/Probe/LabLintProbe.php\n--------------------------------------------------------------------------------\nFOUND 3 ERRORS AND 1 WARNING AFFECTING 4 LINES\n--------------------------------------------------------------------------------\n 1 | ERROR   | [x] Missing declare(strict_types=1).\n 3 | ERROR   | [ ] Missing class doc comment\n 7 | ERROR   | [x] The closing brace for the class must have an empty line before\n   |         |     it\n 9 | WARNING | [ ] Line exceeds 80 characters; contains 85 characters\n--------------------------------------------------------------------------------\n`;
const PHPSTAN_FAIL = ` ------ ----------------------------------------------------------------------- \n  Line   LabLintProbe.php                                                       \n ------ ----------------------------------------------------------------------- \n  4      Method Drupal\\Tests\\file\\Probe\\LabLintProbe::bad() has no return type  \n         specified.                                                             \n         \u{1FAAA}  missingType.return                                                 \n  5      Call to an undefined method                                            \n         Drupal\\Tests\\file\\Probe\\LabLintProbe::doesNotExist().                  \n         \u{1FAAA}  method.notFound                                                    \n ------ ----------------------------------------------------------------------- \n\n\n [ERROR] Found 2 errors                                                         \n\n\x1b[31mFailed to execute command \`php ...\`: exit status 1\x1b[0m\n`;

test('PHPCS and PHPStan: clean, findings, and a tool that did not run', () => {
  assert.deepEqual(classifyLint('phpcs', 0, ''), { result: 'clean', lines: [] });
  assert.deepEqual(classifyLint('phpstan', 0, ' [OK] No errors'), { result: 'clean', lines: [] });
  const cs = 'core/modules/file/tests/src/Probe/LabLintProbe.php';
  assert.deepEqual(classifyLint('phpcs', 2, PHPCS_FAIL).lines, [`${cs}:1 error Missing declare(strict_types=1).`, `${cs}:3 error Missing class doc comment`, `${cs}:7 error The closing brace for the class must have an empty line before it`, `${cs}:9 warning Line exceeds 80 characters; contains 85 characters`]);
  assert.deepEqual(classifyLint('phpstan', 1, PHPSTAN_FAIL, [cs]), { result: 'FAIL', lines: [`${cs}:4 Method Drupal\\Tests\\file\\Probe\\LabLintProbe::bad() has no return type specified.`, `${cs}:5 Call to an undefined method Drupal\\Tests\\file\\Probe\\LabLintProbe::doesNotExist().`] });
  assert.equal(classifyLint('phpstan', 1, PHPSTAN_FAIL).lines[0].split(':')[0], 'LabLintProbe.php');   // without the file list, the name as shown
  for (const [tool, text] of [['phpstan', 'PHPStan process crashed because it reached configured PHP memory limit: 128M\n'], ['phpcs', 'bash: vendor/bin/phpcs: No such file or directory\n']]) {
    const r = classifyLint(tool, 255, text); assert.equal(r.result, 'ERROR', tool); assert.ok(r.lines[0].length > 0);
  }
  assert.equal(classifyLint('phpcs', 1, '').result, 'ERROR');   // a failing exit code with no finding is not a result about the files
});

test('tables line up and escape pipes', () => {
  assert.equal(renderTable(['A', 'Bb'], [['xxx', 'y'], ['z', 'w']]), 'A    Bb\nxxx  y\nz    w');
  assert.equal(renderMarkdownTable(['A', 'B'], [['a|b', 'c']]), '| A | B |\n| --- | --- |\n| a\\|b | c |');
});

// The script itself, against a fake `ddev` and two fake environments (envs/zz-try-before, envs/zz-try-after), no Docker.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'try-tests-test-'));
const issueDir = path.join(labRoot, 'reports/issues/99000002'), envsDir = path.join(labRoot, 'envs');
const envPath = (n) => path.join(envsDir, `zz-try-${n}`);
const git = (cwd, ...a) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd, encoding: 'utf8' });
const reset = () => { for (const d of [issueDir, envPath('before'), envPath('after')]) fs.rmSync(d, { recursive: true, force: true }); };
after(() => { reset(); fs.rmSync(tmp, { recursive: true, force: true }); });
reset();
fs.mkdirSync(issueDir, { recursive: true });
fs.writeFileSync(path.join(issueDir, 'variants.json'), JSON.stringify([{ slug: 'zz-try', issue: '99000002', core: { ref: 'main' }, before: { env: 'zz-try-before' }, after: { env: 'zz-try-after', patches: [] } }]));
for (const n of ['before', 'after']) {
  fs.mkdirSync(path.join(envPath(n), '.ddev'), { recursive: true }); fs.writeFileSync(path.join(envPath(n), '.ddev/config.yaml'), '');
  fs.mkdirSync(path.join(envPath(n), 'core'), { recursive: true }); fs.writeFileSync(path.join(envPath(n), 'core/README.txt'), 'x\n');
  git(envPath(n), 'init', '-q'); git(envPath(n), 'add', 'core/README.txt'); git(envPath(n), 'commit', '-q', '-m', 'x');
}
const bin = path.join(tmp, 'bin'); fs.mkdirSync(bin);
// TRY_MODE: normal (Before fails testB, After passes), both-fail, die (the run is killed while the tests run)
fs.writeFileSync(path.join(bin, 'ddev'), `#!/bin/sh
case "$1" in
  describe) echo '{"raw":{"status":"running"}}' ;;
  exec) exit 0 ;;
  phpunit)
    [ "$TRY_MODE" = die ] && { kill -TERM $PPID; sleep 5; exit 1; }
    case "$(pwd)" in
      *zz-try-before) printf 'There was 1 failure:\\n\\n1) Drupal\\\\Tests\\\\zz\\\\ZzTryTest::testB\\nFailed asserting that false is true.\\n\\nFAILURES!\\nTests: 2, Assertions: 3, Failures: 1.\\n'; exit 1 ;;
      *) if [ "$TRY_MODE" = both-fail ]; then printf 'There was 1 failure:\\n\\n1) Drupal\\\\Tests\\\\zz\\\\ZzTryTest::testB\\nStill failing.\\n\\nFAILURES!\\nTests: 2, Assertions: 3, Failures: 1.\\n'; exit 1; else echo 'OK (2 tests, 4 assertions)'; fi ;;
    esac ;;
esac
`, { mode: 0o755 });
const proposal = path.join(tmp, 'proposal'), rel = 'core/modules/zz/tests/src/ZzTryTest.php';
fs.mkdirSync(path.join(proposal, path.dirname(rel)), { recursive: true });
fs.writeFileSync(path.join(proposal, rel), '<?php\nclass ZzTryTest {\n  public function testA() {}\n  public function testB() {}\n  protected function testHelper() {}\n}\n');
const tryTests = (mode, ...extra) => spawnSync('node', [path.join(labRoot, 'scripts/try-tests.mjs'), 'zz-try', proposal, ...extra], { cwd: labRoot, encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, TRY_MODE: mode } });
const untouched = () => { for (const n of ['before', 'after']) { assert.equal(fs.existsSync(path.join(envPath(n), rel)), false, `${n}: the copy is still there`); assert.equal(fs.existsSync(path.join(envPath(n), 'core/modules')), false, `${n}: the folder it made is still there`); assert.equal(git(envPath(n), 'status', '--short', '--untracked-files=no').stdout.trim(), '', `${n}: git status is not clean`); } };

test('the script: a test that fails Before and passes After, copies removed, patch written', () => {
  const patchFile = path.join(tmp, 'out', 'p.patch'), reportFile = path.join(tmp, 'out', 'r.md');
  const r = tryTests('normal', '--patch-out', patchFile, '--report', reportFile);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /ZzTryTest::testB\s+FAIL\s+pass\s+fails without the change, passes with it/);
  assert.match(r.stdout, /ZzTryTest::testA\s+pass\s+pass\s+passes on both \(regression guard\)/);
  assert.doesNotMatch(r.stdout, /testHelper/);
  assert.match(r.stdout, /PHPCS: clean\nPHPStan: clean/); assert.match(r.stdout, /Result: nothing to flag/);
  assert.match(r.stdout, /zz-try-before: tracked files unchanged \(clean\)/);
  untouched();
  const patch = fs.readFileSync(patchFile, 'utf8');
  assert.match(patch, new RegExp(`^diff --git a/${rel} b/${rel}\nnew file mode 100644\nindex 0000000\\.\\.[0-9a-f]{7}\n--- /dev/null\n\\+\\+\\+ b/${rel}\n@@ -0,0 \\+1,6 @@\n`));
  assert.match(fs.readFileSync(reportFile, 'utf8'), /^# Tests tried: zz-try[\s\S]*\| ZzTryTest::testB \| FAIL \| pass \| fails without the change, passes with it \|/);
});

test('the script: a test that fails on both sides is flagged and the exit code says so', () => {
  const r = tryTests('both-fail');
  assert.equal(r.status, 1, r.stdout); assert.match(r.stdout, /ZzTryTest::testB\s+FAIL\s+FAIL\s+PROBLEM: fails on both/); assert.match(r.stdout, /Result: PROBLEMS/);
  assert.match(r.stdout, /Before ZzTryTest::testB: Failed asserting that false is true\./);
  untouched();
});

test('the script: killed while the tests run, it still removes the copies (negative control for the cleanup)', () => {
  const r = tryTests('die');
  assert.equal(r.status, 130, r.stdout + r.stderr);
  untouched();
});

test('the script: a file that already exists in a checkout is never overwritten or removed', () => {
  const mine = path.join(envPath('before'), rel); fs.mkdirSync(path.dirname(mine), { recursive: true }); fs.writeFileSync(mine, 'mine\n');
  const r = tryTests('normal');
  assert.equal(r.status, 3, r.stdout); assert.match(r.stderr, /already exists in zz-try-before/);
  assert.equal(fs.readFileSync(mine, 'utf8'), 'mine\n'); assert.equal(fs.existsSync(path.join(envPath('after'), rel)), false);
  fs.rmSync(path.join(envPath('before'), 'core/modules'), { recursive: true, force: true });
});

test('the script: usage errors, a missing path and a path without core/ stop before anything is copied', () => {
  const run = (...a) => spawnSync('node', [path.join(labRoot, 'scripts/try-tests.mjs'), ...a], { cwd: labRoot, encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}` } });
  assert.equal(run().status, 2); assert.equal(run('zz-try').status, 2); assert.equal(run('no-such-variant', proposal).status, 2);
  assert.equal(run('zz-try', proposal, '--bogus').status, 2); assert.equal(run('zz-try', '--existing', 'core/x.php', '--patch-out', path.join(tmp, 'q.patch')).status, 2);
  assert.equal(run('zz-try', path.join(tmp, 'missing')).status, 3);
  const noCore = path.join(tmp, 'nocore'); fs.mkdirSync(noCore); fs.writeFileSync(path.join(noCore, 'ZzTryTest.php'), '<?php\n');
  const r = run('zz-try', noCore); assert.equal(r.status, 3); assert.match(r.stderr, /no core\/ folder/);
  untouched();
});
