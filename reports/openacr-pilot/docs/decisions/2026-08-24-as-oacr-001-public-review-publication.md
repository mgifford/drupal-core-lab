# AS-OACR-001 Public Review Publication Decision

> **Decision date:** 2026-08-24
>
> **Decision owner:** Current workflow sponsor
>
> **Review-package maintainer:** Alex Urevick-Ackelsberg (`@AlexU-A`)
> **Disposition:** Authorized for a bounded public pull-request review; not
> authorized for issuance

## Decision

The workflow sponsor directed Zivtech to place the completed AS-OACR-001 work in
a pull request for Mike Gifford and explain how to review it and where the pilot
stands. This decision authorizes publication of an independent Zivtech review
package as a follow-up pull request from `zivtech/drupal-core` to the
`openacr-pilot/` subtree in `mgifford/drupal-core`.

The independent implementation source at `zivtech/drupal-openacr-pilot` is
archived and read-only. It remains the provenance record for the collector and
evaluation workflow; this pull request is the active community-review surface.

The publication is a review act, not an issuance act. The public OpenACR copy
must remain marked `PUBLIC REVIEW DRAFT — METADATA INCOMPLETE; NOT ISSUED`. No
Drupal Association, Drupal Core Leadership Team, GSA, Mike Gifford, or Zivtech
ACR approval is represented.

## Authorized staging manifest

The pull request may contain:

- the previously committed README and pilot-charter reconciliation;
- the evaluation-to-public-review handoff;
- this publication decision;
- a frozen copy of the AS-OACR-001 evaluation report and outcome map;
- the nine evidence-contract finding records;
- a public-review OpenACR derivative using the WCAG 2.2 catalog;
- generated Markdown and self-contained HTML review surfaces;
- structural, hash, catalog, and axe verification for the public derivative; and
- the issue reconciliation, six draft issues, and three draft follow-up comments,
  clearly marked as unposted review material.

The staging manifest excludes:

- the private screenshot, browser-trace, accessibility-tree, and automated-output
  corpus;
- the local Drupal build, dependencies, database, and runtime records;
- the engagement record, audit plan, target freeze, evidence-sampling freeze,
  executable authorization, and custody records;
- the inherited live-readiness and retention-record edits;
- profiling handoffs that assign or imply operational duties for Mike Gifford;
  and
- any credential, cookie, token, raw response, private account value, or retained
  ambient transcript.

## Review request and meaning

Mike is asked to review the package's scope, stated methodology, internal
evidence-to-outcome rationale, outcome-to-OpenACR mapping, coverage boundaries,
and proposed issue wording. The pull request does not provide the full private
corpus needed to independently reproduce every empirical observation. A separate
custodian-led evidence review would be required for that disposition.

A review or merge may be recorded as acceptance of this independent package for
continued community experimentation. It must not be recorded as:

- acceptance of a commissioner, evaluator, evidence reviewer, product-owner,
  correction-contact, custodian, repository-maintainer, or issuer role;
- independent re-performance or approval of the underlying evaluation;
- Drupal Association or Drupal Core Leadership Team endorsement;
- authorization to post an issue or comment;
- an AA conformance statement; or
- signature, issuance, submission, import, or publication of an official ACR.

## Metadata, feedback, and license

Alex Urevick-Ackelsberg maintains the independent review package through the
pull request. This does not fill the OpenACR's unresolved drafting-author,
feedback-owner, product-owner, reviewer, or issuer fields.

Repository-authored documentation and the public-review OpenACR derivative use
the repository's `CC-BY-SA-2.0` documentation license. This is not a license
decision for a future Drupal Association ACR.

Before any issuance workflow, humans must resolve the author and contact,
feedback channel, product/release ownership, independent review, issuer, legal
review, signature, and publication decision. The resulting artifact must be
regenerated, revalidated, rerendered, and reviewed again.
