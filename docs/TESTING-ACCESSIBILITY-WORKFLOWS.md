# Accessibility Workflows Testing Guide

## Overview

This guide documents how to validate that Drupal remains accessible for users with disabilities. We've created:

1. **100 validated user stories** (USER-STORIES.md) covering 10 functional areas
2. **Automated Playwright tests** for Tier 1 workflows (authentication, content creation, forms)
3. **Testing protocols** for keyboard-only and screen reader users
4. **Cross-story workflow sequences** for end-to-end validation

---

## Quick Start

### Run Accessibility Workflow Tests

```bash
# Test Tier 1 workflows (registration, content creation, forms)
npm run test:accessibility-workflows

# Run tests with browser visible (headed mode)
npm run test:a11y:headed

# Debug a specific test
npm run test:a11y:debug

# Run all Playwright accessibility tests
npm run test:a11y
```

### Prerequisites

Ensure DDEV site is running:
```bash
ddev status
# Should show: web OK, db OK
```

---

## 100 Accessibility User Stories

All stories are documented in `USER-STORIES.md` and organized by:

### **TIER 1: Critical Workflows** (30 stories - mandatory)
These workflows must work for all users:

#### **Authentication (10 stories)**
- Registration form keyboard navigation
- Registration form screen reader compatibility
- Password reset flow
- Login with username/password
- Login error messages (visible + announced)
- Logout confirmation
- Two-factor authentication
- Account verification email
- Login timeout warning
- Accessibility settings access

#### **Content Creation (10 stories)**
- Create node keyboard navigation
- Form validation errors
- Rich text editor (CKEditor5) keyboard access
- Add featured image with alt text
- Schedule publication with accessible date picker
- Taxonomy term assignment
- Content preview
- Save as draft
- Publish content success
- Edit published content

#### **Forms (10 stories)**
- Contact form required fields marked
- Contact form error recovery
- Multi-step form progress indicator
- Form field instructions
- Conditional form fields (show/hide)
- Form submission time limits
- CAPTCHA accessibility
- Checkbox & radio groups with labels
- Form field focus indicators
- Form submission success

#### **Navigation (10 stories)**
- Main menu keyboard navigation
- Main menu screen reader announcements
- Breadcrumb navigation
- Skip navigation link
- Pagination controls
- Sticky navigation non-blocking
- Footer navigation
- Active page indicator
- Search and filter
- Mobile menu (hamburger)

---

### **TIER 2: Important Workflows** (30 stories)

#### **Media & Files (10 stories)**
- Image upload with alt text
- Audio file with captions
- Video with captions and transcripts
- Document download in accessible formats
- Image gallery keyboard navigation
- File list with descriptive links
- Lightbox/modal image viewer
- Multiple file attachments
- Media player keyboard controls
- File preview accessibility

#### **Taxonomy (10 stories)**
- Term browser hierarchical labels
- Term cloud keyboard access
- Faceted search filtering
- Tag input auto-complete
- Category filter multiple selections
- Term autocomplete navigation
- Taxonomy navigation current marking
- Search by tag results labeled
- Vocabulary selection
- Term suggestions auto-population

#### **Blocks & Layout (10 stories)**
- Custom blocks in accessible regions
- Block visibility toggle settings
- Hero image alt text
- Card layout responsive columns
- Sidebar layout meaningful order
- Layout grid semantic structure
- Layout mode toggle
- Floating elements dismissible
- Block spacing structural
- Parallax scroll disable option

#### **Comments (10 stories)**
- Add comment accessible form
- Comment status moderation message
- Reply to comment threaded
- Comment moderation admin
- Delete comment confirmation
- Comment notification email
- Comment count announcement
- Comment sorting options
- Comment preview & edit
- Comment author link

---

### **TIER 3: Extended Workflows** (40 stories)

#### **Views & Displays (10 stories)**
- View page table accessibility
- Exposed filters keyboard
- Empty state message
- Pager current page marking
- View style switcher
- Result count announcement
- Sortable columns
- Export options (JSON/CSV)
- View block attachment
- Facets with multiple selection

