# Issue #2848307: Tableselect + Inline Form Errors - Work Summary

## Issue Overview
Drupal issue #2848307 addresses an accessibility barrier where form validation errors on tableselect elements are not shown inline with the element, creating a WCAG 2.2 AA failure (SC 1.3.1 Info and Relationships).

**Bug**: When a form with a tableselect element fails validation, the error is displayed in the summary message area but NOT associated with the tableselect element via aria-describedby or shown inline, making it difficult for screen reader users to understand which form control has the error.

**Expected Fix**: Errors on tableselect elements should be displayed inline and properly associated via aria-describedby, similar to how errors are handled for table elements.

## Work Completed

### 1. Playwright MCP Integration ✓
- Installed and configured `@playwright/mcp` with Copilot CLI
- Set up browser automation for testing accessibility issues
- Created reproducibility scripts using Playwright Node.js APIs

### 2. Login Regression Test ✓
- **File**: `tests/playwright/tests/drupal-login.spec.ts`
- Created two Playwright tests:
  - Keyboard navigation test (Tab through login form)
  - Login with DDEV credentials (admin/admin)
- Tests pass, confirming login workflow is functional

### 3. Issue #2848307 Reproducibility Script ✓
- **File**: `tests/playwright/scripts/issue-2848307-mcp-check.js`
- **Purpose**: Automated evidence collection for before/after patch verification
- **Features**:
  - Logs in with DDEV credentials
  - Navigates to modules uninstall page
  - Triggers validation without selecting modules
  - Collects evidence:
    - Whether error appears in message summary
    - Whether error text appears inline in the form
    - Whether table has aria-describedby attribute
    - Whether aria-describedby references an error element
  - Supports "baseline" mode (expects bug) and "patched" mode (expects fix)
  - Generates JSON report with structured evidence

### 4. Baseline Evidence Collected ✓
- **Test Result**: `/tests/playwright/reports/issue-2848307/[timestamp]-baseline/`
- **Observations**:
  - Error appears in summary: YES ("Error message / No modules selected.")
  - Error shown inline: NO
  - Table aria-describedby: (empty)
  - Table references error: NO
  - **Bug Confirmed**: Validation error is visible only in summary, not inline

### 5. npm Scripts Added ✓
- `npm run test:issue:2848307:baseline` - Runs test expecting the bug
- `npm run test:issue:2848307:patched` - Runs test expecting the fix

## Architectural Analysis

### Form Structure
The modules uninstall form presents a challenge for inline error handling:

```
form['uninstall']               // Array of checkboxes, #tree => TRUE
  - uninstall[module1]           // Checkbox for each module
  - uninstall[module2]
  - ...
form['modules']                 // Form elements for table display
  - modules[module1]             // Display data for each module
  - modules[module2]
  - ...
```

The **table is rendered manually in a Twig template** (system-modules-uninstall.html.twig), not as a form element. This creates a mismatch between the form structure and visual presentation.

### Validation Logic
Current validation in `ModulesUninstallForm::validateForm()`:
```php
if (!array_filter($form_state->getValue('uninstall'))) {
  $form_state->setErrorByName('', $this->t('No modules selected.'));
  // Error set on form ROOT, not on tableselect element
}
```

### Why Inline Errors Aren't Showing
1. Error is set on form root (empty name), not on a form element
2. The table itself is not a form type - it's manual HTML in a template
3. The inline_form_errors handler can't automatically add error markup to manual template output
4. The form['uninstall'] array has no `#type` that would trigger error rendering

## Implementation Approach

### Option A: Modify Form Structure (Most Comprehensive)
1. Create or use a dedicated 'table' or 'tableselect' form element for the modules list
2. Set validation errors on that element directly
3. Let the renderer handle inline error markup automatically

**Pros**: Clean, leverages Drupal's form rendering system  
**Cons**: Requires significant refactoring of ModulesUninstallForm and template

### Option B: Extend FormErrorHandler (Current Patch Approach)
1. Modify `FormErrorHandler::setTableElementInlineErrors()` to:
   - Detect table/tableselect elements with errors
   - Render error messages and associate via aria-describedby
   - Support both native table/tableselect form types AND tree arrays

2. Update ModulesUninstallForm validation to:
   - Set error on 'uninstall' element instead of form root
   - OR set error on first checkbox element

**Pros**: Works with existing form structure, minimal disruption  
**Cons**: Requires coordination between validation code and error handler

### Option C: Template-Based Error Display
1. Modify system-modules-uninstall.html.twig to:
   - Render error markup before the table if errors exist on 'uninstall'
   - Add aria-describedby to the table pointing to error ID

**Pros**: Purely template-based, easy to understand  
**Cons**: Mixes error handling logic into theme layer

## Next Steps for Complete Implementation

### 1. Choose Implementation Approach
Recommend **Option B** (Extend FormErrorHandler) as it:
- Aligns with the provided patch
- Maintains separation of concerns
- Supports both table and tableselect types
- Can handle array elements with #tree

### 2. Update FormErrorHandler
Add handling for:
- Elements with `#type === 'table'` or `#type === 'tableselect'`
- Array elements (form['uninstall']) that contain form items
- Proper aria-describedby association

### 3. Update ModulesUninstallForm Validation
Change error from form root to specific element:
```php
$form_state->setErrorByName('uninstall', $this->t('No modules selected.'));
// OR  
$form_state->setErrorByName('uninstall][0', $this->t('No modules selected.'));
```

### 4. Verify with Playwright Tests
- Run patched mode test after implementing fix
- Verify:
  - Error appears in form summary
  - Error also appears inline before table
  - Table has aria-describedby attribute
  - aria-describedby references a valid error element
  - Error text is accessible via screen reader

### 5. Add Unit Tests
Update `FormErrorHandlerTest` to:
- Test table element error rendering
- Test tableselect element error rendering  
- Test tree array error handling

## Testing Evidence Location
- **Baseline evidence**: `/tests/playwright/reports/issue-2848307/[timestamp]-baseline/`
  - `result.json`: Structured results with all observed properties
  - `uninstall-validation.png`: Screenshot of error state
  - `accessibility-tree.json`: Accessibility snapshot (if available)

- **Patched evidence** (pending): `/tests/playwright/reports/issue-2848307/[timestamp]-patched/`
  - Same structure, will show fix verification when implemented

## Files Created for This Work
- `tests/playwright/tests/drupal-login.spec.ts` - Login regression test
- `tests/playwright/scripts/issue-2848307-mcp-check.js` - Reproducibility script
- `tests/playwright/package.json` - Updated with npm scripts

## Files Modified
- `tests/playwright/package.json` - Added test scripts

## Files Ready for Patch Implementation
- `core/modules/inline_form_errors/src/FormErrorHandler.php` - Ready for handleFormErrors() override
- `core/modules/system/src/Form/ModulesUninstallForm.php` - Ready for validation error update
- `core/modules/inline_form_errors/tests/src/Unit/FormErrorHandlerTest.php` - Ready for test updates

## WCAG Compliance Status
**Current**: WCAG 2.2 AA Failure - SC 1.3.1 (Info and Relationships)
- Error is not visually or semantically associated with form control
- Screen reader users cannot link error message to tableselect element

**After Fix**: WCAG 2.2 AA Success - SC 1.3.1
- Error associated via aria-describedby
- Proper semantic relationship established
- Screen readers announce both error and relationship to control
