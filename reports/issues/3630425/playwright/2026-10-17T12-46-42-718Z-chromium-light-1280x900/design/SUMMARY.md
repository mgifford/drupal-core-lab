# Design, theme and print observations

DRAFT. Differences are review candidates, not violations. Theme configuration and stylesheet candidates do not prove the active request theme. ARIA target signatures are not a full accessible-name computation; text hashes can still reveal guessable labels. Use test data.

Variant: 3630425-pinned. Requested preferences: {"contrast":"no-preference","reducedMotion":"no-preference","forcedColors":false,"colorScheme":"light","media":["screen","print"]}.

| # | Page | Account | Actual theme Before | Actual theme After | Screen differences |
|---|---|---|---|---|---|
| 1 | /user/login | anonymous | unknown | unknown | 0 |
| 2 | /user/password | anonymous | unknown | unknown | 0 |
| 3 | /admin/config/system/site-information | administrator | unknown | unknown | 0 |
| 4 | /admin/config/people/accounts | administrator | unknown | unknown | 0 |
| 5 | /admin/content | administrator | unknown | unknown | 0 |
| 6 | /node/add/article | administrator | default_admin | default_admin | 30 |

## Page 1: /user/login

Actual themes not comparable. Account: anonymous.

Before: actual theme unknown; source unavailable. Configured default default_admin; configured admin default_admin. Stylesheet candidates: default_admin (supporting only). Observed preferences: {"prefersContrast":"no-preference","forcedColors":false,"reducedMotion":"no-preference","reducedTransparency":"no-preference","reducedData":null,"darkPreference":false,"themeModeMarkers":[]}

After: actual theme unknown; source unavailable. Configured default default_admin; configured admin default_admin. Stylesheet candidates: default_admin (supporting only). Observed preferences: {"prefersContrast":"no-preference","forcedColors":false,"reducedMotion":"no-preference","reducedTransparency":"no-preference","reducedData":null,"darkPreference":false,"themeModeMarkers":[]}

| Side | Hidden | Revealed | Restyled elements |
|---|---|---|---|
| before | 0 | 0 | 37 |
| after | 0 | 0 | 37 |

Before/after print differences: 0. Counts can overlap and include descendants and inherited styles; they are not unique defects.

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
| before | 0 | 0 | 389 |
| after | 0 | 0 | 389 |

Before/after print differences: 0. Counts can overlap and include descendants and inherited styles; they are not unique defects.

Identifier-only relationship changes: 1 on screen; 1 in print. Kept separately from structural/style differences.

No captured screen differences.

## Page 4: /admin/config/people/accounts

Actual themes not comparable. Account: administrator.

Before: actual theme unknown; source unavailable. Configured default default_admin; configured admin default_admin. Stylesheet candidates: default_admin (supporting only). Observed preferences: {"prefersContrast":"no-preference","forcedColors":false,"reducedMotion":"no-preference","reducedTransparency":"no-preference","reducedData":null,"darkPreference":false,"themeModeMarkers":[]}

After: actual theme unknown; source unavailable. Configured default default_admin; configured admin default_admin. Stylesheet candidates: default_admin (supporting only). Observed preferences: {"prefersContrast":"no-preference","forcedColors":false,"reducedMotion":"no-preference","reducedTransparency":"no-preference","reducedData":null,"darkPreference":false,"themeModeMarkers":[]}

| Side | Hidden | Revealed | Restyled elements |
|---|---|---|---|
| before | 0 | 0 | 605 |
| after | 0 | 0 | 610 |

Before/after print differences: 5. Counts can overlap and include descendants and inherited styles; they are not unique defects.

Identifier-only relationship changes: 1 on screen; 1 in print. Kept separately from structural/style differences.

No captured screen differences.

## Page 5: /admin/content

Actual themes not comparable. Account: administrator.

Before: actual theme unknown; source unavailable. Configured default default_admin; configured admin default_admin. Stylesheet candidates: default_admin (supporting only). Observed preferences: {"prefersContrast":"no-preference","forcedColors":false,"reducedMotion":"no-preference","reducedTransparency":"no-preference","reducedData":null,"darkPreference":false,"themeModeMarkers":[]}

