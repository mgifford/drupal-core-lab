# Drupal 3637339: skip-link focus color

**DRAFT, AI-assisted; not RTBC.** Automated assessment finalized 2026-11-18; human review remains outstanding.

## What was broken, and does the MR fix it?

The skip link sits outside Default Admin's general focus selector. Before the patch, it uses the browser's focus ring
instead of the selected theme focus color. This was reproduced using saved settings and real keyboard input.

MR !17818 **corrects the configured outline color in all six requested desktop configurations**, including dark mode and
Pink accent with focus set to **Same as Accent color**. The baseline fails that color check; the MR passes it.
First Tab and Enter activation work in the desktop trials, and axe reported no violations or regressions there.

**A separate problem remains:** the MR puts a 4px outline with a 2px offset around a link still positioned at top/start 0.
Its top and inline-start outline portions extend 6px outside the viewport. Repeated geometric measurements and model-inspected
screenshots corroborate clipping. This is not automatically a WCAG AA failure, but it does not meet the requested fully visible
indicator expectation.

**Answer to the assessment question:** not unconditionally. The configured-color correction is demonstrated, but the
unchanged MR does not yet demonstrate a fully visible, unclipped indicator. The original-base desktop run confirms the same result.

**Separate local proposal:** token-derived top/start clearance removes the measured overflow in 19 configuration/environment
combinations, while retaining the configured outline and measured keyboard/navigation behavior. Two model-inspected screenshots
corroborate the visible improvement. This is a tested experiment, not an upstream MR revision or human accessibility sign-off.
Broader matrix and experimental results are recorded in [EVIDENCE.md](EVIDENCE.md).

## Accent color is not focus color

The UI offers Pink as an **accent** preset, not a focus preset. To request Pink focus, choose Pink accent and
**Same as Accent color** focus. Pink accent plus Orange focus should remain Orange.
The November 17 comment did not record its independent focus setting, so its exact configuration cannot be inferred.
The report should not be dismissed as tester error.

## Registered comparisons and code

| Comparison | Purpose |
|---|---|
| `3637339-latest` | Pristine current core against the unchanged MR; both built at `ecb483ff6d4b` |
| `3637339-pinned` | Original core base `7480c58b75c0` against the same MR revision |
| `3637339-focus-clearance` | Separate local experiment: MR against MR plus focus-clearance follow-up |

MR head: `8c4a0e703168ebe9c3b37d3a8d00a2e89bc7ffa5`.
The original [MR patch](branches/3637339-skip-to-main.patch) is unchanged.
For the local proposal, use exactly one route:

- **Existing MR checkout:** apply the [clearance interdiff](branches/3637339-focus-clearance.patch) to tip `8c4a0e70`.
- **Clean current core:** apply the [complete revised patch](branches/3637339-focus-clearance-full.patch) to `ecb483ff6d4b`.

Do not stack the complete patch on the MR or apply it together with the interdiff.
See [BRANCHES.md](BRANCHES.md) for hashes, application order and four successful tree-equivalence checks.
All comparisons use a plain Standard-install precondition; no recipe or content is needed.

## Review the evidence

- [Start here: human keyboard/screen-reader checklist and upstream feedback map](HUMAN-REVIEW.md)
- [Reproduction commands and configuration matrix](REPRODUCE.md)
- [Measured results, source trace, paired focused screenshots and limitations](EVIDENCE.md)
- [Canonical desktop browser run](playwright/2026-11-18T19-07-25-161Z-chromium-light-1280x900/SUMMARY.md)
- [Core lint: PASS on both changed CSS files](lint/2026-11-18-3637339-latest-after.md)
- [Served HTML/CSS/JS comparison](compare/3637339-latest/SUMMARY.md)
- [Generated coverage ledger](COVERAGE.md)
- [Current assessment status and next action](STATUS.md)
- [Dated upstream snapshot](STATUS-2026-11-18.md)
- [Issue intake and source-access gaps](intake/BRIEF.md)
- [Draft comment, not posted](ISSUE-COMMENT-DRAFT.md)
- [Generated Coder handoff](CODER-PROMPT.md)

The live viewer provides the registered side-by-side, onion and difference modes. Only one document can have real keyboard
focus at once; the report's paired screenshots capture independent focused states. Do not treat mirrored styling as focus evidence.
Generated GitHub Pages metadata links to the repository evidence; GitHub Pages does not host running Drupal sites.
Publishing this Lab report does not update the Drupal issue or its MR.
The clearance pair was restarted for human review on 2026-11-18; both sites passed the viewer health check.
Open [the clearance comparison](https://drupal-compare.ddev.site/?variant=3637339-focus-clearance) locally.
Use [the registered comparison commands](REPRODUCE.md) if the sites have since been stopped.

## Validation and remaining work

The evaluator was exercised on current and original-base core. The local proposal passed nine targeted browser runs;
both core patch stacks passed lint. The final [lab selftest output](selftest.txt) records repository checks.
The coverage-attribution regression test keeps experimental results out of pinned-core rows.
The generated coverage headline describes pinned environments attempted, not passed; consult the Latest column and individual results.

Human keyboard and screen-reader review, real Windows High Contrast, translated RTL and zoom/reflow remain outstanding.
Browser emulation and automated keyboard traces do not replace those checks. MR review discussions could not be read (HTTP 401).

Next: the human contributor follows [the issue-specific human review guide](HUMAN-REVIEW.md), records observations, and resolves
the inaccessible MR review-thread gap before deciding whether to offer the clearance follow-up. No RTBC recommendation is made.
The saved screenshot pairs are report-based; a persistent screenshot-comparison viewer mode was not implemented.

WCAG 2.2: 2.4.7 and 2.4.11 are AA; 2.4.13 Focus Appearance is AAA. No blanket conformance claim is made.
