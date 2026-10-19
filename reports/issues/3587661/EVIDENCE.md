# Validating #3587661: how it was checked, and the results

How to reproduce the problem is in [REPRODUCE.md](REPRODUCE.md). This file records how the merge request and the lab's proposal were
checked, and what the results were. Everything here was run on 2026-10-19. Evidence is a **DRAFT** until a person has reviewed it.

## What was compared

| Side | Code | Patch (sha256, first 8) |
|---|---|---|
| Before | core `11.x` at `21e0dcbac719fc0da73d5f840e29870a0ac6b35d` (2026-10-19), unchanged | none |
| After, MR | the same, plus MR !16335: `aria-label` on the checkbox in `FileWidget::process()` | `branches/3587661-mr-16335.patch` (`77c4a8a5`) |
| After, proposal | the same, plus `#title_display = 'invisible'` in place of `unset(#title)` in `FileThemeHooks::preprocessFileWidgetMultiple()` | `proposals/3587661-visually-hidden-label.patch` (`403fe6ce`) |

The PHPUnit runs added `proposals/3587661-test.patch` (`f6a637a2`) on each side. `proposals/3587661-on-mr-16335.patch` is the
proposal and the test as one change on top of the MR: it takes the MR's `aria-label` out again. It applies on top of the MR on both
`11.x` and `main`.

Why `11.x` and not `main`: this session had PHP 8.3 and no Docker, and `main` needs PHP 8.5. The three files involved
(`FileWidget.php`, `FileThemeHooks.php`, `FileFieldDisplayTest.php`) have the same Git blob on `main` at
`a50836dbcfe00d292a6c2960f5002ad482395d21` and on `11.x` at `21e0dcba`, and all the patches apply to `main` unchanged
(`git apply --check`). Nothing was run on `main`.

Environment: Ubuntu 24.04.5, PHP 8.3.6 (built-in server, `php -S`), SQLite 3.45.1, Standard install plus
[`recipes/repro_3587661`](../../../recipes/repro_3587661/recipe.yml), Chromium 141.0.7390.37 (Playwright 1.64.1), axe-core 4.14.0,
`@guidepup/virtual-screen-reader` 0.33.0 (html-aria 0.5.3, jsdom 30.1.3), Node 22.22.0, PHPUnit 11.5.55, PHP_CodeSniffer 4.0.4 with
drupal/coder 9.0.1.

To install the development tools, the scratch checkout's `composer.json`, `composer.lock` and
`composer/Metapackage/DevDependencies/composer.json` were edited to leave out the PHPStan packages, which could not be downloaded (see
"Not run"). Only test tooling was changed. No file under `core/` changed apart from the patches under test, and each was reverted
after its run.

## Results

### Browser: the form after uploading a file (`tools/playwright/label-3587661.mjs`)

A real `.txt` file was uploaded into each of the recipe's three fields on `/node/add/article`, at 1280 by 900, light scheme, without
Inline Form Errors.

| Theme | Side | Display checkbox, two-value fields (both) | Virtual screen reader (both) | Single-value field (control) | axe-core, WCAG 2.0 to 2.2 A/AA | Run |
|---|---|---|---|---|---|---|
| Default Admin | Before | no `<label>`, no `aria-label`; accessible name **empty** | "checkbox, checked" | visible label; name "Include file in display" | `label` (2 nodes) | [before](playwright/2026-10-19T20-51-53-150Z-before/SUMMARY.md) |
| Default Admin | MR | `aria-label`; name "Include file in display" | "checkbox, Include file in display, checked" | visible label **and** the same `aria-label` | none | [after-mr](playwright/2026-10-19T20-52-27-191Z-after-mr/SUMMARY.md) |
| Default Admin | Proposal | `<label class="form-item__label visually-hidden">`; name "Include file in display" | "checkbox, Include file in display, checked" | unchanged | none | [after-proposal](playwright/2026-10-19T20-52-50-752Z-after-proposal/SUMMARY.md) |
| Claro | Before | as Default Admin: name **empty** | "checkbox, checked" | visible label | `label` (2 nodes) | [before](playwright/2026-10-19T20-53-15-217Z-before/SUMMARY.md) |
| Claro | MR | `aria-label`; name present | "checkbox, Include file in display, checked" | visible label and `aria-label` | none | [after-mr](playwright/2026-10-19T20-53-38-312Z-after-mr/SUMMARY.md) |
| Claro | Proposal | visually hidden `<label>`; name present | "checkbox, Include file in display, checked" | unchanged | none | [after-proposal](playwright/2026-10-19T20-54-01-929Z-after-proposal/SUMMARY.md) |

