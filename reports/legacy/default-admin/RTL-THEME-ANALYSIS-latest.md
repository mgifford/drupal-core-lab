# RTL / Theme-Specific Accessibility Analysis

Generated: 2026-05-06  
Total crawl records analysed: **2193**

---

## Table of Contents

1. [RTL-Exclusive Issues (Hebrew only, not in English)](#rtl-exclusive-issues)
2. [RTL-Amplified Issues (worse in Hebrew than English)](#rtl-amplified-issues)
3. [Admin (Gin) Theme Only](#admin-gin-theme-only)
4. [Claro / Claro Dark Theme Only](#claro-theme-only)
5. [Admin + Claro (not Olivero)](#admin-and-claro-not-olivero)
6. [Master Priority List (all issues, composite score)](#master-priority-list)
7. [How to Use This Report with the Drupal Issue Queue](#drupal-issue-queue)

---

## RTL-Exclusive Issues

These violations appear **only** when Drupal is rendered in Hebrew (RTL). They have zero matching violations in the equivalent English (LTR) page+theme+rule combination. This likely indicates either:

- An element that only renders in RTL context (e.g. the Hebrew language switcher link)
- A CSS layout or text rendering issue triggered by `dir="rtl"` that changes the computed colour or position enough to fail

_No purely RTL-exclusive violations found in current dataset._
---

## RTL-Amplified Issues

These violations exist in both English and Hebrew, but appear **more frequently** in Hebrew/RTL contexts. The amplification ratio shows RTL-instance-count ÷ LTR-instance-count.

**2 issues are more severe in RTL.**

| # | Rule | Impact | Theme | Path | Selector | LTR nodes | RTL nodes | Ratio |
|---|------|--------|-------|------|----------|-----------|-----------|-------|
| 1 | `color-contrast` | 🟠 Serious | `admin` | `/admin/structure/types/add` | `#edit-save-continue` | 3 | 4 | 1.33× |
| 2 | `color-contrast` | 🟠 Serious | `admin` | `/admin/structure/types/add` | `#edit-submit` | 3 | 4 | 1.33× |

---

## Admin (Gin) Theme Only

These violations are found in the **Admin/Gin theme but not in Claro or Olivero**. Issues here are specific to the Gin administration theme which ships separately from Drupal core.

| # | Rule | Impact | Selector | Pages | Node count |
|---|------|--------|----------|-------|------------|
| 1 | `color-contrast` | 🟠 Serious | `a[hreflang="he"]` | 17 | 131 |
| 2 | `color-contrast` | 🟠 Serious | `a[hreflang="en"]` | 16 | 123 |
| 3 | `label-title-only` | 🟠 Serious | `.gin--sticky-table-header > thead > tr > .select-all.gin--st` | 1 | 88 |
| 4 | `label-title-only` | 🟠 Serious | `.views-table > thead > tr > .select-all.gin--sticky-bulk-sel` | 1 | 88 |
| 5 | `color-contrast` | 🟠 Serious | `.button--action` | 3 | 21 |
| 6 | `color-contrast` | 🟠 Serious | `summary[aria-controls="edit-submission"] > .gin-details__sum` | 1 | 20 |
| 7 | `color-contrast` | 🟠 Serious | `summary[aria-controls="edit-workflow"] > .gin-details__summa` | 1 | 20 |
| 8 | `color-contrast` | 🟠 Serious | `summary[aria-controls="edit-language"] > .gin-details__summa` | 1 | 20 |
| 9 | `color-contrast` | 🟠 Serious | `summary[aria-controls="edit-display"] > .gin-details__summar` | 1 | 20 |
| 10 | `color-contrast` | 🟠 Serious | `p:nth-child(1) > a` | 2 | 11 |
| 11 | `color-contrast` | 🟠 Serious | `.feed-icon` | 1 | 8 |
| 12 | `color-contrast` | 🟠 Serious | `a[href="/"]` | 1 | 8 |
| 13 | `color-contrast` | 🟠 Serious | `a[href="/he"]` | 1 | 8 |
| 14 | `color-contrast` | 🟠 Serious | `#action-link-no-icon` | 1 | 8 |
| 15 | `color-contrast` | 🟠 Serious | `#action-link-no-icon--2` | 1 | 8 |
| 16 | `color-contrast` | 🟠 Serious | `#action-link-no-icon--3` | 1 | 8 |
| 17 | `color-contrast` | 🟠 Serious | `#action-link-no-icon--4` | 1 | 8 |
| 18 | `color-contrast` | 🟠 Serious | `#action-link-no-icon--5` | 1 | 8 |
| 19 | `color-contrast` | 🟠 Serious | `#action-link-no-icon--6` | 1 | 8 |
| 20 | `color-contrast` | 🟠 Serious | `#action-link-plus` | 1 | 8 |
| 21 | `color-contrast` | 🟠 Serious | `#action-link-plus--2` | 1 | 8 |
| 22 | `color-contrast` | 🟠 Serious | `#action-link-plus--3` | 1 | 8 |
| 23 | `color-contrast` | 🟠 Serious | `#action-link-plus--4` | 1 | 8 |
| 24 | `color-contrast` | 🟠 Serious | `#action-link-plus--5` | 1 | 8 |
| 25 | `color-contrast` | 🟠 Serious | `#action-link-plus--6` | 1 | 8 |
| 26 | `color-contrast` | 🟠 Serious | `#action-link-trash` | 1 | 8 |
| 27 | `color-contrast` | 🟠 Serious | `#action-link-trash--3` | 1 | 8 |
| 28 | `color-contrast` | 🟠 Serious | `#action-link-trash--5` | 1 | 8 |
| 29 | `color-contrast` | 🟠 Serious | `#action-link-cog` | 1 | 8 |
| 30 | `color-contrast` | 🟠 Serious | `#action-link-cog--2` | 1 | 8 |
| 31 | `color-contrast` | 🟠 Serious | `#action-link-cog--3` | 1 | 8 |
| 32 | `color-contrast` | 🟠 Serious | `#action-link-cog--4` | 1 | 8 |
| 33 | `color-contrast` | 🟠 Serious | `#action-link-cog--5` | 1 | 8 |
| 34 | `color-contrast` | 🟠 Serious | `#action-link-cog--6` | 1 | 8 |
| 35 | `color-contrast` | 🟠 Serious | `#action-link-ex` | 1 | 8 |
| 36 | `color-contrast` | 🟠 Serious | `#action-link-ex--2` | 1 | 8 |
| 37 | `color-contrast` | 🟠 Serious | `#action-link-ex--3` | 1 | 8 |
| 38 | `color-contrast` | 🟠 Serious | `#action-link-ex--4` | 1 | 8 |
| 39 | `color-contrast` | 🟠 Serious | `#action-link-ex--5` | 1 | 8 |
| 40 | `color-contrast` | 🟠 Serious | `#action-link-ex--6` | 1 | 8 |
| 41 | `color-contrast` | 🟠 Serious | `#action-link-checkmark` | 1 | 8 |
| 42 | `color-contrast` | 🟠 Serious | `#action-link-checkmark--2` | 1 | 8 |
| 43 | `color-contrast` | 🟠 Serious | `#action-link-checkmark--3` | 1 | 8 |
| 44 | `color-contrast` | 🟠 Serious | `#action-link-checkmark--4` | 1 | 8 |
| 45 | `color-contrast` | 🟠 Serious | `#action-link-checkmark--5` | 1 | 8 |
| 46 | `color-contrast` | 🟠 Serious | `#action-link-checkmark--6` | 1 | 8 |
| 47 | `color-contrast` | 🟠 Serious | `#action-link-show` | 1 | 8 |
| 48 | `color-contrast` | 🟠 Serious | `#action-link-show--2` | 1 | 8 |
| 49 | `color-contrast` | 🟠 Serious | `#action-link-show--3` | 1 | 8 |
| 50 | `color-contrast` | 🟠 Serious | `#action-link-show--4` | 1 | 8 |
| 51 | `color-contrast` | 🟠 Serious | `#action-link-show--5` | 1 | 8 |
| 52 | `color-contrast` | 🟠 Serious | `#action-link-show--6` | 1 | 8 |
| 53 | `color-contrast` | 🟠 Serious | `#action-link-hide` | 1 | 8 |
| 54 | `color-contrast` | 🟠 Serious | `#action-link-hide--2` | 1 | 8 |
| 55 | `color-contrast` | 🟠 Serious | `#action-link-hide--3` | 1 | 8 |
| 56 | `color-contrast` | 🟠 Serious | `#action-link-hide--4` | 1 | 8 |
| 57 | `color-contrast` | 🟠 Serious | `#action-link-hide--5` | 1 | 8 |
| 58 | `color-contrast` | 🟠 Serious | `#action-link-hide--6` | 1 | 8 |
| 59 | `color-contrast` | 🟠 Serious | `p:nth-child(2) > a[href$="block"]` | 1 | 8 |
| 60 | `color-contrast` | 🟠 Serious | `.language-link[aria-current="page"][href$="content"]` | 1 | 8 |
| 61 | `color-contrast` | 🟠 Serious | `p:nth-child(2) > a` | 1 | 8 |
| 62 | `color-contrast` | 🟠 Serious | `.compact-link > a` | 1 | 8 |
| 63 | `color-contrast` | 🟠 Serious | `input[value="Search"]` | 1 | 8 |
| 64 | `color-contrast` | 🟠 Serious | `a[href="/system/404"]` | 1 | 8 |
| 65 | `color-contrast` | 🟠 Serious | `a[href="/he/system/404"]` | 1 | 8 |
| 66 | `color-contrast` | 🟠 Serious | `input[value="Log in"]` | 1 | 8 |
| 67 | `color-contrast` | 🟠 Serious | `input[value="Submit"]` | 1 | 8 |
| 68 | `color-contrast` | 🟠 Serious | `a[href="/system/403"]` | 1 | 8 |
| 69 | `color-contrast` | 🟠 Serious | `a[href="/he/system/403"]` | 1 | 8 |
| 70 | `color-contrast` | 🟠 Serious | `#edit-save-continue` | 1 | 7 |
| 71 | `color-contrast` | 🟠 Serious | `.tabs__link.js-tabs-link[aria-current="page"]` | 1 | 6 |
| 72 | `color-contrast` | 🟠 Serious | `p:nth-child(2) > a[href$="updates"]` | 1 | 3 |
| 73 | `color-contrast` | 🟠 Serious | `a[href$="update.php"]` | 1 | 3 |
| 74 | `region` | 🟡 Moderate | `.top-bar__actions` | 3 | 264 |
| 75 | `heading-order` | 🟡 Moderate | `div[data-drupal-selector="edit-test-datelist"] > h4` | 1 | 88 |
| 76 | `region` | 🟡 Moderate | `#secondary-tabs-title` | 1 | 88 |

---

## Claro Theme Only

These violations exist in **Claro or Claro-Dark but not in Admin or Olivero**. Issues here belong to Drupal core's Claro administration theme.

| # | Rule | Impact | Selector | Pages | Node count |
|---|------|--------|----------|-------|------------|
| 1 | `label` | 🔴 Critical | `#edit-imagefile-file-limited-0-display` | 1 | 8 |
| 2 | `label` | 🔴 Critical | `#edit-imagefile-file-limited-1-display` | 1 | 8 |
| 3 | `label` | 🔴 Critical | `#edit-imagefile-file-limited-dis-0-display` | 1 | 8 |
| 4 | `label` | 🔴 Critical | `#edit-imagefile-file-limited-dis-1-display` | 1 | 8 |
| 5 | `label-title-only` | 🟠 Serious | `input[title="Select all rows in this table"]` | 3 | 24 |
| 6 | `color-contrast` | 🟠 Serious | `tr[data-drupal-selector="edit-blocks-claro-help"] > td:nth-c` | 1 | 8 |
| 7 | `color-contrast` | 🟠 Serious | `.block-disabled.draggable[data-once="claroTabledrag"]:nth-ch` | 1 | 8 |
| 8 | `color-contrast` | 🟠 Serious | `.region-hidden-message > td[colspan="9"]` | 1 | 8 |
| 9 | `tabindex` | 🟠 Serious | `#edit-submit` | 1 | 8 |
| 10 | `tabindex` | 🟠 Serious | `#edit-danger` | 1 | 8 |
| 11 | `tabindex` | 🟠 Serious | `#edit-cancel` | 1 | 8 |
| 12 | `tabindex` | 🟠 Serious | `#edit-submit--2` | 1 | 8 |
| 13 | `tabindex` | 🟠 Serious | `#edit-danger--2` | 1 | 8 |
| 14 | `tabindex` | 🟠 Serious | `#edit-cancel--2` | 1 | 8 |
| 15 | `label-title-only` | 🟠 Serious | `#edit-checkbox-hidden-label-value` | 1 | 8 |
| 16 | `label-title-only` | 🟠 Serious | `#edit-checkbox-hidden-label-disabled-value` | 1 | 8 |
| 17 | `landmark-contentinfo-is-top-level` | 🟡 Moderate | `.messages-list__item` | 1 | 8 |
| 18 | `heading-order` | 🟡 Moderate | `.form-datetime-wrapper.form-item:nth-child(4) > h4` | 1 | 8 |
| 19 | `heading-order` | 🟡 Moderate | `h4` | 1 | 8 |
| 20 | `heading-order` | 🟡 Moderate | `.layout-column.layout-column--half:nth-child(1) > .panel:nth` | 1 | 8 |
| 21 | `heading-order` | 🟡 Moderate | `#multitext-unlimited-values > thead > tr > .field-label[cols` | 1 | 8 |
| 22 | `heading-order` | 🟡 Moderate | `#presuf-formatted-m-values > thead > tr > .field-label[colsp` | 1 | 8 |
| 23 | `heading-order` | 🟡 Moderate | `#presuf-number-m-values > thead > tr > .field-label[colspan=` | 1 | 8 |
| 24 | `heading-order` | 🟡 Moderate | `#presuf-text-m-values > thead > tr > .field-label[colspan="2` | 1 | 8 |
| 25 | `heading-order` | 🟡 Moderate | `#edit-timestamp-wrapper > .form-datetime-wrapper.form-item >` | 1 | 8 |
| 26 | `landmark-contentinfo-is-top-level` | 🟡 Moderate | `.messages--status` | 1 | 8 |
| 27 | `landmark-contentinfo-is-top-level` | 🟡 Moderate | `.messages--info` | 1 | 8 |
| 28 | `landmark-contentinfo-is-top-level` | 🟡 Moderate | `.messages--custom` | 1 | 8 |
| 29 | `landmark-no-duplicate-contentinfo` | 🟡 Moderate | `.messages--status` | 1 | 8 |
| 30 | `landmark-unique` | 🟡 Moderate | `.messages--info` | 1 | 8 |
| 31 | `empty-heading` | 🔵 Minor | `h3:nth-child(3)` | 2 | 16 |
| 32 | `empty-heading` | 🔵 Minor | `h3:nth-child(4)` | 2 | 16 |
| 33 | `empty-heading` | 🔵 Minor | `h3:nth-child(5)` | 2 | 16 |
| 34 | `empty-heading` | 🔵 Minor | `h3:nth-child(6)` | 2 | 16 |
| 35 | `empty-table-header` | 🔵 Minor | `th:nth-child(2)` | 1 | 8 |
| 36 | `empty-table-header` | 🔵 Minor | `#multitext-unlimited-values > thead > tr > th:nth-child(2)` | 1 | 8 |
| 37 | `empty-table-header` | 🔵 Minor | `#multitext-unlimited-disabled-values > thead > tr > th:nth-c` | 1 | 8 |
| 38 | `empty-table-header` | 🔵 Minor | `#multitext-unlimited-required-values > thead > tr > th:nth-c` | 1 | 8 |
| 39 | `empty-table-header` | 🔵 Minor | `#multitext-unlimited-required-dis-values > thead > tr > th:n` | 1 | 8 |
| 40 | `empty-table-header` | 🔵 Minor | `#multitext-limited-values > thead > tr > th:nth-child(2)` | 1 | 8 |
| 41 | `empty-table-header` | 🔵 Minor | `#multitext-limited-disabled-values > thead > tr > th:nth-chi` | 1 | 8 |
| 42 | `empty-table-header` | 🔵 Minor | `#multitext-limited-required-values > thead > tr > th:nth-chi` | 1 | 8 |
| 43 | `empty-table-header` | 🔵 Minor | `#multitext-limited-required-dis-values > thead > tr > th:nth` | 1 | 8 |
| 44 | `empty-table-header` | 🔵 Minor | `#presuf-formatted-m-values > thead > tr > th:nth-child(2)` | 1 | 8 |
| 45 | `empty-table-header` | 🔵 Minor | `#presuf-formatted-pre-m-values > thead > tr > th:nth-child(2` | 1 | 8 |
| 46 | `empty-table-header` | 🔵 Minor | `#presuf-formatted-suf-m-values > thead > tr > th:nth-child(2` | 1 | 8 |
| 47 | `empty-table-header` | 🔵 Minor | `#presuf-formatted-pre-suf-m-values > thead > tr > th:nth-chi` | 1 | 8 |
| 48 | `empty-table-header` | 🔵 Minor | `#presuf-number-m-values > thead > tr > th:nth-child(2)` | 1 | 8 |
| 49 | `empty-table-header` | 🔵 Minor | `#presuf-number-pre-m-values > thead > tr > th:nth-child(2)` | 1 | 8 |
| 50 | `empty-table-header` | 🔵 Minor | `#presuf-number-suf-m-values > thead > tr > th:nth-child(2)` | 1 | 8 |
| 51 | `empty-table-header` | 🔵 Minor | `#presuf-number-pre-suf-m-values > thead > tr > th:nth-child(` | 1 | 8 |
| 52 | `empty-table-header` | 🔵 Minor | `#presuf-text-m-values > thead > tr > th:nth-child(2)` | 1 | 8 |
| 53 | `empty-table-header` | 🔵 Minor | `#presuf-text-pre-m-values > thead > tr > th:nth-child(2)` | 1 | 8 |
| 54 | `empty-table-header` | 🔵 Minor | `#presuf-text-suf-m-values > thead > tr > th:nth-child(2)` | 1 | 8 |
| 55 | `empty-table-header` | 🔵 Minor | `#presuf-text-pre-suf-m-values > thead > tr > th:nth-child(2)` | 1 | 8 |
| 56 | `empty-heading` | 🔵 Minor | `h3:nth-child(7)` | 1 | 8 |
| 57 | `empty-heading` | 🔵 Minor | `h3:nth-child(8)` | 1 | 8 |
| 58 | `empty-table-header` | 🔵 Minor | `#edit-table-empty > thead > tr > .select-all` | 1 | 8 |
| 59 | `empty-heading` | 🔵 Minor | `#block-claro-content > h3` | 1 | 8 |
| 60 | `empty-heading` | 🔵 Minor | `#block-claro-content > h3:nth-child(1)` | 1 | 8 |
| 61 | `empty-heading` | 🔵 Minor | `h3:nth-child(2)` | 1 | 8 |

---

## Admin and Claro (not Olivero)

These violations appear in admin-facing themes (Gin and/or Claro) but **not** in Olivero (the front-end theme). This makes them administration UI issues rather than front-end concerns, and the most relevant for the Admin theme accessibility report.

**7 selector/rule combinations found only in admin-facing themes.**

| # | Rule | Impact | Themes | Selector | Total nodes | Drupal core? |
|---|------|--------|--------|----------|-------------|--------------|
| 1 | `color-contrast` | 🟠 Serious | `admin, claro-dark, claro` | `#edit-submit` | 88 | ✅ Yes (Claro) |
| 2 | `summary-name` | 🟠 Serious | `admin, claro-dark, claro` | `#edit-modules-nyan-cat-enable-description > .module-lis` | 24 | ✅ Yes (Claro) |
| 3 | `landmark-contentinfo-is-top-level` | 🟡 Moderate | `admin, claro-dark, claro` | `.messages--error` | 153 | ✅ Yes (Claro) |
| 4 | `landmark-contentinfo-is-top-level` | 🟡 Moderate | `admin, claro-dark, claro` | `.messages--warning` | 153 | ✅ Yes (Claro) |
| 5 | `landmark-no-duplicate-contentinfo` | 🟡 Moderate | `admin, claro-dark, claro` | `.messages--error` | 145 | ✅ Yes (Claro) |
| 6 | `heading-order` | 🟡 Moderate | `admin, claro-dark, claro` | `#pagination-heading` | 96 | ✅ Yes (Claro) |
| 7 | `empty-heading` | 🔵 Minor | `admin, claro-dark, claro` | `h1` | 96 | ✅ Yes (Claro) |

### Admin + Claro Details

#### AC-1: `color-contrast` — `#edit-submit`

- **Impact:** 🟠 Serious
- **Themes affected:** `admin`, `claro-dark`, `claro`
- **In Drupal core Claro:** Yes
- **WCAG:** 1.4.3 Contrast (Minimum) (AA)
- **Axe docs:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
- **Total violation nodes:** 88
- **Paths:** `/admin/appearance`, `/admin/content`, `/admin/form_style`, `/admin/modules`, `/admin/structure/block` +6 more
- **HTML:**

  ```html
  <input data-drupal-selector="edit-submit" type="submit" id="edit-submit" name="op" value="Save configuration" class="button button--primary js-form-submit form-submit">
  ```
- **Drupal issue search:** https://www.drupal.org/project/issues/search?text=color-contrast%20%23edit-submit&projects=drupal&status[]=Open&issue_tags=Accessibility

#### AC-2: `summary-name` — `#edit-modules-nyan-cat-enable-description > .module-list__module-summary`

- **Impact:** 🟠 Serious
- **Themes affected:** `admin`, `claro-dark`, `claro`
- **In Drupal core Claro:** Yes
- **WCAG:** 4.1.2 Name, Role, Value (A)
- **Axe docs:** https://dequeuniversity.com/rules/axe/4.11/summary-name
- **Total violation nodes:** 24
- **Paths:** `/admin/modules`
- **HTML:**

  ```html
  <summary aria-controls="edit-modules-nyan-cat-enable-description" role="button" aria-expanded="false" class="gin-details__summary module-list__module-summary"><span class="text module-description"></s
  ```
- **Drupal issue search:** https://www.drupal.org/project/issues/search?text=summary-name%20%23edit-modules-nyan-cat-enable-description%20%3E%20.mo&projects=drupal&status[]=Open&issue_tags=Accessibility

#### AC-3: `landmark-contentinfo-is-top-level` — `.messages--error`

- **Impact:** 🟡 Moderate
- **Themes affected:** `admin`, `claro-dark`, `claro`
- **In Drupal core Claro:** Yes
- **WCAG:** 1.3.6 Identify Purpose (AAA)
- **Axe docs:** https://dequeuniversity.com/rules/axe/4.11/landmark-contentinfo-is-top-level
- **Total violation nodes:** 153
- **Paths:** `/admin/appearance`, `/admin/modules`, `/message`
- **HTML:**

  ```html
  <div role="contentinfo" aria-labelledby="message-error-title" class="messages-list__item messages messages--error">
  ```
- **Drupal issue search:** https://www.drupal.org/project/issues/search?text=landmark-contentinfo-is-top-level%20.messages--error&projects=drupal&status[]=Open&issue_tags=Accessibility

#### AC-4: `landmark-contentinfo-is-top-level` — `.messages--warning`

- **Impact:** 🟡 Moderate
- **Themes affected:** `admin`, `claro-dark`, `claro`
- **In Drupal core Claro:** Yes
- **WCAG:** 1.3.6 Identify Purpose (AAA)
- **Axe docs:** https://dequeuniversity.com/rules/axe/4.11/landmark-contentinfo-is-top-level
- **Total violation nodes:** 153
- **Paths:** `/admin/appearance`, `/admin/modules`, `/message`
- **HTML:**

  ```html
  <div role="contentinfo" aria-labelledby="message-warning-title" class="messages-list__item messages messages--warning">
  ```
- **Drupal issue search:** https://www.drupal.org/project/issues/search?text=landmark-contentinfo-is-top-level%20.messages--warning&projects=drupal&status[]=Open&issue_tags=Accessibility

#### AC-5: `landmark-no-duplicate-contentinfo` — `.messages--error`

- **Impact:** 🟡 Moderate
- **Themes affected:** `admin`, `claro-dark`, `claro`
- **In Drupal core Claro:** Yes
- **WCAG:** 1.3.6 Identify Purpose (AAA)
- **Axe docs:** https://dequeuniversity.com/rules/axe/4.11/landmark-no-duplicate-contentinfo
- **Total violation nodes:** 145
- **Paths:** `/admin/appearance`, `/admin/modules`
- **HTML:**

  ```html
  <div role="contentinfo" aria-labelledby="message-error-title" class="messages-list__item messages messages--error">
  ```
- **Drupal issue search:** https://www.drupal.org/project/issues/search?text=landmark-no-duplicate-contentinfo%20.messages--error&projects=drupal&status[]=Open&issue_tags=Accessibility

#### AC-6: `heading-order` — `#pagination-heading`

- **Impact:** 🟡 Moderate
- **Themes affected:** `admin`, `claro-dark`, `claro`
- **In Drupal core Claro:** Yes
- **WCAG:** 1.3.1 Info and Relationships (A)
- **Axe docs:** https://dequeuniversity.com/rules/axe/4.11/heading-order
- **Total violation nodes:** 96
- **Paths:** `/admin/content`
- **HTML:**

  ```html
  <h4 id="pagination-heading" class="visually-hidden">Pagination</h4>
  ```
- **Drupal issue search:** https://www.drupal.org/project/issues/search?text=heading-order%20%23pagination-heading&projects=drupal&status[]=Open&issue_tags=Accessibility

#### AC-7: `empty-heading` — `h1`

- **Impact:** 🔵 Minor
- **Themes affected:** `admin`, `claro-dark`, `claro`
- **In Drupal core Claro:** Yes
- **WCAG:** 2.4.6 Headings and Labels (AA)
- **Axe docs:** https://dequeuniversity.com/rules/axe/4.11/empty-heading
- **Total violation nodes:** 96
- **Paths:** `/`
- **HTML:**

  ```html
  <h1 class="page-title"></h1>
  ```
- **Drupal issue search:** https://www.drupal.org/project/issues/search?text=empty-heading%20h1&projects=drupal&status[]=Open&issue_tags=Accessibility

---

## Master Priority List

Composite score = `impactWeight × log₂(1 + uniquePathCount)`.  
Impact weights: Critical=4, Serious=3, Moderate=2, Minor=1.  
This ranks issues that are both severe **and** widespread highest.

| Rank | Score | Rule | Impact | Unique paths | Nodes | Admin/Claro? | RTL effect | Themes |
|------|-------|------|--------|-------------|-------|-------------|-----------|--------|
| 1 | 12.51 | [`color-contrast`](https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright) | 🟠 Serious | 17 | 131 | ✅ Admin/Claro | — | `admin` |
| 2 | 12.262 | [`color-contrast`](https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright) | 🟠 Serious | 16 | 123 | ✅ Admin/Claro | — | `admin` |
| 3 | 11.51 | [`region`](https://dequeuniversity.com/rules/axe/4.11/region?application=playwright) | 🟡 Moderate | 53 | 2193 | 🌐 All | — | `admin, claro-dark, claro…` |
| 4 | 10.755 | [`color-contrast`](https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright) | 🟠 Serious | 11 | 88 | ✅ Admin/Claro | — | `admin, claro-dark, claro` |
| 5 | 6 | [`region`](https://dequeuniversity.com/rules/axe/4.11/region?application=playwright) | 🟡 Moderate | 7 | 585 | 🌐 All | — | `admin, olivero-dark, olivero` |
| 6 | 6 | [`color-contrast`](https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright) | 🟠 Serious | 3 | 21 | ✅ Admin/Claro | — | `admin` |
| 7 | 6 | [`label-title-only`](https://dequeuniversity.com/rules/axe/4.11/label-title-only?application=playwright) | 🟠 Serious | 3 | 24 | ✅ Admin/Claro | — | `claro-dark, claro` |
| 8 | 4.755 | [`color-contrast`](https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright) | 🟠 Serious | 2 | 11 | ✅ Admin/Claro | — | `admin` |
| 9 | 4 | [`landmark-contentinfo-is-top-level`](https://dequeuniversity.com/rules/axe/4.11/landmark-contentinfo-is-top-level?application=playwright) | 🟡 Moderate | 3 | 153 | ✅ Admin/Claro | — | `admin, claro-dark, claro` |
| 10 | 4 | [`landmark-contentinfo-is-top-level`](https://dequeuniversity.com/rules/axe/4.11/landmark-contentinfo-is-top-level?application=playwright) | 🟡 Moderate | 3 | 153 | ✅ Admin/Claro | — | `admin, claro-dark, claro` |
| 11 | 4 | [`region`](https://dequeuniversity.com/rules/axe/4.11/region?application=playwright) | 🟡 Moderate | 3 | 264 | ✅ Admin/Claro | — | `admin` |
| 12 | 4 | [`label`](https://dequeuniversity.com/rules/axe/4.11/label?application=playwright) | 🔴 Critical | 1 | 8 | ✅ Admin/Claro | — | `claro-dark, claro` |
| 13 | 4 | [`label`](https://dequeuniversity.com/rules/axe/4.11/label?application=playwright) | 🔴 Critical | 1 | 8 | ✅ Admin/Claro | — | `claro-dark, claro` |
| 14 | 4 | [`label`](https://dequeuniversity.com/rules/axe/4.11/label?application=playwright) | 🔴 Critical | 1 | 8 | ✅ Admin/Claro | — | `claro-dark, claro` |
| 15 | 4 | [`label`](https://dequeuniversity.com/rules/axe/4.11/label?application=playwright) | 🔴 Critical | 1 | 8 | ✅ Admin/Claro | — | `claro-dark, claro` |
| 16 | 3.17 | [`landmark-no-duplicate-contentinfo`](https://dequeuniversity.com/rules/axe/4.11/landmark-no-duplicate-contentinfo?application=playwright) | 🟡 Moderate | 2 | 145 | ✅ Admin/Claro | — | `admin, claro-dark, claro` |
| 17 | 3 | [`color-contrast`](https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright) | 🟠 Serious | 1 | 8 | ✅ Admin/Claro | — | `admin` |
| 18 | 3 | [`color-contrast`](https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright) | 🟠 Serious | 1 | 8 | ✅ Admin/Claro | — | `admin` |
| 19 | 3 | [`color-contrast`](https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright) | 🟠 Serious | 1 | 8 | ✅ Admin/Claro | — | `admin` |
| 20 | 3 | [`color-contrast`](https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright) | 🟠 Serious | 1 | 8 | ✅ Admin/Claro | — | `admin` |
| 21 | 3 | [`color-contrast`](https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright) | 🟠 Serious | 1 | 8 | ✅ Admin/Claro | — | `admin` |
| 22 | 3 | [`color-contrast`](https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright) | 🟠 Serious | 1 | 8 | ✅ Admin/Claro | — | `admin` |
| 23 | 3 | [`color-contrast`](https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright) | 🟠 Serious | 1 | 8 | ✅ Admin/Claro | — | `admin` |
| 24 | 3 | [`color-contrast`](https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright) | 🟠 Serious | 1 | 8 | ✅ Admin/Claro | — | `admin` |
| 25 | 3 | [`color-contrast`](https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright) | 🟠 Serious | 1 | 8 | ✅ Admin/Claro | — | `admin` |
| 26 | 3 | [`color-contrast`](https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright) | 🟠 Serious | 1 | 8 | ✅ Admin/Claro | — | `admin` |
| 27 | 3 | [`color-contrast`](https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright) | 🟠 Serious | 1 | 8 | ✅ Admin/Claro | — | `admin` |
| 28 | 3 | [`color-contrast`](https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright) | 🟠 Serious | 1 | 8 | ✅ Admin/Claro | — | `admin` |
| 29 | 3 | [`color-contrast`](https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright) | 🟠 Serious | 1 | 8 | ✅ Admin/Claro | — | `admin` |
| 30 | 3 | [`color-contrast`](https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright) | 🟠 Serious | 1 | 8 | ✅ Admin/Claro | — | `admin` |

---

## Drupal Issue Queue

Each issue below links directly to a filtered Drupal.org issue queue search.
When filing or updating issues, include the pattern ID (DRU-XXXXXXXX from bugs-latest.json),
the axe rule ID, the WCAG criterion, and the HTML snippet from this report.

### Suggested search links by rule

- **[`color-contrast`](https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright)** — WCAG 1.4.3 Contrast (Minimum) (AA)  
  [Search Drupal issue queue](https://www.drupal.org/project/issues/search?text=color-contrast&projects=drupal&status[]=Open&issue_tags=Accessibility)

- **[`region`](https://dequeuniversity.com/rules/axe/4.11/region?application=playwright)** — WCAG 1.3.6 Identify Purpose (AAA)  
  [Search Drupal issue queue](https://www.drupal.org/project/issues/search?text=region&projects=drupal&status[]=Open&issue_tags=Accessibility)

- **[`label-title-only`](https://dequeuniversity.com/rules/axe/4.11/label-title-only?application=playwright)** — WCAG 1.3.1 Info and Relationships (A)  
  [Search Drupal issue queue](https://www.drupal.org/project/issues/search?text=label-title-only&projects=drupal&status[]=Open&issue_tags=Accessibility)

- **[`landmark-contentinfo-is-top-level`](https://dequeuniversity.com/rules/axe/4.11/landmark-contentinfo-is-top-level?application=playwright)** — WCAG 1.3.6 Identify Purpose (AAA)  
  [Search Drupal issue queue](https://www.drupal.org/project/issues/search?text=landmark-contentinfo-is-top-level&projects=drupal&status[]=Open&issue_tags=Accessibility)

- **[`label`](https://dequeuniversity.com/rules/axe/4.11/label?application=playwright)** — WCAG 1.3.1 Info and Relationships (A)  
  [Search Drupal issue queue](https://www.drupal.org/project/issues/search?text=label&projects=drupal&status[]=Open&issue_tags=Accessibility)

- **[`landmark-no-duplicate-contentinfo`](https://dequeuniversity.com/rules/axe/4.11/landmark-no-duplicate-contentinfo?application=playwright)** — WCAG 1.3.6 Identify Purpose (AAA)  
  [Search Drupal issue queue](https://www.drupal.org/project/issues/search?text=landmark-no-duplicate-contentinfo&projects=drupal&status[]=Open&issue_tags=Accessibility)

### RTL-specific issues — Hebrew/RTL component in Drupal core

RTL-exclusive issues should be filed/searched against the **Language** or **RTL** tags in addition to Accessibility:

- [Search for RTL + Accessibility issues](https://www.drupal.org/project/issues/search?text=RTL+accessibility&projects=drupal&status[]=Open&issue_tags=Accessibility)
- [Search for Hebrew language issues](https://www.drupal.org/project/issues/search?text=Hebrew+accessibility&projects=drupal&status[]=Open)

### Admin/Gin theme issues

The Admin theme in this test matrix corresponds to the **Gin** theme. Issues specific to Gin should be searched/filed against the Gin project:

- [Gin project issue queue (Accessibility)](https://www.drupal.org/project/issues/gin?text=&status[]=Open&issue_tags=Accessibility)
- [Claro theme issues in Drupal core](https://www.drupal.org/project/issues/search?text=claro+accessibility&projects=drupal&status[]=Open&issue_tags=Accessibility)
