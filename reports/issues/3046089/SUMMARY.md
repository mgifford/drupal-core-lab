# #3046089: Accessibility of Main toolbar items and internal editing

**DRAFT.** Scoping material only — nothing has been built or run in this lab. This folder was converted to the standard shape
on 2026-10-14; the original note is unchanged.

**This is the entry point for this issue.** Start with **Files and links** below.

Issue: https://www.drupal.org/project/drupal/issues/3046089
Patch: none in this folder
Status snapshot: [STATUS.md](STATUS.md)

## Summary

A triage note. On the main admin toolbar, Tab skips important items; some controls that look single are groups when reached
by screen reader or keyboard; and contextual "open configuration options" buttons lack clear context or ARIA labelling.

## Files and links

| What | Where |
|---|---|
| Original triage note (unchanged) | [ISSUE-3046089.md](ISSUE-3046089.md) |
| How to reproduce | [REPRODUCE.md](REPRODUCE.md) |
| Evidence | [EVIDENCE.md](EVIDENCE.md) |
| Draft comment (do not post) | [ISSUE-COMMENT-DRAFT.md](ISSUE-COMMENT-DRAFT.md) |
| Status snapshot | [STATUS.md](STATUS.md) |

## Sources

- https://www.drupal.org/project/drupal/issues/3046089 (checked 2026-10-14)
- Related meta: https://www.drupal.org/project/drupal/issues/3084529 (META: improve accessibility of toolbar)

## Not verified

- No lab run; no pinned Before/After pair, no environment, no commit record, no patch, no human review.

## Notes

- The note's host `drupal-core.ddev.site` and its `ddev drush uli` login are from an older setup; this lab uses the
  `justafish/ddev-drupal-core-dev` add-on and one-time links from `ddev drupal login`.
- The note ends with a pointer to `PROCESS.md`, which does not exist in this repository.
