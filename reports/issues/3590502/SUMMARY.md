# #3590502: Move local tasks out of the More actions menu into the content header

**DRAFT.** Automated reproduction completed in Chromium. Person-led keyboard,
screen-reader and forced-colours review remain open.

Issue: https://www.drupal.org/project/drupal/issues/3590502
Pinned base: `eef285cd039d513938cf006bdc3cb931433ac437`.
Current-main run: core `97c6ff8b2534b242c0f1df3e4ba2493e56aebcec`.
Prepared and automated run: 2026-11-23.
MR: !17640, branch `3590502-move-local-tasks`, head
`091a0f3c99f196e8959a0c8a8c11cd9b8f4e54d9`.

## Barrier, task and expected outcome

On admin-themed entity pages, Navigation removes View/Edit local tasks and moves
them into the top bar. This obscures the current task and adds an extra interaction
for a normal entity route. The proposed outcome is to keep those tasks in the
content header and out of Navigation's More actions menu.

## People affected and evidence basis

The issue supplies maintainer and contributor reports about cognitive load and
unpredictable placement. The lab has automated DOM, keyboard-replay, screenshot and
axe evidence only. No disabled participant or real assistive-technology evaluation
was performed.

## Reproduction and comparison

Use registered variant `3590502-latest`. Both sides run the same current core and
Standard-install recipe. Before has no patch; After applies only
`branches/3590502-move-local-tasks.patch`. The pinned variant uses MR base
`eef285cd039d`. See `REPRODUCE.md` for `/user/1/edit`, `/user/1`, checks and
person-led steps.

## Evidence and readiness

**Reproduced and fixed in the narrow automated scenario.** The 2026-11-23
Playwright run found no primary local tasks Before and both View/Edit After.
Before reached View through More actions; After reached it as a direct local task.
Both sides had zero axe violations and zero JavaScript errors on the two tested
routes. The same movement passed in emulated forced colours and at 480px.
Evidence: `playwright/2026-11-23T23-46-00-146Z-chromium-light-1280x900/` and
the two 2026-11-24 runs in `playwright/`.

## Sources

- Issue intake: `intake/BRIEF.md`, fetched 2026-11-23.
- MR patch: !17640, extracted from branch
  `3590502-move-local-tasks` at `091a0f3c99f1`.
- Evidence: `EVIDENCE.md` and the dated Playwright run.



## Not verified and next actions

- No person-led keyboard or real screen-reader pass. Emulated forced colours
  passed, but this does not replace Windows High Contrast.
- The other entity types and Layout Builder-specific exception are not tested.
- Review threads were unavailable to intake because GitLab returned HTTP 401.
- Next action: a person reviews the viewer and screenshots, then repeats the
  relevant route with keyboard focus and forced colours before RTBC-level claims.

## Acceptance and verification

- Completed: View and Edit are primary local tasks After, absent from their old
  top-bar placements, reachable with Tab, and free of detectable axe regressions.
- Open: person-led keyboard, screen-reader and forced-colours review; broader
  content/block/media routes; Layout Builder and empty-menu behavior.
- PHPCS, ESLint and CSpell passed. PHPStan was SIGKILLed by the container OOM
  killer, so that part of core lint is incomplete.
- This automated evidence does not establish conformance or RTBC.



## Reporting guidance

Adapted for Lab issue evaluation from
[Accessibility Bug Reporting Best Practices](https://github.com/mgifford/ACCESSIBILITY.md/blob/main/examples/ACCESSIBILITY_BUG_REPORTING_BEST_PRACTICES.md).
Use relevant environment details, redact private content and credentials, and describe visual evidence in text.
