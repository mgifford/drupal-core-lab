# Status of #3083103 (snapshot 2026-11-25)

Re-check everything on drupal.org before relying on it; statuses go stale.

| Field | Value |
|---|---|
| Issue | https://www.drupal.org/project/drupal/issues/3083103 |
| Title | Programmatically associate error messages with inputs |
| Status | Needs work (13); Normal; Feature request; forms system; `main` |
| Assignee | none |
| Last changed | 2026-08-06 (comment #84, the three files in this folder) |
| Comments | 84 |
| Patches | 3 with provenance in `branches/` + 1 without (base reconstructed 2026-11-25) — see [BRANCHES.md](BRANCHES.md) |
| MRs | !15692 opened `ed60e948` (2026-05-07); !7080 opened `32d4ece4` (2026-04-15); !1063 opened `0fddb21c` (2026-03-24) |
| Related | #3557245 (active, MR !16520), #3243173, #3088245, #2848307, #3125018 |
| Review threads | not read — GitLab API answers HTTP 401 |

## In this lab

Built and measured 2026-11-26: one shared baseline plus two After states (MR !15692 ported, August 6 proposal
ported from 11.4.x). Verdict for both: `reproduced-not-fixed` — every association dangles in `default_admin`.
See [EVIDENCE.md](EVIDENCE.md) and [INDEPENDENT-COMPARISON.md](INDEPENDENT-COMPARISON.md).
Nothing has been posted to drupal.org or GitLab. The four original patches are unchanged.
