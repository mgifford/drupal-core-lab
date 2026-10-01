# Trial: justafish/ddev-drupal-core-dev on baseline-main (2026-10-01)

Environment: DDEV 1.25.3, PHP 8.5.7, Drupal 12.0-dev at upstream `d29add7`,
macOS, Docker Desktop. Add-on: https://github.com/justafish/ddev-drupal-core-dev

## Result: works
| Check | Result |
|---|---|
| `ddev add-on get justafish/ddev-drupal-core-dev` | Installs: `drupal`, `phpunit`, `nightwatch` commands, a Chrome container, a `core-dev/` Symfony console |
| `ddev drupal list` | install, uninstall, login, cache, module:install, lint:{cspell,css,js,phpcs,phpstan}, test, test:browser |
| `ddev drupal install standard` | Installed in about 2 s (SQLite, no db container) |
| `ddev drupal module:install inline_form_errors` | IFE enabled (verified) |
| `ddev drupal login` | one-time link for user 1 |
| `ddev phpunit core/modules/inline_form_errors/tests/src/Unit` | OK, 45 assertions |
| `ddev phpunit <FunctionalJavascript test>` | Runs in the add-on's Chrome |

## Findings
1. **Flaky upstream test.** `core/modules/inline_form_errors/tests/src/FunctionalJavascript/FormErrorHandlerCKEditor5Test::testFragmentLink`
   failed 2 of 6 runs on pristine upstream (element `#cke_edit-body-0-value`
   not found after clicking an error link) and passed 4. It exercises the same
   fragment-link path as #3619127. A fix there should not be blamed on a patch.
2. **Setup is `ddev config --omit-containers=db --disable-settings-management`**
   first. This means SQLite and no MariaDB. Fine for most tests; check before
   evaluating anything database-engine specific.
3. **`ddev drupal install` prints a random admin password.** Use
   `ddev drupal login` for access.
4. **Moving a DDEV project directory breaks its Mutagen sync.** Symptoms:
   "unable to flush session", container name conflicts. Fix: `ddev stop`, remove
   leftover containers, `ddev mutagen reset`, then a single `ddev start`.
   Do not run overlapping `ddev` commands against one project.
5. **Remove a previously hand-installed Selenium add-on first.** Files copied by
   hand are not known to `ddev add-on remove` and clash with the add-on's own
   Chrome compose file. Delete them manually.
6. First `ddev start` after changing config rebuilds the web image (about 3 min).
7. `ddev add-on list --installed` reported none even though files were present
   (the install was interrupted by a restart error). `ddev drupal list` is the
   reliable check.

## Not verified
Nightwatch, the lint commands, `ddev drupal uninstall` followed by reinstall,
Firefox, and running two environments at once.
