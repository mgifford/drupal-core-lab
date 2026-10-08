# #3618230: Adopt the ajax MessageCommand for file uploads

**DRAFT.** Written from an issue pack (Gemini (chat), from issue page #3618230 and MR !16777). A person has not yet confirmed the steps or the checks.

Issue: https://www.drupal.org/project/drupal/issues/3618230  
Merge request: !16777  
Fork branch: `3618230-adopt-the-ajax`

## Summary

Reported problem: ManagedFile::uploadAjaxCallback() renders status messages directly into the replaced widget prefix inside the insert AJAX command instead of using the AJAX MessageCommand (introduced in Drupal 8.8). This causes HTML filtering issues with inline icons (e.g. SVG icons stripped in Olivero, issue #3457067), relies on inline markup for screen reader announcements rather than aria-live, and hardcodes message placement inside the widget instead of giving the theme control over rendering.

The merge request (!16777) alters ManagedFile::uploadAjaxCallback() to append a unique container (div with class file-upload-messages) in the widget prefix and sends error messages using MessageCommand targeted at that container via its wrapperQuerySelector.

Open points: comment #10 notes that Olivero has been removed from core (#3595089) and asks whether this problem still occurs in the Default Admin theme. The issue is postponed for maintainer feedback.

## Sources

- https://www.drupal.org/project/drupal/issues/3618230 (2026-10-04): Issue page with comments #1 to #10 (status Postponed)
- https://git.drupalcode.org/project/drupal/-/merge_requests/16777 (2026-10-04): Merge request !16777, opened, source branch 3618230-adopt-the-ajax, target branch main

## Setup blocks

- article_content_type [added automatically]. Verified: Core fixture recipe; applied on core a19dfee86688 (commit date 2026-10-01) in the #3618230 and #3415961 builds.
- file_field_with_size_limit (field: attachment, label: Attachment, limit: 1 KB, extensions: txt). Verified: Applied on core a19dfee86688 (commit date 2026-10-01) in the #3618230 build; a 2 KB .txt file in the field produced the server-side upload error on Before and After (scripted run, 2026-10-03).

## Not verified

- Whether the error message renders properly in the Default Admin theme on current main
- Whether the fix check (element .file-upload-messages) only exists in the DOM after triggering a server-side file upload error
- Assistive technology live announcement behavior in different admin themes

## Notes

The issue was created by fago and postponed pending information on how it behaves with the Default Admin theme following Olivero's removal.
The MR changes ManagedFile::uploadAjaxCallback to output a wrapper container with an ID matching file-upload-messages-* and sends messages via MessageCommand targeting that selector.
