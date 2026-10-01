# AS-OACR-001 Public Review Guide

> **Review status:** Public review draft. Not issued, signed, or approved by the
> Drupal Association, the Drupal Core Leadership Team, Mike Gifford, GSA, or
> Zivtech as an Accessibility Conformance Report (ACR).
>
> **Review-package maintainer:** Alex Urevick-Ackelsberg (`@AlexU-A`). The
> OpenACR's official author, feedback owner, and issuer remain unresolved.

## The short version

This package asks Mike Gifford to review the stated method, internal
evidence-to-outcome rationale, OpenACR mapping, and proposed Drupal issue
follow-ups from one bounded test of a local Drupal 11.4.4 Standard installation.
It does not claim to evaluate Drupal generally. The evaluation found 32 passed,
eight failed, and 15 inapplicable Web Content Accessibility Guidelines (WCAG)
2.2 Level A and AA criteria across the frozen sample. Nine findings support the
failures.

The full private evidence corpus remains in local custody. This pull request
includes the report-level evidence spine, outcome map, findings, public-review
OpenACR draft, and issue-reconciliation drafts. It excludes screenshots, browser
traces, accessibility trees, raw automated output, the local Drupal build, and
operational authorization records. Those exclusions prevent this pull request
from serving as an independent re-performance of the evaluation; they do not
change the recorded outcomes.

## Where the pilot stands

| Area | Current state | What that does not mean |
|---|---|---|
| Phase 0 community review | Mike merged `mgifford/drupal-core#57` after commenting `Excellent. Thanks!` | No Drupal Association, Drupal Core Leadership Team, issuer, evaluation, or publication approval |
| Collector | Fixture-only collection, profiling, schema admission, cleanup, and provenance controls are implemented | No authority for another live request |
| Live profile demonstration | One authorized action returned `unavailable` / `schema_invalid`; response bytes were deleted; no profile or candidate was created | No reusable authorization and no live issue snapshot |
| Profile remediation | Corrected source admission is preserved in the archived `zivtech/drupal-openacr-pilot` source at `f023356` | The unavailable run was not retroactively converted into a profile |
| Evaluation | The frozen AS-OACR-001 test is complete: 22 page samples, five complete processes, 32 passed criteria, eight failed criteria, 15 inapplicable criteria, and nine findings | No Drupal-wide, whole-product, release-readiness, or Section 508 claim |
| OpenACR | The public-review copy validates against the WCAG-only `2.5-edition-wcag-2.2-en` catalog; every A/AA criterion is represented and all 31 AAA criteria remain `not-evaluated` | No Section 508, issued, or final ACR |
| Issue linkage | Six issue drafts and three proposed follow-up comments are included for review | Nothing has been posted to Drupal.org |
| Review location | This package is in the `openacr-pilot/` subtree of a follow-up pull request from the Zivtech fork to `mgifford/drupal-core` | No official Drupal project, issuer, or publication authority |
| Human authority | Author identity/contact, feedback ownership, issuer, and final approval remain unresolved | Mike's review does not assign him any of those roles |

## What is in this package

- [`evaluation-report.md`](evaluation-report.md) is the frozen report-level
  evidence spine. Its `TEST DRAFT` language records the evaluation's original
  disposition.
- [`outcomes.json`](outcomes.json) records sample, process, and per-criterion
  outcomes.
- [`findings/`](findings/) contains the nine evidence-contract finding records.
- [`openacr/drupal-11.4.4-as-oacr-001-public-review.yaml`](openacr/drupal-11.4.4-as-oacr-001-public-review.yaml)
  is the machine-readable review draft.
- [`openacr/drupal-11.4.4-as-oacr-001-public-review.markdown`](openacr/drupal-11.4.4-as-oacr-001-public-review.markdown)
  is the easiest line-by-line review surface.
- [`openacr/drupal-11.4.4-as-oacr-001-public-review.html`](openacr/drupal-11.4.4-as-oacr-001-public-review.html)
  is a self-contained rendered review surface.
- [`openacr/render-verification.json`](openacr/render-verification.json) records
  the public copy's structural checks and hashes.
- [`issue-queue/`](issue-queue/) contains the reconciliation, six new-issue
  drafts, and three proposed comments. Inclusion here is review, not posting.

The public-review OpenACR differs from the frozen internal YAML in three bounded
ways. It records the public-review disposition and repository-documentation
license, uses the WCAG-only catalog because Section 508 was out of scope, and
corrects eight adherence terms from `partially-supports` to
`does-not-support`. The frozen outcome map records only failed applicable
results for those criteria; the mapping contract therefore does not support a
mixed pass/fail term. Criterion outcomes, notes, finding references, and
severity are unchanged.

The OpenACR `repository` field identifies `mgifford/drupal-core`, where this
community-review copy lives. The archived independent implementation source
remains identified separately in the provenance narrative.

## Recommended review order

1. Read the
   [dated publication decision](../../decisions/2026-08-24-as-oacr-001-public-review-publication.md),
   root [`README.md`](../../../README.md), and
   [`docs/pilot-charter.md`](../../pilot-charter.md) for governance and
   authority boundaries.
2. Read the
   [evaluation-to-public-review handoff](../../handoffs/2026-08-23-drupal-test-openacr-evaluation-to-draft-handoff.md)
   for the chronology and custody boundary. Confirm that the failed live profile
   remains `unavailable` and that no source values were retained or promoted.
