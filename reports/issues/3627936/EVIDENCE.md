# Evidence: issue 3627936 (Active workspace has a broken styling in dark mode)

Status: DRAFT until a person has reviewed it. Docker stopped answering on 2026-10-15 after the disk nearly filled, was restarted, and the runs below were made afterwards. The pictures and numbers are in [BEFORE-AFTER.md](BEFORE-AFTER.md).

## What ran

| Item | Result |
|---|---|
| Issue brief and comment index | `intake/BRIEF.md`, fetched 2026-10-15; no merge request found, issue fork branch has 0 commits ahead of main |
| Environments | `baseline-3627936-latest` and `issue-3627936-latest`, core `ad11ba71c0f0` (main, 2026-10-15), built in 6 min 11 s; recipe `repro_3627936` (Workspaces, Workspaces UI, workspaces Stage and QA review) |
| The fix | `branches/3627936-active-workspace-dark-mode.patch`, written in the lab, captured with `scripts/capture-patch.mjs`, changed once (spelling in a comment, see PATCH-CHANGES.md); the After environment is recorded against its hash by content |
| Dark mode, Before and After (`evaluate-3627936.mjs --scheme=dark`) | **reproduced-and-fixed**: active row text 1.24:1 before, 7.46:1 after; axe 3 to 0; active row against other rows 11.87:1 to 1.28:1 |
| Light mode | **mixed**: the active row changes from warm grey to pale blue (a visible change in light mode); text contrast and axe unchanged |
| Forced colors (dark) | not-reproduced there; identical on both sides, the active row is not distinguishable (1:1) in either |
| `scripts/lint.mjs 3627936-latest` | PASS: CSpell, PHPStan, Stylelint. The first run failed CSpell on "colour"; fixed and recorded |
| Handoffs | `handoffs/issue.json`, `handoffs/patch.json` |

## Not done

| Check | Why |
|---|---|
| Firefox, WebKit; zoom and reflow; a keyboard pass (the page has no new interaction) | not run |
| A person's look in dark mode, forced colors and on hover | not done |
| The pinned variant | same commit as latest today; not built |
| A non-color indicator for the active state | not written: it may belong to #3207233, a person decides |
| Measurement correction | a first set of runs used a hand-written color parser that mis-read percentage alpha; those runs were deleted and re-made with exact colors (a canvas); only the re-made runs are kept |
