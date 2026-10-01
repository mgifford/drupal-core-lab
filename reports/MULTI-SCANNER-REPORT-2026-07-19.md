# Multi-Scanner Accessibility Report

**Date:** 2026-07-19
**Tools:** axe-core + IBM Equal Access + Guidepup Virtual Screen Reader
**Pages scanned:** 231
**Themes:** admin, admin-dark, claro, olivero
**Unique bugs:** 47

## Summary

| Category | Count |
| :--- | ---: |
| Confirmed barriers (2+ tools) | 0 |
| Investigate (1 tool) | 0 |
| Axe-only findings | 12 |
| IBM EA-only findings | 35 |
| Virtual SR-only findings | 0 |

## Confidence Levels

| Level | Meaning | Action |
| :--- | :--- | :--- |
| **CONFIRMED** | 2+ independent tools flag the same issue | Fix — high confidence real barrier |
| **INVESTIGATE** | Only 1 tool flags it | Manual review recommended |
| **AXE-ONLY** | Only axe-core detects it | Likely visual/CSS/structural issue |
| **IBM-EA-ONLY** | Only IBM EA detects it | IBM-specific WCAG rule check |
| **SR-ONLY** | Only virtual SR detects it | Semantic/accessibility tree issue |

## Bug Reports

Each bug follows the [Accessibility Bug Reporting Best Practices](https://mgifford.github.io/ACCESSIBILITY.md/examples/ACCESSIBILITY_BUG_REPORTING_BEST_PRACTICES.html).

### 🔵 [AXE-ONLY] region — Ensure all page content is contained by landmarks (WCAG 1.3.1)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-b286d798` (instance) / `MS-342a02e2` (pattern) |
| **Confidence** | axe-only |
| **URL** | https://drupal-core.ddev.site/admin/modules |
| **XPath** | `//region` |
| **WCAG SC** | 1.3.1 — Info and Relationships (Level A) |
| **Rule** | region — axe-core |
| **Severity** | medium |
| **Frequency** | 8 instance(s) on 6 page(s) |
| **Screen type** | mobile |
| **Colour mode** | light |
| **Themes** | admin, olivero |

**Description:**
Ensure all page content is contained by landmarks. Detected by axe-core only — may be visual/structural.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/modules
2. Run axe-core WCAG 2.2 audit
3. Observe: Ensure all page content is contained by landmarks

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | axe-core |

---

### 🔵 [AXE-ONLY] region — Ensure all page content is contained by landmarks (WCAG 1.3.1)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-c0dd5350` (instance) / `MS-276054a2` (pattern) |
| **Confidence** | axe-only |
| **URL** | https://drupal-core.ddev.site/admin/modules |
| **XPath** | `//region` |
| **WCAG SC** | 1.3.1 — Info and Relationships (Level A) |
| **Rule** | region — axe-core |
| **Severity** | medium |
| **Frequency** | 29 instance(s) on 6 page(s) |
| **Screen type** | desktop |
| **Colour mode** | light |
| **Themes** | admin, olivero |

**Description:**
Ensure all page content is contained by landmarks. Detected by axe-core only — may be visual/structural.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/modules
2. Run axe-core WCAG 2.2 audit
3. Observe: Ensure all page content is contained by landmarks

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | axe-core |

---

### 🔵 [AXE-ONLY] empty-table-header — Ensure table headers have discernible text (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-bbc9398a` (instance) / `MS-0e68d7bd` (pattern) |
| **Confidence** | axe-only |
| **URL** | https://drupal-core.ddev.site/admin/people |
| **XPath** | `//empty-table-header` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | empty-table-header — axe-core |
| **Severity** | medium |
| **Frequency** | 4 instance(s) on 1 page(s) |
| **Screen type** | desktop |
| **Colour mode** | light |
| **Themes** | admin |

**Description:**
Ensure table headers have discernible text. Detected by axe-core only — may be visual/structural.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/people
2. Run axe-core WCAG 2.2 audit
3. Observe: Ensure table headers have discernible text

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | axe-core |

---

### 🔵 [AXE-ONLY] empty-table-header — Ensure table headers have discernible text (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-d8e40f76` (instance) / `MS-57e70d4c` (pattern) |
| **Confidence** | axe-only |
| **URL** | https://drupal-core.ddev.site/admin/people |
| **XPath** | `//empty-table-header` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | empty-table-header — axe-core |
| **Severity** | medium |
| **Frequency** | 1 instance(s) on 1 page(s) |
| **Screen type** | mobile |
| **Colour mode** | light |
| **Themes** | admin |

**Description:**
Ensure table headers have discernible text. Detected by axe-core only — may be visual/structural.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/people
2. Run axe-core WCAG 2.2 audit
3. Observe: Ensure table headers have discernible text

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | axe-core |

---

### 🔵 [AXE-ONLY] region — Ensure all page content is contained by landmarks (WCAG 1.3.1)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-b286d798` (instance) / `MS-342a02e2` (pattern) |
| **Confidence** | axe-only |
| **URL** | https://drupal-core.ddev.site/admin/modules |
| **XPath** | `//region` |
| **WCAG SC** | 1.3.1 — Info and Relationships (Level A) |
| **Rule** | region — axe-core |
| **Severity** | medium |
| **Frequency** | 6 instance(s) on 6 page(s) |
| **Screen type** | mobile |
| **Colour mode** | dark |
| **Themes** | admin-dark |

**Description:**
Ensure all page content is contained by landmarks. Detected by axe-core only — may be visual/structural.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/modules
2. Run axe-core WCAG 2.2 audit
3. Observe: Ensure all page content is contained by landmarks

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | axe-core |

---

### 🔵 [AXE-ONLY] region — Ensure all page content is contained by landmarks (WCAG 1.3.1)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-c0dd5350` (instance) / `MS-276054a2` (pattern) |
| **Confidence** | axe-only |
| **URL** | https://drupal-core.ddev.site/admin/modules |
| **XPath** | `//region` |
| **WCAG SC** | 1.3.1 — Info and Relationships (Level A) |
| **Rule** | region — axe-core |
| **Severity** | medium |
| **Frequency** | 21 instance(s) on 6 page(s) |
| **Screen type** | desktop |
| **Colour mode** | dark |
| **Themes** | admin-dark |

**Description:**
Ensure all page content is contained by landmarks. Detected by axe-core only — may be visual/structural.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/modules
2. Run axe-core WCAG 2.2 audit
3. Observe: Ensure all page content is contained by landmarks

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | axe-core |

---

### 🔵 [AXE-ONLY] empty-table-header — Ensure table headers have discernible text (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-bbc9398a` (instance) / `MS-0e68d7bd` (pattern) |
| **Confidence** | axe-only |
| **URL** | https://drupal-core.ddev.site/admin/people |
| **XPath** | `//empty-table-header` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | empty-table-header — axe-core |
| **Severity** | medium |
| **Frequency** | 4 instance(s) on 1 page(s) |
| **Screen type** | desktop |
| **Colour mode** | dark |
| **Themes** | admin-dark |

**Description:**
Ensure table headers have discernible text. Detected by axe-core only — may be visual/structural.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/people
2. Run axe-core WCAG 2.2 audit
3. Observe: Ensure table headers have discernible text

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | axe-core |

---

### 🔵 [AXE-ONLY] empty-table-header — Ensure table headers have discernible text (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-d8e40f76` (instance) / `MS-57e70d4c` (pattern) |
| **Confidence** | axe-only |
| **URL** | https://drupal-core.ddev.site/admin/people |
| **XPath** | `//empty-table-header` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | empty-table-header — axe-core |
| **Severity** | medium |
| **Frequency** | 1 instance(s) on 1 page(s) |
| **Screen type** | mobile |
| **Colour mode** | dark |
| **Themes** | admin-dark |

**Description:**
Ensure table headers have discernible text. Detected by axe-core only — may be visual/structural.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/people
2. Run axe-core WCAG 2.2 audit
3. Observe: Ensure table headers have discernible text

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | axe-core |

---

### 🔵 [AXE-ONLY] color-contrast — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds (WCAG 1.4.3)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-7cc44bb0` (instance) / `MS-b391e48c` (pattern) |
| **Confidence** | axe-only |
| **URL** | https://drupal-core.ddev.site/admin/people |
| **XPath** | `//color-contrast` |
| **WCAG SC** | 1.4.3 — Contrast (Minimum) (Level AA) |
| **Rule** | color-contrast — axe-core |
| **Severity** | medium |
| **Frequency** | 4 instance(s) on 1 page(s) |
| **Screen type** | desktop |
| **Colour mode** | light |
| **Themes** | claro |

**Description:**
Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds. Detected by axe-core only — may be visual/structural.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/people
2. Run axe-core WCAG 2.2 audit
3. Observe: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | axe-core |

---

### 🔵 [AXE-ONLY] color-contrast — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds (WCAG 1.4.3)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-6578d4f3` (instance) / `MS-b93c981b` (pattern) |
| **Confidence** | axe-only |
| **URL** | https://drupal-core.ddev.site/admin/people |
| **XPath** | `//color-contrast` |
| **WCAG SC** | 1.4.3 — Contrast (Minimum) (Level AA) |
| **Rule** | color-contrast — axe-core |
| **Severity** | medium |
| **Frequency** | 1 instance(s) on 1 page(s) |
| **Screen type** | mobile |
| **Colour mode** | light |
| **Themes** | claro |

**Description:**
Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds. Detected by axe-core only — may be visual/structural.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/people
2. Run axe-core WCAG 2.2 audit
3. Observe: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | axe-core |

---

### 🔵 [AXE-ONLY] link-in-text-block — Ensure links are distinguished from surrounding text in a way that does not rely on color (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-25d32bca` (instance) / `MS-61380df7` (pattern) |
| **Confidence** | axe-only |
| **URL** | https://drupal-core.ddev.site/ |
| **XPath** | `//link-in-text-block` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | link-in-text-block — axe-core |
| **Severity** | medium |
| **Frequency** | 4 instance(s) on 1 page(s) |
| **Screen type** | desktop |
| **Colour mode** | light |
| **Themes** | olivero |

**Description:**
Ensure links are distinguished from surrounding text in a way that does not rely on color. Detected by axe-core only — may be visual/structural.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/
2. Run axe-core WCAG 2.2 audit
3. Observe: Ensure links are distinguished from surrounding text in a way that does not rely on color

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | axe-core |

---

### 🔵 [AXE-ONLY] link-in-text-block — Ensure links are distinguished from surrounding text in a way that does not rely on color (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-42b70cf8` (instance) / `MS-62d5b2a3` (pattern) |
| **Confidence** | axe-only |
| **URL** | https://drupal-core.ddev.site/ |
| **XPath** | `//link-in-text-block` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | link-in-text-block — axe-core |
| **Severity** | medium |
| **Frequency** | 1 instance(s) on 1 page(s) |
| **Screen type** | mobile |
| **Colour mode** | light |
| **Themes** | olivero |

**Description:**
Ensure links are distinguished from surrounding text in a way that does not rely on color. Detected by axe-core only — may be visual/structural.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/
2. Run axe-core WCAG 2.2 audit
3. Observe: Ensure links are distinguished from surrounding text in a way that does not rely on color

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | axe-core |

---

### 🟣 [IBM-EA-ONLY] aria_content_in_landmark — Content is not within a landmark element (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-d83cfed1` (instance) / `MS-a9389b1b` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/admin/modules |
| **XPath** | `//aria_content_in_landmark` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | aria_content_in_landmark — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 28 instance(s) on 12 page(s) |
| **Screen type** | mobile |
| **Colour mode** | light |
| **Themes** | admin, claro, olivero |

**Description:**
Content is not within a landmark element. Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/modules
2. Run IBM Equal Access scan
3. Observe: Content is not within a landmark element

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

### 🟣 [IBM-EA-ONLY] target_spacing_sufficient — Undersized target "a" does not have sufficient spacing of 12 CSS pixels from another target "button" (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-d20e4466` (instance) / `MS-0ac4080f` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/admin/modules |
| **XPath** | `//target_spacing_sufficient` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | target_spacing_sufficient — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 16 instance(s) on 8 page(s) |
| **Screen type** | mobile |
| **Colour mode** | light |
| **Themes** | admin, claro |

**Description:**
Undersized target "a" does not have sufficient spacing of 12 CSS pixels from another target "button". Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/modules
2. Run IBM Equal Access scan
3. Observe: Undersized target "a" does not have sufficient spacing of 12 CSS pixels from another target "button"

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

### 🟣 [IBM-EA-ONLY] aria_complementary_labelled — Element with "complementary" role does not have a label (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-580078db` (instance) / `MS-a28b82f7` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/admin/modules |
| **XPath** | `//aria_complementary_labelled` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | aria_complementary_labelled — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 6 instance(s) on 3 page(s) |
| **Screen type** | mobile |
| **Colour mode** | light |
| **Themes** | admin, claro |

**Description:**
Element with "complementary" role does not have a label. Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/modules
2. Run IBM Equal Access scan
3. Observe: Element with "complementary" role does not have a label

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

### 🟣 [IBM-EA-ONLY] aria_attribute_valid — The ARIA attributes "aria-expanded" are not valid for the element <summary> with ARIA role "none" (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-d97949cf` (instance) / `MS-50e651c0` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/admin/modules |
| **XPath** | `//aria_attribute_valid` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | aria_attribute_valid — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 8 instance(s) on 4 page(s) |
| **Screen type** | mobile |
| **Colour mode** | light |
| **Themes** | admin, claro |

**Description:**
The ARIA attributes "aria-expanded" are not valid for the element <summary> with ARIA role "none". Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/modules
2. Run IBM Equal Access scan
3. Observe: The ARIA attributes "aria-expanded" are not valid for the element <summary> with ARIA role "none"

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

### 🟣 [IBM-EA-ONLY] input_label_exists — Form control element <input> has no associated label (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-f7c87c53` (instance) / `MS-ef19cbc0` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/admin/modules |
| **XPath** | `//input_label_exists` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | input_label_exists — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 2 instance(s) on 1 page(s) |
| **Screen type** | mobile |
| **Colour mode** | light |
| **Themes** | admin, claro |

**Description:**
Form control element <input> has no associated label. Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/modules
2. Run IBM Equal Access scan
3. Observe: Form control element <input> has no associated label

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

### 🟣 [IBM-EA-ONLY] aria_content_in_landmark — Content is not within a landmark element (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-93fab266` (instance) / `MS-dbbfb46c` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/admin/modules |
| **XPath** | `//aria_content_in_landmark` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | aria_content_in_landmark — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 106 instance(s) on 12 page(s) |
| **Screen type** | desktop |
| **Colour mode** | light |
| **Themes** | admin, claro, olivero |

**Description:**
Content is not within a landmark element. Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/modules
2. Run IBM Equal Access scan
3. Observe: Content is not within a landmark element

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

### 🟣 [IBM-EA-ONLY] target_spacing_sufficient — Undersized target "a" does not have sufficient spacing of 12 CSS pixels from another target "button" (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-6830b8fe` (instance) / `MS-8208c9c9` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/admin/modules |
| **XPath** | `//target_spacing_sufficient` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | target_spacing_sufficient — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 30 instance(s) on 8 page(s) |
| **Screen type** | desktop |
| **Colour mode** | light |
| **Themes** | admin, claro |

**Description:**
Undersized target "a" does not have sufficient spacing of 12 CSS pixels from another target "button". Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/modules
2. Run IBM Equal Access scan
3. Observe: Undersized target "a" does not have sufficient spacing of 12 CSS pixels from another target "button"

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

### 🟣 [IBM-EA-ONLY] aria_complementary_labelled — Element with "complementary" role does not have a label (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-be19c024` (instance) / `MS-17aecd07` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/admin/modules |
| **XPath** | `//aria_complementary_labelled` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | aria_complementary_labelled — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 16 instance(s) on 3 page(s) |
| **Screen type** | desktop |
| **Colour mode** | light |
| **Themes** | admin, claro |

**Description:**
Element with "complementary" role does not have a label. Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/modules
2. Run IBM Equal Access scan
3. Observe: Element with "complementary" role does not have a label

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

### 🟣 [IBM-EA-ONLY] aria_attribute_valid — The ARIA attributes "aria-expanded" are not valid for the element <summary> with ARIA role "none" (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-2ccd4574` (instance) / `MS-8151c70f` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/admin/modules |
| **XPath** | `//aria_attribute_valid` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | aria_attribute_valid — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 22 instance(s) on 4 page(s) |
| **Screen type** | desktop |
| **Colour mode** | light |
| **Themes** | admin, claro |

**Description:**
The ARIA attributes "aria-expanded" are not valid for the element <summary> with ARIA role "none". Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/modules
2. Run IBM Equal Access scan
3. Observe: The ARIA attributes "aria-expanded" are not valid for the element <summary> with ARIA role "none"

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

### 🟣 [IBM-EA-ONLY] input_label_exists — Form control element <input> has no associated label (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-79e8c04f` (instance) / `MS-e7217da0` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/admin/modules |
| **XPath** | `//input_label_exists` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | input_label_exists — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 2 instance(s) on 1 page(s) |
| **Screen type** | desktop |
| **Colour mode** | light |
| **Themes** | admin, claro |

**Description:**
Form control element <input> has no associated label. Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/modules
2. Run IBM Equal Access scan
3. Observe: Form control element <input> has no associated label

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

### 🟣 [IBM-EA-ONLY] input_label_after — Label text is located before its associated checkbox or radio button element (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-2c3c3f26` (instance) / `MS-39be343e` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/admin/people |
| **XPath** | `//input_label_after` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | input_label_after — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 8 instance(s) on 1 page(s) |
| **Screen type** | desktop |
| **Colour mode** | light |
| **Themes** | admin, claro |

**Description:**
Label text is located before its associated checkbox or radio button element. Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/people
2. Run IBM Equal Access scan
3. Observe: Label text is located before its associated checkbox or radio button element

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

### 🟣 [IBM-EA-ONLY] input_label_after — Label text is located before its associated checkbox or radio button element (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-0a9d7d3a` (instance) / `MS-14d40629` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/admin/people |
| **XPath** | `//input_label_after` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | input_label_after — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 2 instance(s) on 1 page(s) |
| **Screen type** | mobile |
| **Colour mode** | light |
| **Themes** | admin, claro |

**Description:**
Label text is located before its associated checkbox or radio button element. Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/people
2. Run IBM Equal Access scan
3. Observe: Label text is located before its associated checkbox or radio button element

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

### 🟣 [IBM-EA-ONLY] element_tabbable_role_valid — The tabbable element does not have a valid widget role (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-7af95e8f` (instance) / `MS-e1d25bcc` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/user/1/edit |
| **XPath** | `//element_tabbable_role_valid` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | element_tabbable_role_valid — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 2 instance(s) on 1 page(s) |
| **Screen type** | desktop |
| **Colour mode** | light |
| **Themes** | admin |

**Description:**
The tabbable element does not have a valid widget role. Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/user/1/edit
2. Run IBM Equal Access scan
3. Observe: The tabbable element does not have a valid widget role

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

### 🟣 [IBM-EA-ONLY] label_ref_valid — The value "edit-filter-settings" of the 'for' attribute is not the 'id' of a valid element (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-905e1f2a` (instance) / `MS-b4a9c9ab` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/admin/config/content/formats/manage/restricted_html |
| **XPath** | `//label_ref_valid` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | label_ref_valid — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 8 instance(s) on 1 page(s) |
| **Screen type** | desktop |
| **Colour mode** | light |
| **Themes** | admin, claro |

**Description:**
The value "edit-filter-settings" of the 'for' attribute is not the 'id' of a valid element. Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/config/content/formats/manage/restricted_html
2. Run IBM Equal Access scan
3. Observe: The value "edit-filter-settings" of the 'for' attribute is not the 'id' of a valid element

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

### 🟣 [IBM-EA-ONLY] table_headers_exists — Table has no headers identified (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-19aed87f` (instance) / `MS-ffd19812` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/admin/config/content/formats/manage/restricted_html |
| **XPath** | `//table_headers_exists` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | table_headers_exists — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 8 instance(s) on 1 page(s) |
| **Screen type** | desktop |
| **Colour mode** | light |
| **Themes** | admin, claro |

**Description:**
Table has no headers identified. Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/config/content/formats/manage/restricted_html
2. Run IBM Equal Access scan
3. Observe: Table has no headers identified

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

### 🟣 [IBM-EA-ONLY] label_ref_valid — The value "edit-filter-settings" of the 'for' attribute is not the 'id' of a valid element (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-25b18f9f` (instance) / `MS-81856b43` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/admin/config/content/formats/manage/restricted_html |
| **XPath** | `//label_ref_valid` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | label_ref_valid — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 2 instance(s) on 1 page(s) |
| **Screen type** | mobile |
| **Colour mode** | light |
| **Themes** | admin, claro |

**Description:**
The value "edit-filter-settings" of the 'for' attribute is not the 'id' of a valid element. Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/config/content/formats/manage/restricted_html
2. Run IBM Equal Access scan
3. Observe: The value "edit-filter-settings" of the 'for' attribute is not the 'id' of a valid element

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

### 🟣 [IBM-EA-ONLY] table_headers_exists — Table has no headers identified (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-59f6e144` (instance) / `MS-52d96e7e` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/admin/config/content/formats/manage/restricted_html |
| **XPath** | `//table_headers_exists` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | table_headers_exists — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 2 instance(s) on 1 page(s) |
| **Screen type** | mobile |
| **Colour mode** | light |
| **Themes** | admin, claro |

**Description:**
Table has no headers identified. Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/config/content/formats/manage/restricted_html
2. Run IBM Equal Access scan
3. Observe: Table has no headers identified

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

### 🟣 [IBM-EA-ONLY] aria_content_in_landmark — Content is not within a landmark element (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-d83cfed1` (instance) / `MS-a9389b1b` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/admin/modules |
| **XPath** | `//aria_content_in_landmark` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | aria_content_in_landmark — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 12 instance(s) on 12 page(s) |
| **Screen type** | mobile |
| **Colour mode** | dark |
| **Themes** | admin-dark |

**Description:**
Content is not within a landmark element. Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/modules
2. Run IBM Equal Access scan
3. Observe: Content is not within a landmark element

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

### 🟣 [IBM-EA-ONLY] target_spacing_sufficient — Undersized target "a" does not have sufficient spacing of 12 CSS pixels from another target "button" (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-d20e4466` (instance) / `MS-0ac4080f` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/admin/modules |
| **XPath** | `//target_spacing_sufficient` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | target_spacing_sufficient — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 8 instance(s) on 8 page(s) |
| **Screen type** | mobile |
| **Colour mode** | dark |
| **Themes** | admin-dark |

**Description:**
Undersized target "a" does not have sufficient spacing of 12 CSS pixels from another target "button". Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/modules
2. Run IBM Equal Access scan
3. Observe: Undersized target "a" does not have sufficient spacing of 12 CSS pixels from another target "button"

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

### 🟣 [IBM-EA-ONLY] aria_complementary_labelled — Element with "complementary" role does not have a label (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-580078db` (instance) / `MS-a28b82f7` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/admin/modules |
| **XPath** | `//aria_complementary_labelled` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | aria_complementary_labelled — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 3 instance(s) on 3 page(s) |
| **Screen type** | mobile |
| **Colour mode** | dark |
| **Themes** | admin-dark |

**Description:**
Element with "complementary" role does not have a label. Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/modules
2. Run IBM Equal Access scan
3. Observe: Element with "complementary" role does not have a label

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

### 🟣 [IBM-EA-ONLY] aria_attribute_valid — The ARIA attributes "aria-expanded" are not valid for the element <summary> with ARIA role "none" (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-d97949cf` (instance) / `MS-50e651c0` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/admin/modules |
| **XPath** | `//aria_attribute_valid` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | aria_attribute_valid — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 4 instance(s) on 4 page(s) |
| **Screen type** | mobile |
| **Colour mode** | dark |
| **Themes** | admin-dark |

**Description:**
The ARIA attributes "aria-expanded" are not valid for the element <summary> with ARIA role "none". Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/modules
2. Run IBM Equal Access scan
3. Observe: The ARIA attributes "aria-expanded" are not valid for the element <summary> with ARIA role "none"

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

### 🟣 [IBM-EA-ONLY] input_label_exists — Form control element <input> has no associated label (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-f7c87c53` (instance) / `MS-ef19cbc0` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/admin/modules |
| **XPath** | `//input_label_exists` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | input_label_exists — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 1 instance(s) on 1 page(s) |
| **Screen type** | mobile |
| **Colour mode** | dark |
| **Themes** | admin-dark |

**Description:**
Form control element <input> has no associated label. Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/modules
2. Run IBM Equal Access scan
3. Observe: Form control element <input> has no associated label

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

### 🟣 [IBM-EA-ONLY] aria_content_in_landmark — Content is not within a landmark element (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-93fab266` (instance) / `MS-dbbfb46c` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/admin/modules |
| **XPath** | `//aria_content_in_landmark` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | aria_content_in_landmark — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 45 instance(s) on 12 page(s) |
| **Screen type** | desktop |
| **Colour mode** | dark |
| **Themes** | admin-dark |

**Description:**
Content is not within a landmark element. Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/modules
2. Run IBM Equal Access scan
3. Observe: Content is not within a landmark element

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

### 🟣 [IBM-EA-ONLY] target_spacing_sufficient — Undersized target "a" does not have sufficient spacing of 12 CSS pixels from another target "button" (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-6830b8fe` (instance) / `MS-8208c9c9` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/admin/modules |
| **XPath** | `//target_spacing_sufficient` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | target_spacing_sufficient — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 15 instance(s) on 8 page(s) |
| **Screen type** | desktop |
| **Colour mode** | dark |
| **Themes** | admin-dark |

**Description:**
Undersized target "a" does not have sufficient spacing of 12 CSS pixels from another target "button". Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/modules
2. Run IBM Equal Access scan
3. Observe: Undersized target "a" does not have sufficient spacing of 12 CSS pixels from another target "button"

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

### 🟣 [IBM-EA-ONLY] aria_complementary_labelled — Element with "complementary" role does not have a label (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-be19c024` (instance) / `MS-17aecd07` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/admin/modules |
| **XPath** | `//aria_complementary_labelled` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | aria_complementary_labelled — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 9 instance(s) on 3 page(s) |
| **Screen type** | desktop |
| **Colour mode** | dark |
| **Themes** | admin-dark |

**Description:**
Element with "complementary" role does not have a label. Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/modules
2. Run IBM Equal Access scan
3. Observe: Element with "complementary" role does not have a label

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

### 🟣 [IBM-EA-ONLY] aria_attribute_valid — The ARIA attributes "aria-expanded" are not valid for the element <summary> with ARIA role "none" (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-2ccd4574` (instance) / `MS-8151c70f` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/admin/modules |
| **XPath** | `//aria_attribute_valid` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | aria_attribute_valid — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 13 instance(s) on 4 page(s) |
| **Screen type** | desktop |
| **Colour mode** | dark |
| **Themes** | admin-dark |

**Description:**
The ARIA attributes "aria-expanded" are not valid for the element <summary> with ARIA role "none". Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/modules
2. Run IBM Equal Access scan
3. Observe: The ARIA attributes "aria-expanded" are not valid for the element <summary> with ARIA role "none"

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

### 🟣 [IBM-EA-ONLY] input_label_exists — Form control element <input> has no associated label (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-79e8c04f` (instance) / `MS-e7217da0` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/admin/modules |
| **XPath** | `//input_label_exists` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | input_label_exists — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 1 instance(s) on 1 page(s) |
| **Screen type** | desktop |
| **Colour mode** | dark |
| **Themes** | admin-dark |

**Description:**
Form control element <input> has no associated label. Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/modules
2. Run IBM Equal Access scan
3. Observe: Form control element <input> has no associated label

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

### 🟣 [IBM-EA-ONLY] input_label_after — Label text is located before its associated checkbox or radio button element (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-2c3c3f26` (instance) / `MS-39be343e` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/admin/people |
| **XPath** | `//input_label_after` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | input_label_after — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 4 instance(s) on 1 page(s) |
| **Screen type** | desktop |
| **Colour mode** | dark |
| **Themes** | admin-dark |

**Description:**
Label text is located before its associated checkbox or radio button element. Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/people
2. Run IBM Equal Access scan
3. Observe: Label text is located before its associated checkbox or radio button element

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

### 🟣 [IBM-EA-ONLY] input_label_after — Label text is located before its associated checkbox or radio button element (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-0a9d7d3a` (instance) / `MS-14d40629` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/admin/people |
| **XPath** | `//input_label_after` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | input_label_after — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 1 instance(s) on 1 page(s) |
| **Screen type** | mobile |
| **Colour mode** | dark |
| **Themes** | admin-dark |

**Description:**
Label text is located before its associated checkbox or radio button element. Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/people
2. Run IBM Equal Access scan
3. Observe: Label text is located before its associated checkbox or radio button element

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

### 🟣 [IBM-EA-ONLY] element_tabbable_role_valid — The tabbable element does not have a valid widget role (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-7af95e8f` (instance) / `MS-e1d25bcc` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/user/1/edit |
| **XPath** | `//element_tabbable_role_valid` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | element_tabbable_role_valid — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 2 instance(s) on 1 page(s) |
| **Screen type** | desktop |
| **Colour mode** | dark |
| **Themes** | admin-dark |

**Description:**
The tabbable element does not have a valid widget role. Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/user/1/edit
2. Run IBM Equal Access scan
3. Observe: The tabbable element does not have a valid widget role

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

### 🟣 [IBM-EA-ONLY] label_ref_valid — The value "edit-filter-settings" of the 'for' attribute is not the 'id' of a valid element (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-905e1f2a` (instance) / `MS-b4a9c9ab` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/admin/config/content/formats/manage/restricted_html |
| **XPath** | `//label_ref_valid` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | label_ref_valid — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 4 instance(s) on 1 page(s) |
| **Screen type** | desktop |
| **Colour mode** | dark |
| **Themes** | admin-dark |

**Description:**
The value "edit-filter-settings" of the 'for' attribute is not the 'id' of a valid element. Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/config/content/formats/manage/restricted_html
2. Run IBM Equal Access scan
3. Observe: The value "edit-filter-settings" of the 'for' attribute is not the 'id' of a valid element

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

### 🟣 [IBM-EA-ONLY] table_headers_exists — Table has no headers identified (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-19aed87f` (instance) / `MS-ffd19812` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/admin/config/content/formats/manage/restricted_html |
| **XPath** | `//table_headers_exists` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | table_headers_exists — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 4 instance(s) on 1 page(s) |
| **Screen type** | desktop |
| **Colour mode** | dark |
| **Themes** | admin-dark |

**Description:**
Table has no headers identified. Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/config/content/formats/manage/restricted_html
2. Run IBM Equal Access scan
3. Observe: Table has no headers identified

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

### 🟣 [IBM-EA-ONLY] label_ref_valid — The value "edit-filter-settings" of the 'for' attribute is not the 'id' of a valid element (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-25b18f9f` (instance) / `MS-81856b43` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/admin/config/content/formats/manage/restricted_html |
| **XPath** | `//label_ref_valid` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | label_ref_valid — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 1 instance(s) on 1 page(s) |
| **Screen type** | mobile |
| **Colour mode** | dark |
| **Themes** | admin-dark |

**Description:**
The value "edit-filter-settings" of the 'for' attribute is not the 'id' of a valid element. Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/config/content/formats/manage/restricted_html
2. Run IBM Equal Access scan
3. Observe: The value "edit-filter-settings" of the 'for' attribute is not the 'id' of a valid element

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

### 🟣 [IBM-EA-ONLY] table_headers_exists — Table has no headers identified (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-59f6e144` (instance) / `MS-52d96e7e` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/admin/config/content/formats/manage/restricted_html |
| **XPath** | `//table_headers_exists` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | table_headers_exists — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 1 instance(s) on 1 page(s) |
| **Screen type** | mobile |
| **Colour mode** | dark |
| **Themes** | admin-dark |

**Description:**
Table has no headers identified. Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/config/content/formats/manage/restricted_html
2. Run IBM Equal Access scan
3. Observe: Table has no headers identified

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

### 🟣 [IBM-EA-ONLY] svg_graphics_labelled — The SVG element has no accessible name (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-2ac0a4e5` (instance) / `MS-be563c4a` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/admin/modules |
| **XPath** | `//svg_graphics_labelled` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | svg_graphics_labelled — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 4 instance(s) on 4 page(s) |
| **Screen type** | mobile |
| **Colour mode** | light |
| **Themes** | claro |

**Description:**
The SVG element has no accessible name. Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/admin/modules
2. Run IBM Equal Access scan
3. Observe: The SVG element has no accessible name

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | N/A |
| Tool | IBM Equal Access (accessibility-checker) |

---

## Per-Theme Breakdown

### admin

- **Records:** 67
- **Unique bugs:** 21
- **Confirmed:** 0
- **Investigate:** 0

### admin-dark

- **Records:** 67
- **Unique bugs:** 21
- **Confirmed:** 0
- **Investigate:** 0

### claro

- **Records:** 67
- **Unique bugs:** 19
- **Confirmed:** 0
- **Investigate:** 0

### olivero

- **Records:** 30
- **Unique bugs:** 6
- **Confirmed:** 0
- **Investigate:** 0

---

## Cross-Reference Legend

| Scenario | Meaning | Action |
| :--- | :--- | :--- |
| 2+ tools flag | Confirmed barrier | Fix it |
| 1 tool flags | Investigate | Manual review |
| Axe only | Visual/structural issue | CSS or HTML fix |
| IBM EA only | IBM WCAG rule | Check IBM rule details |
| Virtual SR only | Semantic issue | Accessibility tree fix |
| Neither flag | Likely OK | No action needed |
