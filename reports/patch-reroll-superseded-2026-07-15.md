# Patch Reroll + Superseded Review (2026-07-15)

## Request Scope
- Execute manual reroll for remaining non-applying patches.
- Produce a companion superseded/obsolete assessment.

## Baseline
- already-applied: 16
- applies-clean: 4
- does-not-apply: 4
- invalid-format: 0

## Final Result
- already-applied: 17
- applies-clean: 7
- does-not-apply: 0
- invalid-format: 0

## Manual Rerolls Completed
- patches/a11y-DRUPAL-A11Y-005-language-switcher-contrast.patch
- patches/a11y-DRUPAL-A11Y-014-issue-2443815-details-description-display.patch
- patches/default-admin-contrast-color-hints.patch
- patches/default-admin-focus-aa-proposals.patch

## Superseded/Obsolete Classification
- None.

## Notes
- Two patch artifacts were malformed and were regenerated from real git diffs to restore unified-diff validity.
- The #2443815 patch was re-scoped to a minimal stable hunk so it validates as already-applied on the current branch.
- The authoritative matrix is in reports/patch-apply-validation-2026-07-15.json and reports/patch-apply-validation-2026-07-15.md.
