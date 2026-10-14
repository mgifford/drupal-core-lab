# #3155130: "Edit summary" toggle accessibility issues

**DRAFT.** Scoping material only — nothing has been built or run in this lab. This folder was converted to the standard shape
on 2026-10-14; the original note is unchanged.

**This is the entry point for this issue.** Start with **Files and links** below.

Issue: https://www.drupal.org/project/drupal/issues/3155130
Patch: none in this folder (the note refers to a patch that is not present — see Notes)
Status snapshot: [STATUS.md](STATUS.md)

## Summary

A triage note. The "Edit summary"/"Hide summary" toggle for long-text fields has several problems: the button sits inside
another field's label (invalid HTML), the textarea's accessible name changes on toggle, the button is replaced rather than
toggled in place, the summary field precedes the button that reveals it, in multi-value fields the toggle can be invisible
yet focusable (WCAG 2.4.7 Focus Visible), and all summary fields share one name.

## Files and links

| What | Where |
|---|---|
| Original triage note (unchanged) | [ISSUE-3155130.md](ISSUE-3155130.md) |
| How to reproduce | [REPRODUCE.md](REPRODUCE.md) |
| Evidence | [EVIDENCE.md](EVIDENCE.md) |
| Draft comment (do not post) | [ISSUE-COMMENT-DRAFT.md](ISSUE-COMMENT-DRAFT.md) |
| Status snapshot | [STATUS.md](STATUS.md) |

## Sources

- https://www.drupal.org/project/drupal/issues/3155130 (checked 2026-10-14)

## Not verified

- No lab run; no pinned Before/After pair, no environment, no commit record, no human review.
- No patch file is present in this folder.

## Notes

- The note refers to `core-summary-a11y-3155130-6.patch`, which is **not in this folder**. Re-fetch it from the issue if a
  patch is needed.
- The note's host `drupal-core.ddev.site` and its `ddev drush uli` login are from an older setup; this lab uses the
  `justafish/ddev-drupal-core-dev` add-on and one-time links from `ddev drupal login`.
- The note ends with a pointer to `PROCESS.md`, which does not exist in this repository.
