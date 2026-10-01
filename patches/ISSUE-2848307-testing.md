# Testing notes — Issue #2848307: inline form errors for `tableselect`

- **Issue:** https://www.drupal.org/project/drupal/issues/2848307
- **Merge request:** https://git.drupalcode.org/project/drupal/-/merge_requests/16355
- **Module:** `inline_form_errors` (core)
- **Status:** Submitted via MR !16355 with a green Unit test.

## What the fix does

`inline_form_errors` shows a field's error message next to the field and links
to it from the top-of-page summary. It already handled the `table` form
element, but skipped `tableselect` (the common table form element used on the
module uninstall form and many admin lists). When a `tableselect` had an error,
the message appeared only in the top summary and the table was never associated
with it via `aria-describedby`.

The fix extends `FormErrorHandler::setTableElementInlineErrors()` in
`core/modules/inline_form_errors/src/FormErrorHandler.php` to also match
`tableselect`, so the inline error markup and `aria-describedby` wiring apply
unchanged.

## Demo module (`inline_errors_demo`)

A small demo module was used to confirm the behaviour end-to-end on the
`drupal-drupal` ddev site (issue fork, branch `2848307-inline-errors-not`).

- Route: `/demo/tableselect`
- Form: a `tableselect` with a required "choose at least one item" validation.
- Module path (issue fork): `modules/inline_errors_demo/`
  - `src/Form/DemoTableSelectForm.php`
  - `tests/src/Functional/DemoTableSelectFormTest.php` (submits the form empty
    and dumps the rendered page HTML)

To run the demo:

```bash
# From the issue fork
ddev exec vendor/bin/phpunit -c core \
  modules/inline_errors_demo/tests/src/Functional/DemoTableSelectFormTest.php
```

The Functional test asserts the inline error message is rendered next to the
table and that the table carries `aria-describedby="edit-choice--error"`.

## Before / after HTML (captured end-to-end)

Submitted the demo form with no row selected, triggering the `tableselect`
validation error.

### Before (without the fix)

The table has no `aria-describedby` and no inline error message adjacent to it.
The error is only in the top-of-page summary.

```html
<table data-drupal-selector="edit-choice" id="edit-choice" class="responsive-enabled" data-striping="1">
```

### After (with the fix)

An inline error message is rendered above the table, and the table is
associated with it via `aria-describedby`.

```html
<div id="edit-choice--error" class="form-item--error-message form-item__error-message">Select at least one item.</div>
<table data-drupal-selector="edit-choice" aria-describedby="edit-choice--error" id="edit-choice" class="responsive-enabled" data-striping="1">
```

## Accessibility verification

- The error text is announced in the top summary (unchanged behaviour).
- The field now also gets an inline, visible error message next to the table.
- `aria-describedby="edit-choice--error"` links the table to that message, so
  screen reader and keyboard users get the same association other elements get.
- Focus and keyboard operation are unchanged.

## Regression test

`core/modules/inline_form_errors/tests/src/Unit/FormErrorHandlerTest.php`
(`testTableElementErrorsInline`) asserts that a `tableselect` (and `table`)
error is rendered inline in `#prefix` and associated via
`aria-describedby` (`edit-<id>--error`). It fails when `tableselect` is
excluded, confirming the guard.

Run it with:

```bash
vendor/bin/phpunit -c core \
  core/modules/inline_form_errors/tests/src/Unit/FormErrorHandlerTest.php
```

Result: `OK (3 tests, 49 assertions)`.

Generated with the help of an LLM.
