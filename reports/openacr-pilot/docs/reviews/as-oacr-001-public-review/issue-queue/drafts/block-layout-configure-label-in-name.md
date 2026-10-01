# Block Layout Configure Links Do Not Include Their Visible Label in the Accessible Name

> **Draft only. Do not post from AS-OACR-001 without separate approval.**

> **Scope:** [AS-OACR-001 finding `a11y_claro_configure_label_not_in_name`](https://github.com/mgifford/drupal-core/blob/e097dea11245909b3c793dbbd502440a7fc7c780/openacr-pilot/docs/reviews/as-oacr-001-public-review/findings/a11y_claro_configure_label_not_in_name.json)
> records this Drupal 11.4.4 reproduction. The work used the public
> [Zivtech accessibility-skills workflow](https://github.com/zivtech/accessibility-skills/tree/817dedeae90324017ece2d2b104332aec9d20656)
> ([GPL-3.0-or-later](https://github.com/zivtech/accessibility-skills/blob/817dedeae90324017ece2d2b104332aec9d20656/LICENSE)).
> Raw captures remain in local custody; this is not an issued ACR, Drupal
> project position, or Drupal-wide conformance claim.

## Problem and impact

On Block layout, 12 links visibly labeled “Configure” have accessible names such as “Edit Site
branding.” The visible word is absent from the accessible name. This fails WCAG 2.2 Success
Criterion 2.5.3, Label in Name, and makes spoken-label activation unreliable.

- Project: Drupal core
- Component: Block system
- Category: Bug report
- Suggested priority: Major

## Steps to reproduce

1. Install Drupal 11.4.4 with the Standard profile.
2. Log in as an administrator and open `/admin/structure/block`.
3. Locate the Site branding row's visible “Configure” link.
4. Inspect the link's accessible name.

## Expected result

The accessible name contains the visible word “Configure,” preferably at the beginning.

## Actual result

The visible label is “Configure,” while the accessible name is “Edit Site branding.” The same
pattern affects 12 placed-block operation links in the tested page.

## Cause and suggested resolution

`EntityListBuilder::getDefaultOperations()` assigns an `aria-label` such as “Edit Site branding.”
`BlockListBuilder::getDefaultOperations()` later changes the operation title from “Edit” to
“Configure” without updating that `aria-label`.

Update the accessible name when BlockListBuilder changes the visible operation title, for example
to “Configure Site branding.” Add a functional test that compares the visible operation label with
the computed accessible name.

## Test environment

- Drupal 11.4.4, Standard profile, core modules only
- Claro
- Chrome 151 on macOS
- Default and expanded-state label-in-name inventories
