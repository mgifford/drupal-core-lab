# #3636143 navigation toggle evaluation (3636143-latest, dark, forced colors, 1280x900)

DRAFT, AI-assisted; a person has not reviewed it. Verdict: not-reproduced; 0 After check(s) not met.

Real pointer hover, focus reached with Tab, Enter and Space for activation. Contrast is measured from rendered colours: the border against the background outside the circle and inside it (the hover background), the chevron against the inside, the focus outline against the outside. The border ratios are a **design objective** (the issue asks for 3:1); the chevron and focus outline ratios relate to WCAG 2.2 1.4.11 Non-text Contrast and 2.4.7 Focus Visible. Nothing here is a conformance claim, and axe-core results below do not establish conformance for these visual states. Box shadows are not reliable in forced colors.

Page: `/admin/appearance/settings/default_admin`. Not covered by this run: 200% zoom, real screen readers, a person's keyboard pass.

| Side | State | Sidebar | Border | Shadow | Background | Outline | Border contrast (outside / inside) | Chevron | Outline contrast | Outline clipped | Size | Image |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| before | default | expanded | rgb(255, 255, 255) 1px | no | rgba(0, 0, 0, 0) | none | 21:1 / 21:1 | 21:1 | - | no | 36x36 | [before-default-expanded-closeup.png](before-default-expanded-closeup.png) |
| before | hover | expanded | rgba(26, 235, 255, 0.8) 1px | no | rgba(0, 0, 0, 0) | none | 14.37:1 / 14.37:1 | 21:1 | - | no | 36x36 | [before-hover-expanded-closeup.png](before-hover-expanded-closeup.png) |
| before | focus | expanded | rgba(26, 235, 255, 0.8) 1px | no | rgba(0, 0, 0, 0) | solid 2px rgba(26, 235, 255, 0.8) offset 0px | 14.37:1 / 14.37:1 | 21:1 | 14.37:1 | no | 36x36 | [before-focus-expanded-closeup.png](before-focus-expanded-closeup.png) |
| before | focus+hover | expanded | rgba(26, 235, 255, 0.8) 1px | no | rgba(0, 0, 0, 0) | solid 2px rgba(26, 235, 255, 0.8) offset 0px | 14.37:1 / 14.37:1 | 21:1 | 14.37:1 | no | 36x36 | [before-focus+hover-expanded-closeup.png](before-focus+hover-expanded-closeup.png) |
| before | focus | collapsed | rgba(26, 235, 255, 0.8) 1px | no | rgba(0, 0, 0, 0) | solid 2px rgba(26, 235, 255, 0.8) offset 0px | 14.37:1 / 14.37:1 | 21:1 | 14.37:1 | no | 36x36 | [before-focus-collapsed-closeup.png](before-focus-collapsed-closeup.png) |
| before | focus+hover | collapsed | rgba(26, 235, 255, 0.8) 1px | no | rgba(0, 0, 0, 0) | solid 2px rgba(26, 235, 255, 0.8) offset 0px | 14.37:1 / 14.37:1 | 21:1 | 14.37:1 | no | 36x36 | [before-focus+hover-collapsed-closeup.png](before-focus+hover-collapsed-closeup.png) |
| before | default | collapsed | rgb(255, 255, 255) 1px | no | rgba(0, 0, 0, 0) | none | 21:1 / 21:1 | 21:1 | - | no | 36x36 | [before-default-collapsed-closeup.png](before-default-collapsed-closeup.png) |
| before | hover | collapsed | rgba(26, 235, 255, 0.8) 1px | no | rgba(0, 0, 0, 0) | none | 14.37:1 / 14.37:1 | 21:1 | - | no | 36x36 | [before-hover-collapsed-closeup.png](before-hover-collapsed-closeup.png) |
| after | default | expanded | rgb(255, 255, 255) 1px | no | rgba(0, 0, 0, 0) | none | 21:1 / 21:1 | 21:1 | - | no | 36x36 | [after-default-expanded-closeup.png](after-default-expanded-closeup.png) |
| after | hover | expanded | rgba(26, 235, 255, 0.8) 1px | no | rgb(0, 0, 0) | solid 2px rgba(26, 235, 255, 0.8) offset -3px | 14.37:1 / 14.37:1 | 21:1 | 14.37:1 | no | 36x36 | [after-hover-expanded-closeup.png](after-hover-expanded-closeup.png) |
| after | focus | expanded | rgba(26, 235, 255, 0.8) 1px | no | rgb(0, 0, 0) | solid 2px rgba(26, 235, 255, 0.8) offset 2px | 14.37:1 / 14.37:1 | 21:1 | 14.37:1 | no | 36x36 | [after-focus-expanded-closeup.png](after-focus-expanded-closeup.png) |
| after | focus+hover | expanded | rgba(26, 235, 255, 0.8) 1px | no | rgb(0, 0, 0) | solid 2px rgba(26, 235, 255, 0.8) offset 2px | 14.37:1 / 14.37:1 | 21:1 | 14.37:1 | no | 36x36 | [after-focus+hover-expanded-closeup.png](after-focus+hover-expanded-closeup.png) |
| after | focus | collapsed | rgba(26, 235, 255, 0.8) 1px | no | rgb(0, 0, 0) | solid 2px rgba(26, 235, 255, 0.8) offset 2px | 14.37:1 / 14.37:1 | 21:1 | 14.37:1 | no | 36x36 | [after-focus-collapsed-closeup.png](after-focus-collapsed-closeup.png) |
| after | focus+hover | collapsed | rgba(26, 235, 255, 0.8) 1px | no | rgb(0, 0, 0) | solid 2px rgba(26, 235, 255, 0.8) offset 2px | 14.37:1 / 14.37:1 | 21:1 | 14.37:1 | no | 36x36 | [after-focus+hover-collapsed-closeup.png](after-focus+hover-collapsed-closeup.png) |
| after | default | collapsed | rgb(255, 255, 255) 1px | no | rgba(0, 0, 0, 0) | none | 21:1 / 21:1 | 21:1 | - | no | 36x36 | [after-default-collapsed-closeup.png](after-default-collapsed-closeup.png) |
| after | hover | collapsed | rgba(26, 235, 255, 0.8) 1px | no | rgb(0, 0, 0) | solid 2px rgba(26, 235, 255, 0.8) offset -3px | 14.37:1 / 14.37:1 | 21:1 | 14.37:1 | no | 36x36 | [after-hover-collapsed-closeup.png](after-hover-collapsed-closeup.png) |

## Checks

- **before**: keyboard reachable: true (17 Tab); Enter collapses: true; focus kept after Enter: true; Space expands: true; emphasis (expanded): {"hoverChangesCircle":true,"focusHasOutline":true,"focusOutlineKeptOnHover":true,"sizeStable":true}; (collapsed): {"hoverChangesCircle":true,"focusHasOutline":true,"focusOutlineKeptOnHover":true,"sizeStable":true}
- **after**: keyboard reachable: true (17 Tab); Enter collapses: true; focus kept after Enter: true; Space expands: true; emphasis (expanded): {"hoverChangesCircle":true,"focusHasOutline":true,"focusOutlineKeptOnHover":true,"sizeStable":true}; (collapsed): {"hoverChangesCircle":true,"focusHasOutline":true,"focusOutlineKeptOnHover":true,"sizeStable":true}

## axe-core (WCAG 2.2 A/AA tags; Before → After violation counts)

- axeFocused: 2 → 2
- axeCollapsed: 2 → 2
- axeDefault: 2 → 2

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

