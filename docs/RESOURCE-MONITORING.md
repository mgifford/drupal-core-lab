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
  separately from estimated prompt bytes; it never presents bytes/4 as a tokenizer count. Reported reasoning tokens are
  shown as a note because the client already includes them in output; they are never added a second time.
- `cost.reported_usd` is a provider invoice-like figure; `cost.estimated_usd` is a client or model estimate.
  `cost.basis` distinguishes `provider-reported`, `client-reported-estimate`, `estimated`, `subscription-allowance` and
  `unavailable`. Claude Code’s cost-state value is a **client-reported estimate** and may be a subscription allowance,
  not a charge. Missing cost is null, never zero.
- `model_requests`, tool invocations, result bytes, repeated reads, context start/average, API and tool latency are
  recorded when the source reports them.

### Request-level accounting

`scripts/session-usage.mjs --requests` emits one record per distinct provider message id. The Claude adapter turns each
record into an `ai-request` event and a session roll-up:

| Scope | Event | Counted? | What it carries |
|---|---|---|---|
| Request | `ai-request` | Yes when the session reconciles | Provider token categories for one message id, its tool operations, one activity association, a derived cost share |
| Session | `ai-usage` | No when the session reconciles | Context start/average, API/tool latency, repeated reads, prompt provenance, reconciliation |
| Session | `ai-usage` | Yes when request totals do not reconcile | The session total, as before; request rows are stored but marked uncounted |

`accounting.counted` is the only switch aggregation uses. A request-level session is never added to its roll-up. The
check is deterministic: request token sum must equal the session token sum, request count must equal the client’s call
count, and no usage record may be missing. A mismatch is reported with its delta; the totals are not silently adjusted.

Token formulas for the Claude transcript: `input_total = input + cache_creation + cache_read`;
`uncached_input = input`; `output` already includes reported thinking tokens, so `reasoning` is shown separately and is
not added again. A tool-free request is included and stays `unknown` / `model_only_request`. A request with several
tool operations is not divided equally: if its operations support one activity, that activity is recorded; if more than
one **strong** activity is present, it stays Unknown with `ambiguous_activity` and the components are preserved;
otherwise the primary-operation rule chooses the activity with the most operations, using the documented precedence as
a tie-break.

Activity association is not causation. A validation request’s 300k-token input contains earlier exploration and
instructions. The event says “this request happened while validating”; it does not say those tokens were caused by
validation or were avoidable.

### Classification provenance and Unknown reasons

`tools/resource/rules.mjs` is the versioned rule registry (`CLASSIFIER_VERSION`). Each classification records:

- the activity and optional code-exploration subcategory;
- a rule id (`tool.read`, `git.history`, `script.lint`, `inline.write-signal`, …);
- provenance: `structured_tool_arguments`, `known_script_registry`, `parsed_command`, `tool_name_rule`,
  `contextual_inference`, `explicit_task_metadata` or `unclassified`;
- confidence: `deterministic`, `heuristic` or `unclassified` (a category, not a calibrated score);
- an Unknown reason when no activity is asserted.

Unknown reason codes are `unrecognized_tool`, `unrecognized_command`, `compound_command`, `ambiguous_activity`,
`missing_tool_details`, `model_only_request`, `missing_task`, `missing_issue`, `incomplete_transcript`,
`unsupported_client`, `missing_usage`, `parser_error` and `unclassified_other`. Activity, issue and task attribution are
independent: a missing Drupal issue does not make a known activity Unknown, and an Unknown activity does not make the
issue unattributed.

A compound command or multi-tool request is resolved with a documented primary-operation precedence (patch development,
validation, issue work, environment, exploration). Every component is retained and the result is labelled `heuristic`;
the rule does not divide the request’s tokens among the operations. When more than one **strong** activity is present
(for example a PHPUnit run and an edit in the same request), no primary is asserted: the result stays Unknown with
`ambiguous_activity`. Shell parsing is conservative: quotes, `&&`, `||`, pipelines, loops, assignments and substitutions
are handled without evaluation; a heredoc body is data and is never executed. If the line cannot be parsed safely, the
operation stays Unknown with `parser_error`.

### Explicit task metadata and outcomes

