# Phase 3: the linter on every fixture, compared with Phase 1

Generated 2026-10-24T01:22:34.369Z by `node scripts/info-yml-repro.mjs lint`, with `core/scripts/dr ex:validate --format=json` from envs/info-yml-patch at `ee6498b4b9ac` ("Add ExtensionFileValidator and the ex:validate command", on `89df3a065deb`), PHP 8.5.12. Machine-readable: [lint-results.json](lint-results.json). **DRAFT until a person has reviewed it.**

"Before" is what the fixture did to a Drupal 12 site in Phase 1 (Symfony YAML, every placement of the kind; see RESULTS.md): `site breaks` (cache rebuild or cold-cache visitors fail, installed or not), `site breaks if installed` (only where the extension was installed), `pages fail`, `cannot be installed`, or `no effect`. "After" is what the linter reports for the same files, with each parser.

A row passes when a file that breaks the site has an error; a file that breaks the site only when installed, or has a narrower effect, has a finding; and a file with no effect has no error (warnings there are advisory). Without a site the linter cannot know what is installed, so a file that breaks only an installed extension (a renamed profile info file, a missing base theme) is a warning; `--strict` makes warnings fail the command.

Result: 282 of 282 rows pass.

| case | kind | before (site) | after: Symfony YAML host | after: PECL YAML host | pass |
|---|---|---|---|---|---|
| yaml-unquoted-colon | module | site breaks | 1 error(s), 0 warning(s): info.yaml:3 | 1 error(s), 0 warning(s): info.yaml:3 | yes |
| yaml-unquoted-colon | theme | site breaks | 1 error(s), 0 warning(s): info.yaml:3 | 1 error(s), 0 warning(s): info.yaml:3 | yes |
| yaml-unquoted-colon | profile | site breaks | 1 error(s), 0 warning(s): info.yaml:3 | 1 error(s), 0 warning(s): info.yaml:3 | yes |
| yaml-leading-at | module | site breaks | 1 error(s), 0 warning(s): info.yaml:3 | 1 error(s), 0 warning(s): info.yaml:3 | yes |
| yaml-leading-at | theme | site breaks | 1 error(s), 0 warning(s): info.yaml:3 | 1 error(s), 0 warning(s): info.yaml:3 | yes |
| yaml-leading-at | profile | site breaks | 1 error(s), 0 warning(s): info.yaml:3 | 1 error(s), 0 warning(s): info.yaml:3 | yes |
| yaml-leading-asterisk | module | site breaks | 1 error(s), 0 warning(s): info.yaml:3 | 1 error(s), 0 warning(s): info.yaml:3 | yes |
| yaml-leading-asterisk | theme | site breaks | 1 error(s), 0 warning(s): info.yaml:3 | 1 error(s), 0 warning(s): info.yaml:3 | yes |
| yaml-leading-asterisk | profile | site breaks | 1 error(s), 0 warning(s): info.yaml:3 | 1 error(s), 0 warning(s): info.yaml:3 | yes |
| yaml-tab-indent | module | site breaks | 1 error(s), 0 warning(s): info.tab:7 | 1 error(s), 0 warning(s): info.tab:7 | yes |
| yaml-tab-indent | theme | site breaks | 1 error(s), 0 warning(s): info.tab:8 | 1 error(s), 0 warning(s): info.tab:8 | yes |
| yaml-tab-indent | profile | site breaks | 1 error(s), 0 warning(s): info.tab:7 | 1 error(s), 0 warning(s): info.tab:7 | yes |
| yaml-unterminated-quote | module | site breaks | 1 error(s), 0 warning(s): info.yaml:3 | 1 error(s), 0 warning(s): info.yaml:3 | yes |
| yaml-unterminated-quote | theme | site breaks | 1 error(s), 0 warning(s): info.yaml:3 | 1 error(s), 0 warning(s): info.yaml:3 | yes |
| yaml-unterminated-quote | profile | site breaks | 1 error(s), 0 warning(s): info.yaml:3 | 1 error(s), 0 warning(s): info.yaml:3 | yes |
| yaml-duplicate-key | module | site breaks | 1 error(s), 0 warning(s): info.yaml:8 | 1 error(s), 0 warning(s): info.yaml:8 | yes |
| yaml-duplicate-key | theme | site breaks | 1 error(s), 0 warning(s): info.yaml:10 | 1 error(s), 0 warning(s): info.yaml:10 | yes |
| yaml-duplicate-key | profile | site breaks | 1 error(s), 0 warning(s): info.yaml:13 | 1 error(s), 0 warning(s): info.yaml:13 | yes |
| yaml-bom | module | site breaks | 1 error(s), 0 warning(s): info.bom:1 | 1 error(s), 0 warning(s): info.bom:1 | yes |
| yaml-bom | theme | site breaks | 1 error(s), 0 warning(s): info.bom:1 | 1 error(s), 0 warning(s): info.bom:1 | yes |
| yaml-bom | profile | site breaks | 1 error(s), 0 warning(s): info.bom:1 | 1 error(s), 0 warning(s): info.bom:1 | yes |
| yaml-crlf | module | no effect | clean | clean | yes |
| yaml-crlf | theme | no effect | clean | clean | yes |
| yaml-crlf | profile | no effect | clean | clean | yes |
| yaml-non-utf8 | module | site breaks | 1 error(s), 0 warning(s): info.yaml | 1 error(s), 0 warning(s): info.yaml | yes |
| yaml-non-utf8 | theme | site breaks | 1 error(s), 0 warning(s): info.yaml | 1 error(s), 0 warning(s): info.yaml | yes |
| yaml-non-utf8 | profile | site breaks | 1 error(s), 0 warning(s): info.yaml | 1 error(s), 0 warning(s): info.yaml | yes |
| yaml-empty-file | module | site breaks | 1 error(s), 0 warning(s): info.mapping | 1 error(s), 0 warning(s): info.mapping | yes |
| yaml-empty-file | theme | site breaks | 1 error(s), 0 warning(s): info.mapping | 1 error(s), 0 warning(s): info.mapping | yes |
| yaml-empty-file | profile | site breaks | 1 error(s), 0 warning(s): info.mapping | 1 error(s), 0 warning(s): info.mapping | yes |
| yaml-scalar-only | module | site breaks | 1 error(s), 0 warning(s): info.mapping | 1 error(s), 0 warning(s): info.mapping | yes |
| yaml-scalar-only | theme | site breaks | 1 error(s), 0 warning(s): info.mapping | 1 error(s), 0 warning(s): info.mapping | yes |
| yaml-scalar-only | profile | site breaks | 1 error(s), 0 warning(s): info.mapping | 1 error(s), 0 warning(s): info.mapping | yes |
| yaml-top-level-list | module | site breaks | 1 error(s), 0 warning(s): info.mapping | 1 error(s), 0 warning(s): info.mapping | yes |
| yaml-top-level-list | theme | site breaks | 1 error(s), 0 warning(s): info.mapping | 1 error(s), 0 warning(s): info.mapping | yes |
| yaml-top-level-list | profile | site breaks | 1 error(s), 0 warning(s): info.mapping | 1 error(s), 0 warning(s): info.mapping | yes |
| spacing-no-space-after-colon | module | site breaks | 1 error(s), 0 warning(s): info.yaml:2 | 1 error(s), 0 warning(s): info.yaml:2 | yes |
| spacing-no-space-after-colon | theme | site breaks | 1 error(s), 0 warning(s): info.yaml:2 | 1 error(s), 0 warning(s): info.yaml:2 | yes |
| spacing-no-space-after-colon | profile | site breaks | 1 error(s), 0 warning(s): info.yaml:2 | 1 error(s), 0 warning(s): info.yaml:2 | yes |
| spacing-key-indented | module | site breaks | 1 error(s), 0 warning(s): info.yaml:2 | 1 error(s), 0 warning(s): info.yaml:2 | yes |
| spacing-key-indented | theme | site breaks | 1 error(s), 0 warning(s): info.yaml:2 | 1 error(s), 0 warning(s): info.yaml:2 | yes |
| spacing-key-indented | profile | site breaks | 1 error(s), 0 warning(s): info.yaml:2 | 1 error(s), 0 warning(s): info.yaml:2 | yes |
| spacing-list-over-indented | module | cannot be installed | 0 error(s), 1 warning(s): info.dependency:7 | 0 error(s), 1 warning(s): info.dependency:7 | yes |
| spacing-list-over-indented | theme | site breaks | 1 error(s), 0 warning(s): info.yaml:9 | 1 error(s), 0 warning(s): info.yaml:9 | yes |
| spacing-list-over-indented | profile | no effect | 0 error(s), 1 warning(s): info.dependency:7 | 0 error(s), 1 warning(s): info.dependency:7 | yes |
| spacing-list-under-indented | module | site breaks | 1 error(s), 0 warning(s): info.yaml:8 | 1 error(s), 0 warning(s): info.yaml:8 | yes |
| spacing-list-under-indented | theme | site breaks | 1 error(s), 0 warning(s): info.yaml:9 | 1 error(s), 0 warning(s): info.yaml:9 | yes |
| spacing-list-under-indented | profile | site breaks | 1 error(s), 0 warning(s): info.yaml:8 | 1 error(s), 0 warning(s): info.yaml:8 | yes |
| spacing-list-no-space | module | no effect | 0 error(s), 1 warning(s): info.value:6 | 0 error(s), 1 warning(s): info.value:6 | yes |
| spacing-list-no-space | theme | site breaks if installed | 1 error(s), 0 warning(s): info.value:7 | 1 error(s), 0 warning(s): info.value:7 | yes |
| spacing-list-no-space | profile | no effect | 0 error(s), 2 warning(s): info.value:6, info.value:11 | 0 error(s), 2 warning(s): info.value:6, info.value:11 | yes |
| spacing-nbsp-after-colon | module | site breaks | 1 error(s), 0 warning(s): info.yaml:2 | 1 error(s), 0 warning(s): info.yaml:2 | yes |
| spacing-nbsp-after-colon | theme | site breaks | 1 error(s), 0 warning(s): info.yaml:2 | 1 error(s), 0 warning(s): info.yaml:2 | yes |
| spacing-nbsp-after-colon | profile | site breaks | 1 error(s), 0 warning(s): info.yaml:2 | 1 error(s), 0 warning(s): info.yaml:2 | yes |
| spacing-tab-after-colon | module | no effect | clean | clean | yes |
| spacing-tab-after-colon | theme | no effect | clean | clean | yes |
| spacing-tab-after-colon | profile | no effect | clean | clean | yes |
| spacing-trailing-whitespace | module | no effect | clean | clean | yes |
| spacing-trailing-whitespace | theme | no effect | clean | clean | yes |
| spacing-trailing-whitespace | profile | no effect | clean | clean | yes |
| spacing-compact-list | module | no effect | clean | clean | yes |
| spacing-compact-list | theme | no effect | clean | clean | yes |
| spacing-compact-list | profile | no effect | clean | clean | yes |
| missing-name | module | site breaks | 1 error(s), 0 warning(s): info.parser | 1 error(s), 0 warning(s): info.parser | yes |
| missing-name | theme | site breaks | 1 error(s), 0 warning(s): info.parser | 1 error(s), 0 warning(s): info.parser | yes |
| missing-name | profile | site breaks | 1 error(s), 0 warning(s): info.parser | 1 error(s), 0 warning(s): info.parser | yes |
| missing-type | module | site breaks | 1 error(s), 0 warning(s): info.parser | 1 error(s), 0 warning(s): info.parser | yes |
| missing-type | theme | site breaks | 1 error(s), 0 warning(s): info.parser | 1 error(s), 0 warning(s): info.parser | yes |
| missing-type | profile | site breaks | 1 error(s), 0 warning(s): info.parser | 1 error(s), 0 warning(s): info.parser | yes |
| type-typo | module | cannot be installed | 1 error(s), 0 warning(s): info.type:2 | 1 error(s), 0 warning(s): info.type:2 | yes |
| type-typo | theme | cannot be installed | 1 error(s), 0 warning(s): info.type:2 | 1 error(s), 0 warning(s): info.type:2 | yes |
| type-typo | profile | site breaks if installed | 1 error(s), 0 warning(s): info.type:2 | 1 error(s), 0 warning(s): info.type:2 | yes |
| missing-cvr | module | site breaks | 1 error(s), 0 warning(s): info.parser | 1 error(s), 0 warning(s): info.parser | yes |
| missing-cvr | theme | site breaks | 1 error(s), 0 warning(s): info.parser | 1 error(s), 0 warning(s): info.parser | yes |
| missing-cvr | profile | site breaks | 1 error(s), 0 warning(s): info.parser | 1 error(s), 0 warning(s): info.parser | yes |
| missing-cvr-core-8x | module | site breaks | 1 error(s), 0 warning(s): info.parser | 1 error(s), 0 warning(s): info.parser | yes |
| missing-cvr-core-8x | theme | site breaks | 1 error(s), 0 warning(s): info.parser | 1 error(s), 0 warning(s): info.parser | yes |
| missing-cvr-core-8x | profile | site breaks | 1 error(s), 0 warning(s): info.parser | 1 error(s), 0 warning(s): info.parser | yes |
| core-and-cvr | module | no effect | clean | clean | yes |
| core-and-cvr | theme | no effect | clean | clean | yes |
| core-and-cvr | profile | no effect | clean | clean | yes |
| cvr-unparseable | module | site breaks | 1 error(s), 0 warning(s): info.parser:5 | 1 error(s), 0 warning(s): info.parser:5 | yes |
| cvr-unparseable | theme | site breaks | 1 error(s), 0 warning(s): info.parser:5 | 1 error(s), 0 warning(s): info.parser:5 | yes |
| cvr-unparseable | profile | site breaks | 1 error(s), 0 warning(s): info.parser:5 | 1 error(s), 0 warning(s): info.parser:5 | yes |
| cvr-incompatible | module | cannot be installed | 0 error(s), 1 warning(s): info.core_incompatible:5 | 0 error(s), 1 warning(s): info.core_incompatible:5 | yes |
| cvr-incompatible | theme | cannot be installed | 0 error(s), 1 warning(s): info.core_incompatible:5 | 0 error(s), 1 warning(s): info.core_incompatible:5 | yes |
| cvr-incompatible | profile | no effect | 0 error(s), 1 warning(s): info.core_incompatible:5 | 0 error(s), 1 warning(s): info.core_incompatible:5 | yes |
| lifecycle-invalid | module | site breaks | 1 error(s), 0 warning(s): info.parser | 1 error(s), 0 warning(s): info.parser | yes |
| lifecycle-invalid | theme | site breaks | 1 error(s), 0 warning(s): info.parser | 1 error(s), 0 warning(s): info.parser | yes |
| lifecycle-invalid | profile | site breaks | 1 error(s), 0 warning(s): info.parser | 1 error(s), 0 warning(s): info.parser | yes |
| lifecycle-deprecated-no-link | module | site breaks | 1 error(s), 0 warning(s): info.parser | 1 error(s), 0 warning(s): info.parser | yes |
| lifecycle-deprecated-no-link | theme | site breaks | 1 error(s), 0 warning(s): info.parser | 1 error(s), 0 warning(s): info.parser | yes |
| lifecycle-deprecated-no-link | profile | site breaks | 1 error(s), 0 warning(s): info.parser | 1 error(s), 0 warning(s): info.parser | yes |
| version-non-scalar | module | site breaks | 1 error(s), 0 warning(s): info.parser:8 | 1 error(s), 0 warning(s): info.parser:8 | yes |
| version-non-scalar | theme | site breaks | 1 error(s), 0 warning(s): info.parser:10 | 1 error(s), 0 warning(s): info.parser:10 | yes |
| version-non-scalar | profile | site breaks | 1 error(s), 0 warning(s): info.parser:13 | 1 error(s), 0 warning(s): info.parser:13 | yes |
| version-numeric | module | no effect | 0 error(s), 1 warning(s): info.deprecated | 0 error(s), 1 warning(s): info.deprecated | yes |
| version-numeric | theme | no effect | 0 error(s), 1 warning(s): info.deprecated | 0 error(s), 1 warning(s): info.deprecated | yes |
| version-numeric | profile | no effect | 0 error(s), 1 warning(s): info.deprecated | 0 error(s), 1 warning(s): info.deprecated | yes |
| name-not-string | module | pages fail | 1 error(s), 0 warning(s): info.value:1 | 1 error(s), 0 warning(s): info.value:1 | yes |
| name-not-string | theme | pages fail | 1 error(s), 0 warning(s): info.value:1 | 1 error(s), 0 warning(s): info.value:1 | yes |
| name-not-string | profile | pages fail | 1 error(s), 0 warning(s): info.value:1 | 1 error(s), 0 warning(s): info.value:1 | yes |
| description-null | module | no effect | clean | clean | yes |
| description-null | theme | no effect | clean | clean | yes |
| description-null | profile | no effect | clean | clean | yes |
| dependencies-string | module | no effect | 0 error(s), 1 warning(s): info.value:6 | 0 error(s), 1 warning(s): info.value:6 | yes |
| dependencies-string | theme | site breaks if installed | 1 error(s), 0 warning(s): info.value:7 | 1 error(s), 0 warning(s): info.value:7 | yes |
| dependencies-string | profile | no effect | 0 error(s), 2 warning(s): info.value:6, info.value:7 | 0 error(s), 2 warning(s): info.value:6, info.value:7 | yes |
| dependency-missing | module | cannot be installed | clean | clean | yes, as a known limit: whether a dependency exists needs the list of available extensions, which needs a site |
| dependency-missing | theme | cannot be installed | clean | clean | yes, as a known limit: whether a dependency exists needs the list of available extensions, which needs a site |
| dependency-missing | profile | no effect | clean | clean | yes |
| theme-missing-base-theme | theme | site breaks | 1 error(s), 0 warning(s): info.base_theme | 1 error(s), 0 warning(s): info.base_theme | yes |
| theme-base-theme-missing-target | theme | site breaks if installed | 0 error(s), 1 warning(s): info.base_theme:6 | 0 error(s), 1 warning(s): info.base_theme:6 | yes |
| theme-libraries-empty | theme | no effect | clean | clean | yes |
| filename-info-yaml | module | cannot be installed | 0 error(s), 1 warning(s): file.name | 0 error(s), 1 warning(s): file.name | yes |
| filename-info-yaml | theme | cannot be installed | 0 error(s), 1 warning(s): file.name | 0 error(s), 1 warning(s): file.name | yes |
| filename-info-yaml | profile | site breaks if installed | 0 error(s), 1 warning(s): file.name | 0 error(s), 1 warning(s): file.name | yes |
| filename-d7-info | module | cannot be installed | 0 error(s), 1 warning(s): file.name | 0 error(s), 1 warning(s): file.name | yes |
| filename-d7-info | theme | cannot be installed | 0 error(s), 1 warning(s): file.name | 0 error(s), 1 warning(s): file.name | yes |
| filename-d7-info | profile | site breaks if installed | 0 error(s), 1 warning(s): file.name | 0 error(s), 1 warning(s): file.name | yes |
| filename-hyphen | module | cannot be installed | 0 error(s), 1 warning(s): file.name | 0 error(s), 1 warning(s): file.name | yes |
| filename-hyphen | theme | cannot be installed | 0 error(s), 1 warning(s): file.name | 0 error(s), 1 warning(s): file.name | yes |
| filename-hyphen | profile | site breaks if installed | 0 error(s), 1 warning(s): file.name | 0 error(s), 1 warning(s): file.name | yes |
| filename-uppercase | module | cannot be installed | 0 error(s), 1 warning(s): file.name | 0 error(s), 1 warning(s): file.name | yes |
| filename-uppercase | theme | cannot be installed | 0 error(s), 1 warning(s): file.name | 0 error(s), 1 warning(s): file.name | yes |
| filename-uppercase | profile | site breaks if installed | 0 error(s), 1 warning(s): file.name | 0 error(s), 1 warning(s): file.name | yes |
| filename-backup-copy | module | no effect | clean | clean | yes |
| filename-backup-copy | theme | no effect | clean | clean | yes |
| filename-backup-copy | profile | no effect | clean | clean | yes |
| php-syntax-error | module | site breaks if installed | 1 error(s), 0 warning(s): php.syntax:8 | 1 error(s), 0 warning(s): php.syntax:8 | yes |
| php-syntax-error | theme | site breaks if installed | 1 error(s), 0 warning(s): php.syntax:8 | 1 error(s), 0 warning(s): php.syntax:8 | yes |
| php-syntax-error | profile | site breaks if installed | 1 error(s), 0 warning(s): php.syntax:8 | 1 error(s), 0 warning(s): php.syntax:8 | yes |
| php-syntax-error-install | module | cannot be installed | 1 error(s), 0 warning(s): php.syntax:8 | 1 error(s), 0 warning(s): php.syntax:8 | yes |
| packager-duplicate-version | module | site breaks | 1 error(s), 0 warning(s): info.yaml:11 | 1 error(s), 0 warning(s): info.yaml:11 | yes |
| packager-duplicate-version | theme | site breaks | 1 error(s), 0 warning(s): info.yaml:13 | 1 error(s), 0 warning(s): info.yaml:13 | yes |
| packager-duplicate-version | profile | site breaks | 1 error(s), 0 warning(s): info.yaml:16 | 1 error(s), 0 warning(s): info.yaml:16 | yes |
| packager-no-final-newline | module | site breaks | 1 error(s), 0 warning(s): info.parser:7 | 1 error(s), 0 warning(s): info.parser:7 | yes |
| packager-no-final-newline | theme | site breaks | 1 error(s), 0 warning(s): info.parser:9 | 1 error(s), 0 warning(s): info.parser:9 | yes |
| packager-no-final-newline | profile | site breaks | 1 error(s), 0 warning(s): info.parser:12 | 1 error(s), 0 warning(s): info.parser:12 | yes |
| libraries-tarball | contrib | no effect | clean | clean | yes |
| libraries-tarball | contrib-scan-tests | site breaks | 1 error(s), 0 warning(s): info.parser libfix/tests/example/example.info.yml | 1 error(s), 0 warning(s): info.parser libfix/tests/example/example.info.yml | yes |
