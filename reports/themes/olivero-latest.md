# Accessibility Report: Olivero Theme

Generated: 2026-05-06  
Crawl records for this theme group: **56**

---

## About Olivero

The **Olivero front-end theme** (`olivero`, `olivero-dark`) — ships with Drupal core as the default public-facing theme. Issues should be reported to the [Drupal core Accessibility queue](https://www.drupal.org/project/issues/search?text=olivero&projects=drupal&status[]=Open&issue_tags=Accessibility).

**Issue queue:** [Drupal core issue queue (Olivero + Accessibility)](https://www.drupal.org/project/issues/search?text=olivero&projects=drupal&status[]=Open&issue_tags=Accessibility)

---

## Summary by Rule

Composite score = `impactWeight × log₂(1 + uniquePageCount)`. Higher = higher priority.

| Rank | Score | Rule | Impact | WCAG | Unique pages | Total nodes | Selectors |
|------|-------|------|--------|------|-------------|-------------|-----------|
| 1 | 6 | [`region`](https://dequeuniversity.com/rules/axe/4.11/region?application=playwright) | 🟡 Moderate | 1.3.6 (AAA) | 7 | 72 | 2 |
| 2 | 2 | [`page-has-heading-one`](https://dequeuniversity.com/rules/axe/4.11/page-has-heading-one?application=playwright) | 🟡 Moderate | 2.4.6 (AA) | 1 | 8 | 1 |

---

## Rule Details

1. [`region`](#rule-region)  
2. [`page-has-heading-one`](#rule-page-has-heading-one)

---

### `region` {#rule-region}

**Impact:** 🟡 Moderate  
**WCAG:** 1.3.6 — Identify Purpose (Level AAA)  
**Axe docs:** https://dequeuniversity.com/rules/axe/4.11/region?application=playwright  
**Unique pages affected:** 7  
**Total violation nodes:** 72  
**Composite score:** 6  

> Ensure all page content is contained by landmarks

#### Failing selectors

| Selector | Themes | Pages affected | Nodes |
|----------|--------|---------------|-------|
| `.themeswitcher-form__form-item` | olivero, olivero-dark | 7 | 56 |
| `#primary-tabs-title` | olivero, olivero-dark | 2 | 16 |

#### Details

**1. Selector:** `.themeswitcher-form__form-item`

_Some page content is not contained by landmarks_

```html
<div class="themeswitcher-form__form-item js-form-item form-item form-type-select js-form-type-select form-item-preferred-theme js-form-item-preferred-theme">
```

Pages: `/`, `/action-link`, `/search/node`, `/this-page-does-not-exist`, `/user/login`, `/user/password`, `/user/register`

**2. Selector:** `#primary-tabs-title`

_Some page content is not contained by landmarks_

```html
<h2 id="primary-tabs-title" class="visually-hidden">Primary tabs</h2>
```

Pages: `/user/login`, `/user/password`

**Search Drupal issue queue:** [region + Accessibility](https://www.drupal.org/project/issues/search?text=region&projects=drupal&status[]=Open&issue_tags=Accessibility)

---

### `page-has-heading-one` {#rule-page-has-heading-one}

**Impact:** 🟡 Moderate  
**WCAG:** 2.4.6 — Headings and Labels (Level AA)  
**Axe docs:** https://dequeuniversity.com/rules/axe/4.11/page-has-heading-one?application=playwright  
**Unique pages affected:** 1  
**Total violation nodes:** 8  
**Composite score:** 2  

> Ensure that the page, or at least one of its frames contains a level-one heading

#### Failing selectors

| Selector | Themes | Pages affected | Nodes |
|----------|--------|---------------|-------|
| `html` | olivero, olivero-dark | 1 | 8 |

#### Details

**1. Selector:** `html`

_Page must have a level-one heading_

```html
<html lang="en" dir="ltr" style="--color--primary-hue:202;--color--primary-saturation:79%;--color--primary-lightness:50" class=" js">
```

Pages: `/`

**Search Drupal issue queue:** [page-has-heading-one + Accessibility](https://www.drupal.org/project/issues/search?text=page-has-heading-one&projects=drupal&status[]=Open&issue_tags=Accessibility)

---

## How to File Issues

When filing accessibility issues for the Olivero theme, include:

1. **The axe rule ID** (e.g. `color-contrast`, `label`)
2. **The WCAG Success Criterion** — see the Summary table above
3. **The failing selector** and **HTML snippet** from the Rule Details above
4. **Which pages are affected** — listed per selector
5. **Steps to reproduce** — load the page in Drupal, run `axe` in browser DevTools

File against: [Drupal core issue queue (Olivero + Accessibility)](https://www.drupal.org/project/issues/search?text=olivero&projects=drupal&status[]=Open&issue_tags=Accessibility)

Add the tag `Accessibility` and reference the WCAG criterion in the issue summary.
