# Phase 3: errors planted in core

Generated 2026-10-24T01:22:38.418Z by `node scripts/info-yml-repro.mjs planted`, with the patched core's `core/scripts/dr ex:validate` at `ee6498b4b9ac`. Machine-readable: [planted.json](planted.json). **DRAFT until a person has reviewed it.**

Method: a git worktree of the patched checkout (a copy of the repository: tracked files only), each run once as is, then again after the changes below. A run passes when it exits 1 and reports exactly what it reported before, plus each planted problem at its file, rule, line and severity, and nothing else. The copy is deleted afterwards.

| planted in | change | expected finding | expected in runs |
|---|---|---|---|
| `core/modules/node/node.info.yml` | an unquoted colon in the description | error [info.yaml] line 3 | all |
| `core/themes/default_admin/default_admin.info.yml` | a tab instead of two spaces before a list item | error [info.tab] line 10 | all |
| `core/modules/views/views.info.yml` | type: modul (a typo) | error [info.type] line 2 | all |
| `core/profiles/standard/standard.info.yml` | the type line deleted | error [info.parser] | all |
| `core/modules/field_ui/field_ui.info.yml` | a dependency indented one space too far, so YAML joins it to the item above | warning [info.dependency] line 7 | all |
| `modules/custom/planted_new/planted_new.info.yml` | a new, untracked custom module without core_version_requirement | error [info.parser] | all |
| `core/modules/user/user.module` | a function with a missing parenthesis, appended | error [php.syntax] line 518 | all |
| `core/modules/system/tests/modules/common_test/common_test.info.yml` | an unquoted colon, in a test module | error [info.yaml] line 3 | only with --include-tests |
| `core/modules/text/text.module` | a parameter declared twice (a compile-time error, not a parse error) | error [php.lint] line 45 | only with --php-lint |

| run | parser | before planting | after planting | missed | unexpected | result |
|---|---|---|---|---|---|---|
| `ex:validate core modules` | symfony | exit 0; 76 info, 4900 PHP; 0 errors, 0 warnings | exit 1; 77 info, 4900 PHP; 6 errors, 1 warnings | none | none | pass |
| `ex:validate core modules` | pecl | exit 0; 76 info, 4900 PHP; 0 errors, 0 warnings | exit 1; 77 info, 4900 PHP; 6 errors, 1 warnings | none | none | pass |
| `ex:validate core modules --include-tests` | symfony | exit 1; 653 info, 10470 PHP; 1 errors, 6 warnings | exit 1; 654 info, 10470 PHP; 8 errors, 7 warnings | none | none | pass |
| `ex:validate core modules --include-tests` | pecl | exit 1; 653 info, 10470 PHP; 1 errors, 6 warnings | exit 1; 654 info, 10470 PHP; 8 errors, 7 warnings | none | none | pass |
| `ex:validate core modules --php-lint` | symfony | exit 0; 76 info, 4900 PHP; 0 errors, 0 warnings | exit 1; 77 info, 4900 PHP; 7 errors, 1 warnings | none | none | pass |
| `ex:validate core modules --php-lint` | pecl | exit 0; 76 info, 4900 PHP; 0 errors, 0 warnings | exit 1; 77 info, 4900 PHP; 7 errors, 1 warnings | none | none | pass |
| `ex:validate core modules --changed` | symfony | exit 0; 0 info, 0 PHP; 0 errors, 0 warnings | exit 1; 7 info, 2 PHP; 6 errors, 1 warnings | none | none | pass |
| `ex:validate core modules --changed` | pecl | exit 0; 0 info, 0 PHP; 0 errors, 0 warnings | exit 1; 7 info, 2 PHP; 6 errors, 1 warnings | none | none | pass |

Before planting, `--include-tests` reports core's test fixtures that are invalid on purpose (each is a true finding): `core/modules/system/tests/modules/invalid_module_name_over_the_maximum_allowed_character_length/invalid_module_name_over_the_maximum_allowed_character_length.info.yml: warning [file.name]`, `core/modules/system/tests/modules/system_core_incompatible_semver_test/system_core_incompatible_semver_test.info.yml:6 warning [info.core_incompatible]`, `core/modules/system/tests/modules/system_incompatible_module_version_dependencies_test/system_incompatible_module_version_dependencies_test.info.yml: warning [file.name]`, `core/modules/system/tests/themes/test_invalid_core_semver/test_invalid_core_semver.info.yml:6 warning [info.core_incompatible]`, `core/modules/system/tests/themes/test_invalid_region/test_invalid_region.info.yml:6 error [info.value]`, `core/modules/system/tests/themes/test_theme_having_veery_long_name_which_is_too_long/test_theme_having_veery_long_name_which_is_too_long.info.yml: warning [file.name]`, `core/modules/system/tests/themes/test_invalid_base_theme/test_invalid_base_theme.info.yml:5 warning [info.base_theme]`.

Not covered by the default run, by design: test modules (extension discovery skips tests/ unless `extension_discovery_scan_tests` is set) and compile-time PHP errors (the built-in check tokenizes only; `--php-lint` runs `php -l`).

