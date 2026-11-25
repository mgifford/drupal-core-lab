# Phase 1 handoff: CLEER energy estimation (2026-11-24)

**Status: implemented, uncommitted, awaiting review.** No commit, no push. This is Phase 1 of the brief: a tested,
offline, versioned energy estimate for historical AI resource events. It is **not** a complete energy, carbon and
resource framework, and it does not claim to be.

Base revision `d2ba3af` on `infra/resource-audit` (`94b34d0` plus the Mutagen and lab-run work that landed after it).

## 1. Summary of changes

A derived energy estimate is now produced from the existing ledger, without changing any raw event:

- Each counted AI event's client-reported cost is multiplied by a published CLEER energy-per-dollar intensity. CLEER
  publishes no per-token coefficients, so the brief's per-token formula cannot be computed; the cost bridge is the
  documented alternative.
- All 2,235 counted AI events receive an estimate. Coverage is 100% of the cost that the resource report already records.
- The result is **1.68 kWh central** (workload band 1.68–1.73 kWh; CLEER configuration band 1.01–2.35 kWh; the `chat`
  use case would be 3.57 kWh, 2.16× higher).
- Model mappings are explicit best-guess proxies, shown as `unreviewed`, with CLEER's own confidence.
- A per-token coefficient import format and loader exist, tested only with clearly labelled synthetic fixtures.
- The ledger is not written. Energy is derived at report time, so recalculating cannot duplicate consumption and cannot
  alter historical token counts, timestamps or primary measurements.

## 2. Files added and modified

Added:

| File | Purpose |
|---|---|
| `tools/resource/energy/provenance.mjs` | Dataset provenance, checksum verification, fail-closed |
| `tools/resource/energy/cleer.mjs` | Offline dataset loader, CSV parser, ratio lookup |
| `tools/resource/energy/model-mapping.mjs` | Explicit model resolution, no fuzzy matching |
| `tools/resource/energy/mapping.json` | The two proxy mappings and the activity→use-case rule |
| `tools/resource/energy/bridge.mjs` | Deterministic cost-bridge estimate and report |
| `tools/resource/energy/factors.schema.json` | Per-token coefficient import schema (no real data) |
| `tools/resource/energy/factor-loader.mjs` | Coefficient estimator and validation |
| `tools/resource/energy/cleer/*` | Vendored CLEER `data/v1` (verbatim) + `NOTICE.md` + `provenance.json` |
| `scripts/resource-energy.mjs` | `verify`, `report`, `page`, `estimate`, `factors`, `sync` |
| `docs/CLEER.md` | Method, assumptions, licence, gaps |
| `reports/resources/energy-summary.json` | Machine-readable derived report |
| `reports/resources/ENERGY-SUMMARY.md` | Human-readable report |
| `reports/resources/ENERGY-COVERAGE.md` | Coverage and mapping status |
| `cloud/cleer.html` | Static public page describing CLEER and the estimate |
| `tests/lab/resource-energy.test.mjs` | 25 deterministic tests |
| `tests/fixtures/energy/*` | Synthetic factor sets and an expected-totals fixture |

Modified:

| File | Change |
|---|---|
| `tools/resource/events.schema.json` | Version 1.1.0: `schema_version` becomes an enum (`1.0.0`, `1.1.0`); optional `measurements.energy` block. Existing 1.0.0 records still validate. |
| `tools/resource/events.mjs` | `SCHEMA_VERSION` 1.1.0; energy in the public allowlist; `publicEvent` exposes a compact energy summary. |
| `docs/RESOURCE-MONITORING.md` | New "Energy estimation" section; the energy limitation now points to `docs/CLEER.md`. |
| `reports/resources/README.md` | Lists the energy outputs and commands. |
| `RESOURCES.md` | Adds CLEER, with the "not a measurement" caution. |

Deliberately **not** changed: `ledger.mjs`, `aggregate.mjs`, `public.mjs`, `dashboard.html`, `summary.json`,
`SUMMARY.md`, `BASELINE.md`, `baseline.json`, `cloud/resources.*`, `resource-budgets.yml`, existing tests.

