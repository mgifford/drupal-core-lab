# Accessibility checkpoints: issue #3419891

Session `2026-11-27T21-34-00-live-3419891-pinned`, generated 2026-11-28T02:28:16.182Z. **DRAFT: automated evidence, not a human accessibility review or a published finding.**

Source: playwright; Playwright MCP 0.0.84 (playwright-mcp --init-page + --init-script; a single exposed binding; browser_evaluate calls the approved helper). Profile: full.

**1 checkpoint(s)**, **0 distinct finding(s)** (0 observation(s) at checkpoints; a persistent finding is counted once).

## Scenario summary

| | |
|---|---|
| Issue | #3419891 |
| Variants | `3419891-pinned` |
| Sides captured | Before |
| Pages | `/node/add/page` |
| Browser | chromium 157.0.8103.79 |
| Viewports | 1280x720 |
| Colour modes | light |
| Core commits | `0387fb948f 2026-11-25` |

## Checkpoint inventory (in the order reached)

| # | Checkpoint | Side | Status | Page | State | Engines | Findings | Evidence |
|---|---|---|---|---|---|---|---|---|
| 1 | `editor-initialized` CKEditor initialised | Before | state-not-reached | `/node/add/page` | focus body; READINESS NOT MET | axe-core:not-run htmlcs:not-run | 0 | [evidence](001-editor-initialized) |

## Before / After at equivalent states

| Checkpoint | Equivalent? | Checks | Classifications |
|---|---|---|---|
| `editor-initialized` | **NO** (no After checkpoint at this state) | — | no findings either side |

## Findings (one row per distinct finding)

No automated finding passed the filter. This is not an accessibility pass.

## Manual review required

Automated checks cannot decide these. They are stored separately and were **not performed by a person** in this session.

| Checkpoint | Check | Question | Result |
|---|---|---|---|
| `editor-initialized` | `screen-reader-repeat` | Does a screen reader announce anything unnecessarily repetitive at this state? | not-run |

## Announcement and interaction history

Nothing recorded (use profile dynamic or full at a checkpoint that follows an interaction).


## Focus transitions

No focus transition was recorded before these checkpoints.


## Screenshots

- Before `editor-initialized` (viewport): [viewport.png](reports/infrastructure/a11y-mcp/2026-11-27T21-34-00-live-3419891-pinned/evidence/001-editor-initialized/viewport.png)

## Reproduction steps (from the recorded trusted interactions)

No trusted interaction was recorded before these checkpoints. Repeating the session needs the same starting page and the same choices.

## Resource consumption (measured, not estimated)

| Measure | Value |
|---|---|
| Checkpoints | 1 |
| Engine runs | 0 |
| Scan time | 30074 ms |
| Evidence on disk | 16.0 KiB |
| Screenshots | 1 |
| Browser launches by this integration | 0 (the MCP browser is reused) |
| Energy | not measured; no avoided-energy figure is invented |

## Engine capability declarations

| Engine | Version | Live page | Injects JS | Navigates | Iframes | Shadow DOM | Computed styles | Preserves state | Scope | Licence |
|---|---|---|---|---|---|---|---|---|---|---|
| axe-core | 4.14.0 | yes | yes | no | yes | yes | yes | yes | yes | MPL-2.0 |
| HTML_CodeSniffer | 2.5.1 | yes | yes | no | yes | no | yes | yes | filter | BSD-3-Clause |
| IBM Equal Access | not installed | no | no | yes | yes | yes | yes | no | no | Apache-2.0 |

## Limits

- Chromium only (the MCP browser); other engines/capabilities are reported per checkpoint, not assumed.
- Automated engines see a minority of real barriers; a clean scan is not an accessibility pass.
- No real screen reader, no person, was involved unless a manual step says so.
- The readiness condition was not met, so this checkpoint describes an unexpected state: page.waitForFunction: Timeout 30000ms exceeded.. A missing finding here may mean the state was never reached.
- axe-core did not run: readiness condition was not met, so the checks that need the expected state were not run
- htmlcs did not run: readiness condition was not met, so the checks that need the expected state were not run
- Chromium only. A different engine or browser would build different evidence; nothing here is extrapolated to them.
- Automated results are a DRAFT: a clean scan is not an accessibility pass. The manual checks in this record were not performed by a person unless a result says so.
- Page helper 1.0.0; Playwright MCP 0.0.84 via playwright-mcp --init-page + --init-script; a single exposed binding; browser_evaluate calls the approved helper.

Generated with the help of an LLM (DeepSeek Harness) from the recorded evidence. AI-assisted development and evaluation disclosure; a person must review before anything is reported upstream.
