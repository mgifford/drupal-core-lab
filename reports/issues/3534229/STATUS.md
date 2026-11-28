# Status: #3534229 CKEditor 5 toolbar-configuration icons in forced-colors mode

Snapshot: 2026-11-27 (DRAFT; a person has not reviewed it). Nothing was posted, pushed or changed upstream.

## Where the issue stands on drupal.org

| | |
|---|---|
| Issue | [#3534229](https://www.drupal.org/project/drupal/issues/3534229), ckeditor5.module, main |
| Status | **Active** (1), Normal priority, Bug report |
| Tags | high contrast, Accessibility, forced colors |
| Created / last changed | 2025-07-04 / 2026-07-27 (8 comments) |
| Assigned | nobody |
| Merge request | **none** |
| Issue fork | `https://git.drupalcode.org/issue/drupal-3534229.git`, branch `3534229-ckeditor-config-buttons` — **zero commits** beyond core `main` (checked 2026-11-27); no MR; nothing to take over |
| Last comments | #6 quietone (field change, 2026-06-25); #7 kentr's mask experiment (2026-07-24); #8 mgifford's thanks and forced-colors links (2026-07-27) |
| Related | #3637246 (open, MR !17909: toolbar contrast in light/dark; compatibility checked here, not modified), #3506329 (Gin theme, open) |

## What this Lab evaluation is

A local, CSS-only proposal for #3534229, built on kentr's comment #7 mask idea, registered as the Lab
comparison `3534229-pinned` (Before: pristine pinned core; After: the proposal) with a compatibility variant
`3534229-combined-3637246`. See [`REPRODUCE.md`](REPRODUCE.md) and [`SUMMARY.md`](SUMMARY.md).

## Current evidence status

- Defect **reproduced** on pristine pinned core in forced-colors **dark** (31 of 35 rendered control instances
  invisible) and **not reproduced** in forced-colors light (0/35): the bug is palette-dependent.
- Proposal **fixes** it in forced dark, forced dark RTL, forced dark at 480 px: 0 of 35 invisible, 21:1 minimum
  contrast; normal light/dark rendering is byte-identical Before/After.
- Hover, keyboard focus and tooltips were measured on every item; no icon is lost.
- Core code checks **PASS** (CSpell, PHPStan, Stylelint); no generated CSS is involved (plain `.css`).
- Fixture A/B/C comparison confirms kentr's whole-control mask is not sufficient for the full UI (it clips the
  Alignment caret and removes the background image of un-opted contributed plugin icons), while the opt-in
  proposal leaves those alone.
- **Done since the first snapshot**: the combined-#3637246 variant now has its own environment and is
  measured in both forced palettes (dark: 31/35 → 0/35; every button computes `filter: none`, so the MR's
  dark-mode invert is cancelled); keyboard reordering (move and reverse-move), pointer drag, and
  save/reload/restore all work and match Before; the 480 px normal-mode row now passes with 0 differences.
  The `lab-env status` patch warning for the combined variant is reconciled.
- **Not done**: Windows contrast themes, Firefox/Safari, a human keyboard and screen-reader pass; whether the
  pre-existing focus-after-keyboard-move behaviour (focus lands on the first Available button, identical
  Before/After) is visible to a person.

Full detail, run folders and limits: [`EVIDENCE.md`](EVIDENCE.md); coverage gaps:
[`COVERAGE.md`](COVERAGE.md).

## Recommendation (a person decides)

Needs review is defensible on the evidence here **after** the interaction run and a real Windows contrast-theme
pass. RTBC is not justified yet: those two checks are missing and no second person has reviewed the patch.
Do not post this comment or open a merge request without the owner's approval.

## Handoff: paused pending manual testing (2026-11-27)

Automated evaluation is complete and the combined-variant patch warning is reconciled. The Lab comparison can
be rebuilt with:

```bash
node tools/compare/setup.mjs 3534229-pinned
node scripts/lab-env.mjs start 3534229-pinned
node tools/playwright/evaluate-3534229.mjs 3534229-pinned --forced-colors --scheme=dark
```

Then the manual work that is still required:

