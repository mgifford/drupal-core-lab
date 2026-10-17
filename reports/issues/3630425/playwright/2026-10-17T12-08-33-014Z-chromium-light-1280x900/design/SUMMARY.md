# Design, theme and print observations

DRAFT. Differences are review candidates, not violations.

Variant: 3630425-pinned. Requested prefers-contrast: no-preference; reduced motion: no-preference; forced colours: false; colour scheme: light.

| # | Page | Account | Before theme | After theme | Theme comparison | Screen differences | Observed modes B | Observed modes A | Hidden in print B | Hidden in print A | Revealed in print B | Revealed in print A |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | /user/login | anonymous | unknown | unknown | not compared | 0 | {"contrast":"no-preference","forced":false,"motion":"no-preference","transparency":"no-preference","data":null,"markers":[]} | {"contrast":"no-preference","forced":false,"motion":"no-preference","transparency":"no-preference","data":null,"markers":[]} | 0 | 0 | 0 | 0 |
| 2 | /user/password | anonymous | unknown | unknown | not compared | 0 | {"contrast":"no-preference","forced":false,"motion":"no-preference","transparency":"no-preference","data":null,"markers":[]} | {"contrast":"no-preference","forced":false,"motion":"no-preference","transparency":"no-preference","data":null,"markers":[]} | 0 | 0 | 0 | 0 |
| 3 | /admin/config/system/site-information | administrator | default_admin | default_admin | same theme | 1 | {"contrast":"no-preference","forced":false,"motion":"no-preference","transparency":"no-preference","data":null,"markers":[]} | {"contrast":"no-preference","forced":false,"motion":"no-preference","transparency":"no-preference","data":null,"markers":[]} | 0 | 0 | 0 | 0 |
| 4 | /admin/config/people/accounts | administrator | default_admin | default_admin | same theme | 1 | {"contrast":"no-preference","forced":false,"motion":"no-preference","transparency":"no-preference","data":null,"markers":[]} | {"contrast":"no-preference","forced":false,"motion":"no-preference","transparency":"no-preference","data":null,"markers":[]} | 0 | 0 | 0 | 0 |
| 5 | /admin/content | administrator | default_admin | default_admin | same theme | 1 | {"contrast":"no-preference","forced":false,"motion":"no-preference","transparency":"no-preference","data":null,"markers":[]} | {"contrast":"no-preference","forced":false,"motion":"no-preference","transparency":"no-preference","data":null,"markers":[]} | 8 | 8 | 0 | 0 |

## Configured theme settings (request/user overrides may differ)

{"before":{"default_admin":{"enable_dark_mode":"auto","high_contrast_mode":false,"layout_density":"default"}},"after":{"default_admin":{"enable_dark_mode":"auto","high_contrast_mode":false,"layout_density":"default"}}}

## Theme transitions during navigation

None observed (not proof of a single-theme site).

## Gaps and errors

No page-level errors recorded. See limitations and element caps in JSON.

## Coverage

{"maxPages":5,"maxElements":4000,"crawling":false,"discoveryLimit":50,"visited":5,"rejectedLinks":0,"discoveryCapped":false,"queuedNotVisited":0}

Inspect observations.json for per-element screen/print removals, additions, restyling, pseudo-element borders, observed media values and CSSOM gaps.

Initial page loads only; no authored AJAX/focus/invalid states

No rule violations inferred from appearance differences

Browser theme hint may be unavailable; negotiation reasons are not instrumented

No structural sampling; visited pages only

Forced colours and prefers-contrast are browser emulation, not native OS palettes

DOM element limit and CSSOM access gaps are explicit; no full cascade attribution

GET navigation does not prove arbitrary contrib routes are side-effect-free; use disposable sites and narrow allowlists
