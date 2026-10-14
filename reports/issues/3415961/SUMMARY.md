# #3415961: [drupalMedia] Using the Insert Media button causes the window to scroll to the bottom of the page

**DRAFT.** The automated test and the browser reproduction were confirmed by the lab on 2026-10-13;
a person has not yet reviewed them, and the interactive viewer walkthrough has not been run by hand.
Last updated: 2026-10-14.

**This is the entry point for this issue.** It links to the patches, the recipe, the evidence and the
comment draft. Start with **Files and links** below, or `REPRODUCE.md` for the step-by-step commands.

Issue: https://www.drupal.org/project/drupal/issues/3415961
Merge request: !12348 (open)
Fork branch: `3415961-drupalmedia-using-the`
Status snapshot: [STATUS.md](STATUS.md) · older: [STATUS-2026-10-02.md](STATUS-2026-10-02.md) (superseded)

## Summary

Reported problem: in CKEditor 5 with the Insert Media button, pressing "Insert selected" in the media
library dialog makes the window scroll to the bottom of the page. The reporter first suspected the Claro
theme but saw it with a different admin theme too (issue summary). Comment #17 reports the same focus
problem in Layout Builder, and comment #22 the Insert selected button being focused at the bottom of the
page after inserting.

The merge request (!12348, one added line) adds `'disable-refocus' => TRUE` to the AJAX settings of the
"Insert selected" button in
`core/modules/media_library/src/Plugin/views/field/MediaLibrarySelectForm.php`. When the dialog closes,
the AJAX framework otherwise tries to restore focus to the trigger button; the button is gone with the
dialog, so focus lands on the node form's Save button, which scrolls the page away from the editor.
Several commenters say a similar patch fixes the jump for them (#10, #12, #22, #24). Comment #9 says it
does not change the jump when the dialog is closed with the X button, and #11 says the patch moves focus
to the Insert Media button, which can still scroll a page with a sticky toolbar.

Open points in the discussion (not decisions): comment #3 asked for tests and the newest comment (#27 on
2026-10-02) says it still needs tests; comment #6 asked whether this duplicates #3410598 and whether
changing the media library dialog affects non-CKEditor contexts; comment #26 suggests the real cause may
be a nested-modals issue in core.

## The test (added by this lab — the link you are looking for)

`MediaLibraryTest::testFocusStaysInEditorAfterInsert()` in
`core/modules/ckeditor5/tests/src/FunctionalJavascript/MediaLibraryTest.php`.

- Test only: [`branches/3415961-test-focus-stays-in-editor.patch`](branches/3415961-test-focus-stays-in-editor.patch)
- Fix **and** test together (the full MR state): [`branches/3415961-fix-and-test.patch`](branches/3415961-fix-and-test.patch)

It drives the real media-library flow (open *Insert Media*, pick an item, press *Insert selected*) and
asserts `document.activeElement` is still inside the CKEditor (`.ck-editor`). Without the fix the test
**fails** (focus moves to the node Save button); with the fix it **passes**. Result on both the pinned
core and current `main`: [EVIDENCE.md](EVIDENCE.md).

Why the test asserts focus and not the scroll: the headless PHPUnit driver does not scroll the window on
programmatic focus, so the scroll itself is reproduced in a real browser instead (see the browser run in
`EVIDENCE.md`). MR !12348 adds no test of its own — this is the missing one.

## Files and links

| What | Where |
|---|---|
| How to reproduce (commands, pinned and latest) | [REPRODUCE.md](REPRODUCE.md) |
| The test (patch) | [branches/3415961-test-focus-stays-in-editor.patch](branches/3415961-test-focus-stays-in-editor.patch) |
| Fix + test (patch) | [branches/3415961-fix-and-test.patch](branches/3415961-fix-and-test.patch) |
| The fix under test (patch) | [branches/3415961-drupalmedia-using-the.patch](branches/3415961-drupalmedia-using-the.patch) · [BRANCHES.md](BRANCHES.md) |
| Recipe (starting state) | [`recipes/repro_3415961/`](../../../recipes/repro_3415961/) (copy: [`recipe/`](recipe/)) |
| Evidence (test and browser), exact commits | [EVIDENCE.md](EVIDENCE.md) |
| Browser reproduction output and screenshots | [`playwright/2026-10-13-scroll/`](playwright/2026-10-13-scroll/) (`-latest`) · [`playwright/2026-10-13-scroll-pinned/`](playwright/2026-10-13-scroll-pinned/) (pinned) |
| Draft comment (do not post) | [ISSUE-COMMENT-DRAFT.md](ISSUE-COMMENT-DRAFT.md) |
| Status snapshot | [STATUS.md](STATUS.md) |
| Original pack as received (2026-10-02) | [PACK.yml](PACK.yml) |

## Sources

- https://www.drupal.org/project/drupal/issues/3415961 (2026-10-02): issue page with comments #1 to #27 (status Needs work in the newest comment)
- https://git.drupalcode.org/project/drupal/-/merge_requests/12348 (2026-10-14): merge request !12348, open, target branch main; its diff is one added line
- https://www.drupal.org/project/drupal/issues/3410598: related issue named in comment #6

## Not verified

- Whether the problem still reproduces on current `main` with the Default Admin theme for a person using a keyboard or assistive technology.
- The X-button behaviour in comment #9 (a remaining jump) — reported by one commenter, not reproduced.
- The interactive viewer walkthrough checks have not been run by a person; only the automated test and the scripted browser run were confirmed.

## Notes

- The lab built both pairs: `3415961-latest` (current `main`) and `3415961-pinned` (the fork base, core `33a306844561`, 2026-01-17). `scripts/lab-site.sh` picks the right core recipe entry point for that older checkout.
- Recorded originally from an issue pack (Claude (chat), from the issue page and the MR diff read on 2026-10-02); corrected and extended by the lab on 2026-10-13 (test, browser run, recipe). The test and the evidence are AI-assisted; see [EVIDENCE.md](EVIDENCE.md).