A session id is not a development task. `scripts/resource-task.mjs` records a small local task record and maps it to one
or more Claude session files; the collector then puts that task id, kind, state, expected deliverable and verified flag on
the session and its request events. The record is append-only JSONL under `.lab-cache/resource-ledger/tasks.jsonl`; the
latest record for a task id wins.

```bash
node scripts/resource-task.mjs start issue-3619127 --kind=accessibility-evaluation \
  --deliverable=accessibility-findings --issue=3619127 --variant=3619127-pinned \
  --session=/absolute/path/to/session.jsonl --label="Drupal issue investigation"
node scripts/resource-task.mjs update issue-3619127 --state=completed_verified --verified \
  --evidence=reports/issues/3619127/EVIDENCE.md
node scripts/resource-task.mjs list
```

States are `planned`, `in_progress`, `blocked`, `paused`, `completed_claimed`, `completed_verified`, `abandoned` and
`unknown`. A `completed_claimed` record is not evidence; only `completed_verified` with a human-confirmed evidence
reference counts as verified. Descriptions, evidence paths and session names are local-only.

Limitations: a session maps to at most one explicit task. A session that contains several development tasks cannot be
split from the transcript alone; its requests stay on the declared task until a finer, explicit boundary exists. Task
summaries publish only a hash of the task id, the kind/state/deliverable, issue, resource totals and data completeness.

`attribution.task.events_attributed` counts only task ids declared in `tasks.jsonl`, or explicit task metadata carried
by the event. Non-session ids from CI workflows, Docker samples and wrapper labels are reported separately as
`non_session_task_events`; they are not development-task declarations. A session id is never counted as a task.

### Repeated operations and failure fingerprints

A repetition is deliberately narrow: the same measured command, Git revision, patch identity, execution environment,
test identifiers and result signature. `tools/resource/repetition.mjs` computes it deterministically; it never reads a
failure log to guess a cause. A repeat under a changed revision, patch or environment is a separate group, not waste.

`scripts/resource-run.mjs` accepts `--test-id=<id>` (repeatable), `--result-signature=<stable>` and `--patch=<ref>` so a
caller can make the identity precise. Without a result signature, the exit status, signal, timeout and error flag form a
coarse signature. The wrapper marks `validation` as passed/failed/unknown only from the exit result; it does not claim
that an accessibility evaluation passed.

The budget check uses the same groups for `max_test_repetitions`. `evaluateBudget()` also exposes
`repeated_unchanged_failures` as a diagnostic; it is not a new enforced limit. The public report and dashboard show
repeated groups with a group hash, activity, run counts, result counts and day-level dates. Command hashes, precise
times and result signatures stay local.

### Prompt and artifact provenance

Prompt capture is metadata-first. `scripts/session-usage.mjs --provenance <file>` writes, per prompt: a stable local id,
timestamps, origin (`human`, `generated`, `unknown`), purpose, byte size, line count, size bucket, content types,
SHA-256 fingerprint, and artifact references. It never writes prompt text into the event or the public summary.

- `--prompt-content <dir>` is the explicit opt-in for raw local prompt text. Files are written with mode `0600` under the
  local cache, named by fingerprint; they are gitignored and never read by the report or the dashboard.
- `--inspect-artifacts` is the explicit opt-in for reading referenced local ZIP/patch files. ZIP inspection reads only the
  central directory (bounded entries, declared sizes, traversal, absolute paths, symlinks, encryption) and extracts
  nothing. Patch inspection counts files/lines and flags tests/docs/generated CSS. The result records an artifact
  reference separately from ingestion: a reference does not prove a model received or read the content.

### Exploration diagnostics

`tools/resource/exploration.mjs` compares local-only lookup targets (file, search pattern, `code-map` symbol) across the
requests of a session. It reports unique/repeated targets, failed searches, exploration after a failure or an edit,
loop-like sequences, `code-map.mjs` use, unique files and tool-result bytes. The targets are not published. Repetition is
a diagnostic: a file may have changed, a test may have failed, or a new task may need the same evidence.

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
node scripts/resource.mjs collect --source=mutagen   # read-only ddev mutagen status -l per running project
node scripts/resource.mjs collect --source=claude --issue=3619127 --variant=3619127-pinned
node scripts/resource.mjs collect --source=claude --prompt-content   # opt-in: local raw prompt files
node scripts/resource.mjs collect --source=claude --inspect-artifacts # opt-in: bounded ZIP/patch metadata reads
node scripts/resource.mjs audit                                      # deterministic Unknown/attribution investigation
node scripts/resource.mjs audit --json=/tmp/attribution-audit.json

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

