# #2942404: System messages should be accessible

**DRAFT, AI-assisted. Implementation and scripted evidence; no person has reviewed it.**

Issue: https://www.drupal.org/project/drupal/issues/2942404
Variant: `2942404-final` (issue-scoped; extends `2942404-consolidated`).
Prepared: 2026-11-26.

## The remaining barrier

The original `role="contentinfo"` wrapper is no longer on current main. Each message group is a
live region: `role="alert"` for errors and warnings, `role="status"` for other types. The message
area itself has no landmark, JavaScript-created messages get a plain container, and on the system
and starterkit templates a JavaScript message could be appended inside an existing `alert` or
`status` group.

Variant C adds one named `region` landmark, "System messages", to the default
`[data-drupal-messages]` container. The region is not a live region. The per-type roles, warnings'
assertive urgency, headings, content, styling, focus and `Drupal.announce()` are unchanged.

## Final implementation

Base: `0387fb948f786bc344a5cc54aa0d98b8f552e378` (2026-11-25).

Ordered patch stack:

1. [`branches/2942404-consolidated-region.patch`](branches/2942404-consolidated-region.patch) —
   the retained Twig-only Variant C patch: the outer container in the system, Default Admin and
   starterkit templates gets `role="region"` and `aria-label="{{ 'System messages'|t }}"`.
2. [`branches/2942404-consolidated-message-landmark.patch`](branches/2942404-consolidated-message-landmark.patch)
   — the `Drupal.Message` lifecycle, the containment fix, the Umami and `test_messages` templates,
   and the first regression tests.
3. [`branches/2942404-consolidated-ownership.patch`](branches/2942404-consolidated-ownership.patch)
   — ownership-safe cleanup, narrower message detection, one-insertion wrapper handling, and the
   expanded ownership, detection, multiple-instance and server-lifecycle tests.

Final squashed proposal:
[`branches/2942404-consolidated-full.patch`](branches/2942404-consolidated-full.patch),
sha256 `162da4576775cd4925f414a3e7bc8c6a142c18cd57f0eb34d91cadfc43f1f779`.
Interdiff from v2 to final:
[`interdiff/interdiff-consolidated-v2-to-final.diff`](interdiff/interdiff-consolidated-v2-to-final.diff),
sha256 `6cb142553971da7038a5d886c5c37e060677eaed3e05ef62991cce7f5f32bdbe`.

### CI follow-up (2026-11-26)

