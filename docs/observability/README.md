# Execution evidence (optional tracing)

Drupal Core Lab can compare what a browser sees before and after a patch. This layer adds a second question: **what did
Drupal do while serving the page the browser was looking at?**

It is optional and off by default. Ordinary lab runs are unchanged and do not need Docker's collector, a hosted service,
an AI service, MCP, or Rosetta. When enabled, the lab exports real OpenTelemetry spans over OTLP and correlates them with
Playwright actions and HTTP requests using W3C Trace Context.

## Why this is useful

A browser-only report can say "the sidebar opened" and "one axe rule disappeared". It cannot say whether the click caused
one request or five, which route rendered the response, whether the save ran 12 or 40 database queries, or whether an
exception was thrown and recovered. Those are the questions a core maintainer asks when a patch changes behaviour.

The trace connects evidence that already exists:

```text
Playwright action ──► HTTP request ──► Drupal request/controller/render ──► response
       │                   │                        │
       │                   │                        ├── database query count and time
       │                   │                        ├── cache-table activity (inferred)
       │                   │                        └── exception class and count
       │                   │
       └── screenshot, axe finding, action id, trace id
```

The result is still evidence, not a verdict. A correlated trace shows that a request reached Drupal in the same trace. It
does not show that the patch caused the difference, and instrumentation can change the timings it measures. The reports
say so explicitly.

## Quick start (local DDEV)

```bash
node tools/compare/setup.mjs 3619127-pinned          # build Before and After, unchanged
node tools/observability/cli.mjs enable 3619127-pinned   # copy the module, start one collector per side
node tools/playwright/evaluate-3619127.mjs 3619127-pinned --observe --playwright-trace
node tools/observability/cli.mjs collect 3619127-pinned --run reports/issues/3619127/playwright/<stamp>-chromium-light-480x900
node tools/observability/cli.mjs disable 3619127-pinned  # stop the collector, remove the module and settings
```

`collect` validates the manifest against [the schema](../../tools/observability/evidence.schema.json), writes
`evidence.json`, `comparison.json` and a `SUMMARY.md`, appends a **Drupal execution evidence** section to the existing
Playwright run report, and updates the small static summary used by the viewer. It prints the exact paths.

If observability is not enabled, the same command still produces a valid manifest with `correlation.status =
"observability-disabled"`; tracing being unavailable never invalidates the browser evidence.

## Worked example

The pilot ran the existing #3619127 comparison on pinned core `d29add7ebc18` and matched 18 of 18 same-origin browser
requests to Drupal server traces; both sides exported to their own collector. The write-up is
[reports/issues/3619127/OBSERVABILITY.md](../../reports/issues/3619127/OBSERVABILITY.md), with the generated report, manifest
and before/after comparison under `reports/issues/3619127/observability/2026-11-23T17-59-23-635Z/`. It found no server-side
route, database or exception change, which is consistent with the patch being a client-side JavaScript fix; it does not prove
that, and the timing rows are explicitly not a benchmark.

## Documents

| Document | What it covers |
|---|---|
| [architecture.md](architecture.md) | Current architecture, evidence flow, integration points, dependencies and boundaries |
| [SETUP.md](SETUP.md) | DDEV, cloud, collector, enable/disable, inspection, performance overhead |
| [EVIDENCE.md](EVIDENCE.md) | Manifest fields, correlation values, validation, example, reading a comparison |
| [PRIVACY.md](PRIVACY.md) | What is collected, what is never collected, sanitisation, retention, publication |
| [INTEROPERABILITY.md](INTEROPERABILITY.md) | Upstream OpenTelemetry/Drupal/Playwright/Rosetta research, drupal-core compatibility, deferred work |

Code lives in `tools/observability/` (schema, validation, collector config, Drupal module, CLI) and
`tools/playwright/lib/observability.mjs` (browser correlation). The example manifest is
[`examples/evidence.example.json`](examples/evidence.example.json).

## What is deliberately not here

- No replay system, no hosted backend, no Kubernetes, no persistent trace database.
- No AI-generated source attribution and no claim that a trace proves a defect's cause.
- No replacement for Playwright traces, axe-core findings or Lighthouse reports. They keep their own formats and
  provenance; the manifest links to them.
- No change to a Drupal core checkout's `composer.json`. The OpenTelemetry PHP SDK used by the module is already a Drupal
  core dev dependency at the pinned revision.
