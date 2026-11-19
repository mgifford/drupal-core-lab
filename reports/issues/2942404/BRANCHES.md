# Branch patches for #2942404

Extracted 2026-11-19 from https://git.drupalcode.org/issue/drupal-2942404.git with `git diff <merge-base> <branch tip>`: only the branch's own changes.
Not rebased onto current `main`. The MR on drupal.org is the source of truth.

| Patch | Source | Tip | Base | Base date and subject | Files |
|---|---|---|---|---|---|
| [`branches/2942404-11.patch`](branches/2942404-11.patch) | https://git.drupalcode.org/issue/drupal-2942404.git `2942404-11` | 7dc95633 | 66a4c78b453b | 2024-02-01 Issue #3418178 by longwave: Remove withConsecutive() in CronQueueTest | 12 |
| [`branches/2942404-mr6112.patch`](branches/2942404-mr6112.patch) | MR !6112 `.diff` (same change as above, as served by git.drupalcode.org), sha256 34184a12de5f | 7dc95633 | 66a4c78b453b | 2024-02-01 | 12 |
| [`branches/2942404-mr6058.patch`](branches/2942404-mr6058.patch) | MR !6058 `.diff` (branch `core-message-landmarks`), sha256 6829696734ec | 25e7b657 | 66a4c78b453b (applies cleanly; the MR's own base was not read) | 2024-02-01 | 10 |

The two `mr*.patch` files are evidence of the old proposals and are not listed in any variant. Interdiffs and the comparison with current main: [MR-EVALUATION.md](MR-EVALUATION.md).
