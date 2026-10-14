# #3617875: Disabled elements in dark mode (admin theme)

**DRAFT.** Scoping material only — nothing has been built or run in this lab. This folder was converted to the standard shape
on 2026-10-14; the original patches are unchanged.

**This is the entry point for this issue.** Start with **Files and links** below.

Issue: https://www.drupal.org/project/drupal/issues/3617875
Patches: 2 with provenance in `branches/` + 1 without (see [BRANCHES.md](BRANCHES.md))
Status snapshot: [STATUS.md](STATUS.md)

## Summary

Two branch patches (with provenance) and one patch without, concerning disabled elements in dark mode in the admin theme
(`core/themes/default_admin/css/_variables/variables-components.css`). There is no note describing the issue or the
expected behaviour, and no test evidence.

## Files and links

| What | Where |
|---|---|
| Patches and provenance | [BRANCHES.md](BRANCHES.md) |
| How to reproduce | [REPRODUCE.md](REPRODUCE.md) |
| Evidence | [EVIDENCE.md](EVIDENCE.md) |
| Draft comment (do not post) | [ISSUE-COMMENT-DRAFT.md](ISSUE-COMMENT-DRAFT.md) |
| Status snapshot | [STATUS.md](STATUS.md) |

## Sources

- https://www.drupal.org/project/drupal/issues/3617875 (checked 2026-10-14)

## Not verified

- No lab run; no pinned Before/After pair, no environment, no commit record, no test evidence, no human review.
- One patch (`3617875-disabled-elements-dark-mode.patch`) has no provenance.

## Notes

- This is a colour/contrast change, so the lab's forced-colours and colour-mode checks would be the relevant evidence if it
  is ever built.
