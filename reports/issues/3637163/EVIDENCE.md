# Evidence: issue 3637163 (custom accent and focus color validation)

Status: DRAFT, AI-assisted. Scripted evidence only; no person has reviewed it.
Date: 2026-11-19   Author/agent: Copilot (lab session)

## Environments (record exact commits)
| Env | Directory | Commit | Notes |
|-----|-----------|--------|-------|
| Baseline | envs/baseline-3637163-latest | 92e5c3a3047 | upstream main, unmodified |
| Patched  | envs/issue-3637163-latest | 92e5c3a3047 | plus `branches/3637163-phase1-hex-validation.patch` (lab-authored, no MR; sha256 recorded by `capture-patch`/`setup`) |

Plain Standard install on both sides, Default Admin as admin theme, DDEV, PHP 8.5.

## Automated results
| Run | Command | Result |
|-----|---------|--------|
| Chromium, light, 1280x900 | `node tools/playwright/evaluate-3637163.mjs 3637163-latest` | reproduced-and-fixed; Before 9 checks not met, After 0 ([run](playwright/2026-11-19T19-32-05-478Z-chromium-light-1280x900/README.md)) |
| Chromium, dark | `... --scheme=dark` | same; Before 9, After 0 ([run](playwright/2026-11-19T19-32-23-828Z-chromium-dark-1280x900/README.md)) |
| Chromium, light, forced colors | `... --forced-colors` | Before 8, After 0 ([run](playwright/2026-11-19T19-32-40-398Z-chromium-light-forced-1280x900/README.md)) |
| Chromium, dark, forced colors | `... --scheme=dark --forced-colors` | Before 8, After 0 ([run](playwright/2026-11-19T19-32-56-470Z-chromium-dark-forced-1280x900/README.md)) |
| Chromium, 480x900 | `... --viewport=480x900` | Before 9, After 0 ([run](playwright/2026-11-19T19-33-12-465Z-chromium-light-480x900/README.md)) |
| Firefox | `... --browser=firefox` | Before 9, After 0 ([run](playwright/2026-11-19T19-33-28-712Z-firefox-light-1280x900/README.md)) |
| WebKit | `... --browser=webkit` | Before 9, After 0 ([run](playwright/2026-11-19T19-33-48-734Z-webkit-light-1280x900/README.md)) |
| Proposed tests | `node scripts/try-tests.mjs 3637163-latest reports/issues/3637163/tests-proposal` | `CustomColorValidationTest` (3 tests) fail on Before, pass on After; `SettingsColorTest` (15 cases) passes on After; PHPCS and PHPStan clean ([TESTS-REPORT.md](TESTS-REPORT.md)) |
| Core's code checks | `node scripts/lint.mjs 3637163-latest` | PASS (CSpell, PHPStan, PHPCS, ESLint) ([report](lint/2026-11-19-3637163-latest-after.md)); code style, not accessibility evidence |

axe-core (WCAG 2.2 A/AA tags), with an invalid value entered and after a server-side error: 0 violations on both sides in Chromium light, light forced colors, 480px, Firefox and WebKit. Chromium dark: Before 12 `color-contrast` violations (the broken interface), After 0. Chromium dark with forced colors: Before 8, After 2, all `color-contrast` and the same 2 at both stages; no rule is new on After. Those 2 were not investigated, and axe's contrast results in forced-colors emulation are not a verdict.
The text is typed with the keyboard and the field left with Tab; turning off the browser's form validation (to test the server) and restoring the Blue preset at the end are script-assisted.

## What the runs showed (Chromium light; the other runs agree)
| Check | Before | After |
|-------|--------|-------|
| Invalid accent (`777777`, `#zzzzzz`) applied to the live color | yes: `--accent-base` set to the text; Save button background transparent | no: `--accent-base` stays `#015efe` |
| Message for an invalid accent value | none | `role="alert"` message, field `aria-invalid="true"`, linked by `aria-describedby`; cleared when corrected |
| Corrected value `#336699` applied; picker follows | yes | yes |
| Preset Red, then Custom again with an invalid value | invalid text applied again | Red stays |
| Invalid custom focus color (`abc`) | custom focus style applied with `--admin-color-focus: abc`; Tab shows no outline | not applied; Tab shows a solid 4px outline |
| Invalid value submitted with browser validation off | accepted and stored (`zzzzzz`) | rejected with an error naming the format; not stored |
| Stored invalid value in the page (Functional test) | printed into `style` (`--accent-base: #ff0000; color: transparent;`) | `--accent-base: #015efe`, preset `blue`, focus `default` |

Pictures and file legend: [playwright/README.md](playwright/README.md).

## Manual results (keyboard, screen reader, forced colours)
Not done by a person. Forced colors was Chromium's emulation, not a Windows contrast theme.

## Findings
- Root cause: `migration/js/accent.js` writes whatever string it is given into `--accent-base` or a generated `<style>` (`setCustomAccentColor`, `setCustomFocusColor`); `settings.js` calls it on the field's `change` event; `Settings.php` has only an HTML `pattern` and `#maxlength` 7; `PreprocessHooks::preprocessHtml()` and `ThemeHooks` print stored values unvalidated.
- The `custom` preset's own fallback color is `#000` (`Helper::accentColors()`), which the preset-change handler applied before the text was checked.
- Not a regression of Drupal markup alone: the pre-fix code also lets a stored value from config or user data reach the `style` attribute.

## Not verified
- Any person's keyboard or screen reader pass; real VoiceOver/NVDA; Windows contrast themes; 200% zoom; translated or real RTL.
- The user-profile override form (same `Settings::getSettingsForm()` code path, not exercised by the browser runs).
- JavaScript tests inside Drupal (Nightwatch or FunctionalJavascript) for the preview; the proposed tests have not run in drupal.org's CI.
- Color formats other than six-digit hex (Phase 2 onward); the pinned variant; Coder.
