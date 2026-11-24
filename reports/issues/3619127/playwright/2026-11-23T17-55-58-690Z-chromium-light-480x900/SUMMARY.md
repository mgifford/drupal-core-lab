# #3619127 execution evidence: reproduced-and-fixed

Run 2026-11-23T17:56:25.438Z. Core: Before `d29add7e 2026-09-30`, After `d29add7e 2026-09-30`. Patches on After: `3619127-forms-sidebar-with-ife.patch`, `patch-0-vanilla-js-no-jquery.patch`, `patch-1-no-persist-and-waits.patch`. Environment: **chromium 159.0.8154.6**, colour scheme **light**, viewport 480x900, darwin arm64. Tracing: **enabled**, Playwright trace zip recorded.

The scenario opens the article form, enters an invalid URL alias, saves, then uses the error link with a real mouse click and, separately, with the keyboard. Automated evidence is a DRAFT; it does not replace a keyboard and screen-reader pass by a person.

| Mode | Type | Check | Before | After | Verdict |
|---|---|---|---|---|---|
| mouse | fix | Sidebar opens after using the error link | false | true | ✓ |
| mouse | fix | URL alias field receives focus | false | true | ✓ |
| mouse | fix | URL alias field is in the viewport | false | true | ✓ |
| mouse | regression | Saved sidebar preference unchanged (still "false") | false | false | ✓ |
| mouse | regression | axe violating elements after using the link | 0 | 0 | ✓ |
| mouse | regression | axe violating elements before using the link | 0 | 0 | ✓ |
| keyboard | fix | Sidebar opens after using the error link | false | true | ✓ |
| keyboard | fix | URL alias field receives focus | false | true | ✓ |
| keyboard | fix | URL alias field is in the viewport | false | true | ✓ |
| keyboard | regression | Saved sidebar preference unchanged (still "false") | false | false | ✓ |
| keyboard | regression | axe violating elements after using the link | 0 | 0 | ✓ |
| keyboard | regression | axe violating elements before using the link | 0 | 0 | ✓ |

## Trace correlation in this run

| Side | Same-origin requests | Matched | Server-generated | No server trace | Not instrumented | Failed |
|---|---:|---:|---:|---:|---:|---:|
| before | 9 | 9 | 0 | 0 | 0 | 0 |
| after | 9 | 9 | 0 | 0 | 0 | 0 |

A matched request means the Drupal server continued the browser's W3C trace. It does not mean the patch caused what was observed. Use `node tools/observability/cli.mjs collect 3619127-pinned --run reports/issues/3619127/playwright/2026-11-23T17-55-58-690Z-chromium-light-480x900` to build the manifest and the before/after execution comparison.

## Context

| | Before | After |
|---|---|---|
| Core commit | `d29add7e 2026-09-30` | `d29add7e 2026-09-30` |
| Drupal, PHP | 12.0-dev, 8.5.7 | 12.0-dev, 8.5.7 |
| Profile; default / admin theme (config) | standard; default_admin / default_admin | standard; default_admin / default_admin |
| Theme that rendered each page | /user/1/edit → default_admin<br>/node/add/article → default_admin | /user/1/edit → default_admin<br>/node/add/article → default_admin |
| Languages (default) | none (en) | none (en) |
| Modules only on this side | none | none |
| Enabled modules | 41 | 41 |

Observability: **enabled** for this run (`3619127-pinned-2026-11-23T17-55-59-509Z-a0d910`). Browser requests carry a W3C traceparent; the Drupal execution evidence is added after collection with `node tools/observability/cli.mjs collect <slug> --run <this directory>`.


## AJAX responses

Every Drupal AJAX response, in order; raw commands in `ajax-before.json` and `ajax-after.json`.

**Before** (0 responses)


**After** (0 responses)



## What could be announced

`Drupal.announce()` calls, and text changes inside live regions (role alert/status/log or aria-live). A recorded change is not proof that a screen reader spoke it; see the screen-reader run for that.

| Side | Source | Politeness | Text |
|---|---|---|---|
| before | none | | |
| after | none | | |

## Changes after input, and how a screen reader learns of them

After each click, key press or typing, the text that appeared or changed on the page. **Silent**: not in a live region, no `Drupal.announce()` after the same action, focus did not move to it, and the control pressed did not disclose it. A silent change is a candidate for WCAG 2.2 SC 4.1.3 Status Messages, for a person to judge: not every change is a status message. See docs/SILENT-CHANGES.md.

No silent change on either side.

Inside the control itself (its own text changed; a screen reader may not say it again): before click a.meta-sidebar__trigger.trigger "Show sidebar pan… → "Hide sidebar panel"; before click a.meta-sidebar__trigger.trigger "Hide sidebar pan… → "Show sidebar panel"; after click a.meta-sidebar__trigger.trigger "Show sidebar pan… → "Hide sidebar panel"; after click a.meta-sidebar__trigger.trigger "Hide sidebar pan… → "Show sidebar panel".

