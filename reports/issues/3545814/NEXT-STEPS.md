# What remains to finish #3545814

## Decision needed: visible or hidden `Value` label?

The Lab records the MR as fixing the names but adding a visible `Value` label (+18 px). Proposal C keeps the name and hides the label. Both are verified; the choice is the author's.

- **A. Fold C into !13201 (recommended).** The issue summary and the MR comment both say hide the label; one line; five environments recorded. Ask with `ISSUE-COMMENT-DECISION.md`, then add the commit to the MR branch (needs the owner's approval).
- **B. Keep the visible label.** Defensible as a UX improvement, but the issue's "User interface changes" and the manual-test note must be updated, and reviewers must accept the 18 px change.

Do not open a separate follow-up issue for one line. Do not post either draft without the owner's approval.


**DRAFT.** Written 2026-11-27 after the host ran out of capacity for another DDEV start. Nothing here is a substitute for the recorded evidence; it is the short list of what the evidence still lacks.

## Proposal C: recorded 2026-11-27

Proposal C was built and run in a quiet window (the corrected patch, sha256 `7aed4387…`): variant `3545814-proposal-c`, five runs (Chromium light, dark, forced colours, 480 px; WebKit light) at 1280×900 except the 480 px row. The numeric label renders `visually-hidden` with accessible name `Value`, axe reports 0, the numeric fieldset is 353×238 (the same as Before; the MR alone is 353×256), the filter configuration form is unchanged, and everything else matches the MR run. See [EVIDENCE.md](EVIDENCE.md) and [`playwright/2026-11-27T16-41-46-552Z-chromium-light-1280x900/`](playwright/2026-11-27T16-41-46-552Z-chromium-light-1280x900/SUMMARY.md).

## Remaining checks

- Repeat the proposal C matrix rows (dark, forced colours, narrow, WebKit): the C variant has only the Chromium light run.
- Firefox has no run on this host: the launch/page crash is recorded as blocked, not a pass.
- Wider related test classes on both sides: `core/modules/views/tests/src/Functional/Plugin/ExposedFormTest.php`, `.../ExposedFormCheckboxesTest.php` and `core/modules/views_ui/tests/src/Functional/ExposedFormUITest.php`. Run them with `node scripts/try-tests.mjs 3545814-pinned reports/issues/3545814/tests-proposal --existing core/modules/views/tests/src/Functional/Plugin/ExposedFormTest.php core/modules/views/tests/src/Functional/Plugin/ExposedFormCheckboxesTest.php core/modules/views_ui/tests/src/Functional/ExposedFormUITest.php` once both sites are healthy.
- Synthetic Guidepup/tree-diff speech: not produced (needs both sites running).
- A real screen reader and a person's keyboard pass (`TESTING-CHECKLIST.md`).

## Downloads that make the matrix reproducible

The lab's resolved Playwright revision needs its own browsers (the cache had a different revision):

```bash
cd tools/playwright
node node_modules/playwright/cli.js install chromium webkit firefox
```

Chromium 1252, WebKit 2386 and Firefox 1569 were installed this session. Firefox still crashes on every new page on this macOS 27 host ("Target crashed"); record it as blocked, not as a pass.

## Checks not run here

- The wider related test classes on both sides: `core/modules/views/tests/src/Functional/Plugin/ExposedFormTest.php`, `.../ExposedFormCheckboxesTest.php` and `core/modules/views_ui/tests/src/Functional/ExposedFormUITest.php`. Run them with `node scripts/try-tests.mjs 3545814-pinned reports/issues/3545814/tests-proposal --existing core/modules/views/tests/src/Functional/Plugin/ExposedFormTest.php core/modules/views/tests/src/Functional/Plugin/ExposedFormCheckboxesTest.php core/modules/views_ui/tests/src/Functional/ExposedFormUITest.php` once both sites are healthy.

- `node scripts/lint.mjs 3545814-pinned` — the same PHPCS and PHPStan were run directly and pass; the script also runs JS/CSS checks, which this change does not touch.
- `node tools/playwright/tree-diff.mjs 3545814-pinned` and `screenreader.mjs` — need both sites. The evaluator already records the accessibility snapshot of each control; the tree diff would add whole-page ARIA and synthetic speech.
- A real screen reader and a person's keyboard pass (`TESTING-CHECKLIST.md`).

## Second pass (2026-11-27)

A second agent re-checked the MR snapshot, the test interdiff and the patch stacks, and captured the rendered DOM, computed names, axe, keyboard and submissions independently; see the Independent verification section of [EVIDENCE.md](EVIDENCE.md) and `verification/`. It also corrected the proposal C draft from `NULL` to `'before'`.

## Then, and only then

The issue can be proposed as **Needs review** (MR + C + tests). RTBC still requires a clean CI run on the published revision and independent human review. Nothing is posted to drupal.org by the Lab.
