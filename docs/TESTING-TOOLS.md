# Testing tools used in this lab, and what each is for

Local development only. Automated results are a DRAFT until a person has reviewed them.

| Tool | Used for | Where |
|---|---|---|
| **axe-core** (4.x, from npm, MPL-2.0) | Automated WCAG 2.0 to 2.2 A/AA checks. Runs live in both frames of the viewer and inside the Playwright walkthrough. The same engine powers Accessibility Insights and Playwright's axe integration. | `tools/compare` (live panel), `tools/playwright/walkthrough.mjs` |
| **Playwright** | Real (trusted) mouse and keyboard input, screenshots, accessibility-tree capture, replayable walkthroughs. `@playwright/mcp` is registered for this project in `.mcp.json`. | `tools/playwright/` |
| **Guidepup virtual screen reader** | What a screen reader would announce (name, role, state, description) on a DOM snapshot, compared before and after. **Synthetic by decision (2026-10-01): enough for comparing a change; no VoiceOver or NVDA pass is planned for now.** | `tools/playwright/screenreader.mjs` |
| **Lighthouse** (13.x, Apache-2.0, optional) | Accessibility and best-practice (optionally performance) audits of a page as it loads, logged in, run in the background by the viewer in its own headless Chrome. Fresh page loads only: it cannot see states reached by clicking. Needs Node 22.19+. | `tools/compare/lighthouse.mjs` (panel in the viewer) |
| **Playwright browsers and modes** | The same scripted walkthrough in Chromium, Firefox and WebKit (Safari's engine), light and dark, and forced colours. Each run records its environment; `scripts/coverage.mjs` turns the runs into a matrix where a missing row is a visible gap. | `tools/playwright/walkthrough.mjs --browser= --scheme= --forced-colors`, `scripts/coverage.mjs` |
| **The compare viewer** | Before and after side by side, mirrored setup, manual confirmation, onion skin and difference views, live axe alerts. | `tools/compare/` |
| **Diff report** | Which served files and pages differ, after removing per-site noise. | `tools/compare/diff.mjs` |
| **Changes after input** | After each real click, key press or typing in an evaluator run, the text that appeared or changed and how a screen reader user learns of it (live region, `Drupal.announce()`, focus, disclosure); **silent** ones are candidates for WCAG 4.1.3 Status Messages, compared Before vs After. Part of every evaluator run. [docs/SILENT-CHANGES.md](SILENT-CHANGES.md) | `tools/playwright/lib/recorder.mjs` |
| **Accessibility tree diff** | Did the change alter what assistive technology is given? Per page, Before vs After: Chromium's accessibility tree, the ARIA attributes after JavaScript (broken ID references flagged) and Guidepup's speech through the whole page. Each page as it loads. [docs/ACCESSIBILITY-TREE-DIFF.md](ACCESSIBILITY-TREE-DIFF.md) | `tools/playwright/tree-diff.mjs` |
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

## Other engines worth considering (not built)
A second in-page rule engine (IBM Equal Access `accessibility-checker`) would run live like axe and often reports different issues, which is
useful as a second opinion. Pa11y (HTML_CodeSniffer) and the Nu HTML Checker (markup validity) are other candidates. Each would add its
own panel; none is installed.

Whole-page visual comparison (screenshots of each page Before and After at several widths and accessibility states, pixel
diffs, changed regions named): a to-do with the open-source tools to evaluate, in [TODO-VISUAL-DIFF.md](TODO-VISUAL-DIFF.md).

## What each kind of check can and cannot tell you
- Live axe and Playwright axe: new or removed WCAG A/AA failures that axe can detect. Typically a minority of real
  barriers. A difference between Before and After points at the change; "same" does not prove it is accessible.
- Playwright with trusted input: whether behaviour works for a real click and for keyboard activation. Script-generated
  clicks do **not** trigger the same behaviour (see `reports/issues/3619127/FINDINGS-2026-10-01.md`).
- Virtual screen reader: semantics only. No layout, no real speech, no browser quirks.
- Lighthouse: page-load audits only; scores are coarse and its accessibility audits are a subset of axe's.
- Browser and colour-mode matrix: emulated colour scheme and forced colours (not a real OS setting); WebKit is Safari's engine, not Safari.
- Manual confirmation panel in the viewer: your own observation of both sides, recorded with the log.
- Lint (`node scripts/lint.mjs <slug>`): whether the patch passes core's own code checks (CSpell, PHPCS, PHPStan, ESLint, Stylelint,
  twig-cs-fixer, `.pcss.css` versus `.css`, file modes). Nothing about accessibility.

## Code checks: the same ones core's CI runs (`scripts/lint.mjs`)
Runs `core/scripts/dev/commit-code-check.sh`, the script core's GitLab CI uses, with core's own configuration, on **only the files the
variant's patches change**, and writes `reports/issues/<nid>/lint/<date>-<slug>-<side>.md`. Contrib-oriented add-ons
(`ddev-drupal-code-quality`, the Kalamuna post of 2026-10-13) are not used: they `composer require` into the project, which the lab forbids
for a core checkout, and they target the contrib GitLab templates, not core.

    node scripts/lint.mjs <slug>                     # After side, inside its DDEV environment
    node tools/compare/setup.mjs <slug> --checkout-only && node scripts/lint.mjs <slug> --host   # no Docker: host PHP, Composer, Node

- Files are chosen from the patches (`+++ b/...`), through a throwaway git index in `<env>/.lab-lint/` (removed afterwards). The core
  checkout's git state is not changed, and local files (`.ddev/`, `settings.php`) are never checked.
- A tool that did not start (wrong Yarn, missing module, PHP fatal error) is reported as **ERROR, not FAIL**: core's script would
  otherwise mark every later JS and CSS check failed, including a false ".pcss.css does not match".
- Core pins Yarn (`packageManager`); if the global Yarn differs, the script uses Corepack's through a shim. `core/node_modules`
  (about 400 MB) is installed if missing; `lab-env.mjs trim --deep` removes it again.
- Host PHP older than core requires stops the run unless `--ignore-php-version` is given; the report then says PHPStan and PHPCS
  may differ from CI. Prefer the DDEV environment (PHP 8.5).
- **Verified only with `--host`** (2026-10-14, a cloud container with no Docker and PHP 8.3). The DDEV path (`ddev exec` in the web
  container, PHP 8.5) is written but has not been run yet; run it once and record the result before relying on it.
- Negative control (2026-10-14, #3604037): a misspelt, unformatted JS line, an uncompiled `.pcss.css` rule and a badly formatted PHP
  function made CSpell, ESLint, Stylelint, the `.pcss.css` check, PHPCS and PHPStan fail; restoring the files made them pass.
