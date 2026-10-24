# info.yml Phase 1 results: what a broken info file does to a Drupal 12 site

Generated 2026-10-24T01:31:24.833Z by `node scripts/info-yml-repro.mjs`. Machine-readable: [results.json](results.json). Fixtures: [tests/info-yml/fixtures/](../../../../tests/info-yml/fixtures/). **DRAFT until a person has reviewed it.**

| | |
|---|---|
| Drupal | 12.0-dev at `8a3be6c3a399` (2026-10-24T01:24:58+00:00), "Variant theme-incompatible: theme-core-incompatible.patch", from https://github.com/drupal/drupal |
| PHP | 8.5.12 (/opt/php85/bin/php); PECL yaml 2.3.0; symfony/yaml v8.1.6 |
| Drush | not used (owner: git checkout of core, no Drush); core/scripts/dr and the UI stand in, see observations |
| Server | PHP built-in web server (php -S) with core/.ht.router.php, SQLite database, one worker process |
| OS, Node | Linux 6.18.44-fc-v153 x64; Node v22.22.0 |
| Lab commit | f58b174 |

## How to read the tables

Each observation starts from a restored database snapshot with the fixture freshly applied; none depends on another. Each is compared with a baseline: the same observation with the valid extension in the same place.

- `ok`: no difference from the valid file.
- `degraded`: the page or command completed, but an error was shown or logged that the valid file does not produce.
- `NNN Class`: HTTP status NNN (500 and above where the valid file gave 200) and the short name of the exception that was logged.
- `error (exit N)`: a command failed where it succeeds with the valid file.
- `cr`: the cache rebuild, then `; then` the anonymous request that follows it.
- `recovery`: `not broken` means the cache rebuild and the following request both still worked with the fixture in place, so there was nothing to recover from.

Observations:

