# Branch patches for #2942404

Extracted 2026-11-19 from https://git.drupalcode.org/issue/drupal-2942404.git with `git diff <merge-base> <branch tip>`: only the branch's own changes.
Not rebased onto current `main`. The MR on drupal.org is the source of truth.

| Patch | Source | Tip | Base | Base date and subject | Files |
|---|---|---|---|---|---|
| [`branches/2942404-11.patch`](branches/2942404-11.patch) | https://git.drupalcode.org/issue/drupal-2942404.git `2942404-11` | 7dc95633 | 66a4c78b453b | 2024-02-01 Issue #3418178 by longwave: Remove withConsecutive() in CronQueueTest | 12 |
| [`branches/2942404-mr6112.patch`](branches/2942404-mr6112.patch) | MR !6112 `.diff` (same change as above, as served by git.drupalcode.org), sha256 34184a12de5f | 7dc95633 | 66a4c78b453b | 2024-02-01 | 12 |
| [`branches/2942404-mr6058.patch`](branches/2942404-mr6058.patch) | MR !6058 `.diff` (branch `core-message-landmarks`), sha256 6829696734ec | 25e7b657 | 66a4c78b453b (applies cleanly; the MR's own base was not read) | 2024-02-01 | 10 |

The two `mr*.patch` files are evidence of the old proposals and are not listed in any variant. Interdiffs and the comparison with current main: [MR-EVALUATION.md](MR-EVALUATION.md).
| [`branches/2942404-main-region-option.patch`](branches/2942404-main-region-option.patch) | authored in the lab (no merge request), captured from `issue-2942404-latest` on 2026-11-19 with `scripts/capture-patch.mjs`; sha256 77afe7c1 | - | 92e5c3a30476 | - | 3 |
| [`branches/2942404-consolidated-region.patch`](branches/2942404-consolidated-region.patch) | authored in the lab (no merge request), captured from `issue-2942404-consolidated` on 2026-11-20 with `scripts/capture-patch.mjs`; sha256 f086cc3d | - | 92e5c3a30476 | - | 3 |

The lab-authored option for current main (After of `2942404-latest`) is [`branches/2942404-main-region-option.patch`](branches/2942404-main-region-option.patch): system, Default Admin and starterkit `status-messages.html.twig` only, no tests, based on core `92e5c3a30476`. It is not an upstream proposal.

Variant C, [`branches/2942404-consolidated-region.patch`](branches/2942404-consolidated-region.patch) (After of `2942404-consolidated`): the same three templates, but ONE `role="region"` named "System messages" on the `[data-drupal-messages]` container and the existing per-type `status`/`alert` groups and headings unchanged. Lab-authored, no tests, not an upstream proposal; not yet run in the browser (see STATUS-2026-11-20.md).
