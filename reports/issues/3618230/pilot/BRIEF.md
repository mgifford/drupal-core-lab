# #3618230 brief (Phase 4 pilot, 2026-10-15)

DRAFT. A compact, source-backed intake for the pilot: what to know before touching the change, and where each fact comes from. It
replaces re-reading the issue page, the pack and the evidence at the start of a session. Re-check the issue before relying on it.

## The reported defect

`ManagedFile::uploadAjaxCallback()` renders status messages into the widget's `#prefix` and sends the result in the replace command.
The prefix is filtered by `Xss::filterAdmin()` on the way out, so markup in the message is stripped (Olivero's inline SVG, issue
#3457067; in `default_admin` the Hide `<button>`). The MR sends the messages with `MessageCommand` into a container it adds to the
prefix, so the theme's own message rendering is used. Source: `PACK.yml` summary; `SUMMARY.md`; code in `CODE-MAP.md`.

## What the sources say

| Fact | Source |
|---|---|
| Issue: Adopt the ajax MessageCommand for file uploads. Component file.module, tag Accessibility. Status is **Active** on 2026-10-15 (it was Postponed on 2026-10-14) | `node scripts/issue-status.mjs 3618230` (drupal.org API), `STATUS-2026-10-14.md` |
| MR !16777, branch `3618230-adopt-the-ajax`, head `2d600f40`, applies to `main` `3b94128e929` | `BRANCHES.md`, status fetch |
| Comment #10 (kentr, 2026-10-02): Olivero is gone (#3595089); does it happen in the Default Admin theme? | issue page, `PACK.yml` |
| Comment #11 (mgifford, 2026-10-14): yes, it still appears with Default Admin | status fetch |
| Comment #12 (mgifford, 2026-10-14): proposes `FileUploadAjaxMessageTest.php`, which could not be added to the MR | status fetch |
| Related: #3457067, #3086096, #3081526, #3595089 | `STATUS-2026-10-14.md` |

## What the lab established (all DRAFT, nothing posted)

| Claim | Evidence |
|---|---|
| Before loses the Hide button (the message is filtered), After keeps it | run `2026-10-15T15-10-35-411Z-chromium-light-1280x900`, rows '"Hide" dismiss button in the error (page)': Before no, After yes |
| The same starting state on both sides | `recipes/repro_3618230` (hash in `results.json` `identity.recipe`), pilot variant `3618230-pilot` |
| Regression tests: two fail Before and pass After, two pass on both | `pilot/TESTS-RUN.md` |
| The MR does not weaken the file input's error state | FB-001, `testFieldKeepsErrorState` |

## Not known (needs a person)

- Whether focus landing on the faded-out Hide button after Enter is acceptable (FB-002).
- Whether a real screen reader speaks the error once or twice: `role="alert"` and `Drupal.announce()` both carry it (FB-003).
- Firefox, WebKit, dark mode, forced colours, zoom and reflow; a multi-value file field; the pinned core.
- Whether the maintainers accept the change in where messages land (inside the widget before, a container the MR adds now). The pilot did not read the issue's discussion of this; only comments #10 to #12 were fetched.

## How a session should start

1. `node scripts/issue-status.mjs 3618230` for what changed upstream since `status.json`.
2. This brief, then `CODE-MAP.md`, then `FEEDBACK.md`: that is the whole starting context; do not read the 14 KB `EVIDENCE.md` unless a number is in question.
3. `node scripts/lab-env.mjs start 3618230-pilot` and `node tools/playwright/evaluate-3618230.mjs 3618230-pilot`.
