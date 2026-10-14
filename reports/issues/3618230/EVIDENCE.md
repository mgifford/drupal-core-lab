# Evidence: issue 3618230 (Adopt the ajax MessageCommand for file uploads)

Status: DRAFT. Scripted runs with real file input and real keys, plus one manual check of step 4 by a person (see "Manual check"). The evidence as a whole has not been reviewed by a person. No screen-reader, forced-colours or second-browser run.
Date: 2026-10-14   Author/agent: Claude Code. Question answered: comment #10 (kentr, 2026-10-02), "does the problem occur in the Default Admin theme now that Olivero is gone?"

## Answer to comment #10, in short
Yes. On current `main`, the node form and the front end both use `default_admin`. Its error message still loses markup on the way through the `insert` command: the **Hide dismiss `<button>` is stripped** and only the words "Hide" stay, as plain text. With MR !16777 the button arrives and works from the keyboard. The cause is the same one the issue describes for Olivero's SVG icon.

## Environments
| Env | Directory | Commit | Notes |
|-----|-----------|--------|-------|
| Baseline | envs/baseline-3618230-latest | `3b94128e929` (2026-10-14) | upstream `main`, no tracked changes; recipe `repro_3618230` (Attachment field, 1 KB, txt) |
| Patched  | envs/issue-3618230-latest | `3b94128e929` + patch | `branches/3618230-adopt-the-ajax.patch` (MR !16777, tip 2d600f40) applies cleanly; changes ManagedFile.php and its kernel test only |

Local DDEV on macOS (darwin arm64), PHP 8.5.7. Browser: Playwright Chromium 153.0.8010.12, light, 1280x900. Theme recorded from `drupalSettings.ajaxPageState.theme`.

## How it was run
    node tools/playwright/evaluate-3618230.mjs 3618230-latest
Logs in with a one-time link, opens `/node/add/article`, sets a 2 KB `.txt` on the Attachment input (`setInputFiles`), and records the AJAX commands, the raw `insert` markup, the error in the page, every `Drupal.announce()` call (a wrapper that passes calls through), an accessibility snapshot, axe-core (WCAG 2.0 to 2.2 A/AA) and JavaScript errors. Then uploads the oversized file again, then a valid file.
Output: [`playwright/2026-10-14T09-27-29-357Z-chromium-light-1280x900/SUMMARY.md`](playwright/2026-10-14T09-27-29-357Z-chromium-light-1280x900/SUMMARY.md) (results.json, screenshots).

## Results
| Check | Before | After |
|-------|--------|-------|
| Theme of the node form and the front page | default_admin | default_admin |
| AJAX commands for the failed upload | settings, update_build_id, insert | the same plus `message` (error) aimed at `#file-upload-messages-field-attachment-widget-0--…`, `clearPrevious` false |
| Error text inside the `insert` markup | yes | no (only the empty `div.file-upload-messages`) |
| Error shown, and where | 1, inside the Attachment widget | 1, inside the Attachment widget (in `.file-upload-messages`) |
| Hide `<button>` in the server-sent `insert` markup | **no**: `<span class="icon-close"></span> Hide` with no button | n/a (message comes from `Drupal.theme.message`) |
| Hide button in the page | **no**: "Hide" is plain text (see `before-1-error.png`) | yes, close (X) icon (see `after-1-error.png`) |
| Hide button by keyboard (separate check) | nothing to reach | reached with Tab (25th stop), Enter hides the message |
| `role` on the error, heading "Error message" | alert, yes | alert, yes |
| SVG in the error markup | no | no (icon is a CSS mask in both) |
| `Drupal.announce()` with the error text | none | 1 call, `assertive` |
| Errors after a second oversized upload | 1 | 1 (no pile-up) |
| Errors after a valid upload; file accepted | 0; yes | 0; yes |
| Focus after the failed upload | body | body |
| axe violations on the page with the error | 0 | 0 |
| JavaScript errors | 0 | 0 |

