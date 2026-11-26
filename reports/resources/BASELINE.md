# Resource usage baseline

Generated 2026-11-25T21:43:06.170Z. Period: 2026-10-02 to 2026-11-24. Completeness: **partial**. No AI model was called to produce this report.

## Totals

| Metric | Value | Quality |
|---|---:|---|
| Provider-reported AI tokens | 812,783,208 | provider-reported |
| — uncached input | 4,380 | provider-reported where available |
| — cache creation | 12,858,965 | provider-reported where available |
| — cache read | 796,812,969 | provider-reported where available |
| — output | 2,636,967 | provider-reported where available |
| — reasoning (already inside output) | 1,084,537 | provider-reported where available; not added again |
| Estimated prompt tokens (bytes/4, not a tokenizer count) | — | unavailable |
| Model requests | 2,235 | provider-reported |
| Estimated AI cost | $237.19 (estimate) | client-reported-estimate; not an invoice |
| Provider-reported AI cost | — | unavailable |
| Process CPU-seconds | 9.49 | measured |
| CPU-hours | 0.003 h | measured |
| Peak memory | 355.1 MiB | measured/sampled |
| GitHub Actions duration | 0.944 h (100 runs / 100 jobs) | provider-reported |
| Task ids observed | 35 (12 success, 1 failure, 22 unknown) | distinct task ids, including sessions, CI and Docker; declared-task rows are separate |
| Collection overhead | 0.003 h CPU, 215.4 MiB peak | measured |

## Energy estimate

Derived from a client-reported cost and the pinned CLEER dataset. **Estimated, not measured.** The AI events behind it cover 2026-10-02 to 2026-10-16; the report period above may be wider. [Full energy report](ENERGY-SUMMARY.md) and [method](../docs/CLEER.md).

| Metric | Value | Basis |
|---|---:|---|
| Remote inference energy (central) | 1.68 kWh | estimated, cost-bridge; column `energy_wh_per_usd` |
| Workload sensitivity (one-sided) | 1.68 kWh – 1.73 kWh | the three published tiers; the configured tier is inside the spread |
| CLEER configuration band | 1.01 kWh – 2.35 kWh | 1.96 × published relative SD; scenario spread, not a confidence interval |
| Verbosity-adjusted intensity (sensitivity) | 2.18 kWh | cost × `vadj_energy_wh_per_usd`; a modelling alternative, not the headline |
| AI events covered | 2,235 of 2,235 (100.0%) | counted AI events |
| Mappings | 2 proxy mapping(s), 2 unreviewed | a proxy is not an exact match; see ENERGY-SUMMARY.md |
| Method | cost-bridge-v1 | facility-inference (accelerator + host + idle + cooling) |
| Dataset | CLEER-Text-0926/1.1.0 (2026-09-29) | CC BY-NC 4.0 |

## Consumption by activity

| Activity | Events | Tasks | Tokens | Share | Model requests | CPU-hours | Estimated cost | Method |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| patch-development | 564 | 9 | 250,239,550 | 30.8% | 564 | — | $66.79 | request-level-v1 |
| code-exploration | 661 | 9 | 230,268,498 | 28.3% | 661 | — | $64.53 | request-level-v1 |
| unknown | 461 | 9 | 164,507,421 | 20.2% | 461 | — | $53.11 | request-level-v1 |
| environment-setup | 248 | 11 | 75,712,828 | 9.3% | 247 | — | $24.85 | direct-event, request-level-v1 |
| validation | 157 | 11 | 26,383,834 | 3.2% | 65 | 0.000 | $6.82 | direct-event, request-level-v1 |
| issue-intake | 63 | 7 | 25,935,131 | 3.2% | 62 | — | $7.88 | direct-event, request-level-v1 |
| infrastructure | 76 | 19 | 13,529,402 | 1.7% | 32 | 0.002 | $3.12 | direct-event, request-level-v1 |
| playwright-testing | 27 | 5 | 8,187,259 | 1.0% | 27 | — | $2.12 | request-level-v1 |
| issue-analysis | 38 | 6 | 7,901,196 | 1.0% | 38 | — | $3.54 | request-level-v1 |
| model-evaluation | 59 | 2 | 3,503,654 | 0.4% | 59 | — | $2.54 | direct-event, request-level-v1 |
| github-actions | 7 | 5 | 2,399,065 | 0.3% | 5 | — | $0.60 | direct-event, request-level-v1 |
| phpunit-execution | 7 | 2 | 1,713,625 | 0.2% | 7 | — | $0.64 | request-level-v1 |
| resource-measurement | 5 | 4 | 1,241,616 | 0.2% | 3 | — | $0.40 | direct-event, request-level-v1 |
| documentation-generation | 9 | 4 | 931,593 | 0.1% | 2 | 0.000 | $0.20 | direct-event, request-level-v1 |
| composer-install | 2 | 1 | 328,536 | 0.0% | 2 | — | $0.07 | request-level-v1 |

