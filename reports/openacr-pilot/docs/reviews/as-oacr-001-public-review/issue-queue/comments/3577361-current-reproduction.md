# Draft Comment for Drupal Core #3577361

> **Draft only. Do not post from AS-OACR-001 without separate approval.**

> **Scope:** [AS-OACR-001 finding `a11y_claro_article_edit_reflow`](https://github.com/mgifford/drupal-core/blob/e097dea11245909b3c793dbbd502440a7fc7c780/openacr-pilot/docs/reviews/as-oacr-001-public-review/findings/a11y_claro_article_edit_reflow.json)
> records this Drupal 11.4.4 reproduction. The work used the public
> [Zivtech accessibility-skills workflow](https://github.com/zivtech/accessibility-skills/tree/817dedeae90324017ece2d2b104332aec9d20656)
> ([GPL-3.0-or-later](https://github.com/zivtech/accessibility-skills/blob/817dedeae90324017ece2d2b104332aec9d20656/LICENSE)).
> Raw captures remain in local custody; this is not an issued ACR, Drupal
> project position, or Drupal-wide conformance claim.

I reproduced this issue on a core-only Drupal 11.4.4 Standard installation with Navigation enabled
and Claro as the administration theme.

On `/node/2/edit`, a 320 CSS pixel viewport produced a 345 CSS pixel document. The
`.top-bar__actions` region and “More actions” control extended to x=345.375, causing whole-page
horizontal scrolling. The edit form does not inherently require a two-dimensional layout, so this
is a WCAG 2.2 Success Criterion 1.4.10 reflow failure in the tested configuration.

Environment: Chrome 151 on macOS and Playwright 1.62.1. The result was confirmed with rendered
geometry and full-page screenshots at both horizontal extremes.
