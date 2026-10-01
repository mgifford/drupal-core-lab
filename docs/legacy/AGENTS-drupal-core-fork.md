## Drupal Code Query MCP

When working on Drupal projects, use the `drupal-code-query` MCP server
(`https://mcp.tresbien.tech/mcp`) for questions about Drupal core and contributed
module APIs, change records, symbol usage, upgrade compatibility, and ecosystem
patterns.

Prefer these tools before giving Drupal API guidance:

- `lookup_core_symbol` for whether a core symbol is safe to use
- `find_core_symbol` when the exact symbol name is unknown
- `get_change_record` for Drupal core API changes
- `what_changed` when comparing core versions
- `search_contrib_code` for examples from core and contributed projects
- `project_upgrade_report` for upgrade-readiness questions

Use the project's actual Drupal and PHP versions when interpreting results.
Treat this server as read-only research data; inspect the local repository for
project-specific behavior. Distinguish MCP findings from conclusions based on
the local codebase, and mention the relevant core version when making API
recommendations.

## Local dev environment: reset & test recipes

This ddev site tests Drupal core patches. Start each patch from a clean, reproducible
baseline **without losing code** — the working tree / patches are never touched.

### Reset
- `ddev reset-site` — restore the saved `drupal-core-baseline` database snapshot
  (complete reset: config + content). Fast (~15s).
- `ddev reset-site --capture` — rebuild the baseline from scratch (standard install +
  the test recipe) and re-save the snapshot. Run after intentionally changing the baseline
  (e.g. adding a recipe).
- `ddev reset-site --recipe` — force a rebuild from the recipe, ignoring the snapshot.
- After reset, log in with `ddev drush uli`.
- Implementation: `scripts/reset-site.sh`; ddev wrapper `.ddev/commands/host/reset-site`
  (force-added because `.ddev` is gitignored — on a fresh clone run
  `bash scripts/reset-site.sh` if the wrapper is missing).

### Test recipe (baseline is NOT a blank install)
Baseline = `standard` profile + the composite recipe `core/recipes/replicate_core_testing`,
which exposes site elements for robust UI/form testing and sets Default Admin as the
administration theme. It layers these core recipes (see `core/recipes/`): `comment_base`,
`tags_taxonomy`, `editorial_workflow`, `image_media_type`, `audio_media_type`,
`document_media_type`, `remote_video_media_type`, `local_video_media_type`, `user_picture`,
`basic_html_format_editor`, `full_html_format_editor`, `restricted_html_format`,
`basic_block_type`, `standard_responsive_images`, `article_content_type`, `page_content_type`.

Note: in this core version `standard` does NOT ship node types, so the baseline would have
no Article/Page. `article_content_type` and `page_content_type` are copied from
`core/tests/fixtures/recipes/` into `core/recipes/` (the only directory the recipe resolver
searches for dependencies) and layered in so the baseline has Article + Page with the
advanced group (URL alias, menu, etc.) needed to reproduce sidebar/form errors.

### Add more surface area for a test
Layer another core recipe on the baseline:
`ddev exec drush recipe core/recipes/<name>`
or add it to the `recipes:` list in `core/recipes/replicate_core_testing/recipe.yml`
(dependencies are unprefixed because the recipe lives inside `core/recipes/`) and re-run
`ddev reset-site --capture`. A composite recipe that reuses core recipes MUST live in
`core/recipes/` — the recipe resolver only searches `core/recipes/` for dependencies, so a
project-level `recipes/` file cannot resolve `core:*` deps.

`scripts/apply-recipe.sh` wraps the Core Recipe PHP API (`Drupal\Core\Recipe\Recipe` /
`RecipeRunner`) so core recipes can be discovered and applied without knowing Drush internals,
and without pulling in Drupal CMS recipes. It exposes core functionality only:
- `bash scripts/apply-recipe.sh list` — enumerate recipes in `core/recipes`, `recipes`, and
  `core/tests/fixtures/recipes` (name, type, description, direct dependencies).
- `bash scripts/apply-recipe.sh apply <name-or-path>` — apply one core recipe and its
  dependencies (e.g. `apply comment_base`, `apply core/recipes/tags_taxonomy`,
  `apply replicate_core_testing`). Apply changes the live site only; `ddev reset-site`
  restores the baseline.

### Progress artifacts
Review artifacts (full patch, interdiff, issue comment, Guidepup harness, bundle) are
committed under `testing/<issue>/`; see `testing/README.md` for the daily loop
(develop → test → produce artifacts → `ddev reset-site` → push to `origin`).
