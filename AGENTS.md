# AGENTS.md

## What this repository is

A **workspace for evaluating Drupal core changes**. Drupal core is not part of this repository. Core checkouts live in `envs/`
(gitignored) and are disposable. What is kept over time is the evidence in `reports/`, the tooling, and the accessibility skills in
`.agents/` and `.claude/`.

The job: reproduce a problem on pristine upstream, apply an issue fork's branch or a patch, compare the two under the same
conditions, and write the result up so a human can post it to drupal.org. Each issue can be **reproduced again later, on the same
core or on updated core**: see `reports/issues/README.md`, `docs/NEW-ISSUE.md`, and an issue's own `REPRODUCE.md`.

Instruction precedence: `ACCESSIBILITY.md`, then this file, then `STYLES.md`, then `.agents/DRUPAL_AGENTS.md`. When they conflict,
choose the safer, more accessible option. (`.agents/DRUPAL_AGENTS.md` still describes the old layout with core at the repository
root; where it disagrees with this file, this file wins.)

## Start here (the normal sequence for an issue)

    node scripts/doctor.mjs [slug]                       1. is this machine ready? fix what it reports (read-only)
    node tools/compare/setup.mjs <slug>                  2. FIRST TIME ONLY: build Before and After (10-20 min, resumable; re-run if it stops)
    node scripts/lab-env.mjs start <slug> [--browser]    3. every time: both sites + the viewer (https://drupal-compare.ddev.site or http://localhost:8100); --browser opens it in the lab browser (forced-colours switch, own profile in .lab-browser)
    node tools/playwright/walkthrough.mjs <slug>         4. scripted replay with real input; evidence goes to reports/issues/<nid>/
    (write up: REPRODUCE/VALIDATION/STATUS, drafts only)  5. then: node scripts/coverage.mjs <nid>; node scripts/index-issues.mjs
    node scripts/lab-env.mjs stop <slug>                 6. when done (nothing is lost)

New issue: `node scripts/new-issue.mjs <nid> --branch <fork-branch>`, then `docs/NEW-ISSUE.md`. People: `docs/FIRST-RUN.md`, `docs/USER-GUIDE.md`.
Slugs and environments are in `tools/compare/variants.json`; `node scripts/lab-env.mjs status` shows what exists and runs.

## The workflow

Everything is driven by **variants** in `tools/compare/variants.json`. A variant says which core (a pinned commit, or the latest
`main`), which two environments, which patches, the recipe that creates the starting state, the steps, and the checks.

    node scripts/doctor.mjs [slug]                       # preflight: prerequisites, disk, what is running
    node scripts/lab-env.mjs status | start <slug> | stop <slug|all> | delete <slug> --yes   # manage environments (two at a time); start also launches the viewer
    node tools/compare/setup.mjs <slug>                  # build Before and After from scratch (resumable, idempotent)
    node tools/compare/setup.mjs <slug> --check-patches  # only: do the patches still apply to that core?
    node tools/compare/serve.mjs <slug> [--ddev]         # side-by-side viewer (http://localhost:8100 or https://drupal-compare.ddev.site)
    node tools/compare/diff.mjs <slug>                   # which served files and pages differ
    node tools/playwright/walkthrough.mjs <slug>         # scripted replay with real input; writes evidence and an interpretation
    node scripts/new-issue.mjs <nid> --branch <branch>   # start a new issue
    node scripts/make-bundle.mjs <slug>                  # a self-contained zip for someone else
    node scripts/index-issues.mjs                        # refresh reports/issues/README.md
    node scripts/build-cloud.mjs                         # regenerate cloud/ (the GitHub Pages site); commit the result. CI fails if it is stale

Details: `tools/compare/README.md`, `tools/playwright/README.md`, `docs/TESTING-TOOLS.md`. Each run is a **pinned** variant (exactly as
verified) or a **latest** variant (follows current core `main`); see `docs/NEW-ISSUE.md`.

## Environments: baseline and patched, side by side

Never switch one checkout between "before" and "after". One worktree per variant, each its own DDEV project:

    envs/core.git/                one shared (shallow) clone of upstream core; setup.mjs creates it
    envs/baseline-<...>/          worktree at the core commit. NEVER EDITED.
    envs/issue-<...>/             the same core plus the issue's patches

Both run the same PHP, theme and modules, so the only difference is the code under test. Keep two or three DDEV projects running at
most (`ddev stop` the rest). Local development only; sites use `admin` / `admin`.

The normal state is **two sites running: a core, and the same core with an issue's patch.** Each issue has a `-latest` variant (current
core `main` when built: the day-to-day pair) and a `-pinned` one (an exact commit, for reproducing the original result). Build and run only
the pair you need; see `envs/README.md`. `node scripts/lab-env.mjs status` shows what exists and what is running.

