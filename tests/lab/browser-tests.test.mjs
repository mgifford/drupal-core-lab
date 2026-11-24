// Browser-test detection is pure: a FunctionalJavascript path or WebDriverTestBase content needs Chrome; Kernel/Unit does not.
import test from 'node:test';
import assert from 'node:assert/strict';
import { needsChrome, chromeContainerName } from '../../tools/compare/browser-tests.mjs';

test('FunctionalJavascript paths and WebDriverTestBase content need Chrome', () => {
  assert.equal(needsChrome({ paths: ['core/modules/file/tests/src/FunctionalJavascript/ManagedFileTest.php'] }), true);
  assert.equal(needsChrome({ contents: ['class X extends WebDriverTestBase { }'] }), true);
  assert.equal(needsChrome({ contents: ['class X extends FunctionalJavascriptTestBase { }'] }), true);
});

test('Kernel, Unit and ordinary Functional tests do not trigger Chrome', () => {
  assert.equal(needsChrome({ paths: ['core/modules/file/tests/src/Kernel/ManagedFileTest.php'] }), false);
  assert.equal(needsChrome({ paths: ['core/modules/file/tests/src/Unit/ManagedFileTest.php'] }), false);
  assert.equal(needsChrome({ paths: ['core/modules/file/tests/src/Functional/ManagedFileTest.php'] }), false);
  assert.equal(needsChrome({}), false);
});

test('the add-on Chrome name follows the environment name', () => {
  assert.equal(chromeContainerName('issue-3619127-vanilla'), 'ddev-repro-issue-3619127-vanilla-chrome');
  assert.equal(chromeContainerName('baseline-main'), 'ddev-repro-baseline-main-chrome');
});
