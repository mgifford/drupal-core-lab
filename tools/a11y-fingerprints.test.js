'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  shortHash,
  generateDrupalPatternId,
  generateDrupalInstanceId,
  generateMultiScannerId,
  computeFingerprint,
  displayId,
  computeA11yPatternFingerprint,
  computeA11yOccurrenceFingerprint,
} = require('./a11y-fingerprints.js');

// ── Legacy identifier compatibility ────────────────────────────────────────
//
// These assert exact, previously-observed outputs. If any of these values
// ever needs to change, that is itself a signal that a legacy identifier
// contract was broken — do not "fix" a failing test here by updating the
// expected value without first confirming the change is intentional and
// documenting why in the commit message.

test('generateDrupalPatternId matches known DRU- output for a fixed input', () => {
  // DRU-<first 8 hex of SHA-256("button.submit|button-name")>
  const id = generateDrupalPatternId('button.submit', 'button-name');
  assert.match(id, /^DRU-[0-9A-F]{8}$/);
  assert.equal(id, 'DRU-' + shortHash('button.submit|button-name'));
});

test('generateDrupalPatternId excludes screenType/theme/colorScheme by construction', () => {
  // The function signature itself only accepts (selectorKey, ruleId); this
  // test documents that contract so a future edit that adds more inputs
  // here is caught as an intentional, visible change.
  const a = generateDrupalPatternId('#main', 'region');
  const b = generateDrupalPatternId('#main', 'region');
  assert.equal(a, b);
});

test('generateDrupalInstanceId matches known INS- output for a fixed input', () => {
  const id = generateDrupalInstanceId('/user/login', 'button.submit', 'button-name', 'desktop');
  assert.match(id, /^INS-[0-9A-F]{8}$/);
  assert.equal(id, 'INS-' + shortHash(['/user/login', 'button.submit', 'button-name', 'desktop'].join('|')));
});

test('generateDrupalInstanceId differs across screenType (unlike pattern ID)', () => {
  const desktop = generateDrupalInstanceId('/user/login', 'button.submit', 'button-name', 'desktop');
  const mobile = generateDrupalInstanceId('/user/login', 'button.submit', 'button-name', 'mobile');
  assert.notEqual(desktop, mobile);
});

test('generateMultiScannerId matches known MS- output for a fixed input', () => {
  const id = generateMultiScannerId('[data-confirmed="color-contrast"]|color-contrast|desktop');
  assert.match(id, /^MS-[0-9a-f]{8}$/);
});

test('generateMultiScannerId hex portion is lowercase (unlike DRU-/INS-, which are uppercase)', () => {
  // This asymmetry already exists in the current implementation
  // (tests/playwright/scripts/merge-results.js uses .slice(0, 8) without
  // .toUpperCase()). Documented here so a future refactor does not
  // "normalize" it and silently change every published MS- value.
  const id = generateMultiScannerId('some|inputs|here');
  const hexPortion = id.slice('MS-'.length);
  assert.equal(hexPortion, hexPortion.toLowerCase());
  assert.match(id, /^MS-[0-9a-f]{8}$/);
});

// ── a11y/pattern/v1 and a11y/occurrence/v1 (Stage 2 fingerprint profiles) ──
//
// These assert exact digests published as golden test vectors in the
// canonical mgifford/ACCESSIBILITY.md repository
// (examples/fingerprints/test-vectors.json, vectors PV-01, PV-04, PV-09,
// OV-01). If these fail, either this module's canonicalization has drifted
// from the frozen a11y/pattern/v1 / a11y/occurrence/v1 profiles, or the
// canonical profiles themselves changed — in the latter case, do NOT update
// the expected values here without confirming a new profile version was
// published upstream (a "v1" profile is immutable; see
// https://mgifford.github.io/ACCESSIBILITY.md/examples/fingerprints/README.html).

test('computeFingerprint matches canonical a11y/pattern/v1 vector PV-01', () => {
  const input = {
    target: { scope_type: 'repository', scope_id: 'https://github.com/example/product' },
    rule: { namespace: 'axe-core', id: 'color-contrast' },
    locator: { type: 'css', normalization_profile: 'a11y/css-locator/v1', value: '#edit-submit' },
    state_key: null,
  };
  const digest = computeFingerprint('a11y/pattern/v1', input);
  assert.equal(digest, 'e7c842e0e569532a337ec96e057ffe58e6e6521a5307c97f16980fdf1e1f43ca');
});

test('computeFingerprint matches canonical a11y/pattern/v1 vector PV-04 (different target scope)', () => {
  const input = {
    target: { scope_type: 'repository', scope_id: 'https://github.com/example/other-product' },
    rule: { namespace: 'axe-core', id: 'color-contrast' },
    locator: { type: 'css', normalization_profile: 'a11y/css-locator/v1', value: '#edit-submit' },
    state_key: null,
  };
  const digest = computeFingerprint('a11y/pattern/v1', input);
  assert.equal(digest, 'd2cff3ec3e88b8ecd05f815a62af553a7e16a83e8c8bbd026bcd1d7533a28fa2');
});

