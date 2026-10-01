# Multi-Scanner Accessibility Report

**Date:** 2026-07-18
**Tools:** axe-core + IBM Equal Access + Guidepup Virtual Screen Reader
**Pages scanned:** 369
**Themes:** admin, admin-dark, claro, olivero
**Unique bugs:** 15

## Summary

| Category | Count |
| :--- | ---: |
| Confirmed barriers (2+ tools) | 0 |
| Investigate (1 tool) | 4 |
| Axe-only findings | 6 |
| IBM EA-only findings | 5 |
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

### 🟡 [INVESTIGATE] missing-nav — No navigation landmark found (WCAG 1.3.1)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-79d3451d` (instance) / `MS-f18f484a` (pattern) |
| **Confidence** | investigate |
| **URL** | https://drupal-core.ddev.site/ |
| **XPath** | `//missing-nav` |
| **WCAG SC** | 1.3.1 — Info and Relationships (Level A) |
| **Rule** | missing-nav — virtualSR |
| **Severity** | medium |
| **Frequency** | 26 instance(s) on 3 page(s) |
| **Screen type** | desktop |
| **Colour mode** | light |
| **Themes** | admin, claro, olivero |

**Description:**
No navigation landmark found. Detected by: virtualSR. Manual review recommended.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/
2. Run accessibility scan (virtualSR)
3. Observe: No navigation landmark found

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | Guidepup Virtual SR (simulated) |
| Tool | virtualSR |

---

### 🟡 [INVESTIGATE] missing-nav — No navigation landmark found (WCAG 1.3.1)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-20b88ed1` (instance) / `MS-01d69887` (pattern) |
| **Confidence** | investigate |
| **URL** | https://drupal-core.ddev.site/ |
| **XPath** | `//missing-nav` |
| **WCAG SC** | 1.3.1 — Info and Relationships (Level A) |
| **Rule** | missing-nav — virtualSR |
| **Severity** | medium |
| **Frequency** | 7 instance(s) on 3 page(s) |
| **Screen type** | mobile |
| **Colour mode** | light |
| **Themes** | admin, claro, olivero |

**Description:**
No navigation landmark found. Detected by: virtualSR. Manual review recommended.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/
2. Run accessibility scan (virtualSR)
3. Observe: No navigation landmark found

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | Guidepup Virtual SR (simulated) |
| Tool | virtualSR |

---

### 🟡 [INVESTIGATE] missing-nav — No navigation landmark found (WCAG 1.3.1)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-79d3451d` (instance) / `MS-f18f484a` (pattern) |
| **Confidence** | investigate |
| **URL** | https://drupal-core.ddev.site/ |
| **XPath** | `//missing-nav` |
| **WCAG SC** | 1.3.1 — Info and Relationships (Level A) |
| **Rule** | missing-nav — virtualSR |
| **Severity** | medium |
| **Frequency** | 12 instance(s) on 3 page(s) |
| **Screen type** | desktop |
| **Colour mode** | dark |
| **Themes** | admin-dark |

**Description:**
No navigation landmark found. Detected by: virtualSR. Manual review recommended.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/
2. Run accessibility scan (virtualSR)
3. Observe: No navigation landmark found

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | Guidepup Virtual SR (simulated) |
| Tool | virtualSR |

---

### 🟡 [INVESTIGATE] missing-nav — No navigation landmark found (WCAG 1.3.1)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-20b88ed1` (instance) / `MS-01d69887` (pattern) |
| **Confidence** | investigate |
| **URL** | https://drupal-core.ddev.site/ |
| **XPath** | `//missing-nav` |
| **WCAG SC** | 1.3.1 — Info and Relationships (Level A) |
| **Rule** | missing-nav — virtualSR |
| **Severity** | medium |
| **Frequency** | 3 instance(s) on 3 page(s) |
| **Screen type** | mobile |
| **Colour mode** | dark |
| **Themes** | admin-dark |

**Description:**
No navigation landmark found. Detected by: virtualSR. Manual review recommended.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/
2. Run accessibility scan (virtualSR)
3. Observe: No navigation landmark found

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | Guidepup Virtual SR (simulated) |
| Tool | virtualSR |

---

### 🔵 [AXE-ONLY] region — Ensure all page content is contained by landmarks (WCAG 1.3.1)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-8d0ae0f9` (instance) / `MS-276054a2` (pattern) |
| **Confidence** | axe-only |
| **URL** | https://drupal-core.ddev.site/user/login |
| **XPath** | `//region` |
| **WCAG SC** | 1.3.1 — Info and Relationships (Level A) |
| **Rule** | region — axe-core |
| **Severity** | medium |
| **Frequency** | 20 instance(s) on 2 page(s) |
| **Screen type** | desktop |
| **Colour mode** | light |
| **Themes** | admin, olivero |

