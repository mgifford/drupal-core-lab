# Branch patches for #3466040

There is an existing upstream MR (!9088), but this packet evaluates a lab-authored revision of the supplied 2026-11-23 proposal. The revision is deliberately smaller: it keeps the existing jQuery UI dialog layout and honors the requested percentage height instead of replacing it with `auto`.

The supplied proposal is preserved for provenance. `3466040-resubmission.patch` is the full patch to apply to core `main` at `97c6ff8b2534`; `3466040-resubmission.interdiff` is the review diff from the supplied proposal to this revision.

| Patch | Source | Tip | Base | Base date and subject | Files |
|---|---|---|---|---|---|
| [`branches/3466040-supplied-proposal.patch`](branches/3466040-supplied-proposal.patch) | supplied local proposal, preserved unchanged | - | reconstructed baseline, not a full checkout | - | 3 |
| [`branches/3466040-minimal-resize.patch`](branches/3466040-minimal-resize.patch) | intermediate lab iteration; superseded by the resubmission | - | 97c6ff8b2534 | - | 2 |
| [`branches/3466040-resubmission.patch`](branches/3466040-resubmission.patch) | authored in the lab, captured from `issue-3466040-latest`; sha256 42460a17 | - | 97c6ff8b2534 | - | 2 |
| [`branches/3466040-resubmission.interdiff`](branches/3466040-resubmission.interdiff) | supplied proposal → resubmission; review artifact, not a standalone core patch | - | supplied proposal → 97c6ff8b2534 | - | 3 |