- `anon`: GET /user/login as an anonymous visitor, with no cache rebuild and warm caches (the configured front page, /admin/welcome, needs a login)
- `anon_cold`: empty every cache table (as a deploy or a cache backend restart does, without running Drupal's rebuild), then GET /user/login as an anonymous visitor
- `modules`: GET /admin/modules
- `appearance`: GET /admin/appearance
- `updates`: GET /admin/reports/updates
- `status`: GET /admin/reports/status
- `updatephp`: GET /update.php/selection (stands in for drush updb: it lists pending updates; no update is run)
- `cr`: core/scripts/dr cache:rebuild (stands in for drush cr), then GET /user/login
- `en_self`: install the fixture extension itself from the UI: tick it on /admin/modules and submit, or follow the theme's Install link on /admin/appearance (stands in for drush en; the recipe command cannot see an extension added since the last cache rebuild)
- `en_other`: core/scripts/dr recipe tests/info-yml/recipes/install_syslog: install an unrelated core module with a recipe
- `exin_self`: core/scripts/dr ex:install <the fixture extension> -y: core's own install command (aliases exin, pm:install, pm:enable, enable, en; it resets the extension lists first), the closest equivalent of drush en; then one anonymous request to /user/login, then cache:rebuild and the request again
- `exin_other`: core/scripts/dr ex:install syslog -y: install an unrelated core module with core's install command; then one anonymous request to /user/login, then cache:rebuild and the request again
- `recovery`: break the site (cache:rebuild), remove the fixture (delete it, or put the valid files back if it was installed), then GET /user/login without and with cache:rebuild

Placements:

- `module/uninstalled`: modules/custom/infofix, not installed (Standard site; the installer installs Update by default)
- `module/uninstalled-no-update`: as uninstalled, on the same site after uninstalling the Update module
- `module/installed`: modules/custom/infofix, installed before the file was broken
- `theme/uninstalled`: themes/custom/infofix_theme, not installed (Standard site; the installer installs Update by default)
- `theme/uninstalled-no-update`: as uninstalled, on the same site after uninstalling the Update module
- `theme/installed`: themes/custom/infofix_theme, installed and set as the default theme before the file was broken
- `profile/uninstalled`: profiles/custom/infofix_profile on a Standard site (a profile that is not the site's profile)
- `profile/installed`: profiles/custom/infofix_profile, the profile the site was installed with (it installs node, block, dblog and update, and no page cache)
- `libraries/contrib`: libfix v2 (with tests/ fixtures that have no type) copied into modules/contrib, not installed
- `libraries/contrib-scan-tests`: as contrib, with $settings['extension_discovery_scan_tests'] = TRUE
- `libraries/updated`: libfix v1 installed, then its files replaced by v2 (what an update does to the code base)
- `libraries/updated-scan-tests`: as updated, with $settings['extension_discovery_scan_tests'] = TRUE

## Summary (Symfony YAML)

Per case and placement: how many observations (recovery not counted) differ from the valid file in the same place. `cr fails`: core/scripts/dr cache:rebuild fails. `cold: visitors 500`: an anonymous visitor gets an error after the cache tables are emptied. `warm: visitors 500`: the same with warm caches. `does not recover`: the site still fails after the fixture is removed and caches are rebuilt. Details per observation follow.

| case | theme/uninstalled |
|---|---|
| core-and-cvr | no effect |
| cvr-incompatible | 2 of 12 differ |
| cvr-unparseable | 11 of 12 differ; cr fails; cold: visitors 500 |
| dependencies-string | 2 of 12 differ |
| dependency-missing | 2 of 12 differ |
| description-null | no effect |
| filename-backup-copy | no effect |
| filename-d7-info | 2 of 12 differ |
| filename-hyphen | 2 of 12 differ |
| filename-info-yaml | 2 of 12 differ |
| filename-uppercase | 2 of 12 differ |
| lifecycle-deprecated-no-link | 11 of 12 differ; cr fails; cold: visitors 500 |
| lifecycle-invalid | 11 of 12 differ; cr fails; cold: visitors 500 |
| missing-cvr-core-8x | 11 of 12 differ; cr fails; cold: visitors 500 |
| missing-cvr | 11 of 12 differ; cr fails; cold: visitors 500 |
| missing-name | 11 of 12 differ; cr fails; cold: visitors 500 |
| missing-type | 11 of 12 differ; cr fails; cold: visitors 500 |
| name-not-string | 3 of 12 differ |
| packager-duplicate-version | 11 of 12 differ; cr fails; cold: visitors 500 |
| packager-no-final-newline | 11 of 12 differ; cr fails; cold: visitors 500 |
| php-syntax-error | no effect |
| spacing-compact-list | no effect |
| spacing-key-indented | 11 of 12 differ; cr fails; cold: visitors 500 |
| spacing-list-no-space | 2 of 12 differ |
| spacing-list-over-indented | 11 of 12 differ; cr fails; cold: visitors 500 |
| spacing-list-under-indented | 11 of 12 differ; cr fails; cold: visitors 500 |
| spacing-nbsp-after-colon | 11 of 12 differ; cr fails; cold: visitors 500 |
| spacing-no-space-after-colon | 11 of 12 differ; cr fails; cold: visitors 500 |
| spacing-tab-after-colon | no effect |
| spacing-trailing-whitespace | no effect |
| theme-base-theme-missing-target | 2 of 12 differ |
| theme-libraries-empty | no effect |
| theme-missing-base-theme | 11 of 12 differ; cr fails; cold: visitors 500 |
| type-typo | 2 of 12 differ |
| version-non-scalar | 11 of 12 differ; cr fails; cold: visitors 500 |
| version-numeric | no effect |
| yaml-bom | 11 of 12 differ; cr fails; cold: visitors 500 |
| yaml-crlf | no effect |
| yaml-duplicate-key | 11 of 12 differ; cr fails; cold: visitors 500 |
| yaml-empty-file | 11 of 12 differ; cr fails; cold: visitors 500 |
| yaml-leading-asterisk | 11 of 12 differ; cr fails; cold: visitors 500 |
| yaml-leading-at | 11 of 12 differ; cr fails; cold: visitors 500 |
| yaml-non-utf8 | 11 of 12 differ; cr fails; cold: visitors 500 |
| yaml-scalar-only | 11 of 12 differ; cr fails; cold: visitors 500 |
| yaml-tab-indent | 11 of 12 differ; cr fails; cold: visitors 500 |
| yaml-top-level-list | 11 of 12 differ; cr fails; cold: visitors 500 |
| yaml-unquoted-colon | 11 of 12 differ; cr fails; cold: visitors 500 |
| yaml-unterminated-quote | 11 of 12 differ; cr fails; cold: visitors 500 |

## theme/uninstalled (Symfony YAML)

| case | anon | anon_cold | modules | appearance | updates | status | updatephp | cr | en_self | en_other | exin_self | exin_other | recovery |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| core-and-cvr | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | not broken |
| cvr-incompatible | ok | ok | ok | ok | ok | ok | ok | ok | not offered | ok | refused (exit 1) | ok | not broken |
| cvr-unparseable | ok | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | error (exit 1) InfoParserException; then ok | error InfoParserException | error (exit 1) InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | recovers without rebuild |
| dependencies-string | ok | ok | ok | ok | ok | ok | ok | ok | not offered | ok | error (exit 255) TypeError; after cr: cr exit 255, 200 TypeError | ok | not broken |
| dependency-missing | ok | ok | ok | ok | ok | ok | ok | ok | not offered | ok | refused (exit 1) | ok | not broken |
| description-null | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | not broken |
| filename-backup-copy | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | not broken |
| filename-d7-info | ok | ok | ok | ok | ok | ok | ok | ok | not offered | ok | refused (exit 1) | ok | not broken |
| filename-hyphen | ok | ok | ok | ok | ok | ok | ok | ok | not offered | ok | refused (exit 1) | ok | not broken |
| filename-info-yaml | ok | ok | ok | ok | ok | ok | ok | ok | not offered | ok | refused (exit 1) | ok | not broken |
| filename-uppercase | ok | ok | ok | ok | ok | ok | ok | ok | not offered | ok | refused (exit 1) | ok | not broken |
| lifecycle-deprecated-no-link | ok | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | error (exit 1) InfoParserException; then ok | error InfoParserException | error (exit 1) InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | recovers without rebuild |
| lifecycle-invalid | ok | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | error (exit 1) InfoParserException; then ok | error InfoParserException | error (exit 1) InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | recovers without rebuild |
| missing-cvr-core-8x | ok | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | error (exit 1) InfoParserException; then ok | error InfoParserException | error (exit 1) InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | recovers without rebuild |
| missing-cvr | ok | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | error (exit 1) InfoParserException; then ok | error InfoParserException | error (exit 1) InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | recovers without rebuild |
| missing-name | ok | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | error (exit 1) InfoParserException; then ok | error InfoParserException | error (exit 1) InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | recovers without rebuild |
| missing-type | ok | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | error (exit 1) InfoParserException; then ok | error InfoParserException | error (exit 1) InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | recovers without rebuild |
| name-not-string | ok | ok | ok | 500 TypeError | ok | ok | ok | ok | error TypeError | ok | degraded (exit 0) | ok | not broken |
| packager-duplicate-version | ok | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | error (exit 1) InfoParserException; then ok | error InfoParserException | error (exit 1) InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | recovers without rebuild |
| packager-no-final-newline | ok | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | error (exit 1) InfoParserException; then ok | error InfoParserException | error (exit 1) InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | recovers without rebuild |
| php-syntax-error | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | not broken |
| spacing-compact-list | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | not broken |
| spacing-key-indented | ok | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | error (exit 1) InfoParserException; then ok | error InfoParserException | error (exit 1) InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | recovers without rebuild |
| spacing-list-no-space | ok | ok | ok | ok | ok | ok | ok | ok | not offered | ok | error (exit 255) TypeError; after cr: cr exit 255, 200 TypeError | ok | not broken |
| spacing-list-over-indented | ok | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | error (exit 1) InfoParserException; then ok | error InfoParserException | error (exit 1) InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | recovers without rebuild |
| spacing-list-under-indented | ok | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | error (exit 1) InfoParserException; then ok | error InfoParserException | error (exit 1) InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | recovers without rebuild |
| spacing-nbsp-after-colon | ok | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | error (exit 1) InfoParserException; then ok | error InfoParserException | error (exit 1) InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | recovers without rebuild |
| spacing-no-space-after-colon | ok | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | error (exit 1) InfoParserException; then ok | error InfoParserException | error (exit 1) InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | recovers without rebuild |
| spacing-tab-after-colon | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | not broken |
| spacing-trailing-whitespace | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | not broken |
| theme-base-theme-missing-target | ok | ok | ok | ok | ok | ok | ok | ok | not offered | ok | refused (exit 1) | ok | not broken |
| theme-libraries-empty | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | not broken |
| theme-missing-base-theme | ok | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | error (exit 1) InfoParserException; then 500 InfoParserException | error InfoParserException | error (exit 1) InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 500 InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 500 InfoParserException | recovers without rebuild |
| type-typo | ok | ok | ok | ok | ok | ok | ok | ok | not offered | ok | refused (exit 1) | ok | not broken |
| version-non-scalar | ok | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | error (exit 1) InfoParserException; then ok | error InfoParserException | error (exit 1) InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | recovers without rebuild |
| version-numeric | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | not broken |
| yaml-bom | ok | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | error (exit 1) InfoParserException; then ok | error InfoParserException | error (exit 1) InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | recovers without rebuild |
| yaml-crlf | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | not broken |
| yaml-duplicate-key | ok | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | error (exit 1) InfoParserException; then ok | error InfoParserException | error (exit 1) InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | recovers without rebuild |
| yaml-empty-file | ok | 500 TypeError | 500 TypeError | 500 TypeError | 500 TypeError | 500 TypeError | 500 TypeError | error (exit 255) TypeError; then ok | error TypeError | error (exit 255) TypeError | error (exit 255) TypeError; after cr: cr exit 255, 200 TypeError | error (exit 255) TypeError; after cr: cr exit 255, 200 TypeError | recovers without rebuild |
| yaml-leading-asterisk | ok | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | error (exit 1) InfoParserException; then ok | error InfoParserException | error (exit 1) InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | recovers without rebuild |
| yaml-leading-at | ok | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | error (exit 1) InfoParserException; then ok | error InfoParserException | error (exit 1) InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | recovers without rebuild |
| yaml-non-utf8 | ok | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | error (exit 1) InfoParserException; then ok | error InfoParserException | error (exit 1) InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | recovers without rebuild |
| yaml-scalar-only | ok | 500 TypeError | 500 TypeError | 500 TypeError | 500 TypeError | 500 TypeError | 500 TypeError | error (exit 255) TypeError; then ok | error TypeError | error (exit 255) TypeError | error (exit 255) TypeError; after cr: cr exit 255, 200 TypeError | error (exit 255) TypeError; after cr: cr exit 255, 200 TypeError | recovers without rebuild |
| yaml-tab-indent | ok | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | error (exit 1) InfoParserException; then ok | error InfoParserException | error (exit 1) InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | recovers without rebuild |
| yaml-top-level-list | ok | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | error (exit 1) InfoParserException; then ok | error InfoParserException | error (exit 1) InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | recovers without rebuild |
| yaml-unquoted-colon | ok | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | error (exit 1) InfoParserException; then ok | error InfoParserException | error (exit 1) InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | recovers without rebuild |
| yaml-unterminated-quote | ok | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | 500 InfoParserException | error (exit 1) InfoParserException; then ok | error InfoParserException | error (exit 1) InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | error (exit 1) InfoParserException; after cr: cr exit 1, 200 InfoParserException | recovers without rebuild |

## Where PECL YAML differs from Symfony YAML

No PECL YAML runs recorded.

## Exceptions by case

The first exception logged in any observation of the case, per parser.

| case | parser | exception class | message |
|---|---|---|---|
| cvr-unparseable | symfony | `Drupal\Core\Extension\InfoParserException` | The 'core_version_requirement' constraint (^12 \|\|\| banana) is not a valid value |
| cvr-unparseable | symfony | `Drupal\Core\Extension\InfoParserException` | The 'core_version_requirement' constraint (^12 \|\|\| banana) is not a valid value in themes/custom/infofix_theme/infofix_theme.info.yml |
| dependencies-string | symfony | `TypeError` | array_map(): Argument #2 ($array) must be of type array, string given |
| lifecycle-deprecated-no-link | symfony | `Drupal\Core\Extension\InfoParserException` | Extension Info fixture theme (themes/custom/infofix_theme/infofix_theme.info.yml) has 'lifecycle: deprecated' but is missing a 'lifecycle_link' entry. |
| lifecycle-invalid | symfony | `Drupal\Core\Extension\InfoParserException` | 'lifecycle: beta' is not valid |
| lifecycle-invalid | symfony | `Drupal\Core\Extension\InfoParserException` | 'lifecycle: beta' is not valid in themes/custom/infofix_theme/infofix_theme.info.yml. Valid values are: 'experimental', 'stable', 'deprecated', 'obsolete'. |
| missing-cvr-core-8x | symfony | `Drupal\Core\Extension\InfoParserException` | The 'core_version_requirement' key must be present |
| missing-cvr-core-8x | symfony | `Drupal\Core\Extension\InfoParserException` | The 'core_version_requirement' key must be present in themes/custom/infofix_theme/infofix_theme.info.yml |
| missing-cvr | symfony | `Drupal\Core\Extension\InfoParserException` | The 'core_version_requirement' key must be present |
| missing-cvr | symfony | `Drupal\Core\Extension\InfoParserException` | The 'core_version_requirement' key must be present in themes/custom/infofix_theme/infofix_theme.info.yml |
| missing-name | symfony | `Drupal\Core\Extension\InfoParserException` | Missing required keys (name) |
| missing-name | symfony | `Drupal\Core\Extension\InfoParserException` | Missing required keys (name) in themes/custom/infofix_theme/infofix_theme.info.yml |
| missing-type | symfony | `Drupal\Core\Extension\InfoParserException` | Missing required keys (type) |
| missing-type | symfony | `Drupal\Core\Extension\InfoParserException` | Missing required keys (type) in themes/custom/infofix_theme/infofix_theme.info.yml |
| name-not-string | symfony | `TypeError` | strcasecmp(): Argument #2 ($string2) must be of type string, array given |
| packager-duplicate-version | symfony | `Drupal\Core\Extension\InfoParserException` | Unable to parse themes/custom/infofix_theme/infofix_theme.info.yml Duplicate key "version" detected at line 13 (near "version: '1.0.0'"). |
| packager-no-final-newline | symfony | `Drupal\Core\Extension\InfoParserException` | The 'core_version_requirement' constraint (^12# Information added by Drupal.org packaging script on 2026-10-01) is not a valid value |
| packager-no-final-newline | symfony | `Drupal\Core\Extension\InfoParserException` | The 'core_version_requirement' constraint (^12# Information added by Drupal.org packaging script on 2026-10-01) is not a valid value in themes/custom/infofix_theme/infofix_theme.info.yml |
| spacing-key-indented | symfony | `Drupal\Core\Extension\InfoParserException` | Unable to parse themes/custom/infofix_theme/infofix_theme.info.yml Unable to parse at line 2 (near " type: theme"). |
| spacing-list-no-space | symfony | `TypeError` | array_map(): Argument #2 ($array) must be of type array, string given |
| spacing-list-over-indented | symfony | `Drupal\Core\Extension\InfoParserException` | Unable to parse themes/custom/infofix_theme/infofix_theme.info.yml A colon cannot be used in an unquoted mapping value at line 9 (near " footer: Footer"). |
| spacing-list-under-indented | symfony | `Drupal\Core\Extension\InfoParserException` | Unable to parse themes/custom/infofix_theme/infofix_theme.info.yml Indentation problem at line 9 (near "   footer: Footer"). |
| spacing-list-under-indented | symfony | `Drupal\Core\Extension\InfoParserException` | Unable to parse themes/custom/infofix_theme/infofix_theme.info.yml Indentation problem at line 9 (near " footer: Footer"). |
| spacing-nbsp-after-colon | symfony | `Drupal\Core\Extension\InfoParserException` | Unable to parse themes/custom/infofix_theme/infofix_theme.info.yml Unable to parse at line 2 (near "type: theme"). |
| spacing-nbsp-after-colon | symfony | `Drupal\Core\Extension\InfoParserException` | Unable to parse themes/custom/infofix_theme/infofix_theme.info.yml Unable to parse at line 2 (near "type: theme"). |
| spacing-no-space-after-colon | symfony | `Drupal\Core\Extension\InfoParserException` | Unable to parse themes/custom/infofix_theme/infofix_theme.info.yml Unable to parse at line 2 (near "type:theme"). |
| theme-missing-base-theme | symfony | `Drupal\Core\Extension\InfoParserException` | Missing required key ("base theme") in themes/custom/infofix_theme/infofix_theme.info.yml, see https://www.drupal.org/node/3066038 |
| version-non-scalar | symfony | `Drupal\Core\Extension\InfoParserException` | The 'version' value must be a scalar |
| version-non-scalar | symfony | `Drupal\Core\Extension\InfoParserException` | The 'version' value must be a scalar in themes/custom/infofix_theme/infofix_theme.info.yml |
| yaml-bom | symfony | `Drupal\Core\Extension\InfoParserException` | Missing required keys (name) |
| yaml-bom | symfony | `Drupal\Core\Extension\InfoParserException` | Missing required keys (name) in themes/custom/infofix_theme/infofix_theme.info.yml |
| yaml-duplicate-key | symfony | `Drupal\Core\Extension\InfoParserException` | Unable to parse themes/custom/infofix_theme/infofix_theme.info.yml Duplicate key "name" detected at line 10 (near "name: 'Info fixture duplicate'"). |
| yaml-empty-file | symfony | `TypeError` | array_keys(): Argument #1 ($array) must be of type array, null given |
| yaml-leading-asterisk | symfony | `Drupal\Core\Extension\InfoParserException` | Unable to parse themes/custom/infofix_theme/infofix_theme.info.yml Reference "Experimental* parsing fixture" does not exist at line 3 (near "description: *Experimental* parsing fixture"). |
| yaml-leading-at | symfony | `Drupal\Core\Extension\InfoParserException` | Unable to parse themes/custom/infofix_theme/infofix_theme.info.yml The reserved indicator "@" cannot start a plain scalar; you need to quote the scalar at line 3 (near "description: @todo write a description"). |
| yaml-non-utf8 | symfony | `Drupal\Core\Extension\InfoParserException` | Unable to parse themes/custom/infofix_theme/infofix_theme.info.yml The YAML value does not appear to be valid UTF-8. |
| yaml-scalar-only | symfony | `TypeError` | array_keys(): Argument #1 ($array) must be of type array, string given |
| yaml-tab-indent | symfony | `Drupal\Core\Extension\InfoParserException` | Unable to parse themes/custom/infofix_theme/infofix_theme.info.yml A YAML file cannot contain tabs as indentation at line 8 (near "	header: Header"). |
| yaml-tab-indent | symfony | `Drupal\Core\Extension\InfoParserException` | Unable to parse themes/custom/infofix_theme/infofix_theme.info.yml A YAML file cannot contain tabs as indentation at line 8 (near " header: Header"). |
| yaml-top-level-list | symfony | `Drupal\Core\Extension\InfoParserException` | Missing required keys (type, name) |
| yaml-top-level-list | symfony | `Drupal\Core\Extension\InfoParserException` | Missing required keys (type, name) in themes/custom/infofix_theme/infofix_theme.info.yml |
| yaml-unquoted-colon | symfony | `Drupal\Core\Extension\InfoParserException` | Unable to parse themes/custom/infofix_theme/infofix_theme.info.yml A colon cannot be used in an unquoted mapping value at line 3 (near "description: Lab fixture: parsing tests."). |
| yaml-unterminated-quote | symfony | `Drupal\Core\Extension\InfoParserException` | Unable to parse themes/custom/infofix_theme/infofix_theme.info.yml Unexpected characters near "Lab fixture for info.yml parsing tests.'" at line 3 (near "description: 'Lab fixture for info.yml parsing tests.'"). |
