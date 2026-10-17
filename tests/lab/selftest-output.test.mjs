import test from 'node:test';
import assert from 'node:assert/strict';
import { testRunSummary } from '../../tools/compare/test-output.mjs';
test('selftest uses TAP counts and retains assertion diagnostics', () => {
  const result = testRunSummary({ status: 1, stdout: "# Subtest: example\nnot ok 1 - example\n  error: missing dependency\n# pass 2\n# fail 1\n", stderr: '' });
  assert.equal(result.ok, false); assert.match(result.detail, /2 passed, 1 failed/); assert.match(result.detail, /missing dependency/);
});
test('selftest reports stderr and process errors when there is no TAP summary', () => {
  const result = testRunSummary({ status: null, stdout: '', stderr: 'module not found', error: { message: 'timeout' }, signal: 'SIGTERM' });
  assert.equal(result.ok, false); assert.match(result.detail, /timeout/); assert.match(result.detail, /module not found/);
});
test('selftest accepts complete successful TAP, never treats missing summary as a pass', () => {
  assert.equal(testRunSummary({ status: 0, stdout: '# pass 7\n# fail 0\n' }).ok, true);
  assert.equal(testRunSummary({ status: 0, stdout: '' }).ok, false);
});
