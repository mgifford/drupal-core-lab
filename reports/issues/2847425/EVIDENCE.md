# Evidence: #2847425 `#states` on `managed_file`

Status: **DRAFT — automated evidence only.** No person has done a keyboard or screen-reader pass on these builds.
Nothing here has been posted to drupal.org, and no branch was pushed.

Issue: https://www.drupal.org/project/drupal/issues/2847425
Merge request: [!7305](https://git.drupalcode.org/project/drupal/-/merge_requests/7305)

## In one page

The MR makes `#states` work on `managed_file` for the first time in this core generation: on load and when a
trigger changes, a conditional managed file is hidden, becomes required, or is disabled, and hiding one inside
`<details>`, a fieldset or a container no longer hides the enclosing group. That is the issue's original defect and
the MR's core contribution. The evidence below reproduces it and confirms it.

Two markup defects remain in the MR, both measurable:

1. With a file present, the whole `#states` array is copied to the hidden file-IDs input (`input[type=hidden]
   name="…[fids]"`). `required` is invalid on a hidden input, no label can reference it, and the label keeps a
   dangling `for`. This is the branch of `processManagedFile()` that the MR's own test never exercises.
2. `preprocessManagedFile()` now preserves the element's `#attributes` on the wrapper `<div>`, including
   `disabled`. The wrapper is a `<div>`; `disabled` there is invalid, does nothing, and is counted as the 45th
   disabled element by `FormTest::testDisabledElements`. The MR changes that assertion from 44 to 45 instead of
   fixing the placement.

The refinement (C) keeps the MR's behaviour and the corrective commit intact, and changes ownership:
`required`/`optional` go only to the upload control; visibility, disabled and the other states stay on the wrapper;
`disabled`, `required` and `aria-required` are removed from the wrapper's attributes. `FormTest` stays at 44. All
judged checks pass in light, dark and forced-colours Chromium.

## What was compared

| | Revision | Patch stack |
|---|---|---|
| A — Before | `0387fb948f786bc344a5cc54aa0d98b8f552e378` (the MR's merge base) | `branches/2847425-fixture-before.patch` (test support only) |
| B — current MR | `7362966e1547505d2f5d7c3ad6992d293956abf1` | `branches/mr-7305-7362966.patch` + `branches/2847425-fixture-extend.patch` |
| C — MR + refinements | same baseline | `branches/2847425-complete.patch` |

Fixture support: A and B/C serve the same form at `/file-test-states-form` with the same fields, IDs, triggers and
descriptions. The fixture carries no implementation change. A full proposal patch and a minimal interdiff are kept
side by side:

| Artifact | Against | Size | SHA-256 |
|---|---|---|---|
| `branches/2847425-complete.patch` | `0387fb948f` | 6 files, +696/−1 | `efe98ef3214d31c98e8447aa2e6b1efa4077f4b8e18ab79ea7aba11c45a5c576` |
| `branches/2847425-interdiff.patch` | `7362966e15` | 5 files, +556/−55 | `a07ab00081be8ace9a8c4e5df9a3178228d914feb1072c7b55c2ee891119722f` |

Both were checked to apply to their declared tree. The complete patch does **not** touch
`core/modules/system/tests/src/Functional/Form/FormTest.php`; the interdiff reverts the MR's 45 back to 44 there.

## Provenance

- `677d292bbe` (Andrii Sakhaniuk's earlier implementation) and `6e43afa25a8a3b71e92fc7d61ce595380310af70`
  (Alex Urevick-Ackelsberg's corrective commit) are ancestors of `7362966e15`; verified with
  `git merge-base --is-ancestor`.
- The corrective commit's two changes are kept unchanged: no `data-drupal-states` on the AJAX replacement wrapper,
  and no reassignment of `#id` to `file_managed_file`.
- The current MR tip was fetched once for this evaluation because the refs named in the task
  (`refs/review/2847425/current`, `refs/review/2847425/legacy`) were not present in `envs/core.git`. The fetched
  `11.x` branch was stored as `refs/review/2847425/current`; nothing was pushed or force-pushed.
- MR review threads could not be read: git.drupalcode.org's API returns 401 unauthenticated and the web UI serves a
  bot challenge. The public issue comments were read, including #108 (the corrective commit's own summary) and #109.

## Environment

Standard install, `admin / admin`; recipe `repro_2847425` installs `file_test_states` and `form_test`; test
extensions enabled on both sides. `envs/baseline-2847425` and `envs/issue-2847425`. PHP 8.5.7, Drupal 11.x at
`0387fb948f`, Chromium 159.0.8154.6, macOS arm64. The browser runs use the admin user, so the form is rendered by
**Default Admin**; the PHPUnit runs use `$defaultTheme = 'stark'`. That difference is deliberate and is noted where
it matters (wrapper markup, disabled-element counting).

## A → B: what the MR fixes (Chromium, light, 1280×900)

Run: `playwright/2026-11-26T22-08-01-269Z-chromium-light-1280x900/` (B). All rows below are from that run.

| Check | A | B | Verdict |
|---|---|---|---|
| Managed file whose `visible` state is false is hidden on load | no | yes | fixed |
| After checking the visibility trigger: visible one hides, hidden one shows | no | yes | fixed |
| The textfield in the details group stays visible | yes | yes | unchanged |
| Required marker **and** `required` attribute after checking the trigger | no | yes | fixed |
| Inverse `optional` state: not required on load, required when its trigger is checked | no | yes | fixed |
| The file input itself is disabled after checking the trigger | no | yes | fixed |
| Visibility trigger still controls the element after an AJAX upload | no | yes | fixed |
| The details/fieldset/container groups are never hidden as a whole | yes | yes | unchanged |
| A managed file with no states stays visible, optional, enabled | yes | yes | unchanged |
| Duplicate IDs on load | none | none | unchanged |
| Dangling `label[for]` references after a file exists | 1 | 1 | unchanged (pre-existing) |
| axe violations (elements), load / after upload | 0 / 3 | 0 / 3 | unchanged |
| JavaScript errors | 0 | 0 | unchanged |

B's two regressions are visible in the same run:

| Check | A | B |
|---|---|---|
| Non-control elements carrying `disabled` on `/form-test/disabled-elements` | `div.form-item.form-datetime-wrapper` | that div **plus** `div#edit-managed-file.js-form-managed-file` |
| `[disabled]` elements on that page (Default Admin) | 45 | **46** |
| `FormTest::testDisabledElements` expectation in code | 44 | **45** (changed by the MR) |
| The managed_file's own file input is still disabled | yes | yes |

State ownership in B:

| Element | load (no file) | file present |
|---|---|---|
| `single_required` | wrapper + upload | wrapper + **fids** |
| `combined` | wrapper + upload | wrapper + **fids** |
| `single_disabled` | wrapper + upload | wrapper + **fids** |

So with a file present, `required`, `visible` and `disabled` are all copied to the hidden fids input. `required`
and `disabled` there have no valid effect; `required` is invalid HTML for a hidden input and cannot be referenced
by the label.

## A → C: the refinement

C changes three things, each tied to a measured problem:

1. **Ownership.** `required` and `optional` are copied only to the upload control; the `fids` copy is removed. The
   wrapper keeps the remaining states. Evidence: B's ownership table above, B's required marker on the upload
   control, and the dangling `for` after upload.
2. **Wrapper attributes.** `disabled`, `required` and `aria-required` are unset in `preprocessManagedFile()` after
   `$variables['attributes'] ??= []`. The wrapper is a `<div>`; the controls (which inherit `#disabled`) keep their
   semantics. Evidence: the 45th `[disabled]` element, and `FormTest` needing 45 instead of 44.
3. **Tests.** The fixture is extended (independent visibility/requirement/disabled triggers, single and multiple
   widgets, details/fieldset/container, inverse `optional`, descriptions, a validated file) and
   `FileManagedStateTest` gets one method per behavior, real AJAX upload and removal, reacquisition after every
   replacement, and recovery from a rejected upload.

C's judged results, same checks, all as expected:

| Run | Result |
|---|---|
| `playwright/2026-11-27T00-28-29-851Z-chromium-light-1280x900/` | 27 checks, every judged row as expected |
| `playwright/2026-11-27T00-41-14-659Z-chromium-dark-1280x900/` | same, dark |
| `playwright/2026-11-27T00-41-37-182Z-chromium-light-forced-1280x900/` | same, forced colours |

C's ownership, with a file present:

| Element | load | file present |
|---|---|---|
| `single_required` | upload | upload |
| `combined` | wrapper + upload | **wrapper** |
| `single_disabled` | wrapper + upload | wrapper |

C's wrapper never carries a server-rendered `required` or `disabled`; on `/form-test/disabled-elements` only the
pre-existing datetime wrapper is a non-control with `disabled`, and the count matches A (45 in Default Admin; 44 in
`FormTest`'s Stark run). The managed_file's file input is still disabled.

## Accessibility results

On load, every managed file in the fixture has exactly one associated label, the label's `for` resolves, and every
`aria-describedby` reference on the upload control resolves to one element with text. C keeps this; B keeps it too.
The accessible name of each control comes from the field label, as the MR's test expected.

After a file exists, the label's `for` points at the upload control's old, now-unrendered ID. This is the same in A,
B and C: it is a pre-existing label-association gap, tracked by
[#3513308](https://www.drupal.org/project/drupal/issues/3513308), not introduced by the MR.

After an AJAX replacement, the new dependents do not receive the dependees' current state until a trigger changes
(core [#1091852](https://www.drupal.org/project/drupal/issues/1091852)). Consequence in the fixture:

| Moment | B | C |
|---|---|---|
| Required marker immediately after upload | absent | absent |
| Required marker after changing the trigger again | present (accidental: the hidden fids input has no ID, so `states.js` falls back to any label) | absent |
| Required marker after removing the last file and changing the trigger | present | present |

C therefore does not preserve B's accidental marker in the "file present" case. That marker was not backed by an
accessible association: the label still pointed at a missing element. The remaining behavior is a pre-existing core
AJAX limitation; fixing it is #1091852, and the association work is #3513308. This MR does not attempt either.

Keyboard and focus: the first trigger is reachable with real Tab presses (39–42 presses from the top of the admin
page, which includes the admin toolbar), with a visible 4px focus ring. Focus stays on the trigger across the
uploads and the removal; the evaluator records the active element before and after each AJAX call. No focus is moved
into the replaced element by core, and C does not change that.

axe-core (WCAG 2.0–2.2 A/AA): 0 violations on load, and 3 `color-contrast` nodes after the upload, identical in A, B
and C. They are on the status message shown after a file operation, not on the managed-file controls.

## Core regression tests (PHPUnit)

`reports/issues/2847425/tests-proposal/` holds the proposed
`core/modules/file/tests/src/FunctionalJavascript/FileManagedStateTest.php` (same file the MR adds). It replaces the
single method with nine; each reacquires elements by form-item class and control name, because element IDs get a
unique suffix when the form is rebuilt for an AJAX response.

| Side | Result | Log |
|---|---|---|
| A — pristine core + fixture | 9 tests, 66 assertions, **7 failures** (the two that pass are the label/description and invalid-upload regression guards) | `phpunit/20261127T004216Z-before.log` |
| C — complete patch | **OK, 9 tests, 148 assertions** | `phpunit/20261127T004216Z-after.log` |
| C — `FormTest::testDisabledElements` | **OK, 1 test, 61 assertions** at the unchanged 44 | `phpunit/formtest-disabled-c.log` |

The fixture is part of the complete patch, so the tests run against the same module a committer would get.

## Code checks

`node scripts/lint.mjs 2847425-pinned` runs core's `commit-code-check.sh` on the six files the complete patch
changes: CSpell, PHPStan, PHPCS, ESLint. Result **PASS**
(`lint/2026-11-26-2847425-pinned-after.md`). No `.pcss.css` file is touched, so no CSS build applies.

## Classification

Introduced by the MR:

- the hidden fids input receives the whole `#states` array (invalid `required`/`disabled` there, no association);
- the wrapper `<div>` receives `disabled`, and `FormTest`'s expectation is raised to 45 rather than the placement
  fixed.

Pre-existing, not introduced:

- the label's `for` is dangling once the upload control is not rendered;
- AJAX replacements do not re-apply states until a trigger changes.

Fixed by the MR (confirmed here): load-time hiding, conditional requirement (marker and attribute), conditional
disabled on the control, hiding inside grouping elements, and keeping unrelated controls and state-less managed
files untouched.

## Unresolved and proposed follow-ups

1. **#1091852** — re-apply states to dependents inserted by an AJAX response. The measured consequence is the
   missing required marker after upload/replacement until the next interaction. A fix belongs in `core/misc/states.js`
   (`states.Dependent`/`states.Trigger` never receive the current dependee state for an already-initialised
   trigger), with its own tests; out of scope here by the task's boundaries and because #1091852 has its own patch.
2. **#3513308** — associate the label with a rendered control when a file is present (the upload control is not
   rendered, and a hidden input is not labelable). Until then the required marker after upload has no accessible
   target.
3. **Firefox and WebKit** browser rows were not run (see below); the variant's matrix lists them so
   `scripts/coverage.mjs` reports them as gaps rather than passes.

## Not verified

- Firefox and WebKit; 480 px width.
- A real screen reader (VoiceOver/NVDA) and a person's keyboard-only pass. The lab's scripted runs are evidence, not
  a substitute per `AI-LEARNING.md` and `ACCESSIBILITY.md`.
- Stark rendering with AJAX in a browser: the Playwright runs use the admin theme; Stark is covered by PHPUnit.
- Other themes and contributed modules that alter `managed_file` preprocessing.
- Whether the behaviour holds on the current core `main` beyond `0387fb948f` (the MR's merge base).

## Reproduce

```sh
node tools/compare/setup.mjs 2847425-pinned
node scripts/lab-env.mjs start 2847425-pinned
node tools/playwright/evaluate-2847425.mjs 2847425-pinned
node tools/playwright/evaluate-2847425.mjs 2847425-pinned --scheme=dark
node tools/playwright/evaluate-2847425.mjs 2847425-pinned --forced-colors
bash reports/issues/2847425/run-regression-tests.sh both
node scripts/lint.mjs 2847425-pinned
```

## Historical material

`kit/` (2026-10-14) is kept unchanged. Its diagnostics look for `data-drupal-states` on the AJAX wrapper, which the
September corrective commit removed, and it expects the fieldset case to fail. It was therefore not used for this
comparison; `REPRODUCE.md` records why.
