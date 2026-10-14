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

## States, and the focus indicator

The rest-state icon was the contrast failure. Fixing it to `#787878` matches the colour hover/focus already used — which would have removed the **only** focus cue (the icon darkening), because the toggle button's outline is suppressed (`.toolbar-lining button:focus { outline: none }`). So the fix **also adds a `:focus-visible` outline** to the toggle, keeping keyboard focus clearly visible (WCAG 2.4.7).

| State | Before | After |
|-------|--------|-------|
| Rest | icon `#bebebe` → 1.7:1 ✗ | icon `#787878` → 4.05:1 ✓ |
| Hover | icon `#787878` → 4.05:1 ✓ | icon `#787878` → 4.05:1 ✓ (unchanged) |
| Keyboard focus | icon darkens `#bebebe`→`#787878` (subtle; outline suppressed) | icon `#787878` + **`:focus-visible` outline → 7.52:1** ✓ |

The focus ring uses `--admin-color-focus` where available (light/dark-aware under Default Admin) with a high-contrast `#003ecc` fallback (7.52:1 on `#f5f5f5`). The rendered proof shows all three panels.

## Scope of the change
- The orientation toggle's **rest-state** push icons (`push-left`/`push-right`/`push-up`) change `#bebebe` → `#787878`; hover/focus icon rules unchanged (already `#787878`).
- A `:focus-visible` outline is added to `.toolbar-toggle-orientation button` so keyboard focus is visible after the rest/focus colours converge.
- Across base + claro + default_admin theme copies, source `.pcss.css` and compiled `.css`.
- The darker icon assets already exist in the module (`icons/787878/push-*.svg`), so no new assets.

## Not yet verified
- Full DDEV before/after on a running Drupal core `main` + Toolbar `2.x` site (install the module, view the real toolbar, axe color-contrast scan + screenshots). This is the agreed next step.
- Real screen-reader / forced-colours passes (not applicable to this colour fix; forced-colors is a separate concern).

## Notes
- Other toolbar icons also use `#bebebe` (hamburger, person, pencil, questionmark, chevron-disc). They are **out of scope** for this issue (which is specifically the direction/orientation icon) but may warrant a follow-up contrast review.
