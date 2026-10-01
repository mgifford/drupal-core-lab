# Claro Block Layout Empty-Region Text Fails Minimum Contrast

> **Draft only. Do not post from AS-OACR-001 without separate approval.**

> **Scope:** [AS-OACR-001 finding `a11y_claro_empty_region_contrast`](https://github.com/mgifford/drupal-core/blob/e097dea11245909b3c793dbbd502440a7fc7c780/openacr-pilot/docs/reviews/as-oacr-001-public-review/findings/a11y_claro_empty_region_contrast.json)
> records this Drupal 11.4.4 reproduction. The work used the public
> [Zivtech accessibility-skills workflow](https://github.com/zivtech/accessibility-skills/tree/817dedeae90324017ece2d2b104332aec9d20656)
> ([GPL-3.0-or-later](https://github.com/zivtech/accessibility-skills/blob/817dedeae90324017ece2d2b104332aec9d20656/LICENSE)).
> Raw captures remain in local custody; this is not an issued ACR, Drupal
> project position, or Drupal-wide conformance claim.

## Problem and impact

On the Claro Block layout page, the italic “No blocks in this region” text renders as `#828388`
on white. The measured contrast ratio is 3.78:1, below the 4.5:1 minimum for normal text in Web
Content Accessibility Guidelines (WCAG) 2.2 Success Criterion 1.4.3, Contrast (Minimum).

This makes the empty-region state harder to read for people with low vision or reduced contrast
sensitivity. The message communicates the state of each block region, so it is not decorative.

- Project: Drupal core
- Component: Claro theme
- Category: Bug report
- Suggested priority: Normal
- WCAG criterion: 1.4.3 Contrast (Minimum), Level AA
- Test rule: axe-core `color-contrast`
- Confirmed frequency: five empty-region messages on the tested Block layout page

## Steps to reproduce

1. Install Drupal 11.4.4 with the Standard profile.
2. Use Claro as the administration theme.
3. Log in as an administrator.
4. Open `/admin/structure/block` on the Olivero theme tab.
5. Locate an empty region containing “No blocks in this region.”
6. Measure the text color against the white row background.

## Expected result

The normal-sized informational text has a contrast ratio of at least 4.5:1 against its background.

## Actual result

The 16 CSS pixel, normal-weight text renders as `#828388` on `#ffffff`, a 3.78:1 contrast ratio.
The same result appears at desktop and narrow viewport widths.

## Element details

- CSS selector: `.region-hero-message > td[colspan="5"] > em`
- Simplified XPath: `//tr[contains(@class, "region-hero-message")]//em[normalize-space()="No blocks in this region"]`
- Full DOM path from the tested page: `/html[1]/body[1]/div[3]/main[1]/div[2]/div[2]/div[3]/div[1]/form[1]/table[1]/tbody[1]/tr[11]/td[1]/em[1]`
- HTML: `<em>No blocks in this region</em>`

## Suggested resolution

Use a Claro text color that reaches at least 4.5:1 on the rendered row background. Add an automated
contrast regression test for this message on Block layout.

## Related issue

[Drupal core #3293469](https://www.drupal.org/project/drupal/issues/3293469) captured the same
3.78:1 result while adding automated accessibility tests. That issue is closed and did not resolve
the current rendered contrast failure.

## Test environment

- Drupal 11.4.4, Standard profile, core modules only
- Claro administration theme
- Chrome 151 on macOS
- Playwright 1.62.1 and axe-core 4.13.0

Automated tooling identified the candidate; rendered-style and screenshot review confirmed the
finding.
