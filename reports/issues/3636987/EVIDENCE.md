# Evidence: #3636987 duplicate select caret in forced-colours + dark mode

**DRAFT. AI-assisted. A person has not reviewed these results.** The runs are scripted Chromium with
emulated forced colours; no person's keyboard pass and no real screen reader.

Date: 2026-11-27. Issue: https://www.drupal.org/project/drupal/issues/3636987

## What was tested

Current core `main` (`8a7df6cc3e69b6b5d427cb25ce8f66dda8393c29`, 2026-11-27), Default Admin theme,
plain Standard install, before and after the November 20 patch from the issue
([comment 16848691](https://www.drupal.org/project/drupal/issues/3636987#comment-16848691), attachment
7210257, sha256 `966db1af875a76017dbe1b016bf00cb40fefdca081c43299bbf42168602e5da8`). The patch is
imported unchanged; the lab did not author it.

The defect: in forced colours with the dark colour scheme, the forced-colours declaration block
(`background-image: none; appearance: revert`) matches `.form-element--type-select` (0-1-0), but the
dark-mode rule `.dark-mode .form-element--type-select` (0-2-0) is more specific and keeps Drupal's SVG
chevron. The native caret then appears as well, so two chevrons are drawn. The patch adds
`.dark-mode .form-element--type-select` to the forced-colours selector list (0-2-0, later in source).

## Environments

| Side | Environment | Core | Patch | Site |
|---|---|---|---|---|
| Before | `baseline-3636987` | `8a7df6cc3e69` | none (tracked tree clean) | https://repro-baseline-3636987.ddev.site |
| After | `issue-3636987` | `8a7df6cc3e69` | `branches/3636987-forced-colors-select-2026-11-20.patch` | https://repro-issue-3636987.ddev.site |

- Built with `node tools/compare/setup.mjs 3636987-pinned`, exit 0 at 2026-11-27 11:00 EST; plain
  Standard install, no recipe, `admin` / `admin` (the lab's normal test credentials).
- The variant pins the same commit on both sides; `setup.mjs` recorded the patch by content
  (`3636987-forced-colors-select-2026-11-20.patch 966db1af`).
- DDEV performance mode is `none` for both projects (Mutagen was being reset by other workspaces during
  the build; see the lint note below for the one effect).
- Test tool: Playwright `@playwright/test`, Chromium **159.0.8154.6**, OS macOS
  (`process.platform`/`arch` in each `results.json`), viewport 1280x900 and 480x900.
  The reporter used Edge; the independent evaluation the user cited used Chromium 144. This run is a
  third Chromium version, not Edge.

## Scripted runs (one per colour mode)

`node tools/playwright/evaluate-3636987.mjs 3636987-pinned …` opens `/admin/content` (2 normal selects)
and `/admin/structure/block` (18 extra-small region/weight selects), records the computed
`background-image`, `appearance`, `padding-inline-end`, `background-size`, `background-position` and
box size for every select, a real Tab focus state, a disabled state (attribute set in the page; these
pages have no naturally disabled select) and RTL (document `dir`, simulated). "Custom caret" below
means computed `background-image` is not `none`.

| Run | Mode | Viewport | Custom caret on selects (default) | Focus | Disabled | RTL (simulated) | Verdict |
|---|---|---|---|---|---|---|---|
| [16-03-06](playwright/2026-11-27T16-03-06-385Z-chromium-dark-forced-1280x900/SUMMARY.md) | dark + forced colours | 1280 | **20 → 0** | 0 → 0 | 0 → 0 | 2 → 0 | reproduced-and-fixed |
| [16-09-06](playwright/2026-11-27T16-09-06-549Z-chromium-dark-forced-480x900/SUMMARY.md) | dark + forced colours | 480 | **20 → 0** | 0 → 0 | 0 → 0 | 2 → 0 | reproduced-and-fixed |
| [16-12-21](playwright/2026-11-27T16-12-21-219Z-chromium-light-forced-1280x900/SUMMARY.md) | light + forced colours | 1280 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | not-reproduced (control: light forced colours already had one caret) |
| [16-10-29](playwright/2026-11-27T16-10-29-815Z-chromium-light-1280x900/SUMMARY.md) | light | 1280 | 20 → 20 | 2 → 2 | 2 → 2 | 2 → 2 | not-reproduced (control: custom chevron is the normal design) |
| [16-11-09](playwright/2026-11-27T16-11-09-088Z-chromium-dark-1280x900/SUMMARY.md) | dark | 1280 | 20 → 20 | 2 → 2 | 2 → 2 | 2 → 2 | not-reproduced (control) |

Counts are Before → After. The 20 are 2 normal selects on `/admin/content` and 18 extra-small selects on
`/admin/structure/block`. The default state is the one that differed; focus and disabled states already
resolved to `none` in forced colours because their forced-colours selectors tie at 0-2-0 and come later
in source, so they are regression checks here.

### Computed properties (forced-colours dark, 1280)

| Select | Before `background-image` | After `background-image` | `appearance` Before → After | `padding-inline-end` Before → After | Box Before → After |
|---|---|---|---|---|---|
| normal (`#edit-type`, `#edit-status`) | `url("data:image/svg+xml,…")` (Drupal SVG) | `none` | `auto` → `auto` | 12px → 12px | 95x40 → 95x40 |
| extra-small (`#edit-blocks-…-region`, 18) | `url("data:image/svg+xml,…")` (Drupal SVG) | `none` | `auto` → `auto` | 23px → 23px | 203x28 → 203x28 |

`appearance: auto` is the resolved value after `appearance: revert`: the browser paints its own caret.
The two numbers together (no custom background, native appearance) are the "one visible caret" check; the
native caret itself is UA-painted and cannot be counted from script. The screenshots show it.

The same values hold at 480 wide (extra-small select 130x28 there; padding unchanged), and in forced
light. Outside forced colours both sides keep the SVG and `appearance: none`, including dark mode: the
patch changes only forced colours. Every select's computed values are in each run's `results.json` and
`SUMMARY.md`.

### Screenshots

| What | File |
|---|---|
| `/admin/content`, forced dark, full page, Before / After | [forced-dark-content-before-after.png](screenshots/forced-dark-content-before-after.png) |
| Caret end of `#edit-type`, 5x nearest enlargement: two chevrons Before, one After | [forced-dark-content-caret-5x.png](screenshots/forced-dark-content-caret-5x.png) |
| Extra-small region select, 5x: two chevrons Before, one After | [forced-dark-extrasmall-caret-5x.png](screenshots/forced-dark-extrasmall-caret-5x.png) |

The originals (full page and caret crop for every state, both sides) are in the run folders linked above;
[`playwright/README.md`](playwright/README.md) pairs them Before/After.

### axe-core

WCAG 2.2 A/AA tags, Before → After violation counts, 1280 wide: forced dark 1 → 1 on `/admin/content`
and 10 → 10 on `/admin/structure/block`; forced light 0 → 0 and 9 → 9; light 0 → 0 and 9 → 9; dark
0 → 0 and 9 → 9. No rule count changed. axe does not test caret rendering.

## Generated CSS and code quality

```
node scripts/css-build.mjs 3636987-pinned --check
  PASS: core/themes/default_admin/css/components/form--select.pcss.css matches its compiled file
  (report: reports/issues/3636987/css-build/2026-11-27-3636987-pinned-after.md)
```

Core's own build was then run on the changed source inside the After checkout:

```
ddev exec -d /var/www/html/core yarn run build:css --file themes/default_admin/css/components/form--select.pcss.css
  [11:02:57] '…/form--select.pcss.css' is being processed.
  [11:02:58] '…/form--select.pcss.css' is finished.
```

It produced no further diff (`git status` still shows only the two files the imported patch changes,
which are the patch itself), so the November 20 patch already carries the build output. The lab did not
need a corrective follow-up patch.

`node scripts/lint.mjs 3636987-pinned` (report:
[lint/2026-11-27-3636987-pinned-after.md](lint/2026-11-27-3636987-pinned-after.md)):

| Check | Result |
|---|---|
| Stylelint | **PASS** |
| CSpell | PASS |
| PHPStan | PASS |
| CSS build (core `build:css`) | PASS |
| core `commit-code-check.sh`, file modes | **FAIL: "file … should not be executable"** |

The file-mode failure is a known false positive of this setup, not the patch: with DDEV
`performance_mode: none` the bind mount makes `test -x` true for **every** file in the container.
Verified: `README.md` is mode 644 in the container and on the host, and `test -x README.md` returns
true there; Git records 100644 for both CSS files on both sides. This is written up in
[`docs/ADDON-TRIAL-2026-10-15.md`](../../../docs/ADDON-TRIAL-2026-10-15.md) item 8. The same run under
Mutagen (the default) would need a re-run to confirm; it was not done because other workspaces were
resetting Mutagen during this build.

## Isolated CSS probe (not Drupal evidence)

`node tools/playwright/probe-3636987-css.mjs` loads the real compiled Default Admin select CSS from the
After checkout, rebuilds the "before" file by removing the one added selector, and measures a normal and
an extra-small select in 4 colour modes × 3 states in Chromium 159:

- forced-colours configurations that keep Drupal's SVG: **2 of 12 before, 0 of 12 after** (the two dark
  default states);
- non-forced configurations that keep Drupal's SVG: **12 of 12 both sides** (unchanged);
- `padding-inline-end` unchanged.

This corroborates the independent Chromium 144 result (which counted 4 of 24 forced configurations and
0 after; the configuration count differs, the direction and the non-forced result agree). It is not
Drupal evidence and is not counted in `COVERAGE.md`.

## What the patch changes, and what it does not

- Adds `.dark-mode .form-element--type-select` to the existing `@media (forced-colors: active)` selector
  list in `form--select.pcss.css` and the compiled `form--select.css`.
- Leaves `background-image: none` and `appearance: revert` in place.
- No `!important`, no SVG change, no caret positioning change, no new selector for focus/disabled
  (they already worked), no redesign.
- The extra-small padding difference in forced colours is pre-existing (the `.no-touchevents
  .form-element--extrasmall` rule is more specific than the forced-colours padding) and is unchanged by
  the patch: 23px Before and After.

## Not verified

- Windows High Contrast on a real operating system; forced colours are emulated by Chromium/Playwright.
- Firefox and WebKit: not run. (The matrix in `variants.json` is Chromium-only, with a note.)
- A native right-to-left language install: RTL is simulated with `dir`.
- A person's keyboard pass and a real screen reader (VoiceOver/NVDA): not done. The scripted runs use real Tab presses, but a person has not reviewed them.
- 200% zoom / 400% reflow, touch, and a native Windows high-contrast theme.
- A person's manual viewer log: none recorded. The AI-run viewer captures are in `manual/`; the manual panel questions are in `variants.json`.
- Mutagen file-mode re-run of core's `commit-code-check.sh` (see above).

## Re-run

```
node scripts/doctor.mjs 3636987-pinned
node tools/compare/setup.mjs 3636987-pinned
node scripts/lab-env.mjs start 3636987-pinned --browser
node tools/playwright/evaluate-3636987.mjs 3636987-pinned --scheme=dark --forced-colors
node scripts/css-build.mjs 3636987-pinned --check
node scripts/lint.mjs 3636987-pinned
```

## Resource preflight and the viewer-side comparison

`scripts/preflight.mjs` (on `origin/main`, not in this checkout's branch) gates builds and starts. On
2026-11-27 at 11:47 EST it returned **BLOCK** (free disk 7.5 GB, swap 83%, four other pairs running)
while five sessions shared the host, so the two environments were stopped and no viewer was started
then. At 14:00 EST it returned **PASS** (27.1 GB free, swap 39%, 0 pairs); the pair was started and the
viewer-side pass ran.

The shared viewer on port 8100 was already serving another session's variant (`3534229-pinned`), so the
registered comparison was opened in a private viewer instance on port 8110; the shared one was not
changed. `tools/playwright/viewer-3636987.mjs` opens it in Chromium 159, logs in both frames, sets a
colour mode with browser-context media emulation, visits `/admin/content` and `/admin/structure/block`,
presses the viewer's **Run checks** in the forced modes and saves the screenshots and frame
measurements in [`manual/`](manual/README.md).

| Mode | Page | Before frame | After frame | Viewer checks |
|---|---|---|---|---|
| forced-colours dark | /admin/content | `background-image: URL`, `appearance: auto`, 12px | `none`, `auto`, 12px | all 4 as expected (2 custom backgrounds Before → 0 After) |
| forced-colours dark | /admin/structure/block | `URL`, `auto`, 23px (18 extra-small selects) | `none`, `auto`, 23px | all 4 as expected (18 → 0) |
| forced-colours light | both | `none`, `auto`, 12px / 23px | `none`, `auto`, 12px / 23px | CSSOM fix check fails Before/passes After; the computed fix check passes on both, so the viewer banner says "1 of 4 not as expected". That is the correct result for light forced colours: the defect does not occur without the dark class. |
| dark | both | `URL`, `appearance: none`, 39px / 23px | same | visual only |
| light | both | `URL`, `none`, 39px / 23px | same | visual only |

Screenshots: [viewer, forced dark, /admin/content](manual/viewer-forced-dark-admin-content.png),
[checks table](manual/viewer-forced-dark-admin-content-checks.png),
[5x caret comparison](screenshots/viewer-forced-dark-content-caret-5x.png),
[extra-small 5x](screenshots/viewer-forced-dark-extrasmall-caret-5x.png). The viewer header says
"Theme: unknown" for `/admin/content` in these captures (a viewer theme-label limitation on that page;
the block page shows `default_admin` and every scripted run records `default_admin`). It does not affect
the frames or the checks.

This is AI-run viewer evidence, not a person's manual log: no keyboard pass and no screen reader were
done. The Manual panel and a person's downloaded log are still open.

One lab-tooling fix was needed to generate this issue's `playwright/README.md` index:
`scripts/run-readmes.mjs` used a superseded run's banner line as its evaluation name and treated the
`reducedMotion: "no-preference"` value as a reduced-motion run. The fix is a two-line change in that
script (it now uses the first `# ` heading and ignores `"no-preference"`); the generated READMEs are the
only output changed by it.

Also not run: `node scripts/index-issues.mjs`, which currently fails on another session's
`reports/issues/3603162/status.json` (`mr` without `sha` breaks `tools/compare/issue-tracking.mjs`,
documented in `docs/WORKSPACE-HYGIENE.md`). That file belongs to another session and was not edited.