After: actual theme unknown; source unavailable. Configured default default_admin; configured admin default_admin. Stylesheet candidates: default_admin (supporting only). Observed preferences: {"prefersContrast":"no-preference","forcedColors":false,"reducedMotion":"no-preference","reducedTransparency":"no-preference","reducedData":null,"darkPreference":false,"themeModeMarkers":[]}

| Side | Hidden | Revealed | Restyled elements |
|---|---|---|---|
| before | 8 | 0 | 414 |
| after | 8 | 0 | 414 |

Before/after print differences: 0. Counts can overlap and include descendants and inherited styles; they are not unique defects.

Identifier-only relationship changes: 1 on screen; 1 in print. Kept separately from structural/style differences.

No captured screen differences.

## Page 6: /node/add/article

Same reported theme on both sides. Account: administrator.

Before: actual theme default_admin; source drupalSettings. Configured default default_admin; configured admin default_admin. Stylesheet candidates: default_admin, base (supporting only). Observed preferences: {"prefersContrast":"no-preference","forcedColors":false,"reducedMotion":"no-preference","reducedTransparency":"no-preference","reducedData":null,"darkPreference":false,"themeModeMarkers":[]}

After: actual theme default_admin; source drupalSettings. Configured default default_admin; configured admin default_admin. Stylesheet candidates: default_admin, base (supporting only). Observed preferences: {"prefersContrast":"no-preference","forcedColors":false,"reducedMotion":"no-preference","reducedTransparency":"no-preference","reducedData":null,"darkPreference":false,"themeModeMarkers":[]}

| Side | Hidden | Revealed | Restyled elements |
|---|---|---|---|
| before | 0 | 1 | 653 |
| after | 0 | 1 | 654 |

Before/after print differences: 30. Counts can overlap and include descendants and inherited styles; they are not unique defects.

Identifier-only relationship changes: 6 on screen; 6 in print. Kept separately from structural/style differences.

Captured screen differences (first 20):