1. `MANUAL-WINDOWS.md` — real Windows contrast themes (light and dark, Edge/Chromium and Firefox, custom palette).
2. A person's keyboard pass, including the pre-existing focus-after-keyboard-move behaviour recorded in
   `EVIDENCE.md`, and a screen-reader pass.
3. Optional: Firefox/Safari evidence where forced colors can be tested; neither is available on this host.

Readiness: **Needs review** on the automated evidence; **not RTBC**. Nothing was posted to drupal.org. A clean
branch with only this issue's files was prepared from `origin/main` for review (see the pull request).

## Update 2026-11-28: upstream MR !18007, MR-identical re-verification

**Upstream:** issue #3534229 is **Needs review** (status 8, 9 comments). [MR !18007](https://git.drupalcode.org/project/drupal/-/merge_requests/18007)
("Resolve #3534229 \"Ckeditor config buttons\"") is **open, not draft**, author `mgifford`, branch
`3534229-ckeditor-config-buttons`, head `50833b75`, target `main`. It is the consolidated implementation built on
kentr's comment-#7 mask PoC and this Lab work.

**Lab:** the evaluation PR #137 is merged in `main`; follow-up PR #140 registered the MR and re-pointed the
comparisons — `3534229-pinned` = final Lab mask patch + `3534229-consolidated-mask.patch` (stylesheets identical
to the MR), `3534229-latest` = `3534229-mr-18007.patch`, `3534229-combined-3637246` = #3637246 + MR patch.

**MR-stack verification (2026-11-28, Chromium 159 emulated forced colors):** forced dark 31/35 → 0/35
(19.43:1 min, tooltips 35/35); forced dark RTL and 480 px also 31/35 → 0/35; forced light not reproduced;
normal light/dark and 480 px unchanged (colour-statistic comparison); WebKit normal mode clean; accessibility
tree/ARIA/speech identical Before/After; interaction (keyboard reorder, drag, save/restore) clean. Older
27 Nov runs are retained but marked stale for the MR stack. `COVERAGE.md`: 7 of 9 rows current; remaining gaps
are Firefox normal + forced only (Playwright Firefox crashes on this host).

**Combined #3637246 + MR compatibility: done.** After refreshing the combined environment to the MR patch stack
(patch-state `verified`): forced dark `reproduced-and-fixed` (31/35 → 0/35, `filteredButtons` 0, every button
`filter: none`), forced light `not-reproduced`. The MR's dark-mode invert is still cancelled in forced colors.

**Why the issue is "Needs work":** the Needs Review Queue Bot changed the status on 2026-11-28 01:25Z because
the MR fails the Drupal core commit checks. MR !18007's mirrored pipeline 1071935 is failed; its failed jobs are
CSS linting (stylelint), PHPUnit Unit (Component and Core, 8.6-ubuntu) and Nightwatch. Running the Lab's core
lint on the MR-identical stack reproduces the CSS-lint failure: **stylelint 35 errors in 18 files** — 34
auto-fixable — mostly `declaration-empty-line-before` for the new custom-property blocks, one
`prettier/prettier` selector-list formatting error in `toolbar.admin.css`, and one `order/properties-order`
(`pointer-events` before `background-color`). Report: `lint/2026-11-28-3534229-pinned-after.md`. The earlier Lab
proposal passed lint; these are formatting defects introduced by the consolidation. The PHPUnit/Nightwatch
failures were not reproduced locally.

**Stylelint repair prepared:** [`branches/3534229-stylelint-fix.patch`](branches/3534229-stylelint-fix.patch)
(sha256 `e42c2bb30151ada8`, 18 files, +138/−32) applies cleanly to the MR tip `50833b75`, and with it
`node scripts/lint.mjs 3534229-pinned` **passes**. The sorted declarations are unchanged, so it is formatting-only.
The imported MR patch was not modified and the After checkout was reverted to the imported state (`patch-state:
verified`). The MR author still needs to apply and push it, then re-run the review queue.

**Still outstanding:** pushing the repair to MR !18007 and re-running the review queue; the unrelated failed CI
jobs (PHPUnit Unit 8.6, Nightwatch) were not reproduced locally; real Windows contrast themes; a human keyboard and
screen-reader pass. Nothing was posted to drupal.org; MR !18007 has not been reviewed or commented on by this
session.
