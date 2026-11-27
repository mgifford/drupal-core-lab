# #2847425: conditional visibility and requirement of managed file elements

**DRAFT.** Automated evidence only; no person has done a keyboard or screen-reader pass.

## Where it stands (2026-11-27)

- The current MR (`7362966e15`) fixes the reported defect on load and on trigger changes. Reproduced on the pinned
  baseline and confirmed in Chromium light, dark and forced colours.
- Two defects in the MR were measured: the whole `#states` array is copied to the hidden file-IDs input when a file
  is present, and the wrapper `<div>` receives `disabled` (FormTest 44 → 45).
- A refinement (`branches/2847425-complete.patch`) fixes both, keeps the corrective commit, and passes the extended
  JavaScript suite (9 tests, 148 assertions) and `FormTest::testDisabledElements` at the unchanged 44.
- Core code checks pass on the refinement (CSpell, PHPStan, PHPCS, ESLint).

## Open

- The required marker after an AJAX upload/removal is not re-applied until a trigger changes. That is
  [#1091852](https://www.drupal.org/project/drupal/issues/1091852) and is not changed here.
- The label's `for` is dangling once the upload control is not rendered.
  [#3513308](https://www.drupal.org/project/drupal/issues/3513308).
- Firefox, WebKit and 480 px were not run; a person's keyboard and screen-reader pass was not done.

## Next

1. A person reviews [EVIDENCE.md](EVIDENCE.md) and decides whether the refinement should be pushed to MR !7305.
2. A person posts the draft [issue comment](ISSUE-COMMENT-DRAFT.md) if it is accurate.
3. If the refinement is accepted upstream, a separate issue or MR for #1091852 and one for #3513308 remain.

## Links

- [Drupal issue](https://www.drupal.org/project/drupal/issues/2847425)
- [MR !7305](https://git.drupalcode.org/project/drupal/-/merge_requests/7305)
- [Evidence](EVIDENCE.md) · [Reproduction](REPRODUCE.md) · [Patches](BRANCHES.md) · [Entry point](SUMMARY.md)

Generated with the help of an LLM.