- shows totals, activity shares, daily trend, cost by model, CPU by tool, GitHub Actions time, per-issue totals and a sampled **Infrastructure efficiency** table by container role (web, Chrome, OTEL, viewer, router, SSH agent);
- shows a derived **Energy estimate** section: central remote-inference energy, its workload and configuration bands, energy by model and activity, coverage with denominators, the method/boundary/dataset table, and a link to [cleer.html](../cloud/cleer.html);
- labels container CPU/memory as sampled, shows the latest Mutagen session file count/content size per variant, and keeps Docker disk in the local `lab-env resources` command rather than the public page;
- supports date, issue, activity, tool and model filters with native controls;
- gives every chart a visible table equivalent; wide tables scroll inside focusable `role="region"` wrappers;
- works in light, dark, forced-colours, reduced-motion, 320 px and 200% text contexts;
- distinguishes provider-reported, measured, derived, estimated and unavailable values, and shows “—” rather than zero.

Selecting an issue in the filter gives the per-issue view. The page reads only `resources.json`; it does not contact an AI
provider, Drupal, a collector or a database.

`node tools/playwright/resource-dashboard.mjs` checked the static dashboard in light, dark, forced-colours,
reduced-motion, 320 px and 200% text contexts, with native filters and focusable table regions: 6 of 6 contexts passed
with no axe-core violations and no page errors. The result is
[dashboard-a11y.json](../reports/resources/dashboard-a11y.json). With the energy section the run records 11 cards and 28
tables; `resources.json` was 535,597 bytes, fetched in 1–2 ms on this host, with DOMContentLoaded at 6–14 ms. These are
host-specific observations, not targets. The same run found and fixed a 320 px reflow defect when the energy tables were
first added.

`node tools/playwright/cleer-page.mjs` checks the static CLEER page in both forced-colours schemes and the same contexts:
7 of 7 passed with no axe-core violations, no page errors, no off-origin request, and no 320 px or 200% text reflow. The
result is [cleer-page-a11y.json](../reports/resources/cleer-page-a11y.json). Both results are automated accessibility
evidence, not a manual keyboard or screen-reader pass.

## Energy estimation

Remote inference energy is estimated in a separate, derived report. It does not modify the ledger and does not change any
token count, timestamp or primary measurement.

```bash
node scripts/resource-energy.mjs verify     # offline: dataset checksums and mapping
node scripts/resource-energy.mjs report     # print the report
node scripts/resource-energy.mjs report --write
node scripts/resource-energy.mjs report --check
node scripts/resource-energy.mjs estimate --model=claude-sonnet-5-5 --cost=1.00
node scripts/resource-energy.mjs sync --sha=<commit>   # the only networked command; explicit
```

The report multiplies each AI event's client-reported cost by a CLEER `energy_wh_per_usd` intensity. The dataset also
publishes `vadj_energy_wh_per_usd`; for the mapped models under `agentic` it is about 28–31% higher. The headline uses the
unadjusted column, and the adjusted figure is a separate sensitivity. The three-tier "band" is one-sided by construction
(the configured tier is one of the three) and is labelled a sensitivity, not a range. CLEER publishes no per-token
coefficients and withholds the token counts behind its workloads, so this project does not reconstruct them.
The method, its assumptions, the model mapping and the uncertainty semantics are in [CLEER.md](CLEER.md); the numbers are
in [ENERGY-SUMMARY.md](../reports/resources/ENERGY-SUMMARY.md) and
[ENERGY-COVERAGE.md](../reports/resources/ENERGY-COVERAGE.md).

What the estimate covers: remote inference energy at CLEER's facility boundary. What it does not cover: local DDEV
containers, PHP, the database, Chromium, Composer, PHPUnit, GitHub Actions, or carbon. Those keep their existing
CPU-seconds and CI-duration measurements and are not converted to energy.

A model without an explicit mapping or an exact dataset-name match has no estimate; its cost and tokens remain counted.
A proxy mapping is labelled with its review status and CLEER's own confidence. Two methods (the cost bridge and a future
per-token coefficient import) are shown separately and are never merged.

