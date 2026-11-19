# #3636143: navigation toggle hover and keyboard-focus emphasis (lab enhancement over MR !17738)

**DRAFT, AI-assisted; not RTBC.** Automated results from 2026-11-19, Chromium only. No person has reviewed the keyboard behaviour, and no real screen reader or Windows contrast theme was used.

[SUMMARY.md](SUMMARY.md) and [EVIDENCE.md](EVIDENCE.md) in this folder describe a separate integration with #3637339 (`3636143-with-skip-focus`). This file covers the toggle itself.

## Versions compared

| | Code | Where |
|---|---|---|
| A | Unmodified core `92e5c3a30476` (main, 2026-11-18) | Before of `3636143-latest` |
| B | A plus [MR !17738](https://git.drupalcode.org/project/drupal/-/merge_requests/17738), head `5e5521e4`, base `fea1e49ac3e5`, [patch](branches/3636143-regression-the-toggle.patch) sha256 `08a86e98` | `3636143-pinned` (**not built; no retained run**) |
| C | B plus the lab enhancement, [patch](branches/3636143-toggle-hover-focus.patch) sha256 `be3e8db3` | After of `3636143-latest` |

The enhancement patch is the interdiff over the MR: [interdiff](proposal/3636143-interdiff-enhancement-over-mr-5e5521e4.patch) (sha256 `515b6a09`; same changed lines as the captured patch). [Complete patch](proposal/3636143-full-mr-plus-enhancement.patch) (sha256 `27db757b`) applies cleanly to core main `92e5c3a30476` and to the MR's base `fea1e49ac3e5`; the enhancement applies on the MR tree. The MR patch is unchanged.

Site: `https://repro-issue-3636143-latest.ddev.site/admin/appearance/settings/default_admin` (Standard install, Navigation and Default Admin, `admin`).

## What the code does

The toggle's rules live in `core/modules/navigation/css/components/admin-toolbar.pcss.css` (compiled `admin-toolbar.css`), not in Default Admin's `navigation.pcss.css`, which only maps tokens. `--admin-toolbar-color-gray-300` is used only by this toggle border, so the MR changes no other component (checked by searching core at the base commit).

On `:hover` and `:focus-visible` the enhancement sets the border and chevron to `--admin-toolbar-color-gray-990`, the background to `--admin-toolbar-color-gray-050`, and adds a 1px inset ring (`box-shadow`) so the circle looks thicker without changing its 36×36 size. `:focus-visible` adds a 2px outline in `--admin-toolbar-color-focus` at 2px offset. Under `forced-colors: active`, border and outline use `Highlight` (no reliance on the shadow). Only existing tokens are used, so it also works without Default Admin. Core's build (`build:css`), Stylelint, CSpell and PHPStan pass: [lint report](lint/2026-11-19-3636143-latest-after.md).

I chose this combined treatment (border, background and external outline) because it is the only one that keeps the cue visible when the border, background or colour alone is hard to see. The two lighter alternatives (border emphasis only; border plus background) were **not built or measured**, so there is no comparison between the options yet.

## Measured results (rendered colours, real pointer and Tab, expanded and collapsed sidebar)

Contrast of the border against the background outside the circle; chevron against the circle's inside; outline against the outside. The 3:1 border figure is the issue's design objective, not a WCAG verdict.

| Run | State | A border | C border | A chevron | C chevron | C focus outline |
|---|---|---|---|---|---|---|
| [Light 1280](playwright/2026-11-19T15-29-05-094Z-chromium-light-1280x900/SUMMARY.md) | default | 1.81:1 | 3.11:1 | 15.54:1 | 15.54:1 | none |
| | hover | 1.81:1 | 6.82:1 | 6.82:1 | 5.94:1 | none |
| | keyboard focus | 1.81:1 | 6.82:1 | 15.54:1 | 5.94:1 | 2px, 4.35:1 |
| [Dark 1280](playwright/2026-11-19T15-29-22-982Z-chromium-dark-1280x900/SUMMARY.md) | default | 7.89:1 | 5.02:1 | 9.54:1 | 9.54:1 | none |
| | hover | 7.89:1 | 8.54:1 | 8.54:1 | 6.65:1 | none |
| | keyboard focus | 7.89:1 | 8.54:1 | 9.54:1 | 6.65:1 | 2px, 6.94:1 |
| [Forced colors, light](playwright/2026-11-19T15-29-42-619Z-chromium-light-forced-1280x900/SUMMARY.md) | default | 21:1 | 21:1 | 21:1 | 21:1 | none |
| | hover / focus | 19.09:1 | 19.09:1 | 21:1 | 21:1 | 2px, 19.09:1 |
| [Forced colors, dark](playwright/2026-11-19T15-29-59-987Z-chromium-dark-forced-1280x900/SUMMARY.md) | default | 21:1 | 21:1 | 21:1 | 21:1 | none |
| | hover / focus | 14.37:1 | 14.37:1 | 21:1 | 21:1 | 2px, 14.37:1 |

- The values for expanded and collapsed sidebars are identical in every run.
- **Dark mode:** the MR's token mapping lowers the default border from 7.89:1 to 5.02:1. It still meets 3:1.
- In forced colors the Before already shows a visible border, and its hover also changes the border. The enhancement only adds the outline on hover there.
- Before this change, hover changes only the chevron colour and keyboard focus draws an outline with no offset.
- **No layout shift:** the button is 36×36 in every state and run.
- **Focus outline:** not clipped by an ancestor and inside the viewport in every state measured.
- **Keyboard:** Tab reaches the toggle (17 presses from the page start); Enter collapses and Space expands; focus stays on the toggle after Enter. Focus plus hover keeps the outline.
- **axe-core** (WCAG 2.2 A/AA tags): no violations in light or dark, and none new in any run. The dark forced-colors run reports 2 on both sides, unchanged.
- **Other settings:** [RTL by `dir` attribute](playwright/2026-11-19T15-30-30-853Z-chromium-light-1280x900/SUMMARY.md) and [reduced-motion preference](playwright/2026-11-19T15-30-46-605Z-chromium-light-1280x900/SUMMARY.md) give the same results as light. The change adds no animation, so reduced motion only confirms nothing broke.
- **Viewports:** at 768 and 480px the toggle is not displayed (it is a desktop control, shown from 64rem), so there is nothing to measure there. This is responsive behaviour, not a pass.

## Not done

- Version B (MR only) has no retained run: `3636143-pinned` is not built. Earlier ad hoc readings on the MR-only site matched B (border `rgb(142,146,156)`, no hover change, the same tight focus outline), but they were not saved.
- Firefox and WebKit, 200% zoom, a real RTL language, touch, and any real screen reader or Windows contrast theme.
- Experimental comparison of the lighter treatments (options 1 and 2).
- A person's keyboard pass. Screenshots are labelled with side, variant, state and run; look at them before relying on the numbers.
- The MR's review threads could not be read (HTTP 401), so unresolved threads are unknown.

## Reproduce

```bash
node tools/compare/setup.mjs 3636143-latest
node scripts/lab-env.mjs start 3636143-latest
node tools/playwright/evaluate-3636143.mjs 3636143-latest [--scheme=dark] [--forced-colors] [--viewport=768x900] [--rtl] [--reduced-motion]
```

If a site shows an old style after a patch change, clear Drupal's cache (the viewer's **Clear cache**).
