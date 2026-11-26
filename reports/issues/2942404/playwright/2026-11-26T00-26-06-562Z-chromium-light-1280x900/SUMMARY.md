# #2942404 system messages: Variant C (2942404-consolidated, light, 1280x900)

DRAFT, AI-assisted; a person has not reviewed it. Variant C puts ONE region landmark named "System messages" on each default `[data-drupal-messages]` container. The per-type groups keep `role="alert"` for errors and warnings and `role="status"` for other types. Server-rendered warnings are exercised by the all-types fixture (core system_test). The original defect (role="contentinfo") does not reproduce on Before: verdict not-reproduced; 0 After check(s) not met.

The theme in each row is the theme that rendered the page, read from `drupalSettings.labActiveTheme`, not assumed from the URL. The "live / announce" column is what the lab's recorder saw change in live regions or call Drupal.announce() since the previous scenario. It is not what a screen reader says. Not covered: real screen readers, AJAX responses that carry a server-rendered message, BigPipe placeholders (see core's BigPipeMessagesTest), a person's keyboard pass. For the Article form error the browser's own form validation is switched off (script-assisted).

| Side | Scenario | Rendered theme | Message container (role "name") | "System messages" regions | Recorder | axe violations | Image |
|---|---|---|---|---|---|---|---|
| before | article-saved | default_admin | no role | 0 | 1 live / 0 announce | 0 | [before-article-saved.png](before-article-saved.png) |
| before | article-form-error | default_admin | no role | 0 | 1 live / 0 announce | 0 | [before-article-form-error.png](before-article-form-error.png) |
| before | status-admin-cache-cleared | default_admin | no role | 0 | 1 live / 0 announce | 0 | [before-status-admin-cache-cleared.png](before-status-admin-cache-cleared.png) |
| before | js-warning-and-status | default_admin | no role | 0 | 2 live / 3 announce | 0 | [before-js-warning-and-status.png](before-js-warning-and-status.png) |
| before | all-types-fixture | default_admin | no role | 0 | 3 live / 0 announce | 0 | [before-all-types-fixture.png](before-all-types-fixture.png) |
| before | js-next-to-server-messages | default_admin | no role | 0 | 1 live / 1 announce | 0 | [before-js-next-to-server-messages.png](before-js-next-to-server-messages.png) |
| before | empty-state | default_admin | no container | 0 | 0 live / 1 announce | 0 | [before-empty-state.png](before-empty-state.png) |
| before | logged-out-error | default_admin | no role | 0 | 1 live / 0 announce | 0 | [before-logged-out-error.png](before-logged-out-error.png) |
| after | article-saved | default_admin | region "System messages" | 1 | 1 live / 0 announce | 0 | [after-article-saved.png](after-article-saved.png) |
| after | article-form-error | default_admin | region "System messages" | 1 | 1 live / 0 announce | 0 | [after-article-form-error.png](after-article-form-error.png) |
| after | status-admin-cache-cleared | default_admin | region "System messages" | 1 | 1 live / 0 announce | 0 | [after-status-admin-cache-cleared.png](after-status-admin-cache-cleared.png) |
| after | js-warning-and-status | default_admin | region "System messages" | 1 | 2 live / 3 announce | 0 | [after-js-warning-and-status.png](after-js-warning-and-status.png) |
| after | all-types-fixture | default_admin | region "System messages" | 1 | 3 live / 0 announce | 0 | [after-all-types-fixture.png](after-all-types-fixture.png) |
| after | js-next-to-server-messages | default_admin | region "System messages" | 1 | 1 live / 1 announce | 0 | [after-js-next-to-server-messages.png](after-js-next-to-server-messages.png) |
| after | empty-state | default_admin | no container | 0 | 0 live / 1 announce | 0 | [after-empty-state.png](after-empty-state.png) |
| after | logged-out-error | default_admin | region "System messages" | 1 | 1 live / 0 announce | 0 | [after-logged-out-error.png](after-logged-out-error.png) |

## Acceptance checks

- **before**: noContentinfoInMessages: true; everyBlockIsOrContainsALiveRegion: true; everyBlockIsNamed: true; errorIsAlert: true; noMessageBlockHasTwoLiveRegions: true; noNestedLiveRegions: true; emptyStateHasNoMessageLandmark: true; javascriptMessagesDoNotMoveFocus: true; allThreeTypesHaveTheirOwnGroup: true; groupsKeepTheirHeadings: true; serverWarningKeepsAlert: true; javascriptOnlyMessagesHaveLandmark: false; mixedMessagesHaveOneLandmark: false; javascriptMessageNotNestedInAnotherLiveRegion: true; oneConsolidatedLandmarkOnServerPages: false; constructedWithoutMessagesHasNoLandmark: true; firstAddCreatesLandmark: false; repeatedAddsKeepOneLandmark: false; removeOneKeepsLandmark: false; clearRemovesLandmark: true; addAfterClearRestoresLandmark: false; customWrapperUnchanged: true; contextualWrapperInsideContainerUnchanged: true; authorSemanticsPreserved: true; messageAddsDoNotMoveFocus: true; themeRecorded: true
- **after**: noContentinfoInMessages: true; everyBlockIsOrContainsALiveRegion: true; everyBlockIsNamed: true; errorIsAlert: true; noMessageBlockHasTwoLiveRegions: true; noNestedLiveRegions: true; emptyStateHasNoMessageLandmark: true; javascriptMessagesDoNotMoveFocus: true; allThreeTypesHaveTheirOwnGroup: true; groupsKeepTheirHeadings: true; serverWarningKeepsAlert: true; javascriptOnlyMessagesHaveLandmark: true; mixedMessagesHaveOneLandmark: true; javascriptMessageNotNestedInAnotherLiveRegion: true; oneConsolidatedLandmarkOnServerPages: true; constructedWithoutMessagesHasNoLandmark: true; firstAddCreatesLandmark: true; repeatedAddsKeepOneLandmark: true; removeOneKeepsLandmark: true; clearRemovesLandmark: true; addAfterClearRestoresLandmark: true; customWrapperUnchanged: true; contextualWrapperInsideContainerUnchanged: true; authorSemanticsPreserved: true; messageAddsDoNotMoveFocus: true; themeRecorded: true