MR !17968 is the pushed head `b11a4441`. Its pipeline failed on
`BigPipeTest::testBigPipe`, `BigPipeTest::testBigPipeNoJs` and three performance budgets. The
follow-up is a minimal diff against that head:
[`branches/2942404-ci-fixes.patch`](branches/2942404-ci-fixes.patch),
sha256 `14f1f5d3eb3cf355ec8077a118c084c16ead80148d41f59288dbc03a11e703df`.
It updates the two BigPipe fixture strings, updates the three `ScriptBytes` centres by the
measured compact delta, adds one regression test for a translation change, and simplifies
`message.js` with one `LIVE` selector constant and a flatter `isMessage` (2,765 → 4,643 compact
bytes, +1,878 instead of the MR's +1,981). The `WeakMap` ownership record is kept. The full
squashed v2 proposal is
[`branches/2942404-consolidated-full-v2.patch`](branches/2942404-consolidated-full-v2.patch),
sha256 `a5cb02b0aa6012f385715ad8df68a565c1e3f02d36eea5c8d988e05ce69f58f9`, 14 files. Tests:
BigPipe 5/160 and 2/90, MessageLandmark 1/2, JsMessage 6/47, BigPipeMessages 1/3,
MessageCommand 2/61; lint PASS. The performance suites skip in this lab because they require
MySQL. Detail: [CI-FIXES.md](CI-FIXES.md).

The branch `2942404-consolidated-landmark` is pushed to the Drupal issue fork at commit
`b11a4441276acd732753ca4c2de6922c30728a75`, based on `0387fb948f`. The earlier shallow-clone commit
`92ef4c38` was not pushed.

Production changes at MR head, before the CI follow-up: 201 insertions / 11 deletions in
`core/misc/message.js` and five templates. Test changes: 203 insertions in four test files. Total:
10 files, 404 insertions, 11 deletions. The follow-up changes `message.js`, four fixture/YAML
files and one test method; the full v2 patch is 415 insertions / 16 deletions in 14 files.

## Landmark ownership

The code stores the values Drupal assigns in a module-level `WeakMap` and keeps the
`data-drupal-message-landmark` marker for observability. Cleanup removes `role` and `aria-label`
only when both still equal the stored values and no `aria-labelledby` was added. If another
script changes the role, changes the name or adds `aria-labelledby`, Drupal relinquishes the
landmark and leaves both attributes alone.

An earlier follow-up compared against a fresh `Drupal.t()` at clear time. A reviewer showed that
a translation change between add and clear would then leave an empty landmark, so the `WeakMap`
was restored and a language-change test added.

The supported convention is:

- Twig owns server-rendered landmarks. They carry no JS marker and `Drupal.Message` never removes
  them.
- JavaScript owns a landmark only when it added the role and name to a container that had none.
- A changed role or name means the other script owns it. Drupal does not fight later mutations.
- Empty containers are not landmarks. An empty `.messages` group is not a message.

The previous v2 implementation failed this: cleanup removed `role` and `aria-label` even after
another script changed them. The new `testLandmarkOwnership` fails on v2 at
`[data-drupal-messages][role="alert"][aria-label="External messages"] not found` and passes on the
final code.

## Message detection and wrapper handling

- Detection now uses `[data-drupal-message-id]` and `.messages`, and skips a `.messages` group with
  no text and no image. The broad `[role="alert"]`/`[role="status"]` fallback is gone. A focused
  test shows an unrelated status region and an empty `.messages` group no longer keep the landmark;
  that test fails on v2.
- `messageInternalWrapper()` takes an optional insertion position. `defaultWrapper()` uses
  `'beforeend'` when it must create a wrapper after existing groups, so the wrapper is inserted once
  instead of at the beginning and then moved. Existing callers that omit the argument still get
  `'afterbegin'`.
- Four public static helpers and the public `isDefaultWrapper` property from v2 are gone. The
  lifecycle uses module-scope functions and private `WeakSet`/`WeakMap` state.
- Multiple default instances share one container and one landmark; removing one instance's message
  keeps the others, and clearing the last message removes the landmark.

## Evidence, core `0387fb948f` (three-patch browser/AT; four-patch PHPUnit/lint)

Environments: `baseline-2942404-latest` and `issue-2942404-consolidated`, both at
`0387fb948f786bc344a5cc54aa0d98b8f552e378`. Standard install plus `recipes/repro_2942404`. Both
sites use Default Admin as default and admin theme.

| Check | Before | Final |
|---|---|---|
| Server-rendered status, error and warning (all-types fixture) | per-type `status`/`alert`, no message landmark | one `region` "System messages"; warning stays `alert` |
| JavaScript-only messages | no landmark | one `region` |
| JavaScript message next to server messages | no landmark; containment theme-dependent | one `region`; not nested in another live region |
| Server message plus JavaScript, then clear the JavaScript | no landmark | region and server messages remain |
| Empty page | no message container | no message container, no landmark |
| Custom contextual wrapper | unchanged | unchanged; no system landmark |
| Author role, name or `aria-labelledby` | preserved | preserved |
| Another script changes role/name | — | cleanup leaves the changed attributes |
| Multiple instances | — | one landmark while any message remains |
| Focus after add/remove/clear | unchanged | unchanged |
| axe-core, eight Chromium-light scenarios | 0 | 0 |
| Duplicate IDs | 6 on `/admin/content` scenarios | the same 6, identical values and elements |

Measured runs:

- Chromium light, 1280x900:
  [`playwright/2026-11-26T03-33-47-385Z-chromium-light-1280x900`](playwright/2026-11-26T03-33-47-385Z-chromium-light-1280x900/SUMMARY.md).
  0 After checks not met, 0 axe regressions.
- Guidepup virtual:
  [`screenreader/2026-11-26T03-34-45-279Z`](screenreader/2026-11-26T03-34-45-279Z/SUMMARY.md).
  After exposes `region, System messages` around the server and JavaScript messages; the inner
  `status`/`alert` groups are unchanged.
- Core code checks:
  [`lint/2026-11-26-2942404-final-after.md`](lint/2026-11-26-2942404-final-after.md), PASS
  (CSpell, PHPStan, PHPCS, ESLint, Twig CS fixer; 14 files, regenerated for the four-patch tree).

PHPUnit, core `0387fb948f`:

| Test | Result |
|---|---|
| `MessageLandmarkTest` | OK, 1 test |
| `JsMessageTest` | OK, 6 tests, 47 assertions |
| `BigPipeMessagesTest` | OK, 1 test, 3 assertions |
| `MessageCommandTest` | OK, 2 tests, 61 assertions |

On unmodified Before, the new landmark assertions fail at the first
`[data-drupal-messages][role="region"][aria-label="System messages"]` check in
`MessageLandmarkTest`, `BigPipeMessagesTest` and `MessageCommandTest`. The ownership and detection
tests fail on the v2 implementation, which is the implementation that introduced the lifecycle.

## Real VoiceOver evidence

Final code, `screenreader/2026-11-26T06-39-33-642Z`:

- Both After routes reached the button and exposed `System messages region` around the status,
  warning and error groups. The groups kept `status`, `alert`, `alert`; headings stayed at level 2.
- The unsolicited announcement was the combined three-message string.
- Before administration reached the button and had no message region. Before front did not start:
  VoiceOver reported "Heading not found" and did not reach the button. This is a test-navigation
  failure on the Before side, not a product difference. The earlier 01:31 run supplies Before-front.

Earlier evidence, `screenreader/2026-11-26T01-31-46-207Z`,
`2026-11-26T01-38-53-209Z` and `2026-11-26T01-42-23-930Z`, was collected on the two-patch
implementation. It shows Before both routes and After both routes with the same named region,
preserved roles and the same combined unsolicited announcement.

It does not establish human landmark rotor navigation, navigation back to dynamic messages, NVDA,
JAWS or TalkBack, cross-theme behaviour, or general conformance. Both tested routes rendered Default
Admin. Repeated phrases in the later scripted `next()` steps are reading-order output, not repeated
announcements. Tool versions for the 01:31/01:42 runs: Node 22.23.5, npm 10.9.9, Guidepup 0.40.0,
Guidepup setup 0.29.3, Guidepup virtual reader 0.33.0. macOS, Safari and VoiceOver versions are not in
the run JSON and are not inferred.

## Historical evidence, preserved

- **2026-11-19/20:** the per-type region option (Variant B) on `92e5c3a30476`; see the
  `2026-11-19T*` run directories and [EVIDENCE.md](EVIDENCE.md).
- **2026-11-25:** Variant C at `92e5c3a304`; Chromium and Guidepup runs. Patch applicability to
  `0387fb948f` was checked separately; it was not a runtime result. The old summary heading still
  says “options on main”; its `results.json` records Variant C, and a
  [`NOTE.md`](playwright/2026-11-25T23-27-54-093Z-chromium-light-1280x900/NOTE.md) records the
  discrepancy.
- **2026-11-26 00:26 / 00:41:** earlier runs on this branch. They are preserved; the 00:41 run is
  current for `2942404-consolidated`, not for the final variant.

The November 25 environments were absent when this work started. New environments were built at
`0387fb948f`; they were not rebuilt at `92e5c3a304`, and the old evidence was not repinned.

## Coverage

`COVERAGE.md` now uses the issue-scoped `2942404-final` variant as the primary comparison. It
reports 1 of the 6 matrix environments tested (Chromium light 1280x900) and 5 gaps. This is a real
gap, not a conflation with the pinned MR variant.

## What is not established

- No person has reviewed this evidence. No human VoiceOver, NVDA, JAWS, TalkBack or keyboard pass.
- The final VoiceOver run covers After both routes; its Before front did not start, and no person has used the landmark rotor.
- **Default Admin dismissal** remains an existing defect: opacity 0 plus `visually-hidden`, no DOM
  removal. The landmark can remain over visually hidden messages, and the invisible Hide button
  stays focusable. Not fixed here.
- Stark, starterkit and Umami were not browser-run on this core. Stark's system template is covered
  by `MessageLandmarkTest`; Umami is not.
- BigPipe is covered by `BigPipeMessagesTest`, not by the Playwright evaluator. AJAX responses that
  carry a server-rendered message, multiple stock default containers, JavaScript disabled, 200%
  zoom, RTL and touch were not tested.
- The six duplicate Views table-header IDs are unrelated and not fixed.

## Files

- [EVIDENCE.md](EVIDENCE.md): run records, commands and results.
- [CI-FIXES.md](CI-FIXES.md): BigPipe fixture, JS payload and performance-budget follow-up.
- [REFLECTION.md](REFLECTION.md): what this session learned about the review, measurements and shared lab.
- [SCREENREADER.md](SCREENREADER.md): VoiceOver evidence, repeated-transcript cause and human
  protocol.
- [EXPLAINER.md](EXPLAINER.md): design, ownership convention and limits.
- [BRANCHES.md](BRANCHES.md): every patch, base and hash.
- [REPRODUCE.md](REPRODUCE.md): exact commands.
- [UPSTREAM-HANDOFF.md](UPSTREAM-HANDOFF.md): contribution handoff.
- [ISSUE-COMMENT-DRAFT.md](ISSUE-COMMENT-DRAFT.md): draft comment, not posted.
- [RESOURCE.md](RESOURCE.md): resource accounting.

## Sources

- Issue: https://www.drupal.org/project/drupal/issues/2942404 (98 comments fetched 2026-11-19;
  [intake/BRIEF.md](intake/BRIEF.md)).
- Related: #3587678, #3159933, #2893640, #3437924, #3618230.
- Merge requests !6058 and !6112 are stale against current main; see [MR-EVALUATION.md](MR-EVALUATION.md).
