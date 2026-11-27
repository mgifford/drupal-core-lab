# Viewer-side comparison for #3636987

**AI-run, DRAFT.** These are screenshots and measurements from the registered `3636987-pinned`
comparison opened in the Lab viewer, not a person's manual test and not a substitute for a keyboard or
screen-reader pass.

Run 2026-11-27, core `8a7df6cc3e69` on both sides (Before pristine, After plus the November 20 patch),
Default Admin, plain Standard install.

## How it was run

The shared viewer on port 8100 was already serving another session's variant (`3534229-pinned`), so this
comparison used a private viewer instance on port 8110 and did not change the shared one:

```bash
PORT=8110 node tools/compare/serve.mjs 3636987-pinned
node tools/playwright/viewer-3636987.mjs --viewer=http://localhost:8110
```

`viewer-3636987.mjs` opens the viewer with Playwright Chromium 159, presses **Log in both**, sets a
colour mode with browser-context media emulation (`forcedColors` / `colorScheme`), opens
`/admin/content` and `/admin/structure/block`, prints **Run checks** in the forced modes and saves the
viewer page, each frame's select and the checks screen here. Browser-context emulation is the same
mechanism the scripted runs use; it is emulation, not a native Windows contrast theme.

## Results

| Mode | Page | Before frame (computed) | After frame (computed) | Viewer checks |
|---|---|---|---|---|
| forced-colours dark | /admin/content | `background-image: URL`, `appearance: auto`, 12px | `none`, `auto`, 12px | all 4 as expected: the CSSOM fix and the forced-colours "no custom background" checks fail Before, pass After; padding and appearance unchanged |
| forced-colours dark | /admin/structure/block | `URL`, `auto`, 23px (18 extra-small selects) | `none`, `auto`, 23px | all 4 as expected (fix checks 18 Before → 0 After) |
| forced-colours light | both | `none`, `auto`, 12px / 23px | `none`, `auto`, 12px / 23px | the CSSOM fix check fails Before/passes After; the forced-colours "no custom background" fix check passes on both, which the viewer flags as "did not reproduce". Expected: the defect only exists in dark forced colours. |
| dark | both | `URL`, `appearance: none`, 39px / 23px | same | visual only (checks expect forced colours) |
| light | both | `URL`, `none`, 39px / 23px | same | visual only |

The full viewer screenshots show both frames side by side; the `*-select.png` files are element
screenshots of the first select in each frame. `../screenshots/viewer-forced-dark-content-caret-5x.png`
and `...-extrasmall-caret-5x.png` are 5x enlargements of those: two chevrons Before, one After.

Note: the viewer header says **Theme: unknown** for `/admin/content` in these captures. That is a viewer
theme-label limitation on that page in this run (the block page shows `default_admin`, and every run in
`../playwright/` records `default_admin` from `drupalSettings`). It does not affect the frames or the
checks.

## Files

- `viewer-<mode>-<page>.png`: the viewer, both frames.
- `viewer-<mode>-<page>-before-select.png` / `-after-select.png`: the first select in each frame.
- `viewer-<mode>-<page>-checks.png`: the viewer's Checks table (forced modes only).
- [`viewer-results.json`](../viewer-results.json): the frame measurements and check rows as JSON.
- `viewer-debug.png`: an early run before login completed; kept as a record of the failed attempt, not evidence.

## What a person should still do

Open the comparison, repeat forced-colours dark by hand, Tab to a select in each frame (real keyboard),
and use the Manual panel. A person's log downloaded from the viewer belongs in this folder too.
