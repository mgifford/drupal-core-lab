# Diff review: #2942404 CI follow-up patch (MR !17968)

**DRAFT, AI-assisted. Not reviewed by a person. Nothing was pushed.**
Date: 2026-11-26. Reviewer: `diff-reviewer-2` (fresh context, task-1).
Scope: [`branches/2942404-ci-fixes.patch`](../branches/2942404-ci-fixes.patch) (5 files, against MR
head `b11a4441`), read with [`branches/2942404-consolidated-full-v2.patch`](../branches/2942404-consolidated-full-v2.patch)
(14 files, against base `0387fb948f`) and the four-patch tree in `envs/issue-2942404-consolidated`
for context. Read-only except for this file.

## Verdict: APPROVE WITH COMMENTS

The three fixture/performance files in the patch are correct (checks 3 and 4 below are clean), the
test suite is not touched (no test removed, no assertion weakened), and the `message.js` rewrite
preserves behaviour for every ownership case named in the brief **except one**: cleanup now
compares the `aria-label` against a fresh `Drupal.t('System messages')` instead of the label
Drupal actually set. If that translation output changes between add and clear, cleanup relinquishes
the landmark and the empty named region stays for the rest of the page. The marker-only ownership
record has the same class of weakness if another script strips the attribute.

None of this blocks the CI fix in ordinary pages, but the behaviour change is real, is undocumented,
and is contradicted by `BRANCHES.md:46` ("without changing its behaviour"). Fix the recorded-label
comparison, or document and test the limitation, before the patch is proposed upstream. Findings
below are ordered by severity.

## Findings

### M1 (Major) — cleanup compares against the translation at clear time, so a language change leaves a permanent empty landmark

- File: `envs/issue-2942404-consolidated/core/misc/message.js:98`
  (`container.getAttribute('aria-label') === Drupal.t('System messages')`);
  patch [`2942404-ci-fixes.patch:108`](../branches/2942404-ci-fixes.patch).
- Related: `addLandmark()` sets the label at add time (`message.js:77`); `removeLandmark()` deletes
  the marker even when the comparison fails (`message.js:103`); a later `addLandmark()` then returns
  early because `role`/`aria-label` exist (`message.js:69-75`), so it never re-marks the container.
- MR head stored `{role, label}` in the `landmarks` WeakMap and compared against the stored label
  (`branches/2942404-consolidated-ownership.patch`, `message.js` hunk lines 99-105 new side), so it
  removed the attributes correctly after a translation change.
- Impact: if `Drupal.t('System messages')` returns a different string at clear time than at add time
  (another script mutating `window.drupalTranslations.strings['']['System messages']`, a
  page-localisation layer that changes language without reloading JavaScript, or an override of
  `Drupal.t`), then on `clear()`/`remove()` of the last message Drupal leaves `role="region"` and the
  old `aria-label` on an empty container and drops the marker. There is no path back: even if the
  translation returns to the original value, the next add does not set the marker, so no later
  cleanup removes the region. The user-visible result is exactly the empty landmark the MR exists to
  avoid. Core does not change JS translations during a page lifetime, so this needs a third-party
  script or a non-core language layer to trigger; that makes it a narrow regression, not a blocker,
  but it is silent and it is not stated in `CI-FIXES.md`, `EVIDENCE.md` or `SUMMARY.md`.
