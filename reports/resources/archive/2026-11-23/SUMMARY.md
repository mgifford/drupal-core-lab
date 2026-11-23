# Resource usage

Generated 2026-11-23T20:23:42.258Z. Period: 2026-10-02 to 2026-11-23. Completeness: **partial**. No AI model was called to produce this report.

## Totals

| Metric | Value | Quality |
|---|---:|---|
| Provider-reported AI tokens | 812,783,208 | provider-reported |
| — uncached input | 4,380 | provider-reported where available |
| — cache creation | 12,858,965 | provider-reported where available |
| — cache read | 796,812,969 | provider-reported where available |
| — output | 2,636,967 | provider-reported where available |
| — reasoning | 1,084,537 | provider-reported where available |
| Estimated prompt tokens (bytes/4, not a tokenizer count) | — | unavailable |
| Model requests | 2,235 | provider-reported |
| Estimated AI cost | $237.19 (estimate) | client-reported-estimate; not an invoice |
| Provider-reported AI cost | — | unavailable |
| Process CPU-seconds | 7.97 | measured |
| CPU-hours | 0.002 h | measured |
| Peak memory | 355.1 MiB | measured/sampled |
| GitHub Actions duration | 0.944 h (100 runs / 100 jobs) | provider-reported |
| Tasks measured | 27 (12 success, 1 failure, 14 unknown) | derived from event outcomes |
| Collection overhead | 0.000 h CPU, 67.8 MiB peak | measured |

## Consumption by activity

| Activity | Events | Tasks | Tokens | Share | Model requests | CPU-hours | Estimated cost |
|---|---:|---:|---:|---:|---:|---:|---:|
| unknown | 9 | 9 | 274,631,430 | 33.8% | 688 | — | $75.68 |
| code-exploration | 9 | 9 | 200,426,180 | 24.7% | 578 | — | $60.46 |
| validation | 101 | 13 | 109,952,202 | 13.5% | 280 | 0.000 | $30.54 |
| issue-intake | 7 | 7 | 70,710,563 | 8.7% | 169 | — | $20.01 |
| patch-development | 8 | 8 | 65,585,998 | 8.1% | 185 | — | $20.17 |
| environment-setup | 10 | 10 | 40,917,862 | 5.0% | 119 | — | $11.77 |
| playwright-testing | 5 | 5 | 23,414,471 | 2.9% | 66 | — | $7.20 |
| documentation-generation | 14 | 9 | 11,336,393 | 1.4% | 33 | 0.000 | $3.43 |
| issue-analysis | 3 | 3 | 7,427,231 | 0.9% | 41 | — | $3.69 |
| infrastructure | 13 | 9 | 5,507,046 | 0.7% | 14 | 0.002 | $1.37 |
| lighthouse-testing | 2 | 2 | 1,460,930 | 0.2% | 4 | — | $0.51 |
| model-evaluation | 54 | 1 | 517,329 | 0.1% | 54 | — | $1.99 |
| accessibility-scanning | 1 | 1 | 364,732 | 0.0% | 2 | — | $0.13 |
| phpunit-execution | 1 | 1 | 314,606 | 0.0% | 1 | — | $0.19 |
| composer-install | 1 | 1 | 216,235 | 0.0% | 1 | — | $0.05 |
| github-actions | 2 | 2 | — | — | — | — | — |
| resource-measurement | 2 | 2 | — | — | — | — | — |

Token shares are derived from tool-call share where a session mixes activities; they are not provider per-tool accounting.

## Resource usage by Drupal issue

| Issue | Events | Tasks | Tokens | Model requests | CPU-hours | Duration (h) | Peak memory | Estimated cost | Success / failure |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Unattributed | 138 | 22 | 744,513,755 | 2,002 | 0.001 | 392.289 | 355.1 MiB | 196.80 | 122 / 1 |
| 3618230 | 1 | 1 | 68,269,453 | 233 | — | 40.845 | — | 40.40 | 0 / 0 |
| 3593502 | 2 | 2 | — | — | — | 0.000 | 7.3 MiB | — | 2 / 0 |
| 3636143 | 4 | 2 | — | — | — | 0.039 | — | — | 4 / 0 |
| 3637163 | 17 | 3 | — | — | — | 0.161 | — | — | 17 / 0 |
| 2942404 | 11 | 3 | — | — | — | 0.105 | — | — | 11 / 0 |
| 3619127 | 4 | 2 | — | — | 0.001 | 0.001 | 354.1 MiB | — | 0 / 0 |

## By model

| Model | Provider | Events | Tokens | Requests | Estimated cost |
|---|---|---:|---:|---:|---:|
| claude-sonnet-5-5 | anthropic | 59 | 669,186,177 | 1,611 | $163.63 |
| claude-opus-5-5 | anthropic | 5 | 143,597,031 | 624 | $73.56 |

## By tool

| Tool | Events | Tokens | CPU-hours | Requests | Estimated cost |
|---|---:|---:|---:|---:|---:|
| claude-code | 10 | 812,265,879 | — | 2,181 | $235.21 |
| claude-cli | 54 | 517,329 | — | 54 | $1.99 |
| measure-resources | 2 | — | — | — | — |
| github-actions | 100 | — | — | — | — |
| docker | 8 | — | 0.002 | — | — |
| node | 3 | — | 0.000 | — | — |

## Trend

