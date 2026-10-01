# Migration from mgifford/drupal-core

Date: 2026-10-01. Nothing from Drupal core itself was migrated.

## Sources
- `origin/old-main-20260916` (717bec8e9aa) of mgifford/drupal-core: reports,
  tools, tests, scripts, patches, process docs, per-issue write-ups, `.claude/`.
- `origin/main` (7e501b72cf6) fork layer: `.agents/`, `.github/`, `core/recipes/`
  (now `recipes/`).
- `docs-reset-environment` branch: the side-by-side workflow, rewritten here as
  `AGENTS.md`.
- This evaluation session: `reports/issues/3619127/`, `reports/issues/3604037/`.

## Where things went
| Old location | New location |
|---|---|
| root `<nid>-*.md/.patch/.png/...` | `reports/issues/<nid>/` |
| `ISSUE-<nid>.md`, `ISSUE_<nid>_*.md` | `reports/issues/<nid>/` |
| `ISSUE-COMMENTS-*`, `ISSUE-DRAFTS-*` | `reports/issue-drafts/` |
| `testing/issue-<nid>-*` | `reports/issues/<nid>/` |
| other root `*.md` process docs | `docs/` |
| old `AGENTS.md`, `CLAUDE.md`, `README.md` | `docs/legacy/` (fork-specific, superseded) |
| `documentation-new/` | `docs/documentation-new/` |
| `openacr-pilot/` | `reports/openacr-pilot/` |
| `reports/`, `patches/`, `tools/`, `tests/` | same names |
| `scripts/` | `scripts/legacy-core-root/` |
| `.agents/`, `.github/` | same names (from current fork `main`) |
| `core/recipes/` | `recipes/` |
| `.claude/` | `.claude/` |

## Deliberately not migrated
- Drupal core, `vendor/`, `composer/`, `node_modules/`, `.playwright-mcp/`.
- `.ddev/commands/host/reset-core` and `reset-site`: broken (need Drush and a
  missing script) and superseded by the DDEV add-on approach.
- `.gitmodules`, core's `.gitlab-ci*`, editor/lint config that belongs to core.
- Raw axe result shards and files over 3 MB in `reports/` (total ~188 MB,
  largely duplicated between dated folders and `latest/`). They remain in
  `old-main-20260916`. Summaries (`.md`, `.html`, `.csv`, small `.json`) were kept:

- `reports/axe-results/2026-05-06/shards/chunk-001.json` (6.8 MB)
- `reports/axe-results/2026-05-06/shards/chunk-002.json` (39.3 MB)
- `reports/axe-results/2026-05-06/shards/chunk-003.json` (9.5 MB)
- `reports/axe-results/2026-05-06/shards/chunk-004.json` (3.2 MB)
- `reports/axe-results/2026-05-06/shards/chunk-005.json` (6.3 MB)
- `reports/axe-results/2026-05-06/shards/chunk-006.json` (4.9 MB)
- `reports/axe-results/2026-05-06/shards/chunk-007.json` (2.8 MB)
- `reports/axe-results/2026-05-06/shards/chunk-008.json` (1.4 MB)
- `reports/axe-results/2026-05-06/shards/chunk-009.json` (0.9 MB)
- `reports/axe-results/2026-07-05/shards/chunk-001.json` (0.0 MB)
- `reports/axe-results/2026-07-06/shards/chunk-001.json` (17.7 MB)
- `reports/axe-results/2026-07-06/shards/chunk-002.json` (7.8 MB)
- `reports/axe-results/2026-07-06/shards/chunk-003.json` (8.6 MB)
- `reports/axe-results/2026-07-06/shards/chunk-004.json` (9.7 MB)
- `reports/axe-results/2026-07-06/shards/chunk-005.json` (7.5 MB)
- `reports/axe-results/2026-07-06/shards/chunk-006.json` (5.2 MB)
- `reports/axe-results/latest/shards/chunk-001.json` (17.7 MB)
- `reports/axe-results/latest/shards/chunk-002.json` (7.8 MB)
- `reports/axe-results/latest/shards/chunk-003.json` (8.6 MB)
- `reports/axe-results/latest/shards/chunk-004.json` (9.7 MB)
- `reports/axe-results/latest/shards/chunk-005.json` (7.5 MB)
- `reports/axe-results/latest/shards/chunk-006.json` (5.2 MB)

## Known work still needed (not done)
1. **Path audit.** Scripts, `package.json` and Playwright config assume the
   repo root is a Drupal core checkout (`core/tests/playwright/...`,
   `core/scripts/...`). They will not run unchanged. Start with
   `package.json`, `scripts/legacy-core-root/`, `tools/`, `tests/playwright/`.
2. **GitHub Pages workflows** in `.github/workflows/` publish `reports/`;
   check they still point at the right paths and that Pages is enabled.
3. **Duplicate skills.** `.agents/skills` and `.claude/skills` overlap; decide
   which is canonical.
4. `reports/index.html` and `*-latest.*` files are generated artifacts; prefer
   editing the generating script.
5. `.agents/DRUPAL_AGENTS.md` still describes the repo as a Drupal core
   workspace (paths like `core/`, `modules/`). Rewrite it for this layout, or
   fold it into `AGENTS.md`.
6. Two diffs under `reports/issues/3370946/` contain local `/Users/mgifford` paths.
