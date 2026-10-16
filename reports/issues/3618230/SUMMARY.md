# #3618230: Adopt the ajax MessageCommand for file uploads

**DRAFT.** Written from an issue pack (Gemini (chat), from issue page #3618230 and MR !16777). A person has not yet confirmed the steps or the checks.

**This is the entry point for this issue.** It links to the patch, the recipe, the evidence and the comment draft. Start with **Files and links** below, or `REPRODUCE.md` for the step-by-step commands.

Issue: https://www.drupal.org/project/drupal/issues/3618230  
Merge request: !16777  
Fork branch: `3618230-adopt-the-ajax`  
Status snapshot: [STATUS-2026-10-14.md](STATUS-2026-10-14.md)

## Summary

Reported problem: ManagedFile::uploadAjaxCallback() renders status messages directly into the replaced widget prefix inside the insert AJAX command instead of using the AJAX MessageCommand (introduced in Drupal 8.8). This causes HTML filtering issues with inline icons (e.g. SVG icons stripped in Olivero, issue #3457067), relies on inline markup for screen reader announcements rather than aria-live, and hardcodes message placement inside the widget instead of giving the theme control over rendering.

The merge request (!16777) alters ManagedFile::uploadAjaxCallback() to append a unique container (div with class file-upload-messages) in the widget prefix and sends error messages using MessageCommand targeted at that container via its wrapperQuerySelector.

Open points: comment #10 asked whether the problem still occurs in the Default Admin theme now that Olivero is removed (#3595089). **Lab answer (2026-10-14, DRAFT): yes.** On `main` `3b94128e929` the node form uses `default_admin`; without the MR its error loses the Hide dismiss `<button>` (stripped by `Xss::filterAdmin()` on `#prefix`, the same cause as Olivero's SVG). With the MR the button is there and works by keyboard. See [EVIDENCE.md](EVIDENCE.md).

## Files and links

| What | Where |
|---|---|
| How to reproduce (commands, pinned and latest) | [REPRODUCE.md](REPRODUCE.md) |
| The patch under test | [`branches/`](branches/) · [BRANCHES.md](BRANCHES.md) |
| Recipe (starting state) | [`recipes/repro_3618230/`](../../../recipes/repro_3618230/) (copy: [`recipe/`](recipe/)) |
| Evidence, exact commits | [EVIDENCE.md](EVIDENCE.md) |
| Draft comment (do not post) | [ISSUE-COMMENT-DRAFT.md](ISSUE-COMMENT-DRAFT.md) |
| Bug summary in Gherkin, one behaviour per scenario (DRAFT, written by an AI assistant 2026-10-16) | [BUG.feature](BUG.feature) |
| Status snapshot | [STATUS-2026-10-14.md](STATUS-2026-10-14.md) (earlier: [2026-10-08](STATUS-2026-10-08.md)) |
| Playwright evidence, 2026-10-14 | [`playwright/2026-10-14T09-27-29-357Z-chromium-light-1280x900/`](playwright/2026-10-14T09-27-29-357Z-chromium-light-1280x900/SUMMARY.md) (`tools/playwright/evaluate-3618230.mjs`) |
| Lint report | [`lint/`](lint/) |
| Original pack as received | [PACK.yml](PACK.yml) |

## Sources

- https://www.drupal.org/project/drupal/issues/3618230 (2026-10-04): Issue page with comments #1 to #10 (status Postponed)
- https://git.drupalcode.org/project/drupal/-/merge_requests/16777 (2026-10-04): Merge request !16777, opened, source branch 3618230-adopt-the-ajax, target branch main

## Setup blocks

- article_content_type [added automatically]. Verified: Core fixture recipe; applied on core a19dfee86688 (commit date 2026-10-01) in the #3618230 and #3415961 builds.
- file_field_with_size_limit (field: attachment, label: Attachment, limit: 1 KB, extensions: txt). Verified: Applied on core a19dfee86688 (commit date 2026-10-01) in the #3618230 build; a 2 KB .txt file in the field produced the server-side upload error on Before and After (scripted run, 2026-10-03).

## Not verified

- Screen readers other than VoiceOver: with the MR the error has `role="alert"` and is also sent to `Drupal.announce()` (assertive). The owner tried VoiceOver on macOS 27.0.1 (reported the evening of 2026-10-15, local time) and heard the error once (FB-003, a person's report; browser not recorded); NVDA, JAWS and other browsers were not tried
- Firefox, WebKit, dark mode, forced colours, zoom and reflow
- The pinned core pair (`f5e265802542`); a multi-value file field
- Any step by a person

## Notes

The issue was created by fago and postponed pending information on how it behaves with the Default Admin theme following Olivero's removal.
The MR changes ManagedFile::uploadAjaxCallback to output a wrapper container with an ID matching file-upload-messages-* and sends messages via MessageCommand targeting that selector.
