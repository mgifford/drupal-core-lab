# Status of #3419891 (2026-10-15)

Issue: https://www.drupal.org/project/drupal/issues/3419891
Title: *Increase size of alternative text field in Image dialog*
Status on drupal.org: 8 (Needs review). Priority: Normal. Category: Task. Component: image system.
Version field on the issue: `main`. Created 2023-11-07 by joachim. Last status change 2026-09-25.
Comments: 19. Files: 6. Fork: yes (branch `3419891-increase-size-of`). Merge request: no.

## What the issue says

The alternative text field in the CKEditor5 image dialog only allows ~35 visible characters.
Longer alt text scrolls horizontally out of view. Proposed resolution: use a textarea that
grows vertically (minRows=1, maxRows=6).

## Related issues

| Issue | Relation |
|---|---|
| #3419891 | Main issue |

## What this lab has established

Measured on main (`47430c368bbd`, 2026-10-06), Before and After with patch from branch `3419891-increase-size-of`:

- **Reproduced and fixed.** The patch changes the alt text field from `<input type="text">`
  to `<textarea minRows=1 maxRows=6>`.
- Before: single-line input, long text scrolls horizontally out of view (28px height).
- After: textarea grows vertically as user types, all content stays visible (74px height,
  no horizontal scroll).
- Patch files: 7 files changed (CSS, JS, PHP tests).
- Verdict: **reproduced-and-fixed** (chromium/light/1280x900).

## Next actions

1. Review the evidence and update ISSUE-COMMENT-DRAFT.md for posting.
2. Run additional environments (dark, forced-colours, firefox, webkit) if needed.
3. If satisfied, the patch is ready for review on drupal.org.