| Date | Events | Tokens | Model requests | CPU-hours | Estimated cost | GitHub hours |
|---|---:|---:|---:|---:|---:|---:|
| 2026-10-02 | 2 | 238,995,276 | 662 | — | $80.50 | — |
| 2026-10-05 | 1 | 69,959 | 1 | — | $0.28 | — |
| 2026-10-14 | 2 | 100,518,430 | 388 | — | $51.88 | — |
| 2026-10-15 | 56 | 430,120,942 | 948 | — | $82.85 | — |
| 2026-10-16 | 5 | 43,078,601 | 236 | — | $21.68 | — |
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
| tokens | provider-reported | 64 | Provider-reported token counts; estimated prompt bytes are kept separate and are never shown as exact tokens. |
| cost | client-reported-estimate | 64 | Client-reported estimates may reflect subscription allowance, not an invoice. Missing cost is not zero. |
| cpu | measured | 11 | CPU-seconds are measured by the process wrapper, or derived from sampled container percentages. They are not hardware cycle counts. |
| memory | measured/sampled | 13 | Peak RSS and container peaks are different measurements; PHP peak is per request. |
| github | provider-reported | 100 | Durations and conclusions come from the GitHub API; billable minutes and runner CPU are unavailable. |

Missing values are shown as “—” and are not zero. Sources: claude-transcripts:provider-reported (10), docker-stats:measured (8), github-actions:provider-reported (100), measure-resources:measured (2), model-eval-trials:provider-reported (54), process-wrapper:measured (3).

## Possible opportunities

### A material share of tokens is code exploration

- Priority: **high** · classification: **possible-inefficiency** (derived)
- Measurement: tokens=200426180, share=0.247, unit=share of provider-reported tokens
- Evidence event ids: d34776098da5, 4680b625314f, c537a9c7c0a4, 0dae0f850a84, 62ef30c32ee4, 96f9d3cef97f, a57afc94dd62, edf745d52a8a
- Recommendation: When a lookup needs several reads, try `node scripts/code-map.mjs <env|folder> <symbol|file>` once before a grep/sed chain; measure the next session before changing instructions.
- Limitation: The allocation is derived from tool-call share, not provider per-tool token accounting. Complex accessibility work may legitimately need this exploration.

### Several sessions start or average a large context

- Priority: **high** · classification: **possible-inefficiency** (derived)
- Measurement: sessions=9, max_start_tokens=81179, max_average_tokens=531038, unit=tokens
- Evidence event ids: d34776098da5, 4680b625314f, c537a9c7c0a4, 0dae0f850a84, 62ef30c32ee4, 96f9d3cef97f, a57afc94dd62, edf745d52a8a
- Recommendation: Measure the starting context with `node scripts/context-size.mjs` before changing AGENTS.md, skills or memory files. The client re-reads context on every call, so a smaller start can matter more than a single large result.
- Limitation: A large context is not waste by itself; it may carry essential evidence. The existing 2026-10-15 option-C work already reduced AGENTS.md from 8.6k to 2.9k tokens.

### Some GitHub Actions runs overlap a later run

- Priority: **medium** · classification: **possible-inefficiency** (derived)
- Measurement: runs=2, unit=potentially superseded runs
- Evidence event ids: 6bda34b74c19, 527c66bb3722
- Recommendation: Review whether a push triggered CI that a later push made obsolete. Concurrency groups and a short debounce can reduce this; do not cancel a run that is producing needed evidence.
- Limitation: Overlap is inferred from GitHub timestamps. A run may have been useful despite a later run.

### Some sessions re-read the same file spans

- Priority: **low** · classification: **possible-inefficiency** (derived)
- Measurement: repeated_reads=1, sessions=1, unit=repeated reads
- Evidence event ids: d34776098da5
- Recommendation: Check whether a targeted range or `code-map.mjs` would answer the same question; do not change agent instructions from one session alone.
- Limitation: The client records repeated exact Read ranges; it does not know whether the second read was necessary.

## Monitoring overhead and method

This report is generated by deterministic code from the local ledger. The collector's own CPU, memory and duration are recorded as `monitoring` events and shown in the totals; they are not mixed into activity totals. The ledger is append-only, a later snapshot of a growing transcript supersedes the earlier one, and identical immutable events are skipped.

## Limitations

- AI token and cost values are only as complete as the local Claude Code transcripts and recorded model-eval trials. Other agents and API clients are not represented yet.
- Cost is a client-reported estimate (or an estimate where no provider cost exists), not an invoice or subscription statement. Missing cost is null, never zero.
- CPU-seconds come from measured processes, or are derived from sampled Docker percentages. They are not hardware cycle counts and do not include host-wide work such as Mutagen, the DDEV router or the OS.
- GitHub Actions duration comes from the API; billable minutes and runner CPU are unavailable. Overlap/supersession is inferred.
- The collector runs on demand; a period with no events is not proof that no work happened.
- Recorded duration is the sum of event spans and may include idle time; it is not active development time.
- This report does not claim that lower resource use means lower energy use or emissions.

## Privacy

- public_fields: Aggregates and grouped rows only; no transcript titles, paths, prompts, responses, API keys, account ids or precise work timestamps.
- raw_ledger: Local-only ledger; not committed and not published.
- missing_is_not_zero: true

The public dashboard reads `cloud/resources.json`; it does not call an AI provider. Public data contains aggregates only.
