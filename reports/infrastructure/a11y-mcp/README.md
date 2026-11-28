# Live verification: Playwright MCP accessibility checkpoints on a real Drupal pair

This folder holds the before/after evidence for the dynamic accessibility checkpoint integration
([docs/DYNAMIC-A11Y-CHECKPOINTS.md](../../../docs/DYNAMIC-A11Y-CHECKPOINTS.md)). It is infrastructure evidence about the
integration, not evidence about an issue's fix: the pair is #3419891 (`3419891-pinned`), used because it is a real
Drupal 11 admin page with CKEditor 5, not because this run judges the #3419891 patch.

Status: **DRAFT**. Automated evidence. No person and no real screen reader took part; the manual checks in every
checkpoint are recorded as `not-run`.

## The authoritative run

`2026-11-27T21-41-50-live-3419891-pinned/` — `tools/a11y-mcp/verify-live.mjs --slug=3419891-pinned --route=/node/add/page`,
`unexpected: 0`, both sides `errors: []`.

| | Before | After |
|---|---|---|
| Environment | `baseline-3419891` | `issue-3419891` |
| Host | `repro-baseline-3419891.ddev.site` | `repro-issue-3419891.ddev.site` |
| Core commit (both sides) | `0387fb948f` (2026-11-25) | `0387fb948f` (2026-11-25) |
| Difference | — | the variant's patch stack, recorded as patch content state in each checkpoint |
| Login | one-time link, never printed or written | one-time link, never printed or written |

Five checkpoints were captured on each side and every pair was compared only after the equivalence checks passed
(`comparable: true` for all five):

| Checkpoint | Equivalent | Classification of findings |
|---|---|---|
| `editor-initialized` | yes | 49 `existing-failure`, 1 `manual-review-required` |
| `toolbar-item-focused` | yes | 14 `existing-failure`, 1 `manual-review-required` |
| `dropdown-open` | yes | 14 `existing-failure`, 1 `manual-review-required` |
| `balloon-open` | yes | 1 `manual-review-required` (no automated finding) |
| `focus-restored` | yes | 14 `existing-failure`, 1 `manual-review-required` |

`image-dialog-open` is recorded as **skipped** on purpose: the only toolbar image control in this configuration is
"Upload image from computer", which opens the operating system's file chooser. Triggering it would not produce a page
state a checkpoint can scan, and it is not a substitute for the image dialog. The image dialog and alternative-text
editing are exercised by `tools/playwright/evaluate-3419891.mjs` and
`scenarios/ckeditor/3419891-alt-text-dialog.json`; this live run does not claim them.

Every checkpoint recorded `preserved: true`: the page was not reloaded (`performance.timeOrigin` and the navigation
entry count unchanged in the run's own probes), the editor stayed open and focus was not moved by the scan.

Session totals (`session.json`): 10 checkpoints, 49 distinct findings after deduplication (persistent findings are
counted once across states, with every checkpoint they were observed at), 12 engine runs, 6.4 s of scanning, 2.3 MB of
evidence, **0 browser launches by the integration** (the MCP browser is reused), energy **not measured**.

Read `SUMMARY.md` for the Markdown report and `report.html` for the accessible HTML report generated from the same
JSON. `live-verification.json` is the machine-readable index of this run; `checkpoints/*.json` are the canonical
records and `evidence/` holds the raw engine output, the three accessibility-tree views, visual measurements and the
viewport screenshot for each checkpoint.

## What this run proves

1. An agent-driven Playwright MCP browser opened a real Drupal component and reached states by interaction.
2. axe-core and HTML_CodeSniffer evaluated the exact live page (per-engine status and versions in each record).
3. The scan did not reload the page or lose the open editor/focus state.
4. Each checkpoint records provenance (issue, variant, side, commit, patch state, route, theme, viewport) and a named id.
5. Accessibility-tree, focus, journal and visual evidence are attached to the checkpoint (profile `full` for
   `editor-initialized`, `quick` for the rest).
6. Before and After were compared at equivalent states only; the five pairs are equivalent.

## What this run does not prove

- It does not judge the #3419891 patch: the issue-specific state (the image dialog's alternative-text field) was not
  reached here. Every finding classified as `existing-failure` is a pre-existing finding on the admin page, present on
  both builds; the comparison shows no state-dependent regression at these five states, not that the patch is correct.
- It is Chromium only (the MCP browser), one viewport (1280×720, the MCP default), one colour scheme (light, no forced
  colours).
- It does not cover a real screen reader, keyboard-only completion, icon meaning or announcement quality; those remain
  manual checks.
- It does not cover Firefox, WebKit, closed shadow roots or cross-origin frames.
- Energy use is not measured and no avoided-energy figure is invented.

## Earlier runs in this folder (superseded)

| Folder | Why it is not the evidence |
|---|---|
| `2026-11-27T16-15-53-live-3419891-pinned` | First attempt: the cold Before site exceeded the 60 s navigation timeout, so only the After `editor-initialized` checkpoint was captured; the image control was also not found. |
| `2026-11-27T19-11-46-live-3419891-pinned` | Both sides captured, but 14 `new-regression` and 14 `resolved-failure` pairs were false: HTML_CodeSniffer selectors contained Drupal's site-random ids (`--...-1676520538`). Finding normalisation now strips them; this run is the before-the-fix record. `focus-restored` was also `state-not-reached` because the readiness condition waited for a balloon class that lingers in the DOM. |
| `2026-11-27T21-34-00-live-3419891-pinned` | Interrupted attempt (no `finish.json`); kept only to show that an interrupted session is visibly incomplete (`cli check` reports it). |
| `2026-11-27T21-37-54-live-3419891-pinned` | Complete and equivalent, but `toolbar-item-focused` was rejected because its readiness expression contained a quote/unicode character the validator did not allow; superseded by the authoritative run. |

## Reproduce

```
node scripts/doctor.mjs 3419891-pinned
node tools/compare/setup.mjs 3419891-pinned        # only if the pair is not built
node scripts/lab-env.mjs start 3419891-pinned      # both sites + viewer
node tools/a11y-mcp/verify-live.mjs --slug=3419891-pinned --route=/node/add/page
```

The script needs the Drupal add-on's one-time login command (`ddev drupal login`) and the pair running. It writes a new
`<stamp>-live-<slug>/` folder here and prints the report paths. It never prints or writes the login link, and checkpoint
page paths are sanitised (`/user/reset/...` is redacted).

Generated with the help of an LLM (DeepSeek Harness). AI-assisted development and evaluation disclosure. A person must
review before anything is reported upstream.
