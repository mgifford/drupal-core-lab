# Evidence: #3155130 persistent summary disclosure (contributed `text_with_summary` 2.0.x)

Status: **DRAFT.** Automated tests and browser runs only. No person has reviewed this, no real screen reader was used, and
nothing has been posted upstream. The historical core write-up is preserved unchanged in
[EVIDENCE-2026-11-06-historical.md](EVIDENCE-2026-11-06-historical.md).

## 1. What was compared

| | Before | After |
|---|---|---|
| Env | `baseline-3155130-contrib` | `issue-3155130-contrib` |
| Code under test | contributed `text_with_summary` `2.0.x` at `89c4282cf25259564ce7fa41b9dd70f7fe7f496d` | same commit + the two patches in [BRANCHES.md](BRANCHES.md) (checked-out branch `3155130-persistent-disclosure`, commits `3f6854c` and `4e70269`) |
| Core | `d29add7ebc18954dcb88877ed38b5bd88cdbf967` (Drupal 12.0-dev, 2026-09-30) | same |
| Claro | contrib `4.0.x` at `474f080c47f5ce21961bf90515fb7bdea1d7dcd4` (both sites) | same |
| Recipe | `repro_3155130_contrib` | same |
| Theme | Default Admin (default), Claro available | same |

The contrib module is extracted at the pinned commit into `modules/contrib/text_with_summary` (no `.git`), then the After
side applies:

1. `branches/3155130-persistent-disclosure.patch` — implementation.
2. `branches/3155130-persistent-disclosure-tests.patch` — regression tests and test-only validator.

`tools/compare/setup.mjs` verifies both sides by content and records the hashes.

**Resource decision.** The Lab's registered comparison model is used: one Before and one After site, both built from the
same pinned core and the same recipe, in the same disposable pair. No third environment was created, no Drupal core was
downloaded (the pair reuses `envs/core.git` and the existing Composer cache), and the two sites differ only by the two
patches. This is reproducible from the recipe and the pinned revisions; see [REPRODUCE.md](REPRODUCE.md).

 The Before checkout has no tracked changes
and no modified contrib files; its `js/text.js` SHA-256 is `68d864c7c6f11b9aae420d2e67ca63f2426acf3aa3c66e9b8859054480f6ca4c`,
the commit's blob.

## 2. Source-level findings (read from the code)

`js/text.js` at `89c4282` (identical to the historical core file):

- The toggle is `$link.appendTo($summaryLabel)` when expanded and `$link.appendTo($fullLabel)` when collapsed. Both are
  `<label>` elements; the button's text becomes part of the textarea's accessible name and the HTML is invalid.
- On click the code calls `$summary.hide()` / `.show()`, changes the button text with `$button.html(...)`, and **moves** the
  link between labels. The `.html()` call removes a theme override's hidden prefix.
- `$link` is created once but the focused button is later replaced/moved; focus is not managed.
- The collapsed summary is hidden with `display: none` (jQuery `.hide()`), which is correct for keyboard order, but the
  summary is **before** the Body value and before its own control.
- No `aria-expanded`, no `aria-controls`, no id on the wrapper.
- Every summary `#title` is `Summary`; the multi-value value label is un-hidden and a button appended, but the summary names
  are not distinguished by field or item.
- The empty check is `summary.value === ''`, so an empty summary with a validation error is collapsed on the reloaded page.
- The library is attached only when `!show_summary && !$required`; required/always-visible summaries get no context naming.

The 2020 core patch's data loss came from wrapping the field in `<details>` and changing the submitted element name to
`container[summary]`; the form element tree was not preserved. This proposal does neither: the summary element, its
`#parents` and its `name` are untouched.

## 3. Executed tests

### 3.1 FunctionalJavascript (PHPUnit 12.5.34, Drupal's `WebDriverTestBase`, Chrome 143 in the DDEV container)

Command (both sides; the test patch is applied to each side first):

