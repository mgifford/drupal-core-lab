# Independent review of the #3466040 evidence package

**DRAFT — AI-assisted, read-only review of the owner's evidence. Not a drupal.org post.**
No change was made to the merge request, its production code, the issue status, or the owner's reports.
The 3466040 environment pair was not started for this review; the evaluation session owns it. Runtime
checks that this review could not settle are listed as a handoff request, not as results.

| | |
|---|---|
| Issue | [#3466040 Modal dialog does not adjust to increased inner height](https://www.drupal.org/project/drupal/issues/3466040) |
| Merge request | [!9088](https://git.drupalcode.org/project/drupal/-/merge_requests/9088) |
| Reviewed revision | `aed1df5eeddf0b89c91bab47eb83847f44c58211` |
| Base | `97c6ff8b2534b242c0f1df3e4ba2493e56aebcec` (2026-11-23), Drupal `12.0-dev` |
| Owner's report | [`../REVIEW.md`](../REVIEW.md) and [`../review.json`](../review.json) (reviewed 2026-11-27) |
| This review's machine record | [`review.json`](review.json) (synchronised with this file) |

## Bottom line

The owner's central result is well supported: the MR's own fixture reproduces the overflow on the
Before side, the MR fixes it, the focused action is off-screen before and on-screen after, and the
new test is weaker than its name. Those claims survive a line-by-line check against the raw runs.

**One material claim does not survive.** The report says the observer lifecycle is clean and that no
regression is confirmed. That is true for the fixture, which opens and closes one dialog at a time, but
it is **not true for the Field UI AJAX flow** measured in the owner's own 15:35 run. Three
`ResizeObserver`s were created on the same `#drupal-modal` element, only the newest was stored and
disconnected, and two were still connected when the dialog closed. The review's "theoretical, not
confirmed" observer-leak item is therefore a **confirmed implementation defect**, although no
user-visible geometry change was measured in that path.

The owner added a translation-path addendum at 19:25Z. The raw runs support its **geometry** claim: at
1920x1080 the Before dialog ends 2.9px below the viewport, at 720 5.8px, and the MR re-centres it. They
do **not** support its keyboard claim **at those two viewports**. The real Tab trail reaches "Save
translation" at step 4 and the button is inside the viewport on Before at both heights; the run's
`reachedPrimary:false` is a tooling artifact because the shared label regex does not match "Save
translation". My corrected re-run at
1920x1080 reproduces the `2.9px` bottom overflow with Save still visible (`fits=false`, Save `inViewport
true`, reached at step 4; After `fits=true`, reached at step 7; verdict `reproduced-and-fixed`). At
**125 % reflow** (`1536x864`) the same path becomes a real barrier: Before grows to `113.8→933.8`
(h `820`), **69.8px below** the 864 viewport, and Save translation sits at `882.8–920.8` — outside the
viewport and not hittable; the Tab trail reaches it but it is off-screen. After re-centres to `22→842`
and Save is at `791–829`, hittable, reached at step 2. So the translation path **does** reproduce the
barrier at a common zoom level, and the MR fixes it; the owner's 100 %/720 runs were too mild to show
it. Media library, 90/110 % reflow, and other Field UI heights remain untested.

**Recommended issue status: Needs work** — the MR needs a code/test change (observer reuse/teardown and
test hardening) before RTBC. If maintainers consciously accept the leak as a follow-up, **Needs review,
not RTBC** is defensible. The final decision remains with the independent human reviewer.

## What this review checked

Read-only cross-check of:

- the owner's [`REVIEW.md`](../REVIEW.md), [`review.json`](../review.json), [`EVIDENCE.md`](../EVIDENCE.md),
  [`STATUS.md`](../STATUS.md), [`SUMMARY.md`](../SUMMARY.md), [`COVERAGE.md`](../COVERAGE.md) and
  [`ISSUE-COMMENT-DRAFT.md`](../ISSUE-COMMENT-DRAFT.md);
- the raw `results.json` for the fixture run (16:43), the Field UI run (15:35) and the Views run (16:24);
- the CI test-only job log and pipeline metadata in [`../ci/`](../ci/);
- the two Before/After screenshots in the fixture run;
- the owner's 19:25Z addendum and the two Chromium translation runs at 1920x1080 and 1920x720;
- a corrected translation re-run at 1920x1080 and at 125 %, 200 % and 400 % reflow
  ([`runs/translation-1920x1080-verify/results.json`](runs/translation-1920x1080-verify/results.json),
  [`runs/translation-zoom125/results.json`](runs/translation-zoom125/results.json),
  [`runs/translation-zoom200/results.json`](runs/translation-zoom200/results.json),
  [`runs/translation-zoom400/results.json`](runs/translation-zoom400/results.json)).

The Field UI lifecycle and translation checks below were run in the handoff window on the pristine
pair and are used as evidence, as is the local PHPUnit pass on After. An earlier local PHPUnit attempt
made before the handoff was terminated by the environment outage and produced no test result (the empty
log is at [`regression/before-testModalContentGrows.log`](regression/before-testModalContentGrows.log));
it is not evidence in either direction.

## Reproduction as reviewed

The fixture route is added by the MR's test-support files; the Before side carries the same route,
controller and test (declared test-support, no production change). Steps:

1. Log in as an administrator and open `/dialog_renderer-test-links`.
2. Click **Details modal!** (`a[href="/dialog_renderer-content-details"]`); wait for `.ui-dialog`.
3. Click **Show more content** (`.ui-dialog details summary`); this reveals a 2000 px block.
4. Measure `.ui-dialog`, `.ui-dialog-content` (`clientHeight`/`scrollHeight`),
   `.ui-dialog-buttonpane` and `.ui-dialog-buttonpane button`.

| Selector | What it identifies |
|---|---|
| `.ui-dialog` | Dialog wrapper; its `getBoundingClientRect()` is the "fits the viewport" test |
| `.ui-dialog-titlebar` / `.ui-dialog-titlebar-close` | Titlebar and close button |
| `.ui-dialog-content` | Scrollable content area (`clientHeight`, `scrollHeight`, `overflow-y`) |
| `.ui-dialog-buttonpane` | Action pane that leaves the viewport on Before |
| `.ui-dialog-buttonpane button` | The primary **OK** action |
| `.ui-dialog details summary` | **Show more content** trigger |
| `a[href="/dialog_renderer-content-details"]` | The fixture opener on the links page |

Screenshots (from the owner's 16:43 run):

- Before: [`../playwright/2026-11-27T16-43-04-546Z-chromium-light-1024x768-fixture/before-F2-expanded-viewport.png`](../playwright/2026-11-27T16-43-04-546Z-chromium-light-1024x768-fixture/before-F2-expanded-viewport.png)
- After: [`../playwright/2026-11-27T16-43-04-546Z-chromium-light-1024x768-fixture/after-F2-expanded-viewport.png`](../playwright/2026-11-27T16-43-04-546Z-chromium-light-1024x768-fixture/after-F2-expanded-viewport.png)

Console and page errors in the fixture run: **0 / 0** on both sides; no
`ResizeObserver loop completed with undelivered notifications` notice. axe-core in the expanded
fixture: **0** violating elements on both sides (axe does not test this geometry barrier).

## Claims that hold

| Claim in the owner's report | Verdict | Raw evidence |
|---|---|---|
| Fixture opens short, then grows; Before overflows by `212.3px` at `1024x768` | **Supported** | Before `F2-expanded`: `251.3→980.3` (h `729`), viewport `768`, content `578/2146`, button pane `913.3–979.3`, OK `926.3–967.3` |
| The MR re-centres the same expansion; `0px` overflow; OK visible and hit-testable | **Supported** | After `F2-expanded`: `19.5→748.5`; pane `681.5–747.5`; OK `694.5–735.5`; content still `578/2146` |
| Keyboard focus moves to OK but off-screen on Before; in view on After | **Supported** | Tab walk: Before `inViewport: false`, `hittable: false`; After `true/true` |
| The observer fires once per expansion in the fixture, settles, and is disconnected on close | **Supported for the fixture** | After `F2`: `+1` patch callback, `+1` `dialogContentResize`; 800 ms idle `0`; `postClose` 900 ms `0/0`; four opens: four observers, four disconnects |
| The test fails without the JS change (CI) | **Supported** | `Test-only changes` job: `Tests: 3, Assertions: 49, Failures: 1`; `ModalRendererTest.php:183` `assertJsCondition` false |
| The test can pass without the details opening, and without the content scrolling | **Supported** | Test source: no `details.open` assertion, no `scrollHeight > clientHeight` assertion; the titlebar assertion passes on pristine core |
| Views filter modal and Field UI at `1920x1080` do not reproduce | **Supported for those measured states** | Views `B1`: `845.4px` both sides, inner `.scroll` `689/960`; Field UI `A4–A6`: `1026px` both sides, content `878/1272` scrolls |
| Translation modal geometry: Before bottom is 2.9px (1080) / 5.8px (720) below the viewport; After fits | **Supported** | Before `T2`: `221.8→1082.9` (1080), `41.8→725.8` (720); After `109.5→970.6` / `18→702` |
| Translation keyboard at 100 %/720: "Before does not reach Save, After does" | **Not supported at those viewports; supported at 125 %** | At 100 %/720 the trail reaches Save at step 4 on Before (and step 7/2 on After); `primaryFocus` puts Save inside the viewport. At 125 % Save is at `882.8–920.8`, outside 864, not hittable |
| axe 0 violations, no console/page errors in the fixture | **Supported** | `axe.total 0` both sides; `jsErrors []`; `pageErrors []`; no `ResizeObserver loop` notice |
| Explicit `height`, `maxHeight`, `autoResize:false`, two non-modal dialogs | **Supported as component checks** | Owner's component table; `autoResize:false` overflows by `946px` by design; two non-modal dialogs do not move each other |

The two screenshots corroborate the geometry visually: Before shows the dialog continuing below the
viewport with no OK button; After shows the dialog re-centred and the OK button at the bottom.

## The claim that does not hold: "observer lifecycle is clean" / "no confirmed regression"

The owner's `REVIEW.md` says:

> "The observer lifecycle is clean in this run: one observer per dialog … four opens produced four
> observers and four disconnects" (`REVIEW.md:20`), and "Theoretical, not confirmed: observer leak on
> repeated `show()` without close" (`REVIEW.md:185`).

The sentence at line 20 is qualified "in this run", and for the fixture run that qualification is
accurate. The problem is that the same conclusion is carried into the bottom line ("No confirmed
regression"), `STATUS.md` and `review.json`, and that the leak is labelled "theoretical, not confirmed"
even though the same evidence package's Field UI run measured it.

`STATUS.md` repeats it ("the observer lifecycle is clean", "The observer settles and is cleaned up",
"Regressions … None confirmed"), and `review.json` records the leak as `theoreticalConcerns[0]` with
status "not observed; each core AJAX open creates a new element".

I re-ran the same Field UI flow on the pristine `3466040-pinned` pair with the current probe
([`independent-review/runs/field-ui-1920x1080-verify/results.json`](runs/field-ui-1920x1080-verify/results.json)).
It confirms the pattern:

| Stage (After) | Patch observers | Ids | Patch callbacks | `dialogContentResize` | Disconnects |
|---|---|---|---|---|---|
| `A2-add-field-modal` | 1 | 10 | 1 | 1 | 0 |
| `A3-type-chosen` | 2 | 10, 11 | 3 | 3 | 0 |
| `A4-continue-1` | 3 | 10, 11, 12 | 9 | 9 | 0 |
| `A8-dialog-closed` | 3 | 10, 11, 12 | 11 | 9 | **1** (id 12; ids 10, 11 still connected) |

Before: 0 patch observers and 6 `dialogContentResize` events. The owner's earlier 15:35 run shows the same
pattern; its table is below.

The owner's own Field UI run contradicts this. In
[`playwright/2026-11-27T15-35-43-499Z-chromium-light-1920x1080/results.json`](../playwright/2026-11-27T15-35-43-499Z-chromium-light-1920x1080/results.json):

| Stage (After) | Patch observers | Observer ids | Patch callbacks | `dialogContentResize` | Disconnects |
|---|---|---|---|---|---|
| `A2-add-field-modal` | 1 | 10 | 1 | 1 | 0 |
| `A4-continue-1` (second AJAX modal) | **3** | 10, 11, 12 | **9** | **9** | 0 |
| `A8-dialog-closed` | **3** | 10, 11, 12 | **11** | 9 | **1** (id 12 only; ids 10, 11 `disconnected:false`) |

Before the MR, the same stages had `0` patch observers and `6` `dialogContentResize` events in total;
the After side reached `9` during `A4` alone. All three observers target the **same** element,
`div#drupal-modal.ui-dialog-content` (the `dialog` field in `lifecycle.patchObserverDetail` is identical
for ids 10, 11 and 12). This is the F1 mechanism the code review described: `OpenModalDialogCommand`
reuses `#drupal-modal`, each `showModal()` fires `dialog:aftercreate` again without `dialog:beforeclose`,
the single `drupalAutoResizeObserver` data key is overwritten, and `beforeclose` disconnects only the
newest observer.

The 15:35 run used an earlier version of the probe; the current-probe rerun above removes that caveat.
Both show the same three ids on the same element and one disconnect. The fixture run's 4-created /
4-disconnected result is the contrasting case: it closes each dialog before the next open, so it never
exercises repeated `aftercreate` without `beforeclose`.

**What this does and does not mean**

- **Confirmed:** the MR accumulates observers and leaks two of them in a core Field UI AJAX flow, and
  performs extra `resetSize` work (`9` events vs `6` on Before through the same point). This is an
  implementation regression introduced by the MR, not a theoretical concern.
- **Not demonstrated:** a user-visible geometry failure in that flow. The measured `A4–A6` dialogs are
  the same size and position on both sides, and there were no console/page errors. The effect observed
  here is extra work and retained observers; whether that becomes visible jank in a long-lived dialog
  is still unmeasured.
- **Not covered by the fixture:** the fixture's four open/close cycles each create and disconnect one
  observer. It never exercises repeated `aftercreate` on the same element without a close, which is why
  the fixture result looked clean.

The fix is small and testable: disconnect and `removeData()` any existing
`drupalAutoResizeObserver` before constructing a new one (or create one per element and reuse it), and
add a test that opens a dialog, forces two AJAX re-renders without closing, and asserts one observer
and zero callbacks after close. This is a request for the MR author, not a change made here.

## Translation addendum: geometry supported, keyboard claim not supported

The owner's 19:25Z addendum says the issue's first listed path — the multilingual Views translation
modal (comment #24) — reproduces and the MR fixes it, with "the keyboard difference" the material part.
The geometry is supported; the keyboard claim is not.

| Translation run, 1920x1080 | Before | After |
|---|---|---|
| `T1` open | `221.8→858.2` (h `636.4`), content `488/488` | same |
| `T2` after **Default Display settings** | `221.8→1082.9` (h `861.1`), **2.9px overflow**, content `713/713` (not scrollable) | `109.5→970.6`, fits |
| Second expansion | — | `27→1053` (h `1026`), content `878/1307` scrolls |
| Save translation rect | `1031.9–1069.9`, **inside 1080** | `1002–1040`, inside |
| Real Tab trail | Save reached at **step 4**, in viewport | Save reached at **step 7**, in viewport |
| 720 run | `41.8→725.8` (h `684`), **5.8px overflow**, content `536/713` scrolls; Save `674.8–712.8` inside 720; reached at step 4 | `18→702`, fits; Save `651–689` inside; reached at step 2 |
| Independent re-run, 1920x1080 | `fits=false`, overflow `2.9`, Save in viewport and reached at step 4 | `fits=true`, overflow `0`, Save in viewport and reached at step 7; verdict `reproduced-and-fixed` |
| Independent 125 % reflow, `1536x864` | `113.8→933.8` (h `820`), **69.8px overflow**, Save `882.8–920.8` **outside 864, not hittable**; Tab reaches it off-screen | `22→842`, fits, Save `791–829` hittable, reached at step 2; verdict `reproduced-and-fixed` |

The owner's 1080/720 `results.json` says `reachedPrimary:false` and `verdict: reproduced-not-fixed`.
The cause is that the shared `PRIMARY_LABEL` regex is `^(save|save settings|continue|apply|update|ok)$`
and does not match "Save translation". At those viewports the `primaryFocus` measurement and the trail
both show the button inside the viewport and focused, so the addendum's claim is **not supported at
100 %/720**. The 125 % run is different: there Save is at `882.8–920.8`, outside the 864 viewport and
not hittable; that run **does** support a real keyboard barrier, and the MR fixes it.

What this means: the translation path has a real barrier at 125 % reflow (69.8px overflow, Save
off-screen) and a much smaller bottom overflow at 100 % (2.9px) and 720 (5.8px, Save still visible). The
addendum understated the problem by testing only the two mild viewports. The material reproductions are
now the MR fixture (`212–353px`, OK off-screen) and the translation modal at 125 % reflow. Media
library, 90/110 %, and other Field UI heights remain untested.

The owner's `review.json` was not updated with the addendum: it is still the 12:31 JSON, still lists the
translation modal as untested, and still labels the observer leak theoretical. The Markdown and JSON in
the owner's package are no longer synchronized.

## Smaller measurement inconsistencies

| Item | Observation | Effect on the report |
|---|---|---|
| Field UI `A3-type-chosen` | Before `216.5→863.4` (h `646.9`, button pane present); After `269.1→810.9` (h `541.8`, no pane) | The stages are not the same UI state. This is likely an evaluator timing/state mismatch, not a product difference, but "Field UI dialogs are geometrically unchanged" is too broad. It should exclude `A3` or explain the transient. |
| Views top edge | Before `121.3`, After `117.3` (same height `845.4`) | A real 4 px re-centring from the observer's initial callback. Benign at this viewport, but it is a change, not "identical". |
| Manual `1280x1080` claim | `353.3px` overflow, cited in `EVIDENCE.md` | No manual log or screenshot is in the evidence index (`COVERAGE.md` says "No manual logs recorded yet"). The automated `1024x768` result is sufficient; label the manual claim as owner-reported, not independently archived. |
| Per-event geometry | `lifecycle.recentEvents` stores target and time, not the dialog rect/client/scroll at each `dialogContentResize` | The stage tables still give the geometry after each stage, so the main claims stand; the per-event correlation the task asked for is only partial. |
| Owner's `review.json` | Markdown and `EVIDENCE.md` were updated at 14:25–14:27 with the translation addendum; `review.json` is still the 12:31 file | The owner's Markdown/JSON are no longer synchronized. The JSON should be regenerated or amended with the addendum and the corrected translation keyboard result. |

## Regression test: what is and is not established

- **Fails without the production JS:** supported by CI's *Test-only changes* job. It reverts the
  non-test change, runs the changed tests, and `testModalContentGrows` fails at line 183. This is real
  test execution, though not by this reviewer. The local Before run was not repeated because it needs
  the test-support patch on the pristine Before checkout.
- **Passes with it:** now confirmed locally. I ran
  `ddev phpunit core/modules/system/tests/src/FunctionalJavascript/ModalRendererTest.php --filter testModalContentGrows`
  in `issue-3466040` during the handoff window: **OK (1 test, 3 assertions)**, 1:30, PHP 8.5.7, Selenium
  Chrome. Log: [`regression/after-testModalContentGrows.log`](regression/after-testModalContentGrows.log).
  The pipeline's green Functional Javascript jobs are corroboration; the owner's geometry comparison
  (`980.3` vs `748.5`) is an independent evaluation of the assertion, not a test run.
- **Test-quality gaps:** agree with the owner. The test never asserts `details.open === true` after the
  click, never asserts `.ui-dialog-content` scrolls, and its titlebar assertion passes on pristine core.
  A clipping "fix" or a no-op click would pass it. Add the two assertions before RTBC.

## WCAG implications

| Criterion | Owner's label | This review |
|---|---|---|
| [2.4.7 Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html) (AA) | Confirmed failure on Before | **Confirmed in two paths.** The fixture's focused OK button is entirely outside the `768px` viewport; at 125 % reflow the translation modal's focused Save translation is at `882.8–920.8`, outside the `864px` viewport. No scroll occurs. |
| [2.4.11 Focus Not Obscured (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) (AA, WCAG 2.2) | Confirmed failure on Before | **Debatable; downgrade to "potential/likely".** The control is off-screen because the dialog is taller than the viewport, not because another author-created layer covers it. The SC's normative wording ("entirely hidden due to author-created content") is aimed at sticky headers/footers/overlays; an off-viewport element is better cited under 2.4.7 and 1.4.10. Do not call it confirmed without a maintainer's interpretation. |
| [2.1.1 Keyboard](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html) (A) | Not a failure | **Agree.** The button is focusable and activatable; Escape and close remain available. |
| [1.4.10 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) (AA) | Risk, not verified | **Confirmed pre-existing problem in the translation modal at 400 % reflow; not caused by the MR.** At `480×270` CSS px the modal is `882px` wide (`left 0, right 882`) and the `880px` button pane is outside the `480px` viewport horizontally; Save translation is at `25–168.6` and remains visible, but `402px` of the form is off-screen. The MR re-centres vertically only; it does not change the configured `880px` width. |
| [1.4.4 Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) (AA) | Risk, not verified | **Agree.** Text-only zoom was not run. |

At 400 % reflow the translation modal's fixed `880px` width exceeds the `480px` CSS viewport by `402px`.
This is a WCAG 1.4.10 concern in the same user path, but it is a pre-existing width choice
(`config_translation` sets `width: 880`), not a regression from this MR. The run is reflow-equivalent
emulation, not genuine browser zoom.

axe 0 violations says nothing about these geometry/focus barriers; the owner states that correctly. No
screen reader or person's keyboard pass was run; the owner states that too.

## Zoom and reflow (reflow-equivalent, not browser zoom)

The lab's `--zoom` divides the CSS viewport. It is not genuine browser zoom; `devicePixelRatio` stays 1.
No genuine Ctrl/Cmd +/- run was made.

| Level | CSS viewport | Translation modal result |
|---|---|---|
| 100 % | `1920x1080` | Before `2.9px` overflow, Save visible and reached; After fits. |
| 125 % | `1536x864` | **Reproduced:** Before `69.8px` overflow, Save outside the viewport and not hittable; After fits and Save hittable. |
| 200 % | `960x540` | Both fit: dialog `513px` at the cap, content scrolls; no vertical barrier. |
| 400 % | `480x270` | Dialog `882px` wide, `402px` off-screen horizontally; Save visible at left. **Pre-existing 1.4.10 issue**, not the MR. |
| 90 %, 110 % | `2133x1200`, `1745x982` | not run: a concurrent session re-applied the test-support patch to `baseline-3466040` at 20:37, so the pristine `3466040-pinned` pair no longer matched the variant. This review did not overwrite that state. |

## Confirmed, theoretical, and untested

**Confirmed defects**

1. **Product, Before:** growing content past the initial cap moves the button pane out of the viewport;
   pointer activation is impossible and keyboard focus becomes invisible. Reproduced at `1024x768`
   (`212.3px`), owner-reported at `1280x1080` (`353.3px`), and in the translation modal at 125 % reflow
   (`69.8px`, Save outside `864`, not hittable).
2. **Implementation, MR:** observer accumulation and partial teardown in the Field UI AJAX flow
   (three observers on `#drupal-modal`, two still connected after close, extra `resetSize` work). Not
   user-visible in the measured state, but a confirmed regression in the implementation.
3. **Test quality, MR:** `testModalContentGrows` can pass without the details opening and without a
   scrollable content area; the titlebar assertion is non-discriminating.

**Confirmed pre-existing issue (not the MR):** at 400 % reflow (`480x270`) the translation modal is
`882px` wide and `402px` of it is off-screen horizontally; Save remains visible at the left. This is a
WCAG 1.4.10 reflow concern in the same path, caused by the configured `880px` width, not by this MR.

**Theoretical / untested**

- User-visible jank or memory growth from the leaked observers in a long-lived AJAX dialog.
- Fractional-pixel interaction with [#3458272](https://www.drupal.org/project/drupal/issues/3458272):
  the base already contains that issue's `Math.round(...outerHeight())` fix; the fixture converged with
  `19.5px` headroom at `1024x768`. No loop was observed. At 400 % zoom the headroom shrinks; untested.
- AJAX content inserted into an already-open dialog (the author's "not for ajax stuff" caveat).
- Growth outside the content element (titlebar/sibling).
- `autoResize:false` dialogs still overflow (confirmed control, by design and out of scope).
- Two simultaneous core AJAX modals (core reuses `#drupal-modal`); only two `Drupal.dialog()` instances
  were tested.

## Not tested, and the handoff request

Completed in this handoff window: the translation modal at 1080/720 (geometry and the real Tab trail),
and the current-probe Field UI lifecycle confirmation (three observers, one disconnect). Still not
tested:

- Media library with `image_widget_crop`.
- Translation at other viewports and at 90/100/110/125/200/400 zoom.
- Field UI at other heights (for example `1920x1440`) and a Views multi-toggle with the current probe.
- Zoom/reflow 90/110 (100/125/200/400 done; 110 and 90 blocked by the baseline patch switch at
  20:37), `480x900`, `320x900`.
- Dark mode, forced colours, reduced motion, real OS contrast, real browser zoom, device scale factor.
- Firefox (crashed on this host in the owner's attempt) and WebKit/Safari. The owner's WebKit run
  completed Field UI; the Views toggle did not run there.
- Local PHPUnit `testModalContentGrows` on Before. After passed locally (`OK (1 test, 3 assertions)`);
  the Before failure is CI evidence only.
- A person's keyboard pass and a real screen reader (NVDA/VoiceOver).
- Two simultaneous core AJAX modals; touch/mobile.

Remaining handoff checks, if another window is available: Field UI at `1920x1440` plus a Views
multi-toggle; the colour/motion/browser matrix; 90/110 % reflow; a human keyboard/AT pass.

## Corrections to make in the owner's package

These are proposed edits for the owner/editor; nothing here was applied to the owner's files.

1. `REVIEW.md:20-22`, `STATUS.md:9/17/21`, `SUMMARY.md:25-27` and `review.json.regressions`:
   replace "observer lifecycle is clean" / "no confirmed regression" with "clean in the fixture; three
   observers, two leaks and extra `resetSize` work in the Field UI AJAX flow".
2. `review.json.theoreticalConcerns[0]` (T1): move it to a confirmed finding with the 15:35 evidence
   (ids 10/11/12, same `#drupal-modal`, `A8` disconnect = 1). Keep the fixture 4/4 result as the
   contrasting case.
3. Translation addendum: cite the **125 % reflow** case, where Before genuinely hides Save (69.8px
   overflow, Save outside 864). At 100 %/720 the Save was visible; the `reachedPrimary:false` and
   `reproduced-not-fixed` verdicts there are label-regex bugs. Re-run with a detector that accepts
   "Save translation", and correct the statement that the 100 %/720 runs show the keyboard barrier.
4. WCAG table: keep 2.4.7 as confirmed; relabel 2.4.11 as potential/likely, or give the maintainer
   interpretation that makes it confirmed.
5. `SUMMARY.md` and `ISSUE-COMMENT-DRAFT.md`: add the Field UI observer leak (one sentence) and avoid
   the blanket "no confirmed regression" wording. The draft's fixture-only claims are otherwise accurate.
6. `review.json`: regenerate it from the updated Markdown. It is still the 12:31 file and does not contain
   the translation addendum or the corrected translation keyboard result.

The owner's core fixture result does not need to change; the corrections are about scope and the
Field UI lifecycle finding.

## Candidate fix (local proposal, not the MR)

I implemented and tested a minimal production fix on top of the MR in the After checkout; nothing was
pushed, and the MR itself is untouched.

| Artifact | What it is |
|---|---|
| [`fix/3466040-observer-reuse.patch`](fix/3466040-observer-reuse.patch) | Production-only interdiff against MR head; sha256 `56f4e12e…` |
| [`fix/3466040-interdiff-vs-mr.patch`](fix/3466040-interdiff-vs-mr.patch) | Production fix + test hardening, interdiff against MR head; sha256 `3e77ac86…` |
| [`fix/3466040-full-candidate.patch`](fix/3466040-full-candidate.patch) | Full candidate: base `97c6ff8b` + MR + both changes; sha256 `5287096f…` |
| [`../branches/3466040-test-hardening.patch`](../branches/3466040-test-hardening.patch) | Existing test-only hardening proposal used above |

**The change** (`core/misc/dialog/dialog.position.js`):

- reuse one `ResizeObserver` per dialog content element; create it only if absent, and observe the
  current target (unobserve the previous element only if it was replaced);
- cancel the previous debounced `autoResize` before replacing it, and store the current
  `eventData`/target; the observer callback calls the latest debounced function with the latest data;
- on `dialog:beforeclose`, disconnect the observer and `removeData()` the observer, target, event data
  and debounced function.

This removes the stacking that the MR introduces while keeping the observer's behaviour on the content
change that the fix is for.

**Verification** (`3466040-fix-probe`: pristine Before, After = MR + candidate fix; Field UI,
`1920x1080`, Chromium 159):

| Measure (After) | MR only (current probe) | MR + candidate |
|---|---|---|
| `observersCreated` | **12** (9 page + 3 patch) | **10** (9 page + 1 patch) |
| Patch observer ids | **10, 11, 12** | **10** (same id at A2-A5) |
| Observer disconnect on close | 1 | 1 |
| Observers still connected after close | **2** (ids 10, 11) | **0** |

Callback and `dialogContentResize` totals are **not directly comparable** between the two runs: the
candidate run captured an extra `A4-continue-2` stage, so the same AJAX flow produced a different number
of layout changes. The observer count, ids, and teardown are the like-for-like measures.

The probe still records one `patchObservers` entry per `aftercreate` even when the same observer is
reused, so its "3" in the candidate run is three records for id 10, not three observers.
`observersCreated` and the repeated id are the authoritative counts.

**Hardened test:** with MR + candidate + the test-hardening patch,
`ddev phpunit ... --filter testModalContentGrows` gives **OK (1 test, 6 assertions)** in 1:01. Log:
[`regression/after-hardened-testModalContentGrows.log`](regression/after-hardened-testModalContentGrows.log).

**Core's own checks pass** on the candidate stack: `node scripts/lint.mjs 3466040-fix-probe --no-save`
gives CSpell 0 issues, PHPStan no errors, PHPCS passed, ESLint passed, exit 0 in 43 s.

**The hardened test fails without the production fix.** Before + test-support + hardening:
`Tests: 1, Assertions: 5, Failures: 1` at the geometry `assertJsCondition`
(`ModalRendererTest.php:187`, from `WebDriverTestBase.php:161`). The details-open assertions pass; the
dialog-bottom assertion is the failure. Log:
[`regression/before-hardened-testModalContentGrows.log`](regression/before-hardened-testModalContentGrows.log).
With MR + candidate + hardening it is `OK (1 test, 6 assertions)`; the fail/pass pair is therefore
proved locally as well as in CI.

**The user-facing fix still works:** with the candidate, the 125 % translation run is
`reproduced-and-fixed` — Before `69.8px` overflow with Save off-screen, After fits and Save is hittable.

**Ready state:** apply the interdiff and hardening, re-run CI (the *Test-only changes* job must still fail
without the production JS; Functional Javascript, PHPCS, ESLint and PHPStan must pass), and set the issue
to **Needs review**. The pre-existing 400 % width issue, the window-handler re-registration and the human
AT pass are explicitly outside this package.

**Caveats:** the candidate does not address the pre-existing re-registration of the window resize/scroll
handlers (the older half of F1), the pre-existing 400 % width overflow, or the human AT pass. It is a
local proposal, not a change to the MR.

## What would make it ready for "Needs review"

1. **Merge the observer-reuse fix** (or an equivalent that keeps one observer per dialog) and show the
   Field UI lifecycle moving from 3 observers / 2 leaks to 1 observer / 0 leaks, with no callbacks after
   close.
2. **Add the two hardening assertions** already proposed: `details.open === false` before the click and
   `true` after it, and `.ui-dialog-content` `scrollHeight > clientHeight` with `overflow-y: auto|scroll`.
3. **Re-run the gates**: the CI *Test-only changes* job must still fail without the production JS; the
   Functional Javascript job, PHPCS, ESLint and PHPStan must pass. The local hardened test is a useful
   preview, not a substitute for CI.
4. **State the AJAX scope**: the fix handles repeated `aftercreate` on the same content element; content
   inserted into an already-open dialog is still a separate, untested case.
5. Then set the issue to **Needs review** with the fixture + 125 % translation evidence and the candidate
   patch. RTBC still needs the maintainer/AT review; the 400 % width reflow is a separate pre-existing
   issue and should not be bundled into this MR.

With 1–3 done, the remaining risk is the untested colour/motion/browser/AT matrix, which is a review
gap rather than a known defect.

## Recommended status

**Needs work.** The production change fixes the MR's fixture and a real translation-modal barrier at
125 % reflow (69.8px overflow, Save off-screen and not hittable); at 100 %/720 that overflow was only
2.9–5.8px with Save still visible. But the MR introduces a confirmed observer-accumulation/teardown
defect in a core AJAX flow and ships a test with false-pass doors. The candidate in `fix/` resolves the
observer defect and the hardened test passes; once that (or an equivalent) is merged and CI is green,
the issue can move to **Needs review**. Both need a code/test change before RTBC. If the maintainers explicitly accept
the observer leak as a follow-up, the issue can be **Needs review, not RTBC** on the strength of the
fixture plus a hardened test; it should not be marked RTBC on the evidence as it stands.

The final decision remains with the independent human reviewer. This review does not change the issue
status, the MR, or its production code.

## Evidence index

| Evidence | Where |
|---|---|
| Owner's report and machine record | [`../REVIEW.md`](../REVIEW.md), [`../review.json`](../review.json) |
| Fixture run, both sides, `1024x768` | [`../playwright/2026-11-27T16-43-04-546Z-chromium-light-1024x768-fixture/`](../playwright/2026-11-27T16-43-04-546Z-chromium-light-1024x768-fixture/) |
| Field UI lifecycle data | [`../playwright/2026-11-27T15-35-43-499Z-chromium-light-1920x1080/results.json`](../playwright/2026-11-27T15-35-43-499Z-chromium-light-1920x1080/results.json) |
| Views geometry | [`../playwright/2026-11-27T16-24-50-391Z-chromium-light-1920x1080/results.json`](../playwright/2026-11-27T16-24-50-391Z-chromium-light-1920x1080/results.json) |
| CI test-only job | [`../ci/gitlab-job-13926147-test-only-changes.log`](../ci/gitlab-job-13926147-test-only-changes.log) |
| Owner's coverage gaps | [`../COVERAGE.md`](../COVERAGE.md) |
| Field UI lifecycle re-run, current probe | [`runs/field-ui-1920x1080-verify/results.json`](runs/field-ui-1920x1080-verify/results.json) |
| Translation re-run, corrected detector | [`runs/translation-1920x1080-verify/results.json`](runs/translation-1920x1080-verify/results.json) |
| Translation 125 % reflow (barrier reproduced) | [`runs/translation-zoom125/results.json`](runs/translation-zoom125/results.json) |
| Translation 200 % reflow | [`runs/translation-zoom200/results.json`](runs/translation-zoom200/results.json) |
| Translation 400 % reflow (horizontal overflow) | [`runs/translation-zoom400/results.json`](runs/translation-zoom400/results.json) |
| Local PHPUnit on After (pass) | [`regression/after-testModalContentGrows.log`](regression/after-testModalContentGrows.log) |
| This review's JSON | [`review.json`](review.json) |
| Ready-for-Needs-review handoff | [`READY.md`](READY.md) |

**Provenance:** Before `97c6ff8b25` + test-support `262dd0fc…`; After `97c6ff8b25` + MR
`1adba92d…`; Chromium `159.0.8154.6`; `1024x768`; Drupal `12.0-dev`; PHP `8.5.7`; darwin arm64.
The owner's report files were read at the hashes recorded in [`review.json`](review.json); they were not
edited.

---

AI-assisted: this review was produced with AI assistance from the owner's files and raw run data. No
runtime was performed for it after the handoff instruction. Automated evidence does not replace a
person's keyboard or assistive-technology evaluation.