Rows mix request-level activity, the older session tool-call-share allocation for historical records, and direct events (process, Docker, GitHub Actions) that were never session allocations. The method column above names them per activity; the dashboard keeps them distinguishable. Request-level activity is associated with the request context and is not proof that the activity caused every token in it.

## Infrastructure services (sampled)

Container statistics are sampled, not a live view. 27 role-labelled sample(s) across 9 container(s); 8 older sample(s) have no role and stay in By tool only. CPU-seconds are derived from CPUPerc over the sample interval; memory is container usage. Mutagen file counts, Chrome on/off and Docker disk are local-only (`lab-env resources`).

| Service | Containers | Samples | CPU-seconds | Peak memory |
|---|---:|---:|---:|---:|
| viewer | 1 | 3 | 1.2 | 84.6 MiB |
| chrome | 2 | 6 | 0.31 | 285.2 MiB |
| otel-collector | 2 | 6 | 0.01 | 46.2 MiB |
| web | 2 | 6 | 0.01 | 351.1 MiB |
| router | 1 | 3 | 0 | 49.4 MiB |
| ssh-agent | 1 | 3 | 0 | 3.9 MiB |

### Mutagen snapshots

The latest sampled Mutagen session per variant. These are session file counts and content sizes, not a directory walk or disk usage.

| Variant | Files | Contents | Sessions | Sampled |
|---|---:|---:|---:|---|
| baseline | 67,793 | 438.7 MiB | 1 | 2026-11-24T21:07:31Z |
| issue-3619127 | 67,761 | 438.7 MiB | 1 | 2026-11-24T21:07:31Z |
| viewer | 53 | 108.4 KiB | 1 | 2026-11-24T21:07:31Z |

## Code exploration subcategories

| Subcategory | Events | Tokens | Share |
|---|---:|---:|---:|
| source_discovery | 354 | 126,141,675 | 54.8% |
| symbol_lookup | 207 | 69,283,924 | 30.1% |
| exploration_other | 46 | 18,407,834 | 8.0% |
| history_investigation | 37 | 11,684,579 | 5.1% |
| change_inspection | 16 | 4,140,138 | 1.8% |
| documentation_lookup | 1 | 610,348 | 0.3% |

Subcategories are deterministic from the tool and operation. A repeated lookup is a diagnostic, not proof of waste.

## Attribution quality

| Dimension | Measure | Coverage | Basis |
|---|---:|---:|---|
| Activity (events) | 1,923 classified / 461 unknown | 80.7% | deterministic rules; Unknown kept explicit |
| Activity (tokens) | 648,275,787 classified / 164,507,421 unknown | 79.8% | provider tokens with derived activity association |
| Model requests | 1,774 classified / 461 unknown | 79.4% | one event per observable message id |
| Tool operations | 2,155 recorded / 262 in Unknown events | 87.8% | provider/client tool records |
| Drupal issue | 283 attributed events | 8.4% | independent of activity; missing issue is not Unknown activity |
| Task (declared) | 0 attributed events | — | declared in tasks.jsonl or carried as explicit task metadata |
| Task ids (non-session) | 149 attributed events | — | CI, Docker and wrapper ids; not declared development tasks |
| Task (session id) | 2,181 events, 812,265,879 tokens | — | a session is not one development task |
| Declared tasks | 1 declared, 1 verified | — | explicit local task records |
| Outcome | 156 success / 1 failure / 2,227 unknown | — | a command result is not a verified outcome |

