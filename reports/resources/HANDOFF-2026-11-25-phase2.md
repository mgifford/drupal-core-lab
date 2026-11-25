# Phase 2 handoff: dashboard and reporting integration (2026-11-25)

**Status: implemented, uncommitted, awaiting review.** No commit, no push. This builds on
[HANDOFF-2026-11-24-energy.md](HANDOFF-2026-11-24-energy.md) (Phase 1). The energy estimate now appears in the existing
resource report and dashboard; no parallel report or dashboard was created.

Base revision `d2ba3af` on `infra/resource-audit`.

## 1. Summary of changes

- `reports/resources/summary.json` (and `baseline.json`) gain a derived `energy` block, `energy_*` columns on each
  grouped public row, and energy fields on `by_model` and `by_activity`.
- `SUMMARY.md` and `BASELINE.md` gain a compact "Energy estimate" section.
- `cloud/resources.json` and `cloud/resources.html` are rebuilt. The dashboard gains an **Energy estimate** section,
  energy cards in the summary, energy columns in the model and activity tables, a coverage table with denominators, a
  method/boundary/dataset table, and a nav link to `cleer.html`.
- `cloud/cleer.html` is now linked from the dashboard **and** from the public site index. The index link lives in the
  read-only guide panel, so it appears only in the static build and not in the live viewer. The CLEER page's first two
  tables were wrapped in focusable regions and long hashes were allowed to wrap; both fixed real reflow defects found by
  the accessibility run.
- New automated evidence: [dashboard-a11y.json](dashboard-a11y.json) and
  [cleer-page-a11y.json](cleer-page-a11y.json), each with axe results and render timing.

The estimate is unchanged from Phase 1: **1.68 kWh central**, workload band 1.68–1.73 kWh, CLEER configuration band
1.01–2.35 kWh, 2,235 of 2,235 AI events covered, $237.19 of cost covered.

## 2. Files added and modified

Added:

| File | Purpose |
|---|---|
| `tools/playwright/cleer-page.mjs` | axe and structure check for `cleer.html` in seven contexts, including both forced-colours schemes |
| `tools/compare/index.html` | Adds the `cleer.html` link to the static read-only guide panel (modified) |
| `reports/resources/cleer-page-a11y.json` | Its evidence |
| `reports/resources/HANDOFF-2026-11-25-phase2.md` | This handoff |

Modified:

| File | Change |
|---|---|
| `tools/resource/aggregate.mjs` | `publicRows()` accepts an optional per-event energy map and adds energy fields to grouped rows. Default behaviour is unchanged. |
| `tools/resource/energy/bridge.mjs` | `energySummary()` exposes per-event estimates as a **non-enumerable** property, so they enrich rows without being serialised twice. |
| `scripts/resource.mjs` | Composes the energy summary into `summary.json`, merges energy into `by_model`/`by_activity`, adds the Markdown section, strips nested energy timestamps from `--check`. |
| `tools/resource/dashboard.html` | Energy section, cards, tables, method/coverage, nav link. |
| `tools/playwright/resource-dashboard.mjs` | Records JSON size and render timing; no assertion weakened. |
| `scripts/resource-energy.mjs` | Wraps the first two CLEER-page tables in focusable regions; allows long hashes to wrap. |
| `docs/RESOURCE-MONITORING.md`, `docs/CLEER.md`, `reports/resources/README.md` | Document the dashboard integration and the two new evidence files. |
| `reports/resources/summary.json`, `BASELINE.md`, `SUMMARY.md`, `baseline.json`, `cloud/resources.json`, `cloud/resources.html` | Regenerated. |
| `cloud/cleer.html` | Regenerated after the reflow fix. |

## 3. Architecture decisions

1. **One report, one dashboard.** Energy is a derived section of the existing summary and dashboard, not a second
   pipeline. The separate `energy-summary.json` remains for the method detail and the public CLEER page.
2. **Derived at report time, never in the ledger.** `node scripts/resource.mjs report --write` recomputes it from events
   and the pinned dataset. No raw event is modified.
3. **Per-event estimates are not serialised twice.** `energySummary()` attaches them as a non-enumerable `Map`, used to
   build the grouped rows and then dropped by JSON serialisation.
4. **Filters work on energy too.** Because every grouped row carries its energy fields, the existing client-side filters
   update the energy cards and tables with no new network request.
5. **Coverage and method are whole-period.** The coverage and method tables are explicitly labelled "whole period" so a
   filtered view is not mistaken for complete coverage.

## 4. Methodology decisions

Unchanged from Phase 1: a published CLEER `energy_wh_per_usd` intensity multiplied by the client-reported cost, three
separate uncertainty bands, correlated aggregation, explicit proxy mappings. See [../docs/CLEER.md](../docs/CLEER.md).

## 5. Tests performed and results

| Check | Result |
|---|---|
| `node --test --test-concurrency=1 tests/lab/resource-*.test.mjs` | **49/49 pass** (accounting, attribution, energy, dashboard-static) |
| `node tools/playwright/resource-dashboard.mjs` | **6/6 contexts pass**, axe 0, no page errors, filters 299→79→299, no reflow at 320 px or 200% text |
| `node tools/playwright/cleer-page.mjs` | **7/7 contexts pass**, axe 0, no page errors, no off-origin request, no reflow |
| `node scripts/resource-energy.mjs report --check` | up to date |
| `node scripts/resource.mjs report --check` | up to date |
| `node scripts/build-cloud.mjs --check` | cloud/ up to date |
| `node scripts/check-docs.mjs` | 728 references, 0 missing |
| `node scripts/selftest.mjs` | 2 checks fail, both pre-existing and unrelated (see below) |

