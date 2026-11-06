# Patches for #3155130

There is no merge request. Both patches are from comment #6 (nod_, 2020-06-26) or derived from it.

| Patch | Source | Base | Notes |
|---|---|---|---|
| [`branches/core-summary-a11y-3155130-6.patch`](branches/core-summary-a11y-3155130-6.patch) | https://www.drupal.org/files/issues/2020-06-26/core-summary-a11y-3155130-6.patch (comment #6) | Drupal 9.1 era | Original. Does not apply to current core (files moved; `text_with_summary` removed 2026-09-02). Kept for reference, not applied. Its author notes it changes the summary field's `name`. |
| [`branches/3155130-ported-f48d0a58.patch`](branches/3155130-ported-f48d0a58.patch) | Written in the lab on 2026-11-05 from the original's intent | core `f48d0a58b3ec0395f486f1987a28811ab6ee5936` (2026-08-31) | `<details>` around the summary field and deletion of `core/modules/text/js/text.js`. Applies cleanly at that commit. Not an MR. |
