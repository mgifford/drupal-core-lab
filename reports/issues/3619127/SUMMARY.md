# #3619127: forms sidebar does not open from Inline Form Errors links

**DRAFT.** Scripted walkthroughs (mouse and keyboard-only), PHPUnit and a virtual screen-reader run were confirmed by
the lab on 2026-10-01 on pinned core `d29add7ebc18`, and the patches were re-checked on current `main` (`073a7d38198`);
a person has not done the manual keyboard pass. Last updated: 2026-10-14.

**This is the entry point for this issue.** It links to the patches, the recipe, the evidence and the comment
draft. Start with **Files and links** below, or `REPRODUCE.md` for the step-by-step commands.

Issue: https://www.drupal.org/project/drupal/issues/3619127
Merge request: !16895
Fork branch: `3619127-forms-sidebar-with-ife`
Pinned core: `d29add7ebc18` (2026-09-30) — also verified on `main` at `073a7d38198` (2026-10-01)
Status snapshots: [STATUS-2026-10-02.md](STATUS-2026-10-02.md) · older: [STATUS-2026-10-01.md](STATUS-2026-10-01.md)

## Summary

Reported problem: with the Inline Form Errors (IFE) module on, an error summary lists a link per invalid field. In the
Default Admin theme, fields in the sidebar of advanced settings ("URL alias", "Authoring information" and so on) are
hidden when the sidebar is closed, which it is by default on narrow screens. Clicking the error link does nothing: the
sidebar stays closed, the field is not shown and does not receive focus, so a keyboard or screen-reader user cannot
reach the invalid field (WCAG 3.3.3, with 2.4.3, 3.3.1). The MR makes the sidebar open **without overwriting the saved
open/closed preference** and the field receive focus.

Review threads the lab answered: mherchel's objection to adding jQuery to the `sidebar` library (patch-0 removes it,
using native `closest()`) and larowlan's request to drop jQuery. Two further findings from the evaluation: `showSidebar()`
persisted the open state to `localStorage` (patch-1 fixes) and the test used a fixed `wait(500)` sleep (patch-1 fixes).

## Files and links

| What | Where |
|---|---|
| How to reproduce (commands, pinned and latest) | [REPRODUCE.md](REPRODUCE.md) |
| The patch under test (the MR) | [branches/3619127-forms-sidebar-with-ife.patch](branches/3619127-forms-sidebar-with-ife.patch) · [BRANCHES.md](BRANCHES.md) |
| Follow-up patches | [patch-0-vanilla-js-no-jquery.patch](patch-0-vanilla-js-no-jquery.patch) · [patch-1-no-persist-and-waits.patch](patch-1-no-persist-and-waits.patch) · [patch-2-optional-base-class.patch](patch-2-optional-base-class.patch) (optional) |
| How the patches stack, and why | [`proposals/README.md`](proposals/README.md) |
| Recipe (starting state) | [`recipes/ife_sidebar_repro/`](../../../recipes/ife_sidebar_repro/) |
| Evidence (layers, results, manual pass), exact commits | [EVIDENCE.md](EVIDENCE.md) |
| Findings (including an unrelated upstream one) | [FINDINGS-2026-10-01.md](FINDINGS-2026-10-01.md) |
| Scripted runs and screenshots | [`playwright/`](playwright/) · [`compare/`](compare/) |
| Virtual screen-reader runs | [`screenreader/`](screenreader/) |
| Browser and colour-mode matrix | [COVERAGE.md](COVERAGE.md) |
| Draft comment (do not post) | [ISSUE-COMMENT-DRAFT.md](ISSUE-COMMENT-DRAFT.md) |
| Status snapshots | [STATUS-2026-10-02.md](STATUS-2026-10-02.md) · [STATUS-2026-10-01.md](STATUS-2026-10-01.md) |

## Sources

- https://www.drupal.org/project/drupal/issues/3619127 (2026-10-02): issue page, status **Needs review**, blocks [#2915899](https://www.drupal.org/project/drupal/issues/2915899)
- https://git.drupalcode.org/project/drupal/-/merge_requests/16895 (2026-10-01): merge request !16895, source `3619127-forms-sidebar-with-ife`, target `main`
- Review threads on MR !16895 are listed in [STATUS-2026-10-01.md](STATUS-2026-10-01.md)

## Not verified

- A real VoiceOver or NVDA pass — **deferred by decision** on 2026-10-01, not a failure.
- Firefox (Playwright's Firefox does not launch on this machine).
- Other themes than Default Admin; a wide viewport, zoom and reflow, right-to-left, and touch.
- The manual keyboard pass by a person (the layer list in `EVIDENCE.md` notes what it should cover).

## Notes

- The patch stack is, in order: the MR patch, then `patch-0` (removes jQuery) and `patch-1` (does not overwrite the saved
  preference; test waits). `patch-2` (a test base class suggested by a reviewer) is not applied by default.
- The lab built both pairs: `3619127-pinned` and `3619127-latest`; they are registered in `tools/compare/variants.json`.
  A bundle is at `bundles/drupal-repro-3619127-2026-10-02.zip`.
- Known limit: an unrelated upstream test is flaky on pristine `main` (`FormErrorHandlerCKEditor5Test::testFragmentLink`,
  2 failures in 6 runs) — do not blame a patch for it.
- AI-assisted: scripted runs; nothing has been posted to drupal.org or GitLab.