| Variant | Environments | Core |
|---|---|---|
| `3619127-pinned` | `baseline-main`, `issue-3619127-vanilla` | `d29add7ebc1` (2026-09-30), stopped |
| `3619127-latest` | `baseline-latest`, `issue-3619127-latest` | `073a7d3` (2026-10-01), stopped |
| `3604037-pinned` | `baseline-3604037`, `issue-3604037` | `c321043bb82d` (not built yet) |
| `3604037-latest` | `baseline-3604037-latest`, `issue-3604037-latest` | current `main` when built (`8cd44d4`, 2026-10-01); running |
| viewer address (optional) | `tools/compare/site` | https://drupal-compare.ddev.site |

Short hostnames are added with `ddev config --additional-hostnames=<name>`. Host ports change after a restart; use `ddev describe`.

### How an environment is made (what `setup.mjs` does)
The DDEV add-on [`justafish/ddev-drupal-core-dev`](https://github.com/justafish/ddev-drupal-core-dev) (Apache-2.0; trial notes in
`docs/ADDON-TRIAL-2026-10-01.md`) gives `ddev drupal install | login | cache | module:install | lint:*`, `ddev phpunit`, `ddev nightwatch`
and a headless Chrome, with no Drush and SQLite instead of MariaDB. Roughly:

    git worktree add (from envs/core.git at the pinned commit or latest main), then git apply each patch (After only)
    ddev config --project-type=drupal12 --omit-containers=db --disable-settings-management
    ddev start && ddev composer install --no-interaction
    ddev add-on get justafish/ddev-drupal-core-dev && ddev restart
    cp .ddev/core-dev/.env core/.env                  # `ddev phpunit` sources it; without it every run errors before its first assertion
    ddev drupal install standard --password=admin
    scripts/lab-site.sh apply <env>                   # the variant's recipe, aggregation off, one site name for both sites

`scripts/lab-site.sh reset <env>` reinstalls a site from scratch (snapshots first). Useful commands inside an environment:

    ddev drupal cache | ddev drupal login | ddev phpunit <path-to-test> | ddev exec php core/scripts/dr cache:rebuild

Never add Drush or other dependencies to a core checkout, and never commit `composer.lock` changes there.

