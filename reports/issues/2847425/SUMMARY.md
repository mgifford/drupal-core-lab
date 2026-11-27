# #2847425: conditional visibility and requirement of managed file elements

**DRAFT.** Automated evidence only: no person has done a keyboard or screen-reader pass on these builds.
Nothing was posted to drupal.org, no branch was pushed, and the issue status was not changed.

- Issue: https://www.drupal.org/project/drupal/issues/2847425
- Merge request: [!7305](https://git.drupalcode.org/project/drupal/-/merge_requests/7305), branch `11.x`, tip
  `7362966e1547505d2f5d7c3ad6992d293956abf1`
- Evaluated on: `0387fb948f786bc344a5cc54aa0d98b8f552e378` (the MR's merge base), Standard install,
  `envs/baseline-2847425` and `envs/issue-2847425`

## The problem

`#states` on a `managed_file` element did not hide the element, make it required, or disable it, and hiding one
inside `<details>` or a fieldset could collapse the enclosing group. The same markup on a plain `file` element works.
For a required upload the failure is a WCAG 3.3.1 problem: the field is not identified as required, and the marker
is not tied to the control.

## What the MR does, confirmed

On load and whenever a trigger changes, the current MR gives the element the right state: hidden when its `visible`
condition is false, required (marker on the label, `required` attribute on the file input), disabled (the file input
and buttons, not only the wrapper), and the enclosing details, fieldset or container keeps its other children. State
ownership is on the wrapper inside the form item, so hiding no longer reaches the group. Alex Urevick-Ackelsberg's
September corrections are kept unchanged.

## Two measured defects in the MR

1. **The hidden file-IDs input receives the whole `#states` array** when a file is present (`required` and
   `disabled` on `input[type=hidden]`). `required` is invalid there and no label can reference it; the label's `for`
   still points at the upload control, which is not rendered. This is the branch the MR's test never runs.
2. **The wrapper `<div>` receives `disabled`** through the new attribute preservation. It is invalid on a `<div>`,
   does nothing, and is counted as the 45th disabled element by `FormTest::testDisabledElements`. The MR changes
   that assertion from 44 to 45 instead of fixing the placement.

On `/form-test/disabled-elements` in Default Admin the MR adds a non-control `div#edit-managed-file` with
`disabled`; the managed file's own file input is already disabled, so the control semantics do not need it.

## The refinement (C)

Keeps the MR's behaviour and changes three things:

- `required` and `optional` are copied only to the upload control; the hidden `fids` copy is removed;
- the wrapper keeps visibility, disabled and the other states; `disabled`, `required` and `aria-required` are
  removed from its attributes;
- `FormTest` stays at 44, unchanged from core.

All judged checks pass in Chromium light, dark and forced colours, and in the extended PHPUnit suite. The complete
patch and the interdiff against the MR tip are listed below.

## Results

| | A: pristine core | B: current MR | C: MR + refinement |
|---|---|---|---|
| Hidden on load when `visible` is false | no | yes | yes |
| Required marker + `required` on the control | no | yes | yes |
| File input disabled (not only the wrapper) | no | yes | yes |
| Groups (details/fieldset/container) not collapsed | yes | yes | yes |
| State-less managed files untouched | yes | yes | yes |
| Non-control element with `disabled` on the FormTest page | pre-existing datetime only | **+ `div#edit-managed-file`** | pre-existing datetime only |
| `[disabled]` count, Default Admin / `FormTest` Stark | 45 / 44 | **46 / 45** | 45 / **44** |
| Extended `FileManagedStateTest` | **7 of 9 methods fail** | not re-run with the final suite (its markup defects are in the rows above) | **OK, 9 tests, 148 assertions** |
| `FormTest::testDisabledElements` | passes | passes only with the changed 45 | **OK, 61 assertions** |
| Core code checks (CSpell, PHPStan, PHPCS, ESLint) | — | — | **PASS** |

Accessibility details (labels, accessible names, descriptions, focus, axe, limitations):

- On load, every managed file has one associated label, the label's `for` resolves, and every `aria-describedby`
  reference resolves to text. After a file exists the label's `for` is dangling in A, B and C; that is a pre-existing
  gap tracked by [#3513308](https://www.drupal.org/project/drupal/issues/3513308).
- After an AJAX replacement, states are not re-applied until a trigger changes
  ([#1091852](https://www.drupal.org/project/drupal/issues/1091852)). B showed the required marker again after a
  trigger change only because the hidden fids input has no ID and `states.js` falls back to any label; that marker had
  no accessible association. C does not keep that accident. Not fixed here: it is outside this issue's scope.
- Keyboard: the first trigger is reached with real Tab presses and a visible 4px focus ring; focus stays on the
  trigger through upload and removal.
- axe-core WCAG 2.0–2.2 A/AA: 0 violations on load; 3 `color-contrast` nodes after an upload, the same in A, B and C,
  on the status message rather than the managed-file controls.

## Artifacts

| | |
|---|---|
| Full proposal patch against `0387fb948f` | [branches/2847425-complete.patch](branches/2847425-complete.patch) (6 files, +696/−1, sha256 `efe98ef3…`) |
| Interdiff against MR `7362966e15` | [branches/2847425-interdiff.patch](branches/2847425-interdiff.patch) (5 files, +556/−55, sha256 `a07ab000…`) |
| Current MR patch, pinned | [branches/mr-7305-7362966.patch](branches/mr-7305-7362966.patch) |
| Extended Core test | [tests-proposal/](tests-proposal/) |
| Playwright evaluator | [tools/playwright/evaluate-2847425.mjs](../../../tools/playwright/evaluate-2847425.mjs) |
| Evidence runs (light, dark, forced colours) | [playwright/](playwright/) |
| PHPUnit logs and FormTest | [phpunit/](phpunit/) |
| Lint report | [lint/](lint/) |
| Reproduction steps | [REPRODUCE.md](REPRODUCE.md) |
| Full evidence and method | [EVIDENCE.md](EVIDENCE.md) |
| Patch provenance | [BRANCHES.md](BRANCHES.md) |

## Not verified

Firefox and WebKit; 480 px width; Stark in a browser after AJAX (Stark is covered by PHPUnit); a real screen reader
(VoiceOver/NVDA); a person's keyboard-only pass; themes or contributed modules that alter `managed_file`
preprocessing; current core `main` beyond the MR's merge base.

## History in this folder

The `kit/` directory (2026-10-14) is kept unchanged as historical material. Its diagnostics look for
`data-drupal-states` on the AJAX wrapper, which the September corrective commit removed, and it expects the fieldset
case to fail, so it was not used for this comparison. The earlier `STATUS-2026-10-19.md` snapshot is kept.

Generated with the help of an LLM.
