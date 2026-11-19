# Reproduce #2942404: System messages should be accessible

**DRAFT: setup instructions, not evidence that the barrier or correction has been verified.**

Issue: https://www.drupal.org/project/drupal/issues/2942404
Pinned core: `66a4c78b453b` (selected base; not a verification claim).
Prepared: 2026-11-19. Last verified: 2026-11-19 on `2942404-latest` ([playwright/](playwright/README.md); scripted, no person). The pinned pair has not been built.

## Task and barrier

Task: learn that an action succeeded or failed (save content, submit a form, an AJAX update) without moving focus. Reported barrier: messages wrapped in `role="contentinfo"` (a landmark for page footer information). Open questions (untested): whether messages are discoverable and announced once after a redirect, after AJAX and with BigPipe. Source: the issue and the implementation prompt; no testing with people.

## Preconditions and comparison identity

- Selected variant: `2942404-pinned`; latest variant: `2942404-latest`.
- Before/After environments: record the resolved variant's environment names.
- Core: record the full resolved commit on BOTH sides.
- Recipe: `recipes/repro_2942404` (applies core's `article_content_type` fixture recipe, giving the Article content type). Both sides get it; the lab's plain install has none.
- Patches: `2942404-latest` Before none; After `branches/2942404-main-region-option.patch` (lab-authored; the old MRs do not apply to main). `2942404-pinned` After applies `branches/2942404-11.patch` (MR !6112) on old core; not built.
- Page and state: as `admin`, `/node/add/article` (save with a title for a status message; save with an empty title and browser validation off for an error), `/admin/config/development/performance` (Clear all caches), and `/user/login` logged out (wrong password).
- Environment: record relevant browser, OS, assistive technology, input, viewport, zoom, preferences and locale.

Confirm preconditions on both sides before assessing the change. Do not include credentials or live login tokens.

## Start locally

Run from the Lab repository root with Docker and DDEV available. Keep every command block safe to paste into zsh as well as bash:
no `#` comments (zsh reads them as comments only with `setopt interactivecomments`), no `!` (zsh history expansion: `!16335` gives
"no such event" and stops the whole paste), and no `<placeholder>` or `a|b` choices on a command line. Explain the commands in a list
under the block, and give real environment names and URLs.

```bash
node tools/compare/setup.mjs 2942404-pinned --check-patches
node tools/compare/setup.mjs 2942404-pinned
node scripts/lab-env.mjs start 2942404-pinned
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
node scripts/cloud-bootstrap.mjs 2942404-pinned --check --core-url=https://github.com/drupal/drupal.git
node scripts/cloud-bootstrap.mjs 2942404-pinned --install-autostart --core-url=https://github.com/drupal/drupal.git
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
node tools/compare/setup.mjs 2942404-latest --check-patches
node tools/compare/setup.mjs 2942404-latest
node scripts/lab-env.mjs start 2942404-latest
```

For Coder use the same bootstrap procedure with `2942404-latest`. Repeat the steps and record the resolved commit.
If a patch does not apply, inspect changed files and provenance before proposing a reroll; do not silently alter the stack.
If Before no longer fails, check the scenario, setup and upstream history before concluding that it was fixed.
If After still fails, distinguish setup failures from a remaining barrier. Preserve credible user reports after a failed rerun.

Re-pin only after reviewing the current-core evidence. Update the registered pinned variant where it is defined,
record the new revision and rerun; retain the old evidence with its original identity.

## Reporting guidance

See [Accessibility Bug Reporting Best Practices](https://github.com/mgifford/ACCESSIBILITY.md/blob/main/examples/ACCESSIBILITY_BUG_REPORTING_BEST_PRACTICES.md).
Use applicable fields; incomplete intake remains valid even when evaluation or remediation needs more investigation.
