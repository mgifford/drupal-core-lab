# Evidence: issue 3627936 (Active workspace has a broken styling in dark mode)

Status: DRAFT. **No before and after run has been recorded yet.** Docker stopped answering on 2026-10-15 after the disk nearly filled (392 MB free), so the evaluator
`tools/playwright/evaluate-3627936.mjs` (written, syntax checked, not run) and the lint have not run. Nothing below claims a result that was not produced.

## What exists

| Item | State |
|---|---|
| Issue brief and comment index | `intake/BRIEF.md`, fetched 2026-10-15; no merge request found, issue fork branch has 0 commits ahead of main |
| Environments | `baseline-3627936-latest` and `issue-3627936-latest`, core `ad11ba71c0f0` (main, 2026-10-15), built in 6 min 11 s; recipe `repro_3627936` (Workspaces, Workspaces UI, workspaces Stage and QA review) |
| The fix | `branches/3627936-active-workspace-dark-mode.patch` (sha256 68a00e6d), written in the lab and captured with `scripts/capture-patch.mjs`: `background-color: var(--admin-color-bg-item, #ebeae4)` in both `workspaces.overview.pcss.css` and the compiled `.css`. It applies cleanly to main. The environment is recorded against it by content |
| Handoff | `handoffs/issue.json` |

## Not run, and why

| Check | Why not |
|---|---|
| Dark-mode run, Before and After (`evaluate-3627936.mjs --scheme=dark`) | Docker unresponsive |
| Light-mode run (what must not change), forced colours | same |
| `scripts/lint.mjs 3627936-latest` (core's own checks: stylelint, the `.pcss.css` versus `.css` build check) | same |
| Contrast of the active row against other rows (comment #8 measured about 1.28:1 for two options) | needs the run; the patch uses the theme's hover colour, so the same low colour-only contrast is expected and is not claimed either way |
| A person's look in dark mode, forced colours and on hover | not done |
