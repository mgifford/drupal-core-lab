# Status: #3466040 / MR !9088

**DRAFT — recommendation only.** This file does not change the drupal.org issue status. The final decision
remains with the independent human reviewer. Updated 2026-11-27 19:25Z (second pass, pristine Before).

## Recommendation

**Needs review — not RTBC on this evidence.**

The MR's production change is confirmed to fix a real reproduction of the reported positioning defect (the MR
fixture, and the issue's own multilingual view-translation modal), the observer lifecycle is clean in the
fixture runs, and no regression was found in the tested paths. What remains before RTBC is the test
hardening, the decision about AJAX growth, and the untested configuration/AT matrix — not the fix itself.

## What is established

| Claim | Status | Evidence |
|---|---|---|
| The overflow is real on pristine core (fixture) | **Confirmed** | Fixture at 1024×768: `212.3px` below the viewport, OK off-screen; manual 1280×1080: `353.3px`. [REVIEW.md](REVIEW.md) |
| MR !9088 fixes that fixture | **Confirmed** | Same expansion re-centres to `top 19.5, bottom 748.5`, OK visible/hittable, content scrolls. |
| The issue's **multilingual view-translation** path (comment #24) reproduces and the MR fixes it | **Confirmed, small magnitude** | 1920×1080: Before `221.8→1082.9` (`2.9px` overflow, content `713/713` not scrollable, Save not reached by Tab); After re-centres and Save is reached. 1920×720: Before `5.8px` overflow, After fits. [EVIDENCE](EVIDENCE.md#2026-11-27-19111924z--second-pass-after-reconciling-the-pair-pristine-before) |
| The issue's **Field UI** (duplicate #3640810) and **Views filter** steps reproduce | **No** at 1080 and 720 | Field UI dialog already at the 95% cap (`1026px`/`684px`), content scrolls, Save in view and Tab-reachable on both sides. Views UI sizes its own inner scroll container; 4 details expanded left the dialog `684px` unchanged on both sides. |
| The observer settles and is cleaned up (fixture) | **Confirmed** | 1 callback + 1 `resetSize` per expansion; 0 idle; 0 after close; 4 created / 4 disconnected over 4 opens; 0 errors in a 3-trial immediate-close race. |
| `testModalContentGrows` fails without the JS change and passes with it | **Confirmed by CI, not locally** | CI test-only job (3 tests, 49 assertions, 1 failure at line 183) plus independent evaluation of the measured rects. A local PHPUnit run is still pending. |
| The test proves the user-facing barrier is gone | **No** | It can pass if the details did not open and if the content is clipped instead of scrollable. |
| Regressions in the tested scenarios | **None confirmed** | Geometry unchanged, axe 0, console/page errors 0, keyboard order unchanged; the one evaluator failure was a timing bug in the harness, now fixed. |
| Zoom / narrow / colour / motion matrix | **Not tested** | Runner `tools/playwright/matrix-3466040.mjs` is written; not completed. |
| Real AT and a person's keyboard pass | **Not tested** | No screen reader or human evaluation was run. |

## Why not RTBC

1. **Test hardening** is small and warranted: assert `details.open === true` after the click, and assert
   `.ui-dialog-content` scrolls (`scrollHeight > clientHeight`, `overflow-y: auto|scroll`). The exact diff is in
   [reviews/test-review.md](reviews/test-review.md) §6 and
   `branches/3466040-test-hardening.patch` (proposal only).
2. **AJAX growth** into an already open dialog is explicitly not claimed by the author ("Not for ajax stuff")
   and is not covered; the issue/MR should state whether that is out of scope or a follow-up.
3. The **real-world path** is narrow. Views filter and Field UI are already mitigated on this revision; the
   reproducible user-facing path found here is the multilingual view-translation modal, with a 2.9–5.8 px
   overflow and a keyboard difference. A maintainer should confirm this is the flow the change is meant to fix.
4. The **independent configuration matrix and AT pass are incomplete** (Firefox/WebKit, dark/forced colours,
   reduced motion, reflow-equivalent zoom, narrow viewports, real browser zoom, a person's keyboard pass, a
   screen reader).

## Next actions (smallest first)

- [ ] Add the two test assertions above (author or maintainer).
- [ ] Decide and record whether AJAX growth is in scope for this MR.
- [ ] Complete the configuration matrix with `tools/playwright/matrix-3466040.mjs` and the multi-browser runs
      when the host is free.
- [ ] A person's keyboard pass and NVDA/VoiceOver pass in at least Chromium and one other browser.
- [ ] Local `ddev phpunit --filter testModalContentGrows` on both sides (Before needs the declared test-support
      patch; the variant definition is documented in REPRODUCE.md).

## Environment and handover state

- The owned pair is running: `repro-baseline-3466040` (pristine `97c6ff8b25`) and `repro-issue-3466040`
  (same commit + MR patch). `lab-env status` shows no patch-state warning for `3466040-pinned`.
- `3466040-regression-pinned` is the variant for the fixture/PHPUnit run (Before gets the declared
  test-support patch). The hardened variant was deferred:
  `reviews/deferred-variant-3466040-regression-hardened.json`; re-add it only for that run.
- The earlier Docker Desktop outage that stopped the first session is over; the untested rows above are a
  scope decision for the next session, not a blocker.
