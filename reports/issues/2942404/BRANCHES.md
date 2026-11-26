# Branch patches for #2942404

Extracted 2026-11-19 from https://git.drupalcode.org/issue/drupal-2942404.git with
`git diff <merge-base> <branch tip>`: only the branch's own changes. Not rebased onto current
`main`. The MR on drupal.org is the source of truth.

## Upstream proposals (stale against current main)

| Patch | Source | Tip | Base | Base date and subject | Files |
|---|---|---|---|---|---|
| [`branches/2942404-11.patch`](branches/2942404-11.patch) | https://git.drupalcode.org/issue/drupal-2942404.git `2942404-11` | 7dc95633 | 66a4c78b453b | 2024-02-01 Issue #3418178 by longwave: Remove withConsecutive() in CronQueueTest | 12 |
| [`branches/2942404-mr6112.patch`](branches/2942404-mr6112.patch) | MR !6112 `.diff` (same change as above, as served by git.drupalcode.org), sha256 34184a12de5f | 7dc95633 | 66a4c78b453b | 2024-02-01 | 12 |
| [`branches/2942404-mr6058.patch`](branches/2942404-mr6058.patch) | MR !6058 `.diff` (branch `core-message-landmarks`), sha256 6829696734ec | 25e7b657 | 66a4c78b453b (applies cleanly; the MR's own base was not read) | 2024-02-01 | 10 |

The two `mr*.patch` files are evidence of the old proposals and are not listed in any variant.
Interdiffs and the comparison with current main: [MR-EVALUATION.md](MR-EVALUATION.md).

## Lab-authored proposals (no merge request)

| Patch | What it is | Captured on | Base | sha256 | Files |
|---|---|---|---|---|---|
| [`branches/2942404-main-region-option.patch`](branches/2942404-main-region-option.patch) | Variant B: one `region` per message type (the 2026-11-19 comparison) | 2026-11-19 | 92e5c3a30476 | 77afe7c1 | 3 |
| [`branches/2942404-consolidated-region.patch`](branches/2942404-consolidated-region.patch) | Variant C, step 1, Twig only: one named `region` on the outer container in the system, Default Admin and starterkit templates | 2026-11-20 | 92e5c3a30476 (applies cleanly to 0387fb948f78) | f086cc3d | 3 |
| [`branches/2942404-consolidated-message-landmark.patch`](branches/2942404-consolidated-message-landmark.patch) | Variant C, step 2: `Drupal.Message` lifecycle, containment fix, Umami and `test_messages` templates, regression tests | 2026-11-26 | 0387fb948f78 | 0f4ee1eb | 7 |
| [`branches/2942404-consolidated-ownership.patch`](branches/2942404-consolidated-ownership.patch) | Variant C, step 3: ownership-safe cleanup, narrower detection, one-insertion wrapper, ownership/detection/multiple-instance/server-lifecycle tests | 2026-11-26 | 0387fb948f78 | 6cb14255 | 4 |
| [`branches/2942404-consolidated-full.patch`](branches/2942404-consolidated-full.patch) | The full squashed Variant C proposal: the 10 files of all three steps | 2026-11-26 | 0387fb948f78 | 162da457 | 10 |
| [`interdiff/interdiff-consolidated-v1-to-v2.diff`](interdiff/interdiff-consolidated-v1-to-v2.diff) | Historical interdiff from the Twig-only patch to the two-patch proposal | 2026-11-26 | Twig-only Variant C | 0f4ee1eb | 7 |
| [`interdiff/interdiff-consolidated-v2-to-final.diff`](interdiff/interdiff-consolidated-v2-to-final.diff) | The change from the two-patch proposal to the final three-patch proposal; identical in content to step 3 | 2026-11-26 | Two-patch Variant C | 6cb14255 | 4 |

Variant B left out tests. Variant C keeps the Twig-only step and adds the JavaScript lifecycle,
ownership-safe cleanup, detection, wrapper handling and tests.

Final production changes are 201 insertions / 11 deletions in `core/misc/message.js` and five
templates. Test changes are 203 insertions in four test files. Total: 10 files, 404 insertions,
11 deletions.

The full patch and the three-patch stack were applied to separate throwaway worktrees of pristine
`0387fb948f78`; all 10 resulting files had identical SHA-256 hashes. The stack also passes
`node tools/compare/setup.mjs 2942404-final --check-patches`.

## CI follow-up (2026-11-26)

MR !17968 (`2942404-consolidated-landmark`, head `b11a4441`) failed CI on the two BigPipe
status-message expectations and three performance budgets. The follow-up corrects the two
fixture strings, updates the three `ScriptBytes` centres by the measured compact delta, simplifies
`message.js` without changing its behaviour, and adds a language-change regression test. Tests and
measurements: [CI-FIXES.md](CI-FIXES.md).

| Patch | What it is | Base | sha256 | Files |
|---|---|---|---|---|
| [`branches/2942404-ci-fixes.patch`](branches/2942404-ci-fixes.patch) | Minimal diff against the MR head | `b11a4441276acd732753ca4c2de6922c30728a75` | 14f1f5d3 | 6 |
| [`branches/2942404-consolidated-full-v2.patch`](branches/2942404-consolidated-full-v2.patch) | Full squashed proposal, base plus the MR plus the follow-up | `0387fb948f78` | a5cb02b0 | 14 |
| [`interdiff/interdiff-mr-to-ci-fixes.diff`](interdiff/interdiff-mr-to-ci-fixes.diff) | The follow-up, same bytes as the minimal patch | MR head | 14f1f5d3 | 6 |

Full v2 is 415 insertions and 16 deletions in 14 files: the MR's 10 files plus the BigPipe
fixture, three performance assertion files and one added test method. The minimal diff is 41
insertions and 35 deletions; its `message.js` part adds a `LIVE` selector constant and flattens
`isMessage`, and keeps the `WeakMap` ownership record. The full
patch applies to pristine `0387fb948f78`; the minimal patch applies to the MR head. Both
checks and the 14-file SHA-256 comparison are recorded in [CI-FIXES.md](CI-FIXES.md).

None of these is an upstream proposal and none has been posted to drupal.org.