Before: 0 in a live region, 0 Drupal.announce() after the same action, 2 focus moved to it, 30 shown by the control pressed (expanded), 4 inside the control itself, 0 the name of a control that appeared or changed, 0 silent.
After: 0 in a live region, 0 Drupal.announce() after the same action, 2 focus moved to it, 30 shown by the control pressed (expanded), 4 inside the control itself, 0 the name of a control that appeared or changed, 0 silent.

<!-- core-lab-observability:start -->
## Drupal execution evidence

Run `3619127-pinned-2026-11-23T17-55-59-509Z-a0d910`, scenario `3619127-pinned`, generated 2026-11-23T17:58:21.576Z. Instrumented: **yes**. Correlation: **correlated**.

| | Before | After |
|---|---|---|
| Environment | baseline-main | issue-3619127-vanilla |
| Drupal core | `d29add7ebc18` | `d29add7ebc18` |
| Patches | none | `3619127-forms-sidebar-with-ife.patch`, `patch-0-vanilla-js-no-jquery.patch`, `patch-1-no-persist-and-waits.patch` |
| Observability | ok | ok |
| Requests with a matching server trace | 9 | 9 |

**before** (`baseline-main`, core `d29add7ebc18`) compared with **after** (`issue-3619127-vanilla`, core `d29add7ebc18`, 3 patch(es)).

- 20 server traces were recorded for 18 browser requests. A redirect, a re-issued request or an internal forward can produce more than one Drupal request for one browser request; the request id is shared, the root span is not.

### Before-and-after measurements

| Metric | Before | After | Difference | Comparable? | Note |
|---|---:|---:|---:|---|---|
| Browser requests | 9 | 9 | 0 | yes | The same scenario can issue a different number of requests, for example after an AJAX response. |
| Server traces | 10 | 10 | 0 | yes |  |
| Server duration, median (ms) | 900.805 | 289.46000000000004 | -611.34 | yes | Instrumented runs include database-logging and export overhead. A single pair is also noisy; repeat the run before drawing any inference, and treat the difference as diagnostic, not as a benchmark. |
| Server duration, total (ms) | 14869.810000000003 | 5008.500000000001 | -9861.31 | yes | Total depends on how many requests the scenario made; compare the median as well. |
| Database queries | 956 | 987 | 31 | yes | Cache state and the number of requests affect this. A difference is not by itself a problem. |
| Database queries, median per request | 43 | 43 | 0 | yes |  |
| Database time (ms) | 4444.109999999999 | 1357.8000000000004 | -3086.31 | yes | Query logging measures statement time only; it excludes PHP and rendering. |
| Cache-table queries | 783 | 814 | 31 | yes | Inferred from queries against cache tables. This is not a cache hit/miss ratio. |
| Exceptions recorded | 0 | 0 | 0 | yes | Only exception class and count are recorded; messages are not exported. |
| axe violating elements | 0 | 0 | 0 | yes | Scanner findings, not a WCAG conformance result. Compare only when both sides were scanned at the same step. |

Observed data, not a causal claim. A difference in duration, query count or cache activity describes what happened in these two runs under these conditions. It does not establish that the patch caused a performance or functional regression; tracing overhead, cache state, request count and environment differences can all change these numbers. Use the per-request traces and the native browser, axe-core and Lighthouse artifacts to investigate, and re-run without instrumentation before making a performance claim.

### Per-request traces

| Side | Trace id | Request | Route | Duration | DB queries | Cache queries | Exceptions | Export |
|---|---|---|---|---:|---:|---:|---:|---|
| before | `0815288f2b8971c4…` | `GET /user/reset/[uid]/[timestamp]/[token]/login` | user.reset.login | 620.84 ms | 48 | 33 | 0 | exported |
| before | `0815288f2b8971c4…` | `GET /user/reset/[uid]/[timestamp]/[token]/login` | entity.user.edit_form | 5556.45 ms | 493 | 391 | 0 | exported |
| before | `0815288f2b8971c4…` | `GET /node/add/article` | node.add | 2986.16 ms | 154 | 135 | 0 | exported |
| before | `0815288f2b8971c4…` | `GET /node/add/article` | node.add | 825.68 ms | 67 | 63 | 0 | exported |
| before | `0815288f2b8971c4…` | `POST /node/add/article` | node.add | 1387.44 ms | 48 | 39 | 0 | exported |
| before | `0815288f2b8971c4…` | `GET /node/add/article` | node.add | 324.18 ms | 27 | 23 | 0 | exported |
| before | `0815288f2b8971c4…` | `GET /node/add/article` | node.add | 434.41 ms | 27 | 23 | 0 | exported |
| before | `0815288f2b8971c4…` | `GET /node/add/article` | node.add | 1359.02 ms | 27 | 23 | 0 | exported |
| before | `0815288f2b8971c4…` | `POST /node/add/article` | node.add | 975.93 ms | 38 | 30 | 0 | exported |
| before | `0815288f2b8971c4…` | `GET /node/add/article` | node.add | 399.7 ms | 27 | 23 | 0 | exported |
| after | `23aba1ca010626ce…` | `GET /user/reset/[uid]/[timestamp]/[token]/login` | user.reset.login | 116.83 ms | 48 | 33 | 0 | exported |
| after | `23aba1ca010626ce…` | `GET /user/reset/[uid]/[timestamp]/[token]/login` | entity.user.edit_form | 1247.09 ms | 492 | 390 | 0 | exported |
| after | `23aba1ca010626ce…` | `GET /node/add/article` | node.add | 1875.68 ms | 154 | 135 | 0 | exported |
| after | `23aba1ca010626ce…` | `GET /node/add/article` | node.add | 295.4 ms | 68 | 64 | 0 | exported |
| after | `23aba1ca010626ce…` | `POST /node/add/article` | node.add | 301.22 ms | 79 | 70 | 0 | exported |
| after | `23aba1ca010626ce…` | `GET /node/add/article` | node.add | 205.06 ms | 27 | 23 | 0 | exported |
| after | `23aba1ca010626ce…` | `GET /node/add/article` | node.add | 210.45 ms | 27 | 23 | 0 | exported |
| after | `23aba1ca010626ce…` | `GET /node/add/article` | node.add | 177.85 ms | 27 | 23 | 0 | exported |
| after | `23aba1ca010626ce…` | `POST /node/add/article` | node.add | 288.11 ms | 38 | 30 | 0 | exported |
| after | `23aba1ca010626ce…` | `GET /node/add/article` | node.add | 290.81 ms | 27 | 23 | 0 | exported |

