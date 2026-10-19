# Validating #3587661: how it was checked, and the results

How to reproduce the problem is in [REPRODUCE.md](REPRODUCE.md). This file records how the merge request and the lab's proposal were
checked, and what the results were. Everything here was run on 2026-10-19. Evidence is a **DRAFT** until a person has reviewed it.

## What was compared

| Side | Code | Patch (sha256, first 8) |
|---|---|---|
| Before | core `11.x` at `21e0dcbac719fc0da73d5f840e29870a0ac6b35d` (2026-10-19), unchanged | none |
| After, MR | the same, plus MR !16335: `aria-label` on the checkbox in `FileWidget::process()` | `branches/3587661-mr-16335.patch` (`77c4a8a5`) |
| After, proposal | the same, plus `#title_display = 'invisible'` in place of `unset(#title)` in `FileThemeHooks::preprocessFileWidgetMultiple()` | `proposals/3587661-visually-hidden-label.patch` (`403fe6ce`) |

The PHPUnit runs added `proposals/3587661-test.patch` (`218242a2`) on each side.

Why `11.x` and not `main`: this session had PHP 8.3 and no Docker, and `main` needs PHP 8.5. The three files involved
(`FileWidget.php`, `FileThemeHooks.php`, `FileFieldDisplayTest.php`) have the same Git blob on `main` at
`a50836dbcfe00d292a6c2960f5002ad482395d21` and on `11.x` at `21e0dcba`, and all three patches apply to `main` unchanged
(`git apply --check`). Nothing was run on `main`.

Environment: Ubuntu 24.04.5, PHP 8.3.6 (built-in server, `php -S`), SQLite 3.45.1, Standard install plus
[`recipes/repro_3587661`](../../../recipes/repro_3587661/recipe.yml), Chromium 141.0.7390.37 (Playwright 1.64.1), axe-core 4.14.0,
Node 22.22.0, PHPUnit 11.5.55, PHP_CodeSniffer 4.0.4 with drupal/coder 9.0.1.

To install the development tools, the scratch checkout's `composer.json`, `composer.lock` and
`composer/Metapackage/DevDependencies/composer.json` were edited to leave out the PHPStan packages, which could not be downloaded (see
"Not run"). Only test tooling was changed. No file under `core/` changed apart from the patches under test, and each was reverted
after its run.

## Results

### Browser: the form after uploading a file (`tools/playwright/label-3587661.mjs`)

A real `.txt` file was uploaded into each of the recipe's three fields on `/node/add/article`, at 1280 by 900, light scheme.

| Theme | Side | Display checkbox, two-value fields (both) | Single-value field (control) | axe-core, WCAG 2.0 to 2.2 A/AA | Run |
|---|---|---|---|---|---|
| Default Admin | Before | no `<label>`, no `aria-label`; accessible name **empty**; axe `label` **fails** | visible label; name "Include file in display" | `label` (2 nodes) | [17-41-58 before](playwright/2026-10-19T17-41-58-706Z-before/SUMMARY.md) |
| Default Admin | MR | `aria-label`; name "Include file in display"; passes | visible label **and** the same `aria-label` | none | [17-42-20 after-mr](playwright/2026-10-19T17-42-20-094Z-after-mr/SUMMARY.md) |
| Default Admin | Proposal | `<label class="form-item__label visually-hidden">`; name "Include file in display"; passes | unchanged | none | [17-42-40 after-proposal](playwright/2026-10-19T17-42-40-883Z-after-proposal/SUMMARY.md) |
| Claro | Before | as Default Admin: name **empty**, `label` **fails** | visible label | `label` (2 nodes) | [17-44-29 before](playwright/2026-10-19T17-44-29-213Z-before/SUMMARY.md) |
| Claro | MR | `aria-label`; name present; passes | visible label and `aria-label` | none | [17-44-51 after-mr](playwright/2026-10-19T17-44-51-202Z-after-mr/SUMMARY.md) |
| Claro | Proposal | visually hidden `<label>`; name present; passes | unchanged | none | [17-45-11 after-proposal](playwright/2026-10-19T17-45-11-527Z-after-proposal/SUMMARY.md) |

