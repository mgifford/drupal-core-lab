# Resource monitoring and accounting

Drupal Core Lab records where AI tokens, estimated cost, CPU time, memory and GitHub Actions time are spent while
developing, testing and maintaining the lab. The purpose is conscious use of computational resources without lowering
the quality of Drupal accessibility evidence.

The system is deterministic. It does not use an AI model to collect, classify, aggregate or explain usage, and the public
dashboard calls no provider. Missing values are `null` and displayed as “—”; a measured zero stays zero.

## What was already measured, and what was missing

Before this work the repository already had:

| Source | What it measures | Reliability |
|---|---|---|
| [`scripts/session-usage.mjs`](../scripts/session-usage.mjs) | Claude Code transcript usage: uncached input, cache creation/read, output, thinking, model calls, tool calls, tool-result bytes, repeated reads, context start/average, client-reported cost, API/tool time | Provider-reported usage in the client transcript; cost is a client estimate, not an invoice. One API message is counted once by `message.id`. |
| [`scripts/context-size.mjs`](../scripts/context-size.mjs) | The client's own `/context` counts for a command-line session | Client-reported snapshot; not the first-call size of a desktop session. |
| [`scripts/usage-baseline.mjs`](../scripts/usage-baseline.mjs) | Bytes and words in an issue-pack prompt; `bytes/4` shown only as a rough ratio | Estimated, not a tokenizer count. Kept separate from provider tokens. |
| [`scripts/model-eval.mjs`](../scripts/model-eval.mjs) | Recorded paired model-eval trials: input/output tokens, client cost, latency, score | Provider-reported tokens and client-reported cost; raw replies are not committed. |
| [`scripts/measure-resources.mjs`](../scripts/measure-resources.mjs) | Serial request timing, PHP peak memory, sampled Docker CPU/memory | Good for local comparison; not a CPU-time accounting tool; sampled peaks can miss short spikes. |
| GitHub Actions workflows | Run and job duration, conclusion, trigger | Provider-reported; billable minutes and runner CPU are not exposed by the public API. |

Missing before this change: one normalized event schema; a persistent local ledger with deduplication and supersession; a
way to associate measurements with an issue, variant and task; process CPU/RSS accounting; GitHub Actions ingestion;
budget checks; and a public dashboard with an explicit public-data allowlist.

## Architecture

```text
Claude Code transcripts ── session-usage.mjs ─┐
Model-eval trials ─────────────────────────────┤
measure-resources JSON ───────────────────────┤   tools/resource/adapters/
GitHub Actions API ───────────────────────────┼──► normalized events ──► local JSONL ledger
Docker stats ─────────────────────────────────┤        (schema 1.0.0)      .lab-cache/resource-ledger/
process wrapper (/usr/bin/time) ──────────────┘                                │
                                                                               ▼
                                                              deterministic aggregation
                                                              tools/resource/aggregate.mjs
                                                                               │
                                             ┌─────────────────────────────────┴─────────────────────┐
                                             ▼                                                       ▼
                                reports/resources/SUMMARY.md                     cloud/resources.json + resources.html
                                reports/resources/summary.json                   (GitHub Pages; static, sanitised)
```

The ledger is append-only JSONL. A mutable source (a transcript that is still growing) has a `source_key`; importing a
newer snapshot appends a superseding event, and aggregation uses only the latest revision. Immutable events are deduped
by a deterministic `event_id` derived from their content. A malformed ledger line is reported and skipped, not allowed
to break the whole ledger.

Why JSONL rather than SQLite: the repository already keeps small structured evidence as JSON, the ledger is intended to
be human-inspectable, and no new runtime dependency is needed. The public interchange format remains versioned JSON. If
the ledger grows beyond convenient JSONL size, the same event shape can be loaded into SQLite without changing adapters
or the public format.

## Event schema

[`tools/resource/events.schema.json`](../tools/resource/events.schema.json) is JSON Schema 2020-12, `schema_version`
`1.0.0`. Every event carries:

- `occurred_at`, `recorded_at`, `duration_ms`;
- `project`, `issue`, `variant`;
- `task` (`id`, `label`, `execution_id`);
- `activity` (issue intake, code exploration, patch development, PHPUnit, Playwright, accessibility scanning, Lighthouse,
  environment setup, Composer, cache rebuild, documentation, resource measurement, GitHub Actions, infrastructure,
  monitoring, validation, unknown);
- `tool`, `model`, `provider`, `environment`;
- `outcome`, `validation`, `commit`, `patch`;
- `source` with adapter, method, confidence (`measured`, `provider-reported`, `derived`, `estimated`, `unavailable`) and a
  local reference;
- `measurements` for tokens, cost, tools, context, latency, CPU, memory, I/O, network and GitHub metadata;
- `quality` with completeness, missing fields and notes;
- optional `allocations` (derived activity shares), `source_key`/`supersedes`/`revision` for the ledger, and a `private`
  object that is never exported.

Make events only through `makeEvent()`; it fills defaults, computes the event id and is validated before the ledger
accepts it. `validateAgainst()` from the observability layer is reused as the validator; this is not a second schema
engine.

### AI measurements

