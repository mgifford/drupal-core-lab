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