## Monitoring the measurement system

- Collection is event-driven and on demand; no continuous poller runs by default.
- Every `collect`/`run` records a `monitoring` event with the collector process’s CPU, peak RSS and duration from
  `process.resourceUsage()`.
- The wrapper’s own CPU is separate from the child’s `/usr/bin/time` CPU; the dashboard reports both separately.
- Run `node scripts/resource.mjs verify` and delete or compact the local ledger when needed; the committed summary
  remains. Request-level collection makes the local ledger larger than the earlier session-only ledger (18.4 MB on
  2026-11-24 after the classifier 2.1.0 re-collection; superseded snapshots are retained); it stays local and is not
  published.
- The public summary is an aggregate; it grows with distinct grouped rows, not with every raw event.
- Measured on 2026-11-24 after the classifier 2.1.0 re-collection: the local ledger held 5,089 lines and 2,374 loaded
  events in 18.4 MB; loading and validating took about 340 ms, aggregation about 32 ms, public-row construction about
  5 ms, the compact public JSON was about 267 KB, and the published pretty-printed `cloud/resources.json` was about
  386 KB. These are host-specific observations, not targets. `node scripts/resource-benchmark.mjs` reproduces them.
- Re-importing unchanged transcripts added 0 duplicate events (2,191 source events skipped); each collection run still
  appends one `monitoring` event for its own overhead.

### Proposed diagnostic warnings (experimental, not enforced)

The existing `resource-budgets.yml` keys remain the only enforced-or-observed limits. The following are reported as
**possible opportunities** in the deterministic report until a measured baseline justifies a key:

- high Unknown share, with its reason breakdown;
- explicit-task or issue attribution gaps (reported separately, never merged);
- repeated lookup targets and loop-like exploration sequences;
- large tool-result bytes or unusually rapid context growth;
- repeated identical validation runs on the same tree;
- repeated environment setup at the same commit.

Each opportunity carries the observed measurement, evidence event ids, a limitation and a next diagnostic action. Thresholds
are not uniform: an accessibility investigation, a patch, and routine maintenance do not share a budget. No warning stops
work.

## Limitations

- Claude Code is the only AI client adapter today. Other coding agents, local LLMs and direct API clients need adapters.
- Session usage is provider/client reported; the client’s cost is not an invoice. Request-level token counts are
  provider-reported. Activity association is derived, sometimes heuristic, and is not a per-tool provider measurement.
- Per-request duration is not exposed by the client transcript; only session API/tool duration is available. Request
  context is associated with an activity, not proven to be caused by it.
- Prompt capture is metadata-only by default. The effective provider request (hidden system instructions, tool
  definitions, attachments added by the client) is only partly observable. A prompt fingerprint proves identical bytes,
  not identical meaning.
- Unknown cannot be eliminated. Model-only requests have no tool evidence; unrecognized inline code, unsupported
  clients and incomplete transcripts stay explicitly Unknown.
- CPU time is measured for wrapped commands, not for whole shells, editors, MCP servers or host-wide work such as
  Mutagen, the DDEV router or the operating system. Docker CPU is sampled/derived.
- GitHub Actions billable minutes and runner CPU are unavailable. Overlap/supersession is derived.
- The local ledger does not prove that a period with no events had no work; collection is on demand.
- Token counts and CPU time are not energy measurements. This project does not convert CPU-seconds or tokens into kWh or
  carbon emissions. A separate energy report estimates remote inference energy from a client-reported cost and a
  published CLEER energy-per-dollar intensity; it is labelled an estimate, is not a measurement, and claims no
  conformance with any standard. See [CLEER.md](CLEER.md).
- The dashboard is an accounting and investigation tool, not a performance benchmark. Instrumented runs and resource
  measurement have their own overhead.

## Maintenance: adding a provider or measurement source

1. Add `tools/resource/adapters/<source>.mjs` with `collectX()` returning `{ events, errors, metadata }`.
2. Use `makeEvent()` and the existing schema. Do not add a second ledger or a second aggregation path.
3. Set `source.adapter`, `source.method`, `source.confidence` and a local `source.reference`. Never copy raw prompts,
   responses, transcripts or credentials into the ledger or a report.
