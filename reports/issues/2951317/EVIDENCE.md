# Evidence for #2951317

DRAFT. Updated October 17, 2026 from evidence supplied by Mike. This supersedes the earlier preparation-only narrative; no new Drupal run was performed by the assistant.

| Identity | Value |
|---|---|
| Core, both sides | `ad11ba71c0f09b856e45dfdb8db155b5a588712d` |
| MR tip | `ab7ab046f920f7a5a29704888976e56b6a36514a` |
| Shared fixture SHA-256 | `0b6ee870ae17a6caa52004ca3d60e90b592d43039cb18557b508f8eb7b945b27` |
| MR patch SHA-256 | `27550bbdd14990cfe34b3180fe9ccd49472ccb9ab93d4d795b394f0f01d39f28` |
| Original run environment | Chromium 156.0.8078.4, darwin arm64, light, 1280×900; Drupal 12.0-dev, PHP 8.5.8 |
| Site configuration | Standard; default and admin theme configured as default_admin; 40 identical enabled modules |

## Reviewed runs

1. Original 17:15 UTC run: verified patch footprints and no undeclared core edits. Ten checks passed; the native-submission row failed. Input invalidity alone did not establish blocked submission, and staying on the same URL did not establish absence of a POST. Every captured stage reported zero axe violations and neither side recorded JavaScript errors.
2. Corrected summary at 17:21:34 UTC: eleven applicable checks passed, native-blocking row not applicable; native validation disabled on both sides, one After POST, acceptance message present. The mixed verdict is retained for the native-validation coverage gap. The corrected full JSON has not been supplied, so its complete state and error records have not been independently reviewed.

The MR moves required attributes to inputs, exposes radiogroups, preserves selections, hides/shows None, marks hidden selected None invalid while required, clears custom invalidity for a real choice, and preserves optional/default controls in the reviewed scenario. One legend marker and no option markers were recorded.

See [received/2026-10-17/README.md](received/2026-10-17/README.md) for original copies and their provenance. Do not overwrite the original failed run; annotate its incorrect test assumption when reconciling the laptop's reports.

## Limits

- Native HTML5 validation is disabled by default in pinned core: FormPreprocess::preprocessForm() sets novalidate unless enable_html5_validation is true. The test fixture has no server enforcement for dynamic #states. Invalid input state does not guarantee submission blocking.
- Rendered-theme capture returned null on this fixture route, despite default_admin site configuration and appearance. The configured theme is not proof of a page-level theme signal. Fix that instrumentation separately.
- No person-led keyboard log or synthetic Guidepup comparison was supplied. No screen-reader speech is established by an empty announcement log or an accessibility snapshot.
- No full browser/preferences matrix, JavaScript-disabled submission, contrib compatibility, or core PHPUnit/FunctionalJavascript suite was reviewed.
- MR discussions for !15536, !3092, !7341 returned HTTP 401 during intake. Zero fetched discussions does not establish zero unresolved threads.
- The older committed 15:27 UTC run lacks complete PHP/Drupal/site context and uses the old submission assertion. Treat it as incomplete evidence, not an additional independently verified environment.

## Tooling status

PR #22 (design collector) and PR #23 (compact headers) are merged into lab main as of fetched commit 5c1bf90. User reported five green CI checks for #22. The replay correction was run successfully on the user's laptop, but its Git commit/push status remains unconfirmed. This closeout updates the documentation and scenario; it does not change either core patch.