Code checks on After:
- `ddev phpunit core/modules/file/tests/src/Kernel/ManagedFileTest.php`: OK (2 tests, 19 assertions), including the MR's new `testUploadAjaxCallbackMessages`.
- PHPCS (core's `commit-code-check.sh` via `scripts/lint.mjs --host`): passed. Report: `lint/2026-10-14-3618230-latest-after.md`.
- PHPStan: passed, both in the DDEV container and with `--host` (`scripts/lint.mjs`, 2026-10-14). An earlier `--host` run had crashed at the 128 MB PHP memory limit, which was a tool error, not a result; `lint.mjs` now passes core's `--memory-unlimited` and reports such a crash as ERROR. Report: `lint/2026-10-14-3618230-latest-after.md`.

## Why Before loses the button (cause found)
`ManagedFile::uploadAjaxCallback()` appends the rendered `status_messages` to `$form['#prefix']` as a plain string. `Renderer` runs `#prefix` through `Xss::filterAdmin()` (`core/lib/Drupal/Core/Render/Renderer.php:563`), and `Xss::$adminTags` lists neither `button` nor `svg`. Default Admin's `status-messages.html.twig` renders the dismiss `<button>`, so it is removed. Olivero's inline SVG was removed the same way.

## Manual check (2026-10-14, by a person)
Mike Gifford, in the side-by-side viewer (http://localhost:8100) on `3618230-latest` (core `3b94128e929`, the same pair as above), uploaded `meetings.csv.txt` (12.5 KB) to the Attachment field in each frame and inspected the result with the browser's developer tools. Browser and version: not recorded.

| | Before | After |
|---|---|---|
| Error text | "The specified file meetings.csv.txt could not be uploaded. The file is 12.5 KB exceeding the maximum file size of 1 KB." | the same |
| Where the error is | `div[data-drupal-messages].messages-list` inside the Attachment AJAX wrapper; no `file-upload-messages` anywhere on the page | inside `div#file-upload-messages-field-attachment-widget-0--….file-upload-messages` |
| Built by | the server (`aria-labelledby` on the message, no `data-drupal-message-id`) | `Drupal.theme.message` (`data-drupal-message-id`, `data-drupal-message-type`, `aria-label`) |
| Hide | `<span class="icon-close"></span> Hide`, no `<button>`: shown as plain text | `<button type="button" class="button button--dismiss js-message-button-hide">` (X) |
| Field error state | label `has-error`; input `aria-invalid="true"`, `aria-describedby` to the description | not inspected |

This agrees with the scripted results above. Not done in this check: Hide by keyboard, a screen reader, and the After input's `aria-invalid`.

## Findings
1. The problem in the issue still happens in the Default Admin theme. It shows as a missing dismiss button, where Olivero showed a missing icon.
2. The MR fixes it: the message is built in JavaScript by the theme, keeps the button, and the button works by keyboard.
3. After also announces the error through `Drupal.announce()` (assertive) while the message element itself keeps `role="alert"`. A screen reader may say the error twice. **Not tested** with a screen reader.
4. Placement is unchanged on purpose (fago, comment #4): the error stays inside the widget on both sides.

## Adjacent barrier (not caused by the MR, not fixed)
After pressing Hide, Default Admin adds `visually-hidden` to the message (`core/themes/default_admin/migration/js/messages.js:72`). The message stays readable by screen readers and keyboard focus stays on the now invisible Hide button. Worth its own issue; out of scope here.

## Not verified
- A real or synthetic screen reader (the possible double announcement in finding 3).
- Firefox and WebKit, dark mode, forced colours, zoom and reflow.
- The pinned core pair (`f5e265802542`).
- A multi-value file field (the MR comment says the unique ID handles it).
- Any step by a person other than the manual check of step 4 above (no keyboard pass, no review of the evidence as a whole).
- Whether the After file input keeps `aria-invalid="true"` after a failed upload (the MR does not touch it; not checked).

## Earlier run (2026-10-08, superseded)
Coder cloud workspace, core `a19dfee86688`, headless Chromium, active theme not recorded. Result then: `.file-upload-messages` only on After, only after the failed upload. That agrees with this run. Its precondition (`input[type='file']`) was found too weak: the form has three file inputs.
The folder `playwright/2026-10-14T09-26-37-241Z-chromium-light-1280x900/` is a first run of today's script with a loose check (it matched "size" anywhere). It is superseded by the 09-27-29 run above and can be deleted.
