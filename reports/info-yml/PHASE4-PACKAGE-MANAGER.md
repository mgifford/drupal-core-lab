# Phase 4 design note: checking extension files before Package Manager applies a stage

**Design only. Nothing here is implemented or tested.** DRAFT until a person has reviewed it. Line numbers are for core
`main` at `89df3a065deb` (the commit in [RESULTS.md](RESULTS.md)); PHP facts are for php-src `php-8.5.12`.

## The gap

Package Manager copies a Composer stage into the live code base. Phase 1 showed that one parser-rejected `.info.yml` file
anywhere in `modules/`, `themes/` or `profiles/` breaks cache rebuilds and cold-cache pages, installed or not
([RESULTS.md](RESULTS.md)). A contributed release with such a file, applied by Package Manager, would do the same.
Package Manager already inspects info files before applying: `DuplicateInfoFileValidator` subscribes to `PreApplyEvent`
(`core/modules/package_manager/src/Validator/DuplicateInfoFileValidator.php:67-70`) and reads the stage directory
(lines 31-34). It counts info files; it does not parse them.

## Proposal

A new validator in Package Manager, `ExtensionFilesValidator`, on `PreApplyEvent`, using the `extension.file_validator`
service from the ex:validate patch ([patches/ex-validate.patch](patches/ex-validate.patch)).

1. Find the stage's Drupal root: `$event->sandboxManager->getSandboxDirectory()` plus `PathLocator::getWebRoot()`
   (`PathLocator.php:75`), as `SandboxDatabaseUpdatesValidator::hasStagedUpdates()` does (lines 79-83).
2. Limit the check to what the stage changes. `ComposerInspector::getInstalledPackagesList()` (`ComposerInspector.php:290`)
   on the active and stage directories, then `InstalledPackagesList::getPackagesNotIn()` and
   `getPackagesWithDifferentVersionsIn()` (`InstalledPackagesList.php:70`, `88`), give the new and changed packages and their
   install paths.
3. Run `ExtensionFileValidator::findFiles()` on those paths, then `validateFound()`. Pass `include_tests` from the
   `extension_discovery_scan_tests` setting, so tests/ is checked exactly when discovery would read it.
4. Report each error with `$event->addError()` (`SandboxValidationEvent.php:51`). An error stops the apply; the live site is
   unchanged.
5. Raise some warnings to errors. The command warns where it cannot know what is installed: a missing base theme, a file
   name that discovery ignores. Here the site knows, so a warning on an installed extension becomes an error. That needs the
   extension's machine name on each violation (today the file path only), or a mapping from the info file name.

## Risks and limits

| Risk | Detail | Effect on the design |
|---|---|---|
| Package Manager is experimental and hidden | `lifecycle: experimental` and `hidden: true` (`package_manager.info.yml:6`, `9`); it depends on Update (line 8). | The validator reaches only sites that use Package Manager (today through contributed modules). The `ex:validate` command stays the main protection. |
| Web PHP may differ from CLI PHP | The validator runs in the web request. The checks run in-process: YAML parsing, `InfoParserDynamic` and `token_get_all()`. | An advantage: the PHP version, and whether PECL yaml is loaded, are those of the PHP that serves the site. A CLI check can differ from both. |
| `exec` or `proc_open()` may be disabled | Package Manager already refuses to run Composer without `proc_open()` (`ComposerValidator.php:41-42`). | No new requirement, as long as the validator does not run `php -l`. |
| `php -l` is not available from a web request | `PHP_BINARY` comes from the SAPI's executable location (php-src `main/main.c:452-480`). PHP-FPM sets it to its own `argv[0]` (`sapi/fpm/fpm/fpm_main.c:1765`), so it is the php-fpm binary. | Use only the in-process checks: parse errors are found, compile-time errors are not (see [php-check-methods.json](php-check-methods.json)). |
| Time | A stage can add thousands of PHP files. | Step 2 limits the check to new and changed packages; tokenizing is in-process. Not measured. |
| A file the stage leaves alone | The check sees only changed packages. A broken file already live is out of scope. | The status report, or `ex:validate` in a deploy gate, covers that case. |

## Questions for review

- Should a warning-only stage show its warnings at the apply step, or only on the status report?
- Should the validator live in Package Manager, or should core's extension system expose a "check these paths" API that
  Package Manager calls?

## How it would be tested

A kernel test with a stage fixture per Phase 1 case class: one parser-rejected file (an error stops the apply), one warning,
and one clean stage. Then the lab's variant tooling ([tests/info-yml/README.md](../../tests/info-yml/README.md), "Phase 3")
could measure the patched core, if a Package Manager observation is added to the runner.
