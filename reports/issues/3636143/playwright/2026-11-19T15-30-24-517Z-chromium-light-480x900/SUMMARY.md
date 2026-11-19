# #3636143 navigation toggle evaluation (3636143-latest, light, 480x900)

DRAFT, AI-assisted; a person has not reviewed it. Verdict: mixed; 0 After check(s) not met.

Real pointer hover, focus reached with Tab, Enter and Space for activation. Contrast is measured from rendered colours: the border against the background outside the circle and inside it (the hover background), the chevron against the inside, the focus outline against the outside. The border ratios are a **design objective** (the issue asks for 3:1); the chevron and focus outline ratios relate to WCAG 2.2 1.4.11 Non-text Contrast and 2.4.7 Focus Visible. Nothing here is a conformance claim, and axe-core results below do not establish conformance for these visual states. Box shadows are not reliable in forced colors.

Page: `/admin/appearance/settings/default_admin`. Not covered by this run: 200% zoom, real screen readers, a person's keyboard pass.

| Side | State | Sidebar | Border | Shadow | Background | Outline | Border contrast (outside / inside) | Chevron | Outline contrast | Outline clipped | Size | Image |
|---|---|---|---|---|---|---|---|---|---|---|---|---|


## Checks

- **before**: The toggle is not displayed at 480px (responsive behaviour, not a failure).
- **after**: The toggle is not displayed at 480px (responsive behaviour, not a failure).

## axe-core (WCAG 2.2 A/AA tags; Before → After violation counts)

- axeFocused: n/a → n/a
- axeCollapsed: n/a → n/a
- axeDefault: n/a → n/a

## Context

| | Before | After |
|---|---|---|
| Core commit | `92e5c3a304 2026-11-18` | `92e5c3a304 2026-11-18` |
| Drupal, PHP | 12.0-dev, 8.5.12 | 12.0-dev, 8.5.12 |
| Profile; default / admin theme (config) | standard; default_admin / default_admin | standard; default_admin / default_admin |
| Theme that rendered each page | /user/1/edit → default_admin<br>/admin/appearance/settings/default_admin → null | /user/1/edit → default_admin<br>/admin/appearance/settings/default_admin → null |
| Languages (default) | none (en) | none (en) |
| Modules only on this side | none | none |
| Enabled modules | 39 | 39 |

