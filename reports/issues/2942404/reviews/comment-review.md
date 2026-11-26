# Comment review: #2942404, MR !17968

Reviewer: `comment-reviewer` (fresh context). Date: 2026-11-26.
Scope: audit of [ISSUE-COMMENT-DRAFT.md](../ISSUE-COMMENT-DRAFT.md) against the recorded evidence, read-only except for this file.
Checked against [EVIDENCE.md](../EVIDENCE.md), [CI-FIXES.md](../CI-FIXES.md), [SUMMARY.md](../SUMMARY.md), [BRANCHES.md](../BRANCHES.md) and
[lint/2026-11-26-2942404-final-after.md](../lint/2026-11-26-2942404-final-after.md).

## Verdict: NEEDS EDIT

Do not post the draft as it stands. It passes the form checker (176 words) but has one factual error and one
misleading statement about a follow-up patch that is not pushed. Two sentences must change; two more should.

## Form check (quoted)

`node scripts/check-draft.mjs 2942404` exited 0:

```text
reports/issues/2942404/ISSUE-COMMENT-DRAFT.md: 176 words, follows the rules
  Form only: check every sentence against EVIDENCE.md, and rewrite it in your own words before posting.
```

Form rules that pass: 176 words (limit 180); longest sentence 20 words (limit 25); no Markdown headers; no
editorial flourishes, formula phrasing, em dashes or emoji; no AI model/vendor/tool is named; the last line is
exactly `Generated with the help of an LLM.` (the only LLM reference). Browser and screen-reader names in the
evidence sentences are not AI tool names and the checker does not flag them.

## Required corrections

