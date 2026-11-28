<!-- DRAFT for a human to review and post as a reply to comment #32. Do not post automatically.
     Rewrite in your own words and check every sentence against EVIDENCE.md and STATUS.md.
     The MR, its production code and the issue status were not changed by this review. -->

Tested main 97c6ff8b2534 with MR !9088 at aed1df5e. Chromium 159, Default Admin, trusted input.

The MR fixture reproduces the bug and the fix. Without the MR a short dialog grows to 729px and ends 212.3px below a 768px viewport. OK is off-screen. With the MR it re-centres to bottom 748.5 and OK is clickable. The observer ran once per expansion, stayed silent when idle, and disconnected on close.

The translation path also reproduces. Without the MR the dialog ends 2.9px below a 1080px viewport and the keyboard misses "Save translation". With the MR it re-centres and Save is reachable.

Views filter and Field UI do not reproduce on this revision. A maintainer should confirm the intended flow.

Suggestion: assert details is open and content scrolls. The test can pass if the click does nothing or content is clipped.

Not tested: Firefox, WebKit, zoom, forced colours, screen readers, a keyboard pass, local PHPUnit.

Generated with the help of an LLM.
