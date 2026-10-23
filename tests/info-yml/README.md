# info.yml lab: what a broken extension file does to a Drupal site

Repeatable tests for one question: can a malformed `.info.yml` file, or a PHP parse error in an extension, break a Drupal
site, including when the extension is not installed? Results are in [reports/info-yml/](../../reports/info-yml/); sources for
every claim about core are in [reports/info-yml/sources/](../../reports/info-yml/sources/README.md).

This is not a Before/After comparison of a core patch, so it does not use the Lab viewer or `tools/compare/variants.json`.
Core is unpatched. Drush is not used: core's own commands stand in for it.

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
| `../../scripts/info-yml-repro.mjs` | The runner. |

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
| `drush en <another module>` | `core/scripts/dr recipe tests/info-yml/recipes/install_syslog` |
| `drush updb` | `GET /update.php/selection` (lists pending updates; nothing is run) |

The Update Manager install and update forms are not tested: they were removed in Drupal 11.1.0
(`core/modules/update/src/Form/UpdateManagerInstall.php` on 10.6.x: "deprecated in drupal:10.4.0 and is removed from
drupal:11.1.0"), so libraries #3190825's path does not exist on Drupal 12.
