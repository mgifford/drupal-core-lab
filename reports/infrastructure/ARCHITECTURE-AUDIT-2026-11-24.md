# Infrastructure architecture audit: multiple comparisons on macOS

Read-only Stage 1 review. No environment was started, stopped, reset, deleted or edited. No patch, baseline or worktree was changed.
Prepared 2026-11-24.

## Status first: the live baseline cannot be reproduced in this checkout

The investigation was asked to start from the running snapshot: three comparison pairs
(`2574721-current`, `3466040-latest`, `3590502-latest`), six web containers and six Chrome containers.

In this checkout at 2026-11-24 08:45 America/Toronto:

- `docker info` cannot reach the Docker daemon (`Cannot connect ... docker.sock`).
- `~/.ddev/project_list.yaml` has only `drupal-compare`, `repro-baseline-main` and
  `repro-issue-3619127-vanilla`.
- `envs/` contains only `baseline-main`, `issue-3619127-vanilla` and the shared `core.git`.
- `git -C envs/core.git worktree list` lists only those two worktrees.
- `pgrep -fl mutagen` finds no host Mutagen process; no web container is available to inspect its agent.

So the six environments in the snapshot are **not present here**. They may be in another checkout, were deleted, or the snapshot
was taken on another machine. The observations in the task are treated as owner-reported, not as verified measurements, and all
live numbers below are marked as pending. The static findings do not depend on them.

## Host and repository baseline (measured)

| Item | Value |
|---|---|
| Host | macOS 27.2.1, arm64, 8 CPUs, 16 GiB RAM |
| Free disk | 28 GiB of 228 GiB (87% used) |
| Docker Desktop disk image | 31 GiB actual (`Docker.raw`, sparse, 228 GB nominal) |
| DDEV | v1.25.3, arm64; Docker provider unreachable |
| DDEV global performance mode | `mutagen` |
| DDEV registered projects | 3 (viewer + one pair) |
| Lab environments | 2 worktrees, 626 MB each; 1.3 GB total |
| Shared bare clone | `envs/core.git`, 29 MB |
| Reports | `reports/` 1.0 GB; `reports/issues/` 801 MB |
| Recipes | 54 entries, 828 KB; 26 issue recipes (`recipes/repro_*`) |
| Variants | 69 registered, 67 with a drupal.org issue; 32 in `tools/compare/variants.json`, the rest in issue `variants.json` |
| Issues tracked | 41 `reports/issues/<nid>/` folders, all with `status.json` |

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

## Ranked hypotheses (to test, not yet proven)

1. **Mutagen syncing `core/node_modules` (393 MB, 42,893 files) and `vendor` (103 MB, 8,447 files) in every environment.**
   Highest expected idle-CPU reduction; supported `upload_dirs` fix; test node_modules first.
2. **Chrome always on.** ~180 MiB each, six containers for three pairs; no CPU/memory limit; likely unused during most editing.
   On-demand stop expected to save about 1.1 GiB and some idle CPU; must preserve FunctionalJavascript tests.
3. **Web-container CPU is being read as PHP-FPM CPU when much of it may be the Mutagen agent.** Separate per-process CPU before
   tuning PHP-FPM or adding hard limits.
4. **Drupal-generated files under `sites/default/files` are synced**, including Twig cache and the SQLite database; page requests and
   cache rebuilds write there. Small today, but a possible feedback loop. Test separately because excluding it moves SQLite to a
   bind mount.
5. **Disk pressure.** 28 GiB free with 31 GiB Docker image, 1.3 GB of worktrees, 1.0 GB of reports and a 122 MB Mutagen data
   directory. Deleting environments is not the first answer; `trim`, Docker build-cache pruning and archiving closed issues are.
6. **No infrastructure visibility.** The collector cannot show Chrome/router/Mutagen or associate services with variants; this is a
   measurement gap before it is an optimization.

## Measurement plan (needs Docker and the missing environments)

Read-only, no configuration changes:

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

1. **Measure first.** No config change until the baseline above is recorded.
2. **`core/node_modules` upload_dir** on a disposable environment: add `core/node_modules` to `upload_dirs` alongside `.ddev/tmp`,
   `ddev restart`/`ddev mutagen reset`, verify `yarn run build:css`, lint, and a page request; then measure idle CPU. If it wins,
   apply to new environments through a lab-owned `config.lab.yaml` (not the add-on's generated file) and document how to remove it.
3. **Chrome on demand:** add an explicit `lab-env.mjs chrome <slug> stop|start` and a browser-test wrapper that starts Chrome and
   fails clearly if it is unavailable. Do not stop Chrome automatically for an environment with an active browser test.
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

## What is not verified

Everything that needs a running Docker daemon: current container CPU/memory, Chrome memory, Mutagen agent CPU, sync status, file
change rates, sync completion, response times, and the three-pair baseline. The six environments in the task snapshot are absent from
this checkout and DDEV registry; their names, service counts and resource readings were not reproduced. No optimization has been
claimed or applied. The next step is to restore the Docker daemon and the three pairs (or point this work at the checkout that has
them) and run the measurement plan above before changing a configuration.
