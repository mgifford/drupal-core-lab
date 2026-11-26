# Summary: #3606655 — independent review of MR !16432 at `170be9e3`

**Verdict: not ready for further review yet.** The code in this revision is internally consistent and its
tests pass, but the merge request no longer implements the design the issue summary describes, and 17 review
threads from August and September are still open. Both are decisions for the issue's maintainers, not defects a
reviewer can patch around.

Reviewed: core `ced1e2636622be0c1197a7cadeba13a7c9bbc8a8` (2026-11-04, `12.0-dev`) + MR head
`170be9e30054dc7e7477465e1bc9b9bdd648ef66` (2026-11-05). Patch sha256 `04507c78…`. Details: `BRANCHES.md`.

## What the review found

1. **The issue summary and the MR disagree about the mechanism (blocker).** The summary asks for
   `data-color-scheme` to carry the stored value, a `color_scheme` Twig variable, and a theme capability
   declaration gating both the attribute and a cache context. The MR renders `data-color-scheme="auto"` for
   every account and theme, carries the preference in a `DrupalColorScheme` cookie, and overrides the attribute
   with an inline head script. That switch is recorded only in the MR description (diff version 32,
   2026-09-02) — no issue comment covers it. An independent reviewer cannot tell what is agreed.
2. **17 resolvable review threads are unresolved (blocker):** amateescu, goba, longwave ×14 and poker10, all
   older than the tip. Two of them are about the current design (cookie consent, the script on every page); one
   is the update-hook number.
3. **Concrete, small defects:** `user_update_11401()` is numbered for 11.4 while `main` is `12.0-dev`; a
   docblock points at `ColorSchemeCookieSubscriberTest`, which does not exist; upgraded databases get `NULL`
   rather than `auto` in the new column (the getter hides it, direct field reads do not).
4. **What is solid:** the pipeline is green including PHPStan level 3; `UserColorSchemeFormTest` (12 tests,
   151 assertions) and `ColorSchemeCookieTest` (5 tests, 58 assertions) pass; `scripts/lint.mjs` is PASS; the
   cookie design showed no cross-account leakage and no cache fragmentation in the live matrix; the radio
   control is accessible (group name, description, keyboard, focus, axe clean in light/dark/forced colours).

The cookie design is a coherent answer to the cache-fragmentation objection (#60, #65, #73). It is not
defective in the cases tested. It is simply not the design in the summary, and the cost it trades away — a
preference that never appears in server-rendered HTML and does not work without JavaScript — is a scope
decision that has not been recorded or reviewed on the issue.

## Read in this order

| File | What it holds |
|---|---|
| `EVIDENCE.md` | Results with exact revisions, environments, findings F1–F6, and what was not verified |
| `BRANCHES.md` | Both patch revisions, the pipeline state, assignment state, unresolved-thread count |
| `CACHE-CONTEXT.md` | Cache matrix: observed contexts, headers, hit/miss, correctness limits |
| `REPRODUCE.md` | How to rebuild the pair and re-run every probe |
| `tests/results.json` | Every check with passed / failed / passed-with-caveat / not-attributable / untested |
| `tests/*.json`, `playwright/*` | Raw output and screenshots |
| `ISSUE-COMMENT-DRAFT.md` | A short comment for a person to review; it is **not posted** |

## Not verified, and not claimed

No person has done the keyboard or screen-reader pass. No VoiceOver/NVDA session was run. No performance
measurement was made: cache *correctness* was tested, resource consumption was not, and the host was running
13+ DDEV projects, so timings would be noise. Only the pinned core was built; the patch applies to current
`main` (`a48087f2`) but was not run there. The PHP 8.6 job failures in the pipeline are `allow_failure` and
their logs need authentication, so they are not attributed. The legacy dark-mode data migration was not
exercised because the test database had no legacy rows.

## Suggested next steps (for the issue owners, not done here)

1. Update the issue summary to the cookie design, or decide to return to the server-rendered design. Until
   then, further review is reviewing the wrong specification.
2. Resolve or answer the open threads, especially cookie consent and the script on every page.
3. Renumber the update hook for `12.0-dev`; remove or add the missing test reference; decide whether the
   update hook should backfill `auto`.

Nothing was posted, pushed, or changed on drupal.org. The issue status was not touched.