- `tokens.input_total` is the input side when a source does not split cache categories. `uncached_input`,
  `cache_creation`, `cache_read`, `output` and `reasoning` are kept separately when reported.
- `token_basis` says `provider-reported`, `estimated` or `unavailable`. The dashboard sums provider-reported tokens
  separately from estimated prompt bytes; it never presents bytes/4 as a tokenizer count.
- `cost.reported_usd` is a provider invoice-like figure; `cost.estimated_usd` is a client or model estimate.
  `cost.basis` distinguishes `provider-reported`, `client-reported-estimate`, `estimated`, `subscription-allowance` and
  `unavailable`. Claude Code’s cost-state value is a **client-reported estimate** and may be a subscription allowance,
  not a charge. Missing cost is null, never zero.
- `model_requests`, tool invocations, result bytes, repeated reads, context start/average, API and tool latency are
  recorded when the source reports them.

### CPU, memory and I/O

- `scripts/resource-run.mjs` runs a command under `/usr/bin/time -l` (macOS) or `-v` (Linux), recording wall time,
  user/system CPU, peak RSS and block I/O operations. `cpu.measurement = measured`.
- Docker sampling records `CPUPerc`, memory, network and block I/O. CPU-seconds derived from a sampled percentage are
  labelled `derived`; the dashboard says “sampled/derived”, never “exact CPU cycles”. `measure-resources.mjs` contributes
  response medians, PHP peak and sampled container peaks, and explicitly marks cumulative CPU as unavailable.
- CPU percentage is not cumulative CPU consumption. A 200% sample means two cores’ worth at that instant, not 200% of a
  machine forever.

### GitHub Actions

`tools/resource/adapters/github-actions.mjs` reads the public API (via `gh` when available, otherwise unauthenticated
`fetch`). It records workflow, job, trigger, runner label, attempt, queue time, duration and conclusion. Billable minutes
are unavailable and stay null. An overlapping later run on the same workflow/branch/trigger is flagged
`potentially_superseded`; this is derived, not a confirmed waste.

## Commands

```bash
# Collect available measurements (no model call). Default: Claude transcripts, model-eval trials, measure-resources.
node scripts/resource.mjs collect
node scripts/resource.mjs collect --source=all --samples=3 --interval=1000
node scripts/resource.mjs collect --source=claude --issue=3619127 --variant=3619127-pinned

# Inspect the local ledger (sanitised view)
node scripts/resource.mjs recent --limit=20
node scripts/resource.mjs recent --json=/tmp/recent.json

# Deterministic report and public export
node scripts/resource.mjs report --write
node scripts/resource.mjs report --write --baseline
node scripts/resource.mjs report --check
node scripts/resource.mjs export --out=cloud/resources.json

# Validate the ledger and budget file
node scripts/resource.mjs verify
node scripts/resource-budget.mjs --task=phpunit --issue=3619127
```

`node scripts/resource.mjs collect` records its own CPU and memory as a `monitoring` event; it is reported separately and
never mixed into activity totals. Collection is on demand, not a high-frequency daemon.

### Measuring a command

```bash
node scripts/resource-run.mjs --activity=phpunit-execution --issue=3619127 --variant=3619127-pinned \
  --task=phpunit -- ddev phpunit core/tests/Drupal/Functional/ExampleTest.php
```

The wrapper checks the budget before starting, records a `process` event, records its own wrapper overhead, and prints
the result. It does not kill a process unless the caller explicitly passes `--timeout`. In `enforce` mode an exceeded
enforceable limit refuses to start the command; `--approve --reason="..."` records the override and proceeds. Provider-side
model calls cannot be intercepted this way; that limitation is explicit.

## Budgets

[`resource-budgets.yml`](../resource-budgets.yml) starts in **observe** mode. Limits cover AI requests, provider tokens,
estimated spend, repeated exploratory calls, unsuccessful iterations, process duration, concurrent CPU jobs and test
repetitions. Overrides may target an issue or a task id.

| Mode | Behaviour |
|---|---|
| `observe` | Record everything; report limits; never block. |
| `warn` | Print warnings when a limit is exceeded; never block. |
| `enforce` | Refuse to **start** a wrapped operation when an enforceable limit is exceeded, unless `--approve --reason` is recorded. It never silently kills critical work. |

`scripts/resource-run.mjs` enforces wrapped commands. `scripts/model-eval.mjs run` also checks the budget before its
first model call: in enforce mode it refuses before spending, with the same `--approve --reason` override. The check
counts the calls the planned evaluation would add. `resource-budget.mjs check` exits 3 in enforce mode when an
enforceable limit is exceeded, for use in a person-controlled preflight. Spend and process duration are advisory: the lab cannot stop
a provider charge, and a duration is known only after a run. Complex accessibility investigations can use an explicit
override.

## Public dashboard

`tools/resource/dashboard.html` becomes `cloud/resources.html`; `reports/resources/summary.json` becomes
`cloud/resources.json`. Both are generated and committed; GitHub Pages remains static. The dashboard:

