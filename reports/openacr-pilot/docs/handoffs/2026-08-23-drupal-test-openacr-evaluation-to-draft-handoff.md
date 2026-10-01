# Drupal Test OpenACR: Evaluation-to-Draft Handoff

## Public review continuation — 2026-08-24

The workflow sponsor authorized a bounded public pull request for Mike Gifford
to review the completed AS-OACR-001 methodology test. The review package is at
[`openacr-pilot/docs/reviews/as-oacr-001-public-review/`](../reviews/as-oacr-001-public-review/README.md).
The staging and authority boundary is recorded in the
[2026-08-24 public-review publication decision](../decisions/2026-08-24-as-oacr-001-public-review-publication.md).
It includes the frozen evaluation report and outcome map, nine findings, a
public-review OpenACR derivative using the WCAG-only catalog and the documented
outcome-to-adherence rule, render verification, and the issue-reconciliation
drafts.

The private browser-evidence corpus, local Drupal build, engagement record,
audit plan, target-freeze records, and operational authorization material remain
excluded from Git. Publishing this review package does not create an issuer,
approve an official Drupal ACR, post any issue or comment to Drupal.org, or
assign Mike Gifford an evaluation, product-owner, correction-contact, or issuer
role.

## 0. Resume result — internal test draft completed

> **Updated 2026-08-23.** This section supersedes the pre-run state and
> release-role blockers described below for the bounded internal test only.
> The user explicitly authorized `TBD` role metadata for this test. Drupal
> Association release-role, contact, repository, and license decisions remain
> later work and were not inferred.

### Completed

- Governance narrative reconciled in source commit `3411b0b`
  (`docs: reconcile pilot governance state`). That source commit was not
  pushed before the implementation repository was archived; this follow-up
  branch carries the reconciled content.
- Engagement ID: `AS-OACR-001`.
- Exact target: local Drupal 11.4.4 Standard profile, core-only reference
  installation at source commit
  `1eabaf9ecfc3d2308a12e9146d84bb51bcf0d48b`, tree
  `9a61a224fdde8392975df8e5965b8caa7e81a2e8`, target-freeze digest
  `68ba978ba1f82fce0afcf8485627f3819c500d1ab20747c23af865c948e381bf`.
- WCAG-EM 2.0 audit plan completed and accepted after accessibility-plan
  critique.
- Evidence collected for 20 structured page samples, 2 deterministic random
  samples, and 5 complete processes.
- The full Playwright suite passed 22 of 22 page tests. It used real Tab and
  Shift+Tab events until the focus cycle closed on every page, recording 1,183
  forward and 1,161 reverse focus stops. Real Enter, Space, Escape, text-entry,
  and browser-back interactions were also exercised.
- The same suite ran 44 default/expanded axe scans, 66 desktop/tablet/mobile
  viewport checks, 66 text-spacing checks, forced-colors checks, label-in-name
  inventories, and 88 full-page screenshots.
- The independently pinned keyboard-a11y-tester completed 44 of 44
  desktop/mobile runs. Driven sessions used real keys for the invalid-login path
  and for Content administration selection/deselection; the latter captured the
  polite `1 item selected` and `No items selected` announcements.
- Actual Chrome UI zoom was invoked with Command+Plus and verified at 200% on
  all 22 samples.
- Native Safari plus VoiceOver exposed the invalid-login error as a named region
  and allowed navigation to its text. Safari's password-manager prompt
  interrupted observation of any automatic page-load announcement, so none is
  claimed.
- Native macOS Voice Control successfully activated the Olivero `Main Menu`
  control by spoken label and changed `aria-expanded` from `false` to `true`.
  Two other probes were inconclusive and do not support pass/fail outcomes.
- Manual resolution retained selector-level rendered facts for detector
  candidates. It confirmed four additional findings and rejected tabledrag
  focus and transient expanded-link-name false positives.
- Post-test accessibility critique corrected SC 3.2.6 from `inapplicable` to
  `passed`, corrected the driven-session sample ID to `S-STR-008`, narrowed the
  VoiceOver claim, and calibrated the breadcrumb finding to `MINOR`. The other
  seven failed criteria and severity ratings were retained.
- All 92 evidence IDs referenced by the outcome map and findings resolve within
  the private corpus.
- Evaluation report accepted after the final post-test corrections.
- OpenACR 0.3.8 YAML validated against
  `2.5-edition-wcag-2.2-508-en`; Markdown and HTML outputs rendered with the
  pinned templates.
- Rendered HTML verification passed every structural assertion and an axe-core
  4.13.0 scan reported zero violations and one unresolved color-contrast
  detector candidate on the visually inspected title overlay.