### Fallback: manual setup (verified 2026-10-01, MariaDB)
Use only if `setup.mjs` is not usable. `core/scripts/dr install` is SQLite-only; for MariaDB use `scripts/site-install.php`
(Drupal's installer API; creates `admin`/`admin`): copy it into the environment's `.agents/scripts/` and run
`SITE_NAME="<label>" ddev exec php .agents/scripts/site-install.php`. To reset: snapshot, drop and recreate the `db` database, remove
`sites/default/files` and `sites/default/settings.php`, `ddev restart`, install again.

## Known pitfalls (each cost real time; check here before debugging)

| Symptom | Cause and fix |
|---|---|
| `ddev-router failed to become ready` | DDEV's shared router is flaky. Re-run: `setup.mjs` and `lab-env.mjs start` retry and resume. |
| Frames blank, 502, `ECONNRESET` | Sites still starting, or the router reset plain HTTP. The proxies use HTTPS to the router (port 443); the viewer shows a "still loading" dialog and recovers. Check `node scripts/doctor.mjs <slug>`. |
| "No space left on device", odd failures | Disk. `doctor` shows free space. Free it: delete an unused variant (`lab-env.mjs delete <slug> --yes`), `docker builder prune`, remove `~/Library/Caches/ms-playwright` (then `cd tools/playwright && npx playwright install chromium`). |
| A "fix" check fails on both sides | Script-generated clicks do not trigger focus behaviour. Use trusted input (a real click, or Playwright `click()`); Mirror replays script clicks, so turn it off for the final step. |
| `ddev phpunit` errors before any assertion | `core/.env` missing; `setup.mjs` copies it from `.ddev/core-dev/.env`. |
| Firefox will not launch under Playwright here | Recorded as blocked in COVERAGE, never as a pass. |
| `fetch` to a DDEV site ignores a `Host` header | Use `node:http`/`https` (see `envFetch` in `tools/compare/lib.mjs`). |
| `ddev describe` freezes the viewer | It is synchronous; use the cached/async `envInfoAsync`. |
| macOS: no `timeout`; zsh does not word-split `$var` | Use real exit codes; run multi-word variables through `bash`. |
| The built-in browser pane shows blank frames or `ERR_BLOCKED_BY_CLIENT` | It blocks cross-site frames and requests to some hosts. Verify with Playwright (`tools/playwright/mirror-drag.mjs` is a model), not the pane. |
| Adding a language with a recipe crashes (`setWeight() on null`) | A recipe that installs the Language module does not create its locked languages (und, zxx). Use `scripts/lab-site.sh language <env> <code>` (API script `scripts/add-language.php`); it also sets the `/<code>` prefix. |
| Disk almost full (under 1 GB) | Regenerable caches first: `npm cache clean --force`, `rm -rf ~/.npm/_npx`, `docker builder prune -af`. Then see the disk row above. Check what is big with `du -sh ~/.cache/* ~/.npm`. |
| Before is not pristine | Only if the variant lists `before.patches` (a declared test-support change, e.g. #3604037's form_test page). |

## Changing the viewer (`tools/compare/index.html`, `serve.mjs`)
- The same `index.html` is the local viewer and the GitHub Pages guide. An element that needs the server (frames, logins, axe, Lighthouse,
  checks) must carry `data-needs="live"`; server URLs are relative (no leading `/`). Then run `node scripts/build-cloud.mjs` and commit `cloud/`
  (CI fails if it is stale). Do not edit `cloud/` by hand.
- Optional extras default **off**; user choices live in `localStorage` only (`compare.prefs`). Never add accounts or server-side storage.
- The script injected into the proxied pages is a template literal in `serve.mjs`: double the backslashes in regexes, no backticks or `${}`.
- Verify with real input: `node tools/playwright/mirror-drag.mjs` (viewer must be running), plus `node scripts/doctor.mjs`.
- Cloud (DDEV Coder workspaces) is a **proposal on hold**: `docs/CLOUD-PLAN.md`. Do not build it or sign in to it without the user.

## Where results go

One directory per issue: `reports/issues/<nid>/`.

- `REPRODUCE.md`: how to reproduce, pinned and on latest core, what each outcome means, how to re-pin.
- `branches/*.patch` and `BRANCHES.md`: patches from the issue fork with source, tip, base, date; numbered `patch-N-*.patch` if stacked.
- `VALIDATION.md` and `EVIDENCE.md`: how it was validated, results with exact commits. DRAFT until a person has reviewed them.
- `STATUS-<date>.md`: related issues and review threads, dated. Statuses go stale; re-check on drupal.org.
- `playwright/`, `screenreader/`, `compare/`: generated, dated evidence. Each summary records the core commits.
- `ISSUE-COMMENT-DRAFT.md`: a draft for the human to post.

Reports are Markdown plus small artifacts. Do not commit large raw scan output (multi-MB JSON); summarise it and say where it lives.
Built zips go in `bundles/`.

## Rules for agents

1. **Do not edit the baseline.** If `git status` there shows tracked changes, stop and say so. One declared exception: a variant may list `before.patches` for a *test-support* change that must be the same on both sides (for example #3604037's `form_test` page); it is named in the variant and the issue's REPRODUCE.md, and is never code under test.
2. **Record the commit** (`git rev-parse --short HEAD`) of every environment behind every result, and the tool, browser and OS
   versions for manual tests. The walkthrough does this for you.
3. **Snapshot before anything destructive** on a site database (`ddev snapshot --name <label>`).
4. **Never post to drupal.org, push to any remote, or comment on an issue** without the user's explicit approval. Draft for review.
5. **Never put tokens or passwords in this repository**, in chat, or in commands. Use an environment variable or a `chmod 600`
   file outside the repo. Log in with the one-time link from `ddev drupal login`, not by typing a password into a form.
6. **Do not add Drush or other dependencies** to a core checkout's `composer.json`. Use `core/scripts/dr` or the add-on.
7. **Testing tools and scope:** see `docs/TESTING-TOOLS.md`. A synthetic Guidepup virtual screen reader is the agreed standard for
   comparing a change; real VoiceOver/NVDA passes are out of scope unless the user asks.
8. **Say what was not verified.** Automated results do not replace a person's keyboard pass; use real (trusted) input, not
   script-generated events, for anything about focus or activation. Evidence stays DRAFT until a person has reviewed it.
9. **When a result looks wrong, find the cause before reporting it.** (Examples from this lab: a "fail" caused by a script click, a
   test error caused by a missing `core/.env`, noise in the diff caused by timestamps.)
10. **AI-assisted disclosure** on commits and drafted comments.
11. Do not copy code from external projects without a compatible licence and attribution. Dependencies (Playwright, axe-core,
    Guidepup, jsdom) are installed from npm, not vendored.

## Teardown

    cd envs/<name> && ddev delete --omit-snapshot --yes
    git -C envs/core.git worktree remove --force ../<name>

The evidence stays in `reports/`.
