# Olivero Mobile Local-Tabs Trigger Uses an Insufficient Focus Indicator

> **Draft only. Do not post from AS-OACR-001 without separate approval.**

> **Scope:** [AS-OACR-001 finding `a11y_olivero_tabs_trigger_focus_indicator`](https://github.com/mgifford/drupal-core/blob/e097dea11245909b3c793dbbd502440a7fc7c780/openacr-pilot/docs/reviews/as-oacr-001-public-review/findings/a11y_olivero_tabs_trigger_focus_indicator.json)
> records this Drupal 11.4.4 reproduction. The work used the public
> [Zivtech accessibility-skills workflow](https://github.com/zivtech/accessibility-skills/tree/817dedeae90324017ece2d2b104332aec9d20656)
> ([GPL-3.0-or-later](https://github.com/zivtech/accessibility-skills/blob/817dedeae90324017ece2d2b104332aec9d20656/LICENSE)).
> Raw captures remain in local custody; this is not an issued ACR, Drupal
> project position, or Drupal-wide conformance claim.

## Problem and impact

At the mobile breakpoint, Olivero's local-tabs trigger indicates keyboard focus only by changing
the color of its existing 1 CSS pixel border. The focused border measures 2.902:1 against the
adjacent background. This fails Web Content Accessibility Guidelines (WCAG) 2.2 Success Criteria
1.4.1, Use of Color, and 1.4.11, Non-text Contrast.

People who use a keyboard and people with low vision may not be able to identify the focused
control reliably.

- Project: Drupal core
- Component: Olivero theme
- Category: Bug report
- Suggested priority: Normal
- Affected selector: `.tabs__trigger`

## Steps to reproduce

1. Install Drupal 11.4.4 with the Standard profile and Olivero.
2. Open `/user/login` with a 320 CSS pixel-wide viewport.
3. Press Tab until focus reaches the “Tabs display toggle” button.
4. Compare the focused and unfocused border, then measure the focused border against its adjacent background.

## Expected result

The control uses a non-color focus cue, or its focus-state color change reaches 3:1. The visual
indicator also reaches at least 3:1 against adjacent colors.

## Actual result

The border changes from `rgb(234, 238, 240)` to `rgb(27, 154, 228)`. No outline or shadow appears.
The focused border measures 2.902:1 against `rgb(246, 248, 248)`.

## Suggested resolution

Give `.tabs__trigger:focus-visible` a persistent focus outline or other non-color treatment that
reaches at least 3:1 against adjacent colors. Add a keyboard-focus regression test for the mobile
local-tabs state.

## Related issues

- [#3153260: Standardize Olivero's focus states across all non-form controls](https://www.drupal.org/project/drupal/issues/3153260)
- [#3125062: Accessibility problems in pager design](https://www.drupal.org/project/olivero/issues/3125062)

Neither issue records this current `.tabs__trigger` measurement.

## Test environment

- Drupal 11.4.4, Standard profile, core modules only
- Olivero
- Chrome 151 on macOS
- Playwright 1.62.1
- Real Tab input, computed styles, and rendered screenshot review