"Accessible name" is what Chromium's accessibility tree reports (`ariaSnapshot`): Before `checkbox [checked]`; MR and proposal
`checkbox "Include file in display" [checked]`. Each run folder has `results.json` with every value.

Visual: no label text appears in the Display column on any side. The screenshots of each field are in each run folder. They do not
match pixel for pixel, because Drupal renames a file uploaded again under the same name (`lab-3587661_16.txt`, `_22.txt`), and the
longer name wraps differently. The Display column and the checkbox look the same.

Uploads: the second and third field each needed a second attempt in every run. Right after one upload's AJAX response, Drupal can
drop the next file input's change event; the script sets the file again and records the attempts (`uploadAttempts`). This happens on
every side, so it is not caused by either patch.

### PHPUnit: `core/modules/file/tests/src/Functional/FileFieldDisplayTest.php`

`proposals/3587661-test.patch` adds three assertions to `testDefaultFileFieldDisplay()`, which already makes an unlimited file field
with the Display field on. The assertions check that the display checkbox has a `<label for>`, that its text is "Include file in
display", and that the label has the `visually-hidden` class. Run with `SIMPLETEST_DB=sqlite://…` against the built-in server.

| Code | Result |
|---|---|
| Test only (Before) | **Fails** as intended: `Element matching css "label[for="edit-…-0-display"]" not found` (line 168). 1 test, 11 assertions, 1 failure. |
| Proposal and test, whole class | **Passes**: 4 tests, 74 assertions. |
| MR and test, whole class | **Fails** at the same assertion: 4 tests, 72 assertions, 1 failure. The test asks for a `<label>`, and the MR adds an `aria-label`. If the MR's approach is kept, its test would assert the `aria-label` instead. |

### Coding standards

`vendor/bin/phpcs --standard=core/phpcs.xml.dist`: no errors or warnings on `FileThemeHooks.php` and `FileFieldDisplayTest.php` with
the proposal and test applied, and none on `FileWidget.php` with the MR applied.

## Reading of the two approaches (reasoning, not a test)

- Both give the checkbox the accessible name "Include file in display", and axe reports nothing on either.
- The MR puts the `aria-label` on every display checkbox, including the single-value one, which already has a visible `<label>` with the
  same text. The text is then defined in two places. If a site changes the `#title` (in a form alter, say), the `aria-label` still
  says the old text and overrides the visible label (WCAG 2.5.3, Label in Name).
- The proposal keeps the element's own `#title` and only hides it visually in the table. It is the pattern the same table already uses
  for the weight select (`'#title_display' => 'invisible'` in `FileWidget`). It changes one line where the label was removed, and the
  one-value field does not change.
- With two or more files, every checkbox has the same name. The table's row gives the context, and the weight select does name the
  file ("Weight for @title"). A name that includes the file would need a new translatable string. It is not part of the proposal.

## Not run or not verified

- **A person's keyboard pass and a real screen reader.** Not done. The names above come from Chromium's accessibility tree and axe.
- **The Guidepup virtual screen reader.** Tried and dropped. With html-aria 0.5.3 under jsdom 30, it announced a checkbox (and a
  radio) as "textbox", and a header cell in `<thead>` as "rowheader", so it could not confirm a checkbox's role or name. That
  also affects other lab scripts that use it; it is noted in `AI-LEARNING.md`.
- **PHPStan.** Not run: `phpstan/phpstan` is published only as a download from GitHub, which the session's proxy refused.
- **cspell and the other CI jobs.** Not run.
- **The JavaScript test `FileFieldWidgetAdminThemeTest`.** It ticks and unticks the display checkbox by field name, so the change
  should not affect it. Not run: the installed ChromeDriver (147) does not match the installed Chromium (141).
- **Core `main` at runtime** (PHP 8.5), a DDEV build of the variants, Olivero or Stark, Firefox and WebKit, dark mode, forced colours,
  zoom and narrow viewports.
- **The issue and the MR.** drupal.org and git.drupalcode.org were not reachable from the session, so the issue (with its comments) and
  the MR diff were read only from the owner's pasted copies on 2026-10-19. The MR head commit is not known. The related issue
  #3587214 ("Checkbox missing label") was not read.
