# #3618230: Adopt the ajax MessageCommand for file uploads

**DRAFT.** Written from an issue pack (AI collaborator from the issue page and MR diff on 2026-10-03). A person has not yet confirmed the steps or the checks.

Issue: https://www.drupal.org/project/drupal/issues/3618230  
Merge request: !16777  
Fork branch: `3618230-adopt-the-ajax`

## Summary

Reported problem: ManagedFile::uploadAjaxCallback() renders a status_messages element into the replaced widget's prefix and ships it inside the insert AJAX command. This causes server-rendered messages to go through XSS filtering (stripping things like Olivero's SVG message icon, related to issue #3457067), prevents proper accessibility aria live announcements, forces errors inside the widget instead of the theme's message region, and complicates decoupled frontends.

The changed code runs in server-side validation after an AJAX upload. Note that a disallowed file extension is rejected in the browser before any request, so it does not reach this code; thus using an oversized allowed extension (.txt exceeding 1 KB) triggers the server-side size validation.

The merge request (!16777) updates core/modules/file/src/Element/ManagedFile.php to use a placeholder container div (file-upload-messages) in the replaced markup and delivers messages using the dedicated MessageCommand via Drupal::messenger()->deleteAll(). It also adds a kernel test in core/modules/file/tests/src/Kernel/ManagedFileTest.php.

Comment #10 notes that Olivero has not been in core since #3595089 and asks whether the problem occurs in the Default Admin theme.

## Sources

- https://www.drupal.org/project/drupal/issues/3618230 (2026-10-02): Issue page with comments #1 to #10, status Postponed
- https://git.drupalcode.org/project/drupal/-/merge_requests/16777 (2026-08-20): Merge request !16777, source branch 3618230-adopt-the-ajax, target branch main

## Not verified

- Whether the problem still occurs in the Default Admin theme following the removal of Olivero from core
- Whether decoupled frontends correctly receive and render the AJAX message command
- The fix check (.file-upload-messages element) is false before any upload and can only be true on After after a failed upload.
- The recipe config was supplied by the person and not checked by you.

## Notes

The issue is currently postponed (maintainer needs more info regarding Olivero removal in core #3595089).