Request-level sessions: 10; legacy sessions: 0. Uncounted roll-up events: 10. Their token fields are null; they are not added to the totals.

## Task effectiveness

| Task key | Issue | Kind | State | Deliverable | Verified | Sessions | Events | Requests | Tokens | Estimated cost | Data |
|---|---|---|---|---|---|---:|---:|---:|---:|---:|---|
| 464bd7e93db1 | 3619127 | accessibility-evaluation | completed_verified | accessibility-findings | yes | 0 | 0 | — | — | — | unavailable |

Task keys are hashes of local task ids. Descriptions, evidence paths and session names are never published. A completed claim is not a verified outcome.

## Unknown activity by reason

| Reason | Events | Tokens | Model requests | Operations |
|---|---:|---:|---:|---:|
| model_only_request | 231 | 80,996,080 | 231 | 0 |
| compound_command | 138 | 45,415,014 | 138 | 142 |
| ambiguous_activity | 68 | 28,091,160 | 68 | 96 |
| unrecognized_command | 24 | 10,005,167 | 24 | 24 |

Unknown is a measurement gap, not waste or a quality score. Missing issue attribution is reported separately above.

## Prompt and artifact provenance

| Measure | Value |
|---|---:|
| Prompts recorded | 239 |
| Prompt bytes (recorded text) | 493,684 |
| Repeated prompts within a session | 11 |
| Artifact references | 169 |
| Artifacts inspected locally | 0 |
| Capture mode | metadata |

Purpose distribution: short_instruction=114, mixed_content=40, code_review=19, research_request=19, accessibility_evaluation=17, code_modification=12, code_generation=6, documentation_request=5, implementation_specification=3, issue_investigation=3, artifact_analysis=1.

Artifact kinds: source=96, document=41, data=21, image=8, patch=2, log=1. Prompt metadata only by default. Artifact references are not evidence that a model received or read the contents; raw prompt text is opt-in and local.

## Request reconciliation

| Measure | Value |
|---|---:|
| Sessions with request data | 10 |
| Matched / mismatch / unavailable | 10 / 0 / 0 |
| Session tokens | 812,265,879 |
| Request tokens | 812,265,879 |
| Difference | 0 |
| Requests recorded / expected | 2,181 / 2,181 |
| Missing usage | 0 |
| Duplicate usage records collapsed | 2,740 |
| Tool-free requests | 231 |
| Multi-tool requests | 165 |

Provider message id deduplication; a session is counted from request events only when the request sum equals the session sum.

## Exploration diagnostics

| Measure | Value |
|---|---:|
| unique targets | 496 |
| repeated targets | 46 |
| repeated lookups | 76 |
| failed searches | 61 |
| exploration after failure | 32 |
| exploration after edit | 5 |
| loop sequences | 20 |
| code map calls | 27 |
| unique files | 73 |
| result bytes | 4,696,636 |

Repeated lookups are diagnostics, not proof of waste: a file may have changed, a test may have failed, or a new task may need the same evidence. Targets stay local.

## Classification method versions

Classifier: 2.1.0. Accounting versions: direct-event, request-level-v1. Request-level activity is the primary operation of a request when at most one strong activity is present; otherwise it stays Unknown with ambiguous_activity. It is associated with the request context, not proven to have caused every token in it.

## Resource usage by Drupal issue

