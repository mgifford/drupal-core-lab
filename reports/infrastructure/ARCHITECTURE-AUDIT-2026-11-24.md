# Infrastructure architecture audit: multiple comparisons on macOS

Stage 1 review. Docker was initially down and the snapshot's six environments were absent. With owner approval, Docker
Desktop and the existing stopped `baseline-main` + `issue-3619127-vanilla` pair were started for measurement. No configuration,
patch, baseline or worktree was changed on that pair. A separate throwaway copy was used for the `upload_dirs` experiment and
then deleted. Prepared 2026-11-24.

## Status first: the three-pair baseline cannot be reproduced in this checkout

The investigation was asked to start from the running snapshot: three comparison pairs
(`2574721-current`, `3466040-latest`, `3590502-latest`), six web containers and six Chrome containers.

At 2026-11-24 08:45 America/Toronto, before owner approval:

- `docker info` could not reach the Docker daemon (`Cannot connect ... docker.sock`).
- `~/.ddev/project_list.yaml` had only `drupal-compare`, `repro-baseline-main` and
  `repro-issue-3619127-vanilla`.
- `envs/` contained only `baseline-main`, `issue-3619127-vanilla` and the shared `core.git`.
- `git -C envs/core.git worktree list` listed only those two worktrees.
- No host Mutagen process and no web container were available to inspect.

After approval, Docker Desktop was started and the existing pair was started for measurement. The six environments in the
snapshot are still **not present here**. They may be in another checkout, were deleted, or the snapshot was taken on another
machine. The snapshot's six-container readings are therefore owner-reported; the live measurements below cover one pair only.
The static findings do not depend on the missing pair.

## Host and repository baseline (measured)

| Item | Value |
|---|---|
| Host | macOS 27.2.1, arm64, 8 CPUs, 16 GiB RAM |
| Free disk | 28 GiB of 228 GiB (87% used) |
| Docker Desktop disk image | 31 GiB actual (`Docker.raw`, sparse, 228 GB nominal) |
| DDEV | v1.25.3, arm64; Docker 29.8.2 with 8 CPUs / 7.75 GiB VM |
| DDEV global performance mode | `mutagen` |
| DDEV registered projects | 3 (viewer + one pair) |
| Lab environments | 2 worktrees, 626 MB each; 1.3 GB total |
| Shared bare clone | `envs/core.git`, 29 MB |
| Reports | `reports/` 1.0 GB; `reports/issues/` 801 MB |
| Recipes | 54 entries, 828 KB; 26 issue recipes (`recipes/repro_*`) |
| Variants | 69 registered, 67 with a drupal.org issue; 32 in `tools/compare/variants.json`, the rest in issue `variants.json` |
| Issues tracked | 41 `reports/issues/<nid>/` folders, all with `status.json` |

## Live baseline: one pair, 2026-11-24 09:00-09:45

Started with `node scripts/lab-env.mjs start 3619127-pinned`. The pair is not the owner's three active issues; it is the only
pair present in this checkout. No configuration was changed.

### Idle CPU: the Mutagen agent, not PHP-FPM

Three 10-second cgroup/process deltas per web container after startup:

| Environment | Total web CPU | Mutagen agent | php-fpm | nginx | mailpit | supervisord |
|---|---:|---:|---:|---:|---:|---:|
| baseline-main (first 30 s) | 3.7% → 1.2% | 3.2% → 1.0% | 0.0% | 0.0% | 0.0% | 0.0% |
| issue-3619127-vanilla (first 30 s) | 7.0% → 1.0% | 3.5% → 0.9% | 0.0-0.1% | 0.0% | 0.0-0.3% | 0.0-0.1% |

A 60-second `docker stats` sample had baseline web at 5.99% average (43.57% peak) and issue web at 9.36% average (46.71%
peak). The peaks are periodic Mutagen scans, not PHP requests: php-fpm was 0.0% throughout. Both agents report the same
session shape: `Watching for changes`, portable watch with a 10-second polling interval.

### Idle memory and service roles