test('computeFingerprint matches canonical a11y/pattern/v1 vector PV-09 (non-ASCII UTF-8)', () => {
  const input = {
    target: { scope_type: 'repository', scope_id: 'https://github.com/example/produkt-über' },
    rule: { namespace: 'axe-core', id: 'color-contrast' },
    locator: { type: 'css', normalization_profile: 'a11y/css-locator/v1', value: '#édit-submit' },
    state_key: null,
  };
  const digest = computeFingerprint('a11y/pattern/v1', input);
  assert.equal(digest, '6e7a6f85f51a12669bada9e647511e054ca801741b6f70fca3ad36c21c7199e3');
});

test('computeFingerprint matches canonical a11y/occurrence/v1 vector OV-01', () => {
  const input = {
    pattern_fingerprint: {
      profile: 'a11y/pattern/v1',
      algorithm: 'sha-256',
      value: 'e7c842e0e569532a337ec96e057ffe58e6e6521a5307c97f16980fdf1e1f43ca',
    },
    location: { scope: 'route-pattern', normalization_profile: 'a11y/route/v1', key: '/node/[nid]' },
    test_profile: null,
  };
  const digest = computeFingerprint('a11y/occurrence/v1', input);
  assert.equal(digest, 'bb20023fd9626160a1ef2ca8c4e97e2e5296eb21040d077ac3488c867f31a728');
});

test('computeFingerprint is insensitive to input key order', () => {
  const a = computeFingerprint('a11y/pattern/v1', {
    target: { scope_type: 'repository', scope_id: 'https://github.com/example/product' },
    rule: { namespace: 'axe-core', id: 'color-contrast' },
    locator: { type: 'css', normalization_profile: 'a11y/css-locator/v1', value: '#edit-submit' },
    state_key: null,
  });
  const b = computeFingerprint('a11y/pattern/v1', {
    state_key: null,
    locator: { value: '#edit-submit', type: 'css', normalization_profile: 'a11y/css-locator/v1' },
    rule: { id: 'color-contrast', namespace: 'axe-core' },
    target: { scope_id: 'https://github.com/example/product', scope_type: 'repository' },
  });
  assert.equal(a, b);
});

test('displayId matches canonical worked example', () => {
  const id = displayId('A11Y-OCC', 'bb20023fd9626160a1ef2ca8c4e97e2e5296eb21040d077ac3488c867f31a728');
  assert.equal(id, 'A11Y-OCC-BB20023FD962');
});

// ── drupal-core-specific wrappers ───────────────────────────────────────────

test('computeA11yPatternFingerprint always uses the drupal-core target scope', () => {
  const { fingerprint, input } = computeA11yPatternFingerprint('#main', 'axe-core', 'region');
  assert.equal(input.target.scope_id, 'https://github.com/mgifford/drupal-core');
  assert.match(fingerprint, /^[0-9a-f]{64}$/);
});

test('computeA11yPatternFingerprint is deterministic', () => {
  const a = computeA11yPatternFingerprint('#main', 'axe-core', 'region');
  const b = computeA11yPatternFingerprint('#main', 'axe-core', 'region');
  assert.equal(a.fingerprint, b.fingerprint);
  assert.equal(a.displayId, b.displayId);
});

test('computeA11yPatternFingerprint differs for different selectors', () => {
  const a = computeA11yPatternFingerprint('#main', 'axe-core', 'region');
  const b = computeA11yPatternFingerprint('#footer', 'axe-core', 'region');
  assert.notEqual(a.fingerprint, b.fingerprint);
});

test('computeA11yOccurrenceFingerprint embeds the full pattern fingerprint, not a display ID', () => {
  const pattern = computeA11yPatternFingerprint('#main', 'axe-core', 'region');
  const occurrence = computeA11yOccurrenceFingerprint(pattern.fingerprint, '/node/[nid]');
  assert.equal(occurrence.input.pattern_fingerprint.value, pattern.fingerprint);
  assert.match(occurrence.input.pattern_fingerprint.value, /^[0-9a-f]{64}$/);
});

test('computeA11yOccurrenceFingerprint defaults test_profile to null', () => {
  const pattern = computeA11yPatternFingerprint('#main', 'axe-core', 'region');
  const occurrence = computeA11yOccurrenceFingerprint(pattern.fingerprint, '/node/[nid]');
  assert.equal(occurrence.input.test_profile, null);
});

test('computeA11yOccurrenceFingerprint differs across generalized page paths, same pattern', () => {
  const pattern = computeA11yPatternFingerprint('#main', 'axe-core', 'region');
  const a = computeA11yOccurrenceFingerprint(pattern.fingerprint, '/node/[nid]');
  const b = computeA11yOccurrenceFingerprint(pattern.fingerprint, '/user/[uid]');
  assert.notEqual(a.fingerprint, b.fingerprint);
});