```sh
ddev phpunit modules/contrib/text_with_summary/tests/src/FunctionalJavascript/TextareaWithSummaryTest.php \
  --log-junit /var/www/html/phpunit-<side>.xml
```

| | Tests | Assertions | Failures | Time |
|---|---|---|---|---|
| Before | 10 | 99 | **10** | 43.1 s |
| After | 10 | 156 | **0** | 44.6 s |

Full names, per-test status and the Before failure messages: [tests/results.md](tests/results.md). The raw JUnit XML and
console logs are in [`tests/`](tests/); `tests/summarize.py` regenerates the JSON/Markdown.

Coverage of the test methods:

| Requirement | Test |
|---|---|
| Valid label structure, no button in a label | `testDisclosureStructure` |
| Stable Body/Summary textarea names, class and item context | `testDisclosureStructure`, `testMultipleValuesAddedByAjax`, `testRequiredSummaryStaysVisible` |
| Disclosure identity and DOM position | `testDisclosureStructure`, `testClickToggleKeepsOneButton` |
| Focus retention after Enter and Space (W3C key actions, not synthetic events) | `testKeyboardActivationRetainsFocus` |
| `aria-expanded` / `aria-controls`, unique valid ids | `testDisclosureStructure`, `testMultipleValuesAddedByAjax` |
| Logical DOM/keyboard order, collapsed content not focusable | `testDisclosureStructure` |
| Single and multi-value | all tests; `testMultipleValuesAddedByAjax` adds a row through AJAX; `testMultipleValuesAfterReorder` swaps the submitted weights and reopens |
| Empty and populated summary | `testEmptyAndPopulatedSummaries` |
| Required summary and validation error | `testRequiredSummaryStaysVisible`, `testValidationErrorExpandsEmptySummary` |
| Theme override compatibility | `testSummaryButtonOverride` |
| Persistence after save, collapse and reopen | `testSummaryPersistsAfterSave` |

The keyboard test uses the WebDriver **W3C actions** endpoint (`postActions`) for real Enter and Space, not Mink's
synthetic `keyPress`, and asserts `document.activeElement` stays on the same button.

The test-only validator in `text_summary_test` sets an error on an **empty** optional summary when the node title is
`trigger-empty-summary-error`; this proves the After code expands an *error* (not just a non-empty value). Before, the
summary stays collapsed and the error is hidden.

### 3.2 Before/after failure demonstration

All 10 tests fail on Before with meaningful messages, for example:

- `Failed asserting that null is identical to 'false'` — no `aria-expanded`.
- `Focus stays on the button after Enter` — after Enter the active element is `<body>`.
- `Each disclosure controls a different element` — every `aria-controls` is null (AJAX addition and reorder tests).
- `'Summary' … contains "for … required summary"` — repeated names.
- `'Edit summary' … contains "Custom override:"` — the override text was wiped.

The test patch is applied to Before as test support only; the implementation is untouched there. After the run the two
test files were restored to the commit, so the recorded Before state is pristine.

## 4. Browser evaluation

Ten completed runs, Chromium 159.0.8154.6 (Playwright 1.65.1, real keyboard input), macOS arm64:

| Run | Theme | Scheme / media | Viewport | Key results (Before → After) |
|---|---|---|---|---|
| light | Default Admin | light | 1280×900 | 4→0 toggles in label; 0→4 `aria-expanded`; focus lost→kept; "Summary"→"Summary for Body"; data kept both |
| dark | Default Admin | dark | 1280×900 | same |
| forced | Default Admin | forced colours | 1280×900 | same |
| narrow | Default Admin | light | 480×900 | same |
| light | Claro 4.0.x | light | 1280×900 | same |
| dark | Claro 4.0.x | dark | 1280×900 | same |
| forced | Claro 4.0.x | forced colours | 1280×900 | same |
| rtl | Default Admin | light, `dir="rtl"` simulated | 1280×900 | same |
| zoom | Default Admin | root font 200% | 1600×1200 | same; sidebar overlaps the form (finding F004) |
| zoom | Claro 4.0.x | root font 200% | 1600×1200 | same; sidebar overlaps the form (finding F004) |