| Container | Baseline | Issue | Role |
|---|---:|---:|---|
| web | 636 MiB | 307 MiB | nginx + php-fpm + Mutagen agent + mailpit |
| chrome | 467 MiB | 267 MiB | Selenium standalone; **0 browser processes and 0 sessions** |
| otel-collector | 381 MiB | 45 MiB | optional tracing |
| drupal-compare web | 175 MiB (shared) | — | viewer address/proxy |
| ddev-router | 26 MiB (shared) | — | shared |
| ddev-ssh-agent | 17 MiB (shared) | — | shared |

One pair plus the viewer used roughly **2.2 GiB** of the Docker VM's 7.75 GiB with no browser or test running. Chrome and the
baseline OTEL collector alone were about **0.85 GiB** of that. The baseline OTEL collector was unexpectedly much larger than
the issue one (381 vs 45 MiB) while doing no work; this needs its own check before it is called a leak.

### Chrome on demand

`docker stop ddev-repro-issue-3619127-vanilla-chrome` freed **246 MiB** and about 1% CPU; the Drupal web container stayed up.
`docker start` brought Selenium back (`"Selenium Grid ready."`). This is the measured basis for Option B. It was restored
immediately.

### Mutagen sync size

| Environment | Synchronized files | Synchronized bytes | Mutagen volume |
|---|---:|---:|---:|
| repro-baseline-main | 67,746 | 460 MB | 438.3 MB |
| repro-issue-3619127-vanilla | 67,750 | 460 MB | 438.3 MB |

`ddev utility mutagen-diagnose` on **both** environments returned one warning:

```
node_modules directory exists but is not excluded from sync
→ upload_dirs: [.ddev/tmp, core/node_modules]
→ ddev restart
```

This is DDEV's own supported recommendation, not an inference from file counts alone.

### Controlled `upload_dirs` probe

A throwaway copy of `baseline-main` was made at `envs/zz-mutagen-probe`, its project name changed, and
`core/node_modules` added to `upload_dirs` in the copy's add-on config. It was started, measured, stopped and deleted; the
active pair was not touched.

| Measure | Without exclusion (baseline) | With `core/node_modules` excluded | Change |
|---|---:|---:|---:|
| Synchronized files | 67,746 | 24,870 | **-63%** |
| Synchronized bytes | 460 MB | 178 MB | **-61%** |
| Mutagen volume | 438.3 MB | 169.7 MB | **-61%** |
| `mutagen-diagnose` | warning | **no issues found** | fixed |
| `core/node_modules` inside container | present | present (bind mount) | unchanged |
| Internal `/user/login` | 200 | 200 (0.35 s first request) | works |

The probe's idle web CPU was 0.04% in the one `docker stats` snapshot after sync; the baseline and issue webs were 0.08% and
0.04% in the same snapshot. A longer matched idle run is still needed; the file/byte/volume reduction and the removal of
DDEV's warning are measured.

**Operational note:** starting the probe recreated the shared router and twice left HTTPS reset (HTTP worked). Restarting
only `ddev-router` restored HTTPS; the active pair and viewer are 200 again. The probe was then deleted. This router
sensitivity is itself a lifecycle risk for starting/stopping many pairs.

### Docker disk and stale state

| Item | Size | Reclaimable |
|---|---:|---:|
| Images | 13.93 GB | 4.86 GB |
| Volumes | 9.18 GB | 5.04 GB |
| Build cache | 6.19 GB | 0.96 GB |
| Mutagen volumes | 7.6 GB across 19 projects | 17 of 19 belong to projects not in the current DDEV list |

Only two Mutagen volumes are in active use; **7.6 GB across 19 projects** remains. `docker system df` shows 5.04 GB of
reclaimable volumes and 4.86 GB of reclaimable images. None of it was deleted; cleanup is a separate, authorized action.

## What each comparison actually is

Each environment is a separate Git worktree of the shared `envs/core.git` and a separate DDEV project:

| Side | Worktree | DDEV project | Database | Web root |
|---|---|---|---|---|
| Before | `envs/<baseline>` | `repro-<baseline>` | SQLite at `sites/default/files/.sqlite` | worktree root |
| After | `envs/<issue>` | `repro-<issue>` | separate SQLite in its own worktree | worktree root |
| Viewer | `tools/compare/site` | `drupal-compare` | none | host Node `serve.mjs`, proxied to `:8100` |

