# Testing tools used in this lab, and what each is for

Local development only. Automated results are a DRAFT until a person has reviewed them.

| Tool | Used for | Where |
|---|---|---|
| **axe-core** (4.x, from npm, MPL-2.0) | Automated WCAG 2.0 to 2.2 A/AA checks. Runs live in both frames of the viewer and inside the Playwright walkthrough. The same engine powers Accessibility Insights and Playwright's axe integration. | `tools/compare` (live panel), `tools/playwright/walkthrough.mjs` |
| **Playwright** | Real (trusted) mouse and keyboard input, screenshots, accessibility-tree capture, replayable walkthroughs. `@playwright/mcp` is registered for this project in `.mcp.json`. | `tools/playwright/` |
| **Guidepup virtual screen reader** | What a screen reader would announce (name, role, state, description) on a DOM snapshot, compared before and after. **Synthetic by decision (2026-10-01): enough for comparing a change; no VoiceOver or NVDA pass is planned for now.** | `tools/playwright/screenreader.mjs` |
| **The compare viewer** | Before and after side by side, mirrored setup, manual confirmation, onion skin and difference views, live axe alerts. | `tools/compare/` |
| **Diff report** | Which served files and pages differ, after removing per-site noise. | `tools/compare/diff.mjs` |
| **Accessibility Insights for Web** (Microsoft, a person runs it) | Checking the **viewer itself**, and as an optional manual aid (below). It is not run by any script here. | see below |

## Accessibility Insights for Web
Not used by any automation in this lab: the scripts call axe-core directly. It has been used by hand for two things.

1. **Auditing the viewer.** An Accessibility Insights run (axe-core 4.11.3, Edge) on
   `http://localhost:8100/` reported `scrollable-region-focusable` (WCAG 2.1.1) on both frame panes: a region that scrolls
   horizontally at Tablet and Phone widths was not keyboard focusable. Fixed by making the two `<section class="pane">`
   elements `tabindex="0"` (they have accessible names, and a visible focus indicator from the page styles).
   Re-run it after changing the viewer.
2. **Optional manual aid for the keyboard pass.** Its *FastPass* and *Tab stops* tools visualise focus order and
   focusable elements. That suggests a useful manual check of a change under review: run Tab stops on the Before and After
   pages (not inside the viewer's iframes: open each site in its own window with the "Open outside this tool" links) and
   compare the tab-stop sequence. **Not yet tried in this lab**; treat it as a suggestion until it has been.

## What each kind of check can and cannot tell you
- Live axe and Playwright axe: new or removed WCAG A/AA failures that axe can detect. Typically a minority of real
  barriers. A difference between Before and After points at the change; "same" does not prove it is accessible.
- Playwright with trusted input: whether behaviour works for a real click and for keyboard activation. Script-generated
  clicks do **not** trigger the same behaviour (see `reports/issues/3619127/FINDINGS-2026-10-01.md`).
- Virtual screen reader: semantics only. No layout, no real speech, no browser quirks.
- Manual confirmation panel in the viewer: your own observation of both sides, recorded with the log.
