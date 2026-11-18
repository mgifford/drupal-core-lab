# #3604037: Indicate that grouping elements have child element errors

**DRAFT.** The current lab port applies to core `29b0a0b2256e`. Targeted After tests and core lint pass, and an automated
Before/After browser evaluation is recorded. That evaluation reports six light-mode hover text contrast checks below
4.5:1. Human review remains outstanding. Historical measurements below predate this port. Last updated: 2026-11-17.

**This is the entry point for this issue.** It links to the patches, the recipe, the evidence and the comment
draft. Start with **Files and links** below, or `REPRODUCE.md` for the step-by-step commands.

Issue: https://www.drupal.org/project/drupal/issues/3604037
Merge request: !17078 (Needs work) · refreshed tip `c3c52b00`
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

For `3604037-latest`, the lab uses a port of MR !17078 tip `c3c52b00` onto core `29b0a0b2256e`. It addresses the defects
listed in mherchel's Comment #61; it is not the upstream MR patch. Patch application and targeted tests are verified. See
[`BRANCHES.md`](BRANCHES.md) for provenance and [`EVIDENCE.md`](EVIDENCE.md) for what remains untested.

## Files and links

| What | Where |
|---|---|
| How to reproduce (commands, pinned and latest) | [REPRODUCE.md](REPRODUCE.md) |
| Patches under test | [Upstream MR patch](branches/3604037-grouping-elements-child-errors-default-admin.patch) · [Comment #61 current-main port](branches/3604037-comment61-current-main.patch) · [BRANCHES.md](BRANCHES.md) |
| Test-support patches applied to both sides | [two required fields](branches/support-fixture-two-required-fields.patch) · [multiple vertical-tab errors](branches/support-fixture-multiple-vertical-tab-errors.patch) |
| Recipe (starting state) | [`recipes/repro_3604037/`](../../../recipes/repro_3604037/) |
| Evidence index, exact commits | [EVIDENCE.md](EVIDENCE.md) |
| Current automated evaluation | [Playwright evaluation](playwright/2026-11-17T23-46-32-155Z-evaluate/SUMMARY.md) |
| Historical measurements and images (old patch only) | [EVALUATION-2026-10-01.md](EVALUATION-2026-10-01.md) |
| Historical scripted runs and screenshots (old patch only) | [`playwright/`](playwright/) |
| Historical MR PHPUnit test logs (old patch only) | [`phpunit/`](phpunit/) |
| Historical core code checks (old patch only) | [`lint/`](lint/) (not accessibility evidence) |
| Follow-up patches proposed on the MR | [`proposals/`](proposals/) |
| Draft comment (do not post) | [ISSUE-COMMENT-DRAFT.md](ISSUE-COMMENT-DRAFT.md) |
| Status snapshots | [STATUS-2026-11-17.md](STATUS-2026-11-17.md) · [STATUS-2026-10-02.md](STATUS-2026-10-02.md) · [STATUS-2026-10-01.md](STATUS-2026-10-01.md) |

## Sources

- https://www.drupal.org/project/drupal/issues/3604037 (intake refreshed 2026-11-17): issue page, status **Needs work**
- https://git.drupalcode.org/project/drupal/-/merge_requests/17078 (intake refreshed 2026-11-17): merge request !17078, tip `c3c52b00`, target `main`
- `branches/3604037-comment61-current-main.patch`: lab port of that tip onto core `29b0a0b2256e`; hash recorded in [BRANCHES.md](BRANCHES.md)
- Related: [#3625458](https://www.drupal.org/project/drupal/issues/3625458) (dark-mode contrast), [#2915899](https://www.drupal.org/project/drupal/issues/2915899) (enable IFE in Standard, which this blocks)

## Not verified

- Human keyboard and real screen-reader review, Firefox/Safari, real Windows forced colours, and the 480px cross-browser matrix.
- Whether the six automated light-mode hover contrast failures also occur on the baseline and how they relate to this port.
- The interface text is English; historical RTL measurements used Farsi without importing translations.
- The historical screenshots and test logs below do not verify the current port.

## Notes

- **Before is not fully pristine by design.** Test-support patches add a second required field and enable errors in
  multiple vertical tabs. They are applied to both sides; see `tools/compare/variants.json`.
- The pinned build and historical bundle use older core and patches. The current latest DDEV pair has been built.
- AI-assisted: measurements and images were produced by scripted runs; a person should review them before anything is
  posted. Nothing has been posted to drupal.org or GitLab.
