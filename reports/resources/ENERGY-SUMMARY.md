# Energy estimate

Generated 2026-11-25T11:55:55Z. Period: 2026-10-02 to 2026-10-16. Method **cost-bridge-v1** (CLEER cost bridge). No AI model was called to produce this report.

This is an **estimate**, not a measurement. It multiplies each AI event's client-reported cost by a published CLEER energy-per-dollar intensity. CLEER publishes no per-token coefficients; its token counts per workload are withheld. Read the limitations before quoting a number.

## Headline

| Metric | Value | Basis |
|---|---:|---|
| Remote inference energy (central) | 1.68 kWh | estimated, cost-bridge |
| Workload-tier band | 1.68 kWh – 1.73 kWh | published intensity across the three tiers of the use case |
| CLEER configuration band | 1.01 kWh – 2.35 kWh | 1.96 × the published per-session relative standard deviation; a scenario spread, not a confidence interval |
| AI events covered | 2,235 of 2,235 (100.0%) | counted AI events carrying a model |
| Cost covered | $237.19 of $237.19 (100.0%) | client-reported estimate, not an invoice |
| Boundary | facility-inference (accelerator + host + idle + cooling) | facility energy in CLEER's published scenario |
| Dataset | CLEER-Text-0926/1.1.0 (2026-09-29) | CC BY-NC 4.0 |
| Dataset pin | `7fe6be0c76a3…` | checksum `6235ead80bab…` |

## Use-case sensitivity

What the same measured spend would imply under each use case. These are alternatives, not a range. The use case is configured per activity in mapping.json.

| Use case | Central | Events covered |
|---|---:|---:|
| chat | 3.57 kWh | 2,235 |
| agentic | 1.66 kWh | 2,235 |

Choosing chat instead of agentic would change the headline by **2.16×**. The use case is configured per activity, not inferred.

## By model

| Model | Dataset model | Match | Review | Confidence | Requests | Cost | Energy (central) | Workload band |
|---|---|---|---|---:|---:|---:|---:|---:|
| claude-sonnet-5-5 | Claude Sonnet 5 | proxy | unreviewed | 0.750 | 1,611 | $163.63 | 1.35 kWh | 1.35 kWh–1.39 kWh |
| claude-opus-5-5 | Claude Opus 5 | proxy | unreviewed | 0.467 | 624 | $73.56 | 325.9 Wh | 325.9 Wh–341.3 Wh |

CLEER confidence is the dataset's own proxy-match score (0–1), not the probability that the estimate is correct. An "unreviewed" proxy is a labelled best guess.

## By activity

| Activity | Requests | Cost | Energy (central) | Estimated / unavailable |
|---|---:|---:|---:|---:|
| patch-development | 564 | $66.79 | 489.9 Wh | 564 / 0 |
| code-exploration | 661 | $64.53 | 446.5 Wh | 661 / 0 |
| unknown | 461 | $53.11 | 356.5 Wh | 461 / 0 |
| environment-setup | 247 | $24.85 | 175.5 Wh | 247 / 0 |
| issue-intake | 62 | $7.88 | 52.1 Wh | 62 / 0 |
| validation | 65 | $6.82 | 48.0 Wh | 65 / 0 |
| model-evaluation | 59 | $2.54 | 41.1 Wh | 59 / 0 |
| infrastructure | 32 | $3.12 | 22.8 Wh | 32 / 0 |
| issue-analysis | 38 | $3.54 | 16.8 Wh | 38 / 0 |
| playwright-testing | 27 | $2.12 | 16.8 Wh | 27 / 0 |
| github-actions | 5 | $0.60 | 4.2 Wh | 5 / 0 |
| phpunit-execution | 7 | $0.64 | 3.7 Wh | 7 / 0 |
| resource-measurement | 3 | $0.40 | 2.3 Wh | 3 / 0 |
| documentation-generation | 2 | $0.20 | 1.4 Wh | 2 / 0 |
| composer-install | 2 | $0.07 | 0.595 Wh | 2 / 0 |

Activity association is not causation, and energy here follows cost, not activity. A request's cost covers its whole context.

## By Drupal issue

