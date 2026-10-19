# Evidence: issue 3619154 (Sidebar toggle fixes, Default Admin meta sidebar)

Status: DRAFT. No person has reviewed these results; no manual rows yet.
Date: 2026-10-18   Author/agent: AI-assisted (Claude Code), for Mike Gifford to review

## Environments (record exact commits)
| Env | Directory | Commit | Notes |
|-----|-----------|--------|-------|
| Baseline (pinned) | envs/baseline-3619154 | `6868135a` | 2026-10-14 run, DDEV |
| Patched (pinned) | envs/issue-3619154 | `6868135a` + `branches/sidebar-toggle-fixes.patch` | MR !16911 @ `6f7766cb` |
| Before (scratch) | not a lab environment | `f2abd414` | 2026-10-17 evaluator validation, PHP 8.5 built-in server, MariaDB 10.11, no DDEV |
| After (scratch) | not a lab environment | `f2abd414` + the same patch without its Umami YAML hunk | see validation/2026-10-17-scratch/SUMMARY.md |
| Before (scratch) 2026-10-18 | not a lab environment | `f2abd414` | same scratch setup, caches rebuilt |
| After (scratch) 2026-10-18 | not a lab environment | `f2abd414` + `branches/sidebar-toggle-fixes.patch` (MR !16911 at `175e6f17`, all 23 files) | see validation/2026-10-18-scratch-175e6f17/SUMMARY.md |
| Before / After (pinned and latest, DDEV) | envs/baseline-3619154(-latest), envs/issue-3619154(-latest) | not built with 175e6f17 | both now core `f2abd414` + MR !16911 at `175e6f17` |

## Automated results
| Run | Command | Result |
|-----|---------|--------|
| [2026-10-14](playwright/2026-10-14T15-27-15-737Z-evaluate/SUMMARY.md) | earlier `evaluate-3619154.mjs` (pinned, Chromium, 1280px) | Toggle and close become `<button>`; Space works only After; Enter works on both. Its "sidebar shown" row is invalid (always `false`: `offsetParent` is `null` for the `position: fixed` sidebar). |
| [2026-10-17 scratch](validation/2026-10-17-scratch/SUMMARY.md) | current `evaluate-3619154.mjs` through a shim, core main `f2abd41`, Chromium 141 | **Previous** revision (`6f7766cb`). Normal colours: reproduced-and-fixed, 11 of 12 fix checks as expected (F11 not applicable on Before), 14 regression checks pass, 0 axe violations, no JS errors. Forced colours: mixed, R12 fails: the close button's icon has 64 pixels at rest and 12 with focus (comment #23). Not lab evidence. |
| [2026-10-18 scratch](validation/2026-10-18-scratch-175e6f17/SUMMARY.md) | the same, with MR !16911 at `175e6f17` | **New revision.** Normal and forced colours: reproduced-and-fixed, 11 of 12 fix checks as expected (F11 not applicable on Before), 14 regression checks pass, 0 axe violations, no JS errors. R12 passes in forced colours: 76 icon pixels with focus, 64 at rest. Every other row equals the `6f7766cb` run. Not lab evidence. |
| [2026-10-19 scratch tree diff](validation/2026-10-19-scratch-tree-diff/README.md) | `tools/playwright/tree-diff.mjs` on the same two sites, `/node/1/edit` and `/node/add/article`, 1280 and 480 px | Accessibility tree, ARIA after JavaScript and Guidepup speech differ only where the MR meant them to: the toggle becomes a `<button>` named "Sidebar panel" (was "Hide/Show sidebar panel") with its state in `aria-expanded`; the close button becomes a `<button>` with `aria-controls`, moved to the top of the sidebar. Not lab evidence. |
| [2026-10-19 scratch silent changes](validation/2026-10-19-scratch-silent-changes/README.md) | `evaluate-3619154.mjs` with the new changes-after-input check, same two sites, through a stand-in for DDEV | Before: Alt+S shows the sidebar's content silently (4 silent changes). After: the shortcut moves focus into the sidebar; the four are gone in After. Evaluator result unchanged (exit 0). Not lab evidence. |
| DDEV run of `175e6f17` | `node tools/playwright/evaluate-3619154.mjs 3619154-latest --forced-colors` (and without) | not run |
| 2026-10-14 proposed test | `ddev phpunit core/themes/default_admin/tests/src/FunctionalJavascript/SidebarToggleTest.php` ([source](tests-proposal/SidebarToggleTest.php), [patch](branches/3619154-proposed-test.patch)) | **Previous** revision (`6f7766cb`): After OK, 5 tests, 51 assertions; Before 5 failures (toggle is `<a>`; no state, inert, focus or Escape handling). Covers the controls being `<button>`, `aria-expanded`, state and width kept across reload, and below 1024px `inert`, focus to the close button, Escape returning focus. Applies on `175e6f17`; not re-run. |

## Manual results (keyboard, screen reader, forced colours)
AT/browser/OS versions: none yet.

| Check | Baseline | Patched |
|-------|----------|---------|
| Keyboard pass in the viewer (Tab, Enter, Space, Escape at 1280px and below 1024px) | not done | not done |
| Synthetic screen reader (Guidepup): toggle name and state, close button, overlay | not done | not done |
| Forced colours, by eye: toggle, close button (rest and focus), overlay, resize handle | not done | not done |

## Findings
None filed. Barriers outside this issue go to `scripts/findings.mjs`.

## Not verified
- **`175e6f17` in DDEV.** It was tested only in the scratch environment. Its code came from the MR diff pasted by the owner, checked
  file by file against the diff's hashes (BRANCHES.md); its issue facts from the issue page as pasted (STATUS-2026-10-17.md).
- Forced colours with a real contrast theme, a dark forced palette, and any browser but Chromium.
- The site without the Navigation module, and Escape shared with Navigation (comment #6).
- Anything in DDEV after 2026-10-14; Firefox, WebKit, dark; forced colours outside Chromium's emulation; a person's keyboard pass; any screen reader.
- Touch resizing, a right-to-left language install (F13 sets `dir="rtl"` on `<html>` only), resizing after an AJAX rebuild, entity
  forms other than `/node/1/edit`.
- Core PHPUnit, Nightwatch and performance tests, including the Umami performance assertions the patch edits. The lab's proposed
  `SidebarToggleTest` ran only against `6f7766cb`.
