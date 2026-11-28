# Design, theme and print observations

DRAFT. Differences are review candidates, not violations. Theme configuration and stylesheet candidates do not prove the active request theme. ARIA target signatures are not a full accessible-name computation; text hashes can still reveal guessable labels. Use test data.

Variant: 3631337-pinned. Requested preferences: {"contrast":"more","reducedMotion":"no-preference","forcedColors":true,"colorScheme":"dark","media":["screen","print"]}.

| # | Page | Account | Actual theme Before | Actual theme After | Screen differences |
|---|---|---|---|---|---|
| 1 | /user/login | anonymous | unknown | unknown | 0 |
| 2 | /user/password | anonymous | unknown | unknown | 0 |
| 3 | /admin/config/system/site-information | administrator | unknown | unknown | 0 |
| 4 | /admin/config/people/accounts | administrator | unknown | unknown | 0 |
| 5 | /admin/content | administrator | unknown | unknown | 0 |

## Page 1: /user/login

Actual themes not comparable. Account: anonymous.

Before: actual theme unknown; source unavailable. Configured default default_admin; configured admin default_admin. Stylesheet candidates: default_admin (supporting only). Observed preferences: {"prefersContrast":"more","forcedColors":true,"reducedMotion":"no-preference","reducedTransparency":"no-preference","reducedData":null,"darkPreference":true,"themeModeMarkers":["dark-mode"]}

After: actual theme unknown; source unavailable. Configured default default_admin; configured admin default_admin. Stylesheet candidates: default_admin (supporting only). Observed preferences: {"prefersContrast":"more","forcedColors":true,"reducedMotion":"no-preference","reducedTransparency":"no-preference","reducedData":null,"darkPreference":true,"themeModeMarkers":["dark-mode"]}

| Side | Hidden | Revealed | Restyled elements |
|---|---|---|---|
| before | 0 | 0 | 6 |
| after | 0 | 0 | 6 |

Before/after print differences: 0. Counts can overlap and include descendants and inherited styles; they are not unique defects.

Identifier-only relationship changes: 0 on screen; 0 in print. Kept separately from structural/style differences.

No captured screen differences.

## Page 2: /user/password

Actual themes not comparable. Account: anonymous.

Before: actual theme unknown; source unavailable. Configured default default_admin; configured admin default_admin. Stylesheet candidates: default_admin (supporting only). Observed preferences: {"prefersContrast":"more","forcedColors":true,"reducedMotion":"no-preference","reducedTransparency":"no-preference","reducedData":null,"darkPreference":true,"themeModeMarkers":["dark-mode"]}

After: actual theme unknown; source unavailable. Configured default default_admin; configured admin default_admin. Stylesheet candidates: default_admin (supporting only). Observed preferences: {"prefersContrast":"more","forcedColors":true,"reducedMotion":"no-preference","reducedTransparency":"no-preference","reducedData":null,"darkPreference":true,"themeModeMarkers":["dark-mode"]}

| Side | Hidden | Revealed | Restyled elements |
|---|---|---|---|
| before | 0 | 0 | 6 |
| after | 0 | 0 | 6 |

Before/after print differences: 0. Counts can overlap and include descendants and inherited styles; they are not unique defects.

Identifier-only relationship changes: 0 on screen; 0 in print. Kept separately from structural/style differences.

No captured screen differences.

## Page 3: /admin/config/system/site-information

Actual themes not comparable. Account: administrator.

Before: actual theme unknown; source unavailable. Configured default default_admin; configured admin default_admin. Stylesheet candidates: default_admin (supporting only). Observed preferences: {"prefersContrast":"more","forcedColors":true,"reducedMotion":"no-preference","reducedTransparency":"no-preference","reducedData":null,"darkPreference":true,"themeModeMarkers":["dark-mode"]}