## 3. Architecture decisions

1. **Energy is derived, not raw.** It is computed from events and the pinned dataset at report time. The ledger is never
   written, so a coefficient change cannot rewrite history and recalculation cannot duplicate consumption. The
   `computed_at` marker is a value in the report's provenance, `method_version` names the method, and the dataset version
   and checksum name the coefficients.
2. **The event schema still gains an optional `energy` block.** Version 1.1.0 keeps 1.0.0 records valid. Phase 1 does not
   write it into the ledger; it is there for Phase 4 direct measurements and for an optional future materialisation.
3. **The raw/derived boundary is kept by construction, not by convention.** No code path modifies an event.
4. **Two methods are separate.** `cost-bridge` and `coefficient` never merge, average or overwrite each other.

## 4. Methodology decisions and sources

- **Dataset**: Sustainable AI Group CLEER, commit `7fe6be0c76a3d6bbf98f3cb545a05871a6457f8f`, `data/v1`, schema 1.1.0,
  engine `CLEER-Text-0926`, release 2026-09-29. `models.json` SHA-256
  `6235ead80bab89a5472874f1679839e5a833ae06719c440ad5aea1ff58a33f70`, equal to the checksum upstream publishes.
- **Bridge**: `estimated_wh = cost_usd × energy_wh_per_usd`, where the intensity is the published per-session ratio
  (recomputed from `energy_wh.mean ÷ cost_usd` and checked against the CSV's published field for all 306 rows).
- **Uncertainty**: three separate bands (workload tier, CLEER configuration spread at 1.96 sd, use-case sensitivity).
  Never called a confidence interval. Aggregation is correlated: the total band is a sum, not a root-sum-square.
- **Mapping**: explicit only. Proxies are `unreviewed` best guesses with CLEER's confidence (0.75 and 0.467).
- **Sources informing the work**: CLEER technical report and its companion emissions methodology; the existing resource
  monitoring design. No claim of conformance with CLEER, GHG Protocol, SCI or any standard.

## 5. Tests performed and results

- `node --test tests/lab/resource-energy.test.mjs`: **25/25 pass**.
- `node --test tests/lab/*.test.mjs` with default parallelism: 339/341. Two tests that assert "a dry run leaves the
  checkout as it was" race against other test files on the shared working tree. With the repository's own setting
  (`--test-concurrency=1`, used by selftest) all 341 pass. This is a property of those two tests, not of the energy work.
- `node scripts/selftest.mjs` runs the same tests at concurrency 1: **341/341 pass**.
- `node scripts/resource-energy.mjs verify`: dataset checksums and mapping OK, offline.
- `node scripts/resource-energy.mjs report --check`: up to date.
- `node scripts/resource.mjs report --check`: up to date (existing resource report unaffected).
- `node scripts/check-docs.mjs`: 726 references, 0 missing.
- `node scripts/selftest.mjs`: patch-change check fails on a pre-existing changed patch
  (`reports/issues/3636143/branches/3636143-regression-the-toggle.patch`), unrelated to this work and **not** recorded by
  this change. Everything else passes (syntax, 341 lab tests, 157 pack tests, 36 design tests, variants, cloud, skills).

Tests cover: dataset integrity and mismatch; exact/alias/proxy/ambiguous/unsupported matching; uncached/cache-creation/
cache-read/output accounting; reasoning not double-counted; missing category → partial; zero tokens and zero cost stay
zero; missing/negative/allowance cost; null SD → null band; unit conversion Wh/kWh/J; correlated aggregation; the golden
totals fixture; uncounted roll-ups excluded; reproducibility; privacy (`assertPublic`); schema 1.0.0 and 1.1.0; offline
(no `fetch` or URL in the library modules).

## 6. Data quality and coverage

| Measure | Value |
|---|---|
| AI events (denominator) | 2,235 |
| Events with an estimate | 2,235 (100%) |
| Cost covered | $237.19 of $237.19 (100%) |
| Models observed | 2, both proxy, both unreviewed |
| Events unavailable | 0 |
| Period covered by AI events | 2026-10-02 to 2026-10-16 |

The resource report's period is longer (to 2026-11-24) because it also covers process, Docker and GitHub Actions events;
the AI transcripts themselves end on 2026-10-16. The difference is a coverage fact, not a change in consumption.

Local ledger: 5,129 lines, 2,414 valid events, 0 skipped on this branch.

## 7. Known limitations

- The bridge borrows CLEER's token-mix ratio. Our cache-read share is 98% and CLEER's workload cache share is unpublished;
  this is the largest unquantified risk.
- Our cost is a client-reported estimate, not an invoice, and may price tokens differently from CLEER's 2026-09 snapshot.
- The configuration band is a scenario spread, not a confidence interval.
- Both model mappings are unreviewed proxies to a previous point release.
- No carbon, no local/CI energy, no direct measurement.
- The committed `energy-summary.json` is generated from the local ledger, which is not committed; like
  `reports/resources/summary.json`, it cannot be regenerated in CI.

## 8. Privacy considerations

The energy report is an aggregate. It publishes model identifiers, dataset identifiers, costs, estimated energy and
coverage counts. It publishes no prompts, transcripts, session identifiers, task descriptions, evidence references,
paths, hostnames, usernames or credentials. The report is passed through `assertPublic` before it is written. The
dataset URL is deliberately kept out of the public JSON because `public.mjs` forbids a `url` key; it lives in this
document, `docs/CLEER.md` and the notice. The vendored dataset is non-commercial public data, not private telemetry.

## 9. Monitoring overhead

Computing the report took **24.9 ms** from 2,414 ledger events this run; the vendored dataset is **515,167 bytes** on
disk; `energy-summary.json` is **26 KB**. The page is static and makes no network request. No additional container or
service was started for this work, and no AI inference was used to produce any report.

## 10. Reproduction commands

```bash
node scripts/resource-energy.mjs verify
node scripts/resource-energy.mjs report
node scripts/resource-energy.mjs report --check
node scripts/resource-energy.mjs report --write
node scripts/resource-energy.mjs estimate --model=claude-sonnet-5-5 --cost=1.00
node scripts/resource-energy.mjs factors --file=tests/fixtures/energy/factors-synthetic.json
node --test tests/lab/resource-energy.test.mjs
```

## 11. Rollback

Everything is uncommitted. To discard: remove the added files and `git checkout --` the five modified files:

```bash
git checkout -- tools/resource/events.schema.json tools/resource/events.mjs docs/RESOURCE-MONITORING.md reports/resources/README.md RESOURCES.md
rm -rf tools/resource/energy scripts/resource-energy.mjs docs/CLEER.md tests/lab/resource-energy.test.mjs tests/fixtures/energy
rm -f reports/resources/energy-summary.json reports/resources/ENERGY-SUMMARY.md reports/resources/ENERGY-COVERAGE.md cloud/cleer.html
```

Nothing historical is touched, so rollback leaves the resource accounting exactly as it was.

## 12. Remaining work

- Review the two proxy mappings (`mapping.json`) and record a decision. Until then they stay `unreviewed`.
- Phase 2: surface energy in `resources.html`/`summary.json`/`cloud/resources.json` and link `cleer.html` from the
  dashboard nav; validate accessibility with axe and Playwright.
- Phase 3: task attribution and energy per verified outcome.
- Phase 4: infrastructure energy (cgroups, DDEV/Docker lifecycle, direct measurement where available).
- Phase 5: additional adapters (Codex, Copilot, OpenCode, local inference).
- Phase 7: carbon with its own boundary and scenario; observational energy budgets.
- Consider asking upstream for per-token coefficients, the workload token counts, a reasoning dimension and a display-name
  to API-id mapping. Nothing has been filed or sent.

## 13. Resource consumption of this implementation, where available

The work ran on one host with no DDEV instance started and no additional AI agent. The energy report's own overhead is
measured above. The broader resource ledger records the session's model usage; it was not re-collected for this handoff,
so a per-task figure is not claimed here.
