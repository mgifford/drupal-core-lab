# #2942404: System messages should be accessible

**DRAFT, AI-assisted; investigation only.** No run has been made. The findings below come from reading the issue and current core source on 2026-11-19.

Issue: https://www.drupal.org/project/drupal/issues/2942404
Selected base: `66a4c78b453be62c644f7a438dd4c5190b027c59`. Prepared: 2026-11-19.
Fork branch: 2942404-11.

## Barrier, task and expected outcome

The issue (opened 2018) reports that system messages are wrapped in `role="contentinfo"`, a landmark meant for page-level footer information, and asks for `role="status"` (status, warning) and `role="alert"` (error) instead. The implementation prompt in [IMPLEMENTATION-PROMPT.md](IMPLEMENTATION-PROMPT.md) adds open questions: are full-page, AJAX and BigPipe messages announced consistently, and can `Drupal.Message` plus `Drupal.announce()` announce twice on top of live-region roles. Those are investigation targets, not confirmed defects.

## What current core already does (read from `main` at `92e5c3a30476`, not run)

- `core/modules/system/templates/status-messages.html.twig` already uses `role="alert"` for error and warning and `role="status"` for other types, with no `contentinfo`. Its comment says this matches `Drupal.theme.message()`. Related [#3587678](https://www.drupal.org/i/3587678) (closed, fixed 2026-08-25) made the landmarks unique.
- Claro's `status-messages.html.twig` no longer exists on `main`; `default_admin`, `starterkit_theme`, Umami and the `test_messages` test theme each have their own copy.
- `core/misc/announce.js` keeps one polite live region (`#drupal-live-announce`); `core/misc/message.js` calls `Drupal.announce()` from `Drupal.Message.add()` unless `options.announce` is an empty string.

## The merge requests are stale (two of them)

The issue has two open MRs with the same core change, [!6058](https://git.drupalcode.org/project/drupal/-/merge_requests/6058) and !6112 below. Evaluation, interdiffs between them and to current `main`, and the per-file result are in [MR-EVALUATION.md](MR-EVALUATION.md): both are superseded by what `main` already has, and no aligning patch is needed.

### !6112

[!6112](https://git.drupalcode.org/project/drupal/-/merge_requests/6112) (branch `2942404-11`, base `66a4c78b453b`, 2024-02-01) changes 12 files. Against `main`, 3 of 12 file patches apply (`BigPipeTest.php`, `AjaxFormPageCacheTest.php`, `ElementValidationTest.php`); the templates, the Claro and stable9 files and the other tests do not. The template change it proposes is largely already in `main`. Do not reroll it before deciding what, if anything, remains.

## People affected and evidence basis

Record the task consequence, relevant interaction methods, workaround and its cost.
Distinguish user testimony, evaluation with disabled participants, manual inspection, tool output and inference.
State uncertainty; do not infer diagnoses or claim participant testing that did not occur.
These details have not been assessed by this generation step. Preserve credible reports while investigating missing evidence.

## Reproduction and comparison

Registered variants: `2942404-pinned` (old core `66a4c78b453b`, Before pristine, After plus the MR as submitted) and `2942404-latest` (inherits the MR, which does not apply to `main`, so it cannot be built until a patch exists). Neither has been built or run. See [REPRODUCE.md](REPRODUCE.md). The pinned pair shows only what the MR meant; it says nothing about current core.

Decision needed before building: the useful comparison for current core is probably "main as it is" with the scenarios of the prompt (A to F) observed on one side, plus a change only if a defect is found. The lab needs a patch on After to compare, so a defect (for example a duplicate announcement) must be shown first.

## Evidence and readiness

Status: **not tested**. Assessment so far (reading only): the original defect (`contentinfo`) appears already fixed on `main`; the questions about announcement timing, duplication, BigPipe and theme consistency are open and untested. Nothing here establishes conformance.

## Sources

- Issue: https://www.drupal.org/project/drupal/issues/2942404 (98 comments fetched 2026-11-19; [intake/BRIEF.md](intake/BRIEF.md)). Review threads of !6112 could not be read (HTTP 401); 41 attachments exist, 30 listed.
- Related: [#3587678](https://www.drupal.org/i/3587678) (unique landmarks, closed fixed), [#3159933](https://www.drupal.org/i/3159933) (Claro theme-install message, open), [#2893640](https://www.drupal.org/i/2893640) (parent: modernize ARIA usage, open), [#3437924](https://www.drupal.org/i/3437924) (additional colored notices, open).

## Not verified and next actions

- Nothing has been run: no scenario A to F, no Playwright live-region capture, no axe-core scan, no screen reader.
- Not read: the full comment history for maintainer objections and unresolved test failures; the MR review threads (HTTP 401).
- Next (owner: the contributor): (1) read comments #60 onward and #3587678 and say whether #2942404 is still actionable or should be closed or split; (2) build a plain main environment and capture the live regions for scenarios A to F; (3) only if a defect shows up, write the smallest patch in the lab. Nothing has been posted to drupal.org.

## Acceptance and verification

Define observable user outcomes. Record which checks are planned, completed, blocked or unnecessary and why.
Repeat the original interaction in the relevant environment and assess adjacent states and regressions.
Record separately whether evaluation with disabled people is required, with the rationale and limitations.
WCAG mapping, suspected cause, severity and priority are optional assessments supported by evidence.
Keep severity (task impact) separate from priority (when to act).



## Reporting guidance

Adapted for Lab issue evaluation from
[Accessibility Bug Reporting Best Practices](https://github.com/mgifford/ACCESSIBILITY.md/blob/main/examples/ACCESSIBILITY_BUG_REPORTING_BEST_PRACTICES.md).
Use relevant environment details, redact private content and credentials, and describe visual evidence in text.
