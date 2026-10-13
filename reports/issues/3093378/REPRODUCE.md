# Reproduce #3093378: Use ARIA disclosure pattern for submenu buttons in vertical toolbar orientation

Issue: https://www.drupal.org/project/toolbar/issues/3093378 (project `toolbar`, version 2.x-dev)
Merge request: https://git.drupalcode.org/project/toolbar/-/merge_requests/6 (branch `3093378-use-aria-disclosure`)
Verified core: `4f9558d85e7db3f2fc0e4a5cde195a1834cb6206` (2026-10-12) — the commit the `-latest` variant resolved to when last run. Last verified: 2026-10-13.

## The problem in one paragraph
When the Manage toolbar is open in the **vertical** orientation (narrow viewport, below the 1024px breakpoint), each section with a submenu has a disclosure button. The button is an icon and a visually hidden name. Before this MR the name *is* the action and flips with the state — `<button class="toolbar-icon toolbar-handle"><span class="action">Extend</span> <span class="label">Structure</span></button>` becomes `Collapse` when open — and there is no `aria-expanded`, so the open/closed state is not machine readable (WCAG 4.1.2 Name, Role, Value). The MR moves the state to `aria-expanded` and makes the name a stable "<name> menu".

## Reproduce it (latest core, this is what was run)
    node tools/compare/setup.mjs 3093378-latest       # builds Before and After (contrib toolbar 2.x + the MR patch), applies recipe repro_3093378
    node scripts/lab-env.mjs start 3093378-latest     # both sites + viewer
    node tools/playwright/evaluate-3093378.mjs        # scripted evidence: markup, aria-expanded, accessible name, axe, screenshots

Then read `playwright/<stamp>-chromium-480x900/SUMMARY.md`.

## Reproduce it on the pinned commit
    node tools/compare/setup.mjs 3093378-pinned
    node tools/playwright/evaluate-3093378.mjs
(Not built yet; the `-pinned` variant pins core to `4f9558d85e7db3f2fc0e4a5cde195a1834cb6206`, the commit this was verified on.)

## Environment note: core `navigation` must be off
Core ships the **Navigation** module and the Standard profile requires it. The contrib Toolbar module yields to it:
`Drupal\toolbar\Hook\ToolbarHooks::pageTop()` returns early when the current user may `access navigation` and the Navigation module exists. With Navigation installed, the site shows Navigation's own admin bar and the Toolbar module renders nothing — so the change cannot be seen. The recipe therefore ships an optional `apply.sh` (run by `scripts/lab-site.sh apply`) that uninstalls `navigation`, so the classic Toolbar is what renders, identically on both sides. This is the realistic configuration for a site that uses the contrib Toolbar module.

## If the result is not what you expect
| What you see | What it probably means | What to do |
|---|---|---|
| The MR **patch does not apply** to the contrib module | The `2.x` branch moved | Refresh `branches/3093378-use-aria-disclosure.patch` from MR !6 (`git diff <2.x tip> <branch tip>`), update `BRANCHES.md`. |
| No `.toolbar-handle` buttons at all | The tray is horizontal (viewport ≥ 1024px), or Navigation is still enabled | Use a viewport below 1024px (e.g. 480x900); check the recipe's `apply.sh` uninstalled `navigation`. |
| **Before already has `aria-expanded`** | The MR was merged, or core/contrib changed | Check the toolbar `2.x` branch and MR !6 before concluding anything. |
| **No visible difference anywhere** | Expected: the change is markup/AT only | Compare the DOM and the accessibility tree, and the pixel diff — not the pixels alone. |

## Re-pin after verifying on newer core
1. Run the `-latest` variant to the end and confirm `evaluate-3093378.mjs` reports all checks as expected.
2. Put the built commit (`git -C envs/issue-3093378-latest rev-parse HEAD`) in `core.commit` of `3093378-pinned` in `tools/compare/variants.json`.
3. Re-run and commit the new evidence, then update "Last verified" above.

## What is in this folder
| Path | What |
|---|---|
| `branches/*.patch`, `BRANCHES.md` | The MR !6 patch, with source, tip, base and date. |
| `EVIDENCE.md` | Results with exact commits. DRAFT until a person has reviewed it. |
| `STATUS-<date>.md` | Related issues and review threads, dated. Re-check on drupal.org before relying on it. |
| `playwright/`, `compare/`, `screenreader/` | Generated evidence from the scripts. |
| `ISSUE-COMMENT-DRAFT.md` | A draft for a human to review and post. Nothing is posted automatically. |
