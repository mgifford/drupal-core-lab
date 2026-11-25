# CLEER energy estimation

This page explains how Drupal Core Lab estimates the remote inference energy of its AI-assisted work, what the estimate
does and does not mean, and where its data comes from. The generated numbers are in
[reports/resources/ENERGY-SUMMARY.md](../reports/resources/ENERGY-SUMMARY.md) and
[cloud/cleer.html](../cloud/cleer.html). The resource dashboard's Energy section summarises the same numbers and links
to this page.

**This is an estimate, not a measurement.** It is one order of magnitude, under one published scenario, from outside the
provider. It is not an invoice, not a compliance report, and not a claim of conformance with any standard.

## What CLEER is

[CLEER](https://github.com/sustainableaigroup/CLEER) (Closed-model Latent Energy Estimation Range) is a methodology from
[Sustainable AI Group](https://sustainableaigroup.com/) for estimating the accelerator energy of closed-model inference.
It benchmarks about twenty open models, maps each closed model to its five nearest open "donors" by architecture, projects
the donor's power and throughput at the batch size implied by the closed model's published latency, and distributes the
weighted proxies into energy per input (cached and uncached) and output token, as a mean and a standard deviation.

The technical report is version `CLEER-Text-0926` (29 September 2026). Its companion,
[Closed AI Emissions Calculation](https://reports.sustainableaigroup.com/ai-emissions/) (`CAIEC-0926`), extends accelerator
energy to facility energy and greenhouse-gas emissions. This project uses the facility-level figures the CLEER dataset
publishes, which already include host, idle and cooling components.

## What the public dataset publishes, and what it withholds

The machine-readable dataset is at `data/v1/` in the upstream repository. It carries **resolved per-session figures only**:

- six fixed workloads: `chat` and `agentic`, each `light`, `typical` and `heavy`;
- per model and workload: `energy_wh.mean`, `energy_wh.sd`, `carbon_gco2e.mean`, `carbon_gco2e.sd`, `cost_usd`;
- component breakdowns: energy `accelerator + host + idle + cooling`; carbon `operational + embodied + construction`;
- proxy donors and weights, an estimation basis, and a confidence score (0–1).

**Per-token energy intensities are deliberately not published.** Upstream's data build script contains an IP guard
that fails its build if any per-token field appears, and the token counts behind each workload are also withheld. The
per-token figures exist inside the methodology; they are not in the public data.

This project therefore **does not reconstruct or guess per-token coefficients**. Doing so would be fabrication, and it is
exactly what the upstream guard is designed to prevent.

The CSV additionally publishes `energy_wh_per_usd`, the ratio of per-session energy to per-session cost. That published
field is the basis of the estimate described below.

## The cost bridge

Every AI resource event carries a client-reported cost. CLEER publishes energy per dollar. Multiplying them gives an
energy estimate without needing the withheld coefficients:

```
estimated_wh(event) = event_cost_usd × energy_wh_per_usd(model, use_case, tier)
```

For example, a US$1.00 request to a model mapped to `Claude Sonnet 5` under the `agentic.typical` workload gives
`1.00 × 8.14 = 8.14 Wh`.

### Why this is a reasonable bridge, and where it breaks

The ratio `energy ÷ cost` is, algebraically, `(Σ energy-per-token × tokens) ÷ (Σ price-per-token × tokens)`. It transfers
from CLEER's workload to our request when the token-category mix is similar, because both energy and price scale with
the same mix.

Evidence that the ratio is usable:

| Check | Result |
|---|---|
| Published `energy_wh_per_usd` equals `energy_wh.mean ÷ cost_usd` | 306 of 306 rows agree to two decimal places |
| Spread of the ratio across the three tiers of one use case | median 4.45%, maximum 10.10% across the 35 closed models |
| Difference between `chat` and `agentic` | about 2.1×, so the use case must be chosen deliberately |

The bridge handles cache because it never touches token categories: a cache read is cheap in the client's cost model and
cheap in CLEER's energy model (CLEER uses about a 10% price ratio for cached input), so the ratio stays roughly stable for
a cache-heavy workload. Our cache-read share is 98% of tokens, which is extreme; CLEER's workload cache share is not
published, so this is the largest unquantified risk.

Where it breaks:

- **Mix mismatch.** If our input/output/output-vs-cache proportion differs from CLEER's workload, the ratio shifts. Not
  verifiable from published data.
- **Cost basis.** Our cost is a client-reported estimate, not an invoice, and may price tokens differently from CLEER's
  Artificial Analysis snapshot (2026-09). A subscription allowance is refused outright.
- **Configuration.** CLEER's figure is for a deployment configuration; its standard deviation is a spread over plausible
  configurations, not measurement noise.

## Model mapping

CLEER uses display names, with no mapping to API model identifiers. A lab model gets a dataset model only through:

1. an exact normalized-name match, or
2. an explicit entry in [`tools/resource/energy/mapping.json`](../tools/resource/energy/mapping.json).

There is no fuzzy matching. Anything else is `unsupported`, and its energy is `unavailable` — the tokens and cost are
still counted by the resource report.

A proxy is a documented best guess. It carries `match_type: "proxy"`, a `review_status`, a rationale, and CLEER's own
confidence score. It is never described as measured.

The current mappings are both proxies and both unreviewed:

| Lab model | CLEER model | CLEER confidence | Why |
|---|---|---:|---|
| `claude-sonnet-5-5` | `Claude Sonnet 5` | 0.75 | CLEER has no 5.5 entry; the current point release is the nearest published model |
| `claude-opus-5-5` | `Claude Opus 5` | 0.467 | Same; CLEER's own confidence is low |

CLEER confidence is the dataset's proxy-match score. It is not the probability that the estimate is correct.

To review a mapping, edit `mapping.json`, set `review_status` to `reviewed`, add `reviewed_by` and `reviewed_at`, and
record the reason. The report picks the change up on the next run and shows the new status.

## Uncertainty

Three numbers are reported separately and are never merged:

| Band | What it is | How |
|---|---|---|
| Workload tier | The published intensity varies across `light`, `typical` and `heavy` | min and max of `energy_wh_per_usd` across the three tiers |
| Configuration | CLEER's own spread over deployment configurations | central × (1 ± 1.96 × sd ÷ mean) |
| Use case | `chat` instead of `agentic` | the same spend recomputed under the other use case |

The configuration band is a **scenario spread, not a confidence interval**. CLEER's standard deviation is a dispersion
over plausible configurations produced by a Monte Carlo simulation, not sampling error about a true value.

Aggregation is **correlated**: one ratio per model drives every request, so the total band is the sum of the per-request
bands, not a root-sum-square. It does not narrow as more requests are added.

## Two methods, never merged

| Method | Availability | Basis |
|---|---|---|
| `cost-bridge` | Available now for every cost-bearing AI event | published `energy_wh_per_usd` |
| `coefficient` | No real dataset; synthetic fixtures only | a per-token coefficient set imported locally |

The import format is [`factors.schema.json`](../tools/resource/energy/factors.schema.json). It supports separate
uncached-input, cache-creation, cache-read and output coefficients, lower/central/upper values, declared units, an
uncertainty semantics field and a `synthetic` flag. A synthetic estimate is labelled synthetic and must never be
presented as real.

If a real per-token dataset ever becomes available, the two methods will be shown side by side with their difference.
Neither replaces the other silently.

## What this project does not claim

- That the estimate is a measurement.
- That it conforms to CLEER, CAIEC, the GHG Protocol, the Green Software Foundation SCI specification, or any other
  standard. Those methodologies informed the work; conformance has not been assessed.
- That it covers local DDEV containers, PHP, the database, Chromium, Composer, PHPUnit or GitHub Actions. Those are
  measured separately as CPU-seconds and CI duration, and are not converted to energy.
- That carbon is included. CLEER publishes carbon per session under one scenario (behind-the-meter gas, 640 gCO₂e/kWh).
  Carbon will be added with its own boundary and scenario; it is deliberately not shown yet.
- That a period with no events had no energy use.

## Data provenance and licence

| Item | Value |
|---|---|
| Source | Sustainable AI Group, CLEER Dataset |
| Commit | `7fe6be0c76a3d6bbf98f3cb545a05871a6457f8f` |
| Path | `data/v1` |
| Engine | `CLEER-Text-0926`, dataset schema `1.1.0` |
| Data release | `2026-09-29` (built `2026-10-30`) |
| `models.json` SHA-256 | `6235ead80bab89a5472874f1679839e5a833ae06719c440ad5aea1ff58a33f70` |
| Licence | **CC BY-NC 4.0** (data); Apache-2.0 (upstream code only) |

The data is vendored verbatim under [`tools/resource/energy/cleer/`](../tools/resource/energy/cleer/) with a
[NOTICE](../tools/resource/energy/cleer/NOTICE.md) and a
[provenance record](../tools/resource/energy/cleer/provenance.json). Upstream publishes no tags or releases, so the commit
SHA is the only immutable pin.

CC BY-NC 4.0 permits non-commercial use with attribution. This repository uses the data for non-commercial accessibility
research and public reporting. **Commercial use requires separate written permission from Sustainable AI Group.**

## Reproducing and updating

```bash
node scripts/resource-energy.mjs verify
node scripts/resource-energy.mjs report
node scripts/resource-energy.mjs report --write
node scripts/resource-energy.mjs report --check
node scripts/resource-energy.mjs estimate --model=claude-sonnet-5-5 --cost=1.00
node scripts/resource-energy.mjs factors --file=tests/fixtures/energy/factors-synthetic.json
node tools/playwright/resource-dashboard.mjs
node tools/playwright/cleer-page.mjs
```

`verify` recomputes every vendored checksum and checks the mapping, offline. `report` works offline. The only networked
command is `sync`, which is explicit and refuses to change the pin without `--force`:

```bash
node scripts/resource-energy.mjs sync --sha=<commit>
```

A dataset update changes the estimate. It does not change historical token counts, timestamps or primary measurements,
and it never rewrites the ledger. Each report records the dataset version, checksum and pin, so two reports can be
compared knowing which coefficients each used.

## Known gaps and possible upstream feedback

Observations that may be useful to Sustainable AI Group, offered as feedback rather than as a claim of error:

- **Per-token coefficients are withheld** while the methodology computes them. A public per-token table, even a coarse
  one, would remove the need for a cost bridge.
- **Token counts per workload are withheld**, so a per-session figure cannot be scaled to a different workload.
- **No reasoning-token dimension** exists anywhere in the dataset. Reasoning models are a growing share of agentic work.
- **No mapping from display names to API model identifiers**, so every consumer must build its own mapping and risk
  guessing between point releases.
- **No frozen release snapshots.** `schema.md` documents `/data/v1/releases/{YYYY-MM-DD}/`, but that path does not exist,
  and there are no tags or GitHub Releases.
- **No stated limitations section** in the technical report, and no accuracy validation against closed-model ground truth.
- **Cache-read energy is a price-ratio proxy**, not a measurement.

None of these has been filed upstream. Doing so would need the owner's decision and would follow upstream's contribution
process.

## Privacy

The energy report is an aggregate. It publishes model identifiers, dataset identifiers, costs, estimated energy and
coverage counts. It never publishes prompts, transcripts, session identifiers, task descriptions, evidence references,
local paths, hostnames, usernames or credentials. See
[docs/RESOURCE-PRIVACY.md](RESOURCE-PRIVACY.md).

## Attribution

> Sustainable AI Group, CLEER Dataset, version CLEER-Text-0926
> https://github.com/sustainableaigroup/CLEER

> Jegham, N., Koh, C. Y., Gamazaychikov, B., & Luccioni, S. (2026). CLEER: Closed-model Latent Energy Estimation Range.
> Technical Report. Sustainable AI Group. Version CLEER-Text-0926.
> https://reports.sustainableaigroup.com/CLEER-Tech-Report/0926/
