# Navigation Focus Tooltips Cannot Be Dismissed With Escape

> **Draft only. Do not post from AS-OACR-001 without separate approval.**

> **Scope:** [AS-OACR-001 finding `a11y_navigation_focus_tooltip_not_dismissible`](https://github.com/mgifford/drupal-core/blob/e097dea11245909b3c793dbbd502440a7fc7c780/openacr-pilot/docs/reviews/as-oacr-001-public-review/findings/a11y_navigation_focus_tooltip_not_dismissible.json)
> records this Drupal 11.4.4 reproduction. The work used the public
> [Zivtech accessibility-skills workflow](https://github.com/zivtech/accessibility-skills/tree/817dedeae90324017ece2d2b104332aec9d20656)
> ([GPL-3.0-or-later](https://github.com/zivtech/accessibility-skills/blob/817dedeae90324017ece2d2b104332aec9d20656/LICENSE)).
> Raw captures remain in local custody; this is not an issued ACR, Drupal
> project position, or Drupal-wide conformance claim.

## Problem and impact

When the desktop Navigation toolbar is collapsed, moving keyboard focus to an icon link displays an
author-controlled tooltip over the main page. Pressing Escape does not dismiss the tooltip while
focus remains on the trigger.

This fails the dismissible requirement in Web Content Accessibility Guidelines (WCAG) 2.2 Success
Criterion 1.4.13, Content on Hover or Focus. Keyboard and magnification users must move focus away
to clear content that obscures the page they are reading.

- Project: Drupal core
- Component: Navigation module
- Category: Bug report
- Suggested priority: Major
- WCAG criterion: 1.4.13 Content on Hover or Focus, Level AA
- Test rule: manual `wcag-1.4.13-focus-tooltip-dismissal`
- Confirmed frequency: one shared Navigation tooltip instance tested; seven triggers use the same component on the sampled page

## Steps to reproduce

1. Install Drupal 11.4.4 with the Standard profile and enable the core Navigation module.
2. Log in as an administrator and leave the desktop Navigation toolbar collapsed.
3. Open `/admin/structure/views/view/content/edit/page_1`.
4. Move keyboard focus to the “Blocks” icon link in Navigation.
5. Confirm that the “Blocks” tooltip appears over the main page content.
6. Press Escape without moving focus.

## Expected result

Escape dismisses the tooltip without moving keyboard focus from the trigger.

## Actual result

The tooltip remains visible after Escape. In the tested viewport it measured 71.25 by 34 CSS pixels
and covered the main page region.

## Element details

- Simplified XPath: `//*[@data-drupal-tooltip="Blocks"]`
- Full trigger DOM path: `/html[1]/body[1]/aside[1]/nav[1]/div[1]/div[2]/ul[1]/li[2]/a[1]`
- Full tooltip DOM path: `/html[1]/body[1]/aside[1]/nav[1]/div[1]/div[2]/ul[1]/li[2]/div[1]`

```html
<a href="/admin/content/block"
   data-drupal-tooltip="Blocks"
   data-drupal-tooltip-class="admin-toolbar__tooltip"
   class="toolbar-button toolbar-button--icon--navigation-blocks toolbar-button--collapsible">
  …
</a>
<div class="toolbar-tooltip admin-toolbar__tooltip">Blocks</div>
```

## Suggested resolution

Add an Escape handler that hides the active tooltip without moving focus. The behavior should be
covered by an automated keyboard test for each shared Navigation tooltip component state. If hover
also displays the tooltip in a supported toolbar state, the same component should allow the pointer
to enter the tooltip without dismissing it.

## Related issues

- [Drupal core #3197758](https://www.drupal.org/project/drupal/issues/3197758) discusses a reusable accessible tooltip/toggletip component and explicitly raises the WCAG 1.4.13 hoverable requirement.
- [Drupal core #3541728](https://www.drupal.org/project/drupal/issues/3541728) tracks a separate Escape failure for Navigation submenus.

Neither issue documents the focus-triggered toolbar tooltip remaining visible after Escape.

## Test environment

- Drupal 11.4.4, Standard profile, core modules only
- Core Navigation module and Claro administration theme
- Chrome 151 on macOS
- Playwright 1.62.1 using real focus and Escape events

Automated browser interaction collected the geometry and visibility evidence; manual review mapped
the behavior to WCAG 2.2 Success Criterion 1.4.13.
