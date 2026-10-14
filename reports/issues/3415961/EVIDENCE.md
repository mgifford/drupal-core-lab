# Evidence: #3415961 — Insert Media scroll jump

Status: DRAFT until a person has reviewed it.
Date: 2026-10-13. Tool: opencode. AI-assisted: yes.
Reproduce (commands): [REPRODUCE.md](REPRODUCE.md). Entry point: [SUMMARY.md](SUMMARY.md).

Goal: prove that a new automated test for
[#3415961](https://www.drupal.org/project/drupal/issues/3415961) fails on the
unpatched core and passes with MR !12348 (the one-line `disable-refocus` fix).

## The test

New method `MediaLibraryTest::testFocusStaysInEditorAfterInsert()` in
`core/modules/ckeditor5/tests/src/FunctionalJavascript/MediaLibraryTest.php`.

Patch: [`branches/3415961-test-focus-stays-in-editor.patch`](branches/3415961-test-focus-stays-in-editor.patch).
Fix + test: [`branches/3415961-fix-and-test.patch`](branches/3415961-fix-and-test.patch).

It drives the real media-library flow (open *Insert Media*, pick an item, press
*Insert selected*) and then asserts that `document.activeElement` is still inside
the CKEditor (`.ck-editor`). Without the fix the AJAX refocus moves focus to the
node form's submit button, which is what scrolls the page away from the editor.

## Environments

Both environments of a pair are the same core commit; only the fix differs.
Both pairs were run: `-latest` (current `main`) and `-pinned` (the fork base).

| Env | Directory | Commit | Fix applied |
|---|---|---|---|
| Before (`-latest`) | `envs/baseline-3415961-latest` | `4f9558d85e7` | no (`disable-refocus` absent) |
| After (`-latest`) | `envs/issue-3415961-latest` | `4f9558d85e7` | yes (`disable-refocus` present) |
| Before (`-pinned`) | `envs/baseline-3415961` | `33a306844561` | no |
| After (`-pinned`) | `envs/issue-3415961` | `33a306844561` | yes |

Fix under test: commit `b7470c05b6b` (fork branch `3415961-drupalmedia-using-the`,
tip `2dfd37b47c7`), file `core/modules/media_library/src/Plugin/views/field/MediaLibrarySelectForm.php`.

Built with `node tools/compare/setup.mjs 3415961-latest` and
`node tools/compare/setup.mjs 3415961-pinned` (recipe `repro_3415961`).

The pinned pair originally failed to build: core `33a306844561` (2026-01-17)
ships `core/scripts/drupal` but not `core/scripts/dr`, and that older console
names the command `recipe`, not `recipe:apply`. `scripts/lab-site.sh` now picks
the right entry point and command. The recipe also no longer requires the
`article_content_type` fixture (absent at that commit; Standard already provides
Article) and adds the Insert Media button in an `apply.sh` step.

## Result

Command, run once in each environment (the test patch is present on both sides):

    ddev phpunit core/modules/ckeditor5/tests/src/FunctionalJavascript/MediaLibraryTest.php --filter testFocusStaysInEditorAfterInsert

| Side | Environment | Result |
|---|---|---|
| Before | `envs/baseline-3415961-latest` | FAIL — `Focus stays in the text editor after the media library dialog closes.` (Tests: 1, Failures: 1) |
| After | `envs/issue-3415961-latest` | OK (1 test, 12 assertions) |
| Before | `envs/baseline-3415961` | FAIL (Tests: 1, Failures: 1) |
| After | `envs/issue-3415961` | OK (1 test, 12 assertions) |

`phpcs --standard=core/phpcs.xml.dist` on the changed file: clean.

## Supporting observation (why focus, not scroll, is asserted)

A throwaway diagnostic (since removed) recorded `document.activeElement` just
before and just after *Insert selected*, at a 1000x500 window:

| Side | activeElement before | activeElement after |
|---|---|---|
| Before | `DIV.ui-dialog.media-library-widget-modal` | `INPUT#edit-submit.button.button--primary.js-form-submit.form-submit` |
| After | `DIV.ui-dialog.media-library-widget-modal` | `BUTTON.ck.ck-button.ck-off` |

Before, focus moves from the dialog to the node form's *Save* button. After, it
stays in the CKEditor toolbar. `window.scrollY` did not change in either run —
the headless driver here does not scroll the window on programmatic focus, so a
scroll-position assertion cannot distinguish the two sides. The focus target is
the direct cause the fix changes, so the test asserts that.

## Browser reproduction (the real scroll)

Script: `tools/playwright/scroll-3415961.mjs <before-env> <after-env>`. It logs
in on each site, opens `/node/add/article`, selects Full HTML, makes the page
tall, puts the editor near the top of a short window (1000x400), inserts a media
item from the library, and measures `window.scrollY`, the editor's position and
`document.activeElement`. Output and screenshots:
[`playwright/2026-10-13-scroll/`](playwright/2026-10-13-scroll/) (`-latest`) and
[`playwright/2026-10-13-scroll-pinned/`](playwright/2026-10-13-scroll-pinned/) (pinned).

| Side | scrollY before | scrollY after | editor top after insert | activeElement after |
|---|---|---|---|---|
| Before | 459 | 794 | -185 (above the viewport) | `#edit-submit` (the node Save button) |
| After | 459 | 459 | 150 (still in view) | the CKEditor toolbar button |

Before, the window scrolls by 335 px and the editor leaves the top of the
viewport. After, the window does not move and the editor stays in view. This is
the reported symptom, reproduced, and shown fixed by MR !12348.

The sites need one Image media item; the recipe's `apply.sh` creates it and adds
the Insert Media button to Full HTML (Standard's Full HTML has no media button on
this core), so a rebuilt environment is ready for the script.

## Not verified

- Closing the dialog with the X button (issue comment about a remaining jump) was
  not tested.
- The browser reproduction ran on `-latest` only; the pinned pair was validated
  with PHPUnit only.
- No manual keyboard or screen-reader pass.
- The screenshots were saved but not inspected in this session.
