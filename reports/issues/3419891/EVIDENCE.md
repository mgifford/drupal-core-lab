# Evidence for #3419891: Increase size of alternative text field in Image dialog

**DRAFT.** A person has not reviewed this.

Issue: https://www.drupal.org/project/drupal/issues/3419891

## Environments

| Env | Directory | Commit | Notes |
|---|---|---|---|
| Before | `envs/baseline-3419891` | `47430c368bbd` (2026-10-06) | upstream main |
| After | `envs/issue-3419891` | `47430c368bbd` (2026-10-06) | same core plus patch from branch `3419891-increase-size-of` |

## Automated results

| Run | Command | Verdict | Directory |
|---|---|---|---|
| 2026-10-15T21:21Z | `node tools/playwright/evaluate-3419891.mjs 3419891-pinned` | **reproduced-and-fixed** | `playwright/2026-10-15T21-21-23-304Z-chromium-light-1280x900/` |

chromium 156.0.8078.4, light, 1280x900, darwin arm64.

| Check | Kind | Before | After |
|---|---|---|---|
| CKEditor5 image dialog opens and shows Alternative text field | precondition | true | true |
| Before: field is input; After: field is textarea | fix | input | textarea |
| After: textarea has minRows=1 | fix | N/A | 1 |
| After: textarea has maxRows=6 | fix | N/A | 6 |
| After: textarea width is 100% | fix | N/A | true |
| Before: long text scrolls horizontally | observe | yes | N/A |
| After: long text stays visible (no horizontal scroll) | observe | N/A | no (good) |
| axe violations | regression | 0 | 0 |

**Key measurements:**

Before (single-line input):
- Field tag: `input`
- Width: 234px
- Height after typing long text: 28px
- Horizontal scroll: **yes** (content scrolls out of view)

After (textarea with vertical growth):
- Field tag: `textarea`
- Width: 234px (100%)
- Height after typing long text: 74px (grows to fit content)
- Rows: 1 (minRows=1, maxRows=6)
- Horizontal scroll: **no** (content wraps and field grows)

The patch changes the Alternative text field from a single-line `<input>` to a `<textarea>` with `minRows=1` and `maxRows=6`, allowing the field to grow vertically as the user types, keeping all content visible.

## Manual results (keyboard, screen reader, forced colours)

AT/browser/OS versions: not recorded.

| Check | Baseline | Patched |
|---|---|---|
| Alternative text field is fully visible when typing long text | no (scrolls) | yes (grows) |

## Not verified

- No human keyboard pass, no screen-reader pass, no forced-colours or dark run.
- Only chromium/light/1280x900 run completed.
