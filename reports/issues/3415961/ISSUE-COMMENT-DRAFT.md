<!-- DRAFT for a human to review and post. Do not post automatically.
     Operator: rewrite the text below in your own words before publishing.
     Evidence: EVIDENCE.md, playwright/2026-10-13-scroll/, branches/3415961-test-focus-stays-in-editor.patch -->

A FunctionalJavascript test for this change is ready.

The test is `MediaLibraryTest::testFocusStaysInEditorAfterInsert()` in
`core/modules/ckeditor5/tests/src/FunctionalJavascript/MediaLibraryTest.php`.
It opens the media library from a CKEditor 5 Full HTML body field, selects an
image, and presses *Insert selected*. It then checks that
`document.activeElement` is still inside the editor.

Without the change the test fails. Focus moves to the node form's Save button
(`#edit-submit`). With the change the test passes. Focus stays in the editor.

The test was run on current `main` (4f9558d85e7) and on the patch base
(33a306844561). In both cases it failed before the change and passed after it.

A browser run shows the same result. Without the change the window scrolled
335 px and the editor left the viewport. With the change the window did not move.

I can add the test to the merge request if that helps.

Generated with the help of an LLM.

---

<!-- Not part of the post. Suggested commit message if the test is folded into
     the MR (core AGENTS.md §2 and §5: no LLM-credit trailers). Raw text:

Issue #3415961: add a FunctionalJavascript test for focus after media insert

The media library dialog closes and the AJAX framework moves focus to the
node form's Save button. The editor loses focus and the window scrolls.
The test asserts that focus stays in the editor after Insert selected.

-->
