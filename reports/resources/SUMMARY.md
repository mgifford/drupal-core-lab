# Resource usage

Generated 2026-11-24T01:23:00.453Z. Period: 2026-10-02 to 2026-11-23. Completeness: **partial**. No AI model was called to produce this report.

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
| Process CPU-seconds | 7.97 | measured |
| CPU-hours | 0.002 h | measured |
| Peak memory | 355.1 MiB | measured/sampled |
| GitHub Actions duration | 0.944 h (100 runs / 100 jobs) | provider-reported |
| Tasks measured | 27 (12 success, 1 failure, 14 unknown) | derived from event outcomes |
| Collection overhead | 0.002 h CPU, 162.5 MiB peak | measured |

## Consumption by activity

| Activity | Events | Tasks | Tokens | Share | Model requests | CPU-hours | Estimated cost | Method |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| patch-development | 593 | 9 | 259,599,082 | 31.9% | 593 | — | $70.11 | request-level-v1 |
| code-exploration | 673 | 9 | 237,103,821 | 29.2% | 673 | — | $66.37 | request-level-v1 |
| unknown | 392 | 9 | 135,999,107 | 16.7% | 392 | — | $43.82 | request-level-v1 |
| environment-setup | 256 | 11 | 79,624,158 | 9.8% | 255 | — | $26.37 | legacy-session-v1, request-level-v1 |
| validation | 166 | 11 | 30,067,507 | 3.7% | 74 | 0.000 | $8.12 | legacy-session-v1, request-level-v1 |
| issue-intake | 71 | 7 | 29,681,226 | 3.7% | 70 | — | $8.84 | legacy-session-v1, request-level-v1 |
| infrastructure | 40 | 11 | 13,529,402 | 1.7% | 32 | 0.002 | $3.12 | legacy-session-v1, request-level-v1 |
| playwright-testing | 29 | 5 | 8,907,219 | 1.1% | 29 | — | $2.37 | request-level-v1 |
| issue-analysis | 38 | 6 | 7,901,196 | 1.0% | 38 | — | $3.54 | request-level-v1 |
| model-evaluation | 59 | 2 | 3,503,654 | 0.4% | 59 | — | $2.54 | legacy-session-v1, request-level-v1 |
| github-actions | 7 | 5 | 2,399,065 | 0.3% | 5 | — | $0.60 | legacy-session-v1, request-level-v1 |
| phpunit-execution | 7 | 2 | 1,713,625 | 0.2% | 7 | — | $0.64 | request-level-v1 |
| resource-measurement | 5 | 4 | 1,241,616 | 0.2% | 3 | — | $0.40 | legacy-session-v1, request-level-v1 |
| documentation-generation | 10 | 5 | 1,183,994 | 0.1% | 3 | 0.000 | $0.29 | legacy-session-v1, request-level-v1 |
| composer-install | 2 | 1 | 328,536 | 0.0% | 2 | — | $0.07 | request-level-v1 |

Rows mix two accounting methods: request-level activity where a transcript reconciles, and the older session tool-call-share allocation for historical records. The method column above names them per activity; the dashboard keeps them distinguishable. Request-level activity is associated with the request context and is not proof that the activity caused every token in it.

## Code exploration subcategories

| Subcategory | Events | Tokens | Share |
|---|---:|---:|---:|
| source_discovery | 360 | 130,544,003 | 55.1% |
| symbol_lookup | 209 | 69,613,228 | 29.4% |
| exploration_other | 46 | 18,407,834 | 7.8% |
| history_investigation | 40 | 13,042,409 | 5.5% |
| change_inspection | 17 | 4,885,999 | 2.1% |
| documentation_lookup | 1 | 610,348 | 0.3% |

Subcategories are deterministic from the tool and operation. A repeated lookup is a diagnostic, not proof of waste.

## Attribution quality

| Dimension | Measure | Coverage | Basis |
|---|---:|---:|---|
| Activity (events) | 1,956 classified / 392 unknown | 83.3% | deterministic rules; Unknown kept explicit |
| Activity (tokens) | 676,784,101 classified / 135,999,107 unknown | 83.3% | provider tokens with derived activity association |
| Model requests | 1,843 classified / 392 unknown | 82.5% | one event per observable message id |
| Tool operations | 2,155 recorded / 164 in Unknown events | 92.4% | provider/client tool records |
| Drupal issue | 271 attributed events | 8.4% | independent of activity; missing issue is not Unknown activity |
| Task (explicit) | 113 attributed events | — | explicit task metadata; session task ids are reported separately |
| Task (session id) | 2,181 events, 812,265,879 tokens | — | a session is not one development task |
| Declared tasks | 1 declared, 1 verified | — | explicit local task records |
| Outcome | 156 success / 1 failure / 2,191 unknown | — | a command result is not a verified outcome |

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
| compound_command | 137 | 44,997,860 | 137 | 140 |
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
| unique targets | 502 |
| repeated targets | 49 |
| repeated lookups | 82 |
| failed searches | 61 |
| exploration after failure | 32 |
| exploration after edit | 5 |
| loop sequences | 21 |
| code map calls | 27 |
| unique files | 73 |
| result bytes | 4,696,636 |

Repeated lookups are diagnostics, not proof of waste: a file may have changed, a test may have failed, or a new task may need the same evidence. Targets stay local.

