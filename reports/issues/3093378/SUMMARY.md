# #3093378: Use ARIA disclosure pattern for submenu buttons in vertical toolbar orientation

**DRAFT.** Scripted Playwright runs (Chromium light/dark/forced colours, WebKit light/dark) and a Guidepup
virtual screen-reader pass were confirmed by the lab on 2026-10-13, on both pinned core and current `main`;
a person has not run the keyboard-only or real screen-reader pass. Last updated: 2026-10-14.

**This is the entry point for this issue.** It links to the patch, the recipe, the evidence and the comment
draft. Start with **Files and links** below, or `REPRODUCE.md` for the step-by-step commands.

Issue: https://www.drupal.org/project/toolbar/issues/3093378 (project `toolbar`, `2.x-dev`)
Merge request: !6 (opened, `can_be_merged`) — the Toolbar module was removed from Drupal core, so this is a contrib issue
Fork branch: `3093378-use-aria-disclosure` · Patch tip `d1e97b5` (2026-10-08)
Status snapshot: [STATUS-2026-10-13.md](STATUS-2026-10-13.md)

## Summary

Reported problem: in the **vertical** toolbar orientation (narrow viewport, below the 1024 px breakpoint), each
section with a submenu has a disclosure button. Before this MR the button's name *is* the action and flips with the
state (`Extend` when closed, `Collapse` when open) and there is no `aria-expanded`, so the open/closed state is not
machine readable (WCAG 4.1.2 Name, Role, Value). The MR (!6) moves the state to `aria-expanded` and makes the name a
stable "`<name>` menu".

Open points in the discussion (not decisions): the APG disclosure pattern recommends adding `aria-controls` to link
the button to the submenu it toggles; the MR's own Nightwatch test cannot be run with this lab's DDEV add-on
(`ddev nightwatch` is not available).

## Files and links

| What | Where |
|---|---|
| How to reproduce (commands, latest and pinned) | [REPRODUCE.md](REPRODUCE.md) |
| The patch under test | [branches/3093378-use-aria-disclosure.patch](branches/3093378-use-aria-disclosure.patch) · [BRANCHES.md](BRANCHES.md) |
| Recipe (starting state) | [`recipes/repro_3093378/`](../../../recipes/repro_3093378/) |
| Evidence (automated results, test matrix, Guidepup), exact commits | [EVIDENCE.md](EVIDENCE.md) |
| Scripted runs and screenshots | [`playwright/`](playwright/) |
| Virtual screen-reader runs | [`screenreader/`](screenreader/) |
| Browser and colour-mode matrix | [COVERAGE.md](COVERAGE.md) |
| Diff report | [`compare/`](compare/) |
| Draft comment (do not post) | [ISSUE-COMMENT-DRAFT.md](ISSUE-COMMENT-DRAFT.md) |
| Status snapshot | [STATUS-2026-10-13.md](STATUS-2026-10-13.md) |

## Sources

- https://www.drupal.org/project/toolbar/issues/3093378 (2026-10-13): issue page, status **Needs review**, newest activity comment #16802763 (`benjifisher`)
- https://git.drupalcode.org/project/toolbar/-/merge_requests/6 (2026-10-13): merge request !6, state *opened*, `can_be_merged`, source `3093378-use-aria-disclosure`, target `2.x`
- Parent issue https://www.drupal.org/node/3084529 · related https://www.drupal.org/node/3090120

## Not verified

- Keyboard-only and real screen-reader passes by a person (the Guidepup run is synthetic).
- Firefox (Playwright's Firefox fails to launch on this machine — a declared, attempted block).
- The MR's own Nightwatch test (`ddev nightwatch` is not available in this lab's add-on).
- Emulated forced colours and WebKit are not Windows High Contrast or Safari itself.
- Any step by a person; the human-review boxes in `EVIDENCE.md` are still open.

## Notes

- Core ships the **Navigation** module and Standard requires it; the contrib Toolbar yields to it, so the recipe ships an
  `apply.sh` that uninstalls `navigation` and lets the classic Toolbar render (see `REPRODUCE.md`).
- The lab built both pairs: `3093378-latest` (current `main`) and `3093378-pinned` (core `4f9558d8`); they are registered in
  `tools/compare/variants.json`.
- AI-assisted: scripted Playwright and Guidepup runs; see [EVIDENCE.md](EVIDENCE.md).
