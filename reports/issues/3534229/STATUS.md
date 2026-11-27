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
