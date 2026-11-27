> **Superseded** 2026-11-27: the verdict said mixed for a non-forced control run before the verdict logic was corrected; the measurements themselves showed the expected 20 custom chevrons on both sides. See `2026-11-27T16-10-29-815Z-chromium-light-1280x900`. Not counted in COVERAGE.md.

# #3636987 select caret in forced colors (3636987-pinned, light, 1280x900, chromium 159.0.8154.6)

DRAFT, AI-assisted; a person has not reviewed it. Verdict: mixed. 

One invocation is one colour mode. This run: **light**. A select keeps Drupal's SVG background-image when its computed `background-image` is not `none`; the native caret is painted by the browser and cannot be counted from script, so "one visible caret" is `background-image: none` plus a native `appearance` plus the screenshots. Disabled is simulated by setting the `disabled` attribute; RTL is simulated with the document `dir` attribute, not a native RTL install. Not covered: Firefox/WebKit, real screen readers, a person's keyboard pass.

## Before

| Page | State | Selects | Custom caret | appearance | padding-inline-end | background-image |
|---|---|---|---|---|---|---|
| /admin/content | default (edit-type) | 2 | 2 | none | 39px | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... |
| /admin/content | keyboard focus (25 Tab, edit-type) | 1 | 1 | none | 39px | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... |
| /admin/content | disabled (simulated, edit-type) | 1 | 1 | none | 39px | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... |
| /admin/content | dir=rtl (simulated) | 2 | 2 | none | 39px | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... (position 0px 50%) |
| /admin/structure/block | default extrasmall (edit-blocks-default-admin-page-title-region) | 18 of 18 | 18 | none | 23px | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... |
| /admin/structure/block | extrasmall focus (25 Tab, edit-blocks-default-admin-page-title-region) | 1 | 1 | none | 23px | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... |
| /admin/structure/block | extrasmall disabled (simulated, edit-blocks-default-admin-page-title-region) | 1 | 1 | none | 23px | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... |

## After

| Page | State | Selects | Custom caret | appearance | padding-inline-end | background-image |
|---|---|---|---|---|---|---|
| /admin/content | default (edit-type) | 2 | 2 | none | 39px | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... |
| /admin/content | keyboard focus (25 Tab, edit-type) | 1 | 1 | none | 39px | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... |
| /admin/content | disabled (simulated, edit-type) | 1 | 1 | none | 39px | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... |
| /admin/content | dir=rtl (simulated) | 2 | 2 | none | 39px | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... (position 0px 50%) |
| /admin/structure/block | default extrasmall (edit-blocks-default-admin-page-title-region) | 18 of 18 | 18 | none | 23px | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... |
| /admin/structure/block | extrasmall focus (25 Tab, edit-blocks-default-admin-page-title-region) | 1 | 1 | none | 23px | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... |
| /admin/structure/block | extrasmall disabled (simulated, edit-blocks-default-admin-page-title-region) | 1 | 1 | none | 23px | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... |

## Computed properties, default state, every select

