# #3604037: Indicate that grouping elements have child element errors

**DRAFT.** The lab measured the open review points on current `main` (`8cd44d484e3c`, 2026-10-01) on 2026-10-01/02;
a person has not reviewed the images or run the manual walkthrough. Last updated: 2026-10-14.

**This is the entry point for this issue.** It links to the patches, the recipe, the evidence and the comment
draft. Start with **Files and links** below, or `REPRODUCE.md` for the step-by-step commands.

Issue: https://www.drupal.org/project/drupal/issues/3604037
Merge request: !17078 (Needs work) · Patch tip `e8b2e166be8`
Pinned core: `c321043bb82d` (2026-09-28)
Status snapshots: [STATUS-2026-10-02.md](STATUS-2026-10-02.md) · older: [STATUS-2026-10-01.md](STATUS-2026-10-01.md)

## Summary

Reported problem: when a form has grouping elements (`<details>`, vertical tabs, the node form's sidebar) and a field
inside a **closed or inactive** group has a validation error, nothing on the group says so. A user cannot tell which
group holds the problem and has to open each one (WCAG 3.3.1 Error Identification, 1.3.1). The MR (!17078) adds
indicators in the Default Admin theme: a red border on the logical inline start, an error icon near the label's inline
end, red label text, a 1 px red border around a `<details>`, the input border colour for an active vertical tab with
errors, a visually hidden " (child error)" text on the label, and a `data-child-error-count` attribute on `<details>`.
Forced-colours mode uses `mask-image` with `canvasText`.

Open items on the issue (not decisions): RTL border position, the forced-colours icon colour, a change record, and
dark-mode contrast (split to [#3625458](https://www.drupal.org/project/drupal/issues/3625458)).

## Files and links

| What | Where |
|---|---|
| How to reproduce (commands, pinned and latest) | [REPRODUCE.md](REPRODUCE.md) |
| Patches under test | [`branches/`](branches/) (18 files) · [BRANCHES.md](BRANCHES.md) |
| Test-support patch applied to **Before** too | [branches/support-fixture-two-required-fields.patch](branches/support-fixture-two-required-fields.patch) |
| Recipe (starting state) | [`recipes/repro_3604037/`](../../../recipes/repro_3604037/) |
| Evidence index, exact commits | [EVIDENCE.md](EVIDENCE.md) |
| Measurements and images (forced colours, RTL, contrast, PHPUnit) | [EVALUATION-2026-10-01.md](EVALUATION-2026-10-01.md) |
| Scripted runs and screenshots | [`playwright/`](playwright/) |
| MR's own PHPUnit test logs | [`phpunit/`](phpunit/) |
| Core's own code checks on the patched files | [`lint/`](lint/) (not accessibility evidence) |
| Follow-up patches proposed on the MR | [`proposals/`](proposals/) |
| Draft comment (do not post) | [ISSUE-COMMENT-DRAFT.md](ISSUE-COMMENT-DRAFT.md) |
| Status snapshots | [STATUS-2026-10-02.md](STATUS-2026-10-02.md) · [STATUS-2026-10-01.md](STATUS-2026-10-01.md) |

## Sources

- https://www.drupal.org/project/drupal/issues/3604037 (2026-10-02): issue page, status **Needs work**
- https://git.drupalcode.org/project/drupal/-/merge_requests/17078 (2026-10-01): merge request !17078, tip `e8b2e166be8`, target `main`
- Related: [#3625458](https://www.drupal.org/project/drupal/issues/3625458) (dark-mode contrast), [#2915899](https://www.drupal.org/project/drupal/issues/2915899) (enable IFE in Standard, which this blocks)

## Not verified

- A real screen-reader pass; Firefox and Safari; a real Windows contrast theme.
- The interface text is English: RTL was measured with real Farsi (`/fa`) but no translations were imported.
- The MR's own PHPUnit tests with the `proposals/` patches applied.
- The manual viewer walkthrough (keyboard and focus by a person) — see STATUS-2026-10-02.md for the next steps.

## Notes

- **Before is not fully pristine by design.** The MR changes the `form_test` page (adds a second required field so its
  test can check a count of 2), so that one change is applied to Before too as `before.patches` — the only declared,
  test-support difference. Everything else in the MR patch is the code under test.
- The lab built both pairs: `3604037-pinned` and `3604037-latest`; they are registered in `tools/compare/variants.json`.
  A bundle is at `bundles/drupal-repro-3604037-2026-10-02.zip`.
- AI-assisted: measurements and images were produced by scripted runs; a person should review them before anything is
  posted. Nothing has been posted to drupal.org or GitLab.
