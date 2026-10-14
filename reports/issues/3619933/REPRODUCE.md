# Reproduce #3619933 (Default Admin theme)

Issue: https://www.drupal.org/project/drupal/issues/3619933
Fork branch: `drupal-3619933` (no merge request recorded). Patches and their bases are in [BRANCHES.md](BRANCHES.md):

- [branches/3619933-drupal-admin-theme.patch](branches/3619933-drupal-admin-theme.patch) (25 files, 19 commits)
- [branches/3619933-drupal-admin-theme-local.patch](branches/3619933-drupal-admin-theme-local.patch) (22 files, 12 commits)

## Status of this folder (2026-10-14)

This folder has **not been built as a lab Before/After pair**, so there are no viewer steps, checks or variants.

Its subfolder [`dark-mode-accent/`](dark-mode-accent/) holds Default Admin high-contrast and focus-ring contrast material
(patches, a change record, a 197-check contrast matrix, a `verify-contrast.js`, and a zip). **The relation to this issue
is filed by file overlap, not confirmed** — all 18 files it touches are among the 25 files in the branch patch above.
Confirm the issue number and correct the note in [BRANCHES.md](BRANCHES.md) if it is wrong.

## What was verified, and what was not

Nothing has been run end to end in this lab. The material in `dark-mode-accent/` reports its own results (see its
`CHANGE-RECORD.md`), but those were produced outside the lab build and have not been reproduced here. See
[EVIDENCE.md](EVIDENCE.md) (DRAFT) and [STATUS.md](STATUS.md).