- Suggested change: record what Drupal set instead of re-fetching it. Either keep the MR-head
  `landmarks` WeakMap, or keep the empty marker attribute and store the label on the element without
  serialising it, for example:

  ```js
  const label = Drupal.t('System messages');
  container.setAttribute('aria-label', label);
  container.setAttribute(LANDMARK_ATTRIBUTE, '');
  container.__drupalMessageLabel = label;              // addLandmark
  ...
  container.getAttribute('aria-label') === container.__drupalMessageLabel  // removeLandmark
  delete container.__drupalMessageLabel;                                   // removeLandmark
  ```

  If the byte budget forbids either, state the assumption in the `removeLandmark` docblock
  ("the translation of 'System messages' is assumed stable for the page lifetime; if it changes,
  Drupal relinquishes the landmark and the region can remain") and remove the
  "without changing its behaviour" claim in `BRANCHES.md:46`.

### m1 (Minor) — the new comments describe the removed record inaccurately

- `message.js:62`: "The marker records that Drupal added the values". The marker records only that
  Drupal added the landmark; the values are no longer recorded anywhere. This wording hides M1.
  Suggest: "The marker records that Drupal added the role and name; cleanup compares them with the
  values Drupal set."
- `message.js:61`: "Existing roles, names and labelled-by references are author-provided". The
  early return (`message.js:69-75`) applies to server-template values (the system template sets
  `role`/`aria-label` at `core/modules/system/templates/status-messages.html.twig:34`) and to other
  scripts, not only to author markup. Suggest: "Existing roles, names and labelled-by references are
  left alone."
- `message.js:84-86`: "leaves the changed attributes alone". When either value has changed, Drupal
  leaves **both** attributes in place, including its own unchanged one (e.g. a script changing only
  `role` leaves Drupal's `aria-label`). Suggest: "leaves the landmark attributes in place".
- `message.js:14`: "Selector for elements that are already live regions". `[aria-live]` also matches
  `aria-live="off"`, which is not a live region. Suggest: "Selector for elements that carry
  live-region semantics or an `aria-live` attribute."
- `BRANCHES.md:46` "simplifies `message.js` without changing its behaviour" contradicts M1 (and the
  marker-only ownership record); `SUMMARY.md:73` "the marker now proves Drupal added the values"
  should read "added the landmark". Update both, or apply the M1 fix and keep the claims.

### m2 (Minor) — the changed ownership criterion has no test

- No test distinguishes the follow-up from MR head. `JsMessageTest::testLandmarkOwnership`
  (`JsMessageTest.php:193-213`) and the other ownership tests all run with `Drupal.t` output
  unchanged, so both revisions pass them. The failure mode in M1 (label differs between add and
  clear) is untested, and a future change (for example comparing against a hard-coded English string)
  would also pass.
- Suggested change: extend `JsMessageTest::testLandmarkOwnership` or `testLandmarkLifecycle`
  (`JsMessageTest.php:111-164`) with one case that changes the translation between add and clear,
  then asserts the region is gone (expected once M1 is fixed) or asserts the accepted limitation and
  references it from the `removeLandmark` docblock. Cheap to do by overriding the translator for the
  one string, e.g. after `add()`:
  `const t = Drupal.t; Drupal.t = (s, a, o) => (s === 'System messages' ? 'Meldungen' : t(s, a, o));`
  then `clear()`. Also worth one assertion that the marker is present and empty while the landmark
  is owned (`[data-drupal-messages][data-drupal-message-landmark=""]`); the suite currently only
  asserts the marker's absence after relinquish (`JsMessageTest.php:202`).

### m3 (Minor) — the marker attribute is now the only ownership record

- File: `message.js:92-94` (patch lines 100-102). If another script strips unknown `data-*`
  attributes (some hydration/sanitiser layers do), or replaces the container node while Drupal's
  `role`/`aria-label` survive, cleanup returns early and leaves the empty named region. The MR-head
  WeakMap was independent of the DOM attribute.
- Suggested change: the M1 fix (keep the WeakMap) removes this too. If the marker stays the only
  record, say so in the `addLandmark`/`removeLandmark` docblocks ("the attribute is the ownership
  record and must not be removed by other scripts") and add a test pinning the current result when
  the marker is removed before cleanup (the attributes are left).

## Check 1 — `message.js` behaviour matrix (preserved except the two cases above)

| Case from the brief | MR head (`landmarks` WeakMap + recorded label) | Follow-up | Result |
|---|---|---|---|
| Author-provided role/name/`aria-labelledby` before add | early return, no record; cleanup does nothing | early return, no marker; cleanup does nothing | preserved |
| Another script changes `role` after add | recorded role differs; leaves role+label, drops marker | `role !== 'region'`; leaves role+label, drops marker | preserved |
| Another script changes `aria-label` | recorded label differs; leaves both | fresh label differs; leaves both | preserved |
| Another script adds `aria-labelledby` | leaves both | leaves both | preserved |
| Multiple default instances | one `WeakSet`, shared container, `hasMessages()` decides | identical | preserved (`testMultipleInstances`, `JsMessageTest.php:218-231`) |
| Contextual wrappers (caller-supplied) | not in `defaultInstances`; untouched | identical | preserved (`JsMessageTest.php:151-156`, `MessageLandmarkTest.php:61-66`) |
| Empty containers / empty `.messages` groups | `hasMessages()` false → remove | identical | preserved (`JsMessageTest.php:133-136`, `169-188`) |
| Server-rendered landmarks | template sets role/name, no marker; add early-returns, cleanup no-ops | identical | preserved (`MessageLandmarkTest.php:33-59`) |
| **Language change between add and clear** | **removes the attributes (label recorded)** | **relinquishes and leaves a permanent empty region** | **regression — M1** |
| Another script removes the marker attribute | still cleans (map is independent) | cleanup skipped; empty region left | behaviour change — m3 |
| Marker value | `''` | `''` (`message.js:78`), read with `hasAttribute` (`message.js:92`) | preserved |
| Marker present on a container Drupal never marked | no record → leaves everything | treated as Drupal's and may remove default-looking role/name | theoretical only: no core template emits the marker (`status-messages.html.twig:34`), so no core path |

Also unchanged: `isMessage()` is rewritten from a block function to a short-circuit arrow
(`message.js:36-42`); it is behaviour-equivalent.

## Check 2 — test coverage map (pass, with the one gap in m2)

| Guarantee | Test method | Assertions |
|---|---|---|
| One consolidated named region | `MessageLandmarkTest::testConsolidatedLandmark` | `MessageLandmarkTest.php:36-37`, `48-49`, `55-56`, `66` |
| | `JsMessageTest::testLandmarkLifecycle` | `JsMessageTest.php:122-123`, `127`, `131`, `140` |
| | `MessageCommandTest::testMessageCommand` | `MessageCommandTest.php:42-43`, `53`, `75-76` |
| | `BigPipeMessagesTest::testMessages` | `BigPipeMessagesTest.php:61-62` |
| Server-rendered messages | `testConsolidatedLandmark` (PHP status/warning/error) | `MessageLandmarkTest.php:33-40` |
| JavaScript messages | `testLandmarkLifecycle` (add/remove/clear) | `JsMessageTest.php:121-140` |
| No empty landmark | `testLandmarkLifecycle` (last message removed), `testMessageDetection` | `JsMessageTest.php:133-136`, `169-188` |
| Author role/name preserved | `testLandmarkLifecycle` | `JsMessageTest.php:158-163` |
| Author `aria-labelledby` preserved | `testLandmarkOwnership` | `JsMessageTest.php:205-212` |
| Another script's role/name left in place, marker dropped | `testLandmarkOwnership` | `JsMessageTest.php:198-203` |
| Contextual containers untouched | `testLandmarkLifecycle`, `testConsolidatedLandmark`, `testMessageCommand` | `JsMessageTest.php:151-156`, `MessageLandmarkTest.php:61-66`, `MessageCommandTest.php:51-53` |
| Multiple `Drupal.Message` instances | `testMultipleInstances` | `JsMessageTest.php:218-231` |
| Status/alert roles kept | `testConsolidatedLandmark` (server status/warning/error groups) | `MessageLandmarkTest.php:38-40`; JS message roles come from `Drupal.theme.message` (`message.js:393-405`) and are not re-asserted by the new tests |
| No nested live region | `testConsolidatedLandmark` (JS message after existing groups) | `MessageLandmarkTest.php:42-47` |
| No focus movement on add/clear | `testLandmarkLifecycle` | `JsMessageTest.php:142-149` |
| AJAX default and alternate locations | `testMessageCommand` | `MessageCommandTest.php:33-84` |
| BigPipe delivery (JS and no-JS) | `BigPipeMessagesTest::testMessages`, `BigPipeTest::testBigPipe` (147) / `::testBigPipeNoJs` (247) through the fixture | `BigPipeMessagesTest.php:61-62`, `BigPipePlaceholderTestCases.php:108` and `:112` |
| **Language change between add and clear** | **none** | gap — m2 |

The follow-up patch touches no test or template file: the four test files' current git blob hashes
match the MR-head postimages (`JsMessageTest` `78add07ce7`, `MessageLandmarkTest` `186d29fa20`,
`MessageCommandTest` `88a19b40b0`, `BigPipeMessagesTest` `c42dd32217`), and the system template is
still `5f68ca089b`. No assertion was weakened and no test was removed.

## Check 3 — BigPipe fixture strings (pass)

`core/modules/big_pipe/tests/modules/big_pipe_test/src/BigPipePlaceholderTestCases.php:108`
(`embeddedAjaxResponseCommands[0].data`) and `:112` (`embeddedHtmlResponse`) differ from the base
file only by inserting ` role="region" aria-label="System messages"` in the opening tag; the status
group, hidden heading, text, newlines and every other space are byte-identical to the base strings
(`diff` of base vs four-patch tree shows exactly those two lines).

I checked both against the template instead of relying on the recorded test run. Using the
checkout's own Twig (`envs/issue-2942404-consolidated/vendor`), the system template and the test's
inputs (`message_list = ['status' => ['Hello from BigPipe!']]`, `status_headings['status'] = 'Status
message'`, empty `attributes`; `t`/`without` stubbed because only English and empty attributes can
occur here):

- **No-JS path:** the rendered template output is byte-for-byte identical to the template portion of
  `embeddedHtmlResponse` (the fixture prefix is the unchanged `<div data-drupal-messages-fallback ...>`
  fallback). `BigPipeTest::testBigPipeNoJs` compares it with `responseContains` (`BigPipeTest.php:359-369`).
- **JS path:** the same rendered markup JSON-encoded inside the expected AJAX command, with runs of
  whitespace collapsed, equals the fixture's `Json::encode(...)` string. That normalisation is what
  `BigPipeTest::testBigPipe` actually compares against: `elementTextContains` (`BigPipeTest.php:400`)
  reads the `<script>` text through Mink's `BrowserKitDriver::getText()`
  (`vendor/behat/mink-browserkit-driver/src/BrowserKitDriver.php:339-341`), which normalises
  whitespace. This is why the JS-path fixture has one leading space per line while the template (and
  the no-JS fixture) has the template's wider indentation; the non-tag characters are consistent with
  the template under that documented comparison, not a second markup change.

The opening tag itself is exactly the template output
(`status-messages.html.twig:34`: `<div data-drupal-messages role="region" aria-label="{{ 'System messages'|t }}">`),
in the same attribute order.

## Check 4 — performance YAML edits (pass; arithmetic not redone)

`diff` of each file against `envs/baseline-2942404-latest` changes only the `ScriptBytes:` line:

- `core/profiles/demo_umami/tests/src/FunctionalJavascript/MultipleRequestsPerformanceTestAssertions/umamiFrontAndRecipePagesAuthenticated.yml`: `60671` → `62440`
- `core/profiles/demo_umami/tests/src/FunctionalJavascript/OpenTelemetryPerformanceTestAssertions/administratorNodePage.yml`: `187160` → `188929`
- `core/profiles/standard/tests/src/FunctionalJavascript/StandardPerformanceTestAssertions/testAdmin.yml`: `155112` → `156881`

`ScriptCount`, `StylesheetCount`, `StylesheetBytes` and the cache-tag lists are unchanged in all
three. Each file's git blob still matches the patch `index` line, so the patch bundle and the tree
that ran the tests agree. The delta/tolerance arithmetic is not re-checked here; another reviewer
owns it.

## Check 5 — patch hygiene and style (pass, with the nits in m1)

- Five files only: `message.js`, the BigPipe fixture and the three YAMLs. No unrelated edit.
- The minimal patch is byte-identical to `interdiff/interdiff-mr-to-ci-fixes.diff`
  (`sha256 37ea8802…a5854`), matching `CI-FIXES.md`; the full patch is `sha256 0fdac5e8…b0cf`,
  14 files. Blob hashes chain correctly: ci-fix preimage `5fb5d12ab9` is the MR-head `message.js`
  content (postimage of `2942404-consolidated-ownership.patch`) and the new side `c8cbf9413f` is
  the file in the four-patch tree and the full-v2 patch; base `message.js` is `28c3f599f8`.
- `isMessage()` rewrite, `LIVE` de-duplication and the `message.js` deletions are
  behaviour-equivalent refactors.
- Nit: removing `LANDMARK_ROLE` leaves the literal `'region'` in two places (`message.js:76`,
  `message.js:97`). Acceptable for the byte goal, but it removes the one place that documented what
  the role means; the m1 docblock wording above covers the loss.

## What was not verified

- No DDEV, PHPUnit or browser test was run here. The test counts quoted in `CI-FIXES.md` are taken
  as recorded, not reproduced; the fixture check above was done by rendering the template with the
  checkout's Twig, not by running `BigPipeTest`.
- The M1 language-change scenario was derived from the code, not executed (it needs a browser or a
  JS harness).
- The MR head itself was not fetched; its `message.js` content was identified from the patch
  `index` hashes (ci-fix preimage = ownership-patch postimage = `5fb5d12ab9`), not from
  git.drupalcode.org.
- Performance arithmetic, recorded CI actuals and the Composer/PHP 8.6 diagnoses were not
  re-checked (owned by the other reviews).