3. Read [`evaluation-report.md`](evaluation-report.md), focusing on the exact
   target, sample, accessibility-support baseline, five conformance
   requirements, coverage boundary, and the distinction between criterion
   outcomes and process-level `cantTell` records.
4. Compare the eight failed criterion outcomes in [`outcomes.json`](outcomes.json)
   with the nine records in [`findings/`](findings/). Severity must not select an
   OpenACR adherence term.
5. Review the rendered
   [OpenACR Markdown](openacr/drupal-11.4.4-as-oacr-001-public-review.markdown).
   Confirm that every claim remains sample-scoped, all failures cite real
   finding IDs, and no A/AA criterion uses `not-evaluated`.
6. Validate the YAML using the pinned OpenACR command below.
7. Review [`issue-queue/reconciliation.md`](issue-queue/reconciliation.md) last.
   Issue status is remediation context only and must not change an outcome or
   adherence term.

## How to validate and render the OpenACR

Run these commands from any clone of the pull-request branch:

```bash
review_root="$(git rev-parse --show-toplevel)"
review_dir="$review_root/openacr-pilot/docs/reviews/as-oacr-001-public-review"
review_scratch="$(mktemp -d)"

(
  cd "$review_scratch"
  npm init -y
  npm install --save-exact @openacr/openacr@0.3.8
)

"$review_scratch/node_modules/.bin/openacr" validate \
  -f "$review_dir/openacr/drupal-11.4.4-as-oacr-001-public-review.yaml" \
  -c "$review_scratch/node_modules/@openacr/openacr/catalog/2.5-edition-wcag-2.2-en.yaml"

"$review_scratch/node_modules/.bin/openacr" output \
  -f "$review_dir/openacr/drupal-11.4.4-as-oacr-001-public-review.yaml" \
  -c "$review_scratch/node_modules/@openacr/openacr/catalog/2.5-edition-wcag-2.2-en.yaml" \
  -t "$review_scratch/node_modules/@openacr/openacr/templates/openacr-simple-html-0.1.0.handlebars" \
  -o "$review_scratch/as-oacr-001-public-review.html"
```

Always pass the catalog with `-c`. Without it, validation does not verify
criterion numbers or adherence terms against the selected catalog.

## What to challenge

Please focus review comments on these questions:

1. Does the title and scope stay bounded to the exact Drupal 11.4.4 reference
   installation?
2. Are the sample, technology baseline, unavailable assistive technologies, and
   generalization limits stated clearly enough to prevent Drupal-wide claims?
3. Do the included finding records and rationales make the eight failed outcomes
   internally reviewable on their face? The excluded private corpus prevents an
   independent re-performance in this pull request.
4. Does each OpenACR adherence term follow from the outcome map rather than issue
   status or finding severity?
5. Are the five process-level conformance limitations and assistive-technology
   gaps clear enough?
6. Are the proposed issue drafts technically useful, correctly scoped, and
   appropriately separated from the conformance result?
7. What additional evidence or human roles would be required before anyone
   considers an official Drupal ACR?

For this pull request, a review or merge means only that the independent package
is useful for continued community experimentation. It does not approve the
underlying empirical evidence, assign Mike a formal role, authorize issue
posting, establish conformance, or issue an ACR. The exact publication decision
is recorded in
[`docs/decisions/2026-08-24-as-oacr-001-public-review-publication.md`](../../decisions/2026-08-24-as-oacr-001-public-review-publication.md).

## Evidence custody and verification limits

The private source corpus contains 5,263 files totaling 104,734,504 bytes. It
remains excluded from Git because it includes screenshots, browser traces,
accessibility trees, automated detector output, generated assets, and local
runtime context. The final private scan checked 2,689 text files and four known
synthetic credential values, observed 16 redacted sensitive-query values, and
reported zero findings. That scan supports local custody; it is not blanket
clearance to publish every binary or trace.

The frozen source hashes are:

| Artifact | SHA-256 |
|---|---|
| Evaluation report | `1041008507f917a110e2428117f461334aaa3c79dd6ae961e8ad19185fb09923` |
| Outcome map | `73994007232a5868d9ffb14fc326bfb7283000350852aefe345585258b514d4f` |
| Internal OpenACR YAML | `1e8daca88db5f77d64f369fc54dde5d2d4c4d9df01bbb8c9e6dbf1e95b806683` |
| Private artifact manifest | `9b865cd7d990a32eb41a4e606eadaf8cb63e0ea0da64663a4d2a71685d9785ef` |

The public report and outcome map are byte-for-byte copies of those frozen
sources. The public OpenACR is a bounded review derivative and has its own hashes
in [`openacr/render-verification.json`](openacr/render-verification.json).

A full `git diff --check` reports six accepted whitespace diagnostics: two
Markdown hard breaks in the byte-for-byte frozen evaluation report and four
whitespace-only lines emitted by the pinned HTML template. Normalizing either
file would break source fidelity or deterministic-render identity. The
authored/non-generated diff check excludes only those two files and passes with
no diagnostics.

## License and human-owned next steps

This review package uses the repository's documentation license,
`CC-BY-SA-2.0`. That is a license for this independent review copy, not a Drupal
Association license decision for a future official ACR.

Before issuance, humans must resolve the author and contact fields, feedback
channel, product/release ownership, independent review, issuer, legal review,
signature, and publication decision. The drafting workflow must then regenerate,
revalidate, rerender, and re-review the resulting artifact. This pull request
does none of those acts.
