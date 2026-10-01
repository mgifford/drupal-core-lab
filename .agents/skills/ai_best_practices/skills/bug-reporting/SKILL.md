---
title: "Bug Reporting - Stable Accessibility Issue Tracking"
description: "File accessibility bugs using stable instance_id and pattern_id per mgifford/ACCESSIBILITY.md schema. Ensures reproducible, traceable issue reports with WCAG mapping and multiple screen/theme variants."
author: "Mike Gifford"
version: "1.0.0"
parent: "ai_best_practices"
keywords:
  - bug reporting
  - issue filing
  - accessibility bugs
  - instance_id
  - pattern_id
  - WCAG
  - issue templates
  - drupal.org
triggers:
  - "bug report"
  - "accessibility bug"
  - "file issue"
  - "issue template"
  - "instance ID"
  - "pattern ID"
enforce: "soft"
---

# Bug Reporting - Stable Accessibility Issue Tracking

## Overview

Framework for filing accessibility bugs using stable identification (instance_id, pattern_id) and comprehensive WCAG mapping. Follows [mgifford/ACCESSIBILITY.md](https://github.com/mgifford/ACCESSIBILITY.md) bug-reporting schema to ensure reproducibility and trackability.

**Schema Location:** [mgifford/ACCESSIBILITY.md - Bug Reporting](https://github.com/mgifford/ACCESSIBILITY.md)  
**Reference:** [drupal.org/project/ai_best_practices/issues/3581685](https://www.drupal.org/project/ai_best_practices/issues/3581685)

---

## Bug Report Structure

### Required Fields

Every bug report **must** include:

1. **Violation ID**
   - instance_id (single occurrence)
   - pattern_id (recurring pattern)

2. **Location**
   - URL
   - XPath (simplified + full)
   - HTML snippet

3. **Standards**
   - WCAG Success Criterion (e.g., 4.1.2)
   - ACT rule ID (e.g., button-name)

4. **Severity**
   - critical / high / medium / low

5. **Frequency**
   - single_page / pattern / systematic

6. **Context**
   - screen_type: mobile/desktop/both
   - color_mode: light/dark/both
   - theme: Olivero/Claro/default_admin

7. **Steps to Reproduce**

### Optional Fields

- Labels: `a11y`, `WCAG 2.2 AA`, `keyboard`, etc.
- Assignee (if accessible)
- Priority (if prioritization system exists)

---

## Instance ID vs. Pattern ID

### Instance ID
Unique identifier for a **single violation on a single page**.

**Formula:**
```
instance_id = SHA-256(page_url + selector + rule_id + screen_type)
```

**Examples:**
```
instance_id: a1b2c3d4e5f6g7h8... (login button on /user/login, desktop)
instance_id: x9y8z7w6v5u4t3s2... (login button on /user/login, mobile)
instance_id: m1n2o3p4q5r6s7t8... (login button on /contact, desktop)
```

**Use When:**
- Bug affects one specific element on one page
- You want to track whether THIS violation was fixed
- Reporting: "The send button on /contact has no accessible name"

### Pattern ID
Unique identifier for a **recurring violation pattern** across pages/screens.

**Formula:**
```
pattern_id = SHA-256(selector + rule_id + screen_type)
```

**Examples:**
```
pattern_id: abc123def456xyz789... (all .send-button instances missing name)
pattern_id: uvw012rst345pqr678... (all button.submit instances missing name)
```

**Use When:**
- Bug affects multiple pages with the same selector
- You want to track the CSS pattern, not individual pages
- Reporting: "All .send-button elements are missing accessible names"
- Higher-level: "This selector pattern needs fixing once to fix everywhere"

---

## Issue Template

### Title
```
[WCAG X.X.X] {Component} {Missing Feature}
```

**Examples:**
```
[WCAG 4.1.2] Submit buttons missing accessible names
[WCAG 2.4.3] Form focus indicators not visible
[WCAG 3.3.1] Error messages not linked to fields
```

### Body

```markdown
## Accessibility Violation

### Violation ID
- **instance_id:** {SHA-256}
- **pattern_id:** {SHA-256}
- **Frequency:** [single_page / pattern / systematic]

### Location
- **URL:** {url}
- **Selector:** {CSS selector}
- **XPath (Simplified):** {simplified}
- **XPath (Full):** {full}

### Context
- **Screen Type:** [desktop / mobile / both]
- **Color Mode:** [light / dark / both]
- **Theme:** [Olivero / Claro / default_admin]
- **Drupal Version:** 12.0-dev

### Standards
- **WCAG Criterion:** {X.X.X}
- **Success Criterion Name:** {name}
- **ACT Rule:** {rule_id}
- **Severity:** [critical / high / medium / low]

### HTML Snippet
{code block with current HTML}

### Issue Description
{Clear description of the problem from user perspective}

### Expected Behavior
{What should happen instead}

### Steps to Reproduce
1. Go to {url}
2. {Action}
3. {Observation}

### Impact
{Who is affected, why it matters}

### User Story Reference
- Story ID: {e.g., 3.9}
- Title: {e.g., Form Field Focus - Focus Indicator Visible}

### Screens/Variants
- [ ] Desktop (1280×1024)
- [ ] Tablet (768×1024)
- [ ] Mobile (375×812)
- [ ] Light mode
- [ ] Dark mode
- [ ] Olivero theme
- [ ] Claro theme
- [ ] default_admin theme

### Related Issues
{Link to related/similar issues if applicable}

### Files to Change
{Estimated components affected}
```

---

## Real-World Examples

### Example 1: Single-Page Instance

**Title:** `[WCAG 4.1.2] Login page submit button missing accessible name`

**Body:**
```markdown
## Accessibility Violation

### Violation ID
- **instance_id:** abc123def456xyz789.../user/login.submit
- **pattern_id:** xyz789abc123def456.../all.submit
- **Frequency:** pattern

### Location
- **URL:** http://drupal-core.ddev.site/user/login
- **Selector:** button.submit
- **XPath (Simplified):** //button[@class="submit"]
- **XPath (Full):** /html/body/main/form/fieldset/button[@type="submit" and @class="submit"]

### Context
- **Screen Type:** desktop
- **Color Mode:** light
- **Theme:** Olivero
- **Drupal Version:** 12.0-dev

### Standards
- **WCAG Criterion:** 4.1.2
- **Success Criterion Name:** Name, Role, Value
- **ACT Rule:** button-name
- **Severity:** critical

### HTML Snippet
```html
<button type="submit" class="submit">→</button>
```

### Issue Description
The submit button uses only an arrow character (→) as visible text. Screen readers cannot determine the button's purpose.

### Expected Behavior
```html
<button type="submit" class="submit" aria-label="Log in">→</button>
```

### Steps to Reproduce
1. Go to http://drupal-core.ddev.site/user/login
2. Open a screen reader (NVDA, JAWS, VoiceOver)
3. Tab to the submit button
4. Observe: Screen reader announces "Button" (no name)
5. Expected: Should announce "Log in button"

### Impact
- Users relying on screen readers cannot identify the login button's purpose
- Cannot use keyboard-only navigation effectively
- Blocks access to the entire site for blind/low-vision users

### User Story Reference
- Story ID: 1.5
- Title: Login Error Messages - Visible & Announced

### Screens/Variants
- [x] Desktop (1280×1024) — Bug confirmed
- [x] Mobile (375×812) — Bug confirmed
- [ ] Tablet (768×1024) — Not tested
- [x] Light mode — Bug confirmed
- [ ] Dark mode — Not tested
- [x] Olivero theme — Bug confirmed
- [ ] Claro theme — Not tested

### Related Issues
- None

### Files to Change
- core/themes/olivero/templates/form-element.html.twig (likely)
- core/themes/olivero/css/components/submit-button.css
```

---

### Example 2: Pattern Across Pages

**Title:** `[WCAG 2.4.3] All buttons missing visible focus indicators`

**Body:**
```markdown
## Accessibility Violation

### Violation ID
- **instance_id:** {multiple instances}
- **pattern_id:** button.focus-outline/focus-visible
- **Frequency:** systematic

### Location
- **Selector:** button, [role="button"]
- **XPath (Simplified):** //button | //*[@role="button"]

### Context
- **Screen Type:** both
- **Color Mode:** light
- **Theme:** Olivero
- **Drupal Version:** 12.0-dev

### Standards
- **WCAG Criterion:** 2.4.3
- **Success Criterion Name:** Focus Visible
- **ACT Rule:** focus-visible
- **Severity:** high

### HTML Snippet
```css
button:focus {
  /* No outline defined */
}

button {
  outline: none;  /* Removes default focus indicator! */
}
```

### Issue Description
CSS resets remove all focus indicators from buttons. Keyboard-only users cannot see which element has focus.

### Expected Behavior
```css
button:focus {
  outline: 2px solid #4A90E2;
  outline-offset: 2px;
}
```

### Steps to Reproduce
1. Go to any Drupal page
2. Press Tab to navigate through buttons
3. Observe: No visible focus indicator
4. Expected: Clear outline/highlight on focused button

### Impact
- Keyboard-only users cannot navigate the site
- Users without mouse cannot tell which button is active
- Violates fundamental web accessibility principle

### User Story Reference
- Story ID: 3.9
- Title: Form Field Focus - Focus Indicator Visible

### Screens/Variants
- [x] Desktop (1280×1024) — Bug confirmed
- [x] Mobile (375×812) — Bug confirmed
- [x] Light mode — Bug confirmed
- [x] Dark mode — Bug confirmed
- [x] Olivero theme — Bug confirmed
- [x] Claro theme — Bug confirmed

### Related Issues
- #3087389 (Focus management in modals)
- #3046089 (Color contrast for focus indicators)

### Files to Change
- core/themes/olivero/css/base/elements.css
- core/themes/claro/css/base/elements.css
- core/themes/default_admin/css/elements.css
```

---

## Filing on drupal.org

### 1. Create New Issue
Go to [drupal.org/project/drupal/issues](https://www.drupal.org/project/drupal/issues)

Click "Create issue"

### 2. Fill Form
- **Title:** Use template above
- **Category:** Accessibility (if available)
- **Version:** 12.0-dev (or applicable version)
- **Assigned:** Leave unassigned (or assign to maintainer)
- **Description:** Use markdown template above

### 3. Add Labels
```
accessibility
wcag-22-aa
keyboard
form
(add others as relevant)
```

### 4. Link to User Story
In description, reference:
```markdown
[User Story 3.9: Form Field Focus - Focus Indicator Visible](../USER-STORIES.md#39-form-field-focus--focus-indicator-visible)
```

### 5. Submit & Follow Up
- Monitor for responses
- Provide additional test results if requested
- Link to related patches/PRs

---

## Automated Issue Filing (Planned)

When all test scripts complete, create automation to:

1. Parse patch evaluation reports
2. Extract new violations (violations_added)
3. Generate issue title + body from violation data
4. Create drupal.org issue via API (if available)
5. Add instance_id/pattern_id + WCAG mapping
6. Link to user story + patch

**Script Location (planned):** `core/tests/playwright/scripts/file-accessibility-issues.js`

---

## Checking for Existing Issues

Before filing, search for:

1. **Exact XPath** — Other reports of same element
2. **Pattern ID** — Other reports of same selector pattern
3. **Rule ID** — Other reports of same WCAG rule violation
4. **WCAG criterion** — Similar violations

**Search Template on drupal.org:**
```
title:"[WCAG 4.1.2]" OR title:button-name
```

---

## Issue Lifecycle

### Filing → Assignment
1. ✅ Issue filed with complete data
2. ⏳ Maintainer reviews (1–3 days)
3. ⏳ Prioritized & assigned (if accepted)

### Prioritization
- **Critical:** Blocks core workflows
- **High:** Major accessibility barrier
- **Medium:** Important but partial barrier
- **Low:** Minor issue or documentation

### Fix & Verification
1. ⏳ Developer works on fix
2. ✅ PR submitted with fix
3. 🧪 Test (verify instance_id violation resolved)
4. ✅ PR merged
5. ✅ Close issue

### Re-Testing
- Re-run evaluation script on fixed code
- Verify violation not present in patched scan
- Confirm pattern_id violations reduced

---

## References

- **Schema:** [mgifford/ACCESSIBILITY.md - Bug Reporting](https://github.com/mgifford/ACCESSIBILITY.md)
- **WCAG 2.2 AA:** https://www.w3.org/WAI/WCAG22/quickref/
- **ACT Rules:** https://act-rules.github.io/
- **drupal.org Issues:** https://www.drupal.org/project/drupal/issues
- **User Stories:** [USER-STORIES.md](../../../../../../USER-STORIES.md)

---

## Status

✅ **Complete:**
- Issue template defined
- Instance ID / pattern ID schema implemented
- WCAG mapping structure established
- Examples documented (single-page + pattern)

⏳ **Planned:**
- file-accessibility-issues.js automation
- drupal.org API integration
- Issue linking (related patches, user stories)

❌ **Not Started:**
- Automated drupal.org issue filing
- Regression trend tracking (issues over time)
