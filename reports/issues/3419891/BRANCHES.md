# Branch patches for #3419891

**DRAFT.** Extracted and generated 2026-11-26. A person has not reviewed this revision.

Upstream source of truth is the issue fork and MR !16984. Patches are recorded by content so a changed file is visible.

| Patch | Source | What it changes | sha256 (16) | Lines |
|---|---|---|---|---|
| [`branches/3419891-increase-size-of.patch`](branches/3419891-increase-size-of.patch) | MR !16984 head `1931822c77bb`, fork branch `3419891-increase-size-of` | 7 files: textarea instead of input, `minRows=1`/`maxRows=6`, balloon reposition on `update`, width CSS, compiled bundle, three PHPUnit selector updates | `b40e9c7928357e39` | 129 |
| [`branches/3419891-followup.patch`](branches/3419891-followup.patch) | Local follow-up generated in this lab | 3 files: reset the field before restoring the value; rebuilt `drupalImage.js`; new FunctionalJavascript regression test | `e2f9683bb3e2681e` | 105 |
| [`branches/3419891-consolidated.patch`](branches/3419891-consolidated.patch) | MR patch then follow-up | 8 files: everything above, as one patch | `e3f33e7c4327f197` | 217 |

## Bases and applicability

| | |
|---|---|
| Core base for all three | `0387fb948f786bc344a5cc54aa0d98b8f552e378` (2026-11-25) |
| Core the MR was written against | `47430c368bbd` (package.json `ckeditor5 ^48.5.1`) |
| Verified with | `node tools/compare/setup.mjs 3419891-pinned --check-patches` and `git apply --check` in a clean worktree |
| Result | MR patch applies cleanly to `0387fb948f7`; follow-up applies on top of the MR; consolidated applies to pristine `0387fb948f7` |

The follow-up was produced by applying the MR patch to a clean `0387fb948f7` worktree, committing that state, applying the local edits and the rebuilt bundle, and taking `git diff`. The MR patch itself is byte for byte the one downloaded by the issue intake; it was not edited.

## Rebuilding the bundle

Source of truth: `core/modules/ckeditor5/js/ckeditor5_plugins/drupalImage/src/imagealternativetext/drupalimagealternativetextui.js`.
Compiled artifact: `core/modules/ckeditor5/js/build/drupalImage.js` (never edited by hand).

```
cd envs/issue-3419891-followup
ddev exec bash -lc "cd core && corepack yarn build:ckeditor5"
```

Core's own webpack build regenerated `drupalImage.js` (18.8 KiB) and `drupalMedia.js` (the latter was already identical). The consolidated patch contains the resulting bundle.

## Fixture correction (laboratory, not part of the proposal)

`recipes/repro_3419891/config/install/*.yml` moved to `recipes/repro_3419891/config/*.yml`.

At `0387fb948f7`, `ConfigConfigurator` reads a recipe's configuration from `<recipe>/config`; a `config/install` subdirectory is not a config storage root for the recipe itself. The old layout imported nothing, which stayed invisible while an earlier core supplied a Basic page type. The fixture is shared by Before and After and is not code under test. The corrected recipe is recorded in this repository, not in either patch.

## Provenance of the MR patch

- Downloaded from MR !16984 by `scripts/issue-intake.mjs` (snapshot `reports/issues/3419891/intake/sources.json`, diff sha256 prefix `55bce1ba`, 46350 bytes).
- Fork tip at evaluation time: `1931822c77bbd79c930884a8fd413ada3cc0917b` (`git ls-remote https://git.drupalcode.org/issue/drupal-3419891.git`), matching the MR head.
- Review threads: the GitLab discussions API answered HTTP 401. Nothing is inferred from their absence; the MR page itself reported no comments.
