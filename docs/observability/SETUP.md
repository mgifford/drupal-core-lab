# Setup and operation

Observability is opt-in. Nothing here is needed for an ordinary Core Lab run, and no existing command changes its
behaviour when it is off.

## Prerequisites

- The comparison is already built: `node tools/compare/setup.mjs <slug>`.
- DDEV and Docker are running.
- The checkout has Drupal core's dev dependencies (`composer install` includes `open-telemetry/sdk` and
  `open-telemetry/exporter-otlp`). `node tools/observability/cli.mjs status <slug>` reports the SDK per environment.

## Enable

```bash
node tools/observability/cli.mjs enable 3619127-pinned
node tools/observability/cli.mjs status 3619127-pinned
```

`enable` is idempotent and makes four changes in each disposable checkout:

1. Copies `tools/observability/drupal/core_lab_observability/` to `modules/contrib/core_lab_observability/` and adds it
   to that checkout's `.git/info/exclude` (so `git status` stays clean without editing a tracked file).
2. Installs and enables the module with `ddev drupal module:install core_lab_observability`.
3. Writes a marked block to `sites/default/settings.php`:
   `enabled`, `endpoint`, `environment`, `side`, the full core commit, sample ratio, capture flags and privacy flags.
4. Adds `.ddev/docker-compose.observability.yaml` with one pinned collector container, and restarts the project.

Each side gets its own collector and its own output directory, so traces from Before and After cannot be mixed:

| Side | DDEV service | Collector file on the host |
|---|---|---|
| Before | `ddev-<project>-otel-collector` | `envs/<before-env>/observability/data/traces.jsonl` |
| After | `ddev-<project>-otel-collector` | `envs/<after-env>/observability/data/traces.jsonl` |

The collector image is pinned to
`otel/opentelemetry-collector-contrib:0.165.0`. Drupal reaches it at `http://otel-collector:4318/v1/traces` on the DDEV
project network. No port is published to the host, and no service is exposed through the DDEV router.

Options:

| Option | Effect |
|---|---|
| `--no-collector` | Do not add the collector; the module writes local spans only. The manifest reports `export.status = "disabled"`. |
| `--sample=0.5` | Sample ratio for new traces. The default is `1.0`, which is appropriate for a short diagnostic run. |
| `--no-database` | Do not start Drupal's query logger. Database counts are absent; the rest of the trace still works. |
| `--no-exceptions` | Do not record exception classes/counts. |

## Run an instrumented scenario

Any evaluator built on `tools/playwright/lib/lab-run.mjs` accepts `--observe`:

```bash
node tools/playwright/evaluate-3619127.mjs 3619127-pinned --observe --playwright-trace
```

- `--observe` adds a fresh `traceparent` (and lab correlation headers) to **same-origin** `document`, `xhr` and `fetch`
  requests only. Third-party requests are untouched. The browser catalogue goes to `observability-<side>.json` in the run
  folder.
- `--playwright-trace` additionally records a Playwright trace zip. This is a browser-side artifact with its own format;
  it is not an OpenTelemetry trace and the lab does not treat its ids as trace ids.

For the built-in viewer, the request headers are not injected: the viewer's manual, axe and Lighthouse evidence stay
browser-only. Use a scripted evaluator for tracing.

## Collect and validate

```bash
node tools/observability/cli.mjs collect 3619127-pinned \
  --run reports/issues/3619127/playwright/<stamp>-chromium-light-480x900
```

Outputs, in `reports/issues/<nid>/observability/<stamp>/`:

| File | Committed? | Purpose |
|---|---|---|
| `evidence.json` | yes (small) | The versioned manifest; validates against schema 1.0.0 |
| `SUMMARY.md` | yes | Human-readable execution section and before/after measurements |
| `comparison.json` | yes | Machine-readable comparison rows with `comparability` and `observed` |
| `requests.json`, `actions.json`, `traces-*.json` | yes | Sanitised indexes for review |
| `summary.json` | yes | Small, sanitised summary used by the viewer and the static site |
| `raw/` | **no** | Local spans, request summaries and collector output; mark them `local`/non-public in the manifest |

The command also appends the section to the existing Playwright run's `SUMMARY.md` (between
`<!-- core-lab-observability:start -->` markers) and updates
`reports/issues/<nid>/observability/latest.json`. Re-running it replaces the section rather than duplicating it.

Validate any manifest independently:

```bash
node tools/observability/cli.mjs validate reports/issues/3619127/observability/<stamp>/evidence.json
```

Validation has two stages: JSON Schema (provenance, required fields, value types, enums) and referential integrity
(environment ids, action/request/trace/artifact links, correlation counts).

## Inspect

```bash
# The small committed summary
sed -n '1,120p' reports/issues/3619127/observability/<stamp>/SUMMARY.md

# The local request summaries and spans (inside the container)
cd envs/baseline-main
ddev exec sh -c 'tail -n 5 /tmp/core-lab-observability/requests-<run-id>.jsonl'
ddev exec sh -c 'tail -n 5 /tmp/core-lab-observability/spans-<run-id>.jsonl'

# Collector health and output
docker ps | grep otel-collector
ls -l observability/data/
```

The container's `/tmp/core-lab-observability/` files are the durable local evidence path. They are written by the module
even when no collector is configured. They live in `/tmp`, are mode `0600`, and are not web-accessible. Collect before
deleting or resetting the environment.

