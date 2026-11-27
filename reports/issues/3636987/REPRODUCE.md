# Reproduce #3636987: duplicate select caret in forced-colors + dark mode

**DRAFT: setup and reproduction steps. The pair was built and the scripted runs completed on 2026-11-27; see [EVIDENCE.md](EVIDENCE.md). A person has not reviewed it.**

Issue: https://www.drupal.org/project/drupal/issues/3636987
Title: "The position of the caret on select elements is shifted in forced color mode"
Pinned core: `8a7df6cc3e69` (current `main` on 2026-11-27; fetched when this folder was scaffolded).
Prepared: 2026-11-27.

## The barrier

Task: in the Default Admin theme, read and use a `<select>` in the content administration list
(`/admin/content`) and in the block layout (`/admin/structure/block`).

Barrier: with a dark colour scheme and forced-colours mode active (Windows High Contrast, Edge/Chromium
"Emulate CSS media feature forced-colors: active", or the viewer's Conditions > Forced colours), the
Default Admin theme keeps its own SVG chevron **and** restores the browser's native caret with
`appearance: revert`. Two chevrons are drawn, so the caret position and size the reporter sees differ
from the non-forced-colours state. The issue's screenshots are in
[`intake/attachments/`](intake/attachments/): `double-arrow.png` (the defect) and `single-with-js.png`
(one caret after a DevTools `background-image: none` rule).

Cause (from the reporter and comment #6, reproduced here): the forced-colors declaration block matches
`.form-element--type-select` (specificity 0-1-0) and its `:focus`/`[disabled]` variants, but the dark
mode rule `.dark-mode .form-element--type-select` (0-2-0) is more specific, so `background-image` keeps
the SVG. `appearance: revert` is not contested, so the native caret also appears.

## Comparison identity

- Registered variant: `3636987-pinned` in [`variants.json`](variants.json) (a per-issue variant file;
  `tools/compare/variants.json` is not modified).
- Before: `baseline-3636987`, core `8a7df6cc3e69b6b5d427cb25ce8f66dda8393c29`, no patches.
- After: `issue-3636987`, same core, plus
  [`branches/3636987-forced-colors-select-2026-11-20.patch`](branches/3636987-forced-colors-select-2026-11-20.patch)
  (issue attachment 7210257, comment 16848691, 2026-11-20; unmodified by the lab).
- Recipe: none. **Plain Standard install** on both sides: Default Admin is the admin theme, its dark
  mode setting is `auto`, and the Navigation module provides the sidebar. Log in as `admin` / `admin`
  (or use the one-time link from `ddev drupal login`; never type a password).
- No merge request or issue fork branch exists (checked 2026-11-27). The lab did not author the patch.

## Build, start, look

Run from the lab root with Docker and DDEV available. Keep this order; `setup.mjs` refuses to run two
setups at once, so check `envs/.setup.lock` is gone (another issue's build may be running).

```bash
node scripts/doctor.mjs 3636987-pinned
node tools/compare/setup.mjs 3636987-pinned --check-patches
node tools/compare/setup.mjs 3636987-pinned
node scripts/lab-env.mjs start 3636987-pinned --browser
```

`--check-patches` only reports whether the imported patch still applies to the pinned commit. The full
run builds the two worktrees, runs Composer, installs Standard on both sites and applies the patch to
After. It is resumable: re-run it if it stops. **Built on 2026-11-27 (exit 0, 11:00 EST)**: both
projects are `repro-baseline-3636987` and `repro-issue-3636987` at core `8a7df6cc3e69`, plain Standard,
no recipe. Start the viewer with `node scripts/lab-env.mjs start 3636987-pinned --browser`.

The viewer opens at https://drupal-compare.ddev.site (or http://localhost:8100). Log in to both frames
(admin / admin), then reproduce by hand:

1. Open **Conditions** and choose **Forced colours: Dark**. Both frames report forced colours on with a
   dark colour scheme. Open `/admin/content` in both frames.
2. Keep **Mirror** off for the step under test. In each frame, look at the *Status* and *Content type*
   filters: Before shows Drupal's SVG chevron plus the browser's native caret (two); After shows one
   caret.
3. Switch to **Forced colours: Light**: both sides show one caret.
4. Tab to a select with real keyboard input in each frame (do not script or force `:focus-visible`).
   Before and After both show one caret and a visible focus indicator.
5. Open `/admin/structure/block`. The region selects in the block table use
   `.form-element--extrasmall`. In forced-colours dark, Before shows two chevrons on the extra-small
   selects, After one. Check the select's size and padding did not move.
6. Turn forced colours off and set **Color mode: Dark**. Both sides show Drupal's custom chevron
   (one): the patch must not change the non-forced-colours rendering.
7. Optional RTL: set **Text direction** to RTL in the viewer (a simulation, not a native RTL
   language). The caret moves to the other edge on both sides; no extra chevron appears.

Press **Run checks** with forced colours set: the fix checks read computed styles and say so when
forced colours are off. Answer the **Manual** panel for each side.

## Scripted replay

One invocation covers one colour mode and both pages (normal + extra-small selects), real Tab focus, a
disabled state set by attribute (no naturally disabled select exists on those pages) and RTL set by the
`dir` attribute (simulated). It writes a dated folder under [`playwright/`](playwright/).

```bash
node tools/playwright/evaluate-3636987.mjs 3636987-pinned --scheme=light
node tools/playwright/evaluate-3636987.mjs 3636987-pinned --scheme=dark
node tools/playwright/evaluate-3636987.mjs 3636987-pinned --scheme=light --forced-colors
node tools/playwright/evaluate-3636987.mjs 3636987-pinned --scheme=dark --forced-colors
node tools/playwright/evaluate-3636987.mjs 3636987-pinned --scheme=dark --forced-colors --viewport=480x900
```

The script records computed `background-image`, `appearance`, `padding-inline-end`, `background-size`
and `background-position` for every select in every state. "Exactly one caret" is read as
`background-image: none` (no Drupal SVG) plus a native `appearance` (the browser paints its own caret)
and confirmed in the screenshots; the native caret cannot be counted from script.

The viewer-side pass is `tools/playwright/viewer-3636987.mjs` (it opens the registered comparison in
the Lab viewer, logs in both frames, sets a colour mode and presses the viewer's Run checks). The AI-run
captures are in [`manual/`](manual/README.md); a person's own pass is still open.

Five runs are the matrix in [`variants.json`](variants.json): light, dark, forced light and forced dark
at 1280, and forced dark at 480. Results, verdicts and the superseded-run notes are in
[COVERAGE.md](COVERAGE.md) and [EVIDENCE.md](EVIDENCE.md); `node scripts/run-readmes.mjs 3636987` pairs
the images Before/After.

## Generated CSS

The change touches a `.pcss.css` source. Rebuild and compare with core's own toolchain:

```bash
node scripts/css-build.mjs 3636987-pinned --check
node scripts/css-build.mjs 3636987-pinned --build
node scripts/lint.mjs 3636987-pinned
```

Core's CI fails a merge request whose compiled CSS does not match its PostCSS source. `--build` runs
core's `yarn run build:css` in the After checkout only; if the imported patch's `.css` is already the
build output it changes nothing, otherwise the lab records a corrective follow-up patch rather than
editing the imported one. Here `--check` passed and running core's build on the file produced no further
diff (see [EVIDENCE.md](EVIDENCE.md)).

`node scripts/lint.mjs 3636987-pinned` passes Stylelint, CSpell, PHPStan and the CSS build. Core's
`commit-code-check.sh` reports the two CSS files "should not be executable"; that is a known false
positive when DDEV runs with `performance_mode: none` (the bind mount makes `test -x` true for every
file, including a 644 `README.md`), not the patch. A Mutagen re-run would be needed to confirm.

## What is in this folder

- [`SUMMARY.md`](SUMMARY.md): entry point with the result and the evidence links.
- [`EVIDENCE.md`](EVIDENCE.md): commits, runs, computed values, screenshots.
- [`BRANCHES.md`](BRANCHES.md): patch provenance.
- [`ISSUE-COMMENT-DRAFT.md`](ISSUE-COMMENT-DRAFT.md): a draft for a person to review and post.
- [`STATUS-2026-11-27.md`](STATUS-2026-11-27.md): issue state snapshot.
- `branches/`: the imported patch, unchanged.
- `intake/`: the issue snapshot, comment index and the reporter's screenshots.
- `playwright/`: scripted runs (one folder per mode).
- `css-build/`, `lint/`: outputs of the CSS consistency check and code-quality checks.

## Not verified (record in SUMMARY.md before posting)

- Firefox and WebKit were not run for this issue; the defect is a Chromium forced-colours rendering
  report (Edge, and the independent Chromium 144 evaluation).
- A native Windows High Contrast theme was not used: forced colours are emulated (browser/viewer).
- No real VoiceOver/NVDA pass and no person's keyboard pass; the scripted Tab focus is not a substitute.
- No native RTL language install: RTL is simulated with the document `dir` attribute.
- 200% zoom and text-spacing overrides were not run.