#### **System & UI (10 stories)**
- Login page color contrast
- Admin toolbar keyboard access
- Status messages announced
- Error messages linked to fields
- Breadcrumb link contrast
- Link identification (purpose clear)
- Form tab order logic
- Page loading indicator
- Dialog/modal keyboard trap + escape
- System settings accessibility

---

## Playwright Workflow Tests

All tests located in: `core/tests/playwright/accessibility-workflows.spec.js`

### Test Organization

Tests are grouped into three main workflows:

#### **Workflow 1: User Authentication** (6 tests)
```javascript
test('1.1: Registration Form - Keyboard Navigation Only')
test('1.2: Registration Form - Screen Reader Compliance')
test('1.4: Login Form - Keyboard Navigation')
test('1.5: Login Error Messages - Visible & Announced')
test('1.6: Logout - Keyboard Navigation')
```

**What it validates:**
- Users can register using keyboard-only
- Form structure announced correctly by screen readers
- All labels associated with inputs
- Required fields marked (asterisk + aria-required)
- Login errors linked to fields
- Error recovery possible

#### **Workflow 2: Content Creation & Publishing** (6 tests)
```javascript
test('2.1: Create Node - Keyboard Navigation')
test('2.2: Form Validation Errors - Identified & Correctable')
test('2.3: Rich Text Editor - Keyboard Navigation')
test('2.4: Add Featured Image - Alt Text Accessible')
test('2.6: Taxonomy Term Assignment - Keyboard Navigation')
test('2.9: Publish Content - Success Confirmation Announced')
```

**What it validates:**
- Content authors can create/edit keyboard-only
- CKEditor5 keyboard accessible
- Image uploads include alt text fields
- Taxonomy selection keyboard operable
- Success messages announced
- No mouse required

#### **Workflow 3: Form Completion & Submission** (8 tests)
```javascript
test('3.1: Contact Form - Required Fields Marked')
test('3.2: Contact Form - Error Recovery')
test('3.3: Form Fields - Focus Indicator Visible on Tab')
test('3.4: Form Field Instructions - Associated & Visible')
test('3.8: Checkbox Groups - Grouped Labels Present')
test('3.9: Form Submission - Status Message Clear')
test('3.10: Form No Time Limit - Submission Doesn\'t Timeout')
```

**What it validates:**
- All form fields keyboard operable
- Required fields clearly marked
- Error messages associated with fields
- Focus indicators visible
- Checkboxes/radio buttons properly grouped
- Status messages appear after submission
- No arbitrary time limits

#### **Additional Tests: Focus & ARIA**
```javascript
test('Focus trap test - Dialog can be escaped')
test('Live regions announce status messages')
```

**What it validates:**
- Dialogs/modals can be closed with Escape
- Live regions announce dynamic updates
- No unintended keyboard traps

---

## Running Tests Against Different Environments

### 1. Local DDEV Site (Default)
```bash
npm run test:accessibility-workflows
```

Runs against: `http://drupal-core.ddev.site` (from environment variable or default)

### 2. Custom DDEV URL
```bash
DRUPAL_TEST_BASE_URL=http://custom-drupal.ddev.site npm run test:accessibility-workflows
```

### 3. Remote Environment
```bash
DRUPAL_TEST_BASE_URL=https://staging.example.com npm run test:accessibility-workflows
```

### 4. Debug Mode
```bash
npm run test:a11y:debug
# Opens Playwright Inspector - step through tests visually
```

---

## Manual Testing Checklist

While automated tests validate basic accessibility, manual testing with real users and assistive technology is essential.

### Keyboard-Only Testing (no mouse)
- [ ] Unplug mouse or use keyboard-only mode
- [ ] Tab through all forms
- [ ] Verify tab order is logical
- [ ] Confirm Enter activates buttons
- [ ] Verify Escape closes modals/dropdowns
- [ ] Check no keyboard traps exist
- [ ] Test Shift+Tab backward navigation