- html>body:nth-of-type(1)>div:nth-of-type(3)>div:nth-of-type(1)>div:nth-of-type(3)>div:nth-of-type(1)>a:nth-of-type(1): changed; fields style
- html>body:nth-of-type(1)>div:nth-of-type(4)>div:nth-of-type(1)>div:nth-of-type(2)>main:nth-of-type(1)>div:nth-of-type(4)>div:nth-of-type(1)>form:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>table:nth-of-type(1)>thead:nth-of-type(1)>tr:nth-of-type(1)>th:nth-of-type(2): changed; fields semanticText, childTags
- html>body:nth-of-type(1)>div:nth-of-type(4)>div:nth-of-type(1)>div:nth-of-type(2)>main:nth-of-type(1)>div:nth-of-type(4)>div:nth-of-type(1)>form:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(5)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(2)>div:nth-of-type(1)>div:nth-of-type(1)>button:nth-of-type(1): changed; fields references
- html>body:nth-of-type(1)>div:nth-of-type(4)>div:nth-of-type(1)>div:nth-of-type(2)>main:nth-of-type(1)>div:nth-of-type(4)>div:nth-of-type(1)>form:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(5)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(2)>div:nth-of-type(1)>div:nth-of-type(1)>button:nth-of-type(1)>span:nth-of-type(1): unmatched-before; fields unmatched
- html>body:nth-of-type(1)>div:nth-of-type(4)>div:nth-of-type(1)>div:nth-of-type(2)>main:nth-of-type(1)>div:nth-of-type(4)>div:nth-of-type(1)>form:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(5)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(2)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>button:nth-of-type(2): changed; fields references
- #ck-editor__aria-label_e55b57e59eccba7844e710aa990cb0a1e: unmatched-before; fields unmatched
- html>body:nth-of-type(1)>div:nth-of-type(4)>div:nth-of-type(1)>div:nth-of-type(2)>main:nth-of-type(1)>div:nth-of-type(4)>div:nth-of-type(1)>form:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(5)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(2)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(2)>div:nth-of-type(1)>button:nth-of-type(1): changed; fields references
- #ck-editor__aria-label_e4a3c5066d7288ed98cd6d92fc282e638: unmatched-before; fields unmatched
- html>body:nth-of-type(1)>div:nth-of-type(4)>div:nth-of-type(1)>div:nth-of-type(2)>main:nth-of-type(1)>div:nth-of-type(4)>div:nth-of-type(1)>form:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(5)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(2)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(2)>div:nth-of-type(1)>button:nth-of-type(2): changed; fields references
- #ck-editor__aria-label_e750b47e2d38cdce2a900dc30c9f92ee1: unmatched-before; fields unmatched
- html>body:nth-of-type(1)>div:nth-of-type(4)>div:nth-of-type(1)>div:nth-of-type(2)>main:nth-of-type(1)>div:nth-of-type(4)>div:nth-of-type(1)>form:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(5)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(2)>div:nth-of-type(1)>div:nth-of-type(1)>button:nth-of-type(4): changed; fields references
- html>body:nth-of-type(1)>div:nth-of-type(4)>div:nth-of-type(1)>div:nth-of-type(2)>main:nth-of-type(1)>div:nth-of-type(4)>div:nth-of-type(1)>form:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(5)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(2)>div:nth-of-type(1)>div:nth-of-type(1)>button:nth-of-type(4)>span:nth-of-type(1): unmatched-before; fields unmatched
- html>body:nth-of-type(1)>div:nth-of-type(4)>div:nth-of-type(1)>div:nth-of-type(2)>main:nth-of-type(1)>div:nth-of-type(4)>div:nth-of-type(1)>form:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(5)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(2)>div:nth-of-type(1)>div:nth-of-type(1)>button:nth-of-type(6): changed; fields references
- html>body:nth-of-type(1)>div:nth-of-type(4)>div:nth-of-type(1)>div:nth-of-type(2)>main:nth-of-type(1)>div:nth-of-type(4)>div:nth-of-type(1)>form:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(5)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(2)>div:nth-of-type(1)>div:nth-of-type(1)>button:nth-of-type(6)>span:nth-of-type(1): unmatched-before; fields unmatched
- html>body:nth-of-type(1)>div:nth-of-type(4)>div:nth-of-type(1)>div:nth-of-type(2)>main:nth-of-type(1)>div:nth-of-type(4)>div:nth-of-type(1)>form:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(5)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(2)>div:nth-of-type(1)>div:nth-of-type(2)>button:nth-of-type(1): changed; fields references
- #ck-editor__aria-label_e1d350cb87b18980df0143b51d5ca456d: unmatched-before; fields unmatched
- html>body:nth-of-type(1)>div:nth-of-type(7)>div:nth-of-type(1)>div:nth-of-type(2)>div:nth-of-type(1)>div:nth-of-type(1)>button:nth-of-type(1): changed; fields references
- html>body:nth-of-type(1)>div:nth-of-type(7)>div:nth-of-type(1)>div:nth-of-type(2)>div:nth-of-type(1)>div:nth-of-type(1)>button:nth-of-type(1)>span:nth-of-type(1): unmatched-before; fields unmatched
- html>body:nth-of-type(1)>div:nth-of-type(7)>div:nth-of-type(1)>div:nth-of-type(2)>div:nth-of-type(1)>div:nth-of-type(1)>button:nth-of-type(2): changed; fields references
- #ck-editor__aria-label_e66b5dbd6f2caabcacf232d4d2ece492d: unmatched-before; fields unmatched

Curated interaction states:

| State | Screen differences | Print differences | Restyled Before | Restyled After |
|---|---|---|---|---|
| after-add | 35 | 29 | 684 | 684 |
| after-remove | 42 | 35 | 672 | 669 |

## Theme transitions

None observed; unknown theme observations leave gaps.

## Gaps and errors

No page-level errors recorded.

## Coverage

{"maxPages":6,"maxElements":4000,"crawling":false,"discoveryLimit":60,"visited":6,"rejectedLinks":0,"discoveryCapped":false,"queuedNotVisited":0}

## Limitations

Initial loads plus explicitly selected multivalue add/remove scenario; no general focus/invalid-state coverage

No rule violations inferred from appearance differences

Browser theme hint may be unavailable; negotiation reasons are not instrumented

No structural sampling; visited pages only

Forced colours and prefers-contrast are browser emulation, not native OS palettes

DOM element limit and CSSOM access gaps are explicit; no full cascade attribution

GET navigation does not prove arbitrary contrib routes are side-effect-free; use disposable sites and narrow allowlists