The viewer gets a **Drupal execution** tab when `latest.json` exists for the selected variant. If there is no evidence,
the tab is hidden rather than shown empty.

## Disable

```bash
node tools/observability/cli.mjs disable 3619127-pinned
```

This uninstalls the module, removes the module directory, removes the settings block and the DDEV compose file, and
restarts both projects. Existing evidence under `reports/issues/` is not deleted. Raw collector files under
`envs/<env>/observability/data/` are left in place; `node scripts/lab-env.mjs delete <slug>` removes the whole environment,
including them.

## DDEV Coder and other cloud environments

The commands are the same after the workspace is built with `node scripts/test-mr.mjs <nid>` (or the normal
`setup.mjs`). The collector is a normal DDEV compose service inside the workspace, so it uses the workspace's Docker
daemon; no host networking or published port is required.

- If the workspace cannot pull `otel/opentelemetry-collector-contrib:0.165.0`, pre-pull it or use `--no-collector`.
  Local spans still work and the manifest says the export is disabled.
- Do not change the viewer's existing origins or port bindings. The collector is reached by service name from the web
  container only.
- Coder Freeform workspaces can be suspended. A suspend removes the container's `/tmp`, so collect evidence before
  suspending; the host-mounted `envs/<env>/observability/data/` survives.
- The lab's cloud instructions remain the source of truth: [CLOUD-QUICKSTART.md](../CLOUD-QUICKSTART.md) and
  [tools/compare/cloud/README.md](../../tools/compare/cloud/README.md).

## GitHub Pages

`cloud/` is static. `scripts/build-cloud.mjs` copies the sanitised `latest.json` summary into `cloud/variants.json`; the
published page never contacts a collector, Drupal, or a trace backend. Raw spans and collector output are not copied.

After collecting new evidence, rebuild and check the static site:

```bash
node scripts/build-cloud.mjs
node scripts/build-cloud.mjs --check
```

## Performance overhead and benchmark isolation

Tracing is **not** free, and the lab does not pretend otherwise:

- Drupal's query logger records every statement executed during the request. That is useful for a diagnostic run and
  inappropriate for a benchmark.
- Each request creates a small span tree and writes the local NDJSON file. The OTLP export is batched and flushed at
  terminate, with a 1-second transport timeout and no retries, so a missing collector does not stall the site.
- Playwright `--playwright-trace` adds screenshots and DOM snapshots and is excluded unless explicitly requested.

A naive on/off comparison on the built #3619127 pair (20 authenticated `/node/add/article` requests with the module
enabled, then 20 with it disabled in `settings.php`, caches cleared between) gave medians of **58.0 ms on** and **71.6 ms
off** on 2026-11-23. That is the wrong sign: run-to-run variance was larger than any plausible instrumentation cost, and
the two blocks were not interleaved. The pilot therefore does **not** claim a measured overhead figure. The practical
finding is that a single before/after timing pair cannot support a performance conclusion, which is why the comparison
marks instrumented timing as diagnostic and why tracing runs are kept separate from Lighthouse/resource benchmarks.

Rules the lab follows:

1. Record `run.instrumented` and each environment's `observability.status`; the manifest is the record.
2. Do not compare an instrumented Lighthouse or resource benchmark with a non-instrumented one. `compareEvidence` marks
   timing metrics `not-comparable` when either side was not instrumented, and notes that instrumented timings include
   logging/export overhead.
3. Run diagnostic tracing and performance measurement as separate runs. Do not use the instrumented timing to claim an
   overhead figure; the local A/B test above shows why.
4. Treat changes in query count and cache-table queries as observations. Cache state, request count and configuration can
   change them independently of the patch.

## Tests

```bash
node --test tests/lab/observability.test.mjs tests/lab/observability-browser.test.mjs
node tools/playwright/viewer-execution.mjs                 # static GitHub Pages presentation
node tools/playwright/viewer-execution.mjs --live          # a running viewer at http://localhost:8100
node scripts/selftest.mjs                                  # the lab's own checks
```

The browser test skips itself when Playwright Chromium is not installed. `viewer-execution.mjs` checks the section with
axe-core in light, dark, forced-colours, reduced-motion and 320 px contexts and fails on a page error, a missing section or
a violation inside it. The schema and comparison tests do not need DDEV, Playwright, a collector or the network.

## Troubleshooting

| Symptom | Check |
|---|---|
| `status` says module false | `ddev drupal cache`, then run `enable` again. Look at `ddev logs -s web` (or `ddev logs`). |
| Response has no `X-Core-Lab-Trace-Id` | The settings block may be missing or `enabled` is false. `node tools/observability/cli.mjs status <slug>`. |
| `export.status = failed` | The collector is not running, or the endpoint is not the full `/v1/traces` URL. Check `ddev describe -j` and `docker ps`. |
| Collector `traces.jsonl` stays empty | Check the collector logs: `docker logs ddev-<project>-otel-collector` (the image has no shell). A GET to `/v1/traces` returns 405; a POST returns 200. |
| Collector exits or restarts | The compose file or config is invalid. `ddev logs -s otel-collector` where supported, otherwise `docker logs`. |
| A request has a trace id but no spans | The local summary and span files were not read (container restarted) or the page cache served the response. The correlation status says `requests_without_server_details`. |
| Collect cannot find the run | Pass the exact folder under `reports/issues/<nid>/playwright/` that contains `results.json` and `observability-<side>.json`. |
