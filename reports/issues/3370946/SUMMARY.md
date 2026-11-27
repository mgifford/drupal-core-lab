# #3370946: Page title refresh (contextual page title / `base_route_title`)

**DRAFT.** Scoping material only — nothing has been built or run in this lab. This folder was converted to the standard shape
on 2026-10-14; the original notes and patches are unchanged.

**This is the entry point for this issue.** Start with **Files and links** below.

Issue: https://www.drupal.org/project/drupal/issues/3370946
Patches: 2 (see [BRANCHES.md](BRANCHES.md))
Status snapshot: [STATUS.md](STATUS.md)

## Summary

A refresh of the page-title work: the `PageTitleBlock` gains a configurable `base_route_title` so a page can show the
section/entity context ("Article") instead of only the task name ("Manage display"), with modernised services and tests. The
folder holds a detailed refresh note, two patches (refreshed main and a 2024 backport), before/after screenshots, and
Guidepup screen-reader logs.

## Files and links

| What | Where |
|---|---|
| Refresh notes (unchanged) | [3370946-refresh-notes.md](3370946-refresh-notes.md) |
| Patches and provenance | [BRANCHES.md](BRANCHES.md) |
| Before/after screenshots | [3370946-before.png](3370946-before.png) · [3370946-after.png](3370946-after.png) |
| Guidepup logs (raw + normalized) | `3370946-guidepup-*` (in this folder) |
| How to reproduce | [REPRODUCE.md](REPRODUCE.md) |
| Evidence | [EVIDENCE.md](EVIDENCE.md) |
| Draft comment (do not post) | [ISSUE-COMMENT-DRAFT.md](ISSUE-COMMENT-DRAFT.md) |
| Status snapshot | [STATUS.md](STATUS.md) |

## Sources

- https://www.drupal.org/project/drupal/issues/3370946 (checked 2026-10-14)

## Not verified

- No lab run; no pinned Before/After pair, no environment, no commit record, no human review.
- The note's automated results (`RequestGeneratorTest` 8/10; `PageTitleBlockTest` needs `SIMPLETEST_BASE_URL`) were produced
  outside this lab.
- The Guidepup capture (before 367 phrases, after 370) is a synthetic run in an older setup.

## Notes

- **Duplicate artifacts removed 2026-11-26** (owner approved): `3370946-supporting-artifacts.zip` was deleted after
  verifying all 11 members were byte-identical to the top-level copies (`shasum` per member). The
  `3370946-supporting-artifacts/` directory the original note described no longer existed. The folder is now ~808 KB;
  no evidence was lost, because every member survives as a top-level file.
- The refresh keeps the configurable switch and update-path machinery. The "remove configurability" question is now
  **answered by the owner (2026-11-26): aim to be more configurable, not less** — see
  [DECISIONS-2026-11-26.md](DECISIONS-2026-11-26.md).
