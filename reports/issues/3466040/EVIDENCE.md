# Evidence: issue 3466040 (modal actions leave the viewport)

Status: DRAFT until the manual rows are completed and a human has reviewed.
Date: 2026-11-24. Author/agent: Copilot.

## Environments (record exact commits)
| Env | Directory | Commit | Notes |
|-----|-----------|--------|-------|
| Baseline | envs/baseline-3466040-latest | 97c6ff8b2534b242c0f1df3e4ba2493e56aebcec | pristine upstream main |
| Patched  | envs/issue-3466040-latest | 97c6ff8b2534b242c0f1df3e4ba2493e56aebcec | `3466040-resubmission.patch`, sha256 `42460a17` |

## Automated results
| Run | Command | Result |
|-----|---------|--------|
| 1280x900 Chromium | `node tools/playwright/evaluate-3466040.mjs 3466040-latest --viewport=1280x900` | reproduced and fixed; Before `height: auto`, action pane outside; After `height: 450`, action pane inside |
| 480x900 Chromium | `node tools/playwright/evaluate-3466040.mjs 3466040-latest --viewport=480x900` | reproduced and fixed |
| 1280x900 forced colours | `node tools/playwright/evaluate-3466040.mjs 3466040-latest --viewport=1280x900 --forced-colors` | reproduced and fixed; zero axe elements before and after |
| Core lint | `node scripts/lint.mjs 3466040-latest` | PASS: CSpell, PHPStan, PHPCS and ESLint |
| Focused PHPUnit | `ddev phpunit .../DialogTest.php --filter testPercentageHeightDialogResizesAfterContentGrowth` | [PASS: 1 test, 7 assertions](test-runs/3466040-focused-phpunit.txt) |
| Patch hygiene | `git apply --cached --check` against current `origin/main` | [PASS at `0f267dbcf05`](test-runs/3466040-patch-check.txt) |

## Manual results (keyboard, screen reader, forced colours)
AT/browser/OS versions: Chromium 159.0.8154.6 on macOS. No real screen reader was run.

| Check | Baseline | Patched |
|-------|----------|---------|
| Pointer expansion at 1280x900 | Reproduced | Fixed |
| Emulated forced colours | Reproduced | Fixed |
| One real Tab press after expansion | Save receives focus but remains off-screen | Save receives focus and remains visible |
| Person-driven keyboard-only pass | Not run | Not run |
| Real screen reader | Not run | Not run |

## Findings
The production fix is one JavaScript behavior change: a caller-supplied percentage height remains a numeric percentage-derived height instead of becoming `auto`. The repeated displacement subtraction is moved outside the option loop. No CSS, theme, ARIA, focus-trap, or announcement code changed.

## Not verified
- Firefox and WebKit.
- Real keyboard-only review by a person.
- Real VoiceOver, NVDA, JAWS, or TalkBack.
- 400% browser reflow and 200% text zoom.
- Full `DialogTest` suite completion.
