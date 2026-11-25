# Branch patches for #3594809

Extracted 2026-11-23 from https://git.drupalcode.org/issue/drupal-3594809.git with `git diff <merge-base> <branch tip>`: only the branch's own changes.
Not rebased onto current `main`. The MR on drupal.org is the source of truth.

| Patch | Source | Tip | Base | Base date and subject | Files |
|---|---|---|---|---|---|
| [`branches/main.patch`](branches/main.patch) | https://git.drupalcode.org/issue/drupal-3594809.git `main` | 94a48fe8 | 07d6e6935e79 | 2026-08-19 Revert "feat: #256287 Give roles a description value" | 3 |

## Current-main rebase

[`branches/main-rebased-97c6ff8b.patch`](branches/main-rebased-97c6ff8b.patch)
preserves the MR's intent against core `97c6ff8b2534b242c0f1df3e4ba2493e56aebcec`:
delete the toggle PostCSS source and compiled CSS, then remove the library entry.
The original patch is unchanged. The source-only textual interdiff is
[`branches/main-rebased-97c6ff8b.interdiff`](branches/main-rebased-97c6ff8b.interdiff);
it records only the base-context and blob-reference changes needed for the
current files. The full rebase patch is SHA-256
`3b4c3eecb6276431c223ea28438da9b39e40b6a6962a6337e705a39131efcf73`.

## Pinned corrective patch

[`branches/delete-empty-stylesheets.patch`](branches/delete-empty-stylesheets.patch) was authored in the lab and is intentionally separate from MR !16770. It deletes the two zero-byte
stylesheets that the imported MR leaves tracked. The original MR patch and its
checksum are not changed. The `3594809-corrected` variant applies both patches
in order so the CSS pipeline can be tested independently of the original
failure.

The current-main rebase at [`branches/main-rebased-97c6ff8b.patch`](branches/main-rebased-97c6ff8b.patch) was authored in the lab and is a full proposal, not the upstream MR patch.