After: actual theme unknown; source unavailable. Configured default default_admin; configured admin default_admin. Stylesheet candidates: default_admin (supporting only). Observed preferences: {"prefersContrast":"more","forcedColors":true,"reducedMotion":"no-preference","reducedTransparency":"no-preference","reducedData":null,"darkPreference":true,"themeModeMarkers":["dark-mode"]}

| Side | Hidden | Revealed | Restyled elements |
|---|---|---|---|
| before | 0 | 0 | 97 |
| after | 0 | 0 | 97 |

Before/after print differences: 0. Counts can overlap and include descendants and inherited styles; they are not unique defects.

Identifier-only relationship changes: 1 on screen; 1 in print. Kept separately from structural/style differences.

No captured screen differences.

## Page 4: /admin/config/people/accounts

Actual themes not comparable. Account: administrator.

Before: actual theme unknown; source unavailable. Configured default default_admin; configured admin default_admin. Stylesheet candidates: default_admin (supporting only). Observed preferences: {"prefersContrast":"more","forcedColors":true,"reducedMotion":"no-preference","reducedTransparency":"no-preference","reducedData":null,"darkPreference":true,"themeModeMarkers":["dark-mode"]}

After: actual theme unknown; source unavailable. Configured default default_admin; configured admin default_admin. Stylesheet candidates: default_admin (supporting only). Observed preferences: {"prefersContrast":"more","forcedColors":true,"reducedMotion":"no-preference","reducedTransparency":"no-preference","reducedData":null,"darkPreference":true,"themeModeMarkers":["dark-mode"]}

| Side | Hidden | Revealed | Restyled elements |
|---|---|---|---|
| before | 0 | 0 | 139 |
| after | 0 | 0 | 139 |

Before/after print differences: 0. Counts can overlap and include descendants and inherited styles; they are not unique defects.

Identifier-only relationship changes: 1 on screen; 1 in print. Kept separately from structural/style differences.

No captured screen differences.

## Page 5: /admin/content

Actual themes not comparable. Account: administrator.

Before: actual theme unknown; source unavailable. Configured default default_admin; configured admin default_admin. Stylesheet candidates: default_admin (supporting only). Observed preferences: {"prefersContrast":"more","forcedColors":true,"reducedMotion":"no-preference","reducedTransparency":"no-preference","reducedData":null,"darkPreference":true,"themeModeMarkers":["dark-mode"]}

After: actual theme unknown; source unavailable. Configured default default_admin; configured admin default_admin. Stylesheet candidates: default_admin (supporting only). Observed preferences: {"prefersContrast":"more","forcedColors":true,"reducedMotion":"no-preference","reducedTransparency":"no-preference","reducedData":null,"darkPreference":true,"themeModeMarkers":["dark-mode"]}

| Side | Hidden | Revealed | Restyled elements |
|---|---|---|---|
| before | 8 | 0 | 114 |
| after | 8 | 0 | 114 |

Before/after print differences: 0. Counts can overlap and include descendants and inherited styles; they are not unique defects.

Identifier-only relationship changes: 1 on screen; 1 in print. Kept separately from structural/style differences.

No captured screen differences.

## Theme transitions

None observed; unknown theme observations leave gaps.

## Gaps and errors

No page-level errors recorded.

## Coverage

{"maxPages":20,"maxElements":4000,"crawling":false,"discoveryLimit":200,"visited":5,"rejectedLinks":0,"discoveryCapped":false,"queuedNotVisited":0}

## Limitations

Initial loads plus explicitly selected multivalue add/remove scenario; no general focus/invalid-state coverage

No rule violations inferred from appearance differences

Browser theme hint may be unavailable; negotiation reasons are not instrumented

No structural sampling; visited pages only

Forced colours and prefers-contrast are browser emulation, not native OS palettes

DOM element limit and CSSOM access gaps are explicit; no full cascade attribution

GET navigation does not prove arbitrary contrib routes are side-effect-free; use disposable sites and narrow allowlists