| Issue | Events | Tasks | Tokens | Model requests | CPU-hours | Duration (h) | Peak memory | Estimated cost | Success / failure |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Unattributed | 2,101 | 28 | 744,513,755 | 2,002 | 0.002 | 0.810 | 355.1 MiB | 196.80 | 122 / 1 |
| 3618230 | 233 | 1 | 68,269,453 | 233 | — | — | — | 40.40 | 0 / 0 |
| 3593502 | 2 | 2 | — | — | — | 0.000 | 7.3 MiB | — | 2 / 0 |
| 3636143 | 4 | 2 | — | — | — | 0.039 | — | — | 4 / 0 |
| 3637163 | 17 | 3 | — | — | — | 0.161 | — | — | 17 / 0 |
| 2942404 | 11 | 3 | — | — | — | 0.105 | — | — | 11 / 0 |
| 3619127 | 16 | 4 | — | — | 0.001 | 0.014 | 354.1 MiB | — | 0 / 0 |

## By model

| Model | Provider | Events | Tokens | Requests | Estimated cost |
|---|---|---:|---:|---:|---:|
| claude-sonnet-5-5 | anthropic | 1,611 | 669,186,177 | 1,611 | $163.63 |
| claude-opus-5-5 | anthropic | 624 | 143,597,031 | 624 | $73.56 |

## By tool

| Tool | Events | Tokens | CPU-hours | Requests | Estimated cost |
|---|---:|---:|---:|---:|---:|
| claude-code | 2,181 | 812,265,879 | — | 2,181 | $235.21 |
| claude-cli | 54 | 517,329 | — | 54 | $1.99 |
| measure-resources | 2 | — | — | — | — |
| github-actions | 100 | — | — | — | — |
| docker | 8 | — | 0.002 | — | — |
| node | 3 | — | 0.000 | — | — |
| ddev-web | 6 | — | 0.000 | — | — |
| ddev-viewer | 3 | — | 0.000 | — | — |
| ddev-chrome | 6 | — | 0.000 | — | — |
| ddev-otel-collector | 6 | — | 0.000 | — | — |
| ddev-router | 3 | — | 0.000 | — | — |
| ddev-ssh-agent | 3 | — | 0.000 | — | — |
| ddev-mutagen | 9 | — | — | — | — |

## Trend

| Date | Events | Tokens | Model requests | CPU-hours | Estimated cost | GitHub hours |
|---|---:|---:|---:|---:|---:|---:|
| 2026-10-02 | 410 | 116,743,804 | 410 | — | $39.44 | — |
| 2026-10-03 | 136 | 101,361,339 | 136 | — | $34.05 | — |
| 2026-10-04 | 61 | 11,398,259 | 61 | — | $3.83 | — |
| 2026-10-05 | 1 | 69,959 | 1 | — | $0.28 | — |
| 2026-10-08 | 55 | 9,491,874 | 55 | — | $3.19 | — |
| 2026-10-14 | 357 | 86,970,523 | 357 | — | $43.86 | — |
| 2026-10-15 | 889 | 394,236,328 | 889 | — | $80.37 | — |
| 2026-10-16 | 328 | 92,511,122 | 326 | — | $32.18 | — |
| 2026-11-17 | 5 | — | — | — | — | 0.043 |
| 2026-11-18 | 13 | — | — | — | — | 0.116 |
| 2026-11-19 | 39 | — | — | — | — | 0.385 |
| 2026-11-20 | 24 | — | — | — | — | 0.222 |
| 2026-11-23 | 30 | — | — | 0.002 | — | 0.178 |
| 2026-11-24 | 36 | — | — | 0.000 | — | — |

## GitHub Actions by workflow

| Workflow | Runs | Jobs | Duration (h) | Success | Failure | Other | Potentially superseded |
|---|---:|---:|---:|---:|---:|---:|---:|
| Lab self-test | 45 | 45 | 0.632 | 43 | 1 | 1 | 1 |
| Check cloud/ is up to date | 45 | 45 | 0.197 | 44 | 0 | 1 | 0 |
| Publish cloud/ to GitHub Pages | 6 | 6 | 0.041 | 6 | 0 | 0 | 0 |
| Weekly issue status | 1 | 1 | 0.027 | 1 | 0 | 0 | 0 |
| npm_and_yarn in /tools/playwright - Update #1716924588 | 1 | 1 | 0.019 | 1 | 0 | 0 | 1 |
| github_actions in /. - Update #1716925396 | 1 | 1 | 0.017 | 1 | 0 | 0 | 0 |
| Build pins check | 1 | 1 | 0.011 | 1 | 0 | 0 | 0 |

