# Evidence: issue 3604037 (Indicate that grouping elements have child element errors)

Status: **DRAFT.** The lab's measurements for this issue were written up as they were taken, in
[`EVALUATION-2026-10-01.md`](EVALUATION-2026-10-01.md). This file is the standard name for them and points
to each source instead of repeating it. A person has not reviewed the results.

## Environments (exact commits)
| Env | Directory | Core commit | MR / patches |
|-----|-----------|-------------|--------------|
| Baseline | `envs/baseline-3604037-latest` | `8cd44d484e3c` (2026-10-01) | upstream `main` |
| Patched  | `envs/issue-3604037-latest` | `8cd44d484e3c` (2026-10-01) | MR !17078, tip `e8b2e166be8` |

The `-pinned` variant pins core to `c321043bb82d` (2026-09-28), the commit the patch was based on.

## Where the evidence is
| What | Where |
|---|---|
| Measurements and images (forced colours, RTL, CSS check, PHPUnit Before vs After) | [`EVALUATION-2026-10-01.md`](EVALUATION-2026-10-01.md) |
| The MR's own PHPUnit test logs | [`phpunit/`](phpunit/) — pass on After, fail on Before |
| Scripted runs and screenshots (light, dark, forced colours, RTL, JS off) | [`playwright/`](playwright/) |
| Core's own code checks on the patched files | [`lint/`](lint/) — not accessibility evidence |
| Follow-up patches proposed on the MR | [`proposals/`](proposals/) |
| Browser and colour-mode matrix | not generated (`node scripts/coverage.mjs 3604037`) |

## Findings (one line each; detail in EVALUATION-2026-10-01.md)
- The change adds error cues to closed or inactive grouping elements; measured on Before and After in Chromium.
- Forced-colours icon colour (`canvasText`) does not match the label (link colour); `preserve-parent-color` is suggested.
- Dark-mode error contrast fails (`#ce6060`: 3.72 to 4.48:1); a token change belongs with [#3625458](https://www.drupal.org/project/drupal/issues/3625458).
- The MR's PHPUnit tests pass on After and fail on the same tests run against Before's code.

## Not verified
RTL was measured with real Farsi but English interface text. Not done: a real screen reader, Firefox and
Safari, a real Windows contrast theme, and the MR's PHPUnit tests with the proposal patches applied. A
person should look at the images before anything is posted.
