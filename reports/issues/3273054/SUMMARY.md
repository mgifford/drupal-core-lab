# #3273054: Text-format permission checkboxes have a visually hidden label with a link

**DRAFT.** Scaffolded by hand (there is no issue fork and no merge request for this issue, so `scripts/new-issue.mjs --branch` could not be used). The pair has been built and run on `main`; a person has not yet reviewed the result.

**Result so far: not reproduced on `main`.** The reported link is already gone there (see *Summary*), so the run found no invisible focus stop. The anchor is still in `10.6.x` and every `11.x` branch, where the defect has not yet been measured in a browser. Detail in [EVIDENCE.md](EVIDENCE.md).

**This is the entry point for this issue.** Start with *Files and links* below, or `REPRODUCE.md` for the step-by-step commands.

Issue: https://www.drupal.org/project/drupal/issues/3273054
Status snapshot: [STATUS.md](STATUS.md)

## Summary

Reported problem: on `/admin/people/permissions`, each text-format permission checkbox is rendered with a `visually-hidden` label. When the permission title contained a link to the format, every checkbox gained an extra focusable stop inside its hidden label. Tabbing through the Filter module section therefore stopped once with no visible focus outline, breaking WCAG 2.1 SC 2.4.7 (Focus Visible) and WCAG 2.2 SC 2.4.11 (Focus Not Obscured is unaffected; the stop is invisible, not obscured).

The link came from `FilterPermissions::permissions()`:

    'title' => $this->t('Use the <a href=":url">@label</a> text format', [...])

`UserPermissionsForm` puts that title into `#title` with `#title_display: invisible`, which renders `<label class="visually-hidden">`.

**Reconnaissance before building (2026-10-15):**

- No issue fork and no merge request exist for #3273054. The lab's normal entry point needs a branch, so the fix is authored in the lab (`docs/NEW-ISSUE.md` §4d, `after.authoring: true` → `scripts/capture-patch.mjs`).
- The link is **already gone from core `main`**. Commit `12b38bdace` (*"task: #3619751 Remove links from filter permission descriptions"*, Dave Long / longwave) removed it for a performance reason: generating the link rebuilt the router on every install, costing about 500 ms. It ships in 12.0.0-alpha1.
- The link is **still present in every `11.x` branch and in `10.6.x`** (`11.5.x`, `11.4.x`, `11.3.x`, `11.2.x`, `10.6.x` all checked). So the accessibility defect is real on the supported branches but not on `main`.
- A replay of the page on `main` (`tools/playwright/evaluate-3273054.mjs`) confirmed `not-reproduced`: the filter left 5 of 102 rows visible, the walk covered the text-format rows (8 of 12 stops), 12 text-format labels, all `visually-hidden`, none containing a link; 0 invisible keyboard stops; 0 axe violations.

## Files and links

| Path | What |
|---|---|
| [REPRODUCE.md](REPRODUCE.md) | How to reproduce, pinned and on latest core, and what each outcome means. |
| [EVIDENCE.md](EVIDENCE.md) | Results with exact commits. DRAFT until a person has reviewed it. |
| [STATUS.md](STATUS.md) | Current status snapshot and related issues. Re-check on drupal.org. |
| [BRANCHES.md](BRANCHES.md) | Why there is no patch yet, and how the lab-authored patch will be recorded. |
| [ISSUE-COMMENT-DRAFT.md](ISSUE-COMMENT-DRAFT.md) | A draft for a human to review and post. Nothing is posted automatically. |
| `recipes/repro_3273054/recipe.yml` | Starting state: a plain Standard install. |
| `tools/compare/variants.json` | `3273054-pinned` and `3273054-latest`. |

## Sources

- https://www.drupal.org/project/drupal/issues/3273054 (2022-04-01): issue summary, 7 comments, no patch, no fork, no merge request.
- https://www.drupal.org/project/drupal/issues/3163810: parent issue (WCAG 2.4.7 focus visible).
- https://www.drupal.org/project/drupal/issues/3619751: *"Remove links from filter permission descriptions"*, fixed on `main`; not in 11.x.

## Not verified

- No human keyboard pass, no screen-reader pass, no forced-colours or dark run: only the chromium/light/1280x900
  replay has been done, and only on `main`.
- The invisible stop has **not** been measured in a browser on any `11.x` or `10.6.x` branch. The claim that the
  defect is still there rests on a source read (the anchor is in `FilterPermissions.php`), not a lab run.
- Automated results do not replace a person's keyboard pass. This issue is about focus visibility, which is a
  person's call.