- Private corpus mode verified at `0600` for files and `0700` for directories.
  The refreshed secret scan checked four synthetic credential values across
  2,689 text files, observed 16 redacted sensitive query values, and found zero
  issues.
- Drupal issue-queue reconciliation completed without posting: three findings
  map to current exact/broader issues, one has a prior observation in a closed
  issue, and six issue drafts plus three follow-up comment drafts are retained
  privately under `var/evaluations/AS-OACR-001/issue-queue/`.
- During the native Voice Control probe, ambient speech was briefly dictated
  into a private local reconciliation field. The text was immediately removed,
  no transcript was retained, Voice Control was returned to off, and the final
  corpus scan found no issue.

### Evaluation result

- 32 criteria `passed`
- 8 criteria `failed`: WCAG 2.2 SC 1.4.1, 1.4.3, 1.4.10, 1.4.11,
  1.4.13, 2.4.7, 2.4.11, and 2.5.3
- 0 criteria `cantTell`
- 0 criteria `untested`
- 15 criteria `inapplicable`
- 9 findings: 4 `MAJOR` and 5 `MINOR`
- No whole-product, Drupal-wide, release-readiness, or Section 508 conformance
  claim

All 55 WCAG 2.2 A/AA criteria have explicit sample-scoped outcomes and appear in
the OpenACR. The eight failures prevent an AA conformance statement. Separately,
the five process-level complete-process conformance records remain `cantTell`
because native assistive-technology checks were sampled rather than repeated at
every process step and technology combination. All 31 AAA criteria are
serialized as `not-evaluated`. The four federal chapters are disabled with an
explicit web-method coverage boundary.

### Private artifacts

- Evaluation report:
  `var/evaluations/AS-OACR-001/evaluation-report.md`
  SHA-256 `1041008507f917a110e2428117f461334aaa3c79dd6ae961e8ad19185fb09923`
- Outcome map: `var/evaluations/AS-OACR-001/outcomes.json`
  SHA-256 `73994007232a5868d9ffb14fc326bfb7283000350852aefe345585258b514d4f`
- OpenACR YAML:
  `var/evaluations/AS-OACR-001/openacr/drupal-11.4.4-as-oacr-001-test-draft.yaml`
  SHA-256 `1e8daca88db5f77d64f369fc54dde5d2d4c4d9df01bbb8c9e6dbf1e95b806683`
- OpenACR Markdown:
  `var/evaluations/AS-OACR-001/openacr/drupal-11.4.4-as-oacr-001-test-draft.markdown`
  SHA-256 `ec28c9fe0b7bbf37421733aff14ac00d17870874949756e15f5c4e99ef8610a5`
- OpenACR HTML:
  `var/evaluations/AS-OACR-001/openacr/drupal-11.4.4-as-oacr-001-test-draft.html`
  SHA-256 `c64fe1c195b09e9ef2f3263bbb6cce9a5af343224b742861c5434259f6162023`
- Render verification:
  `var/evaluations/AS-OACR-001/openacr/render-verification.json`
  SHA-256 `f56aa50ccfe4142d5b12ca2454e1a8133241c92f933ddff51cde9f564b02b07c`
- Aggregate manifest:
  `var/evaluations/AS-OACR-001/artifact-manifest.json`
  SHA-256 `9b865cd7d990a32eb41a4e606eadaf8cb63e0ea0da64663a4d2a71685d9785ef`
  (`5,263` files; `104,734,504` bytes)
- Issue reconciliation and drafts:
  `var/evaluations/AS-OACR-001/issue-queue/`

### Intentionally not done

- No push, import, signature, submission, publication, or release.
- No Drupal.org issue-snapshot/profile request, issue creation, comment, or
  other live issue-lane mutation. Public issue pages were searched read-only.
- No assignment of Drupal Association or Mike Gifford to a release role.
- No release license, repository, or public feedback-channel decision. Because
  the YAML omits a license, the OpenACR renderer displays its CC-BY-4.0 default;
  the draft states that this tool behavior is not a Drupal Association license
  approval.

> **Historical pre-run instructions below.** Section 0 is the current state.
> Continue to keep issue data, synthetic fixtures, a merged pull request, and a
> schema-valid YAML file separate from conformance evidence.

## 1. Objective

Produce a human-reviewable **internal draft ACR in OpenACR format** for one exact
Drupal build, with Mike Gifford's community-review repository retained as process
context. Complete all five workstreams:

