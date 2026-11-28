# Evidence: #3466040 / MR !9088

**DRAFT.** Dated observations from the independent review. Full analysis: [REVIEW.md](REVIEW.md); machine record: [review.json](review.json). Nothing here is a drupal.org post.

## Identity

| | |
|---|---|
| Issue | [#3466040](https://www.drupal.org/project/drupal/issues/3466040) |
| MR | [!9088](https://git.drupalcode.org/project/drupal/-/merge_requests/9088), reviewed revision `aed1df5eeddf0b89c91bab47eb83847f44c58211` |
| Base | `97c6ff8b2534b242c0f1df3e4ba2493e56aebcec` (2026-11-23), Drupal `12.0-dev` |
| MR patch | `branches/3466040-dialog-buttoninputs-not.patch`, sha256 `1adba92d55f15f34d4f98a90277c391efa96b196d4329bdc6efe30f65bfbfae8`, 4 files |
| Test-support patch | `branches/3466040-test-support.patch`, sha256 `262dd0fc8d71ec586f3f85ab5f8c2f2fb8de9bf071721975b4b002d871674222`, 3 test/fixture files, no production code |

## Environments

| Side | Directory | Commit | Patches |
|---|---|---|---|
| Before | `envs/baseline-3466040` | `97c6ff8b25` | test-support only (declared; variant `3466040-regression-pinned`) |
| After | `envs/issue-3466040` | `97c6ff8b25` | full MR patch |

Both sites: `standard` profile, PHP `8.5.7`, theme `default_admin` (dark mode auto, high contrast off), modules including `dialog_renderer_test`, `views_ui`, `field_ui`, `datetime`, `language`, `config_translation`; recipe `repro_3466040` (Article type, French). The only production difference is `core/misc/dialog/dialog.position.js`.

Residual state: `baseline-3466040` holds the test-support patch. Revert before using `3466040-pinned`:

```bash
node tools/compare/setup.mjs 3466040-pinned --refresh-patches
```

## Automated results

| Run (2026-11-27) | Command / environment | Result |
|---|---|---|
| 16:43 fixture probe | `node tools/playwright/review-3466040.mjs 3466040-regression-pinned --viewport=1024x768`; Chromium 159.0.8154.6, darwin arm64 | Before: overflow `212.3px`, OK off-screen, keyboard focus off-screen. After: fits, OK visible/hittable. Observer 1 callback + 1 `resetSize`, 0 idle, 4 created / 4 disconnected. [Run](playwright/2026-11-27T16-43-04-546Z-chromium-light-1024x768-fixture/SUMMARY.md) |
| 16:24 Views | `node tools/playwright/evaluate-3466040.mjs 3466040-pinned --scenario=views --viewport=1920x1080` | Does not reproduce: dialog `845.4px` both sides; `.scroll` inner container `689/960`; Views workaround. [Run](playwright/2026-11-27T16-24-50-391Z-chromium-light-1920x1080/SUMMARY.md) |
| 15:35 Field UI | `node tools/playwright/evaluate-3466040.mjs 3466040-pinned --scenario=field-ui --viewport=1920x1080` | Does not reproduce: dialog `1026px` (95% cap) both sides; content `878/1272` scrolls. [Run](playwright/2026-11-27T15-35-43-499Z-chromium-light-1920x1080/SUMMARY.md) |
| manual 16:24–16:28 | Playwright MCP Chrome, fixture at `1280x1080` | Before `top 407.3`, `bottom 1433.3`, overflow `353.3px`, OK `y 1379.3`; After `top 27`, `bottom 1053`, OK `y 999`. |
| CI pipeline 1063751 | git.drupalcode.org, head `aed1df5e` | Pipeline success; test-only job 13926147: `Tests: 3, Assertions: 49, Failures: 1` — `testModalContentGrows` fails at line 183 without the JS change. [Log](ci/gitlab-job-13926147-test-only-changes.log) |
| matrix runner | `node tools/playwright/matrix-3466040.mjs 3466040-regression-pinned --side=after` | **Not completed.** Docker Desktop stopped under host memory pressure; both sites and Selenium became unreachable. Runner left in [`tools/playwright/matrix-3466040.mjs`](../../../tools/playwright/matrix-3466040.mjs). |
| local PHPUnit | `ddev phpunit ... --filter testModalContentGrows` | **Not run** for the same outage. CI evidence only. |

## Manual results

| Check | Before | After |
|---|---|---|
| Dialog fits after the details expands (1024x768) | no, `212.3px` overflow | yes, `0px` |
| Titlebar visible | yes | yes |
| Close button visible / hittable | yes / yes | yes / yes |
| Button pane visible | **no** | yes |
| OK visible / hittable | **no / no** | yes / yes |
| Content scrolls (`578/2146`) | yes | yes |
| Tab from summary to OK (1 press) | focused, off-screen, not hittable | focused, in view, hittable |
| Page/window scroll to reveal OK | no | no |
| axe violations in the expanded dialog | 0 | 0 |
| Console errors | 0 | 0 |
| Page errors | 0 | 0 |

AT/browser/OS: no real screen reader or human keyboard pass was run. Chromium 159.0.8154.6 (Playwright) and Google Chrome 157 (MCP), darwin arm64.

## ResizeObserver measurements

| Measure | Before | After |
|---|---|---|
| Patch observer stored | no | yes |
| Callbacks during the expansion | 0 | 1 |
| `dialogContentResize` from `.ui-dialog-content` | 0 | 1 |
| Callbacks, 800ms idle | 0 | 0 |
| Per expand/collapse cycle | 0 | 2 callbacks / 2 events |
| Expanded / collapsed bottom over 5 cycles | `980.3` / `516.7` (stable) | `748.5` / `516.7` (stable) |
| Observer disconnected on close | n/a | yes |
| Callbacks / events 900ms after close | 0 / 0 | 0 / 0 |
| Patch observers over 4 opens | 0 | 4 created, 4 disconnected |
| Expand-then-Escape race, 3 trials | 0 errors | 0 errors |

`#3458272` (sub-pixel round) is already fixed in this base; the observer converged with no loop error. The test boundary has no sub-pixel tolerance but has `19.5px` headroom at 1024x768. Theoretical only.

## Findings

- **Confirmed product defect on Before:** action pane leaves the viewport on content growth; content scrolls but the pane does not. Task impact: a pointer user cannot activate OK/Save; a sighted keyboard user's focus goes off-screen.
- **Confirmed test-quality gap in the MR:** `testModalContentGrows` can pass without `details.open` and without a scrollable content area; the titlebar assertion is non-discriminating.
- **No confirmed regressions.**

## Not verified

Zoom 90/100/110/125/200/400 (reflow-equivalent), 480x900 and 320x900, dark mode, forced colours, reduced motion, real browser zoom, real OS contrast theme, NVDA/VoiceOver, a person's keyboard pass, Firefox/WebKit/Safari, local PHPUnit, Media library, multilingual Views translation, two simultaneous AJAX modals, touch/mobile. See [REVIEW.md](REVIEW.md#not-tested-and-what-needs-a-person).


## 2026-11-27 19:11–19:24Z — second pass after reconciling the pair (pristine Before)

The review above used `3466040-regression-pinned` (test-support patch on Before) for the fixture. That patch is
now reverted: `envs/baseline-3466040` is pristine `97c6ff8b25` again with no tracked changes and no patch
record (the stale record was removed after `git checkout`; it would otherwise say "patch applied but not
listed"). The pair was started with `node scripts/lab-env.mjs start 3466040-pinned`. The deferred
`3466040-regression-hardened` variant definition is in
`reviews/deferred-variant-3466040-regression-hardened.json` (the hardening patch stays a proposal, see
[reviews/test-review.md](reviews/test-review.md) §6); it was removed from `variants.json` because it cannot
share the same checkout state as the pristine pinned pair at the same time.

Runs in this pass (Chromium 159.0.8154.6, light, darwin arm64, trusted Playwright input):

| Run | Command | Result |
|---|---|---|
| Field UI, 1920×720 | `node tools/playwright/evaluate-3466040.mjs 3466040-pinned --scenario=field-ui --viewport=1920x720 --settle=1200` | **Not reproduced.** Both sides: config dialog `684px` (95% cap), `18→702` of 720; after "Set default value" content `536/1272` scrolls; Save in view, hit-testable, reached in 6 real Tab presses. Geometry identical on both sides. [Run](playwright/2026-11-27T19-21-21-697Z-chromium-light-1920x720/SUMMARY.md) |
| Views filter, 1920×720 | `node tools/playwright/evaluate-3466040.mjs 3466040-pinned --scenario=views --viewport=1920x720` | **Not reproduced.** Dialog `1442×684`, `18→702`, unchanged on both sides through the toggles the evaluator performed; `Apply` in view and hit-testable. [Run](playwright/2026-11-27T19-14-16-551Z-chromium-light-1920x720/SUMMARY.md) |
| Views filter, direct details probe | ad-hoc probe (same lab-run session): opened "Content: Content type", then expanded 4 of its 5 `<details>` one by one | Dialog stayed `top 18, bottom 702 (684)` on **both** sides; content `536/544`; primary Apply in view and hit-testable throughout. Views UI's own `dialog.views.js` sizes the inner `[data-drupal-views-scroll]` container, so expanding details does not grow the dialog. Confirms the 16:24 1920×1080 result at the short viewport. |
| **Multilingual view translation, 1920×1080** | `node tools/playwright/evaluate-3466040-translation.mjs 3466040-pinned --viewport=1920x1080` | **Reproduced on Before, fixed on After.** Before: after opening "Default Display settings" the dialog is `221.8→1082.9` (`861.1px` tall) — `2.9px` below the 1080 viewport, content `713/713` (does not scroll), and the keyboard walk does not reach "Save translation" (focus ends on Close). After: the same expansion is re-centred to `109.5→970.6` (fits); a second expansion caps it at `27→1053` with content `878/1307` scrolling, and the Tab walk reaches "Save translation". [Run](playwright/2026-11-27T19-21-54-847Z-chromium-light-1920x1080-translation/SUMMARY.md) |
| **Multilingual view translation, 1920×720** | `node tools/playwright/evaluate-3466040-translation.mjs 3466040-pinned --viewport=1920x720` | **Reproduced on Before, fixed on After.** Before: after the expansion `41.8→725.8` (`684px`) — `5.8px` below the 720 viewport; content `536/713`; focus lands on Close, Save translation not reached. After: re-centred `18→702`, fits, and the Tab walk reaches "Save translation". [Run](playwright/2026-11-27T19-23-17-323Z-chromium-light-1920x720-translation/SUMMARY.md) |

Interpretation, kept separate from the numbers:

- The issue's **Field UI** (duplicate #3640810) and **Views filter** steps do **not** reproduce on this core
  revision at 1080 or 720: the dialogs involved already open at the 95 % cap, and Views UI has its own inner
  scroll-container workaround. The MR does not change those geometries.
- The **multilingual view-translation modal** (the issue's first listed reproduction, comment #24) **does**
  reproduce: the dialog grows past its cap without being re-centred, its bottom leaves the viewport by a few
  pixels, and the primary "Save translation" action is not reached with the keyboard. The MR re-centres the
  dialog and the action becomes reachable. The magnitude is small (2.9–5.8 px overflow) compared with the MR's
  own fixture (212–353 px), so this is a "positions the grown dialog correctly" fix in this path rather than a
  dramatic hidden-button case; the keyboard difference is the material part.
- The evaluator's Field UI step originally failed on the pristine side only because of a timing race (the
  AJAX-replaced modal was read before the replacement); that was fixed in
  `tools/playwright/evaluate-3466040.mjs` and is not evidence about the product.

Still not verified: Firefox, WebKit (not Safari), dark/forced colours/reduced motion, 200 %/400 %
reflow-equivalent zoom, narrow 480/320, real browser zoom, real OS contrast, a person's keyboard pass, a real
screen reader, a local PHPUnit run, and the media library and field-widget paths. The matrix runner
`tools/playwright/matrix-3466040.mjs` is written but has not completed its matrix.

### Cross-browser attempt (2026-11-27 19:25–19:27Z)

| Browser | Run | Result |
|---|---|---|
| WebKit (Playwright 27.x, **not Safari**) | `evaluate-3466040.mjs 3466040-pinned --viewport=1920x720 --browser=webkit` | Both sides completed both scenarios. Field UI: dialog `1102x684` both sides, Save in view and hit-testable on both; the Tab walk did not reach the primary action on **either** side (a browser-specific keyboard-walk result, not changed by the MR). Views: the evaluator's toggle loop again ended with no dialog, so its fix rows are not product evidence; the direct probe result (dialog unchanged while details open) was reproduced in Chromium only. No page or console errors. [Run](playwright/2026-11-27T19-25-45-781Z-webkit-light-1920x720/SUMMARY.md) |
| Firefox (Playwright) | `evaluate-3466040.mjs 3466040-pinned --viewport=1920x720 --browser=firefox` | **Could not run on this machine**: `browserContext.newPage: Target crashed` while opening the Before side. Same failure the harness noted earlier at `newContext`. No Firefox evidence exists; this is an environment gap, not a browser result, and Firefox must be run on another host or after a Playwright reinstall. |

Not run: dark mode, forced colours, reduced motion, 200%/400% reflow-equivalent zoom, narrow 480/320 px,
real browser zoom, real OS high-contrast theme, Safari (real), VoiceOver/NVDA, a person's keyboard pass, and
the local PHPUnit run. The PHPUnit switch needs the pair temporarily moved to `3466040-regression-pinned`
(test-support patch on Before), test-extension discovery enabled and `dialog_renderer_test` installed on both
sites; that was not started because the resource preflight still reports BLOCK (swap above threshold, 6 pairs
running) while other sessions work.
