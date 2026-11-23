# Interoperability and upstream research

This document records what was investigated before writing code, what is usable today, and what was deliberately
deferred. It is a snapshot; upstream projects change. Dates and versions are the ones checked for this pilot
(2026-11-23).

## Standards and libraries

| Capability | Status | Decision |
|---|---|---|
| [W3C Trace Context](https://www.w3.org/TR/trace-context/) | Recommendation since 2021; `traceparent`/`tracestate` | Used directly. The browser creates the parent context; Drupal extracts it and continues the trace. |
| [OpenTelemetry PHP SDK](https://opentelemetry.io/docs/languages/php/) | Stable traces; `open-telemetry/sdk` 1.15.0 and `open-telemetry/exporter-otlp` 1.4.0 are already installed by Drupal core's dev dependencies at the pinned revision | Used. No Composer change is needed in a core checkout. |
| [OpenTelemetry Collector contrib](https://github.com/open-telemetry/opentelemetry-collector-contrib) | `0.165.0` pinned; OTLP receiver and file exporter | Used optionally, one container per DDEV project. No hosted service. |
| [Jaeger](https://www.jaegertracing.io/) / Tempo / Grafana | OTLP-native; not installed | Not required. The collector output can be pointed at one later; the lab's reports use sanitised summaries instead. |
| [Playwright trace viewer](https://playwright.dev/docs/trace-viewer) | Built in; browser-only | Optional `--playwright-trace` zip. It is kept separate from OTel traces; its ids are not treated as trace ids. |
| Playwright OpenTelemetry helpers | Community packages only (`autotel-playwright`, `@playwright-labs/reporter-otel`, `playwright-opentelemetry`); no official Playwright integration | Not added. The lab injects `traceparent` explicitly with `context.route`, which is testable and has no new dependency. |

## Drupal integrations

### The Drupal OpenTelemetry module

The [OpenTelemetry module](https://www.drupal.org/project/opentelemetry) is the closest upstream integration. Version
`1.0.0-beta1` (2024-01-17) traces requests, database queries and exceptions, and is described by the Rosetta proposal as
working well. It is **not installable in this pilot without changing a core checkout's dependency policy**:

- `core_version_requirement: ^9 || ^10 || ^11`; the pinned core is `12.0-dev`. Installing it would require editing the
  module's metadata, i.e. carrying a patched copy of upstream.
- Its `composer.json` requires `open-telemetry/opentelemetry-propagation-traceresponse`, which is not part of Drupal
  core's dev dependencies. The lab's rule is not to add composer requirements to a core checkout.
- The beta does not cover render arrays, Twig templates, attached libraries or Tool API calls.

The pilot therefore uses a small lab-owned module, [`core_lab_observability`](../../tools/observability/drupal/core_lab_observability/),
on top of the same PHP SDK. It is a harness for the lab, not a competing upstream module. If the upstream module adds
Drupal 12 support and its dependency is available, replacing the lab module with it is the preferred next step; the
manifest and report do not depend on which module produced the spans, as long as the attributes stay within the
allow-list.

### Drupal request and rendering instrumentation

The lab module records:

- a server span for the HTTP request (route match to terminate);
- an approximate `drupal.controller` span (controller arguments to view) and `drupal.render` span (view to response);
- aggregate database query count/time, table names and cache-table activity;
- exception class and count;
- no SQL text, query arguments, request bodies, headers or cookies.

It does **not** attribute a change to a Form API element, render array, theme hook, Twig template, attached library or
JavaScript behaviour. Those are `unknown` in the manifest, not guessed. The Rosetta proposal's run/step spans and the Tool
API's audit attach points are not implemented in this pilot; they are the natural extension if tracing becomes a Drupal
core/contrib convention.

### Tool API and Rosetta

The [Rosetta proposal](https://www.lakedrops.com/en/blog/one-trace-inside-and-outside-drupal-proposal-rosetta) argues for
one trace across Drupal workflow systems, using W3C Trace Context and the OpenTelemetry PHP SDK, with run and step spans
carried through Tool API calls, queue items and webhooks. Tool API is at beta 12 and its `Invoker` has no run/parent
trace field; the audit attach points are comments, not implemented hooks.

This pilot adopts the interoperable parts (trace context, OTel spans, explicit correlation ids) and stops there. It does
not implement a Rosetta service, a replay format, a workflow-run model, or Tool API integration. A future integration can
add a `traceparent`/`tracestate` to the Tool API invoker and emit run/step spans without changing the evidence contract:
the manifest already stores arbitrary OTel trace ids and environment ids.

## Core Lab and `mgifford/drupal-core`

The task asked whether the [Drupal Quality Observatory](https://github.com/mgifford/drupal-core) already has an evidence
schema to reuse. It does not, as of 2026-11-23: the repository tree and README describe the Observatory and its
accessibility/performance/sustainability reports, but contain no execution-evidence schema, trace manifest or
correlation format. `drupal-core` remains the broader monitoring project; Core Lab remains issue-focused.

The v1.0.0 schema is therefore a new, deliberately small contract. It is designed to be consumed independently:

- JSON, no database or service required.
- `schema_version`, `run`, `environments[]`, `requests[]`, `traces[]`, `correlation`, `findings`, `artifacts[]`.
- Every request and trace names its `environment_id`; a consumer can ignore Core Lab's browser fields and use only
  `traces` + `environments` for a Drupal-side view.
- The schema is in [`tools/observability/evidence.schema.json`](../../tools/observability/evidence.schema.json) and can be
  validated with any JSON Schema 2020-12 validator; Core Lab's own validator is dependency-free.
- The producer is identified; artifact paths are repository-relative; raw traces are not required for a consumer that
  only wants the summary.

If the Observatory adopts an evidence format later, the clean migration is to map these fields rather than add a second
parallel format. A candidate upstream contract would keep the `run`/`environment`/`request`/`trace`/`artifact` separation
and add optional Observatory-specific `measurements`.

## What was deferred, and why

| Deferred | Why |
|---|---|
| Per-query spans and SQL fingerprints | High cardinality and privacy risk; aggregate counts answer the pilot's question. |
| Render-array/Twig/library attribution | No standard instrumentation; requires Drupal-specific hooks and careful experimental labelling. |
| Tool API run/step spans and Rosetta run state | Tool API is beta; the proposal is not an implementation. Adding it would be speculative. |
| Replay | Depends on a run/step record and a storage contract that does not exist. |
| A hosted trace backend or database | The lab's principle is no unnecessary infrastructure; the collector file and sanitised summaries are enough for a pilot. |
| Jaeger/Tempo UI | Optional; OTLP output is compatible, but adding a UI service by default would be another moving part. |
| AI-generated component attribution | Explicitly out of scope for the initial implementation; uncertain attribution must stay `unknown`. |
| Sampling policy research | `sample_ratio` is configurable; the pilot uses 1.0 for short diagnostic runs. Tail sampling and long-running spans are open upstream questions. |

## Sources

- [One trace, inside and outside Drupal: a proposal for Rosetta](https://www.lakedrops.com/en/blog/one-trace-inside-and-outside-drupal-proposal-rosetta) (LakeDrops, 2026-10-28)
- [W3C Trace Context](https://www.w3.org/TR/trace-context/)
- [OpenTelemetry PHP](https://opentelemetry.io/docs/languages/php/)
- [Drupal OpenTelemetry module](https://www.drupal.org/project/opentelemetry)
- [OpenTelemetry Collector contrib](https://github.com/open-telemetry/opentelemetry-collector-contrib)
- [Playwright trace viewer](https://playwright.dev/docs/trace-viewer)
- [Drupal Quality Observatory](https://github.com/mgifford/drupal-core)
