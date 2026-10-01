# Accessibility Report: Admin / Gin Theme

Generated: 2026-05-06  
Crawl records for this theme group: **1713**

---

## About Admin / Gin

The **Gin administration theme** (`admin`) — a contributed theme for Drupal that replaces the default toolbar and admin UI. Issues here should be reported to the [Gin project issue queue](https://www.drupal.org/project/issues/gin?status[]=Open&issue_tags=Accessibility).

**Issue queue:** [Gin project issue queue](https://www.drupal.org/project/issues/gin?status[]=Open&issue_tags=Accessibility)

---

## Summary by Rule

Composite score = `impactWeight × log₂(1 + uniquePageCount)`. Higher = higher priority.

| Rank | Score | Rule | Impact | WCAG | Unique pages | Total nodes | Selectors |
|------|-------|------|--------|------|-------------|-------------|-----------|
| 1 | 13.177 | [`color-contrast`](https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright) | 🟠 Serious | 1.4.3 (AA) | 20 | 929 | 72 |
| 2 | 8.785 | [`region`](https://dequeuniversity.com/rules/axe/4.11/region?application=playwright) | 🟡 Moderate | 1.3.6 (AAA) | 20 | 2634 | 4 |
| 3 | 3.17 | [`landmark-contentinfo-is-top-level`](https://dequeuniversity.com/rules/axe/4.11/landmark-contentinfo-is-top-level?application=playwright) | 🟡 Moderate | 1.3.6 (AAA) | 2 | 258 | 2 |
| 4 | 3.17 | [`heading-order`](https://dequeuniversity.com/rules/axe/4.11/heading-order?application=playwright) | 🟡 Moderate | 1.3.1 (A) | 2 | 176 | 2 |
| 5 | 3.17 | [`landmark-no-duplicate-contentinfo`](https://dequeuniversity.com/rules/axe/4.11/landmark-no-duplicate-contentinfo?application=playwright) | 🟡 Moderate | 1.3.6 (AAA) | 2 | 129 | 1 |
| 6 | 3 | [`label-title-only`](https://dequeuniversity.com/rules/axe/4.11/label-title-only?application=playwright) | 🟠 Serious | 1.3.1 (A) | 1 | 176 | 2 |
| 7 | 3 | [`summary-name`](https://dequeuniversity.com/rules/axe/4.11/summary-name?application=playwright) | 🟠 Serious | 4.1.2 (A) | 1 | 22 | 1 |
| 8 | 1 | [`empty-heading`](https://dequeuniversity.com/rules/axe/4.11/empty-heading?application=playwright) | 🔵 Minor | 2.4.6 (AA) | 1 | 88 | 1 |

---

## Rule Details

1. [`color-contrast`](#rule-color-contrast)  
2. [`region`](#rule-region)  
3. [`landmark-contentinfo-is-top-level`](#rule-landmark-contentinfo-is-top-level)  
4. [`heading-order`](#rule-heading-order)  
5. [`landmark-no-duplicate-contentinfo`](#rule-landmark-no-duplicate-contentinfo)  
6. [`label-title-only`](#rule-label-title-only)  
7. [`summary-name`](#rule-summary-name)  
8. [`empty-heading`](#rule-empty-heading)

---

### `color-contrast` {#rule-color-contrast}

**Impact:** 🟠 Serious  
**WCAG:** 1.4.3 — Contrast (Minimum) (Level AA)  
**Axe docs:** https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright  
**Unique pages affected:** 20  
**Total violation nodes:** 929  
**Composite score:** 13.177  

> Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

#### Failing selectors

| Selector | Themes | Pages affected | Nodes |
|----------|--------|---------------|-------|
| `a[hreflang="he"]` | admin | 17 | 131 |
| `a[hreflang="en"]` | admin | 16 | 123 |
| `#edit-submit` | admin | 10 | 72 |
| `.button--action` | admin | 3 | 21 |
| `p:nth-child(1) > a` | admin | 2 | 11 |
| `summary[aria-controls="edit-submission"] > .gin-details__summary-summary` | admin | 1 | 20 |
| `summary[aria-controls="edit-workflow"] > .gin-details__summary-summary` | admin | 1 | 20 |
| `summary[aria-controls="edit-language"] > .gin-details__summary-summary` | admin | 1 | 20 |
| `summary[aria-controls="edit-display"] > .gin-details__summary-summary` | admin | 1 | 20 |
| `.feed-icon` | admin | 1 | 8 |
| `a[href="/"]` | admin | 1 | 8 |
| `a[href="/he"]` | admin | 1 | 8 |
| `#action-link-no-icon` | admin | 1 | 8 |
| `#action-link-no-icon--2` | admin | 1 | 8 |
| `#action-link-no-icon--3` | admin | 1 | 8 |
| `#action-link-no-icon--4` | admin | 1 | 8 |
| `#action-link-no-icon--5` | admin | 1 | 8 |
| `#action-link-no-icon--6` | admin | 1 | 8 |
| `#action-link-plus` | admin | 1 | 8 |
| `#action-link-plus--2` | admin | 1 | 8 |
| `#action-link-plus--3` | admin | 1 | 8 |
| `#action-link-plus--4` | admin | 1 | 8 |
| `#action-link-plus--5` | admin | 1 | 8 |
| `#action-link-plus--6` | admin | 1 | 8 |
| `#action-link-trash` | admin | 1 | 8 |
| `#action-link-trash--3` | admin | 1 | 8 |
| `#action-link-trash--5` | admin | 1 | 8 |
| `#action-link-cog` | admin | 1 | 8 |
| `#action-link-cog--2` | admin | 1 | 8 |
| `#action-link-cog--3` | admin | 1 | 8 |
| `#action-link-cog--4` | admin | 1 | 8 |
| `#action-link-cog--5` | admin | 1 | 8 |
| `#action-link-cog--6` | admin | 1 | 8 |
| `#action-link-ex` | admin | 1 | 8 |
| `#action-link-ex--2` | admin | 1 | 8 |
| `#action-link-ex--3` | admin | 1 | 8 |
| `#action-link-ex--4` | admin | 1 | 8 |
| `#action-link-ex--5` | admin | 1 | 8 |
| `#action-link-ex--6` | admin | 1 | 8 |
| `#action-link-checkmark` | admin | 1 | 8 |
| `#action-link-checkmark--2` | admin | 1 | 8 |
| `#action-link-checkmark--3` | admin | 1 | 8 |
| `#action-link-checkmark--4` | admin | 1 | 8 |
| `#action-link-checkmark--5` | admin | 1 | 8 |
| `#action-link-checkmark--6` | admin | 1 | 8 |
| `#action-link-show` | admin | 1 | 8 |
| `#action-link-show--2` | admin | 1 | 8 |
| `#action-link-show--3` | admin | 1 | 8 |
| `#action-link-show--4` | admin | 1 | 8 |
| `#action-link-show--5` | admin | 1 | 8 |
| `#action-link-show--6` | admin | 1 | 8 |
| `#action-link-hide` | admin | 1 | 8 |
| `#action-link-hide--2` | admin | 1 | 8 |
| `#action-link-hide--3` | admin | 1 | 8 |
| `#action-link-hide--4` | admin | 1 | 8 |
| `#action-link-hide--5` | admin | 1 | 8 |
| `#action-link-hide--6` | admin | 1 | 8 |
| `p:nth-child(2) > a[href$="block"]` | admin | 1 | 8 |
| `.language-link[aria-current="page"][href$="content"]` | admin | 1 | 8 |
| `p:nth-child(2) > a` | admin | 1 | 8 |
| `.compact-link > a` | admin | 1 | 8 |
| `input[value="Search"]` | admin | 1 | 8 |
| `a[href="/system/404"]` | admin | 1 | 8 |
| `a[href="/he/system/404"]` | admin | 1 | 8 |
| `input[value="Log in"]` | admin | 1 | 8 |
| `input[value="Submit"]` | admin | 1 | 8 |
| `a[href="/system/403"]` | admin | 1 | 8 |
| `a[href="/he/system/403"]` | admin | 1 | 8 |
| `#edit-save-continue` | admin | 1 | 7 |
| `.tabs__link.js-tabs-link[aria-current="page"]` | admin | 1 | 6 |
| `p:nth-child(2) > a[href$="updates"]` | admin | 1 | 3 |
| `a[href$="update.php"]` | admin | 1 | 3 |

#### Details

**1. Selector:** `a[hreflang="he"]`

_Element has insufficient color contrast of 4.38 (foreground color: #c55228, background color: #fefaf8, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1_

```html
<a href="/he/action-link" class="language-link" hreflang="he" data-drupal-link-system-path="action-link">Hebrew</a>
```

Pages: `/action-link`, `/admin`, `/admin/appearance`, `/admin/content`, `/admin/form_style`, `/admin/modules`, `/admin/structure`, `/admin/structure/block` +9 more

**2. Selector:** `a[hreflang="en"]`

_Element has insufficient color contrast of 4.38 (foreground color: #c55228, background color: #fefaf8, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1_

```html
<a href="/action-link" class="language-link is-active" hreflang="en" data-drupal-link-system-path="action-link" aria-current="page">English</a>
```

Pages: `/action-link`, `/admin`, `/admin/appearance`, `/admin/form_style`, `/admin/modules`, `/admin/structure`, `/admin/structure/block`, `/admin/structure/taxonomy` +8 more

**3. Selector:** `#edit-submit`

_Element has insufficient color contrast of 3.73 (foreground color: #131313, background color: #956707, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1_

```html
<input data-drupal-selector="edit-submit" type="submit" id="edit-submit" name="op" value="Save configuration" class="button button--primary js-form-submit form-submit">
```

Pages: `/admin/appearance`, `/admin/content`, `/admin/form_style`, `/admin/modules`, `/admin/structure/block`, `/admin/structure/taxonomy`, `/admin/structure/taxonomy/add`, `/admin/structure/types/add` +2 more

**4. Selector:** `.button--action`

_Element has insufficient color contrast of 3.68 (foreground color: #141414, background color: #946708, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1_

```html
<a href="/node/add" class="button button--action button--primary" data-drupal-link-system-path="node/add">Add content</a>
```

Pages: `/admin/content`, `/admin/structure/taxonomy`, `/admin/structure/types`

**5. Selector:** `p:nth-child(1) > a`

_Element has insufficient color contrast of 4.38 (foreground color: #c55228, background color: #fefaf8, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1_

```html
<a href="https://www.drupal.org/project/project_theme">themes</a>
```

Pages: `/admin/appearance`, `/admin/modules`

**Search Drupal issue queue:** [color-contrast + Accessibility](https://www.drupal.org/project/issues/search?text=color-contrast&projects=drupal&status[]=Open&issue_tags=Accessibility)

---

### `region` {#rule-region}

**Impact:** 🟡 Moderate  
**WCAG:** 1.3.6 — Identify Purpose (Level AAA)  
**Axe docs:** https://dequeuniversity.com/rules/axe/4.11/region?application=playwright  
**Unique pages affected:** 20  
**Total violation nodes:** 2634  
**Composite score:** 8.785  

> Ensure all page content is contained by landmarks

#### Failing selectors

| Selector | Themes | Pages affected | Nodes |
|----------|--------|---------------|-------|
| `.themeswitcher-form__form-item` | admin | 20 | 1713 |
| `#primary-tabs-title` | admin | 7 | 569 |
| `.top-bar__actions` | admin | 3 | 264 |
| `#secondary-tabs-title` | admin | 1 | 88 |

#### Details

**1. Selector:** `.themeswitcher-form__form-item`

_Some page content is not contained by landmarks_

```html
<div class="themeswitcher-form__form-item js-form-item form-item js-form-type-select form-type--select js-form-item-preferred-theme form-item--preferred-theme">
```

Pages: `/`, `/action-link`, `/admin`, `/admin/appearance`, `/admin/content`, `/admin/form_style`, `/admin/modules`, `/admin/structure` +12 more

**2. Selector:** `#primary-tabs-title`

_Some page content is not contained by landmarks_

```html
<h2 id="primary-tabs-title" class="visually-hidden">Primary tabs</h2>
```

Pages: `/admin`, `/admin/appearance`, `/admin/content`, `/admin/modules`, `/admin/structure/types`, `/user/login`, `/user/password`

**3. Selector:** `.top-bar__actions`

_Some page content is not contained by landmarks_

```html
<div class="top-bar__actions">
```

Pages: `/admin/content`, `/admin/structure/taxonomy`, `/admin/structure/types`

**4. Selector:** `#secondary-tabs-title`

_Some page content is not contained by landmarks_

```html
<h2 id="secondary-tabs-title" class="visually-hidden">Secondary tabs</h2>
```

Pages: `/admin/structure/block`

**Search Drupal issue queue:** [region + Accessibility](https://www.drupal.org/project/issues/search?text=region&projects=drupal&status[]=Open&issue_tags=Accessibility)

---

### `landmark-contentinfo-is-top-level` {#rule-landmark-contentinfo-is-top-level}

**Impact:** 🟡 Moderate  
**WCAG:** 1.3.6 — Identify Purpose (Level AAA)  
**Axe docs:** https://dequeuniversity.com/rules/axe/4.11/landmark-contentinfo-is-top-level?application=playwright  
**Unique pages affected:** 2  
**Total violation nodes:** 258  
**Composite score:** 3.17  

> Ensure the contentinfo landmark is at top level

#### Failing selectors

| Selector | Themes | Pages affected | Nodes |
|----------|--------|---------------|-------|
| `.messages--error` | admin | 2 | 129 |
| `.messages--warning` | admin | 2 | 129 |

#### Details

**1. Selector:** `.messages--error`

_The contentinfo landmark is contained in another landmark._

```html
<div role="contentinfo" aria-labelledby="message-error-title" class="messages-list__item messages messages--error">
```

Pages: `/admin/appearance`, `/admin/modules`

**2. Selector:** `.messages--warning`

_The contentinfo landmark is contained in another landmark._

```html
<div role="contentinfo" aria-labelledby="message-warning-title" class="messages-list__item messages messages--warning">
```

Pages: `/admin/appearance`, `/admin/modules`

**Search Drupal issue queue:** [landmark-contentinfo-is-top-level + Accessibility](https://www.drupal.org/project/issues/search?text=landmark-contentinfo-is-top-level&projects=drupal&status[]=Open&issue_tags=Accessibility)

---

### `heading-order` {#rule-heading-order}

**Impact:** 🟡 Moderate  
**WCAG:** 1.3.1 — Info and Relationships (Level A)  
**Axe docs:** https://dequeuniversity.com/rules/axe/4.11/heading-order?application=playwright  
**Unique pages affected:** 2  
**Total violation nodes:** 176  
**Composite score:** 3.17  

> Ensure the order of headings is semantically correct

#### Failing selectors

| Selector | Themes | Pages affected | Nodes |
|----------|--------|---------------|-------|
| `#pagination-heading` | admin | 1 | 88 |
| `div[data-drupal-selector="edit-test-datelist"] > h4` | admin | 1 | 88 |

#### Details

**1. Selector:** `#pagination-heading`

_Heading order invalid_

```html
<h4 id="pagination-heading" class="visually-hidden">Pagination</h4>
```

Pages: `/admin/content`

**2. Selector:** `div[data-drupal-selector="edit-test-datelist"] > h4`

_Heading order invalid_

```html
<h4 class="form-item__label">Datelist</h4>
```

Pages: `/admin/form_style`

**Search Drupal issue queue:** [heading-order + Accessibility](https://www.drupal.org/project/issues/search?text=heading-order&projects=drupal&status[]=Open&issue_tags=Accessibility)

---

### `landmark-no-duplicate-contentinfo` {#rule-landmark-no-duplicate-contentinfo}

**Impact:** 🟡 Moderate  
**WCAG:** 1.3.6 — Identify Purpose (Level AAA)  
**Axe docs:** https://dequeuniversity.com/rules/axe/4.11/landmark-no-duplicate-contentinfo?application=playwright  
**Unique pages affected:** 2  
**Total violation nodes:** 129  
**Composite score:** 3.17  

> Ensure the document has at most one contentinfo landmark

#### Failing selectors

| Selector | Themes | Pages affected | Nodes |
|----------|--------|---------------|-------|
| `.messages--error` | admin | 2 | 129 |

#### Details

**1. Selector:** `.messages--error`

_Document has more than one contentinfo landmark_

```html
<div role="contentinfo" aria-labelledby="message-error-title" class="messages-list__item messages messages--error">
```

Pages: `/admin/appearance`, `/admin/modules`

**Search Drupal issue queue:** [landmark-no-duplicate-contentinfo + Accessibility](https://www.drupal.org/project/issues/search?text=landmark-no-duplicate-contentinfo&projects=drupal&status[]=Open&issue_tags=Accessibility)

---

### `label-title-only` {#rule-label-title-only}

**Impact:** 🟠 Serious  
**WCAG:** 1.3.1 — Info and Relationships (Level A)  
**Axe docs:** https://dequeuniversity.com/rules/axe/4.11/label-title-only?application=playwright  
**Unique pages affected:** 1  
**Total violation nodes:** 176  
**Composite score:** 3  

> Ensure that every form element has a visible label and is not solely labeled using hidden labels, or the title or aria-describedby attributes

#### Failing selectors

| Selector | Themes | Pages affected | Nodes |
|----------|--------|---------------|-------|
| `.gin--sticky-table-header > thead > tr > .select-all.gin--sticky-bulk-select > .` | admin | 1 | 88 |
| `.views-table > thead > tr > .select-all.gin--sticky-bulk-select > .form-checkbox` | admin | 1 | 88 |

#### Details

**1. Selector:** `.gin--sticky-table-header > thead > tr > .select-all.gin--sticky-bulk-select > .form-checkbox.form-b`

_Only title used to generate label for form element_

```html
<input type="checkbox" class="form-checkbox form-boolean form-boolean--type-checkbox" title="Select all rows in this table">
```

Pages: `/admin/content`

**2. Selector:** `.views-table > thead > tr > .select-all.gin--sticky-bulk-select > .form-checkbox.form-boolean[title=`

_Only title used to generate label for form element_

```html
<input type="checkbox" class="form-checkbox form-boolean form-boolean--type-checkbox" title="Select all rows in this table">
```

Pages: `/admin/content`

**Search Drupal issue queue:** [label-title-only + Accessibility](https://www.drupal.org/project/issues/search?text=label-title-only&projects=drupal&status[]=Open&issue_tags=Accessibility)

---

### `summary-name` {#rule-summary-name}

**Impact:** 🟠 Serious  
**WCAG:** 4.1.2 — Name, Role, Value (Level A)  
**Axe docs:** https://dequeuniversity.com/rules/axe/4.11/summary-name?application=playwright  
**Unique pages affected:** 1  
**Total violation nodes:** 22  
**Composite score:** 3  

> Ensure summary elements have discernible text

#### Failing selectors

| Selector | Themes | Pages affected | Nodes |
|----------|--------|---------------|-------|
| `#edit-modules-nyan-cat-enable-description > .module-list__module-summary` | admin | 1 | 22 |

#### Details

**1. Selector:** `#edit-modules-nyan-cat-enable-description > .module-list__module-summary`

_Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute_

```html
<summary aria-controls="edit-modules-nyan-cat-enable-description" role="button" aria-expanded="false" class="gin-details__summary module-list__module-summary"><span class="text module-description"></span><span class="gin-details__summary-summary"></span></summary>
```

Pages: `/admin/modules`

**Search Drupal issue queue:** [summary-name + Accessibility](https://www.drupal.org/project/issues/search?text=summary-name&projects=drupal&status[]=Open&issue_tags=Accessibility)

---

### `empty-heading` {#rule-empty-heading}

**Impact:** 🔵 Minor  
**WCAG:** 2.4.6 — Headings and Labels (Level AA)  
**Axe docs:** https://dequeuniversity.com/rules/axe/4.11/empty-heading?application=playwright  
**Unique pages affected:** 1  
**Total violation nodes:** 88  
**Composite score:** 1  

> Ensure headings have discernible text

#### Failing selectors

| Selector | Themes | Pages affected | Nodes |
|----------|--------|---------------|-------|
| `h1` | admin | 1 | 88 |

#### Details

**1. Selector:** `h1`

_Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute_

```html
<h1 class="page-title"></h1>
```

Pages: `/`

**Search Drupal issue queue:** [empty-heading + Accessibility](https://www.drupal.org/project/issues/search?text=empty-heading&projects=drupal&status[]=Open&issue_tags=Accessibility)

---

## How to File Issues

When filing accessibility issues for the Admin / Gin theme, include:

1. **The axe rule ID** (e.g. `color-contrast`, `label`)
2. **The WCAG Success Criterion** — see the Summary table above
3. **The failing selector** and **HTML snippet** from the Rule Details above
4. **Which pages are affected** — listed per selector
5. **Steps to reproduce** — load the page in Drupal, run `axe` in browser DevTools

File against: [Gin project issue queue](https://www.drupal.org/project/issues/gin?status[]=Open&issue_tags=Accessibility)

Add the tag `Accessibility` and reference the WCAG criterion in the issue summary.
