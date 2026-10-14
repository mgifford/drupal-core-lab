# #3614293: Automated Form Validation Accessibility Testing (aria-invalid)

**DRAFT.** Scoping material only — nothing has been built or run in this lab. This folder was converted to the standard shape
on 2026-10-14; the original note and patch are unchanged.

**This is the entry point for this issue.** Start with **Files and links** below.

Issue: https://www.drupal.org/project/drupal/issues/3614293
Patch: 1 (see [BRANCHES.md](BRANCHES.md))
Status snapshot: [STATUS.md](STATUS.md)

## Summary

An update note and a patch adding test coverage for `aria-invalid="true"` across 13 form element types (the existing core
had one textfield test, `FormTest::testRequiredTextfieldNoTitle`). It also describes Guidepup virtual screen-reader tests.
The note reports "12 tests, 44 assertions" (PHPUnit) and "3 tests, 11 assertions" (Guidepup), but those runs were produced
outside this lab and are not reproduced here.

## Files and links

| What | Where |
|---|---|
| Update note (unchanged) | [3614293-update.md](3614293-update.md) |
| Patch and provenance | [BRANCHES.md](BRANCHES.md) |
| How to reproduce | [REPRODUCE.md](REPRODUCE.md) |
| Evidence | [EVIDENCE.md](EVIDENCE.md) |
| Draft comment (do not post) | [ISSUE-COMMENT-DRAFT.md](ISSUE-COMMENT-DRAFT.md) |
| Status snapshot | [STATUS.md](STATUS.md) |

## Sources

- https://www.drupal.org/project/drupal/issues/3614293 (checked 2026-10-14)

## Not verified

- No lab run; no pinned Before/After pair, no environment, no commit record, no human review.
- The note's Guidepup file (`tests/playwright/tests/a11y-aria-invalid-sr.spec.ts`) is **not present** in this repository,
  so those results cannot be re-checked here.
- The note's PHPUnit counts are the author's, not reproduced here.

## Notes

- The note also flags what it does not cover: CKEditor5, date/datetime invalid-format (needs JS), `aria-errormessage`
  association, and cross-theme testing.
- `aria-invalid` is set centrally in `RenderElementBase::setAttributes()`.
