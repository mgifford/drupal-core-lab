# Evidence: issue 2942404 (system messages: options on current main)

Status: DRAFT, AI-assisted. Scripted evidence only; no person has reviewed it.
Date: 2026-11-19   Author/agent: Copilot (lab session)

This compares two designs. The original defect (`role="contentinfo"` around messages) does not reproduce on current main, so the recorded verdict is `not-reproduced` for every run.

## Environments (record exact commits)
| Env | Directory | Commit | Notes |
|-----|-----------|--------|-------|
| Baseline (Before) | envs/baseline-2942404-latest | 92e5c3a3047 | upstream main, unmodified: message block is the live region, no landmark |
| Option (After) | envs/issue-2942404-latest | 92e5c3a3047 | plus `branches/2942404-main-region-option.patch` (lab-authored, 3 templates, no tests) |

Plain install (no content types), DDEV, PHP 8.5, admin theme Default Admin, front-end theme Stark.

## Automated results
| Run | Command | Result |
|-----|---------|--------|
| Chromium, light, 1280x900 | `node tools/playwright/evaluate-2942404.mjs 2942404-latest` | not-reproduced, After checks not met: 0; axe violations per scenario Before [0, 0, 0, 0], After [0, 0, 0, 0] ([run](playwright/2026-11-19T20-37-06-327Z-chromium-light-1280x900/README.md)) |
| Chromium, dark | `... --scheme=dark` | not-reproduced, After checks not met: 0; axe violations per scenario Before [0, 0, 0, 0], After [0, 0, 0, 0] ([run](playwright/2026-11-19T20-37-25-564Z-chromium-dark-1280x900/README.md)) |
| Chromium, light, forced colors | `... --forced-colors` | not-reproduced, After checks not met: 0; axe violations per scenario Before [2, 2, 4, 1], After [2, 2, 4, 1] ([run](playwright/2026-11-19T20-37-42-698Z-chromium-light-forced-1280x900/README.md)) |
| Chromium, dark, forced colors | `... --scheme=dark --forced-colors` | not-reproduced, After checks not met: 0; axe violations per scenario Before [1, 1, 1, 1], After [1, 1, 1, 1] ([run](playwright/2026-11-19T20-37-58-556Z-chromium-dark-forced-1280x900/README.md)) |
| Chromium, 480x900 | `... --viewport=480x900` | not-reproduced, After checks not met: 0; axe violations per scenario Before [0, 0, 0, 0], After [0, 0, 0, 0] ([run](playwright/2026-11-19T20-38-15-799Z-chromium-light-480x900/README.md)) |
| Firefox | `... --browser=firefox` | not-reproduced, After checks not met: 0; axe violations per scenario Before [0, 0, 0, 0], After [0, 0, 0, 0] ([run](playwright/2026-11-19T20-38-32-961Z-firefox-light-1280x900/README.md)) |
| WebKit | `... --browser=webkit` | not-reproduced, After checks not met: 0; axe violations per scenario Before [0, 0, 0, 0], After [0, 0, 0, 0] ([run](playwright/2026-11-19T20-39-01-214Z-webkit-light-1280x900/README.md)) |
| Core's code checks | `node scripts/lint.mjs 2942404-latest` | PASS ([report](lint/2026-11-19-2942404-latest-after.md)); code style, not accessibility evidence |

Scenarios in each run: a status message after "Clear all caches" (server-rendered, redirect, admin theme); an error on the site-information form (server-rendered, admin theme, nothing saved); a warning and a status message added with `Drupal.Message` (client-rendered); an error after a wrong password, logged out (server-rendered, Stark, system template).
Checks recorded on both sides and met on both: no `contentinfo` inside messages; every message block is or contains an `alert` or `status` live region; every block has a name; errors are `alert`; no block has two nested live regions.

## What the runs showed (Chromium light)
| Observation | Before (main) | After (option) |
|-------------|---------------|----------------|
| Server status message | one element, `status`, label "Status message" | `region` "Status message" containing `status` |
| Server error message | one element, `alert`, label "Error message" | `region` "Error message" containing `alert` |
| Message landmarks per page with one message type | 0 | 1 |
| Message added by JavaScript (warning, status) | `alert` "Warning message", `status` "Status message" | identical (not changed by the option) |
| Recorder: live-region changes after the redirect | 1 | 1 |
| axe-core violations (WCAG 2.2 A/AA) | 0 | 0 |

In the forced-colors runs axe reports the same `color-contrast` counts on both sides (light 2, 2, 4, 1; dark 1 each); no rule is new on After.

## Findings
- The server-rendered warning role differs by design (main: `alert`; option: `status`) but no stock page renders a server warning, so it was not measured. The JavaScript path already gives warnings `alert` on both sides.
- The option's extra `region` per message type adds landmarks when several types are present; whether that helps or adds noise is the open question and needs a person with a screen reader.
- The recorder saw one live-region change per server-rendered scenario on both sides. That is a count of DOM changes the lab observed, not speech.

## Not verified
- Any screen reader (VoiceOver, NVDA, JAWS), a person's keyboard pass, Windows contrast themes, 200% zoom.
- Server-rendered messages delivered by AJAX or BigPipe; a server-rendered warning; theme-specific templates other than the system, Default Admin and starterkit ones (Umami is not covered by the option).
- The old tests: the option deliberately leaves them out, so core's tests that assert message markup (for example `PlaceholderMessageTest`, `BigPipePlaceholderTestCases`, `ModulesListFormWebTest`) would fail against the option and have not been run.
