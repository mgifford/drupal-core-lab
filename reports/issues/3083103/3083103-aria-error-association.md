# Issue #3083103: Programmatically associate error messages with inputs

## Summary

This patch programmatically associates error messages with form controls using ARIA attributes, improving accessibility for screen reader users.

## Problem

When form validation fails, error messages are displayed but not programmatically associated with their corresponding form controls. Screen reader users cannot easily identify which field has an error.

## Solution

1. **Shared Error ID Resolution**: Added `FormErrorHandler::getErrorId()` static method for consistent error ID resolution across core and inline_form_errors module.

2. **ARIA Attributes**: Set `aria-invalid`, `aria-errormessage`, and `aria-describedby` on form elements with errors.

3. **Error Container IDs**: Error message `<div>` elements now have unique `id` attributes.

4. **Description Preservation**: Error IDs are prepended to `aria-describedby`, preserving existing description IDs.

## Changes

### Core Changes

| File | Change |
|------|--------|
| `core/lib/Drupal/Core/Form/FormErrorHandler.php` | Added `getErrorId()` static method |
| `core/lib/Drupal/Core/Form/FormPreprocess.php` | Added `$error_id` variable to templates |
| `core/modules/system/templates/form-element.html.twig` | Added `id` attribute to error container |
| `core/modules/system/templates/fieldset.html.twig` | Added `id` attribute to error container |
| `core/modules/system/templates/details.html.twig` | Added `id` attribute to error container |

### Inline Form Errors Module Changes

| File | Change |
|------|--------|
| `core/modules/inline_form_errors/src/FormErrorHandler.php` | Added ARIA attribute handling |
| `core/modules/inline_form_errors/src/Hook/InlineFormErrorsThemeHooks.php` | Added error ID to templates |

### Test Changes

| File | Change |
|------|--------|
| `core/modules/inline_form_errors/tests/src/Unit/FormErrorHandlerTest.php` | Added 6 new test methods |

## Behaviour

### Inline Form Errors Enabled

```html
<input
  aria-invalid="true"
  aria-errormessage="edit-name--error-message"
  aria-describedby="edit-name--error-message edit-name--description">

<div id="edit-name--error-message" class="form-item--error-message">
  Name field is required.
</div>
```

### Inline Form Errors Disabled

- Error messages appear in page-level messenger
- No inline error containers rendered
- No ARIA attributes set on form controls

## Properties

### `#error_id` (optional)

Override the default error ID for an element:

```php
$form['name'] = [
  '#type' => 'textfield',
  '#title' => $this->t('Name'),
  '#error_id' => 'custom-error-id',
];
```

### `#error_no_message`

Suppress error-related attributes:

```php
$form['name'] = [
  '#type' => 'textfield',
  '#title' => $this->t('Name'),
  '#error_no_message' => TRUE,
];
```

## Testing

### Unit Tests

```bash
./vendor/bin/phpunit -c core core/modules/inline_form_errors/tests/src/Unit/FormErrorHandlerTest.php
```

### Static Checks

```bash
./vendor/bin/phpcs --standard=Drupal,DrupalPractice core/lib/Drupal/Core/Form/FormErrorHandler.php
./vendor/bin/phpstan analyse core/lib/Drupal/Core/Form/FormErrorHandler.php --level 5
```

## Change Record

Required: New template variable `$error_id` in form-element, fieldset, and details templates.

## Generated

Generated with the help of an LLM.
