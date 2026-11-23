# #2942404: evaluation of the two old merge requests against current main

**DRAFT, AI-assisted; read from source and diffs, not run.** Prepared 2026-11-19.

## What was compared (pinned identities)

| Artifact | Identity |
|---|---|
| MR [!6058](https://git.drupalcode.org/project/drupal/-/merge_requests/6058) | branch `core-message-landmarks`, head `25e7b65749bf`, updated 2026-01-15; 10 files; diff [branches/2942404-mr6058.patch](branches/2942404-mr6058.patch) (sha256 6829696734ec) |
| MR [!6112](https://git.drupalcode.org/project/drupal/-/merge_requests/6112) | branch `2942404-11`, head `7dc956336c14`, updated 2026-01-15; 12 files; diff [branches/2942404-mr6112.patch](branches/2942404-mr6112.patch) (sha256 34184a12de5f); the older [branches/2942404-11.patch](branches/2942404-11.patch) is the same change extracted from the branch |
| Base both apply to | core `66a4c78b453b` (2024-02-01); both diffs apply cleanly there |
| Current main | core `92e5c3a30476` (2026-11-18) |

The mutable MR `.diff` URL is not a pin; the head commits above are.

## Interdiffs

Each is the difference between the two resulting trees, limited to the files the earlier proposal changed, and was checked: applying it to the earlier result gives exactly the later one.

| Interdiff | From | To | Size |
|---|---|---|---|
| [interdiff-mr6058-to-mr6112.diff](interdiff/interdiff-mr6058-to-mr6112.diff) | !6058 result | !6112 result (both on `66a4c78b453b`) | 7 files, 17 lines changed |
| [interdiff-mr6058-to-main.diff](interdiff/interdiff-mr6058-to-main.diff) | !6058 result | main, same 10 files | 824 lines |
| [interdiff-mr6112-to-main.diff](interdiff/interdiff-mr6112-to-main.diff) | !6112 result | main, same 12 files | 1287 lines |

The two "to main" interdiffs include every upstream change to those files since 2024-02-01 (for example the removal of Claro, Olivero and Stable 9 from core, the new Umami messages component, test refactors). They show where main now stands; they are not a minimal patch. The template files are the part to read.

!6058 to !6112 differs in `BigPipePlaceholderTestCases.php`, in the Olivero and starterkit templates (only !6058 changes them), and in four test files only !6112 changes (`BigPipeTest`, `ModulesListFormWebTest`, `AjaxFormPageCacheTest`, `ElementValidationTest`); the core template change is identical in both (`role="region"` wrapper with an inner `role="alert"` for errors or `role="status"` for status and warning).

## Aligned with main: what is left to change

Result: **no patch is needed to align either MR with main; both are superseded.** Main already carries the change, by a different design, so a reroll would add nothing and some hunks would break main's tests.

| MR design | Current main (`core/modules/system/templates/status-messages.html.twig`) |
|---|---|
| `role="contentinfo"` replaced by `role="region"` plus `aria-label` per message type | No region or landmark; the wrapper itself is the live region with its `aria-label` and a visually hidden `h2` |
| Inner `<div role="alert">` for errors | `role="alert"` on the wrapper |
| Inner `<div role="status">` for status **and warning** | `role="status"` for status; **warning is `role="alert"`** |
| `contentinfo` removed | `contentinfo` removed; template comment says it is reserved for the page footer, avoiding duplicate and non-unique landmarks (related [#3587678](https://www.drupal.org/i/3587678), closed fixed 2026-08-25) |

### Per file, against main

| File | !6058 | !6112 | On main |
|---|---|---|---|
| `system/templates/status-messages.html.twig` | yes | yes | Different design, already done. Hunks do not apply. |
| `demo_umami/.../messages/status-messages.html.twig` | yes | yes | Rewritten as a `<drupal-umami-messages>` component with `role` alert or status. Hunks do not apply. |
| `starterkit_theme/.../misc/status-messages.html.twig` | yes | no | Uses the same alert or status roles. Superseded. |
| `system/tests/themes/test_messages/.../status-messages.html.twig` | yes | yes | Differs from both MRs (not read in detail). Hunks do not apply. |
| `claro/.../status-messages.html.twig`, `olivero/...`, `stable9/...` | yes | claro, stable9 | Themes no longer in core. Obsolete. |
| `BigPipePlaceholderTestCases.php`, `PlaceholderMessageTest.php`, `BigPipeRegressionTest.php`, `ModulesListFormWebTest.php` | yes | yes | Already updated on main to the new markup (for example `<div role="status" aria-label="Status message">`). Hunks do not apply. |
| `BigPipeTest.php`, `AjaxFormPageCacheTest.php`, `ElementValidationTest.php` | no | yes | **Apply cleanly but are wrong for main**: they assert the nested `[aria-label='Status message'] > div[role='status'] > ul` structure, which main no longer renders. Applying them would break those tests. |

## Open points for a person (not settled here)

1. **Warning role.** The MRs make warnings `status` (polite); main makes them `alert` (assertive). Whether that is right is a judgment call that the issue thread and #3587678 should answer; this evaluation does not decide it.
2. **The issue's remaining questions** (announcement after a full-page reload, AJAX and BigPipe timing, `Drupal.Message` plus `Drupal.announce()` duplication, theme consistency) are untested. If a run shows a defect, the patch for it is new work on main, not a reroll of either MR.
3. **Housekeeping on drupal.org** (closing or marking !6058 and !6112 superseded, and whether #2942404 should be closed or split) is for a maintainer or the contributor. Nothing was posted.

## Not verified

- No environment was built and no test was run; "applies" means `git apply --check` on a source tree.
- The review threads of both MRs could not be read (HTTP 401) and not all 98 comments were read.
- Test and template files outside the table's "read" rows were compared by diff size, not line by line.