Aggregated table and per-run durations: [browser/results.md](browser/results.md) / [browser/results.json](browser/results.json).
Each run's full `results.json`, screenshots and ARIA snapshots are under [`playwright/`](playwright/). Curated comparisons
are in [`visual/`](visual/).

**Coverage tooling note.** `node scripts/coverage.mjs 3155130` reads the historical `evaluate-3155130.mjs` result shape (pinned variant), not the new `evaluate-3155130-contrib.mjs` runs. It therefore reports 0 of its 7 environments and leaves the historical `COVERAGE.md` relevant only to the 2026-11-06 pinned evaluation. The authoritative matrix for this proposal is [browser/results.md](browser/results.md) / [browser/results.json](browser/results.json); every run's raw `results.json`, screenshots and ARIA snapshots are in `playwright/`.

### 4.1 Accessibility tree (Playwright ARIA snapshot of the node form)

Collapsed, Default Admin light (`visual/chromium-light-default_admin-1280x900-aria-collapsed.diff`):

```
- text: Body (
- button "Edit summary"
- text: )
+ text: (
+ button "Edit summary for Body"
+ text: ) Body
```

Expanded:

```
- text: Summary (
- button "Hide summary"
- text: )
- textbox "Summary (Hide summary)"
+ text: (
+ button "Hide summary for Body" [expanded]
+ text: ) Summary for Body
+ textbox "Summary for Body"
```

The Before snapshot shows the textarea's accessible name **changing** from "Body (Edit summary)" to
"Summary (Hide summary)"; the After snapshot shows a stable "Body" / "Summary for Body". The multi-value rows show four
identical `button "Edit summary"` in Before and four distinguishable buttons in After, e.g.
`button "Edit summary for Notes (three values) (value 2)"`.

### 4.2 Focus transitions

Default Admin light, real Enter then Space on the focused Body control:

- Before, before Enter: `BUTTON "Edit summary"` (no `aria-expanded`). After Enter: `BODY` — focus lost. Space is not
  reached because the button no longer exists.
- After, before Enter: `BUTTON "Edit summary for Body"` (`aria-expanded="false"`,
  `aria-controls="edit-field-body-0-summary-content"`). After Enter: the **same** button, `aria-expanded="true"`,
  text "Hide summary for Body". After Space: the same button, `aria-expanded="false"`, text "Edit summary for Body".

### 4.3 Data integrity

Default Admin light, known summary typed by the evaluator
`Summary typed by the evaluator: 3155130.`:

| | Before | After |
|---|---|---|
| Submitted name | `field_body[0][summary]` | `field_body[0][summary]` |
| Value after Save and reopen | kept | kept |
| Value after collapsing and Save | kept | kept |

The same result in all ten runs. No `[container][summary]` name exists in the DOM; the tests assert that explicitly. The
details patch's regression would fail `testSummaryPersistsAfterSave` (and the browser persistence check) because the value
would be dropped on save.

### 4.4 Required summary and validation errors

The fixture has a required-summary field that is always visible:

- Before: label "Summary", no disclosure (0 buttons), error visible but the label is not distinguishable.
- After: label "Summary for Required summary", still no disclosure, error visible and `aria-invalid="true"`.
- The optional-summary error test (PHPUnit, `testValidationErrorExpandsEmptySummary`): Before stays collapsed; After
  expands, the error text is visible, `aria-invalid="true"`, and `aria-expanded="true"`.

### 4.5 Theme override

`text_summary_test`'s existing override adds `text-test-edit-link` and a visually hidden "Custom override: " prefix.

- Before: the class is present, but after the initial auto-collapse the button text is only "Edit summary" — the old
  `.html()` call wiped the prefix.
