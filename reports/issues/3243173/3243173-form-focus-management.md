# Issue #3243173: Form Focus Management for Server-Side Validation Errors

## Problem

After server-side validation fails, focus doesn't move to the first invalid field. This violates WCAG 3.3.1 (Error Identification) and makes forms difficult to use for keyboard and screen reader users.

## Related Issues

- **#1797438**: HTML5 validation is preventing form submit and not fully accessible (landed)
- **#3083103**: Programmatically associate error messages with inputs
- **#3088245**: Convey form error messages to assistive technologies

## Solution

### Non-AJAX Forms (Full Page Reload)

Added `Drupal.behaviors.formErrorFocus` in `core/misc/form.js`:
- Finds the first `.form-item--error-message` on page load
- Scrolls the error message into view
- Focuses the associated input field

Added `Drupal.behaviors.formErrorAnnouncement` in `core/misc/form.js`:
- Adds `role="alert"` to the first error message
- Ensures screen readers announce the error

### AJAX Forms

Modified `core/lib/Drupal/Core/Form/FormAjaxResponseBuilder.php`:
- Checks for validation errors after form re-rendering
- Adds `FocusFirstCommand` targeting the first element with errors
- Uses existing `focusFirst` AJAX command handler in `ajax.js`

## Test Coverage

### Test Module

Created `sites/custom/modules/form_error_focus_test/`:
- `NonAjaxValidationForm.php`: Form with server-side validation
- `AjaxValidationForm.php`: AJAX form with server-side validation

### Functional JavaScript Tests

Created `core/modules/system/tests/src/FunctionalJavascript/Form/FormErrorFocusTest.php`:

| Test | Scenario | Assertion |
|------|----------|-----------|
| `testNonAjaxFocusOnValidation` | Submit form with empty required field | Focus moves to first invalid field AND error has role="alert" |
| `testAjaxFocusOnValidation` | Submit AJAX form with invalid phone | Focus moves to first invalid field |
| `testMultipleErrorsFocusFirst` | Submit form with invalid phone | Focus goes to phone field (the error) |
| `testNoFocusChangeOnSuccess` | Submit valid form | No error messages exist |

## Accessibility

This patch addresses:
- **WCAG 3.3.1 (Error Identification)**: Focus moves to the first invalid field
- **WCAG 4.1.3 (Status Messages)**: Error messages are announced to screen readers via `role="alert"`

## Files Modified

| File | Change |
|------|--------|
| `core/misc/form.js` | Added `formErrorFocus` and `formErrorAnnouncement` behaviors |
| `core/lib/Drupal/Core/Form/FormAjaxResponseBuilder.php` | Added `FocusFirstCommand` for AJAX forms |

## Files Created

| File | Purpose |
|------|---------|
| `sites/custom/modules/form_error_focus_test/` | Test module with forms |
| `core/modules/system/tests/src/FunctionalJavascript/Form/FormErrorFocusTest.php` | Functional JavaScript tests |
| `3243173-form-focus-management.md` | This documentation |

## Manual Testing

1. Enable the test module: `drush en form_error_focus_test`
2. Visit `/form-error-focus-test/non-ajax`
3. Submit the form with empty required fields
4. Verify focus moves to the first invalid field
5. Visit `/form-error-focus-test/ajax`
6. Submit the AJAX form with invalid phone format
7. Verify focus moves to the first invalid field

## Next Steps

- Create GitLab merge request
- Address review feedback
- Update change record