## Drupal.Message lifecycle

| Step | Container role | Accessible name | System messages regions | Focus |
|---|---|---|---|---|
| empty-message-container | none |  | 0 | body |
| construct-only | none |  | 0 | body |
| first-add | region | System messages | 1 | body |
| second-add | region | System messages | 1 | body |
| remove-one | region | System messages | 1 | body |
| clear-all | none |  | 0 | body |
| add-after-clear | region | System messages | 1 | body |
| contextual-outside | none |  | 0 | body |
| contextual-inside | none |  | 0 | body |
| author-semantics | region | Author-defined messages | 0 | body |

## Duplicate IDs

- **article-saved**: Before 0, After 0; identical set
- **article-form-error**: Before 0, After 0; identical set
- **status-admin-cache-cleared**: Before 0, After 0; identical set
- **js-warning-and-status**: Before 6, After 6; identical set
  - `view-title-table-column` ×2: <th class="sortable-heading views-field views-field-title">, <th class="sortable-heading views-field views-field-title">
  - `view-type-table-column` ×2: <th class="sortable-heading views-field views-field-type">, <th class="sortable-heading views-field views-field-type">
  - `view-name-table-column` ×2: <th class="priority-low views-field views-field-name">, <th class="priority-low views-field views-field-name">
  - `view-status-table-column` ×2: <th class="sortable-heading views-field views-field-status">, <th class="sortable-heading views-field views-field-status">
  - `view-changed-table-column` ×2: <th class="priority-low sortable-heading views-field views-field-changed is-active">, <th class="priority-low sortable-heading views-field views-field-changed is-active">
  - `view-operations-table-column` ×2: <th class="views-field views-field-operations">, <th class="views-field views-field-operations">
- **all-types-fixture**: Before 0, After 0; identical set
- **js-next-to-server-messages**: Before 0, After 0; identical set
- **empty-state**: Before 6, After 6; identical set
  - `view-title-table-column` ×2: <th class="sortable-heading views-field views-field-title">, <th class="sortable-heading views-field views-field-title">
  - `view-type-table-column` ×2: <th class="sortable-heading views-field views-field-type">, <th class="sortable-heading views-field views-field-type">
  - `view-name-table-column` ×2: <th class="priority-low views-field views-field-name">, <th class="priority-low views-field views-field-name">
  - `view-status-table-column` ×2: <th class="sortable-heading views-field views-field-status">, <th class="sortable-heading views-field views-field-status">
  - `view-changed-table-column` ×2: <th class="priority-low sortable-heading views-field views-field-changed is-active">, <th class="priority-low sortable-heading views-field views-field-changed is-active">
  - `view-operations-table-column` ×2: <th class="views-field views-field-operations">, <th class="views-field views-field-operations">
- **logged-out-error**: Before 0, After 0; identical set

## Design facts

- **before**: message region landmarks per scenario 0 / 0 / 0 / 0; JavaScript message roles: alert "Warning message"; server warning: alert; themes: /node/3 → default_admin; /node/add/article → default_admin; /admin/config/development/performance → default_admin; /system-test/status-messages-for-assertions → default_admin; /user/login → default_admin; /admin/content → default_admin
- **after**: message region landmarks per scenario 1 / 1 / 1 / 1; JavaScript message roles: alert "Warning message"; server warning: alert; themes: /node/1 → default_admin; /node/add/article → default_admin; /admin/config/development/performance → default_admin; /system-test/status-messages-for-assertions → default_admin; /user/login → default_admin; /admin/content → default_admin

## axe-core (WCAG 2.2 A/AA tags; violation counts per scenario, Before → After)

- article-saved: 0 → 0
- article-form-error: 0 → 0
- status-admin-cache-cleared: 0 → 0
- js-warning-and-status: 0 → 0
- all-types-fixture: 0 → 0
- js-next-to-server-messages: 0 → 0
- empty-state: 0 → 0
- logged-out-error: 0 → 0

## Context

| | Before | After |
|---|---|---|
| Core commit | `0387fb94 2026-11-25` | `0387fb94 2026-11-25` |
| Drupal, PHP | 12.0-dev, 8.5.7 | 12.0-dev, 8.5.7 |
| Profile; default / admin theme (config) | standard; default_admin / default_admin | standard; default_admin / default_admin |
| Theme that rendered each page | /user/1/edit → default_admin<br>/node/add/article → default_admin<br>/node/3 → default_admin<br>/admin/config/development/performance → null<br>/admin/config/development/performance → default_admin<br>/admin/content → default_admin<br>/system-test/status-messages-for-assertions → default_admin<br>/user/login → null<br>/admin/content → null | /user/1/edit → default_admin<br>/node/add/article → default_admin<br>/node/1 → default_admin<br>/admin/config/development/performance → default_admin<br>/admin/content → default_admin<br>/system-test/status-messages-for-assertions → default_admin<br>/user/login → null<br>/admin/content → null |
| Languages (default) | none (en) | none (en) |
| Modules only on this side | none | none |
| Enabled modules | 41 | 41 |

