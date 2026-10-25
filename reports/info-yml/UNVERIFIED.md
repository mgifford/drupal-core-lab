# What this investigation could not verify

DRAFT until a person has reviewed it. Everything in the other reports was measured in this lab, or read in core's source at
the commit in [RESULTS.md](RESULTS.md). The items below were not, and no report claims them.

| Item | Why not | What would verify it |
|---|---|---|
| Status of drupal.org issues #3190825, #1606606, #2429221, #2558645, #2057259 and #2594937 | drupal.org was unreachable from the lab container. Only the issues pasted into the session (#2730807, #3451701, #3123537, #3616275, #3490347) were read. | Read each issue page. |
| Real Libraries releases | The `libraries-tarball` fixture models libraries #3190825. Real release files were not read. | Download the affected Libraries releases and compare their `tests/` info files. |
| The drupal.org packager | The `packager-*` fixtures model what the packager appends to info files. Real packaged releases were not compared. | Diff an info file in a packaged release with the same file in git. |
| Web servers | Only PHP's built-in server ran. Apache, nginx and PHP-FPM did not. | Run the matrix behind each. |
| Databases | SQLite only. MySQL, MariaDB and PostgreSQL did not run. | Install the worker sites on each. |
| OPcache and APCu | OPcache was off, so a rewritten file was never served from a stale cache. APCu was not loaded. | Run the warm-page observations with OPcache on, including `validate_timestamps=0`. |
| PHP versions | PHP 8.5.12 only (core `main` requires 8.5). | Repeat on later 8.5 releases. |
| PECL yaml versions | 2.3.0 only. | Repeat with other releases. |
| Contributed release packages | The false-positive check used six projects' GitHub development branches. drupal.org release packages were unreachable. | Run `false-positives` on release packages. |
| DDEV and macOS | Not tried. | Run the README steps there. |
| The web installer | Sites were installed from the command line. `install.php` did not run with a broken file present. | Add an installer observation. |
| The deploy-gate examples on GitHub | Their two `ex:validate` steps ran as written in a scratch site ([DEPLOY-GATE.md](DEPLOY-GATE.md)). The checkout, setup-php and composer install steps did not run, and nothing ran on GitHub. | Use the example in a site repository. |
| Applying the patch through Composer | A site applying `ex-validate.patch` with cweagans/composer-patches was not tried. | Try it on a drupal/recommended-project site. |
| Drupal 11 | The target is 12.x `main`. The patch was not tried on 11.x. | Apply it to 11.x and run the same checks. |
| Package Manager | Phase 4 is a design note only ([PHASE4-PACKAGE-MANAGER.md](PHASE4-PACKAGE-MANAGER.md)). | Implement it and add a kernel test. |
| Existing drupal.org issues for the drafts | [ISSUE-SUMMARY.md](ISSUE-SUMMARY.md) and the five [issue-drafts/](issue-drafts/) were not checked against existing issues: drupal.org was unreachable. | Search drupal.org before filing each one. |
| The `info-yml-theme-incompatible` variant with DDEV | The lab container has no DDEV. Only `setup.mjs --check-patches`, `setup.mjs --checkout-only`, and the recipe with its `apply.sh` on a Standard site of the same core were run ([variants/theme-incompatible/README.md](variants/theme-incompatible/README.md)). | Run `node tools/compare/setup.mjs info-yml-theme-incompatible` and the two commands in that README. |
| Proposed patches other than the demo | The variant tooling was tested with one small patch on themes only ([variants/](variants/)). | Run each proposed patch as a variant. |
| Review by a person | Every report is a draft. | Review. |

Resolved during the work:

- The CI workflow on GitHub. Its first run, on pull request [mgifford/drupal-core-lab#57](https://github.com/mgifford/drupal-core-lab/pull/57) at `0ad0d46` (2026-10-24, GitHub Actions job 120742943563),
  passed all 13 steps in about 6 minutes, with the real apt, PECL, Composer and GitHub downloads. Each step exits non-zero on
  any failure. The job's full log could not be read from the lab: its storage host is blocked here.
- The core PHP file count. Early runs counted 5392 and 5393 PHP files in core, later runs 4900. The extra files were
  PHPStan's cache in the ignored `core/phpstan-tmp/` (493 generated PHP files). 4900 matches git's own file list with the same
  exclusions. `false-positives` now records any untracked or ignored files under the checked core.
