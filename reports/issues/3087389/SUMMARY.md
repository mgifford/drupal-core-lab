# #3087389: Media Library selection text is confusing for screen readers

**DRAFT.** Scoping material only — nothing has been built or run in this lab. This folder was converted to the standard shape
on 2026-10-14; the original note is unchanged.

**This is the entry point for this issue.** Start with **Files and links** below.

Issue: https://www.drupal.org/project/drupal/issues/3087389
Patch: none in this folder
Status snapshot: [STATUS.md](STATUS.md)

## Summary

A triage note. In the Media Library modal the "N of M selected" text reports the number selected out of the allowed
maximum, not how many items are actually available; the grid of media items is not marked up as a list, so the number of
available items is not announced. This is confusing for screen-reader users and people with cognitive disabilities.

## Files and links

| What | Where |
|---|---|
| Original triage note (unchanged) | [ISSUE-3087389.md](ISSUE-3087389.md) |
| How to reproduce | [REPRODUCE.md](REPRODUCE.md) |
| Evidence | [EVIDENCE.md](EVIDENCE.md) |
| Draft comment (do not post) | [ISSUE-COMMENT-DRAFT.md](ISSUE-COMMENT-DRAFT.md) |
| Status snapshot | [STATUS.md](STATUS.md) |

## Sources

- https://www.drupal.org/project/drupal/issues/3087389 (checked 2026-10-14)
- Related: https://www.drupal.org/project/drupal/issues/3034243 (Improve selection text in Media Library)

## Not verified

- No lab run; no pinned Before/After pair, no environment, no commit record, no patch, no human review.

## Notes

- The note's host `drupal-core.ddev.site` and its `ddev drush uli` login are from an older setup; this lab uses the
  `justafish/ddev-drupal-core-dev` add-on and one-time links from `ddev drupal login`.
- The note ends with a pointer to `PROCESS.md`, which does not exist in this repository.
