// The lab-owned DDEV override: exclude node_modules from Mutagen, keep the add-on's .ddev/tmp, and never move the SQLite
// database in sites/default/files onto a bind mount. No Docker needed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { LAB_DDEV_CONFIG } from '../../tools/compare/lib.mjs';

test('lab DDEV override excludes core/node_modules and keeps the add-on upload dir', () => {
  assert.match(LAB_DDEV_CONFIG, /lab-managed/);
  assert.match(LAB_DDEV_CONFIG, /upload_dirs:/);
  assert.match(LAB_DDEV_CONFIG, /^ {2}- \.ddev\/tmp$/m);
  assert.match(LAB_DDEV_CONFIG, /^ {2}- core\/node_modules$/m);
  assert.doesNotMatch(LAB_DDEV_CONFIG, /sites\/default\/files/, 'the SQLite database must stay on the Mutagen volume');
  assert.doesNotMatch(LAB_DDEV_CONFIG, /performance_mode/, 'the global Mutagen choice is not overridden');
});
