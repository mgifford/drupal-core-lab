# Evidence: issue 2942404 (system messages: options on current main)

Status: DRAFT, AI-assisted. Scripted evidence only; no person has reviewed it.
Date: 2026-11-19   Author/agent: Copilot (lab session)

This compares two designs. The original defect (`role="contentinfo"` around messages) does not reproduce on current main, so the recorded verdict is `not-reproduced` for every run.

## Environments (record exact commits)
| Env | Directory | Commit | Notes |
|-----|-----------|--------|-------|
| Baseline (Before) | envs/baseline-2942404-latest | 92e5c3a3047 | upstream main, unmodified: message block is the live region, no landmark |
| Option (After) | envs/issue-2942404-latest | 92e5c3a3047 | plus `branches/2942404-main-region-option.patch` (lab-authored, 3 templates, no tests) |

Plain install plus the recipe `recipes/repro_2942404` (the Article content type), DDEV, PHP 8.5, admin theme Default Admin, front-end theme Stark.

## Automated results
| Run | Command | Result |
|-----|---------|--------|
| Chromium, light, 1280x900 | `node tools/playwright/evaluate-2942404.mjs 2942404-latest` | not-reproduced, After checks not met: 0; axe violations per scenario Before [0, 0, 0, 0], After [0, 0, 0, 0] ([run](playwright/2026-11-19T21-04-46-346Z-chromium-light-1280x900/README.md)) |
| Chromium, dark | `... --scheme=dark` | not-reproduced, After checks not met: 0; axe violations per scenario Before [0, 0, 0, 0], After [0, 0, 0, 0] ([run](playwright/2026-11-19T21-05-16-458Z-chromium-dark-1280x900/README.md)) |
| Chromium, light, forced colors | `... --forced-colors` | not-reproduced, After checks not met: 0; axe violations per scenario Before [2, 2, 4, 1], After [2, 2, 4, 1] ([run](playwright/2026-11-19T21-05-43-809Z-chromium-light-forced-1280x900/README.md)) |
| Chromium, dark, forced colors | `... --scheme=dark --forced-colors` | not-reproduced, After checks not met: 0; axe violations per scenario Before [1, 1, 1, 1], After [1, 1, 1, 1] ([run](playwright/2026-11-19T21-06-10-170Z-chromium-dark-forced-1280x900/README.md)) |
| Chromium, 480x900 | `... --viewport=480x900` | not-reproduced, After checks not met: 0; axe violations per scenario Before [0, 0, 0, 0], After [0, 0, 0, 0] ([run](playwright/2026-11-19T21-06-35-804Z-chromium-light-480x900/README.md)) |
| Firefox | `... --browser=firefox` | not-reproduced, After checks not met: 0; axe violations per scenario Before [0, 0, 0, 0], After [0, 0, 0, 0] ([run](playwright/2026-11-19T21-07-01-682Z-firefox-light-1280x900/README.md)) |
| WebKit | `... --browser=webkit` | not-reproduced, After checks not met: 0; axe violations per scenario Before [0, 0, 0, 0], After [0, 0, 0, 0] ([run](playwright/2026-11-19T21-07-49-954Z-webkit-light-1280x900/README.md)) |
| Core's code checks | `node scripts/lint.mjs 2942404-latest` | PASS ([report](lint/2026-11-19-2942404-latest-after.md)); code style, not accessibility evidence |

Scenarios in each run: a status message after saving an Article (server-rendered, redirect, front-end theme); an error on the Article form with an empty title (server-rendered, admin theme; the browser's validation is switched off); a status message after "Clear all caches" (server-rendered, admin theme); a warning and a status message added with `Drupal.Message` (client-rendered); an error after a wrong password while logged out (server-rendered, front-end theme).
Checks recorded on both sides and met on both: no `contentinfo` inside messages; every message block is or contains an `alert` or `status` live region; every block has a name; errors are `alert`; no block has two nested live regions.

## What the runs showed (Chromium light)
| Observation | Before (main) | After (option) |
|-------------|---------------|----------------|
| Server status message (Article saved, Stark; and cache cleared, admin) | one element, `status`, label "Status message" | `region` "Status message" containing `status` |
| Server error message (Article form, admin; wrong password, Stark) | one element, `alert`, label "Error message" | `region` "Error message" containing `alert` |
| Message landmarks per page with one message type | 0 | 1 |
| Message added by JavaScript (warning, status) | `alert` "Warning message", `status` "Status message" | identical (not changed by the option) |
| Recorder: live-region changes after the redirect | 1 | 1 |
| axe-core violations (WCAG 2.2 A/AA) | 0 | 0 |

In the forced-colors runs axe reports the same `color-contrast` counts on both sides (light 2, 1, 2, 4, 1; dark 2, 1, 1, 2, 1, one number per scenario in the order above); no rule is new on After.

## Findings
- The server-rendered warning role differs by design (main: `alert`; option: `status`) but no stock page renders a server warning, so it was not measured. The JavaScript path already gives warnings `alert` on both sides.
- The option's extra `region` per message type adds landmarks when several types are present; whether that helps or adds noise is the open question and needs a person with a screen reader.
- Two messages added with `Drupal.Message` made the recorder log 2 live-region changes and 2 to 3 `Drupal.announce()` calls, the same on both sides (an earlier trial logged 2). Whether that is a duplicate announcement is not established and needs a person with a screen reader; it is an investigation lead, not a finding.
- The recorder saw one live-region change per server-rendered scenario on both sides. That is a count of DOM changes the lab observed, not speech.

## Not verified
- Any screen reader (VoiceOver, NVDA, JAWS), a person's keyboard pass, Windows contrast themes, 200% zoom.
- Server-rendered messages delivered by AJAX or BigPipe; a server-rendered warning; theme-specific templates other than the system, Default Admin and starterkit ones (Umami is not covered by the option).
- The old tests: the option deliberately leaves them out, so core's tests that assert message markup (for example `PlaceholderMessageTest`, `BigPipePlaceholderTestCases`, `ModulesListFormWebTest`) would fail against the option and have not been run.

Screen reader evidence (Guidepup virtual reader and Guidepup with real VoiceOver, Before and After): [SCREENREADER.md](SCREENREADER.md).
