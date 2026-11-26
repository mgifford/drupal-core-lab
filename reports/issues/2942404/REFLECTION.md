# Reflection: #2942404 CI follow-up, 2026-11-26

**DRAFT, AI-assisted. Not reviewed by a person.**

## What worked

- Three fresh-context reviewers found what my own review missed: a real behaviour change in the
  landmark ownership cleanup, a factual error in the issue comment (errors also keep
  `role="alert"`), and the provenance and copy-count gaps in the performance arithmetic.
- The diff reviewer's first suggested fix — keep the recorded label — was the right one. Restoring
  the `WeakMap` cost 103 compact bytes and preserved behaviour. The smaller optimisation was not
  worth the regression.
- The comment reviewer's sentence-by-sentence support table made the draft corrections
  unambiguous, including the unpushed-follow-up disclosure.
- The performance reviewer reproduced every compact size and explained the aggregation path. Its
  caveats became part of the report rather than being argued away.

## What I would do differently

- Do not call a simplification "no behaviour change" without a test for the state it removes. The
  translation-change case was not covered; `testLandmarkNameChange` now covers it.
- Record the provenance of CI actuals before using them. The three values were reported, not
  observed, and the report now says so.
- Treat the number of aggregates carrying `message.js` as an explicit assumption (`n = 1`), not an
  implicit one.
- Keep disk headroom. The host filled, Docker remounted its VM disk read-only, and two reviewers
  could not write their findings. Retrying their writes was cheaper than restarting the reviews.
- Push from a clean temporary worktree. The shared lab tree had many other sessions' uncommitted
  changes.

## Residual risks

The three performance suites still cannot run in the lab (MySQL required), ten Umami fixtures keep
only 122 bytes of tolerance margin, and no person has reviewed the evidence.

Generated with the help of an LLM.
