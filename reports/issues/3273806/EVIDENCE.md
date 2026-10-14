# Evidence: Toolbar issue 3273806 (orientation icon non-text contrast)

Status: DRAFT until the DDEV before/after is run and a human has reviewed.
Date: 2026-10-14   Author/agent: GitHub Copilot (Claude Opus 4.8)
WCAG: 2.2 SC 1.4.11 Non-text Contrast (3:1).

## Measured contrast (rendered proof)

The orientation toggle icon on the toolbar background (`#f5f5f5`), rest state:

| | Icon colour | Ratio | Result |
|-|-------------|-------|--------|
| Before | `#bebebe` (rgb 190,190,190) | **1.7:1** | ✗ fails 3:1 |
| After  | `#787878` (rgb 120,120,120) | **4.05:1** | ✓ passes 3:1 |

Proof: `proof/contrast-before-after.png`, data in `proof/contrast.json`. Matches the reporter's measured 1.7:1. Regenerate: `node tools/playwright/proof-3273806.mjs`.

## States (rest vs hover/focus)

Hover and focus **already used `#787878`** before this fix, and the toggle has **no background-color change** in any state (hover/focus only swap the icon image), so all states contrast against the same `#f5f5f5` surface:

| State | Before | After |
|-------|--------|-------|
| Rest  | `#bebebe` → 1.7:1 ✗ | `#787878` → 4.05:1 ✓ |
| Hover | `#787878` → 4.05:1 ✓ (already) | `#787878` → 4.05:1 ✓ (unchanged) |
| Focus | `#787878` → 4.05:1 ✓ (already) | `#787878` → 4.05:1 ✓ (unchanged) |

The fix brings the rest state up to the colour hover/focus already used; nothing regresses. The rendered proof covers the rest state (the only state that changes); the DDEV step below will confirm all three states live, in both orientations.

## Scope of the change
- Only the orientation toggle's **rest-state** push icons (`push-left`/`push-right`/`push-up`) change; hover/focus already used `#787878`.
- 6 files, 18 lines (3 icons × {base, claro, default_admin} × {source `.pcss.css`, compiled `.css`}).
- The darker icon assets already exist in the module (`icons/787878/push-*.svg`), so no new assets.

## Not yet verified
- Full DDEV before/after on a running Drupal core `main` + Toolbar `2.x` site (install the module, view the real toolbar, axe color-contrast scan + screenshots). This is the agreed next step.
- Real screen-reader / forced-colours passes (not applicable to this colour fix; forced-colors is a separate concern).

## Notes
- Other toolbar icons also use `#bebebe` (hamburger, person, pencil, questionmark, chevron-disc). They are **out of scope** for this issue (which is specifically the direction/orientation icon) but may warrant a follow-up contrast review.
