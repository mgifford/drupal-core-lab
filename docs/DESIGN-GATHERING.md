# Gather theme, contrast and print observations

AI-assisted pilot, prepared 2026-10-17 against Lab c98f067f0fd48829dcad5ab44ebd9cdefec8cda3.
This is local Lab tooling, not a Drupal patch. It uses an existing registered Before/After variant and does not change its recipes or patch stacks.

## What this adds

- Frame headings show each request's browser-reported theme.
- Environment shows a theme comparison, a bounded 100-event history and a keyboard-accessible Download theme evidence button.
- Navigation/theme changes are included in that download and the existing accessibility-log export. History also records media preferences and root mode markers.
- A Playwright command gathers initial-load DOM/typography/structure and screen/print differences on both sites.
- JSON, Markdown and a printable HTML report preserve theme changes, CSSOM access gaps, sampling limits, failures and separate contrast observations.
- Optional bounded link discovery and A4/Letter PDFs support further investigation.

No new design conformance score, automatic fixes, complete interaction crawler, crawl button, or site-wide axe/Lighthouse audit is implemented by this pilot. Those remain later phases.
No existing Drupal issue/MR is altered. The source used for issue #3631337 context was the repository's saved REPRODUCE.md and evaluator; the live issue page could not be fetched during preparation.

## Install and check

Apply the supplied Git patch on a local feature branch, then:

```sh
cd tools/playwright
npm ci --ignore-scripts
npx playwright install chromium
cd ../..
node --test tests/design/observations.test.mjs
node tools/playwright/design-observations-fixture.mjs
node scripts/build-cloud.mjs
node scripts/selftest.mjs
```

The browser fixture needs neither DDEV nor Drupal. It exercises actual print rendering, independently emulated contrast preferences, viewer theme transitions, source checks and keyboard download. It is distinct from Drupal verification.
Restart an already-running viewer after applying the patch. Existing open tabs must be reloaded.

## Start with one built comparison

Replace the slug below if using another registered comparison. The following scenario already exists in main:

```sh
node scripts/doctor.mjs 3631337-pinned
# Only if this comparison has not been built:
node tools/compare/setup.mjs 3631337-pinned
node scripts/lab-env.mjs start 3631337-pinned
```

The start command stays running in that terminal. In the viewer, open Environment and navigate both pages. The heading and event history must show actual reported theme changes, not just a configured admin theme.
A theme switch may be valid or itself a regression. The tool does not decide that from the theme name.

In a second terminal at the repository root:

```sh
node tools/playwright/gather-design.mjs 3631337-pinned --pages=docs/design-pages.example.json --max-pages=5
```

The final console line identifies the output directory, normally under reports/issues/3631337/playwright/<timestamp>/design/.
This observes five pages per side, in anonymous or administrator contexts as declared. It does not submit forms.
The existing Lab patch/environment guards are retained: build the comparison correctly rather than bypass a mismatch.

## Contrast must be recorded as separate facts

| Dimension | How it is recorded | What it does not establish |
|---|---|---|
| Requested colour scheme | --scheme=light or --scheme=dark | Theme's effective colour class or user choice |
| Requested more contrast | --contrast=more | Native OS contrast theme or theme setting |
| Requested forced colours | --forced-colors | A real Windows/custom palette |
| Observed preferences | matchMedia for forced-colors, prefers-contrast, colour scheme | Whether each component implements them correctly |
| Theme mode markers | Root classes containing contrast or dark-mode | Effective support or measured contrast ratio |
| Configured theme settings | Read-only SQLite config export of high_contrast_mode, enable_dark_mode, layout_density | Per-user or request-specific overrides |
| Rendered implementation | Computed colours, borders, outline and pseudo-element border properties | Focus state unless a scenario actually focuses the element |

Run separate named output folders so results do not overwrite one another:

```sh
node tools/playwright/gather-design.mjs 3631337-pinned --pages=docs/design-pages.example.json --out=reports/local-design/normal
node tools/playwright/gather-design.mjs 3631337-pinned --pages=docs/design-pages.example.json --contrast=more --out=reports/local-design/more
node tools/playwright/gather-design.mjs 3631337-pinned --pages=docs/design-pages.example.json --contrast=more --forced-colors --scheme=dark --out=reports/local-design/forced-dark-more
```

Observed media and mode markers appear for every screen/print observation. The gatherer does not inject fake high-contrast classes or silently change a theme's saved settings.
To inspect the theme's own increased-contrast implementation, select it through the site's existing supported settings on the disposable sites, record that setup, and gather again. User settings may override global configuration.
The #3631337 error-tab states require the existing authored evaluator; initial-load gathering does not reproduce them:

```sh
node tools/playwright/evaluate-3631337.mjs 3631337-pinned --forced-colors --scheme=dark
```

Review the existing issue REPRODUCE/COVERAGE documents before treating that evaluator as complete evidence. No native Windows contrast-palette test has been performed by this pack.

