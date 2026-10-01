# Accessibility Report: Claro Theme

Generated: 2026-05-06  
Crawl records for this theme group: **424**

---

## About Claro

The **Claro administration theme** (`claro`, `claro-dark`) — ships with Drupal core as the default administration theme. Issues should be reported to the [Drupal core Accessibility queue](https://www.drupal.org/project/issues/search?text=claro&projects=drupal&status[]=Open&issue_tags=Accessibility).

**Issue queue:** [Drupal core issue queue (Claro + Accessibility)](https://www.drupal.org/project/issues/search?text=claro&projects=drupal&status[]=Open&issue_tags=Accessibility)

---

## Summary by Rule

Composite score = `impactWeight × log₂(1 + uniquePageCount)`. Higher = higher priority.

| Rank | Score | Rule | Impact | WCAG | Unique pages | Total nodes | Selectors |
|------|-------|------|--------|------|-------------|-------------|-----------|
| 1 | 11.51 | [`region`](https://dequeuniversity.com/rules/axe/4.11/region?application=playwright) | 🟡 Moderate | 1.3.6 (AAA) | 53 | 424 | 1 |
| 2 | 6.966 | [`color-contrast`](https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright) | 🟠 Serious | 1.4.3 (AA) | 4 | 40 | 4 |
| 3 | 6.966 | [`label-title-only`](https://dequeuniversity.com/rules/axe/4.11/label-title-only?application=playwright) | 🟠 Serious | 1.3.1 (A) | 4 | 40 | 3 |
| 4 | 6.644 | [`heading-order`](https://dequeuniversity.com/rules/axe/4.11/heading-order?application=playwright) | 🟡 Moderate | 1.3.1 (A) | 9 | 72 | 9 |
| 5 | 4.644 | [`landmark-contentinfo-is-top-level`](https://dequeuniversity.com/rules/axe/4.11/landmark-contentinfo-is-top-level?application=playwright) | 🟡 Moderate | 1.3.6 (AAA) | 4 | 80 | 6 |
| 6 | 4 | [`label`](https://dequeuniversity.com/rules/axe/4.11/label?application=playwright) | 🔴 Critical | 1.3.1 (A) | 1 | 32 | 4 |
| 7 | 4 | [`landmark-no-duplicate-contentinfo`](https://dequeuniversity.com/rules/axe/4.11/landmark-no-duplicate-contentinfo?application=playwright) | 🟡 Moderate | 1.3.6 (AAA) | 3 | 24 | 2 |
| 8 | 3 | [`tabindex`](https://dequeuniversity.com/rules/axe/4.11/tabindex?application=playwright) | 🟠 Serious | 2.1.1 (A) | 1 | 48 | 6 |
| 9 | 3 | [`summary-name`](https://dequeuniversity.com/rules/axe/4.11/summary-name?application=playwright) | 🟠 Serious | 4.1.2 (A) | 1 | 2 | 1 |
| 10 | 2.807 | [`empty-table-header`](https://dequeuniversity.com/rules/axe/4.11/empty-table-header?application=playwright) | 🔵 Minor | 1.3.1 (A) | 6 | 176 | 22 |
| 11 | 2.322 | [`empty-heading`](https://dequeuniversity.com/rules/axe/4.11/empty-heading?application=playwright) | 🔵 Minor | 2.4.6 (AA) | 4 | 112 | 10 |
| 12 | 2 | [`landmark-unique`](https://dequeuniversity.com/rules/axe/4.11/landmark-unique?application=playwright) | 🟡 Moderate | 1.3.6 (AAA) | 1 | 8 | 1 |

---

## Rule Details

1. [`region`](#rule-region)  
2. [`color-contrast`](#rule-color-contrast)  
3. [`label-title-only`](#rule-label-title-only)  
4. [`heading-order`](#rule-heading-order)  
5. [`landmark-contentinfo-is-top-level`](#rule-landmark-contentinfo-is-top-level)  
6. [`label`](#rule-label)  
7. [`landmark-no-duplicate-contentinfo`](#rule-landmark-no-duplicate-contentinfo)  
8. [`tabindex`](#rule-tabindex)  
9. [`summary-name`](#rule-summary-name)  
10. [`empty-table-header`](#rule-empty-table-header)  
11. [`empty-heading`](#rule-empty-heading)  
12. [`landmark-unique`](#rule-landmark-unique)

---

### `region` {#rule-region}

**Impact:** 🟡 Moderate  
**WCAG:** 1.3.6 — Identify Purpose (Level AAA)  
**Axe docs:** https://dequeuniversity.com/rules/axe/4.11/region?application=playwright  
**Unique pages affected:** 53  
**Total violation nodes:** 424  
**Composite score:** 11.51  

> Ensure all page content is contained by landmarks

#### Failing selectors

| Selector | Themes | Pages affected | Nodes |
|----------|--------|---------------|-------|
| `.themeswitcher-form__form-item` | claro, claro-dark | 53 | 424 |

#### Details

**1. Selector:** `.themeswitcher-form__form-item`

_Some page content is not contained by landmarks_

```html
<div class="themeswitcher-form__form-item js-form-item form-item js-form-type-select form-type--select js-form-item-preferred-theme form-item--preferred-theme">
```

Pages: `/`, `/action-link`, `/admin`, `/admin/appearance`, `/admin/config`, `/admin/config/content/formats`, `/admin/config/content/formats/manage/restricted_html`, `/admin/config/system/site-information` +45 more

**Search Drupal issue queue:** [region + Accessibility](https://www.drupal.org/project/issues/search?text=region&projects=drupal&status[]=Open&issue_tags=Accessibility)

---

### `color-contrast` {#rule-color-contrast}

**Impact:** 🟠 Serious  
**WCAG:** 1.4.3 — Contrast (Minimum) (Level AA)  
**Axe docs:** https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright  
**Unique pages affected:** 4  
**Total violation nodes:** 40  
**Composite score:** 6.966  

> Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

#### Failing selectors

| Selector | Themes | Pages affected | Nodes |
|----------|--------|---------------|-------|
| `#edit-submit` | claro, claro-dark | 2 | 16 |
| `tr[data-drupal-selector="edit-blocks-claro-help"] > td:nth-child(5) > .dropbutto` | claro, claro-dark | 1 | 8 |
| `.block-disabled.draggable[data-once="claroTabledrag"]:nth-child(23) > td:nth-chi` | claro, claro-dark | 1 | 8 |
| `.region-hidden-message > td[colspan="9"]` | claro, claro-dark | 1 | 8 |

#### Details

**1. Selector:** `#edit-submit`

_Element has insufficient color contrast of 4.24 (foreground color: #ffffff, background color: #3371ff, font size: 9.5pt (12.64px), font weight: bold). Expected contrast ratio of 4.5:1_

```html
<input class="button--small button button--primary js-form-submit form-submit" data-drupal-selector="edit-submit" type="submit" id="edit-submit" name="op" value="Apply to selected items">
```

Pages: `/admin/content`, `/admin/people`

**2. Selector:** `tr[data-drupal-selector="edit-blocks-claro-help"] > td:nth-child(5) > .dropbutton-wrapper.dropbutton`

_Element has insufficient color contrast of 4.1 (foreground color: #6a6b6f, background color: #e1e2e5, font size: 9.5pt (12.64px), font weight: bold). Expected contrast ratio of 4.5:1_

```html
<a href="/admin/structure/block/manage/claro_help/enable?destination=/admin/structure/block&amp;token=iIoIB1LVr7k2Tq32KtWvQY88GKzRpr3DZ4228CLDEtc">Enable</a>
```

Pages: `/admin/structure/block`

**3. Selector:** `.block-disabled.draggable[data-once="claroTabledrag"]:nth-child(23) > td:nth-child(5) > .dropbutton-`

_Element has insufficient color contrast of 4.1 (foreground color: #6a6b6f, background color: #e1e2e5, font size: 9.5pt (12.64px), font weight: bold). Expected contrast ratio of 4.5:1_

```html
<a href="/admin/structure/block/manage/claro_vertical_tabs_test/enable?destination=/admin/structure/block&amp;token=aeIByHOyHUvJuNjZGRaglxJ1tqvfbyxKng-Ql-Ue7dQ">Enable</a>
```

Pages: `/admin/structure/block`

**4. Selector:** `.region-hidden-message > td[colspan="9"]`

_Element has insufficient color contrast of 3.78 (foreground color: #828388, background color: #ffffff, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1_

```html
<td colspan="9">No field is hidden.</td>
```

Pages: `/admin/structure/types/manage/test_type/display/default`

**Search Drupal issue queue:** [color-contrast + Accessibility](https://www.drupal.org/project/issues/search?text=color-contrast&projects=drupal&status[]=Open&issue_tags=Accessibility)

---

### `label-title-only` {#rule-label-title-only}

**Impact:** 🟠 Serious  
**WCAG:** 1.3.1 — Info and Relationships (Level A)  
**Axe docs:** https://dequeuniversity.com/rules/axe/4.11/label-title-only?application=playwright  
**Unique pages affected:** 4  
**Total violation nodes:** 40  
**Composite score:** 6.966  

> Ensure that every form element has a visible label and is not solely labeled using hidden labels, or the title or aria-describedby attributes

#### Failing selectors

| Selector | Themes | Pages affected | Nodes |
|----------|--------|---------------|-------|
| `input[title="Select all rows in this table"]` | claro, claro-dark | 3 | 24 |
| `#edit-checkbox-hidden-label-value` | claro, claro-dark | 1 | 8 |
| `#edit-checkbox-hidden-label-disabled-value` | claro, claro-dark | 1 | 8 |

#### Details

**1. Selector:** `input[title="Select all rows in this table"]`

_Only title used to generate label for form element_

```html
<input type="checkbox" class="form-checkbox form-boolean form-boolean--type-checkbox" title="Select all rows in this table">
```

Pages: `/admin/content`, `/admin/people`, `/table`

**2. Selector:** `#edit-checkbox-hidden-label-value`

_Only title used to generate label for form element_

```html
<input data-drupal-selector="edit-checkbox-hidden..." aria-describedby="edit-checkbox-hidden..." type="checkbox" id="edit-checkbox-hidden..." name="checkbox_hidden_labe..." value="1" class="form-checkbox form-b..." title="Checkbox with hidden...">
```

Pages: `/contact/checkbox_radio`

**3. Selector:** `#edit-checkbox-hidden-label-disabled-value`

_Only title used to generate label for form element_

```html
<input data-drupal-selector="edit-checkbox-hidden..." aria-describedby="edit-checkbox-hidden..." disabled="disabled" type="checkbox" id="edit-checkbox-hidden..." name="checkbox_hidden_labe..." value="1" class="form-checkbox form-b..." title="Hidden label, disabl...">
```

Pages: `/contact/checkbox_radio`

**Search Drupal issue queue:** [label-title-only + Accessibility](https://www.drupal.org/project/issues/search?text=label-title-only&projects=drupal&status[]=Open&issue_tags=Accessibility)

---

### `heading-order` {#rule-heading-order}

**Impact:** 🟡 Moderate  
**WCAG:** 1.3.1 — Info and Relationships (Level A)  
**Axe docs:** https://dequeuniversity.com/rules/axe/4.11/heading-order?application=playwright  
**Unique pages affected:** 9  
**Total violation nodes:** 72  
**Composite score:** 6.644  

> Ensure the order of headings is semantically correct

#### Failing selectors

| Selector | Themes | Pages affected | Nodes |
|----------|--------|---------------|-------|
| `#pagination-heading` | claro, claro-dark | 1 | 8 |
| `.form-datetime-wrapper.form-item:nth-child(4) > h4` | claro, claro-dark | 1 | 8 |
| `h4` | claro, claro-dark | 1 | 8 |
| `.layout-column.layout-column--half:nth-child(1) > .panel:nth-child(1) > .panel__` | claro, claro-dark | 1 | 8 |
| `#multitext-unlimited-values > thead > tr > .field-label[colspan="2"] > h4` | claro, claro-dark | 1 | 8 |
| `#presuf-formatted-m-values > thead > tr > .field-label[colspan="2"] > .form-item` | claro, claro-dark | 1 | 8 |
| `#presuf-number-m-values > thead > tr > .field-label[colspan="2"] > h4` | claro, claro-dark | 1 | 8 |
| `#presuf-text-m-values > thead > tr > .field-label[colspan="2"] > h4` | claro, claro-dark | 1 | 8 |
| `#edit-timestamp-wrapper > .form-datetime-wrapper.form-item > h4` | claro, claro-dark | 1 | 8 |

#### Details

**1. Selector:** `#pagination-heading`

_Heading order invalid_

```html
<h4 id="pagination-heading" class="visually-hidden">Pagination</h4>
```

Pages: `/admin/content`

**2. Selector:** `.form-datetime-wrapper.form-item:nth-child(4) > h4`

_Heading order invalid_

```html
<h4 class="form-item__label">Datelist</h4>
```

Pages: `/admin/form_style`

**3. Selector:** `h4`

_Heading order invalid_

```html
<h4 class="form-item__label form-item__label--multiple-value-form">Select some other countries</h4>
```

Pages: `/autocomplete`

**4. Selector:** `.layout-column.layout-column--half:nth-child(1) > .panel:nth-child(1) > .panel__title`

_Heading order invalid_

```html
<h3 class="panel__title">People</h3>
```

Pages: `/cd-navigation/config`

**5. Selector:** `#multitext-unlimited-values > thead > tr > .field-label[colspan="2"] > h4`

_Heading order invalid_

```html
<h4 class="form-item__label form-item__label--multiple-value-form">Multiple, unlimited text</h4>
```

Pages: `/contact/field_cardinality_test`

**Search Drupal issue queue:** [heading-order + Accessibility](https://www.drupal.org/project/issues/search?text=heading-order&projects=drupal&status[]=Open&issue_tags=Accessibility)

---

### `landmark-contentinfo-is-top-level` {#rule-landmark-contentinfo-is-top-level}

**Impact:** 🟡 Moderate  
**WCAG:** 1.3.6 — Identify Purpose (Level AAA)  
**Axe docs:** https://dequeuniversity.com/rules/axe/4.11/landmark-contentinfo-is-top-level?application=playwright  
**Unique pages affected:** 4  
**Total violation nodes:** 80  
**Composite score:** 4.644  

> Ensure the contentinfo landmark is at top level

#### Failing selectors

| Selector | Themes | Pages affected | Nodes |
|----------|--------|---------------|-------|
| `.messages--error` | claro, claro-dark | 3 | 24 |
| `.messages--warning` | claro, claro-dark | 3 | 24 |
| `.messages-list__item` | claro, claro-dark | 1 | 8 |
| `.messages--status` | claro, claro-dark | 1 | 8 |
| `.messages--info` | claro, claro-dark | 1 | 8 |
| `.messages--custom` | claro, claro-dark | 1 | 8 |

#### Details

**1. Selector:** `.messages--error`

_The contentinfo landmark is contained in another landmark._

```html
<div role="contentinfo" aria-labelledby="message-error-title" class="messages-list__item messages messages--error">
```

Pages: `/admin/appearance`, `/admin/modules`, `/message`

**2. Selector:** `.messages--warning`

_The contentinfo landmark is contained in another landmark._

```html
<div role="contentinfo" aria-labelledby="message-warning-title" class="messages-list__item messages messages--warning">
```

Pages: `/admin/appearance`, `/admin/modules`, `/message`

**3. Selector:** `.messages-list__item`

_The contentinfo landmark is contained in another landmark._

```html
<div role="contentinfo" aria-labelledby="message-error-title" class="messages-list__item messages messages--error">
```

Pages: `/admin/config`

**4. Selector:** `.messages--status`

_The contentinfo landmark is contained in another landmark._

```html
<div role="contentinfo" aria-labelledby="message-status-title" class="messages-list__item messages messages--status">
```

Pages: `/message`

**5. Selector:** `.messages--info`

_The contentinfo landmark is contained in another landmark._

```html
<div role="contentinfo" aria-labelledby="message-info-title" class="messages-list__item messages messages--info">
                            <div class="messages__content">
                          An info message
                      </div>
              </div>
```

Pages: `/message`

**Search Drupal issue queue:** [landmark-contentinfo-is-top-level + Accessibility](https://www.drupal.org/project/issues/search?text=landmark-contentinfo-is-top-level&projects=drupal&status[]=Open&issue_tags=Accessibility)

---

### `label` {#rule-label}

**Impact:** 🔴 Critical  
**WCAG:** 1.3.1 — Info and Relationships (Level A)  
**Axe docs:** https://dequeuniversity.com/rules/axe/4.11/label?application=playwright  
**Unique pages affected:** 1  
**Total violation nodes:** 32  
**Composite score:** 4  

> Ensure every form element has a label

#### Failing selectors

| Selector | Themes | Pages affected | Nodes |
|----------|--------|---------------|-------|
| `#edit-imagefile-file-limited-0-display` | claro, claro-dark | 1 | 8 |
| `#edit-imagefile-file-limited-1-display` | claro, claro-dark | 1 | 8 |
| `#edit-imagefile-file-limited-dis-0-display` | claro, claro-dark | 1 | 8 |
| `#edit-imagefile-file-limited-dis-1-display` | claro, claro-dark | 1 | 8 |

#### Details

**1. Selector:** `#edit-imagefile-file-limited-0-display`

_Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"_

```html
<input class="file-display form-checkbox form-boolean form-boolean--type-checkbox" data-drupal-selector="edit-imagefile-file-limited-0-display" type="checkbox" id="edit-imagefile-file-limited-0-display" name="imagefile_file_limited[0][display]" value="1" checked="checked">
```

Pages: `/contact/imagefile_file`

**2. Selector:** `#edit-imagefile-file-limited-1-display`

_Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"_

```html
<input class="file-display form-checkbox form-boolean form-boolean--type-checkbox" data-drupal-selector="edit-imagefile-file-limited-1-display" type="checkbox" id="edit-imagefile-file-limited-1-display" name="imagefile_file_limited[1][display]" value="1">
```

Pages: `/contact/imagefile_file`

**3. Selector:** `#edit-imagefile-file-limited-dis-0-display`

_Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"_

```html
<input class="file-display form-checkbox form-boolean form-boolean--type-checkbox" data-drupal-selector="edit-imagefile-file-limited-dis-0-display" disabled="disabled" type="checkbox" id="edit-imagefile-file-limited-dis-0-display" name="imagefile_file_limited_dis[0][display]" value="1">
```

Pages: `/contact/imagefile_file`

**4. Selector:** `#edit-imagefile-file-limited-dis-1-display`

_Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"_

```html
<input class="file-display form-checkbox form-boolean form-boolean--type-checkbox" data-drupal-selector="edit-imagefile-file-limited-dis-1-display" disabled="disabled" type="checkbox" id="edit-imagefile-file-limited-dis-1-display" name="imagefile_file_limited_dis[1][display]" value="1">
```

Pages: `/contact/imagefile_file`

**Search Drupal issue queue:** [label + Accessibility](https://www.drupal.org/project/issues/search?text=label&projects=drupal&status[]=Open&issue_tags=Accessibility)

---

### `landmark-no-duplicate-contentinfo` {#rule-landmark-no-duplicate-contentinfo}

**Impact:** 🟡 Moderate  
**WCAG:** 1.3.6 — Identify Purpose (Level AAA)  
**Axe docs:** https://dequeuniversity.com/rules/axe/4.11/landmark-no-duplicate-contentinfo?application=playwright  
**Unique pages affected:** 3  
**Total violation nodes:** 24  
**Composite score:** 4  

> Ensure the document has at most one contentinfo landmark

#### Failing selectors

| Selector | Themes | Pages affected | Nodes |
|----------|--------|---------------|-------|
| `.messages--error` | claro, claro-dark | 2 | 16 |
| `.messages--status` | claro, claro-dark | 1 | 8 |

#### Details

**1. Selector:** `.messages--error`

_Document has more than one contentinfo landmark_

```html
<div role="contentinfo" aria-labelledby="message-error-title" class="messages-list__item messages messages--error">
```

Pages: `/admin/appearance`, `/admin/modules`

**2. Selector:** `.messages--status`

_Document has more than one contentinfo landmark_

```html
<div role="contentinfo" aria-labelledby="message-status-title" class="messages-list__item messages messages--status">
```

Pages: `/message`

**Search Drupal issue queue:** [landmark-no-duplicate-contentinfo + Accessibility](https://www.drupal.org/project/issues/search?text=landmark-no-duplicate-contentinfo&projects=drupal&status[]=Open&issue_tags=Accessibility)

---

### `tabindex` {#rule-tabindex}

**Impact:** 🟠 Serious  
**WCAG:** 2.1.1 — Keyboard (Level A)  
**Axe docs:** https://dequeuniversity.com/rules/axe/4.11/tabindex?application=playwright  
**Unique pages affected:** 1  
**Total violation nodes:** 48  
**Composite score:** 3  

> Ensure tabindex attribute values are not greater than 0

#### Failing selectors

| Selector | Themes | Pages affected | Nodes |
|----------|--------|---------------|-------|
| `#edit-submit` | claro, claro-dark | 1 | 8 |
| `#edit-danger` | claro, claro-dark | 1 | 8 |
| `#edit-cancel` | claro, claro-dark | 1 | 8 |
| `#edit-submit--2` | claro, claro-dark | 1 | 8 |
| `#edit-danger--2` | claro, claro-dark | 1 | 8 |
| `#edit-cancel--2` | claro, claro-dark | 1 | 8 |

#### Details

**1. Selector:** `#edit-submit`

_Element has a tabindex greater than 0_

```html
<input class="button button--primary js-form-submit form-submit" tabindex="1" data-drupal-selector="edit-submit" type="submit" id="edit-submit" name="op" value="Primary">
```

Pages: `/buttons`

**2. Selector:** `#edit-danger`

_Element has a tabindex greater than 0_

```html
<input class="button button--danger js-form-submit form-submit" tabindex="1" data-drupal-selector="edit-danger" type="submit" id="edit-danger" name="op" value="Danger">
```

Pages: `/buttons`

**3. Selector:** `#edit-cancel`

_Element has a tabindex greater than 0_

```html
<input class="button js-form-submit form-submit" tabindex="1" data-drupal-selector="edit-cancel" type="submit" id="edit-cancel" name="op" value="Default">
```

Pages: `/buttons`

**4. Selector:** `#edit-submit--2`

_Element has a tabindex greater than 0_

```html
<input class="button--small button button--primary js-form-submit form-submit" tabindex="1" data-drupal-selector="edit-submit" type="submit" id="edit-submit--2" name="op" value="Primary">
```

Pages: `/buttons`

**5. Selector:** `#edit-danger--2`

_Element has a tabindex greater than 0_

```html
<input class="button--small button button--danger js-form-submit form-submit" tabindex="1" data-drupal-selector="edit-danger" type="submit" id="edit-danger--2" name="op" value="Danger">
```

Pages: `/buttons`

**Search Drupal issue queue:** [tabindex + Accessibility](https://www.drupal.org/project/issues/search?text=tabindex&projects=drupal&status[]=Open&issue_tags=Accessibility)

---

### `summary-name` {#rule-summary-name}

**Impact:** 🟠 Serious  
**WCAG:** 4.1.2 — Name, Role, Value (Level A)  
**Axe docs:** https://dequeuniversity.com/rules/axe/4.11/summary-name?application=playwright  
**Unique pages affected:** 1  
**Total violation nodes:** 2  
**Composite score:** 3  

> Ensure summary elements have discernible text

#### Failing selectors

| Selector | Themes | Pages affected | Nodes |
|----------|--------|---------------|-------|
| `#edit-modules-nyan-cat-enable-description > .module-list__module-summary` | claro, claro-dark | 1 | 2 |

#### Details

**1. Selector:** `#edit-modules-nyan-cat-enable-description > .module-list__module-summary`

_Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute_

```html
<summary aria-controls="edit-modules-nyan-cat-enable-description" role="button" aria-expanded="false" class="claro-details__summary module-list__module-summary"><span class="text module-description"></span><span class="claro-details__summary-summary"></span></summary>
```

Pages: `/admin/modules`

**Search Drupal issue queue:** [summary-name + Accessibility](https://www.drupal.org/project/issues/search?text=summary-name&projects=drupal&status[]=Open&issue_tags=Accessibility)

---

### `empty-table-header` {#rule-empty-table-header}

**Impact:** 🔵 Minor  
**WCAG:** 1.3.1 — Info and Relationships (Level A)  
**Axe docs:** https://dequeuniversity.com/rules/axe/4.11/empty-table-header?application=playwright  
**Unique pages affected:** 6  
**Total violation nodes:** 176  
**Composite score:** 2.807  

> Ensure table headers have discernible text

#### Failing selectors

| Selector | Themes | Pages affected | Nodes |
|----------|--------|---------------|-------|
| `th:nth-child(2)` | claro, claro-dark | 1 | 8 |
| `#multitext-unlimited-values > thead > tr > th:nth-child(2)` | claro, claro-dark | 1 | 8 |
| `#multitext-unlimited-disabled-values > thead > tr > th:nth-child(2)` | claro, claro-dark | 1 | 8 |
| `#multitext-unlimited-required-values > thead > tr > th:nth-child(2)` | claro, claro-dark | 1 | 8 |
| `#multitext-unlimited-required-dis-values > thead > tr > th:nth-child(2)` | claro, claro-dark | 1 | 8 |
| `#multitext-limited-values > thead > tr > th:nth-child(2)` | claro, claro-dark | 1 | 8 |
| `#multitext-limited-disabled-values > thead > tr > th:nth-child(2)` | claro, claro-dark | 1 | 8 |
| `#multitext-limited-required-values > thead > tr > th:nth-child(2)` | claro, claro-dark | 1 | 8 |
| `#multitext-limited-required-dis-values > thead > tr > th:nth-child(2)` | claro, claro-dark | 1 | 8 |
| `#presuf-formatted-m-values > thead > tr > th:nth-child(2)` | claro, claro-dark | 1 | 8 |
| `#presuf-formatted-pre-m-values > thead > tr > th:nth-child(2)` | claro, claro-dark | 1 | 8 |
| `#presuf-formatted-suf-m-values > thead > tr > th:nth-child(2)` | claro, claro-dark | 1 | 8 |
| `#presuf-formatted-pre-suf-m-values > thead > tr > th:nth-child(2)` | claro, claro-dark | 1 | 8 |
| `#presuf-number-m-values > thead > tr > th:nth-child(2)` | claro, claro-dark | 1 | 8 |
| `#presuf-number-pre-m-values > thead > tr > th:nth-child(2)` | claro, claro-dark | 1 | 8 |
| `#presuf-number-suf-m-values > thead > tr > th:nth-child(2)` | claro, claro-dark | 1 | 8 |
| `#presuf-number-pre-suf-m-values > thead > tr > th:nth-child(2)` | claro, claro-dark | 1 | 8 |
| `#presuf-text-m-values > thead > tr > th:nth-child(2)` | claro, claro-dark | 1 | 8 |
| `#presuf-text-pre-m-values > thead > tr > th:nth-child(2)` | claro, claro-dark | 1 | 8 |
| `#presuf-text-suf-m-values > thead > tr > th:nth-child(2)` | claro, claro-dark | 1 | 8 |
| `#presuf-text-pre-suf-m-values > thead > tr > th:nth-child(2)` | claro, claro-dark | 1 | 8 |
| `#edit-table-empty > thead > tr > .select-all` | claro, claro-dark | 1 | 8 |

#### Details

**1. Selector:** `th:nth-child(2)`

_Element does not have text that is visible to screen readers_

```html
<th></th>
```

Pages: `/autocomplete`

**2. Selector:** `#multitext-unlimited-values > thead > tr > th:nth-child(2)`

_Element does not have text that is visible to screen readers_

```html
<th></th>
```

Pages: `/contact/field_cardinality_test`

**3. Selector:** `#multitext-unlimited-disabled-values > thead > tr > th:nth-child(2)`

_Element does not have text that is visible to screen readers_

```html
<th class="is-disabled"></th>
```

Pages: `/contact/field_cardinality_test`

**4. Selector:** `#multitext-unlimited-required-values > thead > tr > th:nth-child(2)`

_Element does not have text that is visible to screen readers_

```html
<th></th>
```

Pages: `/contact/field_cardinality_test`

**5. Selector:** `#multitext-unlimited-required-dis-values > thead > tr > th:nth-child(2)`

_Element does not have text that is visible to screen readers_

```html
<th class="is-disabled"></th>
```

Pages: `/contact/field_cardinality_test`

**Search Drupal issue queue:** [empty-table-header + Accessibility](https://www.drupal.org/project/issues/search?text=empty-table-header&projects=drupal&status[]=Open&issue_tags=Accessibility)

---

### `empty-heading` {#rule-empty-heading}

**Impact:** 🔵 Minor  
**WCAG:** 2.4.6 — Headings and Labels (Level AA)  
**Axe docs:** https://dequeuniversity.com/rules/axe/4.11/empty-heading?application=playwright  
**Unique pages affected:** 4  
**Total violation nodes:** 112  
**Composite score:** 2.322  

> Ensure headings have discernible text

#### Failing selectors

| Selector | Themes | Pages affected | Nodes |
|----------|--------|---------------|-------|
| `h3:nth-child(3)` | claro, claro-dark | 2 | 16 |
| `h3:nth-child(4)` | claro, claro-dark | 2 | 16 |
| `h3:nth-child(5)` | claro, claro-dark | 2 | 16 |
| `h3:nth-child(6)` | claro, claro-dark | 2 | 16 |
| `h1` | claro, claro-dark | 1 | 8 |
| `h3:nth-child(7)` | claro, claro-dark | 1 | 8 |
| `h3:nth-child(8)` | claro, claro-dark | 1 | 8 |
| `#block-claro-content > h3` | claro, claro-dark | 1 | 8 |
| `#block-claro-content > h3:nth-child(1)` | claro, claro-dark | 1 | 8 |
| `h3:nth-child(2)` | claro, claro-dark | 1 | 8 |

#### Details

**1. Selector:** `h3:nth-child(3)`

_Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute_

```html
<h3></h3>
```

Pages: `/dialog`, `/tabs`

**2. Selector:** `h3:nth-child(4)`

_Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute_

```html
<h3></h3>
```

Pages: `/dialog`, `/tabs`

**3. Selector:** `h3:nth-child(5)`

_Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute_

```html
<h3></h3>
```

Pages: `/dialog`, `/tabs`

**4. Selector:** `h3:nth-child(6)`

_Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute_

```html
<h3></h3>
```

Pages: `/dialog`, `/tabs`

**5. Selector:** `h1`

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

### `landmark-unique` {#rule-landmark-unique}

**Impact:** 🟡 Moderate  
**WCAG:** 1.3.6 — Identify Purpose (Level AAA)  
**Axe docs:** https://dequeuniversity.com/rules/axe/4.11/landmark-unique?application=playwright  
**Unique pages affected:** 1  
**Total violation nodes:** 8  
**Composite score:** 2  

> Ensure landmarks are unique

#### Failing selectors

| Selector | Themes | Pages affected | Nodes |
|----------|--------|---------------|-------|
| `.messages--info` | claro, claro-dark | 1 | 8 |

#### Details

**1. Selector:** `.messages--info`

_The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable_

```html
<div role="contentinfo" aria-labelledby="message-info-title" class="messages-list__item messages messages--info">
                            <div class="messages__content">
                          An info message
                      </div>
              </div>
```

Pages: `/message`

**Search Drupal issue queue:** [landmark-unique + Accessibility](https://www.drupal.org/project/issues/search?text=landmark-unique&projects=drupal&status[]=Open&issue_tags=Accessibility)

---

## How to File Issues

When filing accessibility issues for the Claro theme, include:

1. **The axe rule ID** (e.g. `color-contrast`, `label`)
2. **The WCAG Success Criterion** — see the Summary table above
3. **The failing selector** and **HTML snippet** from the Rule Details above
4. **Which pages are affected** — listed per selector
5. **Steps to reproduce** — load the page in Drupal, run `axe` in browser DevTools

File against: [Drupal core issue queue (Claro + Accessibility)](https://www.drupal.org/project/issues/search?text=claro&projects=drupal&status[]=Open&issue_tags=Accessibility)

Add the tag `Accessibility` and reference the WCAG criterion in the issue summary.
