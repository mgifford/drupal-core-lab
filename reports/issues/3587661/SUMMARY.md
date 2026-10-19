# #3587661: Missing labels in "Limited files with a single pre-existing value (required) field."

**DRAFT.** Scripted browser runs (Default Admin and Claro), PHPUnit and PHPCS were run by the lab on 2026-10-19 on core `11.x`
`21e0dcba`, whose three files involved are identical to `main` `a50836d`. No person has done the keyboard or screen reader pass.
Last updated: 2026-10-19.

**This is the entry point for this issue.** It links to the patches, the recipe, the evidence and the comment draft.

Issue: https://www.drupal.org/project/drupal/issues/3587661 (Needs work; tags Accessibility, theming tools, Needs steps to reproduce)
Merge request: !16335, branch `3587661-missing-labels-in` (head commit not read; see [BRANCHES.md](BRANCHES.md))
Pinned core: `main` at `a50836dbcfe00d292a6c2960f5002ad482395d21` (2026-10-19)

## Summary

The problem: a file field that allows more than one value, with "Enable Display field" on, lists uploaded files in a table on the
node form. The checkbox in its "Display" column has no label and no accessible name, so a screen reader says only "checkbox". axe
reports the `label` rule. `FileThemeHooks::preprocessFileWidgetMultiple()` removes the checkbox's `#title` ("Include file in display")
before putting it in the table. A field that allows one value has no table and keeps its visible label. "Required" makes no
difference, and no contributed module is needed.

What the reviewer asked (smustgrave, #13 and #15): clearer steps to reproduce, whether it is the node form or the front end, whether
"required" matters, and test coverage, perhaps by expanding an existing test. Another developer asked the owner for concrete steps,
and suggested moving it forward as a small MR.

What the lab found:

- **Steps to reproduce**: [REPRODUCE.md](REPRODUCE.md). It is the node form, it needs more than one allowed value and the Display
  field, and "required" does not matter.
- **MR !16335** (an `aria-label` in `FileWidget::process()`) gives the checkbox its name, and axe reports nothing, in Default Admin and
  Claro. It has no test. It also adds the `aria-label` to the single-value checkbox, which already has a visible label with the
  same text.
- **Proposal** (one line, [proposals/3587661-visually-hidden-label.patch](proposals/3587661-visually-hidden-label.patch)): hide the
  label visually (`#title_display = 'invisible'`) instead of removing it. Same result in both themes, with a real `<label>`, and the
  single-value field does not change. The table's weight select already uses this pattern.
- **Test** ([proposals/3587661-test.patch](proposals/3587661-test.patch)): three assertions added to
  `FileFieldDisplayTest::testDefaultFileFieldDisplay()`. It fails without the fix and passes with the proposal (whole class: 4
  tests, 74 assertions). PHPCS is clean.

## Files and links

| What | Where |
|---|---|
| How to reproduce (core only, and with the lab) | [REPRODUCE.md](REPRODUCE.md) |
| The MR as tested | [branches/3587661-mr-16335.patch](branches/3587661-mr-16335.patch) · [BRANCHES.md](BRANCHES.md) |
| The lab's proposal and test | [proposals/3587661-visually-hidden-label.patch](proposals/3587661-visually-hidden-label.patch) · [proposals/3587661-test.patch](proposals/3587661-test.patch) |
| Recipe (three file fields on Article) | [`recipes/repro_3587661/`](../../../recipes/repro_3587661/recipe.yml) |
| Variants (pinned, latest, proposal) | [variants.json](variants.json) |
| Evidence: commits, runs, PHPUnit, PHPCS, what was not verified | [EVIDENCE.md](EVIDENCE.md) |
| Browser runs (one folder per theme and side) | [playwright/](playwright/) |
| Comment draft for drupal.org (not posted) | [ISSUE-COMMENT-DRAFT.md](ISSUE-COMMENT-DRAFT.md) |
| The script behind the browser runs | [`tools/playwright/label-3587661.mjs`](../../../tools/playwright/label-3587661.mjs) |

## Before anyone posts

- Read the issue and the MR again. They were read only from the owner's pasted copies: drupal.org and git.drupalcode.org were not
  reachable from the session. Run `node scripts/issue-intake.mjs fetch 3587661` when they are. Read the related issue #3587214
  ("Checkbox missing label"), which the lab has not read.
- Do a keyboard pass and listen with a screen reader on the node form, with a file uploaded to a two-value field.
- Decide which approach to put forward: the MR's `aria-label` with a test for it, or the proposal with its test. Opening a new merge
  request, or pushing to the issue fork, is the owner's step.
