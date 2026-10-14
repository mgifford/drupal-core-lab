# #3415961: [drupalMedia] Using the Insert Media button causes the window to scroll to the bottom of the page

**DRAFT.** Written from an issue pack (Claude (chat), from the issue page and the MR diff read on 2026-10-02). A person has not yet confirmed the steps or the checks.

Issue: https://www.drupal.org/project/drupal/issues/3415961  
Merge request: !12348  
Fork branch: `3415961-drupalmedia-using-the`

## Summary

Reported problem: in CKEditor 5 with the Insert Media button, pressing "Insert selected" in the media library dialog makes the
window scroll to the bottom of the page. The reporter first suspected the Claro theme but saw it with a different admin theme too
(issue summary). Comment #17 reports the same focus problem in Layout Builder, and comment #22 reports the Insert selected button
being focused at the bottom of the page after inserting.

The merge request (!12348, one added line) adds 'disable-refocus' => TRUE to the AJAX settings of the "Insert selected" button in
core/modules/media_library/src/Plugin/views/field/MediaLibrarySelectForm.php. Several commenters say a similar patch fixes the jump
for them (#10, #12, #22, #24). Comment #9 says it does not change the jump when the dialog is closed with the X button, and #11 says the
patch moves focus to the Insert Media button, which can still scroll a page with a sticky toolbar.

Open points from the discussion (not decisions): comment #3 asked for tests and the newest comment (#27, today) says it still needs tests;
comment #6 asked whether this duplicates #3410598 and whether changing the media library dialog affects non-CKEditor contexts; comment #26
suggests the real cause may be a nested modals issue in core. Whether the problem still happens on current main with the Default Admin theme is not
stated anywhere in the issue, and Olivero (used in some reports) is not available there.

## Sources

- https://www.drupal.org/project/drupal/issues/3415961 (2026-10-02): Issue page with comments #1 to #27 (status Needs work in the newest comment, #27)
- https://git.drupalcode.org/project/drupal/-/merge_requests/12348 (2026-10-02): Merge request !12348, opened, target branch main; its diff is one added line
- https://www.drupal.org/project/drupal/issues/3410598: Related issue "CKEditor 5: scroll jump after dialog close", named in comment #6

## Not verified

- Whether the scroll jump still reproduces on current core main with the Default Admin theme
- Whether the fix check (editor still in view) fails on Before and passes on After: it passes on both sites before any insertion, so it only means something after the dialog interaction on a tall, scrolled page
- The X-button behaviour in comment #9 is reported by one commenter and was not reproduced

## Notes

Loaded with Playwright on 2026-10-02 (Standard install, current main, Default Admin): the precondition probe is true on both sites, the text format
defaults to Basic HTML, and Insert Media sits behind the toolbar's "Show more items" menu. The upload and Insert selected steps were not automated.
Building the first draft of this pack showed that its recipe guessed too much: the Standard install already has the drupalMedia toolbar item and the
media_embed filter on Full HTML, so the recipe only adds the Article type and the Image media type. Expect to correct a first draft this way.
The MR is a one-line change with no test (the issue is tagged Needs tests). Related: #3410598. If the nested modals theory in comment #26 is right,
this symptom may belong to a broader issue; the Before and After results here only speak to what MR !12348 changes.
