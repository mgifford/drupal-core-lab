# Independent Drupal 11 OpenACR Traceability Pilot Proposal

> **Status:** Mike Gifford merged the Phase 0 community-review package in
> [mgifford/drupal-core PR #57](https://github.com/mgifford/drupal-core/pull/57)
> after commenting `Excellent. Thanks!`. The current workflow sponsor records
> that as clearing the independent pilot's community-review/human-charter gate.
> Phase 1 collector implementation is complete. Neither fact authorizes another
> live-data action, evaluation, Accessibility Conformance Report (ACR), issuer,
> or publication decision.
>
> **No official endorsement:** This remains an independent Zivtech pilot. The
> merge and comment do not constitute Drupal Association, Drupal Core Leadership
> Team, Drupal project, GSA/OpenACR, issuer, evaluation, or publication approval.

> **Current public review:** The workflow sponsor authorized a bounded public
> review package for AS-OACR-001 on 2026-08-24. The package publishes the
> report-level evidence spine, OpenACR review draft, findings, and proposed issue
> follow-ups. It does not publish the private browser-evidence corpus, issue or
> comment content to Drupal.org, or an issued ACR.

Zivtech operates the archived
[independent implementation source](https://github.com/zivtech/drupal-openacr-pilot)
for this Drupal 11 issue-traceability pilot. This `openacr-pilot/` subtree is
the community-review copy submitted through the Zivtech fork. Mike Gifford
merged the Phase 0 package in
[mgifford/drupal-core PR #57](https://github.com/mgifford/drupal-core/pull/57)
at commit `5f8204060b268362b80a7bd1ef1e65c7234b8c08`, following his
`Excellent. Thanks!` comment. The workflow sponsor interprets those public acts
as acceptance of the package for independent community experimentation, not as
an assignment of Mike to any evaluation or publication role. Neither the
archived source nor this review subtree records official approval from the
Drupal Association or Drupal Core Leadership Team. The pilot tests whether a
frozen set of public Drupal.org issues can support remediation traceability
without becoming evidence of conformance.

The short version:

- Drupal.org issues are remediation records and an evidence index. They do not
  determine Web Content Accessibility Guidelines (WCAG) outcomes or OpenACR terms.
- The proposed selection is limited to 25 public Drupal core issues. Comments are
  excluded.
- Mike Gifford's merge/comment is retained as community/release-scope review
  context. It does not by itself appoint him as product owner, commissioner,
  evaluator, independent evaluation reviewer, correction contact, or issuer.
- The current issuer state is `no issuer`. The Drupal Association is the proposed
  future issuer, acting on behalf of the Drupal core project, but it has not
  accepted that role or named an authorized representative. No ACR publication
  handoff for issuance is allowed.
- Any release evaluation must be commissioned separately and must define its own
  exact version, scope, baseline, sample, methods, and conformance target.

## AS-OACR-001 public review

The [AS-OACR-001 public review guide](docs/reviews/as-oacr-001-public-review/README.md)
explains the current evaluation result, what is and is not included, the
recommended review order, OpenACR validation commands, evidence-custody limits,
and the decisions that remain human-owned. The
[dated publication decision](docs/decisions/2026-08-24-as-oacr-001-public-review-publication.md)
records why this bounded derivative may be reviewed publicly without issuing an
ACR or assigning anyone a formal role.

The review package covers one frozen, local Drupal 11.4.4 Standard installation.
It is not an evaluation of Drupal generally. It records 32 passed, eight failed,
and 15 inapplicable WCAG 2.2 Level A and AA criteria, plus nine findings. No
issuer exists, and the draft is not signed, final, or release-ready.

## Phase 0 documents

- [Pilot charter](docs/pilot-charter.md)
- [Engagement record template](docs/engagement-record-template.md)
- [Threat and provenance review](docs/threat-provenance-review.md)
- [Raw-response retention record template](docs/raw-response-retention-record-template.md)
- [Independent critic review](docs/critic-review.md)
- [License and attribution policy](LICENSE.md)

## Phase 1 planning

- [Read-only issue-snapshot data implementation plan](https://github.com/zivtech/drupal-openacr-pilot/blob/f023356ba2b6cf4b064927aa05fc2f36070dc78e/docs/plans/2026-08-18-drupal-issue-snapshot-phase1-data-plan.md)
- [Profiling-only command implementation handoff](https://github.com/zivtech/drupal-openacr-pilot/blob/f023356ba2b6cf4b064927aa05fc2f36070dc78e/docs/plans/2026-08-23-profiling-only-command-data-plan.md)
- [Evaluation-to-public-review handoff](docs/handoffs/2026-08-23-drupal-test-openacr-evaluation-to-draft-handoff.md)

### Profiling-only implementation status

The profiling-only path is implemented and tested with synthetic inputs. One
separately authorized live demonstration on 2026-08-23 made one HTTP attempt and
returned `unavailable` / `schema_invalid`; it deleted and verified absence of the
response representation and created no profile or candidate. The completed run
state and its caveats are summarized in the evaluation-to-public-review handoff.
Its source-level provenance renderer distinguishes `profiled` from
`unavailable`, records exact observation and cleanup times, keeps encoded and
decoded response-byte domains separate, and records the reviewed configuration,
authorization, and retention-record hashes. It states that no candidate is
created and excludes source values from the profile contract.

The authorization field `maximum_requests: 1` means one top-level profiling
action. Any low-level retry remains bounded by the reviewed configuration and is
recorded as a separate transport attempt in the profile receipt; it does not
authorize another profiling action or another page.

The following production command contract applies only inside a clone of the
[archived implementation source](https://github.com/zivtech/drupal-openacr-pilot).
It is not runnable from this community-review subtree. After every live gate
closes, that source's contract is:

```text
node dist/src/profile-cli.js \
  --config config/pilot.drupal11.json \
  --authorization <reviewed-profile-authorization.json> \
  --profile-root var/profiles
```

No production profiling authorization is committed to the archived source or
this review repository. A short-lived executable authorization must remain
local and must validate against the exact reviewed configuration and
retention-record bytes before this command can contact Drupal.org.

The completed unavailable run is bounded operational evidence, not authority for
another Drupal.org request. It does not establish a live profile, candidate,
snapshot, evaluation, ACR, publication, rendered WCAG conformance, or
assistive-technology coverage.

## What happens next?

The Phase 1 data plan, read-only collector, and profile-admission remediation are
implemented. The one consumed profiling authorization does not authorize another
profile, candidate collection, or snapshot promotion. Each future live action
remains blocked until its people, retention controls, exact configuration, and
separate executable authorization are reviewed and recorded.

Mike Gifford's merge of PR #57 after his `Excellent. Thanks!` comment is the
public acceptance artifact. The workflow sponsor records it as clearing the
independent pilot's Phase 0 community-review/human-charter gate. That narrow gate
decision does not establish official Drupal endorsement or grant live-data,
evaluation, ACR drafting, issuer, or publication authority.

An official Drupal core ACR would additionally require the Drupal Association to
accept the issuer role and name a representative, plus technical-scope approval
from the Drupal Core Leadership Team and a separately commissioned evaluation.

Related guidance:

- [Drupal core ACR process guidance](https://mgifford.github.io/drupal-core/docs/acr-process.html)
- [Drupal.org REST and other APIs](https://www.drupal.org/drupalorg/docs/apis/rest-and-other-apis)
- [GSA OpenACR](https://github.com/GSA/openacr)
- [Community-review pull request](https://github.com/mgifford/drupal-core/pull/57)

## AI use

OpenAI Codex materially assisted with research and drafting. Humans remain
responsible for the scope, source licensing, release ownership, evaluation, and
any public claim.
