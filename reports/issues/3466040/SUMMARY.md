# #3466040: Modal dialog does not adjust to increased inner height

**DRAFT — independent review, AI-assisted. Not verified by a person's keyboard or AT pass.**
Full report: [REVIEW.md](REVIEW.md) · machine record: [review.json](review.json).

| | |
|---|---|
| Issue | [#3466040](https://www.drupal.org/project/drupal/issues/3466040) |
| MR | [!9088](https://git.drupalcode.org/project/drupal/-/merge_requests/9088) at `aed1df5eeddf0b89c91bab47eb83847f44c58211` |
| Base | `97c6ff8b2534b242c0f1df3e4ba2493e56aebcec` |
| Variant | `3466040-regression-pinned` (Before: pristine core + test-support fixture; After: same core + MR) |
| Primary run | [2026-11-27T16-43-04-546Z, Chromium 159, 1024x768](playwright/2026-11-27T16-43-04-546Z-chromium-light-1024x768-fixture/SUMMARY.md) |

## What the review found

The MR's own fixture reproduces the barrier on pristine core and the MR fixes it:

| | Before | After |
|---|---|---|
| Dialog after the details expands (1024x768) | `top 251.3 → bottom 980.3`, **212.3px below the viewport** | `top 19.5 → bottom 748.5`, fits |
| OK button | `y 926.3–967.3`, not visible, not hit-testable | `y 694.5–735.5`, visible, hit-testable |
| Keyboard focus on OK | focused but off-screen, no scroll possible | focused, in view, hit-testable |
| ResizeObserver callbacks during the expansion | 0 (no observer) | 1, then `resetSize` once; settles |
| Callbacks while idle / after close | 0 / 0 | 0 / 0 |
| Observer lifecycle over 4 opens | n/a | 4 created, 4 disconnected, no leak |
| Console or page errors | 0 | 0 |
| Confirmed regressions | — | none |

At `1280x1080` the manual run reproduced `353.3px` of overflow on Before and no overflow on After.

## Real-world steps from the issue

- **Views UI** (`/admin/structure/views/view/content` → Content: Content type → details): **does not reproduce**. Views UI already sizes an inner `.scroll` container and absorbs the growth; dialog height is unchanged (`845.4px`) on both sides.
- **Field UI** (Set default value): **does not reproduce at 1920x1080**; the config dialog is already at its 95% cap (`1026px`) and scrolls internally.
- The MR fixture is the only confirmed reproduction in this review. Media library and the multilingual Views translation modal were not tested.

## Regression test

`ModalRendererTest::testModalContentGrows` **fails without the production JavaScript change and passes with it** (CI pipeline 1063751's test-only job; independently, the measured `rect.bottom` is `980.3 > 768` on Before and `748.5 <= 768` on After). The test has false-pass doors: it never asserts that the details opened or that the content scrolls, and its titlebar assertion cannot fail on pristine core. A local PHPUnit run was blocked by the environment outage (see below).

## Not verified

No zoom/reflow matrix, narrow (`480x900`, `320x900`) viewports, dark mode, forced colours, reduced motion, genuine browser zoom, Firefox/WebKit, a real screen reader, a person's keyboard pass, or a local PHPUnit run. Docker Desktop stopped under host memory pressure before those runs; the runner is [`tools/playwright/matrix-3466040.mjs`](../../../tools/playwright/matrix-3466040.mjs). **Do not treat this page as a conformance or RTBC conclusion.**

## Recommended status

**Needs review — not RTBC on this evidence.** The production fix is confirmed for the fixture with a clean observer lifecycle and no confirmed regression. Test hardening (assert `details.open`, assert the content scrolls), an explicit decision on AJAX growth, and the unverified configuration/AT matrix are the open items. The final decision remains with the independent human reviewer; the issue status and MR were not changed.


## Update 2026-11-27 19:25Z (pristine pair)

- `3466040-pinned` was started on the reconciled pair (Before pristine `97c6ff8b25`, After + MR). The
  patch-state warning is gone and the pair is the active one.
- **Multilingual view translation (comment #24) reproduced and is fixed by the MR**: Before overflow
  `2.9px` at 1920×1080 and `5.8px` at 1920×720, content not scrollable at 1080, "Save translation" not
  reached by the keyboard walk; After re-centres, content scrolls and Save is reached. See
  [EVIDENCE.md](EVIDENCE.md#2026-11-27-19111924z--second-pass-after-reconciling-the-pair-pristine-before).
- **Views filter and Field UI still do not reproduce** at 1080 or 720 on this revision (Views UI inner-scroll
  workaround; Field UI dialog already at the 95% cap). No geometry difference between the sides in those paths.
- The test hardening (details-open and content-scroll assertions) and the untested browser/AT matrix remain the
  reasons not to recommend RTBC; see [STATUS.md](STATUS.md).
