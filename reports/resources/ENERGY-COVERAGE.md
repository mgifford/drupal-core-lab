# Energy estimation coverage

Generated 2026-11-25T11:55:55Z. Method **cost-bridge-v1**.

## Denominator

counted AI events (ai-request and counted ai-usage) that carry a model identifier. A request is counted once; a reconciled session roll-up is excluded, so no request is estimated twice.

## Counts

| Measure | Absolute | Share | Denominator |
|---|---:|---:|---|
| AI events | 2,235 | 100.0% | itself |
| Estimated | 2,235 | 100.0% | 2,235 AI events |
| Unavailable | 0 | 0.0% | 2,235 AI events |
| Cost covered | $237.19 | 100.0% | $237.19 client-estimated cost |

## Per-model mapping

| Input model | Data model | Match | Review | CLEER confidence | Estimated | Unavailable | Cost |
|---|---|---|---|---:|---:|---:|---:|
| claude-sonnet-5-5 | Claude Sonnet 5 | proxy | unreviewed | 0.750 | 1,611 | 0 | $163.63 |
| claude-opus-5-5 | Claude Opus 5 | proxy | unreviewed | 0.467 | 624 | 0 | $73.56 |

## Unavailable reasons

None.

## What is not covered

- Per-token coefficients: CLEER publishes none, and this project does not reconstruct them.
- Direct measurement of provider infrastructure: unavailable from outside the provider.
- Local and CI energy: not part of this phase. The resource report measures CPU-seconds and GitHub Actions time separately.
- Carbon: not part of this phase. CLEER publishes carbon per session; it will be added with its own boundary and scenario.