**Pre-existing selftest failures in this environment:**

1. **`patch changes recorded`** — `reports/issues/3636143/branches/3636143-regression-the-toggle.patch` changed in commit
   `86f15bd`, before this work, with no `patch-change.mjs record`. I did not record it, because it is not my change.
2. **`cloud-origins.test.mjs`** — 3 of its 6 subtests fail because a DDEV router is running (`ddev-drupal-compare-web`).
   The proxy forwards its own hostname to the router, which answers **404**, while the test accepts only 200 or 502 ("Not
   built"). The manual check confirms the Host gate passes (no 403); only the expected status is wrong for this
   environment. The test passes with DDEV stopped. I did not stop any environment: it may belong to another session.

`HANDOFF-2026-11-24-energy.md`'s note about two "clean checkout" tests failing under default parallelism still applies;
at `--test-concurrency=1` they pass.

## 6. Data quality and coverage

Unchanged: 2,235 counted AI events, all estimated, $237.19 covered, two proxy models, both unreviewed. Grouped public
rows: 299. `summary.json` and `cloud/resources.json` are 535,597 bytes (up from 399,451), of which 18,785 bytes compact is
the energy block and the rest is the per-row energy fields.

## 7. Known limitations

- The cost bridge's token-mix assumption remains unverified; our cache-read share is extreme and CLEER's is unpublished.
- Both model mappings are unreviewed proxies to a previous point release.
- Energy is remote inference only: no local DDEV/PHP/Database/Chromium/Composer/PHPUnit, no CI, no carbon, no direct
  measurement.
- The dashboard's energy totals follow the filters, but the coverage and method tables are whole-period and say so.
- The committed reports cannot be regenerated in CI from the local ledger, as with the existing resource summary.

## 8. Privacy considerations

The composed `summary.json` is passed through `assertPublic` before it is written, and `build-cloud.mjs` checks it again
before publishing. The dashboard's new fields are models, dataset identifiers, costs, energy and counts; no prompts,
transcripts, session identifiers, task descriptions, evidence references, paths, hosts, usernames or credentials. The
CLEER page makes no off-origin request (verified by the accessibility run). The dataset URL is kept out of the public JSON
because `public.mjs` forbids a `url` key.

## 9. Monitoring overhead

| Measure | Value |
|---|---|
| `resources.json` size | 535,597 bytes |
| Fetch time (local static server) | 1–2 ms |
| DOMContentLoaded | 6–14 ms |
| Energy computation | ~25 ms for 2,414 ledger events |
| New network requests | 0 (the page still reads only `resources.json`) |
| New dependencies | 0 |

The JSON grew by about 136 KB, mostly the per-row energy fields. That is the cost of making the filters update energy; if
it becomes a problem, the fields can be dropped from non-AI rows or the block can be served separately.

## 10. Reproduction commands

```bash
node scripts/resource-energy.mjs verify
node scripts/resource-energy.mjs report --write
node scripts/resource.mjs report --write --baseline
node scripts/build-cloud.mjs
node scripts/resource.mjs report --check
node scripts/resource-energy.mjs report --check
node scripts/build-cloud.mjs --check
node tools/playwright/resource-dashboard.mjs --json=reports/resources/dashboard-a11y.json
node tools/playwright/cleer-page.mjs --json=reports/resources/cleer-page-a11y.json
node --test --test-concurrency=1 tests/lab/resource-*.test.mjs
```

## 11. Rollback

All changes are uncommitted. To revert Phase 2 only, restore the generated and modified files from `HEAD`:

```bash
git checkout -- tools/resource/aggregate.mjs tools/resource/energy/bridge.mjs scripts/resource.mjs tools/resource/dashboard.html \
  tools/playwright/resource-dashboard.mjs scripts/resource-energy.mjs docs/RESOURCE-MONITORING.md docs/CLEER.md \
  reports/resources/README.md reports/resources/summary.json reports/resources/baseline.json reports/resources/SUMMARY.md \
  reports/resources/BASELINE.md reports/resources/dashboard-a11y.json cloud/resources.json cloud/resources.html cloud/cleer.html
rm -f tools/playwright/cleer-page.mjs reports/resources/cleer-page-a11y.json reports/resources/HANDOFF-2026-11-25-phase2.md
```

This also discards Phase 1 if `HEAD` is the pre-Phase-1 commit; roll back Phase 1 first with the commands in its handoff
if only Phase 2 should be removed.

## 12. Remaining work

- Review the two proxy mappings. They remain `unreviewed`.
- Phase 3: task attribution and energy per verified outcome. The dashboard can then show energy per verified deliverable.
- Phase 4: local and CI infrastructure energy (cgroups, DDEV/Docker lifecycle, direct measurement where available).
- Phase 5: additional adapters.
- Phase 7: carbon with its own boundary and scenario; observational energy budgets.
- Review the new public links after the owner has seen the pages.
- Consider asking upstream for per-token coefficients, workload token counts, a reasoning dimension and an API-id
  mapping. Nothing has been sent.

## 13. Resource consumption of this implementation

One host, no DDEV started or stopped, no additional AI agent. The browser runs for the two accessibility checks are
bounded and recorded above. The report's own energy computation overhead is measured separately from the workloads it
describes.
