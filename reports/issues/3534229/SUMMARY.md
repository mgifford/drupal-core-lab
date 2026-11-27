# #3534229: CKEditor 5 toolbar-configuration icons in forced-colors mode

**DRAFT.** A local proposal and its evidence, prepared for a person to review and, if they agree, post to
drupal.org. Nothing was posted, pushed or changed upstream.

- Issue: <https://www.drupal.org/project/drupal/issues/3534229> (Active, unassigned, no merge request)
- Related: <https://www.drupal.org/project/drupal/issues/3637246> / MR
  [!17909](https://git.drupalcode.org/project/drupal/-/merge_requests/17909) — read-only compatibility check
- Pinned core: `8a7df6cc3e69b6b5d427cb25ce8f66dda8393c29` (2026-11-27)
- Proposed patch: [`branches/3534229-forced-colors-mask.patch`](branches/3534229-forced-colors-mask.patch)
  (18 files, +238/−32, sha256 `c1c969bd…`), authored in the Lab. There is no upstream implementation to interdiff; the two local revisions and their interdiffs are in [`BRANCHES.md`](BRANCHES.md).
- Registered comparison: `3534229-pinned`; compatibility variant `3534229-combined-3637246`.

## The barrier

In a forced-colors palette an administrator cannot see most toolbar icons on
`/admin/config/content/formats/manage/full_html`. The browser keeps the icons' SVG `background-image` (only
background images without `url()` are forced to `none`) and the SVGs stay black, while a dark forced palette
makes `Canvas` black: 31 of the 35 rendered control instances show no icon in the dark palette. The light
forced palette keeps black icons on white, so the defect is palette-dependent. Heading, Style and Language
(text + CSS-border caret) and Alignment's caret stay visible; Alignment loses its icon. The controls remain
operable and accessible names are unchanged, so this is a recognition/non-text-contrast barrier (1.4.1,
1.4.11), not a keyboard or screen-reader blocker.

## What was verified

- **Reproduced on pristine pinned core** in Chromium with emulated forced-colors **dark**: 31/35 rendered
  control instances invisible, measured from rendered pixels. Forced-colors **light** does not reproduce
  (0/35), so the defect is palette-dependent — the important nuance for anyone testing.
- **Fixed by the proposal**: 0/35 invisible in forced-colors dark, forced dark RTL and forced dark at 480 px;
  every icon/text at 21:1 against its surface; no hover loss; focus outline stays on the list option; 35/35
  tooltips visible; axe results identical Before/After.
- **Normal modes unchanged**: each toolbar item renders identically Before/After (2 px-inset pixel hash; raw
  screenshot bytes at fractional positions can differ by one edge pixel of capture rounding). Six current
  normal-mode runs, including 480 px, report 0 differences.
- **Fixture A/B/C**: current core reproduces the defect only in forced dark; kentr's whole-control mask fixes
  Core icons but turns the un-opted contributed control into a solid system-colour box and clips Alignment's
  caret; the proposal fixes Core icons and leaves the un-opted contributed control exactly as before. RTL and
  390 px behave the same.
- **Contributed plugins unchanged**: the proposal only repaints items whose own stylesheet defines the new
  property; nothing changes for items that only set `background-image`.
- **#3637246 compatibility, measured live**: the combined variant now has its own environment
  (`envs/issue-3534229-3637246`) and both patches; forced dark is `reproduced-and-fixed` (31/35 → 0/35) and
  every button computes `filter: none`, so the MR's dark-mode invert is cancelled in forced colors instead of
  inverting the user's palette. The earlier `lab-env status` patch warning (the combined variant shared the
  After checkout with the pinned variant) is gone. The MR was not modified.
- **Interaction states**: keyboard reordering (move and reverse-move) works and is silent as designed; pointer
  drag keeps the icon visible; Save persists the order across a reload and the original order can be restored
  and saved. A pre-existing focus-after-move quirk appears identically Before and After (recorded; needs a
  manual keyboard pass to judge).
- **WebKit normal mode** (Safari engine): 35/35 controls render, 0 differences — no normal-mode regression;
  forced colors cannot be emulated there. A second full Chromium pass reproduced every verdict (runs
  `23-19-55`–`23-29-04`). Coverage is now **7 of 9** matrix rows; the only gaps are Firefox (Playwright
  Firefox crashes on this host) and WebKit forced colours (not possible on macOS).
- **Core code checks PASS**: CSpell, PHPStan, Stylelint; no generated CSS involved.

## What was not verified

- Whether the pre-existing focus-after-keyboard-move behaviour (focus lands on the first Available button;
  identical Before and After) is visible to a person in normal use. A manual keyboard pass should judge it.
- A real Windows contrast theme (Edge/Chromium/Firefox), custom user palettes, Firefox forced-colors
  rendering (Playwright Firefox crashes on this host), Safari/WebKit, a person's keyboard pass and a
  screen-reader pass. See `MANUAL-WINDOWS.md`.
- The two automated gaps are Firefox normal and Firefox forced colours only (Playwright Firefox crashes on
  this host); WebKit normal mode now passes and WebKit cannot emulate forced colours. See `COVERAGE.md`.
- `node scripts/index-issues.mjs` crashes on unrelated pre-existing data (`reports/issues/3603162/status.json`
  stores `mr` as a string; `tools/compare/issue-tracking.mjs:112` expects an object), so
  `reports/issues/README.md` was not refreshed by this run.

## Files

- [`REPRODUCE.md`](REPRODUCE.md) — environments, exact commits, manual and scripted reproduction.
- [`EVIDENCE.md`](EVIDENCE.md) — runs, results, code quality, findings, what is not verified.
- [`TOOLBAR-INVENTORY.md`](TOOLBAR-INVENTORY.md) / [`.json`](TOOLBAR-INVENTORY.json) — all 29 Core toolbar
  items + 2 structural controls, their CSS/icons/pseudo-elements, and the contribution contract.
- [`PROTOTYPE.md`](PROTOTYPE.md) — A (current), B (kentr's experiment), C (proposal) compared.
- [`fixture/`](fixture/README.md) — the reusable standalone A/B/C comparison and its evaluator.
- [`COMPATIBILITY-3637246.md`](COMPATIBILITY-3637246.md) / [`.json`](COMPATIBILITY-3637246.json) — the
  interaction with MR !17909.
- [`TESTS-UPSTREAM.md`](TESTS-UPSTREAM.md) — existing core tests and focused assertions to propose.
- [`MANUAL-WINDOWS.md`](MANUAL-WINDOWS.md) — the Windows checklist a person still needs to run.
- [`COVERAGE.md`](COVERAGE.md) — which browser/mode/width combinations are tested, and the four gaps.
- [`STATUS.md`](STATUS.md) — the issue's drupal.org state and the evidence-to-readiness position.
- [`ISSUE-COMMENT-DRAFT.md`](ISSUE-COMMENT-DRAFT.md) — a draft reply to comment #7.
- [`BRANCHES.md`](BRANCHES.md) — the patch provenance and its v1 → v2 revision.

AI assistance: the patch, fixture, evaluations and drafts were produced with DeepSeek Harness in this Lab;
they are drafts for human review. Nothing was posted to drupal.org or pushed to any remote.
