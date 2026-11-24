# #3619127: optional execution evidence (DRAFT)

**DRAFT.** This is an additional evidence layer for the same pinned comparison, run on 2026-11-23. It does not replace the
browser, accessibility or PHPUnit evidence in [EVIDENCE.md](EVIDENCE.md), and it does not change the issue's conclusion.

- Issue: https://www.drupal.org/project/drupal/issues/3619127
- Comparison: `3619127-pinned`
- Pinned core: `d29add7ebc18954dcb88877ed38b5bd88cdbf967` (Drupal `12.0-dev`), both sides
- After patches: `3619127-forms-sidebar-with-ife.patch`, `patch-0-vanilla-js-no-jquery.patch`,
  `patch-1-no-persist-and-waits.patch`
- Run: `3619127-pinned-2026-11-23T17-55-59-509Z-a0d910`
- Browser/tooling: Chromium `159.0.8154.6`, Playwright `1.65.1`, axe-core `4.14.1`, PHP `8.5.7`, OpenTelemetry PHP SDK
  `1.15.0`
- Manifest: [evidence.json](observability/2026-11-23T17-59-23-635Z/evidence.json)
- Generated report: [SUMMARY.md](observability/2026-11-23T17-59-23-635Z/SUMMARY.md)
- Comparison rows: [comparison.json](observability/2026-11-23T17-59-23-635Z/comparison.json)

## What was run

`node tools/playwright/evaluate-3619127.mjs 3619127-pinned --observe --playwright-trace` performed the same scenario as
the existing walkthroughs: open the article form, enter an invalid URL alias, save, then use the error link with a real
mouse click and, separately, with the keyboard. `--observe` added a W3C `traceparent` to the same-origin document, XHR and
fetch requests; `--playwright-trace` also recorded a browser-side Playwright trace (local only, ignored by Git).

A pinned OpenTelemetry Collector ran inside each DDEV project. The module exported OTLP to it and also wrote a local span
file and request summary. The collector received one trace per side (`export.status = "exported"`, no missing traces).

## Correlation

| | Before | After |
|---|---|---|
| Browser requests with a trace id | 9 | 9 |
| Requests matched to a Drupal server trace | 9 | 9 |
| Server root spans (traces) recorded | 10 | 10 |
| OTLP export received the run's trace | yes | yes |
| Exceptions recorded | 0 | 0 |

Correlation status is **`correlated`**: 18 of 18 browser requests matched. Each side has ten Drupal requests for nine
browser requests because the one-time login URL responds with a 302 and the redirect target is a second Drupal request
(`user.reset.login` then `entity.user.edit_form`). The browser reuses the lab's correlation headers across that redirect;
the root span is different. This is recorded in the manifest note rather than treated as a mismatch.

## What the trace adds to the browser-only report

The browser-only evidence already established the fix: Before does not open the sidebar, After does, and the field
receives focus. The trace adds server-side context for the same interactions:

- Both sides serve the Article form through the `node.add` route and the same controller path. The patch did not add a new
  route or a different controller for the observed page.
- The median database query count per request is **43 on both sides**. The totals differ slightly (956 vs 987) because the
  requests are not perfectly paired and cache state differs; a 31-query difference across ten requests is not attributable
  to the patch from this run.
- Cache-table queries are **inferred** from SQL against cache tables, not from hit/miss counters: 783 Before, 814 After.
  That is the same order of magnitude and is not evidence of a cache regression.
- No exceptions were recorded on either side.
- The server medians in this single run (900.8 ms Before, 289.5 ms After) are **not** a performance result. Instrumented
  runs include query logging and OTLP export, and the pilot produced visibly different medians when repeated. The report
  marks the rows `comparable` only in the sense that both sides were instrumented; it does not claim the difference is
  caused by the patch.
- axe-core reported 0 violating elements on both sides at the scanned states. That is a scanner result, not a WCAG
  conformance finding, and it is unchanged from the earlier evidence.

- Instrumentation overhead was not isolatable: a naive on/off A/B of 20 authenticated requests gave 58.0 ms with tracing
  and 71.6 ms without, the wrong sign and dominated by variance. No overhead figure is claimed; the lesson is that a
  single timing pair is not a benchmark.

In short: the trace is consistent with a **client-side JavaScript fix** and shows no server-side route, database-work or
exception change that would explain the visible behaviour either way. It strengthens the "no new Drupal-side work or
errors were observed in this run" statement; it does not prove the fix is complete or that the patch cannot affect other
routes.

## Report section accessibility

The execution section is a tab in the existing viewer dock (hidden when no evidence exists) and a section in the static guide.
`node tools/playwright/viewer-execution.mjs` checked both presentations in light, dark, forced-colours and reduced-motion
contexts, plus a 320 px viewport: **5 of 5 contexts passed with 0 axe-core violations inside the section**. Each table has
a caption and column headers, and wide tables scroll inside a focusable `role="region"` wrapper rather than forcing the
page to overflow. Results: [static](observability/2026-11-23T17-59-23-635Z/viewer-a11y-static.json) and
[live](observability/2026-11-23T17-59-23-635Z/viewer-a11y-live.json). This is automated evidence, not a manual keyboard or
screen-reader pass.

## What the trace does not show

- It does not attribute the focus change to a specific Drupal render array, Twig template, library or JavaScript
  behaviour. Component provenance is deferred (see [INTEROPERABILITY.md](../../../docs/observability/INTEROPERABILITY.md)).
- It does not prove causation or absence of a performance regression. The patch changes `sidebar.js`; the trace measures
  requests, not JavaScript execution.
- It covers one browser (Chromium), one viewport (480×900), one pinned core, one run, and a page that is not page-cached.
  Page-cache and dynamic-page-cache hits can serve requests without the instrumented kernel path.
- It does not replace the person's keyboard pass or a real screen-reader test.

## Reproduce

```bash
node tools/compare/setup.mjs 3619127-pinned
node tools/observability/cli.mjs enable 3619127-pinned
node tools/playwright/evaluate-3619127.mjs 3619127-pinned --observe --playwright-trace
node tools/observability/cli.mjs collect 3619127-pinned --run reports/issues/3619127/playwright/<stamp>-chromium-light-480x900
node tools/observability/cli.mjs validate reports/issues/3619127/observability/<stamp>/evidence.json
```

The lab's normal rule applies: do not post this to drupal.org without a person reviewing it. The generated report and the
manifest are DRAFT until then.
