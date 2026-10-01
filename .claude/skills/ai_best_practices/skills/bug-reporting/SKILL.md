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

- Issue tags: `Accessibility`, `wcagXXX` (see "Filing on drupal.org" below)
- Assignee (if accessible)
- Priority (if prioritization system exists)

---

## Instance ID vs. Pattern ID

### Instance ID
Unique identifier for a **single violation on a single page**.

**Formula** (as implemented in `analyze-patterns.js`):
```
instance_id = "INS-" + first 8 hex chars (uppercase) of
  SHA-256(generalized_page_path + "|" + normalized_selector + "|" + rule_id + "|" + screen_type)
```

Page paths are generalized before hashing (`/node/123` → `/node/[nid]`) and
selectors are normalized (cardinality indexes, UUIDs, and hashes collapsed),
so IDs stay stable across content changes and re-scans.

**Examples:**
```
instance_id: INS-A1B2C3D4 (login button on /user/login, desktop)
instance_id: INS-9F8E7D6C (login button on /user/login, mobile)
instance_id: INS-5B4A3C2D (login button on /contact, desktop)
```

**Use When:**
- Bug affects one specific element on one page
- You want to track whether THIS violation was fixed
- Reporting: "The send button on /contact has no accessible name"

### Pattern ID
Unique identifier for a **recurring violation pattern** across pages/screens.

**Formula** (as implemented in `analyze-patterns.js`):
```
pattern_id = "DRU-" + first 8 hex chars (uppercase) of
  SHA-256(normalized_selector + "|" + rule_id)
```

Screen type, theme, and color scheme are intentionally excluded — the same
selector failing the same rule is the same bug everywhere; those variants are
tracked in the pattern's `conditions` list.

**Examples:**
```
pattern_id: DRU-AB12CD34 (all .send-button instances missing name)
pattern_id: DRU-56EF78AB (all button.submit instances missing name)
```

**Use When:**
- Bug affects multiple pages with the same selector
- You want to track the CSS pattern, not individual pages
- Reporting: "All .send-button elements are missing accessible names"
- Higher-level: "This selector pattern needs fixing once to fix everywhere"

### Cross-project fingerprints (a11y_pattern_fingerprint / a11yOccurrenceFingerprint)

