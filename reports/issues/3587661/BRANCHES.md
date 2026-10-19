# Branches and patches for #3587661

| Patch | Source | Tip | What | sha256 |
|---|---|---|---|---|
| [`branches/3587661-mr-16335.patch`](branches/3587661-mr-16335.patch) | MR !16335 (branch `3587661-missing-labels-in`), its `.diff` as the owner pasted it on 2026-10-19 | - (not read: git.drupalcode.org was not reachable from the session) | `aria-label` "Include file in display" on the display checkbox in `FileWidget::process()` | `77c4a8a5` |
| [`proposals/3587661-visually-hidden-label.patch`](proposals/3587661-visually-hidden-label.patch) | the lab, 2026-10-19 | - | In `FileThemeHooks::preprocessFileWidgetMultiple()`, `#title_display = 'invisible'` instead of `unset(#title)` | `403fe6ce` |
| [`proposals/3587661-test.patch`](proposals/3587661-test.patch) | the lab, 2026-10-19 | - | Three assertions in `FileFieldDisplayTest::testDefaultFileFieldDisplay()`: the display checkbox has a `<label>`, its text, and the `visually-hidden` class | `218242a2` |

The MR head commit the diff came from is not known. The issue page, as pasted, lists one commit on the MR branch, added on
2026-08-18; before anyone relies on these results, compare the MR's current diff with the patch above.

The MR's diff was made against `FileWidget.php` blob `bd409e434d3a`, which is the file on `main` at `a50836d` and on `11.x` at
`21e0dcba`. `FileThemeHooks.php` (`7a16d1ecd6c6`) and `FileFieldDisplayTest.php` (`1f541c6d98cc`) are also the same on both.
The MR has no test: comment #10 mentions one, but the diff changes `FileWidget.php` only.