“Potentially superseded” is inferred from overlapping runs on the same workflow, branch and trigger; it is not a confirmed waste.

## Data quality

| Metric | Status | Events | Note |
|---|---|---:|---|
| tokens | provider-reported | 2235 | Provider-reported token counts; estimated prompt bytes are kept separate and are never shown as exact tokens. |
| cost | client-reported-estimate | 2235 | Client-reported estimates may reflect subscription allowance, not an invoice. Per-request cost is derived from the session cost-state by token share and is labelled estimated. Missing cost is not zero. |
| cpu | measured | 38 | CPU-seconds are measured by the process wrapper, or derived from sampled container percentages. They are not hardware cycle counts. |
| memory | measured/sampled | 40 | Peak RSS and container peaks are different measurements; PHP peak is per request. |
| github | provider-reported | 100 | Durations and conclusions come from the GitHub API; billable minutes and runner CPU are unavailable. |

Missing values are shown as “—” and are not zero. Sources: claude-transcripts:provider-reported (2181), docker-stats:measured (35), github-actions:provider-reported (100), measure-resources:measured (2), model-eval-trials:provider-reported (54), mutagen-status:measured (9), process-wrapper:measured (3).

## Possible opportunities

### A material share of request context is associated with code exploration

- Priority: **high** · classification: **possible-inefficiency** (derived)
- Measurement: tokens=230268498, share=0.283, unit=share of provider-reported request tokens
- Evidence event ids: 3b5f86961b21, 0195f387ae53, 1d61a5cce9e9, 8381a2a2e5de, fa9335d33fd0, 9a9b7e42a42c, 25bfc6145699, 30aedbd73c84
- Recommendation: When a lookup needs several reads, try `node scripts/code-map.mjs <env|folder> <symbol|file>` once before a grep/sed chain; compare the next comparable session before changing instructions.
- Limitation: Request context is associated with the primary activity, not proven to be caused by it. Complex accessibility work may legitimately need this exploration.

### A material share of request context has no reliable activity classification

- Priority: **high** · classification: **possible-inefficiency** (derived)
- Measurement: tokens=164507421, share=0.202, model_requests=461, reasons=model_only_request:80996080, compound_command:45415014, ambiguous_activity:28091160, unrecognized_command:10005167, unit=share of provider-reported tokens
- Evidence event ids: c0cc699e1f16, 2426f171178a, 73946c80351b, 1e3e06c7e510, 7bb4f96bdc36, 5af3ba38c13a, 7beef850f22b, 2fb0d61bd71e
- Recommendation: Inspect the reason breakdown in the Unknown view. Model-only requests have no tool evidence; unrecognized commands need a registry rule; compound commands need a clearer script or a narrower single-purpose call.
- Limitation: Unknown is not waste. It is a measurement gap and can be reduced only by better evidence, not by relabelling.

### Several sessions start or average a large context

- Priority: **high** · classification: **possible-inefficiency** (derived)
- Measurement: sessions=9, max_start_tokens=81179, max_average_tokens=531038, unit=tokens
- Evidence event ids: 3b5f86961b21, 0195f387ae53, 1d61a5cce9e9, 8381a2a2e5de, fa9335d33fd0, 9a9b7e42a42c, 25bfc6145699, 30aedbd73c84
- Recommendation: Measure the starting context with `node scripts/context-size.mjs` before changing AGENTS.md, skills or memory files. The client re-reads context on every call, so a smaller start can matter more than a single large result.
- Limitation: A large context is not waste by itself; it may carry essential evidence. The existing 2026-10-15 option-C work already reduced AGENTS.md from 8.6k to 2.9k tokens.

### The same environment work appears more than once