The two worktrees are independent checkouts of the same core commit (plus patches on After). They share the object database, not
the working tree. SQLite is per worktree; there is no writable database shared between Before and After. This isolation is correct
and must be preserved.

### Per-environment filesystem (measured)

| Path | Size | Files | Needed at runtime? | Mutagen-synced now? |
|---|---:|---:|---|---|
| `core/node_modules` | 393 MB | 42,893 | No (CSS/JS build and lint only) | **Yes** |
| `vendor` | 103 MB | 8,447 | Yes (PHP autoload) | **Yes** |
| `core/assets` | 19 MB | 200 | Yes (generated CSS/JS) | **Yes** |
| `sites/default/files` | 6.6 MB | 39 | Yes (SQLite DB, Twig cache, uploads) | **Yes** |
| `sites/default/files/.sqlite` | 6.4 MB | 1 | Yes (database) | **Yes** |
| `.ddev/tmp` | 0 B | 0 | Add-on temp/upload dir | No (`upload_dirs`) |
| Everything else in the worktree | remainder of 626 MB | ~16,400 | Yes or small | Yes |

`core/node_modules` alone is **63% of the environment size and 63% of its file count** (42,893 of 67,747 files). With
`vendor` (8,447 files), the two directories are 76% of the files in the worktree. This is the single most important static finding.

## Services and duplication

| Service | Scope | Started by | Needed | Duplicated | Notes |
|---|---|---|---|---|---|
| `web` (nginx + php-fpm + Mutagen agent) | per environment | `ddev start` | Yes | One per side | CPU reading includes the Mutagen agent, nginx and php-fpm, not just Drupal |
| `chrome` (Selenium standalone Chromium 143) | per environment | add-on compose, every `ddev start` | Only for browser tests | **One per environment** | `shm_size: 2gb`; no CPU/memory limit; six for three pairs |
| `otel-collector` | per environment if enabled | generated compose file | Optional tracing only | One per side | A generated file exists; not observed in the supplied snapshot |
| `ddev-router` | shared | DDEV | Yes | One | Proxies all projects; no per-project duplication |
| `ddev-ssh-agent` | shared | DDEV | Only for SSH operations | One | Can be omitted globally; not omitted now |
| `drupal-compare` web | shared viewer address | `lab-env start` | Yes for the DDEV URL | One | Generic project, no DB; host Node serves the viewer |
| Node `serve.mjs` | host process | `lab-env start` | Yes for the viewer | One | `stopViewer()` kills every `tools/compare/serve.mjs` process on the machine |
| Mailpit | per project (DDEV) | `ddev start` | Not for normal work | Unclear | Not in the supplied snapshot; confirm with `docker ps` |
| Primero (Solr, PostgreSQL) | unrelated project | Docker | N/A | N/A | Must not be touched or counted as lab usage |

Ownership metadata exists: the DDEV projects use `com.ddev.site-name` and `com.ddev.approot` labels, and the Chrome service sets
the same labels. The lab's current Docker adapter does **not** use those labels; it parses container names with one regex.

## Mutagen: the first hypothesis

### Configuration as it exists

- Global `~/.ddev/global_config.yaml`: `performance_mode: mutagen`; no per-project override.
- Project `.ddev/config.ddev-drupal-core-dev.yaml` (add-on `justafish/ddev-drupal-core-dev` v1.2.5):
  `upload_dirs: [.ddev/tmp]` only.
- `.ddev/mutagen/mutagen.yml` (generated): `mode: two-way-resolved`, `stageMode: neighboring`; ignores `/.git`, `/.tarballs`,
  `.ddev/db_snapshots`, `.ddev/.importdb*`, `.DS_Store`, `.idea`, `/.ddev/tmp`; `symlink: posix-raw`.
- The generated compose mounts `project_mutagen` at `/var/www` and the `web` service at `/var/www/html`; only `.ddev/tmp` is a
  bind mount.
- `core/node_modules` and `vendor` are therefore inside the Mutagen volume and synced in both directions.

