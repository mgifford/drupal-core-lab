# #3587661: Missing accessible labels on file display checkboxes

Issue: [#3587661](https://www.drupal.org/project/drupal/issues/3587661)

Current contribution: [3587661-native-display-label](https://git.drupalcode.org/issue/drupal-3587661/-/tree/3587661-native-display-label)

Last updated: 2026-11-25.

## Problem

A file field that allows more than one value, with "Enable Display field" selected, lists uploaded files in a table on the node form.

The checkbox in the Display column has no label or accessible name. Chromium's accessibility tree exposes an unnamed checkbox, and axe reports a `label` violation.

`FileThemeHooks::preprocessFileWidgetMultiple()` removes the checkbox's `#title` ("Include file in display") before placing it in the table.

Single-value fields retain their visible labels. Whether the field is required makes no difference. No contributed module is needed to reproduce the problem.

See [REPRODUCE.md](REPRODUCE.md).

## Resolution

The Lab's October 19 evaluation identified a simpler alternative to the original MR !16335.

Rather than removing the checkbox title:

```php
unset($widget['display']['#title']);
```

Preserve the title and hide the native label visually:

```php
$widget['display']['#title_display'] = 'invisible';
```

Alex Pott independently recommended the same approach in comment #19 on November 12, 2026.

This implementation:

- Preserves the native HTML label and its accessible name.
- Avoids duplicated translatable markup.
- Follows the existing pattern used by the file weight selector.
- Leaves single-value file fields unchanged.
- Preserves Form API title information.
- Requires no additional ARIA, CSS or JavaScript.

## Upstream contribution

On November 25, 2026, the Lab's implementation and regression test were committed to a new issue branch and pushed to the Drupal issue fork.

| Property | Value |
|---|---|
| Branch | `3587661-native-display-label` |
| Commit | `ee07e91dcf` |
| Core base | `1dec2b8cc1968e12eb4e66fc41d1859036ad4d66` |
| Files changed | 2 |
| Insertions | 32 |
| Deletions | 1 |
| Git whitespace check | Passed |
| Contribution branch publication | Reported successful |
| Current upstream CI | Not yet verified |

The contribution modifies only:

- `core/modules/file/src/Hook/FileThemeHooks.php`
- `core/modules/file/tests/src/Functional/FileFieldDisplayTest.php`

The new contribution is intended to supersede MR !16335, which added an `aria-label` in `FileWidget::process()`.

The original MR and its patch artifacts are retained as historical evidence. The old interdiff is no longer the recommended submission path.

## Regression coverage

The contribution extends `FileFieldDisplayTest::testDefaultFileFieldDisplay()` to verify that the Display checkbox retains a native, visually hidden label:

- On the node edit form.
- After a form validation error.
- After a form validation error with Inline Form Errors enabled.

This extends an existing functional test rather than introducing a new test class.

## Historical testing evidence

The October 19 evaluation used core `11.x` at `21e0dcbac719fc0da73d5f840e29870a0ac6b35d`.

The three affected files were identical to core main at `a50836dbcfe00d292a6c2960f5002ad482395d21`.

The proposal was also evaluated by the contributor using DDEV on that pinned main revision.

| Check | Result |
|---|---|
| Before accessible name | Empty |
| After accessible name | Include file in display |
| Native label retained | Yes |
| Single-value field | Unchanged |
| Default Admin browser evaluation | Passed |
| Claro browser evaluation | Passed |
| Scoped axe label violation | Resolved |
| Regression test without fix | Failed as expected |
| Functional test class with fix | 4 tests, 87 assertions passed |
| PHPCS | Passed |

The November 25 contribution applies the previously evaluated implementation and regression test to a newer Core revision.

The historical test results have not been represented as fresh results for the new contribution.

See [EVIDENCE.md](EVIDENCE.md) for detailed results and limitations.

## Files and links

| Resource | Location |
|---|---|
| Reproduction instructions | [REPRODUCE.md](REPRODUCE.md) |
| Patch provenance | [BRANCHES.md](BRANCHES.md) |
| Implementation patch | [3587661-visually-hidden-label.patch](proposals/3587661-visually-hidden-label.patch) |
| Regression test patch | [3587661-test.patch](proposals/3587661-test.patch) |
| Original MR patch | [3587661-mr-16335.patch](branches/3587661-mr-16335.patch) |
| Historical MR interdiff | [3587661-on-mr-16335.patch](proposals/3587661-on-mr-16335.patch) |
| Evaluation evidence | [EVIDENCE.md](EVIDENCE.md) |
| Browser results | [playwright/](playwright/) |
| Reproduction recipe | [recipe.yml](../../../recipes/repro_3587661/recipe.yml) |
| Comparison variants | [variants.json](variants.json) |
| Browser evaluation script | [label-3587661.mjs](../../../tools/playwright/label-3587661.mjs) |
| Historical comment draft | [ISSUE-COMMENT-DRAFT.md](ISSUE-COMMENT-DRAFT.md) |

## Outstanding review

- Record the replacement merge request number and URL.
- Confirm the new MR's CI results, including the test-only changes job.
- Confirm that the original MR has been superseded.
- Complete independent keyboard and real screen-reader testing.
- Review related issue [#3587214](https://www.drupal.org/project/drupal/issues/3587214) for overlap.
- Consider whether file-specific checkbox names would provide additional usability benefits in a separate issue.

The scripted accessibility evidence supports the fix but does not establish complete WCAG conformance.

## Next action

Request independent community review of the native-label implementation and its regression coverage.

No further implementation changes are proposed unless CI or community review identifies a specific problem.

Generated with the help of an LLM.
