# Bug summary for #3618230 in Gherkin (Given / When / Then). Rewritten by an AI assistant (Claude Code) on 2026-10-16,
# per behaviour, from `node scripts/bug-feature.mjs draft 3618230` and these inputs only:
#   file:reports/issues/3618230/intake/BRIEF.md (the issue summary and comments, fetched 2026-10-15)
#   file:reports/issues/3618230/SUMMARY.md
#   file:reports/issues/3618230/EVIDENCE.md
#   file:reports/issues/3618230/FEEDBACK.md
# The issue page was not fetched again for this file. Check: node scripts/bug-feature.mjs check 3618230
# Reviewed by Mike Gifford on 2026-10-18 ("Bug.feature looks good", in the lab session; the assistant changed @draft to @reviewed on that word).
# The question in the @unverified scenario (a dismissed error stays in the accessibility tree) is still open.
# Core: main 3b94128e929 (2026-10-14) on both sides; After adds MR !16777 (file:reports/issues/3618230/branches/3618230-adopt-the-ajax.patch, sha256 912ccc95).
# Lab runs (scripted, real input), newest first:
#   file:reports/issues/3618230/playwright/2026-10-15T15-10-35-411Z-chromium-light-1280x900/ 3618230-pilot, chromium light 1280px, core 3b94128e: reproduced and fixed
#   file:reports/issues/3618230/playwright/2026-10-14T09-27-29-357Z-chromium-light-1280x900/ 3618230-latest, chromium light 1280px, core 3b94128e92: reproduced and fixed
# Not tested by anyone: Firefox, WebKit, dark mode, forced colours, zoom and reflow, the pinned core, a multi-value file field (SUMMARY.md, "Not verified").
@issue-3618230 @reviewed
Feature: Adopt the ajax MessageCommand for file uploads
  https://www.drupal.org/project/drupal/issues/3618230

  As a content editor who uploads a file that is too large,
  I want the error to arrive with the markup the theme gives it, a Hide button I can use from the keyboard, and one announcement,
  so that I know what went wrong and can carry on.

  Today ManagedFile::uploadAjaxCallback() adds the error to the widget's #prefix, which is filtered by Xss::filterAdmin().
  That filter removes the theme's dismiss button in Default Admin, and removed the inline SVG icon in Olivero (#3457067).
  MR !16777 sends the error with the AJAX MessageCommand, into a container inside the file widget.
  Olivero is no longer in core (#3595089), so its SVG symptom cannot be shown on main; comment #10 asked whether Default Admin is affected.

  Background:
    # source: file:recipes/repro_3618230/recipe.yml
    Given the Article content type has a file field "Attachment" that accepts .txt files up to 1 KB
    And the admin theme is Default Admin
    And I am logged in as an administrator
    And I am on "/node/add/article"

  Scenario: An oversized upload shows one error inside the file field, and the field stays invalid
    # source: file:reports/issues/3618230/EVIDENCE.md (Results: "Error shown, and where")
    # source: file:reports/issues/3618230/FEEDBACK.md (FB-001: aria-invalid and aria-describedby, the same on both sides)
    # Before: passes (file:reports/issues/3618230/playwright/2026-10-15T15-10-35-411Z-chromium-light-1280x900/)
    # After: passes (the same run; the MR keeps the error inside the widget, as the issue summary says it chose to)
    When I upload a 2 KB .txt file to "Attachment"
    Then I see one error message inside the Attachment field
    And the message says the file could not be uploaded because it exceeds the maximum file size of 1 KB
    And assistive technology still reports "Attachment" as invalid, described by its help text

  Scenario: The upload error has a Hide button
    # source: file:reports/issues/3618230/EVIDENCE.md (Results, and "Manual check (2026-10-14, by a person)")
    # source: comment:10 (does the problem occur in Default Admin? quoted in SUMMARY.md, "Open points")
    # Before: fails: the word "Hide" is plain text, there is no button (the run above; the owner's manual check 2026-10-14)
    # After: passes: a Hide button with a close icon (the same run and check)
    When I upload a 2 KB .txt file to "Attachment"
    Then the error message has a "Hide" button

  @keyboard
  Scenario: The upload error can be dismissed with the keyboard
    # source: file:reports/issues/3618230/playwright/2026-10-15T15-10-35-411Z-chromium-light-1280x900/SUMMARY.md (Hide reached with Tab; Enter hides the error)
    # source: file:reports/issues/3618230/FEEDBACK.md (FB-002)
    # Before: fails: no Hide button to reach (60 Tab presses in the run above)
    # After: passes: reached at the 21st Tab stop and Enter hides the error (the run above); the owner, keyboard only, reported
    #   "no perceived problems" with Tab to Hide, Enter, or where focus lands (2026-10-15, macOS 27.0.1, browser not recorded; FB-002)
    # Focus after Enter was recorded as "button.button", not the page body; which button was not recorded.
    Given an upload error is showing in the Attachment field
    When I press Tab until the "Hide" button has focus
    And I press Enter
    Then the error message is no longer visible
    And keyboard focus does not go back to the top of the page

  @screen-reader
  Scenario: VoiceOver announces the upload error once
    # source: file:reports/issues/3618230/FEEDBACK.md (FB-003)
    # source: file:reports/issues/3618230/SUMMARY.md ("Not verified": role="alert" on the message and Drupal.announce() both fire on After)
    # Before: not run: no person tried a screen reader on Before (the run recorded a role="alert" message and no Drupal.announce() call)
    # After: passes: the owner, VoiceOver on macOS 27.0.1, heard the error once (2026-10-15, browser not recorded; FB-003)
    # NVDA, JAWS, TalkBack and other browsers were not tried.
    Given VoiceOver is running on macOS
    When I upload a 2 KB .txt file to "Attachment"
    Then VoiceOver announces the error once

  Scenario: A second oversized upload replaces the error instead of adding another
    # source: file:reports/issues/3618230/EVIDENCE.md (Results: "Errors after a second oversized upload")
    # Before: passes (the run above: 1 error)
    # After: passes (the run above: 1 error)
    Given an upload error is showing in the Attachment field
    When I upload the 2 KB .txt file to "Attachment" again
    Then I see one error message inside the Attachment field

  Scenario: A valid upload after the error clears it
    # source: file:reports/issues/3618230/EVIDENCE.md (Results: "Errors after a valid upload; file accepted")
    # Before: passes (the run above: 0 errors, file accepted)
    # After: passes (the run above: 0 errors, file accepted)
    Given an upload error is showing in the Attachment field
    When I upload a .txt file smaller than 1 KB to "Attachment"
    Then no error message is shown
    And the file is attached to the field

  @keyboard @screen-reader @unverified
  Scenario: A dismissed error is also gone for screen reader users
    # An open question for a person, not a finding. Nothing in the issue asks for this.
    # source: file:reports/issues/3618230/playwright/2026-10-15T15-10-35-411Z-chromium-light-1280x900/SUMMARY.md ("The dismissed error is still in the accessibility tree": After yes)
    # source: file:tools/playwright/evaluate-3618230.mjs (hideByKeyboard: the theme dismisses a message by fading it out and adding visually-hidden)
    # Before: not judged: Before has no Hide button
    # After: not judged: the run recorded the dismissed error as still in the accessibility tree. Whether a screen reader still reads
    #   it, and whether that matters, was not tested. The dismiss itself is the theme's behaviour, which MR !16777 makes reachable.
    Given an upload error is showing in the Attachment field
    When I press Tab until the "Hide" button has focus
    And I press Enter
    Then a screen reader reading the page no longer reads the error