**Description:**
Ensure all page content is contained by landmarks. Detected by axe-core only — may be visual/structural.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/user/login
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
| **Bug ID** | `MS-c1c636bb` (instance) / `MS-342a02e2` (pattern) |
| **Confidence** | axe-only |
| **URL** | https://drupal-core.ddev.site/user/login |
| **XPath** | `//region` |
| **WCAG SC** | 1.3.1 — Info and Relationships (Level A) |
| **Rule** | region — axe-core |
| **Severity** | medium |
| **Frequency** | 5 instance(s) on 2 page(s) |
| **Screen type** | mobile |
| **Colour mode** | light |
| **Themes** | admin, olivero |

**Description:**
Ensure all page content is contained by landmarks. Detected by axe-core only — may be visual/structural.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/user/login
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
| **Bug ID** | `MS-8d0ae0f9` (instance) / `MS-276054a2` (pattern) |
| **Confidence** | axe-only |
| **URL** | https://drupal-core.ddev.site/user/login |
| **XPath** | `//region` |
| **WCAG SC** | 1.3.1 — Info and Relationships (Level A) |
| **Rule** | region — axe-core |
| **Severity** | medium |
| **Frequency** | 8 instance(s) on 2 page(s) |
| **Screen type** | desktop |
| **Colour mode** | dark |
| **Themes** | admin-dark |

**Description:**
Ensure all page content is contained by landmarks. Detected by axe-core only — may be visual/structural.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/user/login
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
| **Bug ID** | `MS-c1c636bb` (instance) / `MS-342a02e2` (pattern) |
| **Confidence** | axe-only |
| **URL** | https://drupal-core.ddev.site/user/login |
| **XPath** | `//region` |
| **WCAG SC** | 1.3.1 — Info and Relationships (Level A) |
| **Rule** | region — axe-core |
| **Severity** | medium |
| **Frequency** | 2 instance(s) on 2 page(s) |
| **Screen type** | mobile |
| **Colour mode** | dark |
| **Themes** | admin-dark |

**Description:**
Ensure all page content is contained by landmarks. Detected by axe-core only — may be visual/structural.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/user/login
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
| **Frequency** | 8 instance(s) on 1 page(s) |
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
| **Frequency** | 2 instance(s) on 1 page(s) |
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
| **Bug ID** | `MS-6e0e80ac` (instance) / `MS-dbbfb46c` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/ |
| **XPath** | `//aria_content_in_landmark` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | aria_content_in_landmark — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 59 instance(s) on 5 page(s) |
| **Screen type** | desktop |
| **Colour mode** | light |
| **Themes** | admin, claro, olivero |

**Description:**
Content is not within a landmark element. Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/
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

### 🟣 [IBM-EA-ONLY] aria_content_in_landmark — Content is not within a landmark element (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-3d0e1bcc` (instance) / `MS-a9389b1b` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/ |
| **XPath** | `//aria_content_in_landmark` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | aria_content_in_landmark — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 15 instance(s) on 5 page(s) |
| **Screen type** | mobile |
| **Colour mode** | light |
| **Themes** | admin, claro, olivero |

**Description:**
Content is not within a landmark element. Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/
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

### 🟣 [IBM-EA-ONLY] aria_content_in_landmark — Content is not within a landmark element (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-6e0e80ac` (instance) / `MS-dbbfb46c` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/ |
| **XPath** | `//aria_content_in_landmark` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | aria_content_in_landmark — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 20 instance(s) on 5 page(s) |
| **Screen type** | desktop |
| **Colour mode** | dark |
| **Themes** | admin-dark |

**Description:**
Content is not within a landmark element. Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/
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

### 🟣 [IBM-EA-ONLY] aria_content_in_landmark — Content is not within a landmark element (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-3d0e1bcc` (instance) / `MS-a9389b1b` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/ |
| **XPath** | `//aria_content_in_landmark` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | aria_content_in_landmark — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 5 instance(s) on 5 page(s) |
| **Screen type** | mobile |
| **Colour mode** | dark |
| **Themes** | admin-dark |

**Description:**
Content is not within a landmark element. Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/
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

### 🟣 [IBM-EA-ONLY] svg_graphics_labelled — The SVG element has no accessible name (WCAG unknown)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `MS-73d6357a` (instance) / `MS-be563c4a` (pattern) |
| **Confidence** | ibmea-only |
| **URL** | https://drupal-core.ddev.site/user/login |
| **XPath** | `//svg_graphics_labelled` |
| **WCAG SC** | unknown — Unknown (Level A) |
| **Rule** | svg_graphics_labelled — IBM Equal Access |
| **Severity** | medium |
| **Frequency** | 2 instance(s) on 2 page(s) |
| **Screen type** | mobile |
| **Colour mode** | light |
| **Themes** | claro |

**Description:**
The SVG element has no accessible name. Detected by IBM Equal Access only.

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/user/login
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

- **Records:** 105
- **Unique bugs:** 6
- **Confirmed:** 0
- **Investigate:** 2

### admin-dark

- **Records:** 105
- **Unique bugs:** 6
- **Confirmed:** 0
- **Investigate:** 2

### claro

- **Records:** 110
- **Unique bugs:** 5
- **Confirmed:** 0
- **Investigate:** 2

### olivero

- **Records:** 49
- **Unique bugs:** 8
- **Confirmed:** 0
- **Investigate:** 2

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
