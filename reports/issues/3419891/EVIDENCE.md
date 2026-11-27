# Evidence for #3419891: alternative text textarea

**DRAFT.** Written 2026-11-26. A person has not reviewed this revision.

Issue: https://www.drupal.org/project/drupal/issues/3419891
MR: https://git.drupalcode.org/project/drupal/-/merge_requests/16984 (head `1931822c77bb`)

## Environments

| Side | Directory | Core | Contents |
|---|---|---|---|
| A (Before) | `envs/baseline-3419891` | `0387fb948f7` (2026-11-25) | Pristine core + `repro_3419891` recipe |
| B (After) | `envs/issue-3419891` | `0387fb948f7` | Same + `3419891-increase-size-of.patch` (MR `1931822c`) |
| C (After) | `envs/issue-3419891-followup` | `0387fb948f7` | Same + MR patch + `3419891-followup.patch` |

All three are the same core revision and the same recipe; A is the shared baseline for B and C.

## Runs

The evaluator runs both sides in one browser context set, so A is measured in every run. `results.json` and `SUMMARY.md` are in each directory.

| State | Condition | Verdict | Failing After requirement | Directory |
|---|---|---|---|---|
| B | Chromium, light, 1280x900 | **reproduced-not-fixed** | `reopen-cancel` | [`2026-11-26T18-40-13-668Z-chromium-light-1280x900`](playwright/2026-11-26T18-40-13-668Z-chromium-light-1280x900/) |
| C | Chromium, light, 1280x900 | **reproduced-and-fixed** | none | [`2026-11-26T19-03-53-789Z-chromium-light-1280x900`](playwright/2026-11-26T19-03-53-789Z-chromium-light-1280x900/) |
| B | Playwright WebKit, light, 1280x900 | **reproduced-not-fixed** | `reopen-cancel` | [`2026-11-26T21-04-35-715Z-webkit-light-1280x900`](playwright/2026-11-26T21-04-35-715Z-webkit-light-1280x900/) |
| C | Playwright WebKit, light, 1280x900 | **reproduced-and-fixed** | none | [`2026-11-26T21-09-11-748Z-webkit-light-1280x900`](playwright/2026-11-26T21-09-11-748Z-webkit-light-1280x900/) |
| C | Chromium, dark, 1280x900 | **reproduced-and-fixed** | none | [`2026-11-26T22-09-09-793Z-chromium-dark-1280x900`](playwright/2026-11-26T22-09-09-793Z-chromium-dark-1280x900/) |
| C | Chromium, forced colours, 1280x900 | **reproduced-and-fixed** | none | [`2026-11-26T22-10-05-126Z-chromium-light-forced-1280x900`](playwright/2026-11-26T22-10-05-126Z-chromium-light-forced-1280x900/) |
| C | Chromium, light, 480x900 | **reproduced-and-fixed** | none | [`2026-11-26T22-10-58-822Z-chromium-light-480x900`](playwright/2026-11-26T22-10-58-822Z-chromium-light-480x900/) |

Chromium 143.0.7499.169 (DDEV image), Playwright WebKit 27.2, darwin arm64. The evaluator is `tools/playwright/evaluate-3419891.mjs`; the image fixture is a 64x64 PNG generated in memory, so no file outside the repository is needed.

### Historical result (kept, not comparable)

[`2026-10-15T21-21-23-304Z-chromium-light-1280x900`](playwright/2026-10-15T21-21-23-304Z-chromium-light-1280x900/) is the October run on core `47430c368bbd` with the old evaluator. It recorded `reproduced-and-fixed` from field type alone and did not test overflow, reopen, or Save state. It is kept for history; it is not evidence for this revision.

## Requirement matrix (After side)

Functional requirements gate the verdict; `observe` rows are recorded only.

| Requirement | B (MR) | C (MR + follow-up) |
|---|---|---|
| Accessible name "Alternative text" | pass | pass |
| Multiline textarea | pass | pass |
| Grows when text wraps | pass 32→73 px | pass 32→73 px |
| Stops at the six-row limit | pass 136 px | pass 136 px |
| Content beyond the limit is scrollable | pass (218 > 134, `overflow-y: auto`) | pass |
| No horizontal scrolling for unbroken words | pass | pass |
| Shrinks when text is removed | pass 32 px | pass 32 px |
| Reopen after Cancel: saved value, small height, disabled Save | **FAIL**: value `''`, height 136 px, Save enabled | pass: value `''`, height 32 px, Save disabled |
| Save long text then reopen | pass 348 chars, 136 px | pass |
| Save short text over long then reopen | pass 32 px | pass |
| Repeated reopen stable | pass | pass |
| Save and Cancel visible, in viewport, clickable | pass | pass |
| Focus enters field; Escape returns to editor | pass | pass |
| Tab order predictable | pass | pass |
| Decorative toggle hides field, enables Save, restores it | pass | pass |
| axe-core violations | 2 (same on A: colour-contrast, label-content-name-mismatch) | 2 (same) |

WebKit reproduces the same B failure (value `''`, height 136 px, Save enabled) and the same C pass.

## Measurements (Chromium, light, 1280x900)