`bugs-latest.json` also carries a versioned, cross-project fingerprint
alongside every `DRU-`/`INS-` ID: `a11y_pattern_fingerprint` (with a
`a11y_pattern_display_id` short alias) on each pattern, and
`a11yOccurrenceFingerprint` (with `a11yOccurrenceDisplayId`) on each
per-page occurrence in `affected_pages`. These follow the frozen
`a11y/pattern/v1` / `a11y/occurrence/v1` profiles defined in the canonical
[ACCESSIBILITY.md fingerprint guide](https://mgifford.github.io/ACCESSIBILITY.md/examples/fingerprints/README.html) —
this file does not restate that algorithm; see
`tools/a11y-fingerprints.js` for this repository's implementation.

This is additive, not a replacement: `DRU-` and `INS-` remain the IDs this
repository's own tooling and reports key off of. The new fingerprints exist
so a pattern discovered here can eventually be correlated with the same
underlying defect reported through a different tool or project, without
either project having to adopt the other's identifier format. A short
`A11Y-PAT-`/`A11Y-OCC-` display ID is never authoritative on its own — treat
it as a human-readable label, and use the full fingerprint for any
automated comparison. See
[`reports/pattern-tracker-map.json`](../../../../../reports/pattern-tracker-map.json)
for how a pattern is linked to a filed Drupal.org issue once one exists.

---

## Issue Template

### Title
```
[WCAG X.X.X] {Component} {Missing Feature}
```

**Examples:**
```
[WCAG 4.1.2] Submit buttons missing accessible names
[WCAG 2.4.7] Form focus indicators not visible
[WCAG 3.3.1] Error messages not linked to fields
```

### Body

```markdown
## Accessibility Violation

### Violation ID
- **instance_id:** {INS-XXXXXXXX — first 8 hex of SHA-256}
- **pattern_id:** {DRU-XXXXXXXX — first 8 hex of SHA-256}
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
- **instance_id:** INS-7C2E91A4
- **pattern_id:** DRU-3F8B5D12
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

### Example 2: Pattern Across Pages (Manual Finding)

> **Note on evidence:** axe-core has **no rule** for missing focus
> indicators — automated scanners cannot reliably detect this failure class.
> This finding comes from **manual keyboard testing**, which is why the ACT
> Rule field says "none". Never invent a rule ID to make a manual finding
> look tool-verified; state the actual test method instead.

**Title:** `[WCAG 2.4.7] All buttons missing visible focus indicators`

**Body:**
```markdown
## Accessibility Violation

### Violation ID
- **instance_id:** {multiple instances}
- **pattern_id:** DRU-8A4C2F91 (manual findings get IDs from the same formula)
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
- **WCAG Criterion:** 2.4.7
- **Success Criterion Name:** Focus Visible
- **ACT Rule:** none — found via manual keyboard testing (not automatable with axe-core)
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

## Before You File: Confidence Rubric

An automated finding is **safe to file** only when every gate below passes.
This protects the credibility of automated reporting in the core queue.

| Gate | Check | If it fails |
| :--- | :--- | :--- |
| **1. Classification** | The report marks it a **WCAG failure** (axe `wcag2a`/`wcag2aa` tags), not a Deque **best practice** | Still file it — but as a **Task**, framed as an ARIA/usability best practice. Never claim a WCAG SC it doesn't fail. |
| **2. Reproduction** | A human reproduced one instance manually (DevTools + keyboard, screen reader for name/role findings) and confirmed real user impact | Do not file. Automated evidence alone is a lead, not a bug. |
| **3. Fix verified against HEAD** | Any suggested fix was checked against the current template/CSS in the target branch — generated fix snippets go stale | File the problem without the fix, or update the fix first. A wrong suggested fix is worse than none. |
| **4. No duplicate** | The report's issue-search link (rule + selector/template) returned no open issue | Comment on the existing issue with your pattern_id and new evidence instead. |
| **5. Honest evidence** | The issue states what found it (rule ID + tool version, or "manual keyboard testing") and links the published report | Fix the evidence trail before filing. |

State the test method plainly. "Found by axe-core 4.11 `label` rule, confirmed
manually with VoiceOver" builds trust; an unverified scanner dump erodes it.

---

## Filing on drupal.org

drupal.org does **not** use GitHub-style labels. The issue form has Category,
Component, Version, Priority, and **Issue tags**.

### 1. Create New Issue
Go to [drupal.org/node/add/project-issue/drupal](https://www.drupal.org/node/add/project-issue/drupal)

### 2. Fill the Form
- **Title:** Use template above (plain description also fine; the `[WCAG X.X.X]` prefix helps queue scanning)
- **Category:** Bug report (WCAG failures) or Task (best practices)
- **Component:** The affected theme or module (e.g. `Olivero theme`, `Claro theme`, `forms system`)
- **Version:** Current development branch (e.g. `11.x-dev` — check what the queue uses today)
- **Priority:** Map from axe impact — Critical → Critical, Serious → Major, Moderate → Normal, Minor → Minor
- **Issue summary:** Use the template above

### 3. Add Issue Tags
- **`Accessibility`** — the canonical core a11y tag (always)
- **`wcagXXX`** — the SC-specific tag, digits only, e.g. `wcag143` for 1.4.3, `wcag321` for 3.2.1. This supports the effort to map issues to specific criteria (see [#3506324](https://www.drupal.org/project/drupal/issues/3506324) and the [wcag321 tag search](https://www.drupal.org/project/issues/search?issue_tags=wcag321)). Only tag SCs the issue actually fails — best practices get `Accessibility` only.

### 4. Link to User Story
Use the published URL — repo-relative links are dead on drupal.org:
```markdown
[User Story 3.9: Form Field Focus - Focus Indicator Visible](https://github.com/mgifford/drupal-core/blob/main/USER-STORIES.md)
```

### 5. Submit & Follow Up
- Monitor for responses
- Provide additional test results if requested
- Link to related merge requests

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
- **User Stories:** [USER-STORIES.md](https://github.com/mgifford/drupal-core/blob/main/USER-STORIES.md)
- **Published reports:** https://mgifford.github.io/drupal-core/

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
