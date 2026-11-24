# #3636143 navigation toggle evaluation (3636143-latest, light, 1280x900)

DRAFT, AI-assisted; a person has not reviewed it. Verdict: reproduced-and-fixed; 0 After check(s) not met.

Real pointer hover, focus reached with Tab, Enter and Space for activation. Contrast is measured from rendered colours: the border against the background outside the circle and inside it (the hover background), the chevron against the inside, the focus outline against the outside. The border ratios are a **design objective** (the issue asks for 3:1); the chevron and focus outline ratios relate to WCAG 2.2 1.4.11 Non-text Contrast and 2.4.7 Focus Visible. Nothing here is a conformance claim, and axe-core results below do not establish conformance for these visual states. Box shadows are not reliable in forced colors.

Page: `/admin/appearance/settings/default_admin`. Not covered by this run: 200% zoom, real screen readers, a person's keyboard pass.

| Side | State | Sidebar | Border | Shadow | Background | Outline | Border contrast (outside / inside) | Chevron | Outline contrast | Outline clipped | Size | Image |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| before | default | expanded | rgb(184, 193, 208) 1px | no | rgba(0, 0, 0, 0) | none | 1.81:1 / 1.81:1 | 15.54:1 | - | no | 36x36 | [before-default-expanded-closeup.png](before-default-expanded-closeup.png) |
| before | hover | expanded | rgb(184, 193, 208) 1px | no | rgba(0, 0, 0, 0) | none | 1.81:1 / 1.81:1 | 6.82:1 | - | no | 36x36 | [before-hover-expanded-closeup.png](before-hover-expanded-closeup.png) |
| before | focus | expanded | rgb(184, 193, 208) 1px | no | rgba(0, 0, 0, 0) | solid 2px rgb(201, 85, 46) offset 0px | 1.81:1 / 1.81:1 | 15.54:1 | 4.35:1 | no | 36x36 | [before-focus-expanded-closeup.png](before-focus-expanded-closeup.png) |
| before | focus+hover | expanded | rgb(184, 193, 208) 1px | no | rgba(0, 0, 0, 0) | solid 2px rgb(201, 85, 46) offset 0px | 1.81:1 / 1.81:1 | 6.82:1 | 4.35:1 | no | 36x36 | [before-focus+hover-expanded-closeup.png](before-focus+hover-expanded-closeup.png) |
| before | focus | collapsed | rgb(184, 193, 208) 1px | no | rgba(0, 0, 0, 0) | solid 2px rgb(201, 85, 46) offset 0px | 1.81:1 / 1.81:1 | 15.54:1 | 4.35:1 | no | 36x36 | [before-focus-collapsed-closeup.png](before-focus-collapsed-closeup.png) |
| before | focus+hover | collapsed | rgb(184, 193, 208) 1px | no | rgba(0, 0, 0, 0) | solid 2px rgb(201, 85, 46) offset 0px | 1.81:1 / 1.81:1 | 6.82:1 | 4.35:1 | no | 36x36 | [before-focus+hover-collapsed-closeup.png](before-focus+hover-collapsed-closeup.png) |
| before | default | collapsed | rgb(184, 193, 208) 1px | no | rgba(0, 0, 0, 0) | none | 1.81:1 / 1.81:1 | 15.54:1 | - | no | 36x36 | [before-default-collapsed-closeup.png](before-default-collapsed-closeup.png) |
| before | hover | collapsed | rgb(184, 193, 208) 1px | no | rgba(0, 0, 0, 0) | none | 1.81:1 / 1.81:1 | 6.82:1 | - | no | 36x36 | [before-hover-collapsed-closeup.png](before-hover-collapsed-closeup.png) |
| after | default | expanded | rgb(142, 146, 156) 1px | no | rgba(0, 0, 0, 0) | none | 3.11:1 / 3.11:1 | 15.54:1 | - | no | 36x36 | [after-default-expanded-closeup.png](after-default-expanded-closeup.png) |
| after | hover | expanded | lch(35.9519 43.6243 143.82) 1px | yes | rgb(237, 239, 245) | none | 7.51:1 / 6.54:1 | 6.54:1 | - | no | 36x36 | [after-hover-expanded-closeup.png](after-hover-expanded-closeup.png) |
| after | focus | expanded | lch(35.9519 43.6243 143.82) 1px | yes | rgb(237, 239, 245) | solid 2px rgb(28, 125, 79) offset 2px | 7.51:1 / 6.54:1 | 6.54:1 | 5.13:1 | no | 36x36 | [after-focus-expanded-closeup.png](after-focus-expanded-closeup.png) |
| after | focus+hover | expanded | lch(35.9519 43.6243 143.82) 1px | yes | rgb(237, 239, 245) | solid 2px rgb(28, 125, 79) offset 2px | 7.51:1 / 6.54:1 | 6.54:1 | 5.13:1 | no | 36x36 | [after-focus+hover-expanded-closeup.png](after-focus+hover-expanded-closeup.png) |
| after | focus | collapsed | lch(35.9519 43.6243 143.82) 1px | yes | rgb(237, 239, 245) | solid 2px rgb(28, 125, 79) offset 2px | 7.51:1 / 6.54:1 | 6.54:1 | 5.13:1 | no | 36x36 | [after-focus-collapsed-closeup.png](after-focus-collapsed-closeup.png) |
| after | focus+hover | collapsed | lch(35.9519 43.6243 143.82) 1px | yes | rgb(237, 239, 245) | solid 2px rgb(28, 125, 79) offset 2px | 7.51:1 / 6.54:1 | 6.54:1 | 5.13:1 | no | 36x36 | [after-focus+hover-collapsed-closeup.png](after-focus+hover-collapsed-closeup.png) |
| after | default | collapsed | rgb(142, 146, 156) 1px | no | rgba(0, 0, 0, 0) | none | 3.11:1 / 3.11:1 | 15.54:1 | - | no | 36x36 | [after-default-collapsed-closeup.png](after-default-collapsed-closeup.png) |
| after | hover | collapsed | lch(35.9519 43.6243 143.82) 1px | yes | rgb(237, 239, 245) | none | 7.51:1 / 6.54:1 | 6.54:1 | - | no | 36x36 | [after-hover-collapsed-closeup.png](after-hover-collapsed-closeup.png) |

