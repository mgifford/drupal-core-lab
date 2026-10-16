# #3593502: Introduce a new Menu UI to resolve memory issues and improve user experience

**DRAFT.** The Drupal.org comments through #36, MR !15975, and the MR source at
`6d566c319bcfecba885938b1d789115beb830834` were reviewed on 2026-10-16. The
MR was not run in DDEV during this review. Earlier baseline measurements remain
valid only for the unchanged menu form described in `EVIDENCE.md`.

Issue: https://www.drupal.org/project/drupal/issues/3593502

MR: https://git.drupalcode.org/project/drupal/-/merge_requests/15975

## Recommendation

Do not mark the issue RTBC. Keep it at Needs review while requesting focused
architecture, performance, accessibility, and usability reviews.

The implementation addresses most concrete usability feedback. It retains a
table, the existing move handle, Save and Cancel, Add child, small-tree
auto-expansion, and move state across search. It also adds locking, route-menu
validation, keyboard movement, tests, and Default Admin colour tokens.

## Blocking findings

1. `MenuTreeController::page()` loads the complete top level before slicing it
   to 200 rows. Deeper levels are not paged. The work avoids building the full
   form but does not bound the width of a sibling level.
2. The required performance profile, query plans, and index analysis are absent.
3. Screen-reader, forced-colors, zoom, reflow, and cross-browser evidence is
   absent. Automated tests do not replace those reviews.
4. The three-module, 150-file architecture has not received subsystem approval.
5. The default search covers `menu_link_content` only, not visible static YAML
   links.
6. Save can partially succeed because operations are persisted one at a time.
   That behavior needs explicit UX and architecture acceptance.

## Proposed follow-up patch

The lab contains a patch that applies after MR !15975:

- [`branches/patch-1-mr-15975.patch`](branches/patch-1-mr-15975.patch)
- [`branches/3593502-follow-up-review-fixes.patch`](branches/3593502-follow-up-review-fixes.patch)
- [`interdiff/15975-to-review-fixes.interdiff`](interdiff/15975-to-review-fixes.interdiff)
- [`INTERDIFF.md`](INTERDIFF.md)
- [`FOLLOW-UP-PATCH.md`](FOLLOW-UP-PATCH.md)
- [`BRANCHES.md`](BRANCHES.md)
- [`REPRODUCE.md`](REPRODUCE.md)
- [`variants.json`](variants.json)

It fixes the CSRF initialization race, adds the missing search dismissal tests,
and adds forced-colors treatment for the move affordances.

It deliberately does not add a controller-only child limit. The generic
treegrid refresh and reorder logic assumes that the server returns every
sibling. A local slice could hide links or reconcile the DOM incorrectly.

## Existing baseline

On unchanged core with 15,000 menu links, the classic form failed at a 256 MB
memory limit after 3.3 seconds. With unlimited memory it reached PHP's 30-second
time limit after using 1,132.8 MB. See [`EVIDENCE.md`](EVIDENCE.md).

## Files

| Purpose | File |
|---|---|
| Local DDEV build and test procedure | [`REPRODUCE.md`](REPRODUCE.md) |
| Core-to-MR, MR-to-interdiff, core-to-complete, and latest lab definitions | [`variants.json`](variants.json) |
| Current test gaps | [`COVERAGE.md`](COVERAGE.md) |
| Follow-up patch and test instructions | [`FOLLOW-UP-PATCH.md`](FOLLOW-UP-PATCH.md) |
| Interdiff and change-by-change rationale | [`INTERDIFF.md`](INTERDIFF.md) |
| Patch provenance | [`BRANCHES.md`](BRANCHES.md) |
| Baseline measurements | [`EVIDENCE.md`](EVIDENCE.md) |
| Issue and artifact snapshot | [`STATUS.md`](STATUS.md) |
| Existing large-menu recipe | [`recipes/repro_3593502/`](../../../recipes/repro_3593502/) |
| Lab support for named patch-stack baselines | [`lab/README.md`](lab/README.md) |
| Earlier DDEV Coder instructions, now superseded for local use | [`CODER-PROMPT.md`](CODER-PROMPT.md) |

No `ISSUE-COMMENT-DRAFT.md` is included. The report is evidence and supporting
material for Mike's own general comments; it is not text intended to be posted
verbatim or used to update the MR.

## Still required

- Design paging and reconciliation together for every sibling level.
- Test a 5,000-item top level and 5,000 children under one parent.
- Profile initial page load, child expansion, search, and save.
- Test static-link search expectations.
- Run the two FunctionalJavascript test classes added by the patch.
- Run core code checks, PHPCS, PHPStan, and the relevant test directories.
- Complete manual keyboard, screen-reader, forced-colors, dark-mode, zoom,
  reflow, touch, and supported-browser testing.
