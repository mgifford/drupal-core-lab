# Design, theme and print observations

DRAFT. Differences are review candidates, not violations. Theme configuration and stylesheet candidates do not prove the active request theme. ARIA target signatures are not a full accessible-name computation; text hashes can still reveal guessable labels. Use test data.

Variant: 3631337-pinned. Requested preferences: {"contrast":"no-preference","reducedMotion":"no-preference","forcedColors":false,"colorScheme":"light","media":["screen","print"]}.

| # | Page | Account | Actual theme Before | Actual theme After | Screen differences |
|---|---|---|---|---|---|
| 1 | /user/login | anonymous | unknown | unknown | 0 |
| 2 | /user/password | anonymous | unknown | unknown | 0 |
| 3 | /admin/config/system/site-information | administrator | unknown | unknown | 0 |
| 4 | /admin/config/people/accounts | administrator | unknown | unknown | 0 |
| 5 | /admin/content | administrator | unknown | unknown | 0 |

## Page 1: /user/login

Actual themes not comparable. Account: anonymous.

Before: actual theme unknown; source unavailable. Configured default default_admin; configured admin default_admin. Stylesheet candidates: default_admin (supporting only). Observed preferences: {"prefersContrast":"no-preference","forcedColors":false,"reducedMotion":"no-preference","reducedTransparency":"no-preference","reducedData":null,"darkPreference":false,"themeModeMarkers":[]}

After: actual theme unknown; source unavailable. Configured default default_admin; configured admin default_admin. Stylesheet candidates: default_admin (supporting only). Observed preferences: {"prefersContrast":"no-preference","forcedColors":false,"reducedMotion":"no-preference","reducedTransparency":"no-preference","reducedData":null,"darkPreference":false,"themeModeMarkers":[]}

| Side | Hidden | Revealed | Restyled elements |
|---|---|---|---|
| before | 0 | 0 | 38 |
| after | 0 | 0 | 37 |

Before/after print differences: 1. Counts can overlap and include descendants and inherited styles; they are not unique defects.

Identifier-only relationship changes: 0 on screen; 0 in print. Kept separately from structural/style differences.

No captured screen differences.

## Page 2: /user/password

Actual themes not comparable. Account: anonymous.

Before: actual theme unknown; source unavailable. Configured default default_admin; configured admin default_admin. Stylesheet candidates: default_admin (supporting only). Observed preferences: {"prefersContrast":"no-preference","forcedColors":false,"reducedMotion":"no-preference","reducedTransparency":"no-preference","reducedData":null,"darkPreference":false,"themeModeMarkers":[]}

After: actual theme unknown; source unavailable. Configured default default_admin; configured admin default_admin. Stylesheet candidates: default_admin (supporting only). Observed preferences: {"prefersContrast":"no-preference","forcedColors":false,"reducedMotion":"no-preference","reducedTransparency":"no-preference","reducedData":null,"darkPreference":false,"themeModeMarkers":[]}

| Side | Hidden | Revealed | Restyled elements |
|---|---|---|---|
| before | 0 | 0 | 36 |
| after | 0 | 0 | 36 |

Before/after print differences: 0. Counts can overlap and include descendants and inherited styles; they are not unique defects.

Identifier-only relationship changes: 0 on screen; 0 in print. Kept separately from structural/style differences.

No captured screen differences.

## Page 3: /admin/config/system/site-information

Actual themes not comparable. Account: administrator.

Before: actual theme unknown; source unavailable. Configured default default_admin; configured admin default_admin. Stylesheet candidates: default_admin (supporting only). Observed preferences: {"prefersContrast":"no-preference","forcedColors":false,"reducedMotion":"no-preference","reducedTransparency":"no-preference","reducedData":null,"darkPreference":false,"themeModeMarkers":[]}

After: actual theme unknown; source unavailable. Configured default default_admin; configured admin default_admin. Stylesheet candidates: default_admin (supporting only). Observed preferences: {"prefersContrast":"no-preference","forcedColors":false,"reducedMotion":"no-preference","reducedTransparency":"no-preference","reducedData":null,"darkPreference":false,"themeModeMarkers":[]}

| Side | Hidden | Revealed | Restyled elements |
|---|---|---|---|
| before | 0 | 0 | 393 |
| after | 0 | 0 | 393 |

Before/after print differences: 0. Counts can overlap and include descendants and inherited styles; they are not unique defects.

Identifier-only relationship changes: 1 on screen; 1 in print. Kept separately from structural/style differences.

No captured screen differences.

## Page 4: /admin/config/people/accounts

Actual themes not comparable. Account: administrator.

Before: actual theme unknown; source unavailable. Configured default default_admin; configured admin default_admin. Stylesheet candidates: default_admin (supporting only). Observed preferences: {"prefersContrast":"no-preference","forcedColors":false,"reducedMotion":"no-preference","reducedTransparency":"no-preference","reducedData":null,"darkPreference":false,"themeModeMarkers":[]}

After: actual theme unknown; source unavailable. Configured default default_admin; configured admin default_admin. Stylesheet candidates: default_admin (supporting only). Observed preferences: {"prefersContrast":"no-preference","forcedColors":false,"reducedMotion":"no-preference","reducedTransparency":"no-preference","reducedData":null,"darkPreference":false,"themeModeMarkers":[]}

| Side | Hidden | Revealed | Restyled elements |
|---|---|---|---|
| before | 0 | 0 | 609 |
| after | 0 | 0 | 609 |

Before/after print differences: 0. Counts can overlap and include descendants and inherited styles; they are not unique defects.

Identifier-only relationship changes: 1 on screen; 1 in print. Kept separately from structural/style differences.

No captured screen differences.

## Page 5: /admin/content

Actual themes not comparable. Account: administrator.

Before: actual theme unknown; source unavailable. Configured default default_admin; configured admin default_admin. Stylesheet candidates: default_admin (supporting only). Observed preferences: {"prefersContrast":"no-preference","forcedColors":false,"reducedMotion":"no-preference","reducedTransparency":"no-preference","reducedData":null,"darkPreference":false,"themeModeMarkers":[]}

After: actual theme unknown; source unavailable. Configured default default_admin; configured admin default_admin. Stylesheet candidates: default_admin (supporting only). Observed preferences: {"prefersContrast":"no-preference","forcedColors":false,"reducedMotion":"no-preference","reducedTransparency":"no-preference","reducedData":null,"darkPreference":false,"themeModeMarkers":[]}

| Side | Hidden | Revealed | Restyled elements |
|---|---|---|---|
| before | 8 | 0 | 428 |
| after | 8 | 0 | 428 |

Before/after print differences: 0. Counts can overlap and include descendants and inherited styles; they are not unique defects.

Identifier-only relationship changes: 1 on screen; 1 in print. Kept separately from structural/style differences.

No captured screen differences.

## Theme transitions

None observed; unknown theme observations leave gaps.

## Gaps and errors

No page-level errors recorded.

## Coverage

{"maxPages":25,"maxElements":4000,"crawling":false,"discoveryLimit":250,"visited":5,"rejectedLinks":0,"discoveryCapped":false,"queuedNotVisited":0}

## Limitations

Initial loads plus explicitly selected multivalue add/remove scenario; no general focus/invalid-state coverage

No rule violations inferred from appearance differences

Browser theme hint may be unavailable; negotiation reasons are not instrumented

No structural sampling; visited pages only

Forced colours and prefers-contrast are browser emulation, not native OS palettes

DOM element limit and CSSOM access gaps are explicit; no full cascade attribution

GET navigation does not prove arbitrary contrib routes are side-effect-free; use disposable sites and narrow allowlists