This is not a guess: DDEV's own performance documentation says **"Large `node_modules` can cause slow sync times ... The solution is
to add `node_modules` to the `upload_dirs` list in `.ddev/config.yaml`"**, and warns to keep existing CMS defaults when overriding
the list. The same page recommends `ddev utility mutagen-diagnose` for "large files being synced" and `node_modules` specifically.
([DDEV performance](https://docs.ddev.com/en/stable/users/install/performance/),
[`upload_dirs`](https://docs.ddev.com/en/stable/users/configuration/config/#upload_dirs),
[`mutagen-diagnose`](https://docs.ddev.com/en/stable/users/usage/commands/#utility-mutagen-diagnose))

### What the owner's snapshot adds

The `docker top` observations showed `mutagen-agent synchronizer` inside three web containers at roughly 28-31% CPU each, with
1 h 1 m to 1 h 11 m accumulated CPU. Those are user-reported and were not reproducible here. They are consistent with a large
two-way sync tree, but they do **not** prove the current cause: accumulated CPU can be from initial syncs and past builds, and
`docker stats` for a web container includes the Mutagen agent, nginx and php-fpm.

### Why `node_modules` is the leading candidate

1. 42,893 files and 393 MB per environment; two directions to reconcile.
2. It is not needed to serve Drupal. It is needed only for CSS/JS builds and lint, which are occasional.
3. The add-on's `yarn install`/build inside the container writes many files; Mutagen then reconciles them to the host. DDEV warns
   that `yarn`/`npm` actions set off massive changes.
4. DDEV explicitly recommends `upload_dirs` for this case.
5. Vendor is larger than ideal but needed at runtime; bind-mounting it would trade sync CPU for slower PHP file access. Node modules
   have no such runtime cost.

### Candidate exclusions, in order

| Candidate | Supported mechanism | Runtime effect | Risk | Decision |
|---|---|---|---|---|
| `core/node_modules` | add to `upload_dirs` | Bind-mounted; only build/lint reads it | Platform-specific binaries; build from inside container remains the rule | **Test first** |
| `vendor` | `upload_dirs` | Bind-mounted PHP code on every request | Slower autoload/response; Composer writes through the mount | Defer; likely keep Mutagen |
| `sites/default/files` | `upload_dirs` | Bind-mounted SQLite DB, Twig cache, uploads | SQLite I/O on a macOS bind mount; possible locking/performance change | Defer; test separately, not in the first change |
| `core/assets` | not recommended | Generated CSS/JS needed at runtime | Small (19 MB); high change rate during builds | Keep Mutagen |
| `.ddev/tmp` | already excluded | none | none | Already done |

DDEV requires `ddev mutagen reset` after changing `mutagen.yml`; for `upload_dirs` the docs say `ddev restart` (and a reset if the
sync volume must be rebuilt). That is a disruptive per-project operation. It must be tested on a disposable environment, not on an
active pair, and any config change must be deferred for active pairs until they are no longer needed for current work.

### Do not disable Mutagen globally

DDEV recommends Mutagen for macOS web-serving performance. The non-Mutagen mode is a controlled comparison (disposable environment),
not a default change. It may win for many idle environments and lose for page response time; that is an empirical question.

## Chrome: the second duplication

The add-on defines a Chrome service for every project:

```yaml
chrome:
  container_name: ddev-${DDEV_SITENAME}-chrome
  image: selenium/standalone-chromium:143.0.7499.169
  shm_size: 2gb
```

It is part of the project compose file, so **every `ddev start` starts Chrome**, whether or not a browser test runs. It has no
`cpus` or `mem_limit`. The supplied snapshot reports six Chrome containers at about 1.09 GiB total (roughly 180 MiB each); that is
plausible but not reproducible here.

Who needs it:

- The lab's Playwright scripts launch **host** Chromium/WebKit/Firefox (`tools/playwright/lib/lab-run.mjs` and the evaluators). They
  do not use `ddev-*-chrome`.
- The add-on's `ddev phpunit` and `ddev nightwatch` commands point at `http://chrome:4444` (`core/.env`/`.ddev/core-dev/.env`:
  `MINK_DRIVER_ARGS`). FunctionalJavascript/BrowserTestBase PHPUnit runs need it; unit and most kernel/functional tests do not.
- `scripts/try-tests.mjs` calls `ddev phpunit`, so it may need Chrome for browser tests and does not need it for the rest.

Options:

| Option | Description | Compatibility | Complexity | Recommendation |
|---|---|---|---|---|
| A. Current per-environment Chrome | Always on | Known good | None | Keep as fallback |
| B. On-demand per environment | `ddev compose stop chrome` after start; start it before a browser test | Same image, network, per-env isolation | Small wrapper + test detection | **Preferred candidate**, measure first |
| C. Shared Chrome | One Selenium container attached to every project network with a `chrome` alias | Sessions are isolated in Selenium, but network aliases, shared shm and failure domain change | High | Defer; not justified before B is measured |

Stopping Chrome is not the same as stopping the project: `ddev compose stop chrome` leaves the web container and SQLite data alone.
`ddev start` will bring Chrome back unless the lab wrapper stops it again. A browser-test wrapper must start it first and must not
silently report a browser test as passed when Chrome is absent.

## Web server and PHP-FPM

No worker tuning is proposed yet. The web container's reported 84-133% CPU can include the Mutagen agent, nginx, php-fpm and
Drupal. Before changing `pm.max_children`/`pm.start_servers` or adding container limits, the Mutagen share must be separated with
per-process measurements. The current `webserver_type: nginx-fpm` and `php_version: 8.5` are consistent across both sides; changing
only one side would invalidate the comparison.

## Resource accounting: current coverage and gaps

Current `tools/resource/adapters/docker.mjs`:

- `dockerContainers()` selects only names matching `^ddev-.*-(web|db|otel-collector)$`.
- It misses `-chrome`, `ddev-router`, `ddev-ssh-agent`, the viewer web container, Mailpit and any non-`ddev-*` lab service.
- It parses the environment from the name (`repro-...`) rather than using `com.ddev.site-name`/`com.ddev.approot` labels; a viewer or
  renamed project is `env = null`.
- `docker stats --no-stream` gives a sampled `CPUPerc`; CPU-seconds are derived as `CPUPerc × interval` and labelled derived. That is
  acceptable for a sample, but not cumulative CPU.
- `BlockIO` and `NetIO` are cumulative counters from Docker; they are stored as sampled values, not deltas/rates.
- No Mutagen session status, agent process CPU, upload_dirs, file counts, or directory sizes.
- No task association beyond `docker-sample:<container>`; no issue/variant unless the name parses.
- No Chrome memory/CPU, no router/ssh-agent memory, no viewer process.
- `scripts/resource.mjs collect --source=docker` is on-demand; no time-series baseline is scheduled.
- `scripts/lab-env.mjs` has no `resources` command; `status` reports DDEV state only (and `ddev list` needs Docker).
- `resource-budgets.yml` has AI/process limits, no infrastructure concurrency, queue, memory or CPU pressure keys.
- The dashboard has resource/activity views but no infrastructure section, no container-role breakdown, no Mutagen view.

These are implementation targets after the live baseline, not changes made now.

## Lifecycle and concurrency gaps

- `lab-env.mjs start <slug>` always runs `ddev start` for both sides, then `startViewer()` kills every `tools/compare/serve.mjs`
  process before starting a new viewer. A second pair's viewer session is global, not per pair.
- `lab-env.mjs stop <slug>` stops the viewer globally and both environments; `stop all` stops every lab environment but leaves the
  small `drupal-compare` address project running. There is no per-service stop.
- No no-op check: `start` relies on DDEV's own idempotence; it does not distinguish "already running and healthy" from "needs start".
- No active-task lease/heartbeat; no idle classification; no protection against stopping an environment with current work.
- `resource-run.mjs` uses `running.json` and `max_concurrent_cpu_jobs` for wrapped commands only; `try-tests`, `setup.mjs`, CSS builds
  and Playwright runs are not scheduled.
- No cooperative queue, priority or queue timeout for expensive operations.
- No task/environment association in `lab-env`; `resource-task.mjs` exists but is not consulted by lifecycle commands.

## What the live baseline confirms, and what remains

1. **Confirmed: Mutagen syncs 67,746 files / 460 MB per environment, including `core/node_modules` (393 MB, 42,893 files).**
   DDEV's own diagnostic warns on both environments. Excluding `core/node_modules` in the disposable probe reduced the
   synchronized set by 63% of files and 61% of bytes and removed the warning. Idle CPU was Mutagen, not php-fpm.
2. **Confirmed: Chrome is always on and idle.** A Chrome container had **0 browser processes and 0 sessions**; stopping it
   freed 246 MiB and about 1% CPU without affecting the Drupal web container. The supplied six-container 1.09 GiB total is
   owner-reported; the measured two containers were 467 + 267 MiB.
3. **Confirmed: web CPU was overwhelmingly Mutagen.** In 10-second deltas, php-fpm, nginx, mailpit and supervisord were ~0%;
   the Mutagen agent accounted for 0.9-3.5% per web container, with periodic 40%+ `docker stats` spikes.
4. **Not yet tested: `sites/default/files`.** It holds the live SQLite DB (6.4 MB) plus Twig cache. Excluding it would move the
   database to a macOS bind mount; test separately, with a backup, or not at all.
5. **Confirmed disk pressure / stale state.** 7.6 GB of Mutagen volumes across 19 projects, 5.04 GB reclaimable volumes,
   4.86 GB reclaimable images and 0.96 GB reclaimable build cache; 28 GiB free. Cleanup is separate and authorized.
6. **Confirmed visibility gap.** The collector cannot show Chrome/router/Mutagen or associate services with variants.

**Still missing:** the three-pair baseline (the environments are absent), a matched idle CPU run after the probe change, Composer,
PHPUnit/FunctionalJavascript, large-file sync, non-Mutagen mode, and the WebKit/Firefox browser paths. The probe's router restart
also exposed a lifecycle risk: creating a project can disturb the shared router and HTTPS for other pairs.

## Remaining measurement plan (needs the three pairs or a disposable set)

Read-only unless a disposable environment is explicitly created:

1. `docker version`, `docker info`, `ddev version`, `ddev list -j`, `ddev utility mutagen-diagnose --all`,
   `ddev mutagen status -l` for each project.
2. For each web container: `docker top <web>` and `docker exec <web> ps -eo pid,ppid,%cpu,etime,comm,args` to separate
   `mutagen-agent`, `php-fpm`, `nginx` and Drupal; sample twice 30 s apart.
3. Container CPU and memory: `docker stats --no-stream` repeated at 5 s intervals for 5-10 minutes, and cgroup counters
   (`/sys/fs/cgroup/cpu.stat` `usage_usec`, `memory.current`, `io.stat`) in each web container to get deltas rather than a single
   percentage.
4. Mutagen sync state: `ddev mutagen monitor` and `ddev mutagen status -l` during (a) idle, (b) one page request, (c) one PHPUnit
   run, (d) `ddev composer install` in a disposable env, (e) a large file change, (f) two environments changing files.
5. File counts/sizes in the host worktrees, and the same paths inside the container, before and after a sync.
6. Response time: three requests per side to a fixed path (`curl -w`), before and after each candidate change.
7. Test correctness: `ddev phpunit` on a small unit test and one FunctionalJavascript test on a disposable pair; `node tools/playwright/walkthrough.mjs` or a viewer check for the browser path.

Scenarios: 1 pair idle, 2 pairs idle, 3 pairs idle, one pair browsing, one PHPUnit, two PHPUnits concurrently, Composer/CSS build,
large file change, Chrome stopped. Record CPU core-seconds, peak memory, first-response time, sync completion, test result and
whether both sides still match their patches.

## Proposed safe changes, in order

1. **Baseline partly recorded.** One pair idle and the Mutagen/node_modules probe are measured above; the three-pair baseline
   still needs the missing environments.
2. **Apply the `core/node_modules` upload_dir** to new environments through a lab-owned `config.lab.yaml` (not the add-on's
   generated file), after `yarn run build:css`, lint and a page request pass on a disposable copy. Do not apply it to a running
   pair until it is not needed; DDEV requires a restart/reset. Document removal.
3. **Chrome on demand:** add an explicit `lab-env.mjs chrome <slug> stop|start` and a browser-test wrapper that starts Chrome and
   fails clearly if it is unavailable. The measured stop/start works; the wrapper and FunctionalJavascript test are not built.
4. **Resource accounting:** extend the Docker adapter to use labels and include Chrome/router/ssh-agent/viewer; add cgroup deltas,
   Mutagen status, and container-role classification; keep sampling on demand. Add fixtures/tests without Docker.
5. **`lab-env.mjs resources`:** read-only summary of DDEV state, containers, Chrome, Mutagen, CPU/memory, task association and
   possible idle environments; classify unknown when Docker/Mutagen cannot be read.
6. **Cooperative scheduling:** extend `resource-budgets.yml` with observe-only concurrency keys (heavy operations, browser tests,
   Composer, setup, memory/CPU pressure) and a small queue that reuses `running.json`; do not add hard limits until the baseline
   shows contention.
7. **Dashboard:** add an Infrastructure Efficiency section with historical snapshots and table equivalents; never imply it is live.
8. **Docs and handoff:** configuration, rollback, how to remove `upload_dirs`/Chrome changes, what is not verified.

## Risks and rollback

- `upload_dirs` on `core/node_modules`: if the directory is absent, DDEV creates an empty bind mount; CSS builds need `yarn install`.
  Rollback: remove the entry, `ddev restart` (and `ddev mutagen reset` if sync state is wrong).
- `upload_dirs` on `vendor`: not proposed first; slower PHP and Composer writes.
- `upload_dirs` on `sites/default/files`: moves the live SQLite DB to a macOS bind mount; do not do this without a dedicated test
  and a backup.
- Chrome stop: FunctionalJavascript tests fail if not started; a wrapper must start it and report the failure honestly.
- DDEV add-on updates overwrite `config.ddev-drupal-core-dev.yaml`; use a lab-owned `config.lab.yaml` and test DDEV's merge behavior.
- Mutagen reset on an active environment discards and recreates the sync volume; defer until the environment is not needed.
- Docker Desktop restart can start unrelated projects (Primero). Identify by labels and never stop/delete them.

## What is verified, and what is not

Verified on 2026-11-24 with the one pair present in this checkout:

- Idle web CPU is overwhelmingly the Mutagen agent (0.9-3.5% per web in 10-second deltas; php-fpm/nginx/mailpit ~0).
- Both environments sync 67,746/67,750 files and 460 MB; DDEV's diagnostic warns about `core/node_modules` on both.
- Excluding `core/node_modules` in the disposable probe cut synchronized files 63%, bytes 61% and the Mutagen volume 61%, removed
  the warning, and kept `core/node_modules` available in the container. Internal `/user/login` returned 200.
- Chrome had 0 browser processes and 0 sessions; stopping it freed 246 MiB and ~1% CPU without affecting the web container. It was
  restored and Selenium reported ready.
- One pair plus viewer used about 2.2 GiB; Chrome and baseline OTEL alone were about 0.85 GiB; baseline OTEL was 381 MiB.
- Docker holds 5.04 GB reclaimable volumes, 4.86 GB reclaimable images, 0.96 GB reclaimable build cache; 7.6 GB of Mutagen volumes
  across 19 projects, 17 not in the current DDEV list.
- The active pair and viewer are back on HTTPS after the probe was stopped and `ddev-router` was restarted. No configuration,
  patch, baseline or worktree of the active pair was changed.

Not verified:

- The three-pair baseline and the six-container readings in the owner's snapshot; those environments are absent here.
- A matched idle CPU run after `upload_dirs` (same pair, same duration) and the effect on initial sync/response time.
- Composer, PHPUnit, FunctionalJavascript/Nightwatch and the Chrome-on-demand wrapper; the probe did not run `yarn build:css`,
  lint or PHPUnit.
- Large-file sync, simultaneous changes in two environments, non-Mutagen mode, WebKit/Firefox paths, and long-running stability.
- Whether the router TLS failure seen when the probe started recurs with normal multi-pair starts.
- `sites/default/files` exclusion (SQLite/Twig) was not tested and is not recommended without a dedicated backup/test.
- No resource-accounting, scheduler or dashboard code was changed in Stage 1. The report and probe are the deliverables; the next
  implementation stage still needs the three-pair baseline or a disposable set.
