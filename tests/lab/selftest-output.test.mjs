// Tests for tools/compare/test-output.mjs, which scripts/selftest.mjs uses to read `node --test` TAP. The fixtures have the shape of
// real node 22 TAP from this lab's own failures (2026-11-26/27): a test FILE that could not load reports only "test failed", and
// its real exception is the `# ` lines printed BEFORE its `# Subtest:` line.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { testRunSummary, parseTap, CLASSES } from '../../tools/compare/test-output.mjs';

const ROOT = '/work/lab';
const okBlock = (n, name) => `# Subtest: ${name}\nok ${n} - ${name}\n  ---\n  duration_ms: 0.1\n  type: 'test'\n  ...\n`;
const counts = (pass, fail) => `1..${pass + fail}\n# tests ${pass + fail}\n# pass ${pass}\n# fail ${fail}\n`;

// The unpublished-speech case: jsdom/Guidepup not installed, so the file never registered a test.
const MISSING_MODULE = `${okBlock(1, 'forced-colour triangles need a Canvas half')}# node:internal/modules/package_json_reader:314
#   throw new ERR_MODULE_NOT_FOUND(packageName, fileURLToPath(base), null);
#         ^
# Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@guidepup/virtual-screen-reader' imported from ${ROOT}/tools/playwright/lib/unpublished-speech.mjs
#     at Object.getPackageJSONURL (node:internal/modules/package_json_reader:314:9)
#     at ModuleJob._link (node:internal/modules/esm/module_job:182:49) {
#   code: 'ERR_MODULE_NOT_FOUND'
# }
# Node.js v22.21.1
# Subtest: tests/lab/unpublished-speech.test.mjs
not ok 2 - tests/lab/unpublished-speech.test.mjs
  ---
  duration_ms: 43.1
  type: 'test'
  location: '${ROOT}/tests/lab/unpublished-speech.test.mjs:1:1'
  failureType: 'testCodeFailure'
  exitCode: 1
  signal: ~
  error: 'test failed'
  code: 'ERR_TEST_FAILURE'
  ...
${counts(1, 1)}`;

test('a file that could not load keeps its root exception: class, missing package, importer, rerun and fix', () => {
  const r = testRunSummary({ status: 1, stdout: MISSING_MODULE }, { root: ROOT });
  assert.equal(r.ok, false); assert.equal(r.failed, 1);
  const [f] = r.failures;
  assert.equal(f.class, 'MISSING_DEPENDENCY');
  assert.equal(f.errorType, 'Error'); assert.equal(f.code, 'ERR_MODULE_NOT_FOUND');
  assert.equal(f.message, `Cannot find package '@guidepup/virtual-screen-reader' imported from ${ROOT}/tools/playwright/lib/unpublished-speech.mjs`);
  assert.equal(f.missing, '@guidepup/virtual-screen-reader');
  assert.equal(f.importer, 'tools/playwright/lib/unpublished-speech.mjs');
  assert.equal(f.file, 'tests/lab/unpublished-speech.test.mjs'); assert.equal(f.scope, 'file did not run');
  assert.equal(f.rerun, 'node --test tests/lab/unpublished-speech.test.mjs');
  assert.match(f.fix, /PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci --prefix tools\/playwright/);
  assert.match(r.detail, /^1 passed, 1 failed:\nby class: MISSING_DEPENDENCY 1\n\[MISSING_DEPENDENCY\] tests\/lab\/unpublished-speech\.test\.mjs \(file did not run\)/);
  assert.doesNotMatch(r.detail, /test failed/, 'node\'s placeholder is not the message');
});

test('an assertion keeps its file, line, expected and actual; "X is not installed" names the package; the rerun selects one test', () => {
  const tap = `# Subtest: usage-baseline: composition adds up (a \\# in the name)
not ok 3 - usage-baseline: composition adds up (a \\# in the name)
  ---
  duration_ms: 43.2
  type: 'test'
  location: '${ROOT}/tests/lab/ai-usage.test.mjs:31:1'
  failureType: 'testCodeFailure'
  error: |-
    js-yaml is not installed. Run: npm install --prefix tools/compare/.deps js-yaml@4

    2 !== 0
  code: 'ERR_ASSERTION'
  name: 'AssertionError'
  expected: 0
  actual: 2
  operator: 'strictEqual'
  stack: |-
    TestContext.<anonymous> (file://${ROOT}/tests/lab/ai-usage.test.mjs:33:73)
  ...
${counts(4, 1)}`;
  const [f] = testRunSummary({ status: 1, stdout: tap }, { root: ROOT }).failures;
  assert.equal(f.name, 'usage-baseline: composition adds up (a # in the name)', 'the test name, not the YAML error name');
  assert.deepEqual([f.class, f.file, f.line, f.errorType, f.expected, f.actual, f.missing], ['MISSING_DEPENDENCY', 'tests/lab/ai-usage.test.mjs', 31, 'AssertionError', '0', '2', 'js-yaml']);
  assert.equal(f.rerun, "node --test --test-name-pattern='^usage-baseline: composition adds up \\(a # in the name\\)$' tests/lab/ai-usage.test.mjs");
  assert.match(f.fix, /npm install --no-save --prefix tools\/compare\/\.deps js-yaml@4/);
});

