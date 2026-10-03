<!-- DRAFT for a human to review and post. Do not post automatically. -->
**AI-assisted:** yes. Tool: Claude Code for the scripted run and tooling; the issue pack was drafted by Gemini. External code copied: no.

### What I tested
Two sites on current core `main` (`a19dfee86688`): one unpatched, one with MR !16777. A recipe adds an optional Attachment file field with a 1 KB limit to the Article form. In a scripted headless Chromium session I chose a 2 KB `.txt` file in that field on each site (one run).

### Result
Before: the error appears inline in the widget (a `role="alert"` region). After: it is delivered through a `MessageCommand` into a `.file-upload-messages` wrapper inside the widget, and an additional `aria-live="assertive"` element carries the same text. No JavaScript errors on either side. The message stays inside the widget on both sides.

### Steps to reproduce
See `reports/issues/3618230/REPRODUCE.md` in https://github.com/mgifford/drupal-core-lab (recipe `repro_3618230`, variant `3618230-latest`).

### Not verified
Whether the problem occurs in the Default Admin theme (comment #10; the theme was not recorded); any screen reader, keyboard-only or forced-colours behaviour; Firefox and WebKit; the pinned core `f5e265802542`. This is not an accessibility conformance finding.
