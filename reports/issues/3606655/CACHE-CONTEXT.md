# Cache-context evaluation — #3606655, MR !16432 @ `170be9e3`

Core `ced1e2636622be0c1197a7cadeba13a7c9bbc8a8` + `3606655-mr16432-170be9e3.patch`. Raw headers:
`tests/http-before.json`, `tests/http-after.json`. Sites: `repro-baseline-3606655` / `repro-issue-3606655`,
both with `http.response.debug_cacheability_headers` enabled.

## What the MR does to cacheability

- `ThemePreprocess::preprocessHtml()` sets `data-color-scheme="auto"` on every page and declares **no**
  cacheability for it.
- The stored preference leaves the server only as a `DrupalColorScheme` cookie. `ColorSchemeCookieSubscriber`
  compares the request's cookie with the account's preference and, **only when they differ**, writes or clears
  the cookie and triggers the page-cache kill switch.
- The `user.color_scheme` cache context is **removed**. The MR's own test asserts its absence
  (`assertNoCacheContext('user.color_scheme')`).

So the design does not vary the page by preference at all. It avoids fragmentation by removing the variation,
not by making it conditional on the theme.

## Observed matrix

| # | Case | Request | `data-color-scheme` | `Set-Cookie` | `X-Drupal-Cache` | `X-Drupal-Dynamic-Cache` | Color-scheme context |
|---|---|---|---|---|---|---|---|
| 1 | Anonymous, new URL | `/user/login?probe=…` | `auto` | none | MISS | MISS/HIT | none |
| 2 | Anonymous, same URL again | same | `auto` | none | **HIT** | MISS/HIT | none |
| 3 | Admin, preference `auto` | `/user` | `auto` | none | UNCACHEABLE (request policy) | HIT | none |
| 4 | Admin, save `dark` | POST `/user/1/edit` | `auto` | `DrupalColorScheme=dark; ... Secure; SameSite=Lax` | UNCACHEABLE (request policy) | UNCACHEABLE (poor cacheability) | none |
| 5 | Admin `dark`, next page | `/user` | `auto` | none (cookie agrees) | UNCACHEABLE (request policy) | **MISS** | none |
| 6 | Admin `dark`, same page again | `/user` | `auto` | none | UNCACHEABLE (request policy) | **HIT** | none |
| 7 | Admin, save `light` / `auto` | POST | `auto` | `light`, then a clearing cookie (`Max-Age=0`) for `auto` | — | — | none |
| 8 | Logout | `/user/logout` | `auto` | cookie cleared | — | — | none |
| 9 | Account `dark` (second user) | `/user/15` | `auto` | none | UNCACHEABLE (request policy) | UNCACHEABLE (poor cacheability) | none |
| 10 | Account `light` (third user) | `/user/16` | `auto` | none | UNCACHEABLE (request policy) | UNCACHEABLE (poor cacheability) | none |
| 11 | Admin route | `/admin/config` | `auto` | none | UNCACHEABLE (request policy) | UNCACHEABLE (response policy) | none |
| 12 | Front theme `stark` (no declaration) | `/user` | `auto` | unchanged | same as 3 | same as 3 | none |
| 13 | Front theme `default_admin` (declares support) | `/user` | `auto` | unchanged | same as 3 | same as 3 | none |

Observed contexts, unchanged by preference or by theme declaration:

- anonymous: `cookies:big_pipe_nojs languages:language_interface route session.exists theme url.path url.query_args user.permissions user.roles:authenticated`
- authenticated front-end page: `cookies:big_pipe_nojs languages:language_interface layout_builder_is_active:user route session theme url.path url.query_args:_wrapper_format url.site user`
- administration route: `cookies:big_pipe_nojs languages:language_interface route session theme url.path url.query_args:_wrapper_format user`

`user` and `user.permissions` are core's own contexts for those routes (the account page is per-account, the
admin route is permission-gated). Neither is added by the color-scheme change, and no `user.color_scheme`
context appears anywhere, including on the profile form.

## Correctness conclusions

- **Two accounts, same preference:** identical contexts and identical HTML; each browser carries its own cookie.
  No extra fragmentation per account is introduced for this feature.
- **Two accounts, different preferences:** also identical contexts and HTML; the difference lives only in each
  browser's cookie.
- **Cached responses and other accounts' preferences:** a response that writes the cookie is made uncacheable by
  the kill switch, so a stored page never carries `Set-Cookie`. The live matrix confirms no `Set-Cookie` on any
  cached response; the MR's `testKillSwitchFiresOnlyOnAMismatch` asserts the same at the DPC-header level
  (the suite passed: 5 tests, 58 assertions).
- **Preference change after a cache entry exists:** the save response is uncacheable and writes the cookie; the
  next request, whose cookie agrees, is a DPC MISS and then a HIT (rows 5–6). The change is reflected because
  the client, not the server, holds the value.
- **Unsupported themes:** they acquire no color-scheme variation, because no page acquires any variation. The
  attribute is still emitted on them, which is a scope decision (see `EVIDENCE.md` F1/F6), not a cache defect.

## Limits

- These are header-level observations from one site, with a single account per preference and no concurrency.
- No hit-rate, entry-count or timing measurement was made, and none is claimed. The host ran 13+ DDEV projects
  during the run, so timings would have been noise.
- Authenticated pages in core are uncacheable at the request-policy level anyway; the DPC headers above are the
  meaningful ones. The anonymous page-cache behaviour was measured directly (rows 1–2).
- The MR's tests cover the fetch path that a browser takes; the live matrix adds the form-driven save, logout
  and theme-switch paths. Neither covers a CDN or an external reverse proxy.