test('a sandbox that forbids local ports, a hermetic refusal, a syntax error and a timeout each get their own class', () => {
  const block = (n, name, body) => `# Subtest: ${name}\nnot ok ${n} - ${name}\n  ---\n  location: '${ROOT}/tests/lab/x.test.mjs:${n}:1'\n${body}\n  ...\n`;
  const tap = block(1, 'listens', "  failureType: 'uncaughtException'\n  error: 'listen EPERM: operation not permitted 127.0.0.1'\n  code: 'EPERM'")
    + block(2, 'asks ddev', "  failureType: 'testCodeFailure'\n  error: |-\n    HERMETIC: the static self-test does not run ddev (called: ddev list -j). Give the test its own stand-in.\n  name: 'AssertionError'\n  code: 'ERR_ASSERTION'")
    + block(3, 'fetches', "  error: 'HERMETIC: the static self-test refused a connection to git.drupalcode.org:443 (only this machine...'\n  code: 'EHERMETIC'")
    + `# file://${ROOT}/tests/lab/broken.test.mjs:12\n#   const x = ;\n#             ^\n# SyntaxError: Unexpected token ';'\n` + `# Subtest: tests/lab/broken.test.mjs\nnot ok 4 - tests/lab/broken.test.mjs\n  ---\n  location: '${ROOT}/tests/lab/broken.test.mjs:1:1'\n  error: 'test failed'\n  ...\n`
    + block(5, 'hangs', "  failureType: 'cancelledByParent'\n  error: 'test did not finish before its parent and was cancelled'")
    + block(6, 'spawns', "  error: 'spawn glab ENOENT'\n  code: 'ENOENT'")
    + counts(0, 6);
  const fs6 = testRunSummary({ status: 1, stdout: tap }, { root: ROOT }).failures;
  assert.deepEqual(fs6.map((f) => f.class), ['PERMISSION', 'LIVE_INFRASTRUCTURE', 'LIVE_INFRASTRUCTURE', 'SYNTAX', 'TIMEOUT', 'MISSING_EXECUTABLE']);
  assert.match(fs6[0].fix, /may not use local ports here.*not a lab failure/);
  assert.equal(fs6[1].executable, 'ddev'); assert.match(fs6[1].fix, /stand-in .*never stop or unlist DDEV projects/);
  assert.equal(fs6[2].host, 'git.drupalcode.org:443');
  assert.deepEqual([fs6[3].file, fs6[3].line, fs6[3].message, fs6[3].fix], ['tests/lab/broken.test.mjs', 12, "Unexpected token ';'", 'node --check tests/lab/broken.test.mjs']);
  assert.equal(fs6[5].executable, 'glab');
  for (const f of fs6) assert.ok(CLASSES.includes(f.class));
});

test('a nested failure is explained by its own error, not the parent\'s "1 subtest failed"', () => {
  const tap = `# Subtest: parent
    # Subtest: child one
    not ok 1 - child one
      ---
      location: '${ROOT}/tests/lab/n.test.mjs:5:3'
      error: 'boom'
      name: 'TypeError'
      ...
    1..1
not ok 1 - parent
  ---
  location: '${ROOT}/tests/lab/n.test.mjs:3:1'
  error: '1 subtest failed'
  ...
${counts(0, 1)}`;
  const [f] = parseTap(tap).failures; assert.equal(f.nested.length, 1);
  const [d] = testRunSummary({ status: 1, stdout: tap }, { root: ROOT }).failures;
  assert.deepEqual([d.class, d.errorType, d.message], ['ERROR', 'TypeError', 'boom']);
  assert.match(d.rerun, /--test-name-pattern='\^child one\$'/);
});

test('success stays one line; a missing summary is never a pass; a crash without TAP keeps stderr and the process error', () => {
  const ok = testRunSummary({ status: 0, stdout: `${okBlock(1, 'a')}${counts(7, 0)}` });
  assert.deepEqual([ok.ok, ok.detail, ok.failures], [true, '7 passed, 0 failed', []]);
  assert.equal(testRunSummary({ status: 0, stdout: '' }).ok, false);
  const crash = testRunSummary({ status: null, stdout: '', stderr: 'module not found', error: { message: 'timeout' }, signal: 'SIGTERM' });
  assert.equal(crash.ok, false); assert.match(crash.detail, /timeout/); assert.match(crash.detail, /module not found/); assert.match(crash.detail, /signal SIGTERM/);
});

test('against real node output: a broken import is classified, and the printed rerun command runs exactly that file', () => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'lab-tap-'))); after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'a.test.mjs'), "import test from 'node:test';\ntest('fine', () => {});\n");
  fs.writeFileSync(path.join(dir, 'b.test.mjs'), "import 'lab-no-such-package-zz';\n");
  const run = (args) => spawnSync(process.execPath, ['--test', '--test-reporter=tap', '--test-concurrency=1', ...args], { cwd: dir, encoding: 'utf8', env: Object.fromEntries(Object.entries(process.env).filter(([k]) => k !== 'NODE_TEST_CONTEXT')) });   // inside a test, that variable makes a child runner talk to its parent instead of printing TAP
  const r = testRunSummary(run(['a.test.mjs', 'b.test.mjs']), { root: dir });
  assert.equal(r.failed, 1);
  assert.deepEqual([r.failures[0].class, r.failures[0].missing, r.failures[0].rerun], ['MISSING_DEPENDENCY', 'lab-no-such-package-zz', 'node --test b.test.mjs']);
  assert.match(r.failures[0].fix, /not a package the lab lists/);
  const again = run([r.failures[0].rerun.split(' ').pop()]);
  assert.match(again.stdout, /^# tests 1$/m);
});