### Screen Reader Testing
Test with:
- **NVDA** (free, Windows) - [download](https://www.nvaccess.org/download/)
- **JAWS** (commercial, Windows) - [demo mode](https://www.freedomscientific.com/downloads/)
- **VoiceOver** (built-in, macOS/iOS) - `Cmd+F5`

**Key checks:**
- [ ] Form labels announced with inputs
- [ ] Required fields indicated
- [ ] Error messages announced
- [ ] Success messages announced
- [ ] Page title changes on navigation
- [ ] Heading hierarchy logical
- [ ] Link text descriptive (not "click here")
- [ ] Button purpose clear
- [ ] Table headers announced
- [ ] Image alt text meaningful

### Low Vision Testing (Zoom & Contrast)
- [ ] View at 200% zoom - no horizontal scroll
- [ ] View at 400% zoom - content still readable
- [ ] Check color contrast: 4.5:1 text, 3:1 UI elements
- [ ] View with high contrast mode enabled
- [ ] Test with color blindness simulator ([Coblis](https://www.color-blindness.com/coblis-color-blindness-simulator/))
- [ ] Verify links underlined or distinct from text
- [ ] Check focus indicators visible

### Motor Disability Testing
- [ ] All form fields keyboard accessible
- [ ] Touch targets at least 44×44 pixels (mobile)
- [ ] No click-and-drag required
- [ ] Hover not required for functionality
- [ ] Double-click not required
- [ ] Pointer alternatives available
- [ ] Slow keyboard input doesn't trigger timeout

### Cognitive Testing
- [ ] Page title describes content
- [ ] Headings organized hierarchically
- [ ] Instructions are simple and clear
- [ ] Error messages are specific
- [ ] Undo possible for critical actions
- [ ] Links consistent across site
- [ ] Abbreviations defined on first use
- [ ] No flashing/blinking content (>3x/second)

---

## Integration with CI/CD

### GitHub Actions Example
```yaml
name: Accessibility Tests
on: [push, pull_request]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run test:accessibility-workflows
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Test Results & Reports

### HTML Report
```bash
npm run test:a11y
# Report generated in: playwright-report/index.html
npx playwright show-report
```

### JSON Results
```bash
npm run test:a11y -- --reporter=json > results.json
```

### JUnit XML (for CI integration)
```bash
npm run test:a11y -- --reporter=junit --output-file=test-results.xml
```

---

## Extending Tests

### Adding New Workflow Test
1. Open `core/tests/playwright/accessibility-workflows.spec.js`
2. Add new `test()` block within appropriate `test.describe()` group
3. Include:
   - Descriptive test name
   - Navigation to relevant page
   - Wait for key elements
   - Verify accessibility aspects
   - Check focus, labels, ARIA attributes

### Example Template
```javascript
test('X.X: Feature Name - Accessibility Aspect', async ({ page }) => {
  // 1. Navigate
  await page.goto(`${BASE_URL}/path`);
  await page.waitForSelector('form');
  
  // 2. Interact
  await page.keyboard.press('Tab');
  
  // 3. Verify keyboard operable
  const focusedElement = await page.evaluate(() => document.activeElement.name);
  expect(focusedElement).toBe('expectedFieldName');
  
  // 4. Verify ARIA
  const ariaLabel = await page.getAttribute('aria-label');
  expect(ariaLabel).toBeTruthy();
});
```

---

## Troubleshooting

### Test Fails: "Page not found"
```bash
# Verify DDEV is running
ddev status
ddev start
```

### Test Fails: "Element not found"
- Element selector may have changed
- Use `--debug` mode to inspect page
- Check if element requires login/specific permissions

### Test Fails: "Form not submitting"
- Validation may be preventing submission
- Add more specific form data
- Check JavaScript console for errors

### Timeout Issues
```bash
# Increase timeout for slow environments
npm run test:a11y -- --timeout=30000
```

---

## Resources

- **WCAG 2.2 Standard:** https://www.w3.org/WAI/WCAG22/quickref/
- **ARIA Authoring Practices:** https://www.w3.org/WAI/ARIA/apg/
- **axe DevTools:** https://www.deque.com/axe/devtools/
- **WebAIM:** https://webaim.org/
- **Drupal Accessibility:** https://www.drupal.org/docs/accessibility

---

## Support & Feedback

For issues with these tests or accessibility improvements:
1. Check USER-STORIES.md for story details
2. Review test code in accessibility-workflows.spec.js
3. Run `npm run test:a11y:debug` to inspect failing test
4. Report issues to project maintainers