"Accessible name" is what Chromium's accessibility tree reports (`ariaSnapshot`): Before `checkbox [checked]`; MR and proposal
`checkbox "Include file in display" [checked]`. The virtual screen reader is Guidepup over a jsdom snapshot of the checkbox's table
row: evidence, not a person with a real screen reader. The script sets jsdom's `Element` as the global first, because without it
html-aria announces every `<input>` as "textbox" (`AI-LEARNING.md`, 2026-10-19). Each run folder has `results.json` with every value.

**With the simplified recipe** (one file field, Image hidden; 2026-10-19, Default Admin, same core and patches): Before has no
name and fails axe `label` (1 node); the MR and the proposal give "checkbox, Include file in display, checked" and no axe violations.
Runs: [before](playwright/2026-10-19T22-35-20-254Z-before/SUMMARY.md), [after-mr](playwright/2026-10-19T22-35-42-592Z-after-mr/SUMMARY.md),
[after-proposal](playwright/2026-10-19T22-35-48-568Z-after-proposal/SUMMARY.md). The table above was made with the earlier recipe's three fields.

Visual: no label text appears in the Display column on any side. The screenshots of each field are in each run folder. They do not
match pixel for pixel, because Drupal renames a file uploaded again under the same name (`lab-3587661_16.txt`, `_22.txt`), and the
longer name wraps differently. The Display column and the checkbox look the same.

Uploads: the second and third field each needed a second attempt in every run. Right after one upload's AJAX response, Drupal can
drop the next file input's change event; the script sets the file again and records the attempts (`uploadAttempts`). This happens on
every side, so it is not caused by either patch.

### The owner's run in DDEV, on core `main` (2026-10-19)

The owner built `3587661-proposal` with `tools/compare/setup.mjs` on a Mac, in DDEV with PHP 8.5, on core `main` at `a50836d`.
Before is unchanged core; After has the proposal and the test. The viewer was used in Chromium, Desktop width, light scheme, Default
Admin, with a `.txt` file uploaded by hand in each frame.

- With the simplified recipe, Run checks gave: precondition passes on both; the fix check fails on Before (empty) and passes on After
  ("Include file in display"); no JavaScript errors on either side. The verdict was "All 2 checks behave as expected". The
  live axe count in the header was Before 2, After 1, and the Accessibility tab showed no new violations on After.
