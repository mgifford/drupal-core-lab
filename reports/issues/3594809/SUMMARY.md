# #3594809: Use standard checkboxes on forms that require submission

**DRAFT.** Static patch and source analysis are recorded below. No live Drupal
comparison, screenshot, keyboard pass, assistive-technology pass, or browser
preference matrix was completed because Docker ran out of overlay space.

**This is the entry point for this issue.** The registered comparison is the
real Standard-install form at `/admin/appearance/settings`, using the Default
Admin theme.

Issue: https://www.drupal.org/project/drupal/issues/3594809  
Merge request: [!16770](https://git.drupalcode.org/project/drupal/-/merge_requests/16770)  
Fork branch: `main`  
Status snapshot: [STATUS-2026-11-23.md](STATUS-2026-11-23.md)

## Summary

Issue #3594809 distinguishes submission-based checkboxes from immediate-action
switches. In the pinned Core source, Default Admin loads
`form--checkbox-toggle.css`, which presents standalone native checkboxes as
40 by 24 pixel switches. The shared checkbox source presents native checkboxes
as 21 by 21 pixels with a checked indicator.

MR !16770 removes the toggle stylesheet from the library and empties both
toggle stylesheet files. The patch applies to its pinned Core base
`07d6e6935e795a62266697da0286a77b7c94b1a4`, but Core's CSS pipeline fails
because the two tracked files are empty. Stylelint reports `no-empty-source`
for both files, and the source/output check reports stale PostCSS.

The original MR patch is preserved byte for byte. The Lab added a separate
corrective patch that deletes the two empty files. A separate equivalent
rebase applies to Core `main` at
`97c6ff8b2534b242c0f1df3e4ba2493e56aebcec`; the original MR patch itself does
not apply there.

No result here establishes that the visual issue is fixed or that the MR is
ready to merge. The intended CSS effect and the patch hygiene problem are
established statically. Browser evidence is still required.

## Comparisons

| Slug | Purpose | After patch stack |
|---|---|---|
| `3594809-pinned` | MR exactly as published on its Core base | `main.patch` |
| `3594809-corrected` | Same MR plus the required file deletions | `main.patch`, `delete-empty-stylesheets.patch` |
| `3594809-latest` | Equivalent proposal on current `main` | `main-rebased-97c6ff8b.patch` |

## Files and links

| What | Where |
|---|---|
| Reproduction instructions | [REPRODUCE.md](REPRODUCE.md) |
| Exact evidence and commands | [EVIDENCE.md](EVIDENCE.md) |
| Patch provenance and checksums | [BRANCHES.md](BRANCHES.md) and [`branches/`](branches/) |
| Recipe | [`recipes/repro_3594809/`](../../../recipes/repro_3594809/) |
| Variant registration | [variants.json](variants.json) |
| Playwright evaluator, not yet run | [`tools/playwright/evaluate-3594809.mjs`](../../../tools/playwright/evaluate-3594809.mjs) |
| CSS failure report | [`css-build/2026-11-23-3594809-pinned-after.md`](css-build/2026-11-23-3594809-pinned-after.md) |
| Corrective CSS result | [`css-build/2026-11-23-3594809-corrected-after.md`](css-build/2026-11-23-3594809-corrected-after.md) |
| Latest rebase CSS result | [`css-build/2026-11-23-3594809-latest-after.md`](css-build/2026-11-23-3594809-latest-after.md) |
| Draft issue comment | [ISSUE-COMMENT-DRAFT.md](ISSUE-COMMENT-DRAFT.md) |
| Draft MR review update | [MR-UPDATE-DRAFT.md](MR-UPDATE-DRAFT.md) |
| Coverage matrix | [COVERAGE.md](COVERAGE.md) |

## Not verified

- The visual Before/After result on a running Drupal site.
- Pointer, keyboard, save, reload, and non-persistence behavior.
- Checked, unchecked, disabled, grouped, radio, long-label, and error states.
- Light, dark, OS-follow, forced-colors, increased-contrast, reduced-motion,
  zoom, reflow, narrow viewport, and RTL behavior.
- axe-core and browser accessibility-tree differences.
- Real VoiceOver, NVDA, or testing with disabled people.
- Host lint beyond the CSS check; host Composer is unavailable and DDEV could
  not start because Docker ran out of overlay space.

## Next action

When the shared environment has no active comparison pair, build
`3594809-pinned`, then run the evaluator. Do not stop the unrelated
#2574721, #3466040, or #3590502 pairs without their owners. If the visual and
behavior checks pass, repeat on `3594809-corrected` and `3594809-latest`. The
likely MR follow-up is to amend the patch so the two obsolete stylesheet files
are deleted, then rebase it on current Core.
