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
| Before / After (latest) | envs/baseline-3619154-latest, envs/issue-3619154-latest | not built | the pair for the new MR revision |

## Automated results
| Run | Command | Result |
|-----|---------|--------|
| [2026-10-14](playwright/2026-10-14T15-27-15-737Z-evaluate/SUMMARY.md) | earlier `evaluate-3619154.mjs` (pinned, Chromium, 1280px) | Toggle and close become `<button>`; Space works only After; Enter works on both. Its "sidebar shown" row is invalid (always `false`: `offsetParent` is `null` for the `position: fixed` sidebar). |
| [2026-10-17 scratch](validation/2026-10-17-scratch/SUMMARY.md) | current `evaluate-3619154.mjs` through a shim, core main `f2abd41` | reproduced-and-fixed for the **previous** revision: 10 fix checks as expected (F11 not applicable on Before), 11 regression checks pass, 0 axe violations, no JS errors, at 800px and 480px narrow widths. Not lab evidence. |
| new revision | `node tools/playwright/evaluate-3619154.mjs 3619154-latest` | not run |

## Manual results (keyboard, screen reader, forced colours)
AT/browser/OS versions: none yet.

| Check | Baseline | Patched |
|-------|----------|---------|
| Keyboard pass in the viewer (Tab, Enter, Space, Escape at 1280px and below 1024px) | not done | not done |
| Synthetic screen reader (Guidepup): toggle name and state, close button, overlay | not done | not done |
| Forced colours: toggle, close button, overlay, resize handle | not done | not done |

## Findings
None filed. Barriers outside this issue go to `scripts/findings.mjs`.

## Not verified
- **The new merge request revision.** drupal.org and git.drupalcode.org could not be reached from the 2026-10-17 session.
- Anything in DDEV after 2026-10-14; Firefox, WebKit, dark, forced colours; a person's keyboard pass; any screen reader.
- Touch resizing, right-to-left, resizing after an AJAX rebuild, entity forms other than `/node/1/edit`.
- Core PHPUnit, Nightwatch and performance tests, including the Umami performance assertions the patch edits.
