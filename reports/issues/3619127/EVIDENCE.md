# Validating #3619127: how it was checked, and the results

How to reproduce the problem is in [REPRODUCE.md](REPRODUCE.md). This file records **how the change was validated** and what the
results were. Everything here was run against the pinned core `d29add7ebc18954dcb88877ed38b5bd88cdbf967` (2026-09-30) on 2026-10-01
unless stated. Evidence is a **DRAFT** until a person has reviewed it.

Goal: show that opening the Default Admin sidebar from an Inline Form Errors (IFE) error link works, with no jQuery dependency in
`sidebar.js` (answering mherchel's review objection on MR !16895) and without overwriting the user's saved sidebar preference
(patch 1), and that it does not make anything else worse.

The patches stack: MR `branches/3619127-forms-sidebar-with-ife.patch`, then `patch-0-vanilla-js-no-jquery.patch`, then
`patch-1-no-persist-and-waits.patch`. `patch-2-optional-base-class.patch` (a test base class suggested by a reviewer) is optional.

## Layers of evidence

| Layer | Command | What it tells you |
|---|---|---|
| Side-by-side viewer, by hand | `node tools/compare/serve.mjs 3619127-pinned` | A person sees Before and After; Mirror does the setup; real clicks for the last step; checks and a manual panel. |
| Scripted walkthrough, real input | `node tools/playwright/walkthrough.mjs 3619127-pinned` | Mouse and keyboard-only, axe at each stage, field accessibility tree, screenshots. Exit code 2 if anything is not as expected. |
| Virtual screen reader | `node tools/playwright/screenreader.mjs 3619127-pinned` | What is announced for the field (semantics only, synthetic). |
| PHPUnit browser test | in `envs/issue-3619127-vanilla`: `ddev phpunit core/themes/default_admin/tests/src/FunctionalJavascript/AdminInlineFormErrorsTest.php` | The MR's own test (added by the MR patch). |
| Diff report | `node tools/compare/diff.mjs 3619127-pinned` | Which served files and pages differ between the sites. |

## Results (2026-10-01, pinned core)

| Check | Before (upstream) | After (MR + patches 0, 1) |
|---|---|---|
| PHPUnit `AdminInlineFormErrorsTest` | **Fails** at the "field is visible after using the error link" assertion (line 95, after 10 assertions) | **Passes** (13 assertions) |
| Walkthrough, mouse: sidebar opens | no | yes |
| Walkthrough, mouse: URL alias field receives focus | no | yes |
| Walkthrough, mouse: field is in the viewport | no | yes |
| Walkthrough, keyboard only: the same three | no, no, no | yes, yes, yes |
| Saved sidebar preference unchanged (`false`) | yes | yes |
| axe-core violations (WCAG 2.0 to 2.2 A/AA), before and after using the link | 0 and 0 | 0 and 0 |
| JavaScript errors (ignoring the harmless "ResizeObserver loop" notice) | 0 | 0 |
| Virtual screen reader announcement for the field | `textbox, URL alias, no-slash, <help text>, invalid` | identical |
| Diff report | (reference) | 1 served file differs: `core/themes/default_admin/migration/js/sidebar.js` |
| Visual difference, Create Article page | (reference) | none (pure black in Difference view) |
| jQuery in the `sidebar` library | n/a | no `core/jquery` dependency |
| Real VoiceOver / NVDA | not done | not done: deferred by decision (2026-10-01) |

Reference runs: `playwright/<newest>/SUMMARY.md` (records the exact core commits), `screenreader/<newest>/SUMMARY.md`,
`compare/3619127-pinned/SUMMARY.md`.

Negative control for patch 1 (done earlier in a different checkout): putting the persisting call back (`showSidebar()` without
`false` in the fragment handler) makes the test fail at its `localStorage` assertion, so that assertion does detect the problem.

## Manual pass (a person, keyboard)
Use the viewer or the two sites in separate windows, window about 480 to 800 px wide so the sidebar starts closed.

1. Open `/node/add/article`. Tab to the sidebar toggle, press Enter to open it.
2. Tab to "URL alias", press Enter or Space to open it, type `no-slash`.
3. Tab back to the toggle, press Enter to close the sidebar.
4. Tab to Save, press Enter. The error summary appears.
5. Tab to the "URL alias" link in the error summary, press Enter.

Pass: the sidebar opens, the field is visible and has focus (2.4.3, 3.3.1, 3.3.3), focus is visible (2.4.7) and not hidden
behind sticky UI (2.4.11), no keyboard trap (2.1.2), pressing Enter a second time on the same link still works (this is why the
patch listens for clicks as well as hash changes), and after a reload the sidebar returns to the state the user last chose.
Note that a **script-generated** click does not trigger the focus behaviour; use real input (see `FINDINGS-2026-10-01.md`).
Optional aid, not yet tried here: Accessibility Insights for Web "Tab stops" on each site in its own window
(`docs/TESTING-TOOLS.md`).

## Known limits
Only the Default Admin theme, one browser engine (Chromium), narrow viewports, and the Article form's URL alias field were
exercised. A real screen reader was not used. An unrelated upstream test is flaky on pristine `main`
(`FormErrorHandlerCKEditor5Test::testFragmentLink`, 2 failures in 6 runs): do not blame a patch for it.
