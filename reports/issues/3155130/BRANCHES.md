# Patches for #3155130

## Historical core evaluation (2026-11-06) — unchanged

There is no merge request. Both patches are from comment #6 (nod_, 2020-06-26) or derived from it.

| Patch | Source | Base | Notes |
|---|---|---|---|
| [`branches/core-summary-a11y-3155130-6.patch`](branches/core-summary-a11y-3155130-6.patch) | https://www.drupal.org/files/issues/2020-06-26/core-summary-a11y-3155130-6.patch (comment #6) | Drupal 9.1 era | Original. Does not apply to current core (files moved; `text_with_summary` removed 2026-09-02). Kept for reference, not applied. Its author notes it changes the summary field's `name`. |
| [`branches/3155130-ported-f48d0a58.patch`](branches/3155130-ported-f48d0a58.patch) | Written in the lab on 2026-11-05 from the original's intent | core `f48d0a58b3ec0395f486f1987a28811ab6ee5936` (2026-08-31) | `<details>` around the summary field and deletion of `core/modules/text/js/text.js`. Applies cleanly at that commit. Not an MR. |

These two files are preserved byte for byte. The historical run folders (`compare/3155130-pinned/`, `tree-diff/3155130-pinned/`, `playwright/2026-11-06T03-46-30-534Z/`) are unchanged; the old write-up is copied to [EVIDENCE-2026-11-06-historical.md](EVIDENCE-2026-11-06-historical.md).

## Contributed module proposal (2026-11-25) — new

The field type, widget and `js/text.js` moved to the contributed **Text With Summary** project. No merge request exists; these are local proposals against the contributed `2.0.x` branch. The verified checkout is `~/text-with-summary-review`, branch `3155130-persistent-disclosure`: commit `3f6854c` (implementation) and `4e70269` (tests), both on top of `89c4282`.

| Patch | What it changes | Base | SHA-256 |
|---|---|---|---|
| [`branches/3155130-persistent-disclosure.patch`](branches/3155130-persistent-disclosure.patch) | **Implementation.** `js/text.js` (persistent disclosure, ARIA state, context names, focus retention, error expansion, override-preserving re-theme) and the widget's library attachment for every summary textarea. No Form API value container, no input-name change. | `drupal/text_with_summary` `2.0.x` `89c4282cf25259564ce7fa41b9dd70f7fe7f496d` | `c5fbd3e282dda8aba77567e7e58efc980da401ec3bcab3481f493795d09bf1c5` |
| [`branches/3155130-persistent-disclosure-tests.patch`](branches/3155130-persistent-disclosure-tests.patch) | **Regression tests.** Extends `tests/src/FunctionalJavascript/TextareaWithSummaryTest.php` (10 tests) and adds a test-only form validator to `tests/modules/text_summary_test/` for an empty-summary validation error. Test support only; not part of the implementation. | same commit | `6e23a1f685ec6c053eafa93410c647d59a1b7f05552cd47fc710e19827a25cd4` |

Apply them, in order, from the module root:

```sh
git apply reports/issues/3155130/branches/3155130-persistent-disclosure.patch
git apply reports/issues/3155130/branches/3155130-persistent-disclosure-tests.patch
```

The Lab registers both on the After side of variant `3155130-contrib` (`reports/issues/3155130/variants.json`), so `tools/compare/setup.mjs` applies and verifies them. The Before side is the pristine module at `89c4282`.

### Why two patches

The implementation patch is the change under test and the only patch a maintainer needs to review behaviour. The test patch is the regression test proposal; for the fail-before/pass-after run it is applied to **both** environments as test support (the same test file runs against the old and new `js/text.js`). It is not needed to reproduce the UI.

### What is deliberately not in the patches

- No new Form API container, no `#parents` change, no summary `name` change. The name is still `field_body[0][summary]`; see the persistence test.
- No change to `Drupal.theme.textEditSummaryButton()` and no new CSS, icon, chevron or card.
- No change to required-summary or "always show the summary" behaviour: those widgets still do not get a disclosure; the library is attached only to add hidden field/item context to the summary's existing label.