- Priority: **medium** · classification: **possible-inefficiency** (derived)
- Measurement: events=250, unit=activity events with the same activity, variant and commit
- Evidence event ids: abaa59d8dff7, e57163c98764, 7ef62aca18a7, f79e4f3d1430, aa4c801f47d5, 64296f787b41, 5b5dac4ca7d5, 57c83fa60bf2
- Recommendation: Check whether the environment was unchanged before re-running Composer, cache rebuild or setup; `setup.mjs` is resumable and `lab-env.mjs status` shows what exists.
- Limitation: An activity label does not prove the work was redundant; a failed or partial build can legitimately need a rerun.

### Some GitHub Actions runs overlap a later run

- Priority: **medium** · classification: **possible-inefficiency** (derived)
- Measurement: runs=2, unit=potentially superseded runs
- Evidence event ids: 6bda34b74c19, 527c66bb3722
- Recommendation: Review whether a push triggered CI that a later push made obsolete. Concurrency groups and a short debounce can reduce this; do not cancel a run that is producing needed evidence.
- Limitation: Overlap is inferred from GitHub timestamps. A run may have been useful despite a later run.

### Some sessions repeat a lookup target

- Priority: **low** · classification: **possible-inefficiency** (derived)
- Measurement: repeated_lookups=76, repeated_targets=46, sessions=10, unit=repeated lookup operations
- Evidence event ids: 3b5f86961b21, 0195f387ae53, 1d61a5cce9e9, 8381a2a2e5de, fa9335d33fd0, 9a9b7e42a42c, 25bfc6145699, 30aedbd73c84
- Recommendation: Check whether the target changed, a test failed, or the second lookup crossed a task boundary. Prefer one `code-map.mjs` call when a symbol must be located and read; do not suppress a necessary re-read after an edit.
- Limitation: The client transcript records the target and order, not the reason. A repeated lookup after a patch or a new revision can be necessary.

## Monitoring overhead and method

This report is generated by deterministic code from the local ledger. The collector's own CPU, memory and duration are recorded as `monitoring` events and shown in the totals; they are not mixed into activity totals. The ledger is append-only, a later snapshot of a growing transcript supersedes the earlier one, and identical immutable events are skipped.

## Limitations

- AI token and cost values are only as complete as the local Claude Code transcripts and recorded model-eval trials. Other agents and API clients are not represented yet.
- Cost is a client-reported estimate (or an estimate where no provider cost exists), not an invoice or subscription statement. Per-request cost is derived from the session estimate by token share. Missing cost is null, never zero.
- Request-level activity is associated with the context processed at that request; it is not proof that the activity caused every token. Legacy session rows use a different method and are not directly comparable.
- Unknown is a measurement gap, not waste. Tool-free requests have no tool-based activity evidence; unrecognized inline code and unsupported clients remain explicitly Unknown.
- Prompt and artifact provenance is metadata-only by default. The effective provider request, hidden instructions and client-added attachments are only partly observable; a reference does not prove ingestion.
- CPU-seconds come from measured processes, or are derived from sampled Docker percentages. They are not hardware cycle counts and do not include host-wide work such as Mutagen, the DDEV router or the OS.
- GitHub Actions duration comes from the API; billable minutes and runner CPU are unavailable. Overlap/supersession is inferred.
- The collector runs on demand; a period with no events is not proof that no work happened.
- Recorded duration is the sum of event spans and may include idle time; it is not active development time.
- This report does not claim that lower resource use means lower energy use or emissions.
- Energy is estimated from a client-reported cost and a published CLEER energy-per-dollar intensity. It is not a measurement, it covers remote inference only, and it claims no conformance with any standard. See docs/CLEER.md.

## Privacy

- public_fields: Aggregates and grouped rows only; no transcript titles, paths, prompts, responses, task descriptions, API keys or account ids. Evidence ids are opaque hashes, and the report timestamp (generated_at) is the only precise time published.
- raw_ledger: Local-only ledger; not committed and not published.
- missing_is_not_zero: true

The public dashboard reads `cloud/resources.json`; it does not call an AI provider. Public data contains aggregates only.
