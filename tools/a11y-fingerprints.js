'use strict';

/**
 * Centralized accessibility identifier generation for drupal-core's a11y
 * tooling.
 *
 * This module has two jobs:
 *
 *  1. Legacy identifiers (DRU-, INS-, MS-): the exact formulas already used
 *     by core/tests/playwright/scripts/analyze-patterns.js and
 *     tests/playwright/scripts/merge-results.js, moved here unchanged so
 *     both call sites share one implementation instead of two copies. See
 *     tools/a11y-fingerprints.test.js for golden tests asserting these
 *     values have not changed for known inputs.
 *
 *  2. New a11y/pattern/v1 and a11y/occurrence/v1 fingerprints, computed per
 *     the frozen, versioned profiles defined at
 *     https://mgifford.github.io/ACCESSIBILITY.md/examples/fingerprints/README.html
 *     (canonical source: mgifford/ACCESSIBILITY.md, examples/fingerprints/).
 *     This is a dual-write: legacy identifiers keep being generated and
 *     published exactly as before. Nothing here changes an existing DRU-,
 *     INS-, or MS- value.
 *
 * Stability: a11y/pattern/v1 and a11y/occurrence/v1 are stable, versioned
 * profiles. Do not change canonicalizeForFingerprint(), computeFingerprint(),
 * or the derived display-ID format below in a way that could change an
 * already-emitted fingerprint. See the stability requirements in
 * examples/fingerprints/README.md in the ACCESSIBILITY.md repository before
 * touching this file's fingerprint-generation logic (as opposed to the
 * legacy DRU-/INS-/MS- helpers, which follow their own pre-existing rules).
 */

const crypto = require('crypto');

// ── Legacy identifiers (unchanged formulas) ─────────────────────────────────

/**
 * First 8 hex chars (uppercase) of a SHA-256 digest. Used by DRU- and INS-.
 * Moved here verbatim from analyze-patterns.js; do not change.
 */
function shortHash(str) {
  return crypto.createHash('sha256').update(str).digest('hex').slice(0, 8).toUpperCase();
}

/**
 * DRU-xxxxxxxx pattern ID. screenType intentionally excluded: desktop and
 * mobile are the same bug. Theme/colorScheme also excluded; those are
 * tracked in the pattern's `conditions` list by the caller.
 */
function generateDrupalPatternId(selectorKey, ruleId) {
  return `DRU-${shortHash([selectorKey, ruleId].join('|'))}`;
}

/**
 * INS-xxxxxxxx instance ID. Stable per page+rule+selector+screen.
 */
function generateDrupalInstanceId(pagePath, selectorKey, ruleId, screenType) {
  return `INS-${shortHash([pagePath, selectorKey, ruleId, screenType].join('|'))}`;
}

/**
 * Generic MS-xxxxxxxx ID used by merge-results.js for both its instance and
 * pattern IDs, depending on which inputs the caller joins. Moved here
 * verbatim; do not change the hash algorithm, digest length, or casing.
 */
function generateMultiScannerId(inputs) {
  const hash = crypto.createHash('sha256').update(inputs).digest('hex').slice(0, 8);
  return `MS-${hash}`;
}

// ── a11y/pattern/v1 and a11y/occurrence/v1 (new, dual-written) ─────────────

/**
 * Minimal RFC 8785 (JSON Canonicalization Scheme) implementation for the
 * plain, finite, string/number/boolean/null/array/object values this module
 * ever passes to it. Deliberately does not handle every JSON Schema edge
 * case (BigInt, exotic Unicode normalization, non-finite numbers) because
 * every fingerprint input here is a small, hand-built plain object.
 *
 * Mirrors the behavior of the `canonicalize` npm package used by the
 * canonical ACCESSIBILITY.md checker (examples/fingerprints/fingerprint-core.mjs):
 * object keys sorted with the default string sort, primitives serialized
 * with JSON.stringify, no inserted whitespace.
 */
function canonicalizeForFingerprint(value) {
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new Error('a11y-fingerprints: NaN/Infinity is not a valid fingerprint input value');
  }

  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    const items = value.map((item) => canonicalizeForFingerprint(item === undefined ? null : item));
    return `[${items.join(',')}]`;
  }

  const parts = [];
  for (const key of Object.keys(value).sort()) {
    if (value[key] === undefined) continue;
    parts.push(`${JSON.stringify(key)}:${canonicalizeForFingerprint(value[key])}`);
  }
  return `{${parts.join(',')}}`;
}