| Page | # | id | classes | extrasmall | background-image | appearance | padding-inline-end |
|---|---|---|---|---|---|---|---|
| /admin/content | 0 | edit-type | form-select form-element form-element--type-select | false | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 39px |
| /admin/content | 1 | edit-status | form-select form-element form-element--type-select | false | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 39px |
| /admin/structure/block | 0 | edit-blocks-default-admin-page-title-region | block-region-select block-region-header form-select required form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |
| /admin/structure/block | 1 | edit-blocks-default-admin-page-title-weight | block-weight block-weight-header form-select form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |
| /admin/structure/block | 2 | edit-blocks-default-admin-primary-local-tasks-region | block-region-select block-region-header form-select required form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |
| /admin/structure/block | 3 | edit-blocks-default-admin-primary-local-tasks-weight | block-weight block-weight-header form-select form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |
| /admin/structure/block | 4 | edit-blocks-default-admin-secondary-local-tasks-region | block-region-select block-region-pre_content form-select required form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |
| /admin/structure/block | 5 | edit-blocks-default-admin-secondary-local-tasks-weight | block-weight block-weight-pre_content form-select form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |
| /admin/structure/block | 6 | edit-blocks-default-admin-breadcrumbs-region | block-region-select block-region-breadcrumb form-select required form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |
| /admin/structure/block | 7 | edit-blocks-default-admin-breadcrumbs-weight | block-weight block-weight-breadcrumb form-select form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |
| /admin/structure/block | 8 | edit-blocks-default-admin-messages-region | block-region-select block-region-highlighted form-select required form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |
| /admin/structure/block | 9 | edit-blocks-default-admin-messages-weight | block-weight block-weight-highlighted form-select form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |
| /admin/structure/block | 10 | edit-blocks-default-admin-help-region | block-region-select block-region-help form-select required form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |
| /admin/structure/block | 11 | edit-blocks-default-admin-help-weight | block-weight block-weight-help form-select form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |
| /admin/structure/block | 12 | edit-blocks-default-admin-local-actions-region | block-region-select block-region-content form-select required form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |
| /admin/structure/block | 13 | edit-blocks-default-admin-local-actions-weight | block-weight block-weight-content form-select form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |
| /admin/structure/block | 14 | edit-blocks-default-admin-content-region | block-region-select block-region-content form-select required form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |
| /admin/structure/block | 15 | edit-blocks-default-admin-content-weight | block-weight block-weight-content form-select form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |
| /admin/structure/block | 16 | edit-blocks-default-admin-login-region | block-region-select block-region-content form-select required form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |
| /admin/structure/block | 17 | edit-blocks-default-admin-login-weight | block-weight block-weight-content form-select form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |

| Page | # | id | classes | extrasmall | background-image | appearance | padding-inline-end |
|---|---|---|---|---|---|---|---|
| /admin/content | 0 | edit-type | form-select form-element form-element--type-select | false | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 39px |
| /admin/content | 1 | edit-status | form-select form-element form-element--type-select | false | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 39px |
| /admin/structure/block | 0 | edit-blocks-default-admin-page-title-region | block-region-select block-region-header form-select required form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |
| /admin/structure/block | 1 | edit-blocks-default-admin-page-title-weight | block-weight block-weight-header form-select form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |
| /admin/structure/block | 2 | edit-blocks-default-admin-primary-local-tasks-region | block-region-select block-region-header form-select required form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |
| /admin/structure/block | 3 | edit-blocks-default-admin-primary-local-tasks-weight | block-weight block-weight-header form-select form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |
| /admin/structure/block | 4 | edit-blocks-default-admin-secondary-local-tasks-region | block-region-select block-region-pre_content form-select required form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |
| /admin/structure/block | 5 | edit-blocks-default-admin-secondary-local-tasks-weight | block-weight block-weight-pre_content form-select form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |
| /admin/structure/block | 6 | edit-blocks-default-admin-breadcrumbs-region | block-region-select block-region-breadcrumb form-select required form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |
| /admin/structure/block | 7 | edit-blocks-default-admin-breadcrumbs-weight | block-weight block-weight-breadcrumb form-select form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |
| /admin/structure/block | 8 | edit-blocks-default-admin-messages-region | block-region-select block-region-highlighted form-select required form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |
| /admin/structure/block | 9 | edit-blocks-default-admin-messages-weight | block-weight block-weight-highlighted form-select form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |
| /admin/structure/block | 10 | edit-blocks-default-admin-help-region | block-region-select block-region-help form-select required form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |
| /admin/structure/block | 11 | edit-blocks-default-admin-help-weight | block-weight block-weight-help form-select form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |
| /admin/structure/block | 12 | edit-blocks-default-admin-local-actions-region | block-region-select block-region-content form-select required form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |
| /admin/structure/block | 13 | edit-blocks-default-admin-local-actions-weight | block-weight block-weight-content form-select form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |
| /admin/structure/block | 14 | edit-blocks-default-admin-content-region | block-region-select block-region-content form-select required form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |
| /admin/structure/block | 15 | edit-blocks-default-admin-content-weight | block-weight block-weight-content form-select form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |
| /admin/structure/block | 16 | edit-blocks-default-admin-login-region | block-region-select block-region-content form-select required form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |
| /admin/structure/block | 17 | edit-blocks-default-admin-login-weight | block-weight block-weight-content form-select form-element form-element--type-select form-element--extrasmall | true | url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/... | none | 23px |