## Print is collected on every visited page

Each successful page is observed first as screen and then as print on the same document. The JSON includes:

- hiddenInPrint and revealedInPrint element selectors;
- typography, colour, display and other property changes;
- print and @page CSS-rule inventories, including link media=print and imported/nested rules;
- unreadable stylesheet inventory and element-truncation indicators;
- independent Before/After comparisons in both media.

Counts include descendants. A hidden navigation container may generate many hidden-element rows; do not call these unique defects or content blocks.
A lack of explicit print CSS is not automatically a failure. The question is whether the resulting output works.
Print CSS cannot be judged by which declarations exist alone. Cross-origin unreadable CSS may still render correctly.
Collapsed content, fixed positioning, overflow and pagination need human output review.
No beforeprint/afterprint script is triggered by print-media emulation alone. Optional PDF generation may trigger printing events; JSON snapshots are media-emulation observations, not proof of that event lifecycle.

For A4 and Letter output with background printing disabled:

```sh
node tools/playwright/gather-design.mjs 3631337-pinned --pages=docs/design-pages.example.json --pdf
```

PDF generation is Chromium-only. PDFs are evidence for pagination review, not a claim of accessible PDF production. Check actual browser preview and printers separately. The generated HTML report itself has print CSS.

## Bounded crawl and context variants

```sh
node tools/playwright/gather-design.mjs 3631337-pinned --pages=docs/design-pages.example.json --crawl --max-pages=20
```

Crawl discovery uses the union of links found on both sides but follows only explicit crawlPrefixes (the example permits /admin/help). URLs with queries/fragments and obvious action paths are excluded. No form controls are activated.
The queue is bounded to ten times the visit budget; queuedNotVisited and discoveryCapped are explicit. Excluded-link counts are not an exhaustive inventory of site routes.
This is budgeted link traversal, not structural deduplication. It will not intelligently sample 15,000 similar destinations yet. Keep that work in the phased plan.
For language/region/topic cases, add explicit page entries and context labels to the manifest. Use beforePath/afterPath when equivalent pages have different paths. Labels are supplied fixture context, not automatically verified server negotiation.
For different hostnames/site instances, separate environment mappings are needed; this initial command uses the selected variant's DDEV hosts. It cannot infer regional host routing.
Do not infer active theme when the browser settings hint is unavailable. Record unknown and investigate server-side instrumentation.

## What to return for review

Send observations.json, SUMMARY.md and the Environment tab's theme-evidence JSON. report.html is the convenient human view.
Use disposable test data. The collector excludes input values, passwords, full HTML, storage and URL queries; optional PDFs can still contain the visible page content.
Do not send session profiles, cookies, one-time login URLs or credentials.
Report which supported theme settings you selected, including whether they were global or per-user.

## Verification status at preparation

Passed: six new Node regression tests; CLI help; JavaScript syntax; serialized proxy-script parsing; generated cloud consistency.
Not run: Drupal runtime, actual screen/print browser fixture, native contrast palettes, keyboard/screen-reader check in Drupal, PHP lint (PHP unavailable).
Browser fixture could not run because Chromium download failed in the preparation environment.
The broad repository selftest was attempted: syntax/variants/docs/cloud checks passed, PHP and issue-pack tests were skipped, and its lab-tools unit-test subprocess failed without a summary. This is not presented as a clean full-suite result. A diagnostic serial run of tests/lab reported 152 passes and 3 failures: missing js-yaml, the real unreachable-host probe, and a contrib fixture Git ref fetch. These were not repaired or presented as passing. The new design tests passed independently.

## Colour intent and additional user-preference observations

See [SEMANTIC-COLOR-AND-PREFERENCES.md](SEMANTIC-COLOR-AND-PREFERENCES.md) and [semantic-color-contracts.example.json](semantic-color-contracts.example.json).
These add a proposed contract model, not an automatic colour/meaning validator.

```sh
node tools/playwright/gather-design.mjs 3631337-pinned --pages=docs/design-pages.example.json --motion=reduce --out=reports/local-design/reduced-motion
```

The collector captures reduced-motion, reduced-transparency and reduced-data media results, animation/transition/scroll computed properties, preference CSS selectors and local data-theme-mode scope. It emulates only the reduced-motion preference through the new flag; transparency/data are observed, not forced by new CLI flags.
The viewer history/download records these preferences. Compare requested and observed settings and inspect the same meaningful states.
Initial-load animation snapshots do not prove a next-step cue survives an interaction. That needs the authored scenario described in the new guide.
Seven new-design Node regression tests pass; the expanded browser fixture remains unrun here because Chromium is unavailable.

## General reviewer scope

[STYLE-REVIEWER-SCOPE.md](STYLE-REVIEWER-SCOPE.md) clarifies the extensible review method. Colour, motion, print and preferences are examples; the reviewer must also surface unexplained differences when no accepted rule exists yet.