| State | Rendered height | clientHeight / scrollHeight | overflow-y | Notes |
|---|---|---|---|---|
| A, long text | 32 px | 30 / 30 | `clip` | `scrollWidth` 1476 vs `clientWidth` 234: content scrolls horizontally out of view |
| B, short | 32 px | 30 / 30 | `auto` | one row |
| B, wrapped | 73 px | 71 / 71 | `auto` | grows |
| B, six rows | 136 px | 134 / 134 | `auto` | at the limit |
| B, ten rows | 136 px | 134 / 218 | `auto` | capped; scrollable |
| B, reopened after Cancel | **136 px** | 134 / 134 | `auto` | **stale height; empty value** |
| C, reopened after Cancel | **32 px** | 30 / 30 | `auto` | height for the stored empty value |

Line-height 21.5 px, padding 4/4 px, borders 1/1 px, six-row limit 136 px. `line-height` and the limit are read from the live field, not hard-coded.

## The scrollbar concern (characterised)

At the six-row limit the textarea is scrollable in both engines:

- computed `overflow-y: auto`, `overflow-x: hidden` (CKEditor's `.ck-textarea` rule);
- `scrollHeight` 218 vs `clientHeight` 134;
- keyboard scroll (Meta+ArrowUp then PageDown) changes `scrollTop` from 0 to 28 (Chromium) and 0 to 84 (WebKit);
- the platform scrollbar gutter measured in the page is **0 px**, which is what macOS overlay scrollbars report.

The browser therefore has no persistent scrollbar to paint until the user scrolls. The content is not inaccessible. A fixed `max-height` (the owner's earlier suggestion) would not change this and would break the six-row limit under enlarged text; `resize: vertical` conflicts with the upstream autogrow logic (CKEditor issue #15061). Neither was applied.

## The reopen concern (reproduced and fixed)

Root cause, confirmed by instrumentation against the live editor:

- CKEditor 5's `TextareaView` keeps a programmatic `value`. Typing updates the DOM and recalculates the height on `input`, but never updates `value`.
- `_showForm()` in Drupal sets `element.value` and then `value` to the stored command value. When the stored value is `''` and the view's value is already `''`, no `change:value` fires, so the height is not recalculated and `isEmpty` stays `false`.
- The reviewer saw exactly this: reopening restores the empty text but keeps the 136 px height; Save stays enabled on an empty field.

Follow-up (3 files, 105-line patch): call the public `reset()` on the field after the balloon is attached, before restoring the value. `reset()` recalculates while the field is visible and resets emptiness; the subsequent value assignment recalculates again when the stored value is not empty. No synthetic input events, timeouts, resize observers, or private CKEditor methods.

Live instrumentation before the fix: `domValueLength 320`, `viewValueLength 0`, `height 136`, `isEmpty false`; after Escape and reopen: `height 136`, no `change:value` or `update` events; a forced recalculation produced `height 32`.

## Regression test

`CKEditor5Test::testAlternativeTextFormResetsAfterCancel()` in `core/modules/ckeditor5/tests/src/FunctionalJavascript/CKEditor5Test.php` (added by the follow-up patch).

- MR only: **FAIL** — `Failed asserting that 136.0 is less than 136.0` ([log](regression/phpunit-3419891-mr-only.log)).
- Follow-up: **OK (1 test, 18 assertions)** ([log](regression/phpunit-3419891-followup-after.log)).

The test creates a CKEditor 5 text format with the image plugin, uploads an image, types eight lines, cancels, reopens through the missing-alt button, and asserts the stored value, a smaller height, and a disabled Save. It uses relative heights, not fixed pixels.

## Lint

`node scripts/lint.mjs 3419891-followup` → **PASS**: CSpell, PHPStan, PHPCS, ESLint, Stylelint. Report: [`lint/2026-11-26-3419891-followup-after.md`](lint/2026-11-26-3419891-followup-after.md). The CSS build check is SKIPPED because `core/modules/ckeditor5/css/image.css` has no `.pcss.css` source in core; the MR's CSS edit is handwritten CSS, not a generated artifact.

## Screen reader

See [SCREENREADER.md](SCREENREADER.md). The virtual reader announces `textbox, Alternative text` on both B and C. After reopening, B announces `button, Save` (enabled) while C announces `button, Save, disabled`.

## Limits and what was not verified

- No real Safari, real Edge, real VoiceOver/NVDA, or human keyboard pass. Playwright WebKit is not Safari.
- No actual browser zoom (only a 480x900 viewport). No Firefox run.
- The 2 axe violations are present on the baseline too and were not treated as regressions; they are not repaired here.
- The test image used by the evaluator is a plain 64x64 PNG; no media-library image was tested.
- The recipe correction changes the fixture for both sides. October's evidence used a different core and a recipe path that this core ignores; results are not directly comparable.
- The follow-up's `reset()` call also fixes the empty-Save state; the Save-state change is a behaviour change beyond height, in scope because it is the same lifecycle defect.
- Cancelling edits to an already-saved long value, and switching between two images with different alternative text lengths, were not scripted. Save/reopen with different lengths and three repeated reopens were tested.
- Arrow keys and standard editing commands were exercised only through typing, deletion and PageDown scrolling; a full keyboard pass remains a person's check.
- Actual browser zoom at 200% and 400% was not run; only a 480x900 viewport.
