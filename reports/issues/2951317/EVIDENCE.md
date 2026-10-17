# Evidence for #2951317

DRAFT. Prepared October 17, 2026, without Docker or DDEV.

| Check | Result |
|---|---|
| Pinned core | `ad11ba71c0f09b856e45dfdb8db155b5a588712d` |
| Main used for applicability | `dbfce851242d5b082adb8ed14634b4bc9cce374b` |
| MR tip | `ab7ab046f920f7a5a29704888976e56b6a36514a` |
| Ordered Before and After stack application | Both apply cleanly on pinned and current main |
| Drupal runtime, keyboard, screen reader, axe | NOT TESTED |
| GitLab review threads | Unread: API returned HTTP 401 for !15536, !3092, !7341 |

- `branches/2951317-shared-fixture.patch`: SHA-256 `0b6ee870ae17a6caa52004ca3d60e90b592d43039cb18557b508f8eb7b945b27`.
- `branches/2951317-radios-element-missing-required-attr.patch`: SHA-256 `27550bbdd14990cfe34b3180fe9ccd49472ccb9ab93d4d795b394f0f01d39f28`.

## Preparation checks

- `node --check tools/playwright/evaluate-2951317.mjs`: passed.
- New registered viewer probes: all ten (five per variant) pass the repository probe validator.
- Focused Coder prompt, patch-state, and AI-usage tests: 23 passed.
- `coder-prompt.mjs 2951317-pinned --check`, documentation links (423), and generated cloud catalog: passed.
- Full checks are **not green**. The full lab tests initially lacked js-yaml (installed, focused tests then passed). The hostname test treats any HTTP response as reachability; this environment returns HTTP 502 for `lab-no-such-host.invalid`, so that existing test fails. Direct issue-pack tests: 155 passed, one skipped, one failed on the pre-existing `3615469-pinned` probe containing assignments/semicolons. No unrelated tool or probe was changed.
- The selftest wrapper did not provide complete unit-test totals; direct test runs above supply the available detail. Its transient generated-catalog drift came from a synthetic test variant left by an interrupted setup test. Test fixtures were removed and the catalog rechecked successfully.
- PHP syntax/core lint unavailable: no PHP runtime. Drupal, browser, synthetic Guidepup, and manual checks remain NOT TESTED.