## Checks

| Check | Before | After |
|---|---|---|
| .dark-mode class matches the mode | true | true |
| forced-colors media query matches | true | true |
| normal selects found | true | true |
| extrasmall selects found | true | true |
| extrasmall reached with Tab | true (25 Tab) | true (25 Tab) |
| selects with a custom SVG background (default, both pages; 0 is expected only in forced colours) | 20 | 20 |
| custom SVG background on keyboard focus | 2 | 2 |
| custom SVG background on disabled | 2 | 2 |

Padding-inline-end (Before → After): normal 39px → 39px; extrasmall 23px → 23px. Select box (Before → After): normal 106x40 → 106x40; extrasmall 183x28 → 183x28.

Screenshots (full page and caret-end crop):

- before content-default: [before-content-default-full.png](before-content-default-full.png), [caret crop](before-content-default-caret.png)
- before content-focus: [before-content-focus-full.png](before-content-focus-full.png), [caret crop](before-content-focus-caret.png)
- before content-disabled: [before-content-disabled-full.png](before-content-disabled-full.png), [caret crop](before-content-disabled-caret.png)
- before content-rtl: [before-content-rtl-full.png](before-content-rtl-full.png), [caret crop](before-content-rtl-caret.png)
- before block-default: [before-block-default-full.png](before-block-default-full.png), [caret crop](before-block-default-caret.png)
- before block-focus: [before-block-focus-full.png](before-block-focus-full.png), [caret crop](before-block-focus-caret.png)
- before block-disabled: [before-block-disabled-full.png](before-block-disabled-full.png), [caret crop](before-block-disabled-caret.png)
- after content-default: [after-content-default-full.png](after-content-default-full.png), [caret crop](after-content-default-caret.png)
- after content-focus: [after-content-focus-full.png](after-content-focus-full.png), [caret crop](after-content-focus-caret.png)
- after content-disabled: [after-content-disabled-full.png](after-content-disabled-full.png), [caret crop](after-content-disabled-caret.png)
- after content-rtl: [after-content-rtl-full.png](after-content-rtl-full.png), [caret crop](after-content-rtl-caret.png)
- after block-default: [after-block-default-full.png](after-block-default-full.png), [caret crop](after-block-default-caret.png)
- after block-focus: [after-block-focus-full.png](after-block-focus-full.png), [caret crop](after-block-focus-caret.png)
- after block-disabled: [after-block-disabled-full.png](after-block-disabled-full.png), [caret crop](after-block-disabled-caret.png)

## axe-core (WCAG 2.2 A/AA, before → after violation counts)

- axeContent: 0 → 0
- axeBlocks: 9 → 9

## Failures in this run

- none

## Context

| | Before | After |
|---|---|---|
| Core commit | `8a7df6cc3e 2026-11-27` | `8a7df6cc3e 2026-11-27` |
| Drupal, PHP | 12.0-dev, 8.5.7 | 12.0-dev, 8.5.7 |
| Profile; default / admin theme (config) | standard; default_admin / default_admin | standard; default_admin / default_admin |
| Theme that rendered each page | /user/1/edit → default_admin<br>/admin/content → null<br>/admin/structure/block → default_admin | /user/1/edit → default_admin<br>/admin/content → null<br>/admin/structure/block → default_admin |
| Languages (default) | none (en) | none (en) |
| Modules only on this side | none | none |
| Enabled modules | 39 | 39 |

CSS build of the After patch stack (core's build:css, separate from accessibility results): **PASS**.

