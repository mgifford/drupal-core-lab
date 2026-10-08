# Evidence: issue 3618230 (Adopt the ajax MessageCommand for file uploads)

Status: DRAFT. One scripted run on current core with the checks of this pack. No manual, keyboard, screen-reader or forced-colours run has been done, and a human has not reviewed it.
Date: 2026-10-08   Author/agent: Claude Code (scripted run). The pack was drafted by Gemini from the prompt built by `issue-pack.mjs prepare`, and its checks come from the check templates.

## Environments
| Env | Directory | Commit | Notes |
|-----|-----------|--------|-------|
| Baseline | envs/baseline-3618230-latest | `a19dfee86688` | upstream `main` (commit date 2026-10-01), recipe `repro_3618230` applied |
| Patched  | envs/issue-3618230-latest | `a19dfee86688` + patch | MR !16777, `branches/3618230-adopt-the-ajax.patch`; the working tree shows 2 changed files (ManagedFile.php and its kernel test) |

Where: DDEV Freeform workspace `lab-3619127` on coder.ddev.com, fresh `scripts/cloud-bootstrap.mjs 3618230-latest` run (smoke check passed: 6 passed, 0 failed, 1 not checked: frames at the Coder app URLs need a signed-in browser). Browser: headless Chromium driven by Playwright, reaching the two sites on the viewer's local ports 8101 and 8102. Login admin/admin. The active theme was not recorded. The pinned core in `variants.json` (`f5e265802542`) was NOT run.

## Automated results (one run)
Scenario: log in, open `/node/add/article`, choose a 2 KB `.txt` file in the Attachment field (1 KB limit), wait 4 seconds. The checks are the pack's own probes, evaluated with `page.evaluate`, not through the viewer's Run checks button.

| Check | Before | After |
|-------|--------|-------|
| precondition: a file input exists | true | true |
| fix: `.file-upload-messages` exists, before any upload | false | false |
| fix: `.file-upload-messages` exists, after the oversized upload (AJAX response 200) | **false** | **true** |
| regression: JavaScript errors | 0 | 0 |

Markup seen after the upload: Before, the error is inline in a `role="alert"` list item and there is no wrapper element. After, a `div.file-upload-messages` with an id like `file-upload-messages-field-attachment-widget-0-…` holds the error item, which also has `role="alert"`.

## Findings
- The fix check distinguishes Before from After, but only after the failed upload. Before the upload it is false on both sides, so Run checks pressed too early shows no difference.
- The form has three file inputs and the Image field comes first. An upload into it (png, gif, jpg, jpeg, webp only) is rejected by the browser before any server code runs: a first run did exactly that and made no AJAX request. The precondition `input[type='file']` is therefore too weak: it holds even if the Attachment field is missing.
- This agrees with the earlier hand-built run for this issue (wrapper only on After).

## Not verified
- The pinned core pair; the viewer's Run checks button and the frames at the Coder app URLs; keyboard, screen-reader announcement, forced colours; the Default Admin theme question in comment #10 (the active theme was not recorded); the wording of the upload error; any step by a person.
