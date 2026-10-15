# Environments: baseline and patched, side by side

Moved out of `AGENTS.md` on 2026-10-15 so that file, which every session loads, stays short (AI-usage option C: scope the starting context). The text is unchanged except where noted.


Never switch one checkout between "before" and "after". One worktree per variant, each its own DDEV project:

    envs/core.git/                one shared (shallow) clone of upstream core; setup.mjs creates it
    envs/baseline-<...>/          worktree at the core commit. NEVER EDITED.
    envs/issue-<...>/             the same core plus the issue's patches

Both run the same PHP, theme and modules, so the only difference is the code under test. Keep two or three DDEV projects running at
most (`ddev stop` the rest). Sites use `admin` / `admin`, so keep them private: local, or an owner-only Coder workspace.

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

## How an environment is made (what `setup.mjs` does)
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

## Fallback: manual setup (verified 2026-10-01, MariaDB)
Use only if `setup.mjs` is not usable. `core/scripts/dr install` is SQLite-only; for MariaDB use `scripts/site-install.php`
(Drupal's installer API; creates `admin`/`admin`): copy it into the environment's `.agents/scripts/` and run
`SITE_NAME="<label>" ddev exec php .agents/scripts/site-install.php`. To reset: snapshot, drop and recreate the `db` database, remove
`sites/default/files` and `sites/default/settings.php`, `ddev restart`, install again.


## Teardown

    cd envs/<name> && ddev delete --omit-snapshot --yes
    git -C envs/core.git worktree remove --force ../<name>

The evidence stays in `reports/`.
