# Branch patches for #3637339

Extracted 2026-11-18 from https://git.drupalcode.org/issue/drupal-3637339.git with `git diff <merge-base> <branch tip>`: only the branch's own changes.
Not rebased onto current `main`. The MR on drupal.org is the source of truth.

| Patch | Source | Tip | Base | Base date and subject | Files |
|---|---|---|---|---|---|
| [`branches/3637339-skip-to-main.patch`](branches/3637339-skip-to-main.patch) | https://git.drupalcode.org/issue/drupal-3637339.git `3637339-skip-to-main` | 8c4a0e70 | 7480c58b75c0 | 2026-11-13 task: #3579889 Replace @return void with native void return types | 2 |

## Assessment identity

- MR !17818 head: `8c4a0e703168ebe9c3b37d3a8d00a2e89bc7ffa5`.
- MR merge base / pinned core: `7480c58b75c058f850b45e81664ac1df7d309744`.
- Latest pair built on 2026-11-18: `ecb483ff6d4b3845fcbc81700843d320c50e46c1` on both sides.
- Patch SHA-256: `d7f7290a5379e7019bc9ec0ed105a9db9763fef2b1dd3544c5cf96e3c312da1c`.
- Before: unmodified core, no patches.
- After: only the saved MR patch. No additional implementation, CSS override or experimental fix.
- Precondition: plain Standard install, logged-in administrator, Default Admin settings page. No recipe.

The MR adds `outline: var(--focus-outline)` and `outline-offset: var(--outline-offset)` to the focused skip-link rule,
in its source and generated CSS. The saved patch applies cleanly to both declared core bases.
No interdiff is needed for the unchanged upstream patch itself. The separate local revision below includes both artifacts.

The issue and all seven fetched comments were read on 2026-11-18. MR discussions were not accessible (HTTP 401).
The mentioned [Gin work item 3506305](https://git.drupalcode.org/project/gin/-/work_items/3506305) was read directly:
its migrated summary reports label contrast and focus-color problems and references Gin MR !581.
Its old Drupal.org URL was not resolved by the intake API (not found). Gin comments and MR review threads were not retrieved;
the intake's empty related-issues table is not evidence that no related work exists.

## Separate experimental clearance proposal

The original MR was evaluated first. Its configured outline is correct, but repeated measurements show 6px top/start overflow;
model-inspected screenshots corroborate clipping. The smallest local experiment adds token-derived block-start and inline-start
clearance to the focused rule, not a different focus-color implementation. No module, dependency or viewer redesign is needed.
This is a Lab proposal, not an upstream MR revision.

The two declarations use `calc(var(--outline-size) + var(--outline-offset))`, rather than a hard-coded 6px.
They change only the focused link's absolute position, in source and generated CSS.
The [experimental comparison](variants.json) is `3637339-focus-clearance`, fixed at core `ecb483ff6d4b`:

- Before: `issue-3637339-latest`, MR patch only.
- After: `issue-3637339-focus-clearance`, MR patch followed by the captured clearance patch.
- The pristine baseline and the official MR patch are unchanged.

| Artifact | Starting tree | SHA-256 |
|---|---|---|
| [Clearance interdiff](branches/3637339-focus-clearance.patch), captured with `scripts/capture-patch.mjs` | MR !17818 tip `8c4a0e70`, or current core with that MR applied | `ec981f3367c5904d274d50035a13e12b3ba56d6e2fccf1662c401eef26bf124f` |
| [Complete revised patch](branches/3637339-focus-clearance-full.patch) | Clean core `ecb483ff6d4b3845fcbc81700843d320c50e46c1` | `a5310458f845c4660dd1d4f6cee34c86904d17dc96e6bc2c2673271f10c0486d` |

The complete patch replaces the original patch; do not apply it on top of the MR or together with the interdiff.
For an existing MR branch, apply only the interdiff and add a follow-up commit with contributor agreement. Otherwise, make a
new branch from the declared tip and reference the original MR. Neither route requires rewriting shared history.

Four isolated-index checks passed: the standalone reproduces the declared stack on current core; the saved original patch
reconstructs the exact upstream MR tip; the interdiff applies directly to that tip; and the original-base proposal transplanted onto
current core yields the same tree (`35ade80ef97017e6bc046cea184ab0ef4e5324d5`).
These are packaging checks, not a runtime test claim. See [EVIDENCE.md](EVIDENCE.md) for experimental test outcomes.
The [human review handoff](HUMAN-REVIEW.md) identifies which artifact to apply, how to compare the registered sites,
and which keyboard, screen-reader and upstream-review checks remain open. No new patch bytes were introduced for that handoff.

AI-assisted: Copilot SDK in VS Code. Existing Drupal MR code is repackaged at the user's request under its existing GPL-2.0-or-later
terms; the positioning follow-up is Lab-authored. No new license is introduced. Human review remains required.
