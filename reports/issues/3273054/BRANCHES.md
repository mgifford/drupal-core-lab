# Branch patches for #3273054

**There is no issue fork and no merge request for this issue.**

Checked 2026-10-15: the issue page lists no fork and no merge request, `field_issue_files` is empty, and
`https://git.drupalcode.org/issue/drupal-3273054` does not resolve. `scripts/new-issue.mjs --branch <branch>`
therefore could not be used to scaffold this issue, and there is no patch to extract from a branch.

The fix is authored in the lab instead (`docs/NEW-ISSUE.md` §4d):

- The `3273054-pinned` variant sets `"after": { "env": "issue-3273054", "patches": [], "authoring": true }`, so
  After is the same core as Before until a patch is written. `authoring: true` is the one declared exception to
  the "After must differ from Before" check.
- After editing files in `envs/issue-3273054/`, `scripts/capture-patch.mjs 3273054-pinned --name <name>` writes
  `reports/issues/3273054/branches/3273054-<name>.patch`, lists it in the variant's `after.patches` and clears
  `after.authoring`.

| Patch | Source | Tip | Base | Date | Files |
|---|---|---|---|---|---|
| *(none yet)* | written in the lab | — | — | — | — |
