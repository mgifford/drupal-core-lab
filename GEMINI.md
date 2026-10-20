# Gemini Context & Instructions

This repository follows the unified agent guidelines defined in [AGENTS.md](./AGENTS.md) and [docs/NEW-ISSUE.md](./docs/NEW-ISSUE.md). Always refer to `AGENTS.md` as the authoritative source.

## Executive Workflow for Drupal Core Issues

When given a Drupal issue URL (e.g. `https://www.drupal.org/project/drupal/issues/<nid>`):

1. **Extract:** Find the issue `<nid>` and the MR branch name (e.g. `drupal-<nid>`).
2. **Scaffold:** Run `node scripts/new-issue.mjs <nid> --branch <branch-name>` and `node scripts/issue-status.mjs <nid> --write`.
3. **Variants Configuration:** 
   - Open `tools/compare/variants.json`.
   - Never remove `"extends": "<nid>-pinned"` from `<nid>-latest`.
   - Populate only `<nid>-pinned` with the target path (e.g. `pages: ["/admin/modules"]`), login flag, steps, and DOM probes.
4. **Build & Verify:**
   - `node tools/compare/setup.mjs <nid>-latest --check-patches`
   - `node tools/compare/setup.mjs <nid>-latest`
5. **Inspect:**
   - `node tools/compare/serve.mjs <nid>-latest`

For rules on evidence collection, stale runs, and reporting, see [AGENTS.md](./AGENTS.md).