Only the first 20 of 20 traces are shown here; the full set is in the evidence manifest.

### Artifacts

- server-summary: `reports/issues/3619127/observability/2026-11-23T17-59-23-635Z/raw/requests-before.jsonl` (local only; not published), sanitised
- otel-local-spans: `reports/issues/3619127/observability/2026-11-23T17-59-23-635Z/raw/spans-before.jsonl` (local only; not published), sanitised
- otel-export: `reports/issues/3619127/observability/2026-11-23T17-59-23-635Z/raw/collector-before.jsonl` (local only; not published)
- server-summary: `reports/issues/3619127/observability/2026-11-23T17-59-23-635Z/raw/requests-after.jsonl` (local only; not published), sanitised
- otel-local-spans: `reports/issues/3619127/observability/2026-11-23T17-59-23-635Z/raw/spans-after.jsonl` (local only; not published), sanitised
- otel-export: `reports/issues/3619127/observability/2026-11-23T17-59-23-635Z/raw/collector-after.jsonl` (local only; not published)
- playwright-results: `reports/issues/3619127/playwright/2026-11-23T17-55-58-690Z-chromium-light-480x900/results.json`
- request-catalog: `reports/issues/3619127/playwright/2026-11-23T17-55-58-690Z-chromium-light-480x900/observability-before.json`, sanitised
- request-catalog: `reports/issues/3619127/playwright/2026-11-23T17-55-58-690Z-chromium-light-480x900/observability-after.json`, sanitised
- screenshot: `reports/issues/3619127/playwright/2026-11-23T17-55-58-690Z-chromium-light-480x900/after-keyboard-1-error-state.png`
- screenshot: `reports/issues/3619127/playwright/2026-11-23T17-55-58-690Z-chromium-light-480x900/after-keyboard-2-after-link.png`
- screenshot: `reports/issues/3619127/playwright/2026-11-23T17-55-58-690Z-chromium-light-480x900/after-mouse-1-error-state.png`
- screenshot: `reports/issues/3619127/playwright/2026-11-23T17-55-58-690Z-chromium-light-480x900/after-mouse-2-after-link.png`
- screenshot: `reports/issues/3619127/playwright/2026-11-23T17-55-58-690Z-chromium-light-480x900/before-keyboard-1-error-state.png`
- screenshot: `reports/issues/3619127/playwright/2026-11-23T17-55-58-690Z-chromium-light-480x900/before-keyboard-2-after-link.png`
- screenshot: `reports/issues/3619127/playwright/2026-11-23T17-55-58-690Z-chromium-light-480x900/before-mouse-1-error-state.png`
- screenshot: `reports/issues/3619127/playwright/2026-11-23T17-55-58-690Z-chromium-light-480x900/before-mouse-2-after-link.png`

### Limitations

- Automated accessibility rules cover only part of WCAG; a finding is not a conformance verdict.
- A correlated trace shows that a request reached Drupal with the same trace id. It does not show that the patch caused the observed behaviour.
- Server timings include tracing and database-logging overhead when instrumentation is on. Do not compare them with a benchmark run.
- Drupal page-cache and dynamic-page-cache hits can serve a response without the instrumented request path; those requests may have no server trace.

The manifest validates against schema 1.0.0. Raw Playwright, OpenTelemetry, axe-core and Lighthouse artifacts keep their native formats and are referenced above; they are not rewritten by this report.

<!-- core-lab-observability:end -->
