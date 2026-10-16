# Reproduce #<NID>: <TITLE>

**DRAFT: setup instructions, not evidence that the barrier or correction has been verified.**

Issue: https://www.drupal.org/project/drupal/issues/<NID>
Pinned core: `<PINNED>` (selected base; not a verification claim).
Prepared: <DATE>. Last verified: never. Replace this only with a dated run reference.

## Task and barrier

Describe the task, reported obstacle, consequence and any workaround.
Distinguish user reports, manual observations, tool results and inference. State evidence limits.
WCAG mapping is optional; a missing mapping does not invalidate a report.

## Preconditions and comparison identity

- Selected variant: `<NID>-pinned`; latest variant: `<NID>-latest`.
- Before/After environments: record the resolved variant's environment names.
- Core: record the full resolved commit on BOTH sides.
- Recipe: record its path and optional `apply.sh`, or explicitly state plain Standard install.
- Patches: list application order and hashes on each side. Separate the MR from local follow-ups.
- Page and state: record the safe route, account role, data and state needed to reach the barrier.
- Environment: record relevant browser, OS, assistive technology, input, viewport, zoom, preferences and locale.

Confirm preconditions on both sides before assessing the change. Do not include credentials or live login tokens.

## Start locally

Run from the Lab repository root with Docker and DDEV available:

```bash
node tools/compare/setup.mjs <NID>-pinned --check-patches
node tools/compare/setup.mjs <NID>-pinned
node scripts/lab-env.mjs start <NID>-pinned
```

Open the viewer and log in both frames. Use this issue's actual evaluator if one exists.
`tools/playwright/walkthrough.mjs` is specific to #3619127, not a generic evaluator.
If no evaluator exists, record that gap and perform the manual steps below.

## Start in DDEV Coder

Read `docs/CLOUD-QUICKSTART.md` and `tools/compare/cloud/README.md` first.
In the Freeform workspace form, DDEV project names must be:
`drupal-compare,drupal-compare-before,drupal-compare-after`.
The repository's copyable value comes from `node tools/compare/cloud/config.mjs --project-names`.
In the workspace repository root:

```bash
node scripts/cloud-bootstrap.mjs <NID>-pinned --check --core-url=https://github.com/drupal/drupal.git
node scripts/cloud-bootstrap.mjs <NID>-pinned --install-autostart --core-url=https://github.com/drupal/drupal.git
```

Open the printed viewer URL in a browser signed in to Coder. Confirm both real Coder frames and login yourself;
the smoke check cannot verify that authenticated browser interaction. Record setup and browser results separately.

## Shortest reproduction

Complete these steps before calling the comparison ready for evaluation:

| Step and input | Expected user outcome | Observed Before | Observed After |
|---|---|---|---|
| Reach the required page/state | State is available on both sides | Not tested | Not tested |
| Perform the action under test with Mirror off in each frame | Describe the correction in user terms | Not tested | Not tested |
| Repeat the relevant adjacent interaction or state | Describe the regression guard | Not tested | Not tested |

Use real input for focus and activation. Describe what to inspect, not just what to click.
Label scripted results separately from a person's keyboard or assistive technology evaluation.

## Evidence and investigation

Record reproduction status (reproduced / intermittent / not observed / not tested / needs evidence), attempts and dated run links.
If direct reproduction is unavailable, preserve supporting evidence, limits and the next investigative action.
Keep raw tool outcomes separate from human interpretation. Describe visual attachments and redact sensitive details.
Put results in `EVIDENCE.md`; preserve earlier runs when a patch or recipe changes.

## Acceptance and verification plan

Define measurable user-facing outcomes. Repeat the original interaction and assess relevant regressions.
Record automated checks, manual evaluation and any planned testing with disabled people separately, with scope and limitations.
Record why each method is required or unnecessary. Do not infer conformance or RTBC from setup or automated passes.

## Try current core

```bash
node tools/compare/setup.mjs <NID>-latest --check-patches
node tools/compare/setup.mjs <NID>-latest
node scripts/lab-env.mjs start <NID>-latest
```

For Coder use the same bootstrap procedure with `<NID>-latest`. Repeat the steps and record the resolved commit.
If a patch does not apply, inspect changed files and provenance before proposing a reroll; do not silently alter the stack.
If Before no longer fails, check the scenario, setup and upstream history before concluding that it was fixed.
If After still fails, distinguish setup failures from a remaining barrier. Preserve credible user reports after a failed rerun.

Re-pin only after reviewing the current-core evidence. Update the registered pinned variant where it is defined,
record the new revision and rerun; retain the old evidence with its original identity.

## Reporting guidance

See [Accessibility Bug Reporting Best Practices](https://github.com/mgifford/ACCESSIBILITY.md/blob/main/examples/ACCESSIBILITY_BUG_REPORTING_BEST_PRACTICES.md).
Use applicable fields; incomplete intake remains valid even when evaluation or remediation needs more investigation.
