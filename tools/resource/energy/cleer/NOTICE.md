# CLEER dataset — attribution and licence

These files are a **verbatim copy** of the CLEER public dataset. They are not modified. The only
change in this directory is this notice and the `provenance.json` beside it.

## Attribution

> Sustainable AI Group, CLEER Dataset, version CLEER-Text-0926
> https://github.com/sustainableaigroup/CLEER

Cite the dataset as above. Cite the methodology as:

> Jegham, N., Koh, C. Y., Gamazaychikov, B., & Luccioni, S. (2026). CLEER: Closed-model Latent
> Energy Estimation Range. Technical Report. Sustainable AI Group. Version CLEER-Text-0926.
> https://reports.sustainableaigroup.com/CLEER-Tech-Report/0926/

## Licence

The data in the upstream `data/` directory is licensed under the
[Creative Commons Attribution-NonCommercial 4.0 International License](https://creativecommons.org/licenses/by-nc/4.0/)
(CC BY-NC 4.0). The upstream code in `/app` and `/scripts` is Apache-2.0; **that licence does not
cover the data**.

CC BY-NC 4.0 permits sharing and adapting the material for non-commercial purposes with
attribution, a link to the licence, and an indication of changes. **Commercial use requires
separate written permission from Sustainable AI Group.**

This repository uses the dataset for non-commercial accessibility research and public reporting.
If that changes, the dataset must be removed or permission obtained.

## Pin

Upstream publishes no tags or releases, and the documented `data/v1/releases/` path does not
exist. The only immutable pin is a commit SHA:

- Repository: `sustainableaigroup/CLEER`
- Commit: `7fe6be0c76a3d6bbf98f3cb545a05871a6457f8f`
- Path: `data/v1`
- Vendored: 2026-11-24
- `models.json` SHA-256: `6235ead80bab89a5472874f1679839e5a833ae06719c440ad5aea1ff58a33f70`
  (this equals the checksum published in upstream `meta.json`)

`provenance.json` records a SHA-256 for every vendored file. `node scripts/resource-energy.mjs verify`
recomputes them offline and fails if any file changes.

## Files

| File | Purpose |
|---|---|
| `meta.json` | Version, counts, published checksum, licences |
| `models.json` | Full payload: per-model, per-workload energy and carbon |
| `cleer-dashboard-data.csv` | Flat table, one row per model x workload; includes the published `energy_wh_per_usd` |
| `schema.md` | Upstream schema documentation (schema v1.1.0) |

## What CLEER publishes, and what it withholds

The dataset carries **resolved per-session figures only**: facility energy and carbon for six
fixed workloads (`chat`/`agentic` x `light`/`typical`/`heavy`), each with a mean and a standard
deviation, plus component breakdowns.

**Per-token energy intensities are deliberately not published.** Upstream `scripts/build_data.py`
contains an IP guard that fails the build if a per-token field appears, and the token counts
behind each workload are also withheld. This project therefore does not reconstruct or guess
per-token coefficients; it uses the published per-session figures and the published
`energy_wh_per_usd` field. See `docs/CLEER.md`.

## Changes made

None to the data files. This project computes ratios and tables *from* the data at report time; it
does not alter the vendored files.
