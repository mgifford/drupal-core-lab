# Reproduce #3415961: [drupalMedia] Using the Insert Media button causes the window to scroll to the bottom of the page

Issue: https://www.drupal.org/project/drupal/issues/3415961
Pinned core: `33a306844561` (2026-01-17; the patch base and the commit the pinned evidence was produced on). Last verified: 2026-10-13.

Test-support patch, declared on **both** sides (`before.patches` and `after.patches`
in `variants.json`): `branches/3415961-test-focus-stays-in-editor.patch`. It adds
only a test method; it is not code under test.

## The problem in one paragraph
Inserting media from the media library dialog leaves the page scrolled away from
the editor. When the dialog closes, the AJAX framework restores focus to the
element that started the request, or to one of its parents. The trigger button is
gone with the dialog, so focus lands on the node form's Save button. The browser
scrolls to that button and the editor leaves the view. MR !12348 adds
`'disable-refocus' => TRUE,` to the media library AJAX response so focus stays in
the editor.

## The fix under test
`branches/3415961-drupalmedia-using-the.patch` (commit `b7470c05b6b`, fork branch
`3415961-drupalmedia-using-the`, tip `2dfd37b47c7`): one line in
`core/modules/media_library/src/Plugin/views/field/MediaLibrarySelectForm.php`.

## Reproduce it (pinned core)
    node tools/compare/setup.mjs 3415961-pinned        # builds Before and After, applies the recipe and patches
    node scripts/lab-env.mjs start 3415961-pinned      # both sites + the viewer
    node tools/compare/serve.mjs 3415961-pinned        # side-by-side viewer (http://localhost:8100)

## Try it on the latest core
    node tools/compare/setup.mjs 3415961-latest
    node tools/compare/setup.mjs 3415961-latest --check-patches    # do the patches still apply to current main?

## Automated test (the new test in this report)
The test patch is applied to both sides, so the same command runs on each:

    cd envs/baseline-3415961 && ddev phpunit core/modules/ckeditor5/tests/src/FunctionalJavascript/MediaLibraryTest.php --filter testFocusStaysInEditorAfterInsert
    cd envs/issue-3415961   && ddev phpunit core/modules/ckeditor5/tests/src/FunctionalJavascript/MediaLibraryTest.php --filter testFocusStaysInEditorAfterInsert

Expected: Before FAILS (`activeElement` is the node Save button), After PASSES
(`activeElement` is inside `.ck-editor`). Confirmed on `-pinned` and `-latest`;
details in `TEST-EVIDENCE.md`.

## Browser reproduction of the scroll itself
    node tools/playwright/scroll-3415961.mjs baseline-3415961-latest issue-3415961-latest

Expected: Before scrolls the window and the editor leaves the viewport; After does
not. Needs both `-latest` sites running. Evidence in `playwright/2026-10-13-scroll/`.

## If the result is not what you expect
| What you see | What it probably means | What to do |
|---|---|---|
| A patch **does not apply** | Core changed the same lines | Reroll: rebase the issue fork branch on current `main`, regenerate the patch (`scripts/new-issue.mjs 3415961 --branch <branch> --refresh`), update the files in `branches/`. |
| **Before no longer fails** | Upstream may have fixed it, or the steps/selectors no longer match | Check the issue and recent commits to the files in the patch before concluding anything. |
| **After still fails** on newer core | The fix no longer works there | Review the diff of the changed file against current core; update the patch. |
| Everything as expected | Still reproducible | Record the new core commit (see "Re-pin" below). |

## Re-pin to a newer core after verifying
1. Run the `-latest` variant to the end and confirm the test and the browser run agree.
2. Put the verified commit (`git -C envs/issue-3415961-latest rev-parse HEAD`) in `core.commit` of the `-pinned` variant in this folder's `variants.json`.
3. Re-run the test and the browser run, commit the new evidence, update "Last verified" above.

## What is in this folder
| Path | What |
|---|---|
| `branches/*.patch`, `BRANCHES.md` | Patches from the issue fork, with source, tip, base and date. Includes the test patch and the combined fix+test patch. |
| `STATUS-<date>.md` | Related issues and review threads, dated. Re-check on drupal.org before relying on it. |
| `TEST-EVIDENCE.md` | Test and browser results with exact commits. DRAFT until a person has reviewed it. |
| `playwright/` | Generated evidence from the browser reproduction. |
| `ISSUE-COMMENT-DRAFT.md` | A draft for a human to review and post. Nothing is posted automatically. |
