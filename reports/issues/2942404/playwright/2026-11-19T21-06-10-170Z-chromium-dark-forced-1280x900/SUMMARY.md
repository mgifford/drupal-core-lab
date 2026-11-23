# #2942404 system messages: options on main (2942404-latest, dark, forced colors, 1280x900)

DRAFT, AI-assisted; a person has not reviewed it. This compares two designs; it is not a defect test. The original problem (role="contentinfo") does not reproduce on Before (current main): verdict not-reproduced; 0 After check(s) not met.

Before: each message block is itself the live region (error and warning: alert; other types: status), no landmark. After: a region landmark per message type with an inner alert (error) or status (status and warning). The "live / announce" column is what the lab's recorder saw change in live regions or call Drupal.announce() since the previous scenario. It is not what a screen reader says. Not covered: real screen readers, AJAX-delivered server messages, BigPipe placeholders, a person's keyboard pass. For the Article form error the browser's own form validation is switched off (script-assisted).

| Side | Scenario | Message blocks (role "name" > inner live regions) | Region landmarks in messages | Recorder | axe violations | Image |
|---|---|---|---|---|---|---|
| before | article-saved-frontend | div > status "Status message" | 0 | 1 live / 0 announce | 2 | [before-article-saved-frontend.png](before-article-saved-frontend.png) |
| before | article-form-error-admin | div > alert "Error message" | 0 | 1 live / 0 announce | 1 | [before-article-form-error-admin.png](before-article-form-error-admin.png) |
| before | status-admin-cache-cleared | div > status "Status message" | 0 | 1 live / 0 announce | 1 | [before-status-admin-cache-cleared.png](before-status-admin-cache-cleared.png) |
| before | js-warning-and-status | div > alert "Warning message", status "Status message" | 0 | 2 live / 3 announce | 2 | [before-js-warning-and-status.png](before-js-warning-and-status.png) |
| before | server-error-frontend | div > alert "Error message" | 0 | 1 live / 0 announce | 1 | [before-server-error-frontend.png](before-server-error-frontend.png) |
| after | article-saved-frontend | div > region "Status message", status | 1 | 1 live / 0 announce | 2 | [after-article-saved-frontend.png](after-article-saved-frontend.png) |
| after | article-form-error-admin | div > region "Error message", alert | 1 | 1 live / 0 announce | 1 | [after-article-form-error-admin.png](after-article-form-error-admin.png) |
| after | status-admin-cache-cleared | div > region "Status message", status | 1 | 1 live / 0 announce | 1 | [after-status-admin-cache-cleared.png](after-status-admin-cache-cleared.png) |
| after | js-warning-and-status | div > alert "Warning message", status "Status message" | 0 | 2 live / 3 announce | 2 | [after-js-warning-and-status.png](after-js-warning-and-status.png) |
| after | server-error-frontend | div > region "Error message", alert | 1 | 1 live / 0 announce | 1 | [after-server-error-frontend.png](after-server-error-frontend.png) |

## Checks

- **before**: noContentinfoInMessages: true; everyBlockIsOrContainsALiveRegion: true; everyBlockIsNamed: true; errorIsAlert: true; noMessageBlockHasTwoLiveRegions: true
- **after**: noContentinfoInMessages: true; everyBlockIsOrContainsALiveRegion: true; everyBlockIsNamed: true; errorIsAlert: true; noMessageBlockHasTwoLiveRegions: true

## Design facts

- **before**: message region landmarks per scenario 0 / 0 / 0 / 0; JavaScript message roles: alert "Warning message"; server warning: not exercised (no server-rendered warning on a stock page); main uses alert, the option uses status
- **after**: message region landmarks per scenario 1 / 1 / 1 / 1; JavaScript message roles: alert "Warning message"; server warning: not exercised (no server-rendered warning on a stock page); main uses alert, the option uses status

## axe-core (WCAG 2.2 A/AA tags; violation counts per scenario, Before → After)

- article-saved-frontend: 2 → 2 (After rules: color-contrast 2)
- article-form-error-admin: 1 → 1 (After rules: color-contrast 1)
- status-admin-cache-cleared: 1 → 1 (After rules: color-contrast 1)
- server-error-frontend: 1 → 1 (After rules: color-contrast 1)
- js-warning-and-status: 2 → 2 (After rules: color-contrast 2)

## Context

| | Before | After |
|---|---|---|
| Core commit | `92e5c3a304 2026-11-18` | `92e5c3a304 2026-11-18` |
| Drupal, PHP | 12.0-dev, 8.5.12 | 12.0-dev, 8.5.12 |
| Profile; default / admin theme (config) | standard; default_admin / default_admin | standard; default_admin / default_admin |
| Theme that rendered each page | /user/1/edit → default_admin<br>/node/add/article → default_admin<br>/node/4 → default_admin<br>/admin/config/development/performance → null<br>/admin/config/development/performance → default_admin<br>/admin/content → default_admin<br>/user/login → null | /user/1/edit → default_admin<br>/node/add/article → default_admin<br>/node/4 → default_admin<br>/admin/config/development/performance → null<br>/admin/config/development/performance → default_admin<br>/admin/content → default_admin<br>/user/login → null |
| Languages (default) | none (en) | none (en) |
| Modules only on this side | none | none |
| Enabled modules | 39 | 39 |

