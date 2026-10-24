# info.yml lab: what a broken extension file does to a Drupal site

Repeatable tests for one question: can a malformed `.info.yml` file, or a PHP parse error in an extension, break a Drupal
site, including when the extension is not installed? Results are in [reports/info-yml/](../../reports/info-yml/); sources for
every claim about core are in [reports/info-yml/sources/](../../reports/info-yml/sources/README.md).

This is not a Before/After comparison in the Lab viewer, so it does not use `tools/compare/variants.json`. Phase 1 runs on
unpatched core. Phase 3 checks a core patch that adds a linter (`core/scripts/dr ex:validate`), and named variants measure any
other proposed core patch with the same fixtures (see "Phase 3" below). Drush is not used: core's own commands stand in for it.

## What is here

| Path | What it is |
|---|---|
| `make-fixtures.mjs` | Writes `fixtures/` (one directory per case). `--check` fails if the committed fixtures differ from what it writes. |
| `fixtures/<case>/case.json` | The case: title, category, the kinds it applies to (module, theme, profile), files to remove, what reading core predicts. |
| `fixtures/<case>/<kind>/...` | The files to copy over a valid extension in `modules/custom`, `themes/custom` or `profiles/custom`. |
| `fixtures/_valid/<kind>/` | The valid extensions: `infofix`, `infofix_theme`, `infofix_profile`. |
| `fixtures/libraries-tarball/` | A Libraries-style project (libraries #3190825): `v1` (installed release), `v2` and `libfix-1.1.0.tar.gz` (a release whose `tests/` fixtures have no `type`). |
| `recipes/` | Recipes used to install the fixtures and one unrelated module (`syslog`). |
| `lib/parse-sweep.php` | Every fixture info file through core's `InfoParserDynamic`, no site needed. |
| `lib/php-check-methods.php` | `php -l`, `token_get_all(TOKEN_PARSE)` and `opcache_compile_file()` compared on broken PHP. |
| `lib/watchdog.php`, `lib/login-path.php`, `lib/uninstall-module.php` | Helpers for the runner: read dblog from SQLite, one-time login path, uninstall a module. |
| `deploy-gate/` | Examples for site repositories: a GitHub Actions workflow and Composer scripts that run `ex:validate` before a deployment. |
| `patches/` | Proposed core patches to measure as variants. `theme-core-incompatible.patch` tests the variant tooling on one finding. |
| `ci-local.sh` | Runs the steps of `.github/workflows/info-yml.yml` in the same `php:8.5-cli` image, on this machine. |
| `verify-issue-drafts.sh` | Runs the reproduction steps of the drafts in `reports/info-yml/issue-drafts/`, as written, on a worker site. |
| `../../scripts/info-yml-repro.mjs` | The runner. |
| `../../reports/info-yml/patches/ex-validate.patch` | The core patch with the linter: `ExtensionFileValidator`, the `ex:validate` command and their tests. |

## Reproduce

Needs: git, Node 20 or later, and a PHP CLI that the core branch accepts (core `main` needs PHP 8.5) with `pdo_sqlite` and
`gd`. The PECL YAML extension is optional; without it the "pecl" runs fail. No Docker, no DDEV, no Drush.
On the lab container PHP 8.5.12 was built from the `php-8.5.12` tag of https://github.com/php/php-src into `/opt/php85`,
with PECL yaml 2.3.0 from https://github.com/php/pecl-file_formats-yaml as a loadable extension. In DDEV, `php_version: "8.5"`
should work; that was not tried.

1. Get core and its dependencies (no Drush, and `composer.lock` is not changed):

        git clone --depth 1 --branch main https://git.drupalcode.org/project/drupal.git envs/info-yml-main
        cd envs/info-yml-main
        composer install --no-dev
        cd ../..

   The lab container used the GitHub mirror (https://github.com/drupal/drupal) because git.drupalcode.org was unreachable.

2. Build the worker sites and their database snapshots (about one minute; each worker is a hard-linked copy of the checkout with
   its own `sites/`, SQLite database and port, starting at 8890):

        LAB_PHP=/opt/php85/bin/php node scripts/info-yml-repro.mjs prepare --workers=3

3. Run everything (about an hour with three workers), or a part of it:

        LAB_PHP=/opt/php85/bin/php node scripts/info-yml-repro.mjs run --workers=3
        LAB_PHP=/opt/php85/bin/php node scripts/info-yml-repro.mjs run --cases=yaml-unquoted-colon --kinds=module --parsers=symfony

4. The parser-only checks (seconds, no site):

        LAB_PHP=/opt/php85/bin/php node scripts/info-yml-repro.mjs sweep
        /opt/php85/bin/php -n -d opcache.enable_cli=1 tests/info-yml/lib/php-check-methods.php

5. Find where an exception is thrown (prints every logged row with its backtrace):

        LAB_PHP=/opt/php85/bin/php node scripts/info-yml-repro.mjs trace --cases=yaml-unquoted-colon --kinds=module --placements=uninstalled --parsers=symfony --observations=modules

To apply one fixture by hand to any site: copy `fixtures/_valid/module/infofix` into `modules/custom/`, then copy
`fixtures/<case>/module/infofix` over it (and delete the files that `case.json` lists under `remove`).

## How a run works

Each observation restores a database snapshot, writes the valid extension files that snapshot expects, applies one fixture,
then does exactly one thing: one request, or one command. It reads the HTTP status and the messages on the page, a command's
exit code and output, and the exception class and message from the dblog rows and the PHP error log written meanwhile. The
same observation with the valid extension in the same place is the baseline; a verdict says only how the fixture changed the
result. The PHP server and commands run with `-n` and explicit settings: errors hidden and logged, `zend.assertions=-1`, OPcache
off. The sites are private, local and disposable: the admin password is random and never printed, and logins use one-time links.

Drush equivalents used:

| Drush | Here |
|---|---|
| `drush cr` | `core/scripts/dr cache:rebuild` (`core/lib/Drupal/Core/Command/CacheRebuildCommand.php`, calls `drupal_rebuild()`) |
| `drush en <the broken extension>` | the `/admin/modules` form, or the theme's Install link on `/admin/appearance`; the recipe command does not see an extension added since the last cache rebuild (`ExtensionAvailableConstraintValidator::extensionExists()` uses the cached list) |
| `drush en <the broken extension>` | also `core/scripts/dr ex:install <name> -y` (observation `exin_self`): core's own install command, aliases `exin`, `pm:install`, `pm:enable`, `enable`, `en` (`core/lib/Drupal/Core/Extension/Command/ExtensionInstallCommand.php:33-36`); it resets both extension lists first (lines 77-78), so it sees a newly added extension. Correction: the first Phase 1 runs missed this command and used only the UI; `exin_self` and `exin_other` were added afterwards |
| `drush en <another module>` | `core/scripts/dr recipe tests/info-yml/recipes/install_syslog`, and `core/scripts/dr ex:install syslog -y` (observation `exin_other`) |
| `drush updb` | `GET /update.php/selection` (lists pending updates; nothing is run) |

The Update Manager install and update forms are not tested: they were removed in Drupal 11.1.0
(`core/modules/update/src/Form/UpdateManagerInstall.php` on 10.6.x: "deprecated in drupal:10.4.0 and is removed from
drupal:11.1.0"), so libraries #3190825's path does not exist on Drupal 12.

## Phase 3: the linter, and other proposed patches

The linter is a core patch, [reports/info-yml/patches/ex-validate.patch](../../reports/info-yml/patches/ex-validate.patch), made on
the core commit recorded in [RESULTS.md](../../reports/info-yml/RESULTS.md). Apply it to a second checkout:

        git clone https://github.com/drupal/drupal envs/info-yml-patch && cd envs/info-yml-patch
        git checkout <the core commit> && git am ../../reports/info-yml/patches/ex-validate.patch
        composer install && cd ../..

Then, with no site (each writes a Markdown report and its JSON next to it in `reports/info-yml/`):

| Command | What it checks | Report |
|---|---|---|
| `lint` | Every fixture through `ex:validate`, with each parser, against what the fixture did to a site in Phase 1. | `LINT.md` |
| `false-positives` | Core and six contributed projects from GitHub: working code should give no errors. | `FALSE-POSITIVES.md` |
| `planted` | Errors planted in real core files, in a git worktree: each run must report exactly those, and nothing new. | `PLANTED.md` |
| `deploy-gate` | The `deploy-gate/` examples, run as written in a scratch site with the Composer project layout. | `DEPLOY-GATE.md` |

        LAB_PHP=/opt/php85/bin/php node scripts/info-yml-repro.mjs lint

`.github/workflows/info-yml.yml` runs the unit tests, `lint`, `planted` and `deploy-gate` on GitHub when these files change.

To measure another proposed core patch with the same fixtures (for example a drupal.org merge request, saved as a diff), make a
named variant. It gets its own core checkout (the baseline checkout plus the patch, committed), worker sites and report folder,
so the baseline results are never overwritten:

        node scripts/info-yml-repro.mjs variant --variant=<name> --patch=<file>
        LAB_PHP=/opt/php85/bin/php node scripts/info-yml-repro.mjs prepare --variant=<name> --workers=2
        LAB_PHP=/opt/php85/bin/php node scripts/info-yml-repro.mjs run --variant=<name> --workers=2 [filters]
        node scripts/info-yml-repro.mjs compare --variant=<name>

`compare` lists every result that differs from the baseline for the same scenario and observation, in
`reports/info-yml/variants/<name>/COMPARE.md`. Each verdict already compares the broken file with a valid file on the same core,
so a difference is the patch's effect on how a broken file behaves. `lint`, `planted`, `false-positives` and `deploy-gate` also take
`--variant=`, to check a variant that changes the linter itself (make it with `--base=envs/info-yml-patch`, so it starts from
the linter patch); they still compare with the baseline's Phase 1 results.

