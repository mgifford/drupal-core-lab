# Comparison: My Patch vs MR !15692

## Summary

| Aspect | My Patch | MR !15692 |
|--------|----------|-----------|
| Module boundary | Preserved | Broken |
| Core FormErrorHandler | No renderer dependency | Adds renderer dependency |
| ARIA attributes | Set in inline_form_errors module | Set in core FormErrorHandler |
| Error display | Unchanged in core | Modified in core |
| Template placement | Unchanged | Moved error containers |

## Key Differences

### 1. Module Boundary

**My Patch:**
- ARIA attributes set only when Inline Form Errors is enabled
- Core FormErrorHandler unchanged (no new dependencies)
- Module boundary preserved

**MR !15692:**
- ARIA attributes set in core `FormErrorHandler::setElementErrorsFromFormState()`
- This runs even when Inline Form Errors is disabled
- Breaks the module boundary requirement

### 2. Core FormErrorHandler Changes

**My Patch:**
```php
// Only adds static helper method
public static function getErrorId(array $element): string {
  if (!empty($element['#error_id'])) {
    return $element['#error_id'];
  }
  if (!empty($element['#id'])) {
    return $element['#id'] . '--error-message';
  }
  return 'form-error-' . substr(md5(serialize($element['#array_parents'] ?? [])), 0, 12);
}
```

**MR !15692:**
```php
// Adds renderer dependency (violates requirement)
protected $renderer;
public function __construct(RendererInterface $renderer) {
  $this->renderer = $renderer;
}

// Adds ARIA attributes in core (breaks module boundary)
if (($elements['#errors']) !== NULL) {
  $error_id = $elements['#error_id'] ?? ($elements['#id'] . '--error-message');
  $elements['#attributes']['aria-errormessage'] = $error_id;
  $elements['#attributes']['aria-invalid'] = TRUE;
  $existing = $elements['#attributes']['aria-describedby'] ?? '';
  if (!str_contains($existing, $error_id)) {
    $elements['#attributes']['aria-describedby'] = trim($existing . ' ' . $error_id);
  }
}
```

### 3. Error Display

**My Patch:**
- Core `displayErrorMessages()` unchanged
- Inline Form Errors module handles error display

**MR !15692:**
- Core `displayErrorMessages()` modified to render errors with IDs
- Adds renderer dependency to core FormErrorHandler
- Changes default behaviour for all forms

### 4. Template Changes

**My Patch:**
- Added `id` attribute to error containers
- Preserved existing template structure

**MR !15692:**
- Added `id` attribute to error containers
- Moved error containers in details.html.twig and fieldset.html.twig
- Changed error placement order

### 5. Error ID Resolution

**My Patch:**
- Shared `FormErrorHandler::getErrorId()` static method
- Consistent ID resolution across core and module

**MR !15692:**
- Inline ID construction in multiple places
- No shared helper method

## Requirements Compliance

| Requirement | My Patch | MR !15692 |
|-------------|----------|-----------|
| Preserve Inline Form Errors boundary | ✓ | ✗ |
| Create valid programmatic associations | ✓ | ✓ |
| Use consistent error-ID resolution | ✓ | ✗ |
| Handle composite elements correctly | ✓ | Partial |
| Respect error suppression | ✓ | ✓ |
| Minimize API disruption | ✓ | ✗ |

## Test Coverage

**My Patch:**
- 6 new unit tests for ARIA attributes
- Functional test infrastructure

**MR !15692:**
- Modified existing tests
- Added kernel tests

## Recommendation

My patch is preferred because:
1. Preserves the Inline Form Errors module boundary
2. Doesn't add renderer dependency to core FormErrorHandler
3. Uses shared error ID resolution helper
4. Minimizes API and theme disruption
5. Meets all stated requirements

The MR !15692 violates the requirement to preserve the module boundary by setting ARIA attributes in core, which would make inline error rendering standard behaviour even when Inline Form Errors is disabled.

---

Generated with the help of an LLM.
