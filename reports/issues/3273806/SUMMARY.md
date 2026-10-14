# #3273806 — WCAG non-text contrast on the toolbar orientation (direction) icon

Entry point for the lab's work on [Toolbar issue 3273806](https://www.drupal.org/project/toolbar/issues/3273806).

## The issue
- **Project:** Toolbar (contrib — the admin toolbar extracted from Drupal core; `drupal/toolbar-toolbar`). Target branch **`2.x`** (latest release 2.0.0). Installs on Drupal core `main` / 12.x (core no longer ships `toolbar`).
- **Problem:** the orientation ("direction") toggle icon's **rest state** uses the light `#bebebe` push icon on the light (`#f5f5f5`) toolbar background → **1.7:1**, below the **WCAG 2.2 SC 1.4.11 Non-text Contrast** 3:1 minimum.
- Reporter's proposed fix: use the darker `#787878` icon variant — which already exists and is already used on hover/focus.

## The fix (this lab)
Swap the orientation toggle's **rest-state** push icons (`push-left`/`push-right`/`push-up`) from `#bebebe` to the existing `#787878` variant — in the three theme copies, source and compiled:
- `css/toolbar.icons.theme.pcss.css` + `.css` (base)
- `css/claro/theme/toolbar.icons.theme.pcss.css` + `.css`
- `css/default_admin/theme/toolbar.icons.theme.pcss.css` + `.css`

Hover/focus already used `#787878` (unchanged). No other icons touched. 6 files, 18 lines.

Patch: [`branches/3273806-orientation-icon-contrast.patch`](branches/3273806-orientation-icon-contrast.patch) (see [BRANCHES.md](BRANCHES.md)).

## Evidence
- Rendered contrast proof: `proof/contrast-before-after.png` — **Before 1.7:1 (fail), After 4.05:1 (pass)**. Details in [EVIDENCE.md](EVIDENCE.md).
- **DRAFT** — the full DDEV before/after on a running site (core `main` + toolbar 2.x) is the agreed next step; not yet run.

## Status
Draft fix + patch + contrast proof ready. Not posted upstream; no drupalcode push.
