# Issue #3619387 — Sidebar errors (indicator + modal behavior)

Default Admin sidebar: show a `has-error` indicator on the toggle when the advanced group
has child validation errors, and behave as a modal dialog (inert background, focus trap)
when it overlaps content on narrow viewports.

## Deliverables in this folder
- `3619387-sidebar-errors-full.patch` — full patch vs branch base (HEAD). Uploadable.
- `sidebar-errors-full.patch` — same full patch (copy).
- `sidebar-errors-interdiff.patch` — interdiff vs `patches/core-a11y-aggregate-2026-07-20.patch`.
  `Helper.php` is omitted because its has-error work is already in that aggregate; the
  interdiff is the delta beyond it (CSS, `sidebar.js` modal logic, `FormHooks`/`PreprocessHooks`).
- `sidebar-errors-comment.md` — proposed issue-queue comment (ends with the LLM disclosure line).
- `sidebar-errors-review-bundle.zip` — all of the above + source copies + guidepup, zipped.
- `guidepup/` — before/after VoiceOver harness (`sidebar-modal.voiceover.mjs`), run instructions,
  and expected before/after screen-reader behavior (`ANALYSIS.md`).
- `src/` — copies of the changed source files for direct review.
- `README.md` — this file.

## What changed
1. Error indicator on the sidebar toggle when the advanced group has child errors
   (`has-error` class, `aria-invalid`, visually-hidden "has errors").
2. Modal behavior when the sidebar overlays content (narrow viewports): background `inert` +
   `aria-hidden`, focus trapped, `role="dialog"`/`aria-modal`, `Esc` to close, focus returned
   to the toggle.
3. Removed a duplicate "Close sidebar panel" link — one toggle control opens and closes.
4. `SidebarChildErrorsTest` added.

## Verify locally
```bash
ddev exec env SIMPLETEST_BASE_URL=https://drupal-core.ddev.site \
  ./vendor/bin/phpunit -c core core/themes/default_admin/tests/src/Functional/SidebarChildErrorsTest.php
ddev exec bash ./core/scripts/dev/commit-code-check.sh
```

## Reproduce the environment
```bash
ddev exec drush site:install standard -y
ddev exec drush recipe core/recipes/replicate_core_testing
ddev drush uli
# Add an Article, set URL alias to an invalid value, save -> sidebar shows has-error.
```

## Reset before the next patch
```bash
ddev reset-site          # complete DB reset (code untouched)
ddev drush uli
```
See `testing/README.md` for the full loop and `scripts/reset-site.sh` for options.
