# #3243173: HTML5 validation disabled in Drupal 12 (and form focus management)

**DRAFT.** Scoping material only — nothing has been built or run in this lab. This folder was converted to the standard shape
on 2026-10-14; the original notes and patches are unchanged.

**This is the entry point for this issue.** Start with **Files and links** below.

Issue: https://www.drupal.org/project/drupal/issues/3243173
Patches: 2, on two different topics (see [BRANCHES.md](BRANCHES.md))
Status snapshot: [STATUS.md](STATUS.md)

## Summary

Two LLM analysis docs and two patches sit in this folder:

1. **`enable_html5_validation` test coverage** — adds tests for the setting that disables browser HTML5 validation by
   default (`FormPreprocessTest`, `Html5ValidationRequirementsTest`).
2. **Form focus management** — moves focus to the first invalid field after server-side validation, and announces the
   error, for both non-AJAX and AJAX forms (`core/misc/form.js`, `FormAjaxResponseBuilder`).

The docs claim test results ("8 tests, 12 assertions — all passing" and four FunctionalJavascript tests), but these were
produced outside this lab and are not reproduced here.

## Files and links

| What | Where |
|---|---|
| Patches and provenance | [BRANCHES.md](BRANCHES.md) |
| HTML5-validation note (unchanged) | [3243173-disable-html5-validation.md](3243173-disable-html5-validation.md) |
| Focus-management note (unchanged) | [3243173-form-focus-management.md](3243173-form-focus-management.md) |
| How to reproduce | [REPRODUCE.md](REPRODUCE.md) |
| Evidence | [EVIDENCE.md](EVIDENCE.md) |
| Draft comment (do not post) | [ISSUE-COMMENT-DRAFT.md](ISSUE-COMMENT-DRAFT.md) |
| Status snapshot | [STATUS.md](STATUS.md) |

## Sources

- https://www.drupal.org/project/drupal/issues/3243173 (checked 2026-10-14)
- Related: [#1797438](https://www.drupal.org/project/drupal/issues/1797438) (parent),
  [#3537128](https://www.drupal.org/node/3537128) (change record),
  [#3592742](https://www.drupal.org/project/drupal/issues/3592742),
  [#3592899](https://www.drupal.org/project/drupal/issues/3592899),
  [#3083103](https://www.drupal.org/project/drupal/issues/3083103),
  [#3088245](https://www.drupal.org/project/drupal/issues/3088245)

## Not verified

- No lab run; no pinned Before/After pair, no environment, no commit record, no human review.
- The two patches are on different topics; whether both belong to this issue is not confirmed.
- The note labels `Html5ValidationRequirementsTest` "(Unit)" in one place and `Kernel` in another — minor, fix on read.

## Notes

- The two patches appear unrelated (HTML5-validation setting vs focus management). Confirm scope on the issue, or split.