| Issue | Requests | Cost | Energy (central) |
|---|---:|---:|---:|
| unattributed | 2,002 | $196.80 | 1.50 kWh |
| 3618230 | 233 | $40.40 | 179.0 Wh |

## Daily trend

| Date | Events | Cost | Energy (central) |
|---|---:|---:|---:|
| 2026-10-02 | 410 | $39.44 | 321.0 Wh |
| 2026-10-03 | 136 | $34.05 | 277.2 Wh |
| 2026-10-04 | 61 | $3.83 | 31.2 Wh |
| 2026-10-05 | 1 | $0.28 | 2.3 Wh |
| 2026-10-08 | 55 | $3.19 | 26.0 Wh |
| 2026-10-14 | 357 | $43.86 | 194.3 Wh |
| 2026-10-15 | 889 | $80.37 | 649.1 Wh |
| 2026-10-16 | 326 | $32.18 | 177.4 Wh |

A day with no events is not proof that no work happened; collection is on demand.

## Published CLEER reference

These are CLEER's own published figures for the models this repository maps to. They are **not** an estimate of this repository's usage.

| Dataset model | Workload | Wh per session (mean) | SD | Wh per USD | Cost per session |
|---|---|---:|---:|---:|---:|
| Claude Sonnet 5 | chat.light | 0.24 | 0.05 | 15.57 | $0.02 |
| Claude Sonnet 5 | chat.typical | 0.83 | 0.16 | 16.20 | $0.05 |
| Claude Sonnet 5 | chat.heavy | 8.02 | 1.59 | 15.23 | $0.53 |
| Claude Sonnet 5 | agentic.light | 15.1 | 3.1 | 8.35 | $1.81 |
| Claude Sonnet 5 | agentic.typical | 31.69 | 6.51 | 8.14 | $3.89 |
| Claude Sonnet 5 | agentic.heavy | 120.14 | 24.65 | 8.33 | $14.42 |
| Claude Opus 5 | chat.light | 0.46 | 0.09 | 11.92 | $0.04 |
| Claude Opus 5 | chat.typical | 1.61 | 0.31 | 12.55 | $0.13 |
| Claude Opus 5 | chat.heavy | 15.25 | 2.92 | 11.58 | $1.32 |
| Claude Opus 5 | agentic.light | 20.99 | 4.07 | 4.64 | $4.52 |
| Claude Opus 5 | agentic.typical | 43.14 | 8.37 | 4.43 | $9.73 |
| Claude Opus 5 | agentic.heavy | 166.7 | 32.33 | 4.62 | $36.05 |

Source: Sustainable AI Group, CLEER Dataset, CLEER-Text-0926/1.1.0, release 2026-09-29, commit `7fe6be0c76a3d6bbf98f3cb545a05871a6457f8f`. Licensed CC BY-NC 4.0; non-commercial use with attribution. See [docs/CLEER.md](../docs/CLEER.md) and [the notice](../tools/resource/energy/cleer/NOTICE.md).

## Coverage

| Measure | Value | Denominator |
|---|---:|---|
| AI events estimated | 2,235 | 2,235 (counted AI events (ai-request and counted ai-usage) that carry a model identifier) |
| AI events unavailable | 0 | 2,235 |
| Models observed | 2 | — |
| Models mapped (exact) | 0 | 2 |
| Models mapped (proxy) | 2 | 2 |
| Proxies unreviewed | 2 | 2 |

## Limitations

- Estimated, not measured. The figure is a published CLEER energy-per-dollar intensity multiplied by a client-reported cost.
- CLEER publishes no per-token coefficients; the token counts behind its workloads are withheld. This project does not reconstruct them.
- CLEER's workload is a fixed token mix; our request mix may differ. Our cache-read share is very high, and CLEER's workload cache share is unpublished.
- Cost is a client-reported estimate, not an invoice or subscription statement, and may price tokens differently from CLEER's Artificial Analysis snapshot.
- One ratio per model drives every request, so the aggregate uncertainty is correlated and does not narrow with more requests.
- The bridge and any future per-token coefficient method are shown separately and are never merged.

Monitoring overhead: 24.97 ms to compute this report from 2,414 ledger events; dataset 515,167 bytes on disk.

The dashboard reads only static files. This report required no AI inference.