- After: class present and text `Custom override: Edit summary for Body`; toggling keeps the prefix (the implementation
  re-themes only the button's children and never replaces the button).

### 4.6 axe

`@axe-core/playwright`, tags WCAG 2.0/2.1/2.2 A and AA, scoped to the node form, at collapsed and expanded (and
multi-value in the main run): **0 violations Before and After in all runs**. This is not a pass for the Before UI: axe
does not test focus loss, a control inside a label, or an accessible name that changes on activation. The ARIA and focus
evidence above is the relevant evidence.

## 5. Resource consumption

| Item | Value |
|---|---|
| Two DDEV sites | 630 MB + 631 MB (worktrees share `envs/core.git`) |
| Contrib clones | `text_with_summary` 116 KB, Claro 2.6 MB (bare, in `envs/.contrib/`) |
| Full Core repository downloads | **none** — the pair reuses the existing `envs/core.git` at `d29add7e` and the existing Composer cache |
| First build (from cached images and vendor) | under 10 minutes; the refresh/reinstall used for the final evidence took about 5 minutes |
| PHPUnit (10 FunctionalJavascript tests) | 43.1 s Before, 44.6 s After, plus about 1 minute of setup per side |
| Browser runs | 34–49 s per run (10 completed + 1 stopped zoom run at 1280 px) |
| Disk after the work | 13 GiB free on the workspace volume |

Commands used (from the lab root):

```sh
node tools/compare/setup.mjs 3155130-contrib --reinstall --refresh-patches
node scripts/lab-env.mjs start 3155130-contrib
node scripts/lint.mjs 3155130-contrib --contrib
cd tools/playwright && node evaluate-3155130-contrib.mjs 3155130-contrib
python3 reports/issues/3155130/tests/summarize.py
python3 reports/issues/3155130/browser/summarize.py
```

## 6. Code checks

- PHPCS with core's `core/phpcs.xml.dist` on the changed PHP files: **pass** (no output).
- ESLint with core's flat config on `js/text.js`: **0 errors**, 52 warnings (the same `no-jquery` and `jsdoc` warning
  classes the original file has; no new errors). The file was formatted to Prettier's expected output.
- `node --check js/text.js`: pass.
- No new dependency, no CSS file, no change to `Drupal.theme.textEditSummaryButton()`.

## 7. Historical core evaluation (preserved)

The 2026-11-06 run on core `f48d0a58b3ec` compared the old widget with a port of the 2020 `<details>` patch. Its findings
are unchanged in [EVIDENCE-2026-11-06-historical.md](EVIDENCE-2026-11-06-historical.md), along with
`compare/3155130-pinned/`, `tree-diff/3155130-pinned/` and `playwright/2026-11-06T03-46-30-534Z/`. That run showed the
details port losing the summary on save; this proposal does not use that approach.

## 8. Not verified

- A person's keyboard pass. The lab's browser keyboard input is real Playwright input, but no person has performed the
  pass.
- VoiceOver, NVDA, JAWS or TalkBack. No real screen reader was run; the ARIA snapshots are a browser tree, not speech.
- Firefox and WebKit. Chromium only.
- A real RTL language pack. `dir="rtl"` was set on the page; the English strings show bidi artifacts, and this is a visual
  sanity check, not a translation test.
- Real browser zoom and a 400% reflow check. `--zoom=200` raises the root font size. At 1280 px the Default Admin sidebar
  intercepted a click, so the completed zoom run uses 1600×1200 and still shows the sidebar overlapping the form
  (finding F004, unrelated to the disclosure).
- Touch input; real Windows High Contrast (forced colours are emulated); Safari.
- The contributed project's CI. The patches have not been pushed, so its GitLab pipeline has not run them.

## 9. Safety

No possible security vulnerability was found. Nothing was posted or pushed. The draft queue item is for human review.
