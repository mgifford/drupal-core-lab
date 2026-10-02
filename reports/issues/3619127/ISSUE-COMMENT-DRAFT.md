<!-- DRAFT for a human to review and post. Nothing has been posted. Written 2026-10-02. Check the issue and MR !16895 for newer comments first. -->

**AI-assisted:** yes. Tool: Claude Code. External code copied: no. Sources consulted: Drupal core (MR !16895 on core `d29add7ebc1`), WCAG 2.2 (2.4.3, 3.3.1, 3.3.3).

### What I tested
The MR in Chromium (Default Admin, narrow viewport so the sidebar starts closed), side by side with the same core without it: Create Article, type `no-slash` in "URL alias", close the sidebar, Save, then use the "URL alias" link in the error summary. Once with the mouse and once with the keyboard only (Tab to the link, Enter). Real input, not script-generated events.

### Result
- Without the MR: the sidebar stays closed, the field is not visible and does not get focus (mouse and keyboard).
- With the MR plus two small suggestions (attached as patches): the sidebar opens, the field is in the viewport and has focus (mouse and keyboard), and the saved sidebar preference is not overwritten.
- axe-core (WCAG 2.0 to 2.2 A and AA): 0 violations before and after using the link, with and without the change. No JavaScript errors. A virtual screen reader announces the field identically. A diff of everything the two sites serve shows one differing file, `sidebar.js`.
- `AdminInlineFormErrorsTest` fails without the change at "field is visible after using the error link" and passes with it (13 assertions).

### Suggestions (patches, each applies on top of the MR)
1. **No jQuery in `sidebar.js`** (vanilla JS; `core/jquery` removed from the library), answering the review objection.
2. **Do not persist the open state when opening from the error link**, and replace fixed `wait(500)` pauses in the test. A negative control (putting the persisting call back) makes the test fail at its `localStorage` assertion, so the assertion detects the problem.
3. *Optional:* a `DefaultAdminJavascriptTestBase` class, as one reviewer suggested.

### Steps to reproduce (local, DDEV)
Recipe, patches and the scripted replay are in https://github.com/mgifford/drupal-core-lab (`reports/issues/3619127/`): `node tools/compare/setup.mjs 3619127-pinned`, then `node scripts/lab-env.mjs start 3619127-pinned`. The recipe is `recipes/ife_sidebar_repro`. It also applied cleanly and reproduced and fixed on core `main` `073a7d38198` (2026-10-01).

### Not verified
Real VoiceOver or NVDA (a virtual screen reader was used); Firefox (it does not launch under Playwright on the test machine). Chromium was run in light, dark and emulated forced colours, WebKit in light and dark; in dark mode two regression checks differ because of the dark-mode contrast of the error colour, a separate pre-existing issue (#3625458). A person's keyboard pass (including pressing Enter on the same link twice), wide viewports, zoom and reflow, right-to-left and touch are also not covered; see `COVERAGE.md`.