4. Use `source_key` for a mutable snapshot (a growing session or an in-progress CI run); use a deterministic content event
   for an immutable record. Never count the same provider message twice.
5. Classify with `classifyOperation()` (preferred), `classifyLabelDetailed()` or `classifyWorkflow()`. Add a named rule to
   `tools/resource/rules.mjs` with a `rule_id`, provenance and confidence, and a test in
   `tests/lab/resource-attribution.test.mjs`. If uncertain, return Unknown with a documented reason; never guess.
6. Add the source to `scripts/resource.mjs collect` and document it in this file.
7. Add a test fixture and a test under `tests/lab/` covering parsing, missing values, deduplication and public export.
8. If a new field is needed, bump `schema_version`, update the schema and the public allowlist, and run
   `node scripts/resource.mjs verify` and the tests. Do not expose a new field by accident.
9. Update the baseline and rebuild `cloud/` with `node scripts/resource.mjs report --write` and
   `node scripts/build-cloud.mjs`.

## Baseline and opportunities

The current baseline is [reports/resources/BASELINE.md](../reports/resources/BASELINE.md). The historical baseline and
its generated summary are preserved unchanged under
[reports/resources/archive/2026-11-23/](../reports/resources/archive/2026-11-23/); the methodological difference is
documented in [reports/resources/METHODOLOGY-COMPARISON.md](../reports/resources/METHODOLOGY-COMPARISON.md).

The current data covers the same 10 Claude Code sessions, 54 model-eval trials, 100 GitHub Actions runs/jobs, Docker
samples and measured local commands. Request-level reconciliation matched all 10 sessions: 2,181 request events sum to
812,265,879 tokens, the same session total as before, with zero difference.

The deterministic rules identify possible opportunities, with evidence event ids in the report:

1. **High:** a material share of request context is associated with code exploration (28.3%); try
   `scripts/code-map.mjs` for locate-and-read chains, then compare a comparable session.
2. **High:** 20.2% of request context is Unknown. The reasons are model-only requests (81.0M tokens),
   compound commands (45.4M), requests or commands with several strong activities (28.1M), and unrecognized commands
   (10.0M). This is a measurement gap, not waste. The share is higher than the first request-level report because
   classifier 2.1.0 stopped choosing a primary when two strong activities are present.
3. **High:** nine sessions had large starting or average contexts (max start 81k, max average 531k tokens); measure
   `scripts/context-size.mjs` before changing instructions.
4. **Medium:** two GitHub Actions runs overlap a later run; review concurrency, but do not cancel evidence-producing runs.
5. **Low:** 76 repeated lookups in 46 repeated targets; inspect them locally before changing instructions.

The provider token total remains dominated by cache reads (796.8M of 812.8M input-side tokens), so context re-reading is
the largest lever. That is a measurement, not yet a change in behaviour.

## Planning an investigation

1. `node scripts/resource.mjs audit` — read the attribution quality, Unknown reasons and reconciliation first.
2. `node scripts/resource.mjs audit --json=/tmp/a.json` — keep a local snapshot for comparison after a change.
3. `node scripts/session-usage.mjs --tools --sequences` — inspect the sessions and repeated call sequences.
4. `node scripts/resource.mjs recent --limit=20` — inspect sanitised ledger events; raw prompt metadata stays in the
   local ledger’s `private` object.
5. For a specific prompt/artifact, run `scripts/session-usage.mjs --provenance /tmp/p.json <transcript>` and, only if
   needed, add `--prompt-content .lab-cache/resource-ledger/prompt-content`. Never commit that directory.
6. For repeated exploration, `node scripts/resource-exploration.mjs` prints the local targets and whether a repeat followed an edit or failure. Its output is local-only; do not publish it.
7. Re-run `node scripts/resource.mjs report --write --baseline`, `node scripts/build-cloud.mjs`, and the tests. Compare
   attribution coverage and reconciliation before comparing token totals; a classification change is not an efficiency
   improvement.

## Privacy

The public export is an explicit allowlist. Raw transcripts, prompt text, responses, API keys, account identifiers,
private paths, precise work timestamps, run ids, command text and artifact references/fingerprints are never public.
Prompt metadata is published only as aggregate counts and distributions. See [RESOURCE-PRIVACY.md](RESOURCE-PRIVACY.md).
