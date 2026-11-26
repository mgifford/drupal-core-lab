# Visual differences: #3155130 summary disclosure

Status: **DRAFT**, automated screenshots only. Compare the pairs in [`visual/`](visual/). The expected result is that the
interface looks substantially the same while the semantics, names, focus and keyboard behaviour improve.

## Intentional differences

1. **The control has one persistent position.** It now sits immediately before the summary content it controls, outside
   every label, in both states. Before, it was inside the Body label when collapsed and inside the Summary label when
   expanded, so it moved when activated.
   - Collapsed: `visual/chromium-light-default_admin-1280x900-collapsed-before.png` shows `Body ( Edit summary )`;
     `…-collapsed-after.png` shows `( Edit summary )` on its own line above `Body`.
   - Expanded: `…-expanded-before.png` shows `Summary ( Hide summary )` inside the Summary label;
     `…-expanded-after.png` shows `( Hide summary )` above the Summary label.
   - **Why required:** valid label markup, a stable textarea name, and one control that does not move or get replaced.
     There is no way to keep the control inside a label and satisfy those requirements.

2. **The visible focus ring stays on the control in the expanded screenshot.** In the After expanded screenshot the
   button is focused after the Enter/Space sequence, so the theme's focus ring is visible. In the Before screenshot focus
   has fallen to `<body>` and no focus ring is shown. This is a focus behaviour difference, not a styling change.

3. **The summary label's accessible name gains field/item context.** The visible word "Summary" is unchanged; a
   `visually-hidden` suffix such as " for Body" is added. In a multi-value row the suffix is
   " for Notes (three values) (value 2)". There is no visual difference and no layout shift.

4. **Required/always-visible summaries gain the same hidden context.** Their labels still read "Summary"; the accessible
   name becomes "Summary for Required summary". No control is added to those fields.

## What is deliberately unchanged

- The link-style native `<button>`, its `link link-edit-summary` classes, the `field-edit-link` wrapper and the
  parentheses from `Drupal.theme.textEditSummaryButton()`.
- The text "Edit summary" / "Hide summary", the typography, colours, spacing and focus styling of the active theme.
- The Body/Summary field styling, the editor, the format selector, and the summary-before-value field order (so the
  summary still appears above the Body editor, as it does today).
- No CSS file was added or changed. No icon, chevron, accordion, card, border or background was introduced.
- The button is a normal inline element on its own line because the summary wrapper is a block. It has the same small
  parenthetical link appearance as before; it is not a prominent button.

## Screenshot matrix

All pairs are in [`visual/`](visual/); the full run folders are in [`playwright/`](playwright/).

| Context | Screenshots |
|---|---|
| Default Admin, light | `chromium-light-default_admin-1280x900-{collapsed,expanded,multi-value,required-error,theme-override}-{before,after}.png` |
| Default Admin, dark | `chromium-dark-default_admin-1280x900-{collapsed,expanded}-*.png` |
| Default Admin, forced colours | `chromium-light-forced-default_admin-1280x900-*.png` |
| Default Admin, narrow (480 px) | `chromium-light-default_admin-480x900-*.png` |
| Default Admin, simulated RTL | `chromium-light-default_admin-rtl-1280x900-*.png` |
| Default Admin, 200% root font | `chromium-light-default_admin-zoom200-1600x1200-*.png` |
| Claro 4.0.x, light | `chromium-light-claro-1280x900-{collapsed,expanded,multi-value,required-error,theme-override}-*.png` |
| Claro 4.0.x, dark | `chromium-dark-claro-1280x900-*.png` |
| Claro 4.0.x, forced colours | `chromium-light-forced-claro-1280x900-*.png` |
| Claro 4.0.x, 200% root font | `chromium-light-claro-zoom200-1600x1200-*.png` |

ARIA tree diffs: `chromium-light-default_admin-1280x900-aria-{collapsed,expanded}.diff` and the Claro equivalents.

## Observations by context

- **Light and dark:** the control is legible in both; the theme's link colour is unchanged. axe reports no contrast
  violation in either scheme.
- **Forced colours:** the emulated forced-colours rendering keeps the control visible and focusable; no new colour is
  introduced. This is emulation, not a real Windows High Contrast test.
- **Narrow (480 px):** the control sits at the start of the field and does not overlap the editor; the sidebar is collapsed
  to the “Expand sidebar” button. The summary stays hidden until requested.
- **RTL (simulated):** the control follows the flipped field start. The English strings show expected bidi artifacts
  (“Not saved yet :Last saved”); this is a visual sanity check, not an RTL translation test.
- **200% root font:** the Default Admin and Claro sidebars overlap the form and partly cover the control at 1600 px (and
  intercepted a click at 1280 px). This is a pre-existing layout behaviour of the admin themes at large text; it is
  recorded as finding F004 and was not changed here. The disclosure itself remains in the DOM, in the tab order and
  keyboard-operable, and the wide run completed its DOM/ARIA checks.

## What a reviewer should look for

1. The only visual change is where the parenthetical control sits (above Body when collapsed; above Summary when
   expanded). It is never inside a label.
2. It looks like the same small link, in the same colours and font, with the same words and parentheses.
3. The summary field itself has not changed size, order or styling.
4. Any other pixel difference between Before and After should be reported; there should be none.
