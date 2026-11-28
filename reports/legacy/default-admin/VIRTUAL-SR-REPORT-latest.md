# Virtual Screen Reader Accessibility Report

**Date:** 2026-07-18
**Tool:** Guidepup Virtual Screen Reader + axe-core
**Pages scanned:** 20
**Themes:** claro, olivero
**Unique bugs:** 2

## Summary

| Category | Count |
| :--- | ---: |
| Confirmed barriers (both tools) | 0 |
| SR-only findings (semantic) | 2 |

## Bug Reports

Each bug follows the [Accessibility Bug Reporting Best Practices](https://mgifford.github.io/ACCESSIBILITY.md/examples/ACCESSIBILITY_BUG_REPORTING_BEST_PRACTICES.html).

### missing-nav — No navigation landmark found (WCAG 1.3.1)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `VSR-f2cc14e5` (instance) / `VSR-8568c19b` (pattern) |
| **URL** | https://drupal-core.ddev.site/ |
| **XPath** | `//missing-nav` |
| **WCAG SC** | 1.3.1 — Info and Relationships (Level A) |
| **Rule** | missing-nav — Guidepup Virtual Screen Reader |
| **Severity** | medium |
| **Frequency** | 7 instance(s) on 1 page(s) |
| **Screen type** | desktop |
| **Colour mode** | light |
| **Themes** | claro, olivero |

**Description:**
No navigation landmark found

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/
2. Run virtual screen reader audit
3. Observe: No navigation landmark found

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | Guidepup Virtual SR (simulated) |
| Tool | @guidepup/virtual-screen-reader |

---

### missing-nav — No navigation landmark found (WCAG 1.3.1)

| Field | Value |
| :--- | :--- |
| **Bug ID** | `VSR-5f81aee1` (instance) / `VSR-2181c297` (pattern) |
| **URL** | https://drupal-core.ddev.site/ |
| **XPath** | `//missing-nav` |
| **WCAG SC** | 1.3.1 — Info and Relationships (Level A) |
| **Rule** | missing-nav — Guidepup Virtual Screen Reader |
| **Severity** | medium |
| **Frequency** | 2 instance(s) on 1 page(s) |
| **Screen type** | mobile |
| **Colour mode** | light |
| **Themes** | claro, olivero |

**Description:**
No navigation landmark found

**Steps to Reproduce:**
1. Navigate to https://drupal-core.ddev.site/
2. Run virtual screen reader audit
3. Observe: No navigation landmark found

**Testing Environment:**

| Item | Value |
| :--- | :--- |
| Browser | Chromium (Playwright) |
| OS | darwin |
| Screen reader | Guidepup Virtual SR (simulated) |
| Tool | @guidepup/virtual-screen-reader |

---

## Per-Theme Breakdown

### claro

- **Records:** 5
- **Unique bugs:** 2

### olivero

- **Records:** 15
- **Unique bugs:** 2

---

## Cross-Reference Legend

| Scenario | Meaning | Action |
| :--- | :--- | :--- |
| Both tools flag | Confirmed barrier | Fix it |
| Axe only | Visual/structural issue | CSS or HTML fix |
| Virtual SR only | Semantic issue | Accessibility tree fix |
| Neither flag | Likely OK | No action needed |