| # | Draft sentence | Problem | Exact suggested wording | Recorded basis |
|---|---|---|---|---|
| S1 | "Re-tested MR !17968 at `b11a4441` with a follow-up patch." | The follow-up is local and not pushed; the MR head is still `b11a4441`. The sentence reads as if the MR at that commit now contains the follow-up. | "Tested MR !17968 head `b11a4441` with an unpushed follow-up patch." | [CI-FIXES.md](../CI-FIXES.md#L10-L11) records the MR head tested as `b11a4441`; [CI-FIXES.md](../CI-FIXES.md#L206) says "The MR was not pushed and no comment was posted." A read-only `git ls-remote` on the issue fork (2026-11-26) returns `b11a4441276acd732753ca4c2de6922c30728a75` for `refs/heads/2942404-consolidated-landmark`; the local `2942404-consolidated-landmark` branch is at `92ef4c38`, the earlier shallow-clone commit, not pushed. [BRANCHES.md](../BRANCHES.md#L49-L53) lists the follow-up as a local patch against that head. |
| S5 | "Warnings stay `role="alert"`; other types stay `role="status"`." | False for errors: errors also keep `role="alert"`. Only status messages keep `role="status"`. | "Warnings and errors stay `role="alert"`; status messages stay `role="status"`." | The final Chromium acceptance check `errorIsAlert: true` on After ([final Chromium run](../playwright/2026-11-26T03-33-47-385Z-chromium-light-1280x900/SUMMARY.md#L29)); the final VoiceOver transcript reads "Warning message alert" and "Error message alert" ([final VoiceOver run](../screenreader/2026-11-26T06-39-33-642Z/SUMMARY.md#L143-L152)); the earlier run records the inner groups as `status`, `alert`, `alert` ([EVIDENCE.md](../EVIDENCE.md#L198-L201)); [SUMMARY.md](../SUMMARY.md#L11-L13) states "`role="alert"` for errors and warnings, `role="status"` for other types". The patch itself renders `role="{{ type in ['error', 'warning'] ? 'alert' : 'status' }}"` ([2942404-consolidated-region.patch](../branches/2942404-consolidated-region.patch)) and `type === 'error' || type === 'warning' ? 'alert' : 'status'` ([2942404-ci-fixes.patch](../branches/2942404-ci-fixes.patch)). |

## Recommended edits

These are supported as written but ambiguous, or slightly overstated. They are not the reason for NEEDS EDIT.

| # | Draft sentence | Issue | Suggested wording |
|---|---|---|---|
| S16 | "Earlier Chromium and VoiceOver runs recorded the same landmark." | Supported, and "Earlier" does **not** claim a fresh run. But the runs predate the CI follow-up's `message.js` change; the wording does not say which code they covered, so a reader can misread it as evidence for the final tested tree. No browser or screen-reader run was made on the follow-up code ([CI-FIXES.md](../CI-FIXES.md#L200-L205); the full BigPipe run was "before the JavaScript optimization", [CI-FIXES.md](../CI-FIXES.md#L68)). | "Earlier Chromium and VoiceOver runs, before the follow-up patch, recorded the same landmark." |
| S14 | "PHPUnit passes ... `BigPipeMessagesTest`, and the two BigPipe tests." | "The two BigPipe tests" is ambiguous next to `BigPipeMessagesTest`; the record names `BigPipeTest::testBigPipe` and `BigPipeTest::testBigPipeNoJs` ([CI-FIXES.md](../CI-FIXES.md#L156)). | "PHPUnit passes `MessageLandmarkTest`, `JsMessageTest`, `MessageCommandTest`, `BigPipeMessagesTest`, `BigPipeTest::testBigPipe` and `BigPipeTest::testBigPipeNoJs`." |
| S15 | "Core lint passes." | Supported (PASS, exit 0). Slightly broad: the lint run applies core's code checks only to the changed files (14), not the whole codebase ([lint report](../lint/2026-11-26-2942404-final-after.md#L7-L9), [lint report](../lint/2026-11-26-2942404-final-after.md#L27-L41)). | Optional, but costs words: "Core's checks on the changed files pass." |
| S10 | "The three performance budgets move by the measured compact delta of 1,769 bytes" | Supported: the three `ScriptBytes` centres each move by exactly +1,769 and the tolerance is unchanged. "Performance budgets" is loose; the files hold `ScriptBytes` expected values. The sentence does not claim a suite pass. | Optional: "The three `ScriptBytes` expected values move by the measured compact delta of 1,769 bytes; the 2,000-byte tolerance is unchanged." |

## Sentence-by-sentence support table

Statuses: **Supported** = a recorded result in EVIDENCE.md or CI-FIXES.md, or the run record those files link,
supports the sentence; SUMMARY.md is cited only to corroborate design facts and is not the primary record.
**Supported, ambiguous** = true as recorded but the wording can be misread; see the edits. **NOT SUPPORTED** =
contradicted by the record.

| # | Sentence (logical) | Status | Recorded basis |
|---|---|---|---|
| S1 | "Re-tested MR !17968 at `b11a4441` with a follow-up patch." | Supported, ambiguous (required edit) | MR head `b11a4441` recorded, follow-up applied locally ([CI-FIXES.md](../CI-FIXES.md#L10-L14), [CI-FIXES.md](../CI-FIXES.md#L27-L39), [CI-FIXES.md](../CI-FIXES.md#L206)). The MR was not pushed; the follow-up is not part of the MR. |
| S2 | "The change adds one region named "System messages" to the default messages container." | Supported | Final browser and reader runs expose one region "System messages" ([EVIDENCE.md](../EVIDENCE.md#L38-L43)); the container is `[data-drupal-messages]` ([SUMMARY.md](../SUMMARY.md#L17-L19)). |
| S3 | "The region is not a live region." | Supported | The patch adds only `role="region"` and `aria-label` to the container, and its own comment says "The region is not a live region" ([2942404-consolidated-region.patch](../branches/2942404-consolidated-region.patch), [SUMMARY.md](../SUMMARY.md#L18)); the final Guidepup run exposes the container as `region, System messages` with the inner roles unchanged ([EVIDENCE.md](../EVIDENCE.md#L41-L43)). |
| S4 | "Server-rendered and JavaScript messages get the same landmark." | Supported | The final Chromium run's After acceptance checks include `javascriptOnlyMessagesHaveLandmark: true`, `mixedMessagesHaveOneLandmark: true` and `oneConsolidatedLandmarkOnServerPages: true` ([final Chromium run](../playwright/2026-11-26T03-33-47-385Z-chromium-light-1280x900/SUMMARY.md#L29)); the final Guidepup run wraps server and JavaScript messages in `region, System messages` ([EVIDENCE.md](../EVIDENCE.md#L41-L43)). |
| S5 | "Warnings stay `role="alert"`; other types stay `role="status"`." | **NOT SUPPORTED** | Contradicted for errors: the final Chromium After check `errorIsAlert: true` ([final Chromium run](../playwright/2026-11-26T03-33-47-385Z-chromium-light-1280x900/SUMMARY.md#L29)); the final VoiceOver transcript reads "Warning message alert" and "Error message alert" ([final VoiceOver run](../screenreader/2026-11-26T06-39-33-642Z/SUMMARY.md#L143-L152)); the earlier run records `status`, `alert`, `alert` ([EVIDENCE.md](../EVIDENCE.md#L198-L201)); roles are `alert` for errors and warnings ([SUMMARY.md](../SUMMARY.md#L11-L13)). |
| S6 | "`Drupal.Message` removes only attributes it still owns." | Supported | Ownership tests pass on the final code; the cleanup leaves another script's role/name change in place ([EVIDENCE.md](../EVIDENCE.md#L57-L66), [SUMMARY.md](../SUMMARY.md#L67-L73), [CI-FIXES.md](../CI-FIXES.md#L152-L153)). |
| S7 | "Contextual wrappers and author roles and names are left alone." | Supported | The final Chromium After checks include `customWrapperUnchanged: true`, `contextualWrapperInsideContainerUnchanged: true` and `authorSemanticsPreserved: true` ([final Chromium run](../playwright/2026-11-26T03-33-47-385Z-chromium-light-1280x900/SUMMARY.md#L29)); the ownership tests pass on the final code ([EVIDENCE.md](../EVIDENCE.md#L57-L66)). |
| S8 | "The two BigPipe expectations now include the new attributes." | Supported | Both fixture strings now expect the new opening tag, in `embeddedAjaxResponseCommands[0].data` and `embeddedHtmlResponse` ([CI-FIXES.md](../CI-FIXES.md#L43-L59)). |
| S9 | "`message.js` no longer keeps a WeakMap or repeats the live-region selector." | Supported | The follow-up removes the `landmarks` WeakMap, the `LANDMARK_ROLE` constant and the duplicated live-region selector ([CI-FIXES.md](../CI-FIXES.md#L111-L114)); the patch shows `-const landmarks = new WeakMap();` and a single `LIVE` selector ([2942404-ci-fixes.patch](../branches/2942404-ci-fixes.patch)). |
| S10 | "The three performance budgets move by the measured compact delta of 1,769 bytes; the 2,000-byte tolerance is unchanged." | Supported | Only the `ScriptBytes` centre moves, by the measured compact delta (+1,769); the tolerance function is unchanged ([CI-FIXES.md](../CI-FIXES.md#L127-L136), [EVIDENCE.md](../EVIDENCE.md#L318-L322)). The patch shows 187,160→188,929, 60,671→62,440 and 155,112→156,881 ([2942404-consolidated-full-v2.patch](../branches/2942404-consolidated-full-v2.patch)). |
| S11 | "The performance suites skip here because they require MySQL." | Supported | `PerformanceTestBase` skips core performance tests when the database is not MySQL; the lab runs MariaDB 11.8 ([CI-FIXES.md](../CI-FIXES.md#L116-L118), [CI-FIXES.md](../CI-FIXES.md#L189-L191), [EVIDENCE.md](../EVIDENCE.md#L318-L319)). |
| S12 | "The Composer job failed on a network timeout downloading masterminds/html5." | Supported | "Timeout connecting to `api.github.com` while downloading `masterminds/html5`" ([CI-FIXES.md](../CI-FIXES.md#L180-L181)). |
| S13 | "The PHP 8.6 unit jobs fail on spl_object_hash() and extension parsing; this patch changes no production PHP." | Supported | The 8.6 failures name `spl_object_hash()` deprecations and extension parsing tests; only JS test classes are PHP ([CI-FIXES.md](../CI-FIXES.md#L182-L188)). Verified against the patch file list: the only PHP files are test/fixture files. |
| S14 | "PHPUnit passes `MessageLandmarkTest`, `JsMessageTest`, `MessageCommandTest`, `BigPipeMessagesTest`, and the two BigPipe tests." | Supported, ambiguous (recommended edit) | All run on the final tree: 1 test; 5 tests/46 assertions; 2 tests/61 assertions; 1 test/3 assertions; the two BigPipe tests 2 tests/90 assertions ([CI-FIXES.md](../CI-FIXES.md#L146-L156), [EVIDENCE.md](../EVIDENCE.md#L48-L56)). |
| S15 | "Core lint passes." | Supported, slightly broad (recommended edit) | PASS, exit 0, CSpell/PHPStan/PHPCS/ESLint/Twig CS fixer ([lint report](../lint/2026-11-26-2942404-final-after.md#L5-L23)); on the changed files only ([lint report](../lint/2026-11-26-2942404-final-after.md#L90-L92)). |
| S16 | "Earlier Chromium and VoiceOver runs recorded the same landmark." | Supported, ambiguous (recommended edit) | Final Chromium run 03:33Z and VoiceOver run 06:39Z expose the region ([EVIDENCE.md](../EVIDENCE.md#L38-L43), [EVIDENCE.md](../EVIDENCE.md#L75-L90)); both predate the follow-up's JavaScript change ([CI-FIXES.md](../CI-FIXES.md#L68), [CI-FIXES.md](../CI-FIXES.md#L200-L205)). It does not claim a fresh run. |
| S17 | "Human rotor navigation, other themes, NVDA and JAWS were not tested." | Supported | Not verified: person-used screen readers, keyboard pass, Stark/starterkit/Umami in a browser ([EVIDENCE.md](../EVIDENCE.md#L244-L253)); no human has used the landmark rotor; NVDA/JAWS not tested ([SUMMARY.md](../SUMMARY.md#L195-L203)). |
| S18 | "No conformance claim is made." | Scope statement; consistent | "It does not establish ... general conformance" ([SUMMARY.md](../SUMMARY.md#L167-L169)). Not itself an evidence claim. |
| — | "Generated with the help of an LLM." | Exact | The required disclosure line, verbatim; checker confirms. |

## Absence-of-claims checks (all pass)

- No local performance-suite pass is claimed: the draft says the suites skip because they require MySQL.
- No green pipeline is claimed: the draft records two failing CI job groups (Composer, PHP 8.6).
- No fresh axe or VoiceOver run on the follow-up/final code is claimed. The only axe result in the record is 0→0
  ([EVIDENCE.md](../EVIDENCE.md#L152)) and the draft does not cite it; "Earlier" limits S16.
- No human review is claimed: the draft says human rotor navigation, other themes, NVDA and JAWS were not tested,
  and it carries the disclosure line.
- No claim that the MR was pushed or updated: correct in substance (nothing was pushed), but S1 omits "unpushed",
  so it can be misread; see the required edit.

## Factual cross-checks

- **1,769 bytes:** compact `message.js` 2,765 → 4,534 = +1,769 ([EVIDENCE.md](../EVIDENCE.md#L309), [CI-FIXES.md](../CI-FIXES.md#L105-L109));
  all three `ScriptBytes` deltas are +1,769 (188,929−187,160, 62,440−60,671, 156,881−155,112). Consistent.
- **Three `ScriptBytes` values:** the patch has 188,929 / 62,440 / 156,881; [CI-FIXES.md](../CI-FIXES.md#L132-L136)
  and [EVIDENCE.md](../EVIDENCE.md#L320-L322) agree. The draft states only the delta, which is consistent.
- **Test names and counts:** names match; counts are 1; 5/46; 2/61; 1/3; and 2/90 for `BigPipeTest::testBigPipe` +
  `::testBigPipeNoJs`. The draft gives no counts, so there is no conflict; only "the two BigPipe tests" is ambiguous.
- **Composer wording:** accurate ([CI-FIXES.md](../CI-FIXES.md#L180-L181)).
- **PHP 8.6 wording:** accurate ([CI-FIXES.md](../CI-FIXES.md#L182-L188)).
- **"changes no production PHP":** verified from the full 14-file patch: PHP files are
  `BigPipePlaceholderTestCases.php`, `BigPipeMessagesTest.php`, `MessageCommandTest.php`, `JsMessageTest.php` and
  `MessageLandmarkTest.php` (all test/fixture code); production changes are `core/misc/message.js` and five Twig
  templates ([2942404-consolidated-full-v2.patch](../branches/2942404-consolidated-full-v2.patch)).
- **MR head:** `git ls-remote` on the issue fork returns `b11a4441` for the MR branch; the follow-up patch is not
  in it ([CI-FIXES.md](../CI-FIXES.md#L206)).

## Evidence inconsistencies noticed (not draft defects; fix the reports before relying on them)

1. **Lint file count.** [EVIDENCE.md](../EVIDENCE.md#L44-L46) and [SUMMARY.md](../SUMMARY.md#L133-L135) say 10 files;
   the lint report says "Files checked (14)" ([lint report](../lint/2026-11-26-2942404-final-after.md#L27-L41)) and
   [CI-FIXES.md](../CI-FIXES.md#L174-L176) says 14 files (all four patches). The lint report and CI-FIXES are
   consistent; the two summaries are stale.
2. **WeakMap description.** [SUMMARY.md](../SUMMARY.md#L67-L73) says the final code keeps a module-level `WeakMap`;
   [CI-FIXES.md](../CI-FIXES.md#L111-L114) says the follow-up removes the `landmarks` WeakMap, and the patch shows
   the removal. The draft's S9 follows CI-FIXES (correct for the follow-up code); SUMMARY needs a pre/post-follow-up
   distinction.
3. **"Final" labeling.** [EVIDENCE.md](../EVIDENCE.md#L9-L20) labels the three-patch stack "final", but the browser
   and screen-reader runs (03:33Z, 03:34Z, 06:39Z) are on that three-patch code, while the PHPUnit "final tree" and
   lint results are on the four-patch code ([CI-FIXES.md](../CI-FIXES.md#L12-L13), [lint report](../lint/2026-11-26-2942404-final-after.md#L14)).
   This is why S16 needs the "before the follow-up patch" qualifier. The draft is careful; the evidence file's
   "final" label is not.

## Suggested revision (form-checked)

This keeps the draft's facts, applies the two required edits and the S14/S16 clarity edits, and trims S12 to stay
inside the cap. It was checked with the same `check-draft.mjs` rules through a process-substitution path (no file
written): **178 words, follows the rules**.

```text
Tested MR !17968 head `b11a4441` with an unpushed follow-up patch. The change adds one region named "System messages" to the default messages container. The region is not a live region.

Server-rendered and JavaScript messages get the same landmark. Warnings and errors stay `role="alert"`; status messages stay `role="status"`. `Drupal.Message` removes only attributes it still owns. Contextual wrappers and author roles and names are left alone.

The two BigPipe expectations now include the new attributes. `message.js` no longer keeps a WeakMap or repeats the live-region selector. The three performance budgets move by the measured compact delta of 1,769 bytes; the 2,000-byte tolerance is unchanged. The performance suites skip here because they require MySQL. The Composer job timed out downloading masterminds/html5. The PHP 8.6 unit jobs fail on spl_object_hash() and extension parsing; this patch changes no production PHP.

PHPUnit passes `MessageLandmarkTest`, `JsMessageTest`, `MessageCommandTest`, `BigPipeMessagesTest`, `BigPipeTest::testBigPipe` and `BigPipeTest::testBigPipeNoJs`. Core lint passes. Earlier Chromium and VoiceOver runs, before the follow-up patch, recorded the same landmark. Human rotor navigation, other themes, NVDA and JAWS were not tested.

No conformance claim is made.

Generated with the help of an LLM.
```

## Limits of this review

- Read-only audit: no DDEV tests, browser runs, screen-reader runs or CI jobs were executed; no comment was posted,
  pushed or committed.
- The MR head was confirmed with a read-only `git ls-remote` on 2026-11-26; no fetch or checkout was made.
- This review checks the draft against the recorded files only. The final draft still needs the human's own rewrite
  and their decision to post, per core's AGENTS.md.
