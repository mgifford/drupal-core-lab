# Evidence: issue 3590502

Status: DRAFT. The automated run is complete; person-led manual rows remain open.
Date: 2026-11-23. Author/agent: Copilot SDK with a human-review gate.

## Environments (record exact commits)
| Env | Directory | Commit | Notes |
|-----|-----------|--------|-------|
| Baseline | envs/baseline-3590502-latest | 97c6ff8b2534b242c0f1df3e4ba2493e56aebcec | Drupal core `main`, 2026-11-23 |
| Patched | envs/issue-3590502-latest | 97c6ff8b2534b242c0f1df3e4ba2493e56aebcec | MR !17640 head 091a0f3c99f196e8959a0c8a8c11cd9b8f4e54d9 |

Patch: `branches/3590502-move-local-tasks.patch`; SHA-256
`53dc7bb629af1e376457b1c1fd0de5e4b657129d290eae988ad22e2c3d351e0c`.
Both sides used the Standard install, Navigation and Default Admin, with the same
`recipes/repro_3590502/recipe.yml`.

## Automated results
| Run | Command | Result |
|-----|---------|--------|
| `playwright/2026-11-23T23-46-00-146Z-chromium-light-1280x900` | `node tools/playwright/evaluate-3590502.mjs 3590502-latest` | Reproduced and fixed on all judged rows |
| `playwright/2026-11-24T00-32-38-036Z-chromium-light-forced-1280x900` | Same with `--forced-colors` | Reproduced and fixed in emulated forced colours |
| `playwright/2026-11-24T00-38-38-301Z-chromium-light-480x900` | Same with `--viewport=480x900` | Reproduced and fixed; the keyboard flow opens Default Admin's collapsed local-task menu |

Chromium 159.0.8154.6, macOS on arm64, 1280x900, light scheme. The evaluator used
real Tab and Enter key input and scanned both `/user/1/edit` and `/user/1` with
axe-core WCAG 2.0 to 2.2 A/AA tags.

| Check | Baseline | Patched |
|-------|----------|---------|
| View local task on `/user/1/edit` | Absent from primary local tasks | Present |
| Edit local task on `/user/1/edit` | Absent from primary local tasks | Present |
| View in Navigation top-bar actions on `/user/1/edit` | Present in More actions | Absent |
| Edit local task on `/user/1` | Absent from primary local tasks | Present |
| Featured Edit action on `/user/1` | Present in top bar | Absent |
| Keyboard route from `/user/1/edit` to View | More actions menu, 21 Tab presses | Local task, 20 Tab presses |
| axe violations | 0 on both routes | 0 on both routes |
| JavaScript errors | 0 | 0 |

The screenshots in the run folder show the complete Before/After state. The
run's `results.json` records the side contexts, patch identities, page records,
keyboard replay, axe findings and JavaScript errors.

Core lint evidence is in
`lint/2026-11-23-3590502-latest-after.md`. PHPCS, ESLint and CSpell passed.
PHPStan did not complete because its worker was SIGKILLed by the container OOM
killer, so the overall lint result is incomplete rather than a code finding.

## Findings
The selected MR behavior is visible on the tested admin-themed user routes:
the patch restores View/Edit to the content-header local-task row and removes
those routes from Navigation's top-bar actions. The patch does not introduce a
detectable axe or JavaScript regression in this narrow run.

## Not verified
- No real screen-reader pass was run. Automated speech recording is not equivalent.
- No person-led keyboard assessment of focus visibility or order quality was run;
  the evaluator only confirms reachability with scripted trusted key input.
- Dark mode, Firefox and WebKit are not tested. Emulated forced colours and the
  480px viewport passed, but real Windows High Contrast and a person-led review
  are still required.
- Other entity classes reported by the issue (content, blocks and media), active
  Layout Builder tasks, empty More actions behavior and performance assertions were not evaluated.
- Review threads could not be read because GitLab returned HTTP 401 during intake.