## Classification method versions

Classifier: 2.0.0. Accounting versions: legacy-session-v1, request-level-v1. Request-level activity is the primary operation of a request. It is associated with the request context, not proven to have caused every token in it.

## Resource usage by Drupal issue

| Issue | Events | Tasks | Tokens | Model requests | CPU-hours | Duration (h) | Peak memory | Estimated cost | Success / failure |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Unattributed | 2,077 | 22 | 744,513,755 | 2,002 | 0.001 | 0.784 | 355.1 MiB | 196.80 | 122 / 1 |
| 3618230 | 233 | 1 | 68,269,453 | 233 | — | — | — | 40.40 | 0 / 0 |
| 3593502 | 2 | 2 | — | — | — | 0.000 | 7.3 MiB | — | 2 / 0 |
| 3636143 | 4 | 2 | — | — | — | 0.039 | — | — | 4 / 0 |
| 3637163 | 17 | 3 | — | — | — | 0.161 | — | — | 17 / 0 |
| 2942404 | 11 | 3 | — | — | — | 0.105 | — | — | 11 / 0 |
| 3619127 | 4 | 2 | — | — | 0.001 | 0.001 | 354.1 MiB | — | 0 / 0 |

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
| cpu | measured | 11 | CPU-seconds are measured by the process wrapper, or derived from sampled container percentages. They are not hardware cycle counts. |
| memory | measured/sampled | 13 | Peak RSS and container peaks are different measurements; PHP peak is per request. |
| github | provider-reported | 100 | Durations and conclusions come from the GitHub API; billable minutes and runner CPU are unavailable. |

Missing values are shown as “—” and are not zero. Sources: claude-transcripts:provider-reported (2181), docker-stats:measured (8), github-actions:provider-reported (100), measure-resources:measured (2), model-eval-trials:provider-reported (54), process-wrapper:measured (3).

## Possible opportunities

### A material share of request context is associated with code exploration

- Priority: **high** · classification: **possible-inefficiency** (derived)
- Measurement: tokens=237103821, share=0.292, unit=share of provider-reported request tokens
- Evidence event ids: ec05969d5665, fd52861ac025, 3df48d071623, 7fb267003967, e97b4c0ce9cc, 7beacec31700, 0ec0ebd2b8f8, e0a56a86f13d
- Recommendation: When a lookup needs several reads, try `node scripts/code-map.mjs <env|folder> <symbol|file>` once before a grep/sed chain; compare the next comparable session before changing instructions.
- Limitation: Request context is associated with the primary activity, not proven to be caused by it. Complex accessibility work may legitimately need this exploration.

### A material share of request context has no reliable activity classification

- Priority: **high** · classification: **possible-inefficiency** (derived)
- Measurement: tokens=135999107, share=0.167, model_requests=392, reasons=model_only_request:80996080, compound_command:44997860, unrecognized_command:10005167, unit=share of provider-reported tokens
- Evidence event ids: d386045294ac, 877f7f1a8cad, b1c04b92e8ad, 4147b8f5cdb4, 7e10f13effba, 891a7d35b0d2, 61088471a800, aa0279ba24a9
- Recommendation: Inspect the reason breakdown in the Unknown view. Model-only requests have no tool evidence; unrecognized commands need a registry rule; compound commands need a clearer script or a narrower single-purpose call.
- Limitation: Unknown is not waste. It is a measurement gap and can be reduced only by better evidence, not by relabelling.

### Several sessions start or average a large context

- Priority: **high** · classification: **possible-inefficiency** (derived)
- Measurement: sessions=9, max_start_tokens=81179, max_average_tokens=531038, unit=tokens
- Evidence event ids: ec05969d5665, fd52861ac025, 3df48d071623, 7fb267003967, e97b4c0ce9cc, 7beacec31700, 0ec0ebd2b8f8, e0a56a86f13d
- Recommendation: Measure the starting context with `node scripts/context-size.mjs` before changing AGENTS.md, skills or memory files. The client re-reads context on every call, so a smaller start can matter more than a single large result.
- Limitation: A large context is not waste by itself; it may carry essential evidence. The existing 2026-10-15 option-C work already reduced AGENTS.md from 8.6k to 2.9k tokens.

### The same environment work appears more than once

- Priority: **medium** · classification: **possible-inefficiency** (derived)
- Measurement: events=258, unit=activity events with the same activity, variant and commit
- Evidence event ids: df6f567febc4, ab6343e4c881, 13945756f7a3, 852e2ed49df3, 030f63f7fdab, e238da6eac5f, 20f66e053674, 573fe6c39c66
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
- Measurement: repeated_lookups=82, repeated_targets=49, sessions=10, unit=repeated lookup operations
- Evidence event ids: ec05969d5665, fd52861ac025, 3df48d071623, 7fb267003967, e97b4c0ce9cc, 7beacec31700, 0ec0ebd2b8f8, e0a56a86f13d
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

## Privacy

- public_fields: Aggregates and grouped rows only; no transcript titles, paths, prompts, responses, task descriptions, evidence references, API keys, account ids or precise work timestamps.
- raw_ledger: Local-only ledger; not committed and not published.
- missing_is_not_zero: true

The public dashboard reads `cloud/resources.json`; it does not call an AI provider. Public data contains aggregates only.