- An earlier run the same day, with the three-field recipe, also passed the single-value check on both sides ("All 3 checks
  behave as expected"). Which variant the viewer showed then was not recorded.
- The owner compared the checkbox's `<input>` markup on both sides and found it identical. That is expected: the fix adds a
  `<label>` next to the input and does not change the input itself.

Not done in that run: a keyboard pass or a screen reader, and the MR's variant (`3587661-pinned`).

### PHPUnit: `core/modules/file/tests/src/Functional/FileFieldDisplayTest.php`

`proposals/3587661-test.patch` adds a helper, `assertDisplayCheckboxLabel()`, and calls it three times in
`testDefaultFileFieldDisplay()`, which already makes an unlimited file field with the Display field on. The helper checks that the
display checkbox has a `<label for>`, that its text is "Include file in display", and that the label has the `visually-hidden` class.
The three calls:

1. on the node edit form;
2. after saving with an empty title, without Inline Form Errors (core's message "Title field is required." is checked);
3. after installing Inline Form Errors and saving with an empty title again (its summary "1 error has been found" is checked, so
   the form was rendered with IFE's inline errors).

Run with `SIMPLETEST_DB=sqlite://…` against the built-in server.

| Code | Result |
|---|---|
| Test only (Before), `testDefaultFileFieldDisplay` | **Fails** as intended at the first call (line 165): `Element matching css "label[for="edit-…-0-display"]" not found`. 1 test, 12 assertions, 1 failure. |
| Proposal and test, whole class | **Passes**: 4 tests, 87 assertions. |
| MR and test, `testDefaultFileFieldDisplay` | **Fails** at the same place: 1 test, 12 assertions, 1 failure. The test asks for a `<label>`, and the MR adds an `aria-label`. |

An earlier version of the test (three assertions, without the error and IFE cases) gave the same pattern: fails on Before and with
the MR, and the whole class passes with the proposal (4 tests, 74 assertions).

### Coding standards

`vendor/bin/phpcs --standard=core/phpcs.xml.dist`: no errors or warnings on `FileThemeHooks.php` and `FileFieldDisplayTest.php` with
the proposal and the current test applied, and none on `FileWidget.php` with the MR applied.

## Reading of the two approaches (reasoning, not a test)

- Both give the checkbox the accessible name "Include file in display", and axe reports nothing on either.
- Both are small. The MR turns one line of `FileWidget::process()` into four. The proposal changes one line of
  `FileThemeHooks.php` and adds a two-line comment.
- The MR puts the `aria-label` on every display checkbox, including the single-value one, which already has a visible `<label>` with the
  same text. Users notice no difference today. But the text is then defined in two places, and the `aria-label` wins: if a site
  changes the `#title` (in a form alter, say), the name still says the old text (WCAG 2.5.3, Label in Name).
- The MR leaves the `unset($widget['display']['#title'])` in place, so the element still has no title. Inline Form Errors builds its
  error summary links from `#title`, so an error on that checkbox would get no link. No such error was produced in a test; the
  display checkbox has no validation of its own.
- The proposal keeps the element's own `#title` and only hides it visually in the table. It is the pattern the same table already uses
  for the weight select (`'#title_display' => 'invisible'` in `FileWidget`), and a native `<label>` comes before ARIA.
- With two or more files, every checkbox has the same name. The table's row gives the context, and the weight select does name the
  file ("Weight for @title"). A name that includes the file would need a new translatable string. It is not part of the proposal.

## Not run or not verified

- **A person's keyboard pass and a real screen reader.** Not done. The names above come from Chromium's accessibility tree, axe and
  the Guidepup virtual screen reader, which are evidence, not a manual review.
- **Inline Form Errors in the browser runs.** IFE was covered by the PHPUnit test only.
- **PHPStan.** Not run: `phpstan/phpstan` is published only as a download from GitHub, which the session's proxy refused.
- **cspell and the other CI jobs.** Not run.
- **The JavaScript test `FileFieldWidgetAdminThemeTest`.** It ticks and unticks the display checkbox by field name, so the change
  should not affect it. Not run: the installed ChromeDriver (147) does not match the installed Chromium (141).
- **The MR's variant (`3587661-pinned`) in DDEV**, and PHPUnit on core `main` (PHP 8.5). The proposal's variant was run in DDEV on
  `main` by the owner (above). Also not run: Olivero or Stark in the browser (the PHPUnit test uses Stark), Firefox and WebKit, dark
  mode, forced colours, zoom and narrow viewports.
- **The issue and the MR.** drupal.org and git.drupalcode.org were not reachable from the session, so the issue (with its comments) and
  the MR diff were read only from the owner's pasted copies on 2026-10-19. The MR head commit is not known. The related issue
  #3587214 ("Checkbox missing label") was not read.
