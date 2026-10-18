# Evidence: issue 3619154 (Sidebar toggle fixes, Default Admin meta sidebar)

Status: DRAFT. No person has reviewed these results; no manual rows yet.
Date: 2026-10-17   Author/agent: AI-assisted (Claude Code), for Mike Gifford to review

## Environments (record exact commits)
| Env | Directory | Commit | Notes |
|-----|-----------|--------|-------|
| Baseline (pinned) | envs/baseline-3619154 | `6868135a` | 2026-10-14 run, DDEV |
| Patched (pinned) | envs/issue-3619154 | `6868135a` + `branches/sidebar-toggle-fixes.patch` | MR !16911 @ `6f7766cb` |
| Before (scratch) | not a lab environment | `f2abd414` | 2026-10-17 evaluator validation, PHP 8.5 built-in server, MariaDB 10.11, no DDEV |
| After (scratch) | not a lab environment | `f2abd414` + the same patch without its Umami YAML hunk | see validation/2026-10-17-scratch/SUMMARY.md |
| Before / After (latest) | envs/baseline-3619154-latest, envs/issue-3619154-latest | not built | the pair for the new revision, MR !16911 at `175e6f17` (2026-10-17) |

## Automated results
| Run | Command | Result |
|-----|---------|--------|
| [2026-10-14](playwright/2026-10-14T15-27-15-737Z-evaluate/SUMMARY.md) | earlier `evaluate-3619154.mjs` (pinned, Chromium, 1280px) | Toggle and close become `<button>`; Space works only After; Enter works on both. Its "sidebar shown" row is invalid (always `false`: `offsetParent` is `null` for the `position: fixed` sidebar). |
| [2026-10-17 scratch](validation/2026-10-17-scratch/SUMMARY.md) | current `evaluate-3619154.mjs` through a shim, core main `f2abd41`, Chromium 141 | **Previous** revision (`6f7766cb`). Normal colours: reproduced-and-fixed, 11 of 12 fix checks as expected (F11 not applicable on Before), 14 regression checks pass, 0 axe violations, no JS errors. Forced colours: mixed, R12 fails: the close button's icon has 64 pixels at rest and 12 with focus (comment #23). Not lab evidence. |
| new revision `175e6f17` | `node tools/playwright/evaluate-3619154.mjs 3619154-latest --forced-colors` (and without) | not run: the patch is not in the lab yet (REPRODUCE.md, step 1) |

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
- **The new revision, `175e6f17`.** drupal.org and git.drupalcode.org could not be reached from the 2026-10-17 session; its facts come
  from the issue page as pasted by the owner (STATUS-2026-10-17.md).
- The site without the Navigation module, and Escape shared with Navigation (comment #6).
- Anything in DDEV after 2026-10-14; Firefox, WebKit, dark; forced colours outside Chromium's emulation; a person's keyboard pass; any screen reader.
- Touch resizing, a right-to-left language install (F13 sets `dir="rtl"` on `<html>` only), resizing after an AJAX rebuild, entity
  forms other than `/node/1/edit`.
- Core PHPUnit, Nightwatch and performance tests, including the Umami performance assertions the patch edits.
