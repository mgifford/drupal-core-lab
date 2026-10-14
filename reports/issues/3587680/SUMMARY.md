# #3587680: Empty heading tags on dialog and tabs pages

**DRAFT.** Scoping material only — nothing has been built or run in this lab. This folder was converted to the standard shape
on 2026-10-14; the original note and patch are unchanged.

**This is the entry point for this issue.** Start with **Files and links** below.

Issue: https://www.drupal.org/project/drupal/issues/3587680
Patch: 1 (touches a **contrib** module, not core — see [BRANCHES.md](BRANCHES.md))
Status snapshot: [STATUS.md](STATUS.md)

## Summary

A root-cause and fix note. `filter-tips.html.twig` expects `#tips` grouped by format label with `name`/`list` keys;
`DialogController::buildFilterTips()` and `TabController::buildTipsRenderArray()` were instead providing a
filter-ID-keyed array, so `<h3>{{ tip.name }}</h3>` rendered empty (`<h3></h3>`). The fix regroups the tips by format
label. Verified by counting `<h3></h3>` before (4) and after (0) with `curl | grep -c`.

## Files and links

| What | Where |
|---|---|
| Fix note (unchanged) | [3587680-update.md](3587680-update.md) |
| Patch and provenance | [BRANCHES.md](BRANCHES.md) |
| How to reproduce | [REPRODUCE.md](REPRODUCE.md) |
| Evidence | [EVIDENCE.md](EVIDENCE.md) |
| Draft comment (do not post) | [ISSUE-COMMENT-DRAFT.md](ISSUE-COMMENT-DRAFT.md) |
| Status snapshot | [STATUS.md](STATUS.md) |

## Sources

- https://www.drupal.org/project/drupal/issues/3587680 (checked 2026-10-14)

## Not verified

- No lab run; no pinned Before/After pair, no environment, no commit record, no human review.
- The `curl | grep -c "<h3></h3>"` count is a crude check; it was not reproduced in this lab.

## Notes

- **The patch and the note are about the contrib `theming_tools` module** (`modules/contrib/theming_tools/modules/dialog`
  and `.../tab`), not Drupal core. Treat any core relevance carefully.
- The note's claim that the axe-core `empty-heading` violation is "resolved" is the author's, not confirmed here.
