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
