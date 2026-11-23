# Evidence manifest

The manifest is the machine-readable record of one run. It is deliberately redundant: every artifact keeps its native
format, and the manifest carries the links and the provenance needed to interpret it. The schema is
[`tools/observability/evidence.schema.json`](../../tools/observability/evidence.schema.json) (JSON Schema 2020-12,
`schema_version` `1.0.0`). A complete example is
[`examples/evidence.example.json`](examples/evidence.example.json).

## Shape

```jsonc
{
  "schema_version": "1.0.0",
  "producer": { "name": "drupal-core-lab", "version": "1.0.0", "repository": "..." },
  "run": {
    "id": "3619127-pinned-2026-11-23T16-50-02-475Z-52a4a7",
    "scenario": { "id": "3619127-pinned", "label": "...", "variant": "3619127-pinned" },
    "issue": { "id": "3619127", "url": "https://www.drupal.org/project/drupal/issues/3619127", "synthetic": false },
    "started_at": "...", "finished_at": "...", "instrumented": true,
    "tools": { "node": "...", "playwright": "...", "browser": "chromium", "browser_version": "...", "axe_core": "...", "lighthouse": null, "drupal": "...", "php": "...", "otel_sdk": "1.15.0" }
  },
  "environments": [ /* one entry per environment, not exactly two */ ],
  "playwright": { "run_id": "...", "trace_file": null, "actions": [ /* a1, a2, ... */ ] },
  "requests": [ /* r1, r2, ...; each names its environment_id */ ],
  "traces": [ /* one per server trace; id is the OTel trace id */ ],
  "correlation": { "status": "...", "matched_requests": 0, "partially_matched_requests": 0, "requests_without_server_trace": 0, "requests_without_server_details": 0, "server_traces_without_request": 0, "notes": [] },
  "findings": { "axe": [ /* native scanner rules and nodes */ ], "lighthouse": [], "resources": [] },
  "artifacts": [ /* id, kind, path, bytes, sha256, retention, public, sanitized */ ],
  "comparison": { "rows": [], "interpretation": "..." },
  "limitations": []
}
```

### Environments are a list

A run is not hard-coded to two environments. Each entry has `id`, `role` (`before`, `after` or `variant`), the DDEV
`env` name, the full 40-character `drupal_revision`, `patches` (name, repository-relative path, SHA-256), `recipe`,
`modules`, a small `configuration` map and its own `observability` state. A future multi-variant experiment adds an entry
with `role: "variant"`; requests and traces refer to it by `environment_id`. The correlation code never mixes traces from
different environment ids.

### One-to-many correlation

- One Playwright action has `request_ids[]`.
- One request has `action_id` (the action that most recently started when it was sent) and `client_trace_id` /
  `client_span_id` (the W3C context the browser generated).
- One server trace has `request_id` (nullable if no browser request matched) and `environment_id`.
- A request can have `server_trace_id` without a detailed `trace` record; that is reported as
  `requests_without_server_details`, not silently treated as correlated.
- One axe finding can point at a `request_id`, `trace_id`, `artifact_id` and `action_id`, but the attribution is
  classified `candidate`, `probable`, `verified` or `unknown`. The pilot only produces `candidate` (same side and URL) or
  `unknown`.

### Request correlation values

| Value | Meaning |
|---|---|
| `matched` | The server returned the same trace id the browser sent. |
| `server-generated` | Drupal produced a trace id different from the browser's (for example a page-cache hit or an intermediary). The server trace is kept, but it is not the same trace. |
| `no-server-trace` | The request reached the server but no trace id came back. |
| `not-instrumented` | Observability is disabled for that environment. |
| `export-failed` | A server trace exists, but the OTLP export failed. |
| `request-failed` | The browser request failed before a response. |
| `pending` | The run ended before a response was observed; the collector reports it rather than inventing a result. |

### Run correlation status

| Status | Meaning |
|---|---|
| `correlated` | Every browser request is matched and every matched trace has a detailed server summary. |
| `partially-correlated` | Some requests are missing a server trace or a detailed summary, or the server used a different trace id. |
| `not-correlated` | No request produced a server trace. |
| `observability-disabled` | No environment had observability enabled. This is a valid report, not a failure. |

`correlation.notes` explains the state in plain language. The report never calls a partially correlated run "correlated".

## Validation

```bash
node tools/observability/cli.mjs validate <manifest.json>
```

Two stages:

1. **JSON Schema**: required provenance (issue id and URL, full commit, environment ids, timestamps), value types,
   enums, no unknown top-level fields, no absolute or `..` artifact paths.
2. **Referential integrity**: every `environment_id`, `action_id`, `request_id`, `trace_id` and `artifact_id` resolves;
   a request's `side` matches its environment's role; correlation counts match the request records; artifact ids are
   unique.

Malformed manifests are rejected. Missing provenance is never silently filled in. A valid report may have
`"instrumented": false`, no requests and no traces; that is how "tracing was unavailable" is represented without
invalidating the browser evidence.

Artifact paths are repository-relative. The validator cannot know whether a file was deleted after the fact, so the
collection step checks existence and hashes before it writes the manifest. Artifacts marked `retention: "local"` are
expected to disappear; reports say they were local and do not present them as published.

## Reading the comparison

`comparison.rows[]` has `metric`, `before`, `after`, `delta`, `comparability` (`comparable` / `not-comparable`),
`observed` and a note. The pilot compares:

- browser request count (comparable even without instrumentation);
- server traces, median/total server duration, database query count and time, cache-table queries, exceptions (only
  comparable when both sides were instrumented);
- axe violating elements (comparable when both sides were scanned at the same step);
- Lighthouse only when both sides have a non-instrumented result.

There is no `verdict` field. The interpretation text is fixed:

> Observed data, not a causal claim. A difference in duration, query count or cache activity describes what happened in
> these two runs under these conditions. It does not establish that the patch caused a performance or functional
> regression.

That is intentional. A difference in trace duration is not a performance regression; a difference in query count is not
a defect; a rendering difference may come from configuration rather than the patch. The per-request traces and the native
artifacts are the evidence to inspect.

## What the manifest does not contain

- Request or response bodies, cookies, authorization headers, session ids, query values, SQL text or query arguments.
- Full exception messages or stack traces (class and count only).
- A claim that an axe finding is a WCAG failure. `wcag_tags` are the scanner's tags; the finding is native axe output.
- AI-generated source attribution. Component/provenance fields are absent, not guessed.

See [PRIVACY.md](PRIVACY.md) for the collection boundary and [INTEROPERABILITY.md](INTEROPERABILITY.md) for how another
project, including `mgifford/drupal-core`, can consume the format.
