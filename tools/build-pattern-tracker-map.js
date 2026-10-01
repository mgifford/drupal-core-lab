#!/usr/bin/env node
'use strict';

/**
 * Populates reports/pattern-tracker-map.json from the drupal_issue links
 * already present in reports/bugs-latest.json.
 *
 * This does not invent tracker relationships. core/tests/playwright/scripts/analyze-patterns.js
 * has a curated table (getDrupalFix / DRUPAL_FIXES-style entries) that maps
 * some rule+selector patterns to real, filed Drupal.org issues; most
 * entries still point at ".../issues/new" (no issue filed yet) and are
 * skipped here. Only patterns with an actual filed issue URL are recorded.
 *
 * Usage:
 *   node tools/build-pattern-tracker-map.js
 *
 * Re-run after every analyze-patterns.js run. Existing entries for a
 * pattern ID are updated in place (last_verified_at bumped); entries for
 * patterns no longer present in bugs-latest.json are left untouched rather
 * than deleted, since a tracked issue can remain valid even if a later scan
 * did not observe that pattern (see examples/ACCESSIBILITY_FINDING_TRACKING.md,
 * "not_observed" vs "resolved").
 */

const fs = require('fs');
const path = require('path');

// Matches core/tests/playwright/scripts/analyze-patterns.js's A11Y_REPORTS_DIR
// override so this can be run against a scratch copy of reports/ during
// testing without touching the committed reports directory.
const REPORTS_DIR = process.env.A11Y_REPORTS_DIR
  ? path.resolve(process.env.A11Y_REPORTS_DIR)
  : path.resolve(__dirname, '../reports');
const BUGS_LATEST = path.join(REPORTS_DIR, 'bugs-latest.json');
const TRACKER_MAP = path.join(REPORTS_DIR, 'pattern-tracker-map.json');

function loadJSON(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function isRealIssueUrl(url) {
  if (!url) return false;
  if (url.endsWith('/issues/new')) return false;
  return /^https:\/\/www\.drupal\.org\/project\/drupal\/issues\/\d+$/.test(url);
}

function main() {
  const bugs = loadJSON(BUGS_LATEST, null);
  if (!bugs) {
    console.error(`${BUGS_LATEST} not found. Run analyze-patterns.js first.`);
    process.exit(1);
  }

  const trackerMap = loadJSON(TRACKER_MAP, {
    $comment: 'Maps accessibility pattern identifiers (DRU-, MS-, and their dual-written a11y/pattern/v1 fingerprints) to tracked Drupal.org issues.',
    schema_version: '1.0',
    notes: [],
    entries: [],
  });

  const entryByPatternId = new Map(trackerMap.entries.map((e) => [e.pattern_id, e]));
  const now = new Date().toISOString();
  let added = 0;
  let updated = 0;

  for (const issue of bugs.issues ?? []) {
    if (!isRealIssueUrl(issue.drupal_issue)) continue;

    const existing = entryByPatternId.get(issue.pattern_id);
    if (existing) {
      existing.last_verified_at = now;
      existing.a11y_pattern_fingerprint = issue.a11y_pattern_fingerprint ?? existing.a11y_pattern_fingerprint ?? null;
      existing.a11y_pattern_display_id = issue.a11y_pattern_display_id ?? existing.a11y_pattern_display_id ?? null;
      updated += 1;
      continue;
    }

    const entry = {
      pattern_id: issue.pattern_id,
      a11y_pattern_fingerprint: issue.a11y_pattern_fingerprint ?? null,
      a11y_pattern_display_id: issue.a11y_pattern_display_id ?? null,
      tracker_id: issue.drupal_issue,
      relationship: 'tracks',
      summary: issue.summary ?? null,
      rule_id: issue.rule_id ?? null,
      first_recorded_at: now,
      last_verified_at: now,
    };
    trackerMap.entries.push(entry);
    entryByPatternId.set(issue.pattern_id, entry);
    added += 1;
  }

  trackerMap.entries.sort((a, b) => a.pattern_id.localeCompare(b.pattern_id));
  fs.writeFileSync(TRACKER_MAP, JSON.stringify(trackerMap, null, 2) + '\n');
  console.log(`pattern-tracker-map.json: ${added} added, ${updated} updated, ${trackerMap.entries.length} total entries.`);
}

main();
