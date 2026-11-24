# Reproduce #3594809: Use standard checkboxes on forms that require submission

**DRAFT: preparation is verified, but live visual and interaction reproduction
is blocked by Docker disk capacity.**

Issue: https://www.drupal.org/project/drupal/issues/3594809  
MR: [!16770](https://git.drupalcode.org/project/drupal/-/merge_requests/16770)  
Pinned Core: `07d6e6935e795a62266697da0286a77b7c94b1a4`

## Problem

Default Admin applies switch-like CSS to ordinary native checkboxes on forms
that require explicit submission. A switch can suggest immediate application,
but these controls persist only after the form is saved.

The target is not every checkbox and not a blanket claim that every styled
checkbox has failed a WCAG criterion. The target is the visual, accessible
name, role, state, and interaction behavior of the real Appearance settings
form.

## Exact comparison identity

- Environment: local DDEV on macOS; preparation verified.
- Installation: Drupal Standard profile. Default Admin is the administration
  theme.
- Recipe: `recipes/repro_3594809/recipe.yml`; it intentionally adds no
  modules or synthetic content.
- Page: `/admin/appearance/settings`.
- Primary control: the native `toggle_favicon` checkbox labeled "Shortcut
  icon".
- Pinned Before: `envs/baseline-3594809`, pristine Core
  `07d6e6935e795a62266697da0286a77b7c94b1a4`.
- MR After: `envs/issue-3594809`, same Core plus
  `branches/main.patch` (MR !16770 tip `94a48fe8ed1a`, SHA-256
  `37cf48a602eb6cdb95c8105ab0ddfefc56b70a5266c063b1a9c8bc1ace37a2ce`).
- Corrective After: `3594809-corrected`, the same MR patch plus
  `branches/delete-empty-stylesheets.patch`, which deletes the two tracked
  empty stylesheet files.
- Latest pair: pristine Core
  `97c6ff8b2534b242c0f1df3e4ba2493e56aebcec` compared with
  `branches/main-rebased-97c6ff8b.patch`. The original MR patch does not
  apply to this Core revision.

## Static setup results

The original MR patch applies cleanly to its pinned base. It does not apply to
current `main`. The corrective stack and the current-main rebase pass
`git apply --cached --check`.

Core's CSS check fails on the original MR because the two affected stylesheet
files remain tracked and empty:

- `core/themes/default_admin/css/components/form--checkbox-toggle.pcss.css`
- `core/themes/default_admin/css/components/form--checkbox-toggle.css`

The actual errors are `no-empty-source` from Stylelint and a stale
source/output result from Core's CSS builder. This is a patch hygiene problem,
not an accessibility pass or fail.

## Build and start

First ensure no unrelated Lab comparison is running. The attempted build
failed at DDEV container startup with `no space left on device`. Host space
later recovered, but three unrelated Before/After pairs were active in the
shared environment, so this pair was not started concurrently.

```bash
node tools/compare/setup.mjs 3594809-pinned --check-patches
node tools/compare/setup.mjs 3594809-pinned
node scripts/lab-env.mjs start 3594809-pinned
```

Open the viewer, log in to both frames, and use
`/admin/appearance/settings`.

## Shortest live reproduction

1. Confirm the two sites use the same Standard-install configuration and Core
   commit.
2. Find the "Shortcut icon" checkbox in Page element display.
3. Observe its unchecked and checked presentation. The issue expects a
   switch-like control Before and an ordinary checkbox After.
4. Reach the control with Tab and toggle it with Space in each frame.
5. Activate the checkbox with its associated label and with a pointer.
6. Leave the page without saving. Return and confirm the saved value did not
   change.
7. Change the value again, activate Save configuration, and reload. Confirm
   the saved value changed.
8. Record disabled, grouped checkbox, radio, focus, narrow-width, RTL, dark,
   forced-colors light, forced-colors dark, 200% and 400% zoom states.

Expected visual result: After uses the ordinary square checkbox appearance.
Expected behavior on both sides: native checkbox semantics and explicit form
submission remain unchanged.

## Scripted replay

```bash
node tools/playwright/evaluate-3594809.mjs 3594809-pinned
node tools/playwright/evaluate-3594809.mjs 3594809-corrected
node tools/playwright/evaluate-3594809.mjs 3594809-latest
```

The evaluator records computed presentation, native role and accessible name,
real Tab/Space and pointer actions, save/reload behavior, representative
grouped checkbox and radio controls, axe, accessibility snapshots, and
screenshots. It has been syntax-checked but not run because DDEV could not
start.

## Preference matrix

Repeat the evaluator with the variant's matching options:

```bash
node tools/playwright/evaluate-3594809.mjs 3594809-corrected --scheme=dark
node tools/playwright/evaluate-3594809.mjs 3594809-corrected --forced-colors --scheme=light
node tools/playwright/evaluate-3594809.mjs 3594809-corrected --forced-colors --scheme=dark
node tools/playwright/evaluate-3594809.mjs 3594809-corrected --viewport=480x900
node tools/playwright/evaluate-3594809.mjs 3594809-corrected --rtl
```

Forced colors here are browser emulation, not a native Windows contrast theme.
Viewport reflow is not a substitute for a person testing browser zoom.

## Current Core

```bash
node tools/compare/setup.mjs 3594809-latest --checkout-only
node tools/compare/setup.mjs 3594809-latest
node scripts/lab-env.mjs start 3594809-latest
node tools/playwright/evaluate-3594809.mjs 3594809-latest
```

Checkout-only preparation passes. Live setup remains blocked by Docker space.

## What has not been verified

No live browser, screenshot, keyboard, save/reload, forced-colors, zoom, screen
reader, or assistive-technology result is available. A person's keyboard and
screen-reader review remains required. No real VoiceOver or NVDA pass was made.