- shows totals, activity shares, daily trend, cost by model, CPU by tool, GitHub Actions time and per-issue totals;
- supports date, issue, activity, tool and model filters with native controls;
- gives every chart a visible table equivalent; wide tables scroll inside focusable `role="region"` wrappers;
- works in light, dark, forced-colours, reduced-motion and 320 px contexts;
- distinguishes provider-reported, measured, derived, estimated and unavailable values, and shows “—” rather than zero.

Selecting an issue in the filter gives the per-issue view. The page reads only `resources.json`; it does not contact an AI
provider, Drupal, a collector or a database.

`node tools/playwright/resource-dashboard.mjs` checked the static dashboard in light, dark, forced-colours,
reduced-motion and 320 px contexts, with native filters and focusable table regions: 5 of 5 contexts passed with no
axe-core violations. The result is [dashboard-a11y.json](../reports/resources/dashboard-a11y.json). This is automated
accessibility evidence, not a manual keyboard or screen-reader pass.

## Monitoring the measurement system

- Collection is event-driven and on demand; no continuous poller runs by default.
- Every `collect`/`run` records a `monitoring` event with the collector process’s CPU, peak RSS and duration from
  `process.resourceUsage()`.
- The wrapper’s own CPU is separate from the child’s `/usr/bin/time` CPU; the dashboard reports both separately.
- The local ledger is small (tens of KB for the current baseline). Run `node scripts/resource.mjs verify` and delete or
  compact the local ledger when needed; the committed summary remains.
- The public summary is an aggregate; it does not grow with every raw event.

## Limitations

- Claude Code is the only AI client adapter today. Other coding agents, local LLMs and direct API clients need adapters.
- Session usage is provider/client reported; the client’s cost is not an invoice. Tokens are not estimates, but the
  per-activity token split is derived from tool-call share, not provider per-tool accounting.
- CPU time is measured for wrapped commands, not for whole shells, editors, MCP servers or host-wide work such as
  Mutagen, the DDEV router or the operating system. Docker CPU is sampled/derived.
- GitHub Actions billable minutes and runner CPU are unavailable. Overlap/supersession is derived.
- The local ledger does not prove that a period with no events had no work; collection is on demand.
- Token counts and CPU time are not energy measurements. This project does not convert CPU-seconds or tokens into kWh or
  carbon emissions. If measured energy becomes available, it should be a separate metric with a documented method,
  aligned with the Green Software Foundation’s Software Carbon Intensity specification and the W3C Web Sustainability
  Guidelines; no new standard is invented here.
- The dashboard is an accounting and investigation tool, not a performance benchmark. Instrumented runs and resource
  measurement have their own overhead.

## Maintenance: adding a provider or measurement source

1. Add `tools/resource/adapters/<source>.mjs` with `collectX()` returning `{ events, errors, metadata }`.
2. Use `makeEvent()` and the existing schema. Do not add a second ledger or a second aggregation path.
3. Set `source.adapter`, `source.method`, `source.confidence` and a local `source.reference`. Never copy raw prompts,
   responses, transcripts or credentials into the ledger or a report.
4. Use `source_key` for a mutable snapshot (a growing session or an in-progress CI run); use a deterministic content event
   for an immutable record. Never count the same provider message twice.
5. Classify with `classifyTool`, `classifyCommand` or `classifyWorkflow`; if uncertain, use `unknown`.
6. Add the source to `scripts/resource.mjs collect` and document it in this file.
7. Add a test fixture and a test under `tests/lab/` covering parsing, missing values, deduplication and public export.
8. If a new field is needed, bump `schema_version`, update the schema and the public allowlist, and run
   `node scripts/resource.mjs verify` and the tests. Do not expose a new field by accident.
9. Update the baseline and rebuild `cloud/` with `node scripts/resource.mjs report --write` and
   `node scripts/build-cloud.mjs`.

## Initial baseline and opportunities

The initial baseline is [reports/resources/BASELINE.md](../reports/resources/BASELINE.md), generated 2026-11-23 from
recorded data through 2026-11-23. It includes the 10 Claude Code sessions then available, 54 recorded model-eval trials,
one `measure-resources` result, 100 GitHub Actions runs/jobs and two Docker samples, plus three measured local commands.

The deterministic rules identified four **possible** opportunities, with evidence event ids in the report:

1. **High:** code exploration is 24.7% of provider-reported tokens; try `scripts/code-map.mjs` for locate-and-read chains.
2. **High:** nine sessions had large starting or average contexts (max start 81k, max average 531k tokens); measure
   `scripts/context-size.mjs` before changing instructions.
3. **Medium:** two GitHub Actions runs overlap a later run; review concurrency, but do not cancel evidence-producing runs.
4. **Low:** one repeated read was recorded; check whether a targeted range would do, but one occurrence is weak evidence.

These are possible inefficiencies, not confirmed waste. The baseline also shows the most important limit: the provider
token total is dominated by cache reads (about 797M of 813M input-side tokens), so context re-reading is the largest
lever, and it must be measured rather than guessed.

## Privacy

The public export is an explicit allowlist. Raw transcripts, prompts, responses, API keys, account identifiers, private
paths, precise work timestamps, run ids and command text are never public. See [RESOURCE-PRIVACY.md](RESOURCE-PRIVACY.md).
