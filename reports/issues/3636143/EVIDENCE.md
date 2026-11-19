# Evidence: Drupal 3636143 combined skip-link integration

**DRAFT, AI-assisted.** Automated observations dated 2026-11-19; no human keyboard or real screen-reader review.

## Identity and scope

- Comparison: `3636143-with-skip-focus`, plain Standard installs with Default Admin and Navigation; no recipe.
- Both core commits: `92e5c3a30476e248e82679cb63fa44c51bc667d0`.
- Before: `issue-3636143-latest`, containing only MR !17738.
- After: `issue-3636143-with-skip-focus`, containing MR !17738 followed by the separate complete 3637339 focus/clearance proposal.
- Patch hashes and source bases: [BRANCHES.md](BRANCHES.md).
- The pristine `baseline-3636143-latest` had no tracked changes and is stopped. It is not this integration's Before.
- All seven public issue comments were read. Intake refreshed at `2026-11-19T10:06:29.132Z`.
  [The brief](intake/BRIEF.md) records the related 3506321 regression context and the HTTP 401 discussion-access gap.
  The related issue's full discussion was not evaluated in this integration task.

## Applicability and lint

Both declared stacks applied cleanly to the selected core in temporary worktrees.
[Core lint passed](lint/2026-11-19-3636143-with-skip-focus-after.md) on the four changed CSS files.
The upstream toggle patch and the separate skip-link proposal bytes are unchanged.

## Trusted-keyboard evaluator

Reused the [3637339 evaluator](../../../tools/playwright/evaluate-3637339.mjs), allowing integrations that explicitly declare its complete skip-link proposal.
Output retains the actual issue number and comparison slug. These runs do not populate pinned-core coverage.

| Run | Conditions | Result |
|---|---|---|
| [Desktop Orange](playwright/2026-11-19T12-22-42-541Z-chromium-light-1280x900/SUMMARY.md) | Chromium 1280x900; saved Pink accent / Orange focus in Light and Dark; two fresh-document trials per side | Before color mismatch reproduced; After follows configured focus, full ring bounds inside viewport, Enter reaches main content, paired geometry/navigation and toggle contrast checks pass |
| [Narrow forced dark](playwright/2026-11-19T12-23-18-892Z-chromium-dark-forced-375x900/SUMMARY.md) | Chromium 375x900, dark OS, forced-colors emulation; saved Dark / Pink / Orange; two trials per side | After matches the comparable control's system-color outline; full bounds and activation checks pass. Desktop toggle contrast is explicitly not applicable: its rendered area is zero |
| [Desktop forced dark](playwright/2026-11-19T12-23-42-557Z-chromium-dark-forced-1280x900/SUMMARY.md) | Chromium 1280x900, dark OS, forced-colors emulation; saved Dark / Pink / Orange; two trials per side | After focus/activation checks pass; visible toggle border is white against black, an estimated 21:1 |

Across these three final runs: four configuration/environment combinations, 16 trials, zero infrastructure errors,
new JavaScript errors, measured layout/navigation regressions or detected axe rule/node-count increases.
Equal detector counts do not exclude changed affected elements or prove conformance.
The evaluator restored initial saved settings after each run.

The forced-color outline was `rgba(26, 235, 255, 0.8)`, not Orange. System-color substitution is expected there.
This is browser emulation, not real Windows contrast-theme or assistive-technology testing.

Earlier runs at 10:37 and 10:54 predated the numeric toggle assertion.
The [11:17 run](playwright/2026-11-19T11-17-20-317Z-chromium-dark-forced-375x900/SUMMARY.md) then reported two After failures:
the assertion incorrectly required contrast for the hidden desktop toggle at 375px.
That result is retained. The final narrow run records non-applicability explicitly, and the separate desktop forced-colors run measures the visible control.
Missing controls or unmeasurable visible surfaces still fail the assertion.

## Exact screenshot setting and review state

A separate automated browser check saved **Auto appearance and Orange focus** on both sites, with dark OS preference emulated.
It reloaded the page, reached the skip link with trusted Tab input, captured focus, and verified Enter reached `main-content`.
The navigation toggle completed a click-based collapse/expand round trip; that does not constitute a person's keyboard test.

| Before: MR only | After: MR plus skip-link proposal |
|---|---|
| [Blue browser ring](integration/before-auto-dark-orange-focused.png) | [Orange focus ring](integration/after-auto-dark-orange-focused.png) |

Before used `rgb(153, 200, 255)`, 1px auto outline.
After used `rgb(244, 160, 127)`, 4px solid outline with 2px offset.
A model inspected the After capture and observed the Orange ring and saved Orange option; this is not human sign-off.
[The compact verification record](integration/verification.json) contains the observations and token-mapping fixtures.
Auto appearance and Orange focus are intentionally retained on both sites for the human review.

## Border check correction

The previous viewer check required `rgb(142, 146, 156)` regardless of appearance.
That is a Light-mode implementation value, not the accessibility requirement.

| Mode | Border | Nearest opaque background | Computed estimate |
|---|---|---|---|
| Light | `rgb(142, 146, 156)` | `rgb(255, 255, 255)` | 3.1149:1 |
| Dark | `rgb(153, 153, 153)` | `rgb(42, 42, 45)` | 5.0227:1 |

Both integration sides retain the same navigation border values in each saved appearance.
The revised viewer predicate compares the toolbar token with the appearance-aware input-border token, not one RGB literal.
It is a code-mapping check, not a contrast test. Missing controls or empty tokens do not pass.
Unit tests and browser fixtures reject the original token mismatch and accept patched Light and Dark mappings.
The evaluator separately asserts at least 3:1 against the nearest opaque solid background for a rendered toggle.
Unmeasurable visible surfaces fail; a responsive toggle with zero rendered area is recorded as not applicable, never as a contrast pass.
The focused unit suite passed 68 tests, including probe-safety validation and the appearance-dependent mapping regression.
The full Lab self-test passed all nine groups (425 unit tests).

These are computed opaque-color estimates, not sampled painted pixels, text contrast measurements or a whole-component accessibility verdict.
Comment #7's broader concern still needs human review.

## Limits, artifacts and next action

Large results, axe scans, accessibility-tree dumps and browser-session data stay local.
Run summaries, selected focused screenshots and the compact verification record are the intended review artifacts.
No new upstream patch bytes were created and no Drupal.org post or issue-fork update was made.
The existing complete patch/interdiff pair remains under [3637339](../3637339/BRANCHES.md).

Next owner: the human contributor/reviewer. Follow [REPRODUCE.md](REPRODUCE.md) and the separate
[skip-link human-review checklist](../3637339/HUMAN-REVIEW.md), substituting this integration's declared site names.
Resolve unread upstream discussions before submission. No RTBC recommendation is made.