1. reconcile stale README and charter language;
2. complete and approve a release-evaluation engagement record;
3. run a bounded audit-scope evaluation and produce the evaluation report;
4. generate, validate, and render the internal OpenACR draft; and
5. add the Drupal.org issue-snapshot linkage afterward, or in a separately gated
   parallel lane. If that lane lacks authority, record it as blocked; deferral does
   not count as completing all five workstreams.

The intended deliverable is a **draft for human review**, never a final, signed,
official, or published Drupal ACR.

## 2. Current verified state

Verified on 2026-08-23:

- Archived implementation source: `zivtech/drupal-openacr-pilot`
- Branch: `main`
- Local and remote `main`:
  `f023356ba2b6cf4b064927aa05fc2f36070dc78e`
- Commit: `fix: separate profile source admission`
- GitHub CI for that commit: passed
  (<https://github.com/zivtech/drupal-openacr-pilot/actions/runs/32649544765>)
- Community-review PR:
  <https://github.com/mgifford/drupal-core/pull/57>
- PR #57 state: merged by Mike Gifford at
  `5f8204060b268362b80a7bd1ef1e65c7234b8c08`, after his
  `Excellent. Thanks!` response
- The merged PR supports treating the Phase 0 package as accepted for community
  experimentation. It does **not** establish Drupal Association endorsement,
  Drupal Core Leadership Team scope approval, evaluation authority, issuer
  authority, or publication authority.
- The profile-specific admission remediation is implemented, reviewed, and
  published. The prior live profile attempt remains `unavailable` /
  `schema_invalid`; it predates the remediation.
- Successful live profiles: zero
- Candidate snapshots: zero
- Promoted snapshots: zero
- Raw-response entries under `var/tmp/responses`: zero
- Audit-scope evaluations: zero
- Contract-conformant evaluation reports: zero
- OpenACR YAML/HTML drafts: zero
- Authorized issuer: `no issuer`

The following inherited working-tree changes existed before this handoff and are
not disposable:

```text
 M README.md
 M docs/retention-records/2026-08-23-drupal11-phase1-live-readiness.md
 M docs/reviews/2026-08-23-live-readiness-review.md
?? docs/handoffs/2026-08-23-profile-remediation-complete-next-gate-handoff.md
?? docs/handoffs/2026-08-23-profile-schema-remediation-handoff.md
?? docs/handoffs/2026-08-23-profiling-only-end-to-end-test-handoff.md
?? docs/reviews/2026-08-23-profile-schema-diagnosis.md
```

This handoff is an additional untracked file. Do not reset, discard, or casually
stage any inherited file. Review and stage explicit paths only.

## 3. The ambiguity to resolve first

The phrase “test OpenACR for Drupal/Mike Gifford” does not identify an evaluable
product version.

Before evaluation planning, the commissioner must choose one exact source basis:

- an official Drupal 11 release tag and its exact source commit;
- an exact Drupal core development commit; or
- an exact commit from `mgifford/drupal-core`.

The evaluable product is then a **named, reproducible Drupal reference
installation** based on that source—not “Drupal core” generically. The ACR title
and scope must identify the installation. Bind:

- source origin, exact commit, and dependency lockfiles;
- for a fork, its upstream base plus the complete diff;
- PHP, database, web-server, Node/build-tool, browser, and container/image
  versions;
- installation recipe/profile, Composer lock hash, configuration export hash,
  and deployed build or image digest;
- enabled extensions and themes;
- fixture content and file/media set;
- roles, permissions, test accounts, languages, and third-party services; and
- the exact base URL or local environment identifier evaluated.

Drupal's configurable permutations are not a coherent sample universe. Do not
title or describe the draft as an ACR for Drupal core as a whole when the evidence
covers one reference installation.

Do not treat `11.x-dev`, a branch name, the Drupal.org issue filter, or Mike's
repository as an exact product identity. Record the source commit, installation
profile, enabled modules, included themes, configuration, sample content, roles,
languages, and third-party dependencies actually evaluated.

Also decide whether “Mike Gifford” means:

- community/release-scope reviewer only; or
- product owner, evaluation commissioner, evaluator, reviewer, correction
  contact, or another formal role.

Do not assign a person to a role by inference. One person may hold multiple roles
only when the engagement record says so explicitly.

## 4. Authority and publication boundary

This handoff records requested work. It is not executable authority for every
network or publication action that work might involve.

Allowed without a new live-action grant:

- inspect local and public repository state;
- reconcile governance documentation;
- draft a proposed engagement record while marking unresolved human fields;
- plan a local audit environment; and
- create synthetic or local-only test scaffolding that makes no third-party
  request and no conformance claim.

Separate explicit authority is still required before:

- testing a third party's production deployment;
- authenticating to a non-local environment;
- making another Drupal.org source-profile request;
- collecting or promoting an issue candidate/snapshot;
- filing issues or commenting on Drupal.org/GitHub;
- pushing documentation, evaluation evidence, or an ACR draft;
- importing, signing, submitting, or publishing an ACR; or
- representing the draft as issued by Drupal, the Drupal Association, Mike
  Gifford, GSA, or Zivtech.

With issuer state `no issuer`, an internal draft may be prepared only after the
evaluation gates pass. Public Git history is a publication surface: keep the
evaluation evidence and OpenACR draft under ignored `var/` paths unless a human
separately authorizes a reviewed publication surface.

## 5. Workstream 1 — Reconcile README and charter state

### Goal

Make the repository's governance narrative match current evidence without
inflating community acceptance into official authority.

### Required actions

1. Recheck local `HEAD`, `origin/main`, the worktree baseline, PR #57, its merged
   commit, and Mike's response.
2. Review the existing dirty `README.md` diff before editing. Preserve its
   profiling-demonstration corrections.
3. Reconcile at least:
   - `README.md`; and
   - `docs/pilot-charter.md`.
4. Replace stale claims that PR #57 is still under review or that the sponsor's
   interpretation of Mike's Phase 0 response is wholly unrecorded.
5. Use evidence-first wording:
   - Mike Gifford merged `mgifford/drupal-core#57` after commenting
     `Excellent. Thanks!`;
   - the workflow sponsor interprets that as clearing the independent pilot's
     Phase 0 community-review/human-charter gate;
   - the merge/comment is not Drupal Association, Drupal Core Leadership Team,
     Drupal-project, issuer, live-data, evaluation, or publication authority;
   - live data, evaluation, ACR drafting, issuer, and publication gates remain
     separate.
6. Do not rewrite or reuse
   `docs/retention-records/2026-08-23-drupal11-phase1-live-readiness.md`. Its bytes
   are frozen historical evidence for the consumed profiling action.
7. If a new source-profile or candidate run is later pursued, create a new dated
   retention/readiness record with a new record ID and path.

### Completion evidence

- source links and exact merge commit are correct;
- no official endorsement is claimed;
- stale checklist items are reconciled consistently across README and charter;
- `git diff --check` passes; and
- inherited unrelated changes remain preserved and separately identifiable.

## 6. Workstream 2 — Commission the evaluation

### Goal

Create and approve the engagement record that makes outcome collection
legitimate.

### Storage

Start from `docs/engagement-record-template.md`, but do not overwrite the
template. Until contact data and publication disposition are reviewed, keep the
filled record at:

```text
var/engagements/<engagement-id>/engagement-record.md
```

### Required human decisions

Block outcome collection until these are complete and approved:

- engagement ID;
- commissioner;
- evaluator or evaluation team;
- independent reviewer;
- issuer state (`no issuer` is valid for the internal draft);
- product owner;
- report-correction contact;
- commission and evaluation dates;
- evidence cutoff and time zone;
- exact product name, version, tag, and source commit;
- installation profile, modules, themes, configuration, content, roles,
  languages, and third-party components;
- in-scope and out-of-scope interfaces, with a full-product enclosure rule;
- essential functionality and complete processes;
- conformance target;
- accessibility-support baseline with exact OS/browser/AT versions and settings;
- structured, random, and complete-process sampling rules;
- manual, keyboard, screen-reader, reflow, contrast, motion, cognitive, media,
  automated, and code-review methods;
- report title, product name and version, drafting-evaluator email, feedback
  channel, license decision, and repository/publication disposition;
- required OpenACR catalog and human finish surface; and
- named approvals from commissioner, evaluator, product owner, issuer-state
  confirmer, and independent scope reviewer.

The approval must also define an **evaluation-action authority matrix**:

- local-only build, named staging URL, or production URL;
- permitted request volume and time window;
- whether source/dependency downloads are permitted;
- authentication and test-account authority;
- allowed role changes, content creation, uploads, form submissions, mail/API
  side effects, and cleanup;
- whether evidence may capture account, content, or user data; and
- the person who may pause or terminate testing.

An approved engagement record authorizes outcome collection only within those
named bounds. Production testing, authenticated access, or external mutations
remain blocked unless explicitly included.

Before evidence capture, approve:

- evidence classification and redaction rules;
- synthetic/non-production test-data policy;
- owner-only storage access and permission checks;
- backup, cache, synchronization, and log treatment;
- retention/deletion schedule; and
- correction and incident handling.

Use non-production accounts and synthetic content unless the product owner
explicitly authorizes otherwise. Keep engagement, evidence, and draft directories
`0700` and files `0600`; verify ignored-path status. Do not copy evidence into
logs, issue trackers, or public review surfaces.

### Catalog decision

Choose the catalog during planning, never during serialization:

- WCAG 2.2 AA with direct YAML/HTML review:
  `2.5-edition-wcag-2.2-508-en` by the current reporting protocol;
- GSA ACR Editor as the required finish surface:
  `2.4-edition-wcag-2.1-508-en`, with every measured WCAG 2.2-only outcome in an
  out-of-catalog annex; or
- another catalog only when the engagement requirement explicitly calls for it.

Do not silently lower a WCAG 2.2 target because the editor currently imports only
the WCAG 2.1 catalog. Recheck editor/catalog compatibility if the live editor has
changed since the protocol's 2026-08-12 verification.

### Completion evidence

- every required field is sourced, not invented;
- every approver is named with a date;
- the exact evaluable build can be reproduced;
- the authority matrix and evidence-custody rules are approved;
- the catalog and finish surface are explicit; and
- the engagement record authorizes outcome collection but not publication.

## 7. Workstream 3 — Plan and execute the audit-scope evaluation

### Required lifecycle

Use the
[`zivtech/accessibility-skills`](https://github.com/zivtech/accessibility-skills)
repository and follow:

```text
a11y-planner AUDIT-SCOPE MODE
  -> a11y-critic review of the plan
  -> revise until accepted
  -> provision and freeze the exact target build
  -> a11y-test evidence collection
  -> perspective-audit for MEDIUM/HIGH alarms
  -> evaluation report
  -> a11y-critic review of evidence and report
  -> fix evidence defects or commission missing testing
  -> re-test
```

Do not substitute a component review, automated scan, issue-queue summary, or
patch-evaluation report for an audit-scope evaluation.

For this authorization-sensitive engagement, store the audit plan at:

```text
var/evaluations/<engagement-id>/audit-plan.md
```

This intentionally overrides the planner's normal public `docs/a11y-plans/`
convention. A redacted methodology plan may move to a public docs path only after
separate review and publication authorization.

### Planning contract

The plan must use WCAG-EM 2.0 and declare:

1. **Scope:** a full-product enclosure rule for every view/state/function.
2. **Target:** the exact WCAG version and level.
3. **Accessibility support:** exact OS, browser, screen reader, keyboard,
   magnification/reflow, contrast, motion, and other AT combinations.
4. **Additional requirements:** OpenACR catalog, issue granularity, user
   involvement, and finish surface.
5. **Exploration:** common views, essential functionality, sample-type variety,
   technologies relied upon, and other accessibility-relevant samples.
6. **Sampling:**
   - structured samples with a rationale for what each represents;
   - a random sample sized by WCAG-EM 2.0's 10%-of-structured rule, added on top,
     with the selection and any rounding method recorded and duplicates excluded;
   - every view and action in each complete process, including the default
     sequence and completion-critical branches; and
   - default, loading, error, expanded/dialog, and other material states.
7. **Representativeness loop:** expand and repeat when the random sample reveals
   a content type or finding type absent from the structured sample.
8. **Coverage boundary:** name every sample the web stack cannot measure and the
   manual or assistive-technology method assigned instead.

If Revised Section 508 is explicitly declared, apply the a11y-planner federal
profile and its WCAG 2.0 A/AA floor plus named provisions. Otherwise, do not cite
ICT Testing Baseline IDs or imply Trusted Tester/baseline alignment.

### Evidence collection

Before testing, approve an `outcomes.json` schema containing:

- WCAG version, criterion ID, target, and OpenACR catalog ID;
- per-sample and per-state applicability and outcome;
- aggregate outcome;
- sample IDs;
- supporting finding IDs for `failed` and `cantTell`;
- reasons for `inapplicable` and `untested`; and
- a coverage-boundary reference.

Findings never stand in for passing coverage. Hash the accepted outcome map after
evaluation and before OpenACR serialization.

Use evidence appropriate to each defect class:

- static/source analysis where applicable;
- sequential axe-core scans on every selected page and material state at desktop
  and narrow viewports;
- real Playwright keyboard input for keyboard operability;
- driven keyboard-a11y-tester journeys for complete processes;
- journey-level focus traces for focus order and focus visibility;
- actual computed accessible-name/role/state and announcement evidence;
- manual VoiceOver and/or NVDA testing as declared in the baseline;
- manual contrast, forced-colors, 400% reflow, text spacing, zoom, reduced-motion,
  cognitive, and content-quality judgments; and
- caption, transcript, and media-control testing when time-based media is in
  scope.

Axe-core and other automation are detectors, not verdict authorities. A clean
scan is not a conformance claim. Screenshots do not verify keyboard interaction
or screen-reader announcements.

### Finding contract

Create an `A11y Evidence Finding` block only for actual findings. Every finding
must include:

- stable `finding_id` and fingerprint;
- source and reproduction steps;
- WCAG/APG citation;
- explicit Section 508 boundary;
- user-impact severity;
- perspective alarms;
- measured or source-backed evidence;
- expected and actual behavior; and
- audit `evaluation_context` with evaluation ID, sample ID, and process ID when
  applicable.

Do not create findings for passing checks. Do not use trend language on the first
evaluation.

### Evaluation report

Produce the report under:

```text
var/evaluations/<engagement-id>/evaluation-report.md
var/evaluations/<engagement-id>/findings/
var/evaluations/<engagement-id>/evidence/
var/evaluations/<engagement-id>/outcomes.json
```

The report must conform to the A11y Evaluation Report Contract and contain:

- evaluation identity;
- scope;
- conformance target;
- accessibility-support baseline;
- additional requirements;
- technologies relied upon;
- structured, random, and complete-process sample sets with rationale;
- state coverage;
- every A/AA success criterion with one EARL outcome:
  `passed`, `failed`, `cantTell`, `inapplicable`, or `untested`;
- separate outcomes and evidence for the five WCAG 2 conformance requirements:
  target level, full pages, complete processes, accessibility-supported use of
  relied-upon technologies, and non-interference;
- at least one example for every conformance requirement and success criterion
  not met;
- the representativeness-check result;
- finding IDs backing failed/cantTell outcomes;
- an explicit coverage boundary; and
- optional evaluation-statement language only when its stringent prerequisites
  are actually satisfied.

Severity and criterion outcome are orthogonal. Do not derive one from the other.
Do not make a whole-product conformance claim from sampling alone.

### Exit gate

The `a11y-critic` produces an internal quality verdict only. It cannot approve
outcomes, scope exceptions, authority, or conformance language for the evaluator,
commissioner, reviewer, or issuer.

Before OpenACR serialization:

- the critic must accept the report against the evidence contracts;
- the evaluator must attest that the sample evidence and outcome map accurately
  reflect the completed evaluation; and
- the named human independent reviewer must approve the scope, coverage boundary,
  and report disposition, or explicitly record the limits or refusal of that
  review. A declined or limited review remains a named draft limitation; it is not
  silently replaced by the critic.

Issuer and publication approval remain separate. Any untested or `cantTell` A/AA
criterion remains a named gap for the OpenACR draft; it must not be smoothed into
a conformance term.

## 8. Workstream 4 — Generate the internal OpenACR draft

### Entry gate

Load and follow the `acr-reporting` skill. Do not generate YAML from raw findings,
issue records, the synthetic invariance fixtures, or an incomplete collection of
scanner results. The accepted evaluation report is the evidence spine.

An incomplete collection of scanner results is not an evidence spine. A
contract-conformant evaluation report that explicitly records `untested` or
`cantTell` A/AA outcomes may produce only an `INCOMPLETE DRAFT`, omitting those
adherence entries and naming every gap and reason.

### Storage

Keep draft artifacts outside public Git history:

```text
var/openacr-drafts/<engagement-id>/draft.yaml
var/openacr-drafts/<engagement-id>/draft.md
var/openacr-drafts/<engagement-id>/draft.html
var/openacr-drafts/<engagement-id>/handoff.md
```

### Serialization rules

- Source every metadata value from the engagement record or evaluation report.
- Never invent the author email, report date, product version, contact, feedback,
  license, or repository.
- `report_date` is the evaluation completion date, not the day YAML happens to be
  generated.
- Include a mandatory legal disclaimer identifying the artifact as an internal
  draft with no issuer.
- `evaluation_methods_used` must state WCAG-EM 2.0 plus the structured-sample,
  random-sample, and complete-process counts.
- Populate only the `web` component from web evidence. Omit `electronic-docs`,
  `software`, and `authoring-tool` components from criterion entries.
- Disable only the Section 508 chapters (`functional_performance_criteria`,
  `hardware`, `software`, and `support_documentation_and_services`), each with an
  honest coverage-boundary note. Do not fabricate conclusions for them.
- Derive adherence terms from the per-criterion outcome map only:
  - `passed` everywhere applicable -> `supports`;
  - `failed` wherever applicable -> `does-not-support`;
  - mixed pass/fail -> `partially-supports`;
  - `inapplicable` -> `not-applicable`;
  - `untested` or `cantTell` on A/AA -> no entry and an `INCOMPLETE DRAFT` gap;
  - `not-evaluated` -> AAA only.
- For AAA web criteria without evaluation evidence, use `not-evaluated` with the
  canonical AAA note. Do not disable the AAA chapter. If AAA evidence exists, map
  it from the measured outcome like any other criterion.
- Use the `acr-reporting` canonical note forms exactly:
  - `supports`: begin `Sample-scoped: passes across <N> structured + <M> random samples (WCAG-EM).`;
  - `does-not-support` / `partially-supports`: begin
    `Sample-scoped: fails in <sample IDs or scope>.` and cite real finding IDs;
  - `not-applicable`: begin `Not present:` and state why;
  - unevaluated AAA: begin
    `Not evaluated at this engagement's conformance target (WCAG 2.2 AA).` when
    that is the actual target; and
  - disabled chapter notes: begin
    `Outside the web evaluation method's coverage:`.
- If any A/AA outcome is `untested` or `cantTell`, the document `notes` must begin
  `INCOMPLETE DRAFT — untested A/AA criteria: <comma-separated criteria>` and the
  human handoff must give the reason for every listed criterion.
- Every failure/partial note states the sample scope and cites real finding IDs.
- Every support note states the structured/random sample scope and cites no
  invented passing finding.
- Account for every catalog A/AA criterion as present or explicitly blocked. The
  CLI does not enforce completeness.
- If the engagement uses the WCAG 2.1 catalog for ACR Editor compatibility,
  include the required WCAG 2.2-only annex. For each applicable criterion, list
  the criterion, sample-scoped outcome, would-be adherence term, relevant sample
  IDs, and real finding IDs where applicable. Never drop measured outcomes.

### Validate and render

Use exact pin `@openacr/openacr@0.3.8` in a scratch directory and always pass the
catalog to both commands:

```bash
mkdir -p /tmp/acr-check
cd /tmp/acr-check
npm init -y >/dev/null
npm i @openacr/openacr@0.3.8

npx openacr validate \
  -f /absolute/path/to/draft.yaml \
  -c node_modules/@openacr/openacr/catalog/<catalog-id>.yaml

npx openacr output \
  -f /absolute/path/to/draft.yaml \
  -c node_modules/@openacr/openacr/catalog/<catalog-id>.yaml \
  -t node_modules/@openacr/openacr/templates/openacr-markdown-0.1.0.handlebars \
  -o /absolute/path/to/draft.md

npx openacr output \
  -f /absolute/path/to/draft.yaml \
  -c node_modules/@openacr/openacr/catalog/<catalog-id>.yaml \
  -t node_modules/@openacr/openacr/templates/openacr-html-0.1.0.handlebars \
  -o /absolute/path/to/draft.html
```

Inspect the rendered HTML and confirm the criterion tables are present. A bare
`validate -f` is not a real catalog validation, and `output` without `-c` can
silently render a metadata-only shell.

### Human handoff

The final draft handoff must state:

- exact YAML and rendered-artifact hashes;
- catalog and validation commands;
- evaluation report and outcome-map hashes;
- every incomplete A/AA criterion and reason;
- the WCAG 2.2 annex when applicable;
- license decision or unresolved license consequence;
- that no issuer exists;
- that the human owns metadata review, legal review, every conformance statement,
  removal of the disclaimer, signature, and publication; and
- that the draft was not uploaded to ACR Editor or any public repository unless
  that separate action was explicitly authorized.

## 9. Workstream 5 — Add issue-snapshot traceability separately

### Key rule

The issue snapshot is optional traceability metadata. It is not an entry gate for
the evaluation or OpenACR draft and it may never alter, block, upgrade, or
downgrade a finding, outcome, or adherence term.

Recommended sequencing: complete the first evaluation and draft without waiting
for another live Drupal.org run, then attach issue traceability. Run in parallel
only when custody, personnel, and authorization are isolated from the evaluation
lane.

### If pursuing a new source profile

1. Create a new dated retention/readiness record. Do not edit or reuse the frozen
   2026-08-23 record.
2. Bind the exact reviewed collector commit, configuration, User-Agent, people,
   environment, record bytes, and half-open authorization window.
3. Recompute configuration and record hashes.
4. Recheck runtime, FileVault, permissions, backup/cache/synchronization
   dispositions, traffic guard, and zero raw-response state.
5. Obtain new explicit authority for exactly one `source_profile` action.
6. Create the ignored `0600` authorization file only after that grant.
7. Execute once and stop. Do not retry an unavailable result.

A successful profile proves only that the aggregate source shape is admissible.
It does not authorize candidate collection.

### Candidate and snapshot gate

Candidate collection and snapshot promotion require their own reviewed action and
authority. Before either:

- verify the exact current source configuration and collector commit;
- review the public projection and attribution;
- verify cleanup and raw-response absence;
- create the candidate atomically;
- independently review hashes, ordering, selection membership, and provenance;
- promote an immutable snapshot only through an explicitly approved process; and
- stop before evaluation or ACR mutation.

### Linkage ledger

Link only after the evaluator has authored findings. Use typed relationships such
as:

- issue -> finding;
- finding -> sample;
- finding -> WCAG success criterion; and
- issue -> stable finding fingerprint.

An issue link without a complete evidence finding is informational only. Issue
presence, absence, status, priority, patch, comment volume, or closure cannot
select an outcome or adherence term. Comments and issue bodies remain excluded.

If the issue source is stale or unavailable, label only the traceability view as
stale or unavailable. The accepted evaluation and draft remain unchanged.

## 10. Required execution order and checkpoints

```text
Checkpoint A: reconcile README/charter and review the diff
  -> Checkpoint B: human completes and approves engagement record
  -> Checkpoint C: a11y-planner audit plan accepted by a11y-critic
  -> Checkpoint D: target build frozen and sample set approved
  -> Checkpoint E: a11y-test evidence collected; perspective escalations closed
  -> Checkpoint F: evaluation report accepted by a11y-critic
  -> Checkpoint G: OpenACR YAML validated, rendered, and human-handoff ready
  -> Checkpoint H: independently authorized issue-snapshot/linkage lane completed
```

Checkpoint H is optional for producing the evaluation and first internal draft,
but mandatory before claiming that all five workstreams in this handoff are
complete. If its separate authority is absent, stop with workstream 5 blocked.

Do not compress these into “the audit passed” or “the ACR is done.” Report each
state separately: planned, approved, provisioned, tested, reviewed, drafted,
validated, rendered, human-reviewed, issued, and published.

## 11. Stop conditions

Stop and surface the issue if continuation would:

- fill a human role, approval, email, date, product version, catalog, or license by
  inference;
- evaluate a branch name or moving deployment instead of an exact frozen build;
- exclude product areas merely to improve the result;
- treat automated scans as full WCAG coverage;
- treat a patch-level evaluation as the audit-scope evidence report;
- treat issue state as accessibility evidence;
- emit a term for an untested or `cantTell` A/AA criterion;
- use `not-evaluated` outside AAA;
- omit the catalog argument from OpenACR validation or rendering;
- commit an ACR draft or contact-bearing engagement record to a public repository
  without a dated publication decision that defines the public-review scope,
  staging manifest, maintainer, license, exclusions, and no-issuance boundary;
- run another profile, candidate, or promotion action without its separate grant;
- authenticate to or mutate an external service without explicit authority;
- describe PR #57 as Drupal Association or Drupal Core Leadership Team approval;
  or
- sign, import, submit, or publish the draft as an issued or final ACR.

## 12. Definition of complete for all five workstreams

All five are complete only when:

1. README and charter consistently record the narrow community acceptance and
   current authority boundary.
2. A human-approved engagement record identifies one exact reproducible Drupal
   build, scope, baseline, sample, methods, report target, and responsible people.
3. A critic-accepted evaluation report contains the full per-A/AA outcome map,
   traceable findings, sample evidence, representativeness result, and coverage
   boundary.
4. An internal OpenACR draft is complete or explicitly `INCOMPLETE`, passes
   catalog-aware validation, renders real criterion tables in Markdown and HTML,
   and has a mandatory human-review handoff.
5. Issue linkage is attached through an independently reviewed immutable snapshot
   and typed linkage ledger. A dated deferral may preserve the evaluation and
   draft, but it leaves this five-workstream handoff incomplete.

Even then, the official-ACR lifecycle states `issued` and `published` remain
false until a named authorized issuer reviews and performs those separate acts.
That boundary does not prohibit the dated, bounded publication of an independent
public-review derivative described below.

## 13. Current review entry point

```text
Start with openacr-pilot/docs/reviews/as-oacr-001-public-review/README.md.

Review the frozen evaluation report, outcome map, findings, OpenACR public-review
draft, and issue reconciliation in the documented order. Do not rerun the live
profile or evaluation, post issue material, fill human metadata by inference,
assign an issuer, or treat this pull request as an issued ACR.
```
