# Reproduce #3466040: Modal dialog actions are pushed out of the viewport

**DRAFT: setup instructions, not evidence that the barrier or correction has been verified.**

Issue: https://www.drupal.org/project/drupal/issues/3466040
Pinned core: `97c6ff8b2534` (selected base; not a verification claim).
Prepared: 2026-11-23. Last verified: 2026-11-24 with [the 1280x900 evaluator run](playwright/2026-11-24T19-25-04-066Z-chromium-light-1280x900/SUMMARY.md).

## Task and barrier

The fixture opens `Drupal.dialog` with `height: '50%'`. Before, core changes the height option to `auto`; expanding content then lets the wrapper grow to the default 95% maximum from the old top position. The Save button moves below the viewport. After, core keeps the 50% height and scrolls the expanded content.

## Preconditions and comparison identity

- Selected variant: `3466040-latest`.
- Before/After environments: `baseline-3466040-latest` / `issue-3466040-latest`.
- Core: `97c6ff8b2534b242c0f1df3e4ba2493e56aebcec` on both sides.
- Recipe: [`recipes/repro_3466040/recipe.yml`](../../../recipes/repro_3466040/recipe.yml) plus its identical test-support module on both sides.
- Before patches: none.
- After patches, in order: [`3466040-resubmission.patch`](branches/3466040-resubmission.patch), sha256 `42460a17`.
- Page: `/lab/dialog-3466040`, logged in as an administrator.
- Verified browser: Chromium 159.0.8154.6 on macOS, 1280x900, 480x900, and emulated forced colours.

Confirm preconditions on both sides before assessing the change. Do not include credentials or live login tokens.

## Start locally

Run from the Lab repository root with Docker and DDEV available. Keep every command block safe to paste into zsh as well as bash:
no `#` comments (zsh reads them as comments only with `setopt interactivecomments`), no `!` (zsh history expansion: `!16335` gives
"no such event" and stops the whole paste), and no `<placeholder>` or `a|b` choices on a command line. Explain the commands in a list
under the block, and give real environment names and URLs.

```bash
node scripts/doctor.mjs 3466040-latest
node scripts/lab-env.mjs start 3466040-latest --browser
```

The environments are already built, so a routine start is the normal path after reboot. If `doctor` says an environment is missing, run `node tools/compare/setup.mjs 3466040-latest` once, then repeat the start command.

Open the viewer and log in both frames. Use this issue's actual evaluator:
`tools/playwright/walkthrough.mjs` is specific to #3619127, not a generic evaluator.

```bash
node scripts/lab-env.mjs stop 3466040-latest
```

Run the stop command when finished. It preserves the databases, checkouts, patch, and evidence.

## Shortest reproduction

Complete these steps before calling the comparison ready for evaluation:

| Step and input | Expected user outcome | Observed Before | Observed After |
|---|---|---|---|
| Open `/lab/dialog-3466040` | The Open button is available | Pass | Pass |
| Press Open percentage-height dialog | The dialog opens at the requested 50% height | Height becomes `auto` | Height becomes 450px at 1280x900 |
| Press Expand content with real pointer or keyboard input | The action pane remains reachable | Action pane moves below the viewport | Content scrolls; action pane remains visible |
| Press Tab once after Expand content | Save is visible inside the viewport | Save receives focus but remains off-screen | Save receives focus and remains visible |

Use real input for focus and activation. Describe what to inspect, not just what to click.
Label scripted results separately from a person's keyboard or assistive technology evaluation.

## Evidence and investigation

Run the persistent evaluator:

```bash
node tools/playwright/evaluate-3466040.mjs 3466040-latest --viewport=1280x900
```

It opens the modal with real pointer input, expands the content, measures both wrappers, presses Tab once, measures the focused Save button, runs axe, and writes screenshots plus `results.json`.

## Acceptance and verification plan

Before action-pane bottom exceeds the visual viewport. After action-pane bottom is at or above the visual viewport, the content has `scrollHeight > clientHeight`, Save is reachable, JavaScript has no errors, and axe does not regress.

The `-pinned` variant has the same core SHA but was not built separately.

## Reporting guidance

See [Accessibility Bug Reporting Best Practices](https://github.com/mgifford/ACCESSIBILITY.md/blob/main/examples/ACCESSIBILITY_BUG_REPORTING_BEST_PRACTICES.md).
Use applicable fields; incomplete intake remains valid even when evaluation or remediation needs more investigation.