/** SHA-256 of the canonicalized input, as lowercase hex (64 characters). */
function sha256Hex(utf8String) {
  return crypto.createHash('sha256').update(utf8String, 'utf8').digest('hex');
}

/**
 * Computes the full authoritative fingerprint for a given profile name and
 * input object, per examples/fingerprints/README.md's normative computation:
 * lowercase-hex(SHA-256(UTF-8(JCS-canonicalize(input-with-profile-field)))).
 *
 * @param {string} profileName - e.g. "a11y/pattern/v1" or "a11y/occurrence/v1"
 * @param {object} input - the profile's input contract fields (without `profile`)
 * @returns {string} 64-character lowercase hex digest
 */
function computeFingerprint(profileName, input) {
  const withProfile = Object.assign({}, input, { profile: profileName });
  return sha256Hex(canonicalizeForFingerprint(withProfile));
}

/**
 * Derives a short, non-authoritative display ID from a full fingerprint, per
 * examples/fingerprints/README.md, "Display IDs".
 *
 * @param {'A11Y-PAT'|'A11Y-OCC'} prefix
 * @param {string} fullDigestHex - 64-character lowercase hex digest
 * @returns {string} e.g. "A11Y-PAT-57869BAE817F"
 */
function displayId(prefix, fullDigestHex) {
  return `${prefix}-${fullDigestHex.slice(0, 12).toUpperCase()}`;
}

/** The scope this repository publishes fingerprints under. */
const DRUPAL_CORE_TARGET = {
  scope_type: 'repository',
  scope_id: 'https://github.com/mgifford/drupal-core',
};

/**
 * Computes the a11y/pattern/v1 fingerprint and display ID for a Drupal core
 * pattern candidate (a normalized selector failing a specific rule).
 *
 * @param {string} normalizedSelector
 * @param {string} ruleNamespace - e.g. "axe-core"
 * @param {string} ruleId - e.g. "color-contrast"
 * @param {string|null} [stateKey] - an intrinsic product state that is part
 *   of this pattern's identity, or null when no state applies. Use null to
 *   match generateDrupalPatternId's identity boundary (DRU- deliberately
 *   excludes screenType/theme/colorScheme). A caller whose legacy pattern
 *   identity DOES include a condition (e.g. merge-results.js's MS- pattern
 *   ID includes screenType) should pass that condition here, explicitly,
 *   rather than smuggling it into normalizedSelector.
 * @returns {{ fingerprint: string, displayId: string, input: object }}
 */
function computeA11yPatternFingerprint(normalizedSelector, ruleNamespace, ruleId, stateKey) {
  const input = {
    target: DRUPAL_CORE_TARGET,
    rule: { namespace: ruleNamespace, id: ruleId },
    locator: {
      type: 'css',
      normalization_profile: 'a11y/css-locator/v1',
      value: normalizedSelector,
    },
    state_key: stateKey === undefined ? null : stateKey,
  };
  const fingerprint = computeFingerprint('a11y/pattern/v1', input);
  return { fingerprint, displayId: displayId('A11Y-PAT', fingerprint), input };
}

/**
 * Computes the a11y/occurrence/v1 fingerprint and display ID for one
 * observed location of a pattern.
 *
 * @param {string} patternFingerprint - full 64-hex a11y/pattern/v1 value
 * @param {string} generalizedPagePath - e.g. "/node/[nid]"
 * @param {string|null} [testProfile] - explicit named test profile, or null
 * @returns {{ fingerprint: string, displayId: string, input: object }}
 */
function computeA11yOccurrenceFingerprint(patternFingerprint, generalizedPagePath, testProfile) {
  const input = {
    pattern_fingerprint: {
      profile: 'a11y/pattern/v1',
      algorithm: 'sha-256',
      value: patternFingerprint,
    },
    location: {
      scope: 'route-pattern',
      normalization_profile: 'a11y/route/v1',
      key: generalizedPagePath,
    },
    test_profile: testProfile === undefined ? null : testProfile,
  };
  const fingerprint = computeFingerprint('a11y/occurrence/v1', input);
  return { fingerprint, displayId: displayId('A11Y-OCC', fingerprint), input };
}

module.exports = {
  // Legacy (unchanged formulas, centralized)
  shortHash,
  generateDrupalPatternId,
  generateDrupalInstanceId,
  generateMultiScannerId,
  // New Stage 2 fingerprints (dual-write)
  canonicalizeForFingerprint,
  computeFingerprint,
  displayId,
  computeA11yPatternFingerprint,
  computeA11yOccurrenceFingerprint,
  DRUPAL_CORE_TARGET,
};
