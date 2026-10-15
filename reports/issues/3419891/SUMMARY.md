# #3419891: Increase size of alternative text field in Image dialog

**DRAFT.** Evidence run completed 2026-10-15. A person has not reviewed the result.

**Result: reproduced-and-fixed.** The patch from branch `3419891-increase-size-of` changes the CKEditor5 image dialog's alternative text field from a single-line `<input>` to a `<textarea>` with `minRows=1, maxRows=6`. Before: long text scrolls horizontally out of view. After: field grows vertically, all content stays visible.

Issue: https://www.drupal.org/project/drupal/issues/3419891
Status snapshot: [STATUS.md](STATUS.md)

## Summary

Reported problem: the alternative text field in the CKEditor5 image dialog only shows ~35 characters. Longer alt text scrolls horizontally out of view, creating cognitive load for content editors.

The patch (from branch `3419891-increase-size-of` on the issue fork) changes the field from:
- `<input type="text">` (single-line, fixed width)
to:
- `<textarea minRows=1 maxRows=6>` with `width: 100%` (grows vertically up to 6 rows)

## Files and links

| Path | What |
|---|---|
| [REPRODUCE.md](REPRODUCE.md) | How to reproduce, pinned and on latest core. |
| [EVIDENCE.md](EVIDENCE.md) | Results with exact commits. DRAFT until a person has reviewed it. |
| [STATUS.md](STATUS.md) | Current status snapshot and related issues. |
| [BRANCHES.md](BRANCHES.md) | Patch from issue fork branch. |
| [ISSUE-COMMENT-DRAFT.md](ISSUE-COMMENT-DRAFT.md) | A draft for a human to review and post. |
| `recipes/repro_3419891/recipe.yml` | Starting state: Standard install with Basic page content type. |
| `tools/compare/variants.json` | `3419891-pinned` and `3419891-latest`. |
| `tools/playwright/evaluate-3419891.mjs` | Playwright evaluation script. |

## Sources

- https://www.drupal.org/project/drupal/issues/3419891 (2023-11-07): issue summary, 19 comments, 6 files, issue fork branch `3419891-increase-size-of`, no merge request.
- Issue fork: https://git.drupalcode.org/issue/drupal-3419891.git branch `3419891-increase-size-of`

## Not verified

- No human keyboard pass, no screen-reader pass, no forced-colours or dark run.
- Only chromium/light/1280x900 run completed (4 other environments not tested).
