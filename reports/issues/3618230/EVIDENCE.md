# Evidence: issue 3618230 (Adopt the ajax MessageCommand for file uploads)

Status: DRAFT. Scripted checks only. No manual, keyboard, screen-reader or forced-colours run has been done, and a human has not reviewed it.
Date: 2026-10-03   Author/agent: Claude Code (scripted run). The issue pack was drafted by Gemini and its recipe was replaced by one the maintainer supplied.

## Environments (record exact commits)
| Env | Directory | Commit | Notes |
|-----|-----------|--------|-------|
| Baseline | envs/baseline-3618230-latest | `a19dfee86688` | upstream `main` (commit date 2026-10-01), recipe `repro_3618230` applied |
| Patched  | envs/issue-3618230-latest | `a19dfee86688` + patch | MR !16777 (branch tip `2d600f40b97`), applied cleanly; same recipe |

Where: a DDEV Freeform workspace on coder.ddev.com, Standard install, admin/admin. Browser: headless Chromium driven by Playwright (Linux). The active theme was not recorded.
The recipe adds an optional **Attachment** file field to the Article form with a 1 KB size limit (.txt only).

## Automated results (2026-10-03, one run)
Scenario: log in, open `/node/add/article`, choose a 2 KB `.txt` file in the Attachment field, wait for the AJAX response. The checks are the pack's own probes.

| Check | Before | After |
|-------|--------|-------|
| precondition: a file input is present | holds | holds |
| fix: `.file-upload-messages` exists, before any upload | false | false |
| fix: `.file-upload-messages` exists, after the failed upload | **false** (does not hold) | **true** (holds) |
| regression: JavaScript errors on the page | 0 | 0 |
| question: an error appears when an oversized file is uploaded | yes | yes |
| question: the message sits in the dedicated container | no | yes |

An earlier scripted run on 2026-10-02 against the same two sites also recorded: Before, the error is inline with a `role="alert"` region and nothing else; After, the `.file-upload-messages` wrapper (id like `file-upload-messages-field-attachment-widget-0--<suffix>`) holds the message, and there is an additional `aria-live="assertive"` element with the same text.
Choosing a disallowed extension (a `.txt` file in the image field) is rejected in the browser with no AJAX request on both sites, so that path does not reach the changed code.

## Manual results (keyboard, screen reader, forced colours)
NOT RUN. AT/browser/OS versions: none.

## Findings
- On current core `main`, with this recipe, the merge request changes how the upload error is delivered: it appears through a `MessageCommand` into a wrapper inside the widget, as the issue describes. This is an observation of markup, not an accessibility conformance finding.
- The message stays inside the widget on both sides; the MR does not move it to the page's message region.
- Whether a screen reader announces the message was not tested. The extra `aria-live` element on After is evidence of markup only.

## Not verified
- The pinned pair (`3618230-pinned`, core `f5e265802542`) was never built.
- Comment #10's question (does the problem occur in the Default Admin theme) is not answered: the theme was not recorded.
- No assistive technology, keyboard-only, forced-colours or other-browser (Firefox, WebKit) run.
- The checks were run by a script on each site's page, not inside the viewer's frames, and from one run.