## Checks

- **before**: keyboard reachable: true (17 Tab); Enter collapses: true; focus kept after Enter: true; Space expands: true; emphasis (expanded): {"hoverChangesCircle":false,"focusHasOutline":true,"focusOutlineKeptOnHover":true,"sizeStable":true}; (collapsed): {"hoverChangesCircle":false,"focusHasOutline":true,"focusOutlineKeptOnHover":true,"sizeStable":true}
- **after**: keyboard reachable: true (17 Tab); Enter collapses: true; focus kept after Enter: true; Space expands: true; emphasis (expanded): {"hoverChangesCircle":true,"focusHasOutline":true,"focusOutlineKeptOnHover":true,"sizeStable":true}; (collapsed): {"hoverChangesCircle":true,"focusHasOutline":true,"focusOutlineKeptOnHover":true,"sizeStable":true}

## axe-core (WCAG 2.2 A/AA tags; Before → After violation counts)

- axeFocused: 0 → 0
- axeCollapsed: 0 → 0
- axeDefault: 0 → 0

## Context

| | Before | After |
|---|---|---|
| Core commit | `92e5c3a304 2026-11-18` | `92e5c3a304 2026-11-18` |
| Drupal, PHP | 12.0-dev, 8.5.13 | 12.0-dev, 8.5.13 |
| Profile; default / admin theme (config) | standard; default_admin / default_admin | standard; default_admin / default_admin |
| Theme that rendered each page | /user/1/edit → default_admin<br>/admin/appearance/settings/default_admin → null | /user/1/edit → default_admin<br>/admin/appearance/settings/default_admin → null |
| Languages (default) | none (en) | none (en) |
| Modules only on this side | none | none |
| Enabled modules | 39 | 39 |

CSS build of the After patch stack (core's build:css, separate from accessibility results): **PASS**.

