# Branch and patch artifacts for #3545814

Extracted 2026-11-27 from https://git.drupalcode.org/issue/drupal-3545814.git with `git diff <merge-base> <branch tip>`. The MR on drupal.org is the source of truth; this is the immutable snapshot the Lab tested.

| Artifact | Source / starting tree | Tip or base | Files | sha256 |
|---|---|---|---|---|
| `branches/3545814-numeric-filter-value-field-missing-name.patch` | issue fork branch `3545814-numeric-filter-value-field-missing-name` | tip `d7e538c35ac3526ba1a0e0e8a441586f57bba312`; base `87de7098664fd7bb741f51d47ec750ab0a178c5a` (2026-07-25) | 2 | `26ec2416f8f82c410e91c800763b684ed5a78ef872774124de07c7d24df15046` |
| `branches/3545814-tests-accessible-names.patch` | test-only interdiff on pristine core or on the MR | base `87de7098664f` | 3 | `e46db38f450bcae6390ed0884f2ddec5b712f83ccabf385632701fd3055d3d63` |
| `branches/3545814-combined-mr13201-plus-tests.patch` | complete proposal, pristine core | base `87de7098664f` | 5 | `638dca90c42e5279dd9023cf9fff5427f031dd4b552e7e4ef06afdec6d881c13` |
| `branches/3545814-proposal-c-hide-numeric-value-label.patch` | corrective interdiff, MR applied | MR tip `d7e538c3` on base `87de7098664f` | 1 | `7aed4387344cdaf2493d4a1321074f590429e117b69107e69a67aad6b0110f20` |
| `branches/3545814-proposal-c-mr13201-plus-c-plus-tests.patch` | MR + C + tests, pristine core | base `87de7098664f` | 6 | `b07e411b89a960388c153f7af717d83d0f6ccb723ebb07dea82cd3cbd32763d8` |

Each was checked with `git apply --check` against its declared starting tree, and the stacked proposal (MR, then C, then tests) against current core `main` `8a7df6cc3e69b6b5d427cb25ce8f66dda8393c29` (2026-11-27) on 2026-11-27. Core `main` moves several times a day, so a later check must repeat it rather than trust this one.

## What each contains

- **MR snapshot** — `FilterPluginBase::buildExposedForm()` keeps `#title` and sets `#title_display => 'invisible'` only when `use_operator` is set; `NumericFilter::valueForm()` gives both value fields the title `Value` instead of an empty string when exposed.
- **Test interdiff** — the same assertions added to `FilterNumericWebTest::testFilterNumericUI()` and a new `FilterTest::testExposedOperatorLabels()` method, plus the test view `views.view.test_filter_exposed_operator_labels.yml`. No production code.
- **Complete proposal** — the MR and the test interdiff together.
- **Proposal C** — one line in `NumericFilter::valueForm()`: `#title_display => $exposed ? 'invisible' : 'before'` on the single-value field, so the numeric filter keeps the accessible name without the visible label the MR alone adds. The fixed-operator branch is untouched.
  - **Correction (2026-11-27):** the first draft used `NULL` for the non-exposed case. A key that is present but `NULL` survives Form API's `+=` defaults, so the label would not render in the Views filter configuration form — the one place the issue summary asks to keep it unchanged. `'before'` is the Form API default, so the configuration form is unchanged. The corrected interdiff and the MR + C + tests patch above are the ones to use; the original `NULL` draft is superseded and was never run.
- **MR + C + tests** — the recommended complete revision if C is accepted.

## Notes

- The MR was rebased onto `main` on 2026-07-25 (commit `9b0384db`), removing earlier commits. Its tip is four commits: add `#title`, add a test, fix the cases from comment #8, restore labels hidden as a side effect, remove the Nightwatch test.
- `d7e538c3` removed the Nightwatch test; that is why comment #15 asks to skip tests. The test interdiff here is the replacement coverage requested in comment #20.
- The test patch applies in either order: to pristine core, or on top of the MR patch. The combined patch applies both in one pass.

## 2026-11-27 update: the MR moved

The issue owner rebased the branch onto `main` `c706424d7e` and added:

- `2b30abc36b` — regression tests in `ExposedFormTest` and `FilterNumericWebTest`. These are the same assertions the Lab proposed, placed in `ExposedFormTest` rather than the Lab's `FilterTest` + new view; the Lab's test-only interdiff is therefore **superseded upstream**.
- `12d23affb9` — proposal C folded in (`#title_display => $exposed ? 'invisible' : 'before'`). The Lab's corrective interdiff is now part of the MR.

The tables above describe the 26 July revision the Lab browsed. The current revision is the snapshot `branches/3545814-mr13201-12d23affb9.diff`.
