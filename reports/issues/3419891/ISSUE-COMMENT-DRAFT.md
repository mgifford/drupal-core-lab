<!-- DRAFT — for a human to review before posting. Nothing is posted automatically.
     Facts come from EVIDENCE.md and the runs in playwright/ and regression/.
     Check it with: node scripts/check-draft.mjs 3419891 -->

Tested main `0387fb948f7` (2026-11-25, CKEditor 5 49.1.0) in Chromium 143 and Playwright WebKit 27.2 on macOS, against MR !16984.

The six-row field is scrollable. `overflow-y` computes to `auto`, `scrollHeight` is 218 and `clientHeight` 134, and keyboard scrolling moves the content. This machine reports a 0 px scrollbar gutter, so macOS paints an overlay scrollbar only while scrolling. The content is reachable, so I do not treat the missing scrollbar as a defect.

I reproduced the reopen problem. After Cancel, reopening restored the empty value but kept the 136 px height and left Save enabled. CKEditor's `TextareaView` recalculates only on `change:value`, and typing does not update that value.

A follow-up resets the field before restoring the value. Reopening now uses 32 px and disables Save. A FunctionalJavascript test fails on the MR alone and passes with the follow-up.

I could not read the MR review threads (HTTP 401).

Generated with the help of an LLM.
