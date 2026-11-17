# Branch patches for #867830

Extracted 2026-11-06 from https://git.drupalcode.org/issue/drupal-867830.git with `git diff <merge-base> <branch tip>`: only the branch's own changes.
Not rebased onto current `main`. The MR on drupal.org is the source of truth.

| Patch | Source | Tip | Base | Base date and subject | Files |
|---|---|---|---|---|---|
| [`branches/867830-unpublished-style-of.patch`](branches/867830-unpublished-style-of.patch) | https://git.drupalcode.org/issue/drupal-867830.git `867830-unpublished-style-of` | 0fcbb553 | 422099995ecf | 2025-07-11 Issue #3528139 by phenaproxima, tim.plunkett, catch: Package Manager should use a copy of Composer that is local to the current project, if available | 19 |

## Lab follow-up (not the issue's patch)

| Patch | Why | Applied |
|---|---|---|
| [`branches/867830-lab-followup-mark-hook-defaults.patch`](branches/867830-lab-followup-mark-hook-defaults.patch) | The branch removes `MARK_READ`, `MARK_NEW` and `MARK_UPDATED` from `core/includes/theme.inc` but does not update `core/lib/Drupal/Core/Theme/ThemeCommonElements.php`, where the `mark` theme hook defaults `status` to `MARK_NEW`. On core `422099995ecf` every page of the After site then fails with `Error: Undefined constant "Drupal\Core\Theme\MARK_NEW"` (line 136) once the theme registry is rebuilt. The follow-up sets `status` to `NULL` and declares the `type` variable the branch's templates print. Nothing else. Written in the lab on 2026-11-06. | After only, after the branch patch (`tools/compare/variants.json`, `867830-pinned`, `after.patches`). |

The branch has no merge request on drupal.org (checked 2026-11-06 with the GitLab API: no MR with source branch `867830-unpublished-style-of`). It does not apply to core `main` as of `3fb1c69d` (2026-11-06): the History module (#3570668, 2026-02), the Stable 9 theme (#3586221, 2026-07) and the Claro theme (#3584639, 2026-09) have been removed from core since the branch was written, and Olivero is no longer in core either. `867830-latest` is therefore not buildable.

## New local proposal (2026-11-09)

AI-assisted draft, not the #306 re-roll and not an upstream merge request.
No MARK constants, mark hook defaults, status classes or existing colour cues are removed.
The proposal adds a bold, visible Unpublished label independently of author metadata,
with `.visually-hidden` node/comment context in one translatable sentence.
It inherits the theme's colours rather than introducing a new palette or hiding utility.

| Patch | Project and base | Scope |
|---|---|---|
| [`867830-current-core-status.patch`](branches/867830-current-core-status.patch) | Core `3fb1c69d36927265f30e4dbc418828f5b884b73f`; captured with `scripts/capture-patch.mjs`, sha256 `11784dea` | Generic node/comment templates, Default Admin, Starterkit, and Umami node variants/comments (13 files) |
| [`867830-olivero-status.patch`](branches/867830-olivero-status.patch) | Olivero `bcd108499147b5a8f6d0820758302345be6b24ca` | Node full/default, separate teaser, comments (3 files) |
| [`867830-claro-status.patch`](branches/867830-claro-status.patch) | Claro `474f080c47f5ce21961bf90515fb7bdea1d7dcd4` | Node and comment overrides (2 files) |

All three apply cleanly to the named pins. Core and contrib patches are registered separately
in `867830-current-authoring`. `867830-current-latest` inherits that proposal and follows
Core main; it does not inherit the obsolete historical branch patch. Run patch checks before
building on newer Core. See [REPRODUCE.md](REPRODUCE.md) for the test commands and evidence gaps.
