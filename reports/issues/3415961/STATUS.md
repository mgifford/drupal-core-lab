# #3415961 status snapshot (2026-10-14)

Re-check on drupal.org before relying on it. This replaces the earlier
[STATUS-2026-10-02.md](STATUS-2026-10-02.md) placeholder.

- Title: [drupalMedia] Using the Insert Media button causes the window to scroll to the bottom of the page
- Issue: https://www.drupal.org/project/drupal/issues/3415961 — status **Needs work** (13), category Bug report, priority Normal, version `main`, 27 comments
- Merge request: **!12348** — open, target `main`, **one added line, no test**; fork branch `3415961-drupalmedia-using-the`, tip `2dfd37b47c7`
- Related issues: #3410598 (CKEditor 5 scroll jump after dialog close, named in comment #6)

## Open points from the issue (as read 2026-10-02)

- Comment #3 asked for tests; the newest comment (#27, 2026-10-02) still says tests are needed. The MR adds none.
- Comment #9: the change does not stop the jump when the dialog is closed with the X button (not reproduced here).
- Comment #11: after the change, focus moves to the Insert Media button, which can still scroll a page with a sticky toolbar.
- Comment #6: whether this duplicates #3410598, and whether changing the media library dialog affects non-CKEditor contexts.
- Comment #26: theory that the real cause is a nested-modals issue in core.
- Whether the problem reproduces on current `main` with the Default Admin theme is not stated in the issue.

## What this lab has done (2026-10-13 to 2026-10-14)

- Wrote a FunctionalJavascript test for the MR — see [SUMMARY.md](SUMMARY.md) and [EVIDENCE.md](EVIDENCE.md). Before fails, After passes on both the pinned core and current `main`.
- Reproduced the scroll itself in a real browser (`tools/playwright/scroll-3415961.mjs`).
- **Nothing has been posted to drupal.org.** [ISSUE-COMMENT-DRAFT.md](ISSUE-COMMENT-DRAFT.md) is a draft for a person to review and post.

## Blockers / not verified

- No manual keyboard or screen-reader pass; the viewer walkthrough checks have not been run by a person.
- The X-button behaviour was not reproduced.
