# Resource usage for #3419891

**DRAFT.** Approximate; measured from command output where a time is quoted, otherwise estimated.

| Phase | Time | Notes |
|---|---|---|
| Preflight and source investigation | ~2 h | Intake, source reading, CKEditor 5 48.5.1 vs 49.1.0 diff, three-state design. No containers. |
| Evaluator rewrite | ~1.5 h | Replaced the old evaluator; syntax-checked before any environment work. |
| Environment build, first attempt | ~68 min, failed | Disk filled; Docker's metadata store went read-only; recipe never applied. |
| Environment build, successful pair | ~15 min | Baseline + MR side, image tags reused; composer and Yarn caches warm. |
| Environment build, follow-up side | ~15 min | Third checkout, same image tag, cached dependencies. |
| Reinstalls after fixture correction | ~4 min per side | Standard install + recipe. |
| JavaScript build | 0.8 s | `corepack yarn build:ckeditor5` in the web container; 18.8 KiB bundle. |
| Browser runs (Chromium) | ~2-4 min each | 7 completed runs, plus failed attempts during the Docker outage. |
| Browser runs (WebKit) | ~6-10 min each | Slow cold launch under load. |
| PHPUnit (one filter) | ~26 s per run | Two runs: MR-only (red) and follow-up (green). |
| Lint (core's CI checks) | 14-30 s | PASS. |

## Disk and Docker

- Host disk reached 100% (159 MiB free); `Docker.raw` had grown to 228 GB. Docker's containerd metadata became read-only, so image deletion and pruning failed until space was freed.
- Recovered without restarting Docker Desktop: stopping the half-built `3419891` baseline freed 7.7 GB; pruning build cache freed 3.8 GB and later 1.8 GB; one unused `ddev-xhgui` image was removed. No other project's environment, images or containers were deleted.
- Per-project DDEV web images are the same image under different tags; reusing an existing tag avoided two 13-minute rebuilds. Site code still came from the checkout.
- Reinstalls reused the shared `envs/core.git`, Composer cache and Yarn cache. No new Composer or npm dependencies were installed.

## Shared-workspace constraints

- `envs/.setup.lock` serialises builds; one wait of about 7 minutes was spent behind another issue's setup.
- Docker Desktop restarted during the work and stopped all containers; the router and the three lab sites were restarted without data loss.
- `tools/compare/variants.json` is shared. Edits for this issue were targeted at the `3419891-*` entries and were re-checked after other sessions wrote to the file. `tools/playwright/lib/lab-run.mjs` was not edited.
