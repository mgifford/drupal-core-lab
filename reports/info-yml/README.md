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
| [sources/README.md](sources/README.md) | Every issue and commit relied on, and where each fact came from. |
