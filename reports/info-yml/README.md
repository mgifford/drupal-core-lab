# info.yml investigation: results

What a malformed `.info.yml` file, or a PHP parse error in an extension, does to a Drupal 12 site (core `main`), measured with
the fixtures and runner in [tests/info-yml/](../../tests/info-yml/README.md). **DRAFT until a person has reviewed it.**

| File | What it is |
|---|---|
| [RESULTS.md](RESULTS.md) | Phase 1 tables: every case, placement and observation, compared with a valid file in the same place; versions recorded at the top. |
| [results.json](results.json) | The same, machine-readable, with every HTTP status, command exit code, visible message, logged exception and baseline. |
| [parser-sweep.json](parser-sweep.json) | Every fixture info file through core's `InfoParserDynamic` alone, with Symfony YAML and with PECL YAML. |
| [php-check-methods.json](php-check-methods.json) | `php -l`, `token_get_all(TOKEN_PARSE)` and `opcache_compile_file()` on the same broken PHP. |
| [feed-control-3451701.json](feed-control-3451701.json) | Control for #3451701: an invalid `core_compatibility` in release-history data, fetched by cron. |
| [traces/](traces/) | Backtraces for the main failure paths, from `node scripts/info-yml-repro.mjs trace`. |
| [profile-recovery.json](profile-recovery.json) | Recovering a site whose installed profile's info file was renamed (the `system.profile.files` state). |
| [patches/ex-validate.patch](patches/ex-validate.patch) | Phase 2: the core patch with the linter (`ExtensionFileValidator`, `core/scripts/dr ex:validate`, tests). |
| [LINT.md](LINT.md) | Phase 3: the linter on every fixture, with each parser, against what the fixture did to a site in Phase 1. |
| [FALSE-POSITIVES.md](FALSE-POSITIVES.md) | Phase 3: the linter on core and six contributed projects, which work: no errors. |
| [PLANTED.md](PLANTED.md) | Phase 3: errors planted in real core files, in full and `--changed` runs: each reported, nothing else. |
| [DEPLOY-GATE.md](DEPLOY-GATE.md) | Phase 3: the GitHub Actions and Composer examples, run in a scratch site with the Composer project layout. |
| [variants/](variants/) | Proposed core patches measured with the same fixtures; each folder has its patch, results and `COMPARE.md`. |
| [PHASE4-PACKAGE-MANAGER.md](PHASE4-PACKAGE-MANAGER.md) | Phase 4, design only: the same checks before Package Manager applies a stage. |
| [ISSUE-SUMMARY.md](ISSUE-SUMMARY.md) | A draft drupal.org issue summary, from the measured results. Not posted. |
| [UNVERIFIED.md](UNVERIFIED.md) | What this investigation could not verify. |
| [sources/README.md](sources/README.md) | Every issue and commit relied on, and where each fact came from. |

## Correction, and what core's install command showed

The first Phase 1 runs installed extensions from the UI only, and missed core's own install command, `core/scripts/dr ex:install`
(`core/lib/Drupal/Core/Extension/Command/ExtensionInstallCommand.php`). Observations `exin_self` (install the fixture extension)
and `exin_other` (install `syslog`) were added; each also requests a page, then runs `cache:rebuild` and requests it again.
They found these, on 12.x `main` (rows in [RESULTS.md](RESULTS.md)):

- `cvr-incompatible/theme`: the command installs a theme whose `core_version_requirement` excludes the running core. The UI
  does not offer it. `ThemeInstaller::getThemesToInstall()` has no `core_incompatible` check; `ModuleInstaller.php:119-121` has
  one for modules. The variant [variants/theme-incompatible/](variants/theme-incompatible/COMPARE.md) adds the check: of 624
  results, this one alone changes, to "refused".
- `dependencies-string/theme` and `spacing-list-no-space/theme` (`regions` is a string): the command records the theme as
  installed, then dies with a TypeError in `Theme::listAllRegions()` (`Theme.php:48-53`). The next `cache:rebuild` exits 255. The
  UI does not offer these themes (`SystemController.php:277`).
- `php-syntax-error/module`: the UI and the command both record the module as installed, then die on the parse error. The next
  page works; the next `cache:rebuild` exits 255.
- `php-syntax-error` in an installed module or profile: the command answers 'There are no commands defined in the "ex"
  namespace', because the site cannot boot to register it. The message does not name the broken file.
- `name-not-string`: the command installs a module whose `name` is a list. It prints "Array (infofix)" and logs
  "Array to string conversion" (`ExtensionInstallCommand.php:153`, `225`).

The linter reports a finding for each of these files ([LINT.md](LINT.md)).

