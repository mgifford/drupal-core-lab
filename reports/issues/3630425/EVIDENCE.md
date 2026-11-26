# Evidence: DRAFT

AI-assisted lab run. Production change is the upstream MR; no production change was made here. Nothing posted or pushed.

## Comparison

- Variant: `3630425-mr17622`.
- Core: `dbfce851242d5b082adb8ed14634b4bc9cce374b` (2026-10-16) on both sides.
- Before: `baseline-3630425`, pristine.
- After: `issue-3630425-mr17622` plus `branches/17622-090a74cd28aa.patch`, SHA-256 `b459af60d26d409678279f793974dec24039c0c794f9983d7c2c2c3319b65016`.
- MR !17622 head `090a74cd28aa448aa506413b02abf5c7935e21a2`, base `555acb124a507400d63ad38526b221c0e813bf7d`.
- Both sites: Standard install, Default Admin, `repro_3630425` applied, Drupal 12.0-dev, PHP 8.5.7. No Article was saved.
- The two files the MR touches are byte-identical at the Lab pin and at the MR base, and `git apply --check` passed against that content in a temporary repository on 2026-11-26.

Nothing here may be attributed to !17421 or to the Lab's main-based port. Production code is equivalent, but the tests and revision are !17622's.

## Playwright evaluation

Run: `reports/issues/3630425/playwright/2026-11-26T12-39-49-645Z-chromium-light-1280x900/` (1280 px, light, Chromium).

- Verdict `reproduced-and-fixed`; `unexpected: 0`.
- Header DOM: three `th` cells at every stage. First is the field label with `colspan=2`; second is the actions header; third is `Order`.
- Before: second `th` empty at initial, AJAX add and AJAX remove. After: `Operations`, visually hidden, at all three.
- Explicit axe `empty-table-header`: 1 violation on Before at each stage; 0 on After.
- Rows / Remove controls: Before 3/3, 4/4, 3/3; After 3/3, 4/4, 3/3. The third initial row is core's empty unlimited-field row, not a fixture default.
- Page errors: none on either side.
- Accessibility tree: Default Admin hides the `Order` column (`th.tabledrag-hide`, `display:none`), so the tree exposes two column headers, not three. Before the second is a bare `columnheader`; After it is `columnheader "Operations"`.
- Stable screenshots: initial and remove are pixel-identical; add differs by 9 pixels with a maximum channel difference of 1/255. Layout dimensions are identical. The first evaluator run (`12-37-56`) was superseded because its AJAX screenshots were taken before scroll and focus settled; the stable run is the one above. See `visual-compare.json` in the run folder.

## Guidepup virtual screen reader

Run: `reports/issues/3630425/screenreader/2026-11-26T12-40-34-521Z/`.

Source: the stable Playwright run's saved table HTML. jsdom, no layout engine.

- Before, initial: `columnheader, Lab multi-value text, column span 2` then a bare `columnheader`; 3 rows, 3 Remove buttons; no phrase contains `Operations`.
- After, initial: the same first header then `columnheader, Operations`; 3 rows, 3 Remove buttons; five phrases contain `Operations` (header name, its text, end marker, row name).
- Add and remove repeat the same header difference with 4 and 3 rows and matching Remove controls.
- Preconditions: no problems on either side at any stage.
- Limit: the virtual reader does not associate the header with the Remove cell during per-cell reading. The `Operations` context is demonstrated at the header row, not at each button. It has no CSS or layout engine and cannot show that the label is visually hidden.

## Targeted MR test

`core/modules/field/tests/src/Functional/FormTest.php --filter testFieldFormUnlimited`.

- After, in place: `OK (2 tests, 35 assertions)`. Log: `tests/after.log`.
- Before: the After (MR) test file was copied into the Before **container** at `/tmp/FormTest.php` and run against the pristine checkout. No checkout file was edited. It fails at the MR’s first new assertion, `FormTest.php:289`: the XPath finds the empty `th`. Result: `Tests: 2, Assertions: 15, Failures: 1`. Log: `tests/before.log`.
- This demonstrates fail-before and pass-after with the MR’s own assertions, not with the Lab’s AJAX test.

The Lab’s `MultipleValueWidgetTest` AJAX coverage in the `!17421` main-port patch remains supplemental. The MR’s assertion covers the initial header only; Default Admin’s AJAX re-render is evidenced here by the Playwright and virtual runs, not by the MR test.

## Real VoiceOver

Not completed and not claimed.

- First attempt (agent): `screenreader/2026-11-26T12-41-55-214Z/`. Before side `spawnSync osascript ETIMEDOUT`; After side Safari Automation privilege violation `-10004`. No window was opened.
- Second attempt (user terminal): `screenreader/2026-11-26T12-56-52-891Z/`. Safari windows were opened (ids 14062 and 14065), then the run failed at the URL setter with `Safari got an error: The specified object is a property, not an element. (-10008)`. The helper used `document 1` inside a window tell; it now uses `document of (first window whose id is N)`.
- No phrases were recorded in either attempt, no navigation scenario ran, and no unrelated Safari window was closed. The second attempt's windows were closed by its cleanup path.
- Cause of the first failure: the agent process does not have macOS permission to control Safari. Cause of the second: a lab script bug, now fixed; runtime behaviour of the fix is untested because the agent still cannot control Safari.
- A successful run still has to come from the user’s terminal.

No VoiceOver table navigation, header announcement, Remove-button column context or AJAX persistence is verified until that run completes.

## Limits

- One browser, one viewport, one theme (Default Admin), light mode only.
- The virtual reader is synthetic evidence, not VoiceOver or NVDA.
- No person-led keyboard or screen reader review.
- No forced-colours, zoom, translated-string or non-Chromium coverage for this change.
- MR !17622 reports one review note. The notes/discussions API returned HTTP 401, so its content was not read; a zero unresolved-thread count is not proof that no discussion exists.
- Full core lint was not run for this variant; the MR test result is the targeted check requested.
