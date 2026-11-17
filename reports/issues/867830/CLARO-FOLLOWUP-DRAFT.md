# Claro follow-up and proposed merge request

**DRAFT, 2026-11-17. Not filed; no MR opened.** Maintainer agreement and the
evidence gaps below must be addressed before submission.

## Proposed issue

**Title:** Provide explicit unpublished status in Claro's rendered nodes and comments

**Project:** [Claro](https://www.drupal.org/project/claro).
**Related core issue:** [#867830: "Unpublished" style of rendered entities is not accessible](https://www.drupal.org/project/drupal/issues/867830).

Claro overrides node and comment templates, so a change to core's generic
templates does not necessarily reach Claro. In the recorded lab comparison,
unpublished Articles, Basic pages and held comments have no status text inside
their rendered entities. Their background is the remaining local cue.
This can make publishing status difficult to identify for low-vision users and
people using screen readers or forced colours.

Propose visible, translatable **Unpublished** text associated with each affected
entity, including when author metadata or the Navigation Top Bar is absent.
Published entities must remain unmarked. Keep publishing status distinct from
moderation states such as Draft.

This is the Claro part of a coordinated solution: Core covers Default Admin,
generic templates and newly generated Starterkit themes; the
[Olivero patch](branches/867830-olivero-status.patch) covers Olivero's overrides,
including its separate teaser template. All use the same status wording and
existing publishing-state variables. Already-generated Starterkit themes need
their copied templates updated; changing the generator does not update them.

### Reproduce and inspect

1. Use Standard plus the lab's [current-Core recipe](../../../recipes/repro_867830_current/recipe.yml)
   and its fixture scripts; revisions and setup are in [REPRODUCE.md](REPRODUCE.md).
2. Set Claro as the default theme on both lab sites to exercise its entity templates.
3. Log in using the viewer's one-time links. Open `/lab/unpublished-article`,
   `/lab/unpublished-page` and the control `/lab/published-article`.
4. Compare the node and held-comment cues, including the Basic page without
   author metadata. Then test with and without the Navigation Top Bar.

Expected: publishing status remains identifiable without colour alone.
Observed in the recorded baseline: no unpublished text inside the target entities.
This is not a claim that the entire page lacks status information.

### Evidence and reporting fields

| Field | Recorded evidence or explicit gap |
|---|---|
| URL | `https://repro-baseline-867830-current-authoring.ddev.site/lab/unpublished-article` (private local fixture) |
| Simplified XPath | `//article[contains(concat(' ', normalize-space(@class), ' '), ' node--unpublished ')]` |
| Full DOM XPath / instance and pattern IDs | Not captured by the existing collector; capture before filing |
| HTML | Recorded node class attribute: `class="contextual-region node node--type-article node--unpublished node--view-mode-full"`; capture a minimal full failing fragment before filing |
| WCAG / rule | SC 1.4.1 Use of Color, Level A, is the proposed assessment context; no axe rule establishes this finding |
| Severity | Proposed Medium; human assessment pending |
| Frequency | Two unpublished nodes and one held comment across three fixture pages; not a site-wide census |
| Environment | Core `3fb1c69d36927265f30e4dbc418828f5b884b73f`; Claro `474f080c47f5ce21961bf90515fb7bdea1d7dcd4`; Chromium 156.0.8078.4, macOS arm64, desktop 1280x900 |
| Colour modes / AT | Recorded light and forced-colour runs; dark not run for this proposal. Guidepup is synthetic; no real VoiceOver/NVDA pass |

The [November 9 light run](playwright/2026-11-09T15-56-30-853Z-chromium-light-1280x900/SUMMARY.md)
records a visible label after patching, at 14.38:1 in Claro.
The [forced-colour run](playwright/2026-11-09T16-00-35-400Z-chromium-light-forced-1280x900/SUMMARY.md)
records 21:1. These runs applied Core and Olivero patches as well as Claro's:
they do **not** establish standalone Claro compatibility or resolve the Top Bar chip review.

## Proposed MR scope

**Title:** Add unpublished text to Claro node and comment templates

Start from the existing [two-template Claro patch](branches/867830-claro-status.patch)
(SHA-256 `0a5b33d7dbe1e11f66a12162fa167d648576148ae10576a5f69df81878771968`).
It adds visible text and visually hidden entity context using existing template
variables, independently of author metadata. It preserves status classes,
backgrounds and the mark hook. Per drupal-a11y-dom, reuse `.visually-hidden`;
do not add custom hiding CSS or a competing status API.

Exclude Default Admin tokens, the core status chip, Olivero and generic core
template changes. The MR description must link to the new Claro issue **and**
[core #867830](https://www.drupal.org/project/drupal/issues/867830).

Before opening:

- Confirm the target with maintainers: `3.0.x` is the current default branch;
  the project describes `4.0.x` as future development.
- Apply and test **only Claro's patch on unmodified supported core**. Add
  project-appropriate coverage if maintainers require it. The lab uses shared
  status checks and a representative Default Admin browser pass, not four
  separate theme test suites; do not call those standalone Claro verification.
- Check the Top Bar present/absent cases for confusing duplicate information.
- Run the receiving project's pipeline and Twig checks. Complete human keyboard,
  screen-reader, zoom, forced-colour and narrow-layout review.
- Test the supported colour behaviour; a dark preference is not proof of a
  native dark palette. Measure text contrast, not just background differences.
- Obtain independent code/accessibility review and human approval to publish.

## Handoff

Owner: @mgifford reviews scope, then agrees the target branch with Claro maintainers.
Next step: approve the focused issue text and commission the isolated Claro test.
No new patch was written or tested in this drafting pass.
The useful existing mechanism is separate project patches; the unresolved risk
is treating a combined lab run as independent Claro validation.

The local comparison was started during this session. Authenticated requests to
`/lab/unpublished-article` returned HTTP 200 on both sides; the viewer returned 200.
This confirms access, not Claro rendering or accessibility acceptance.
The documentation link check passed: 526 references, zero missing.

Discovery on November 17: Claro's issue search for `unpublished` returned no
matches; GitLab MR searches for `unpublished` and `867830` returned none.
This is a bounded duplicate check, not proof that no related work exists.
No separate Claro contribution/AI policy was established; confirm before submission.

**AI disclosure**

This contribution was prepared with assistance from an AI coding tool.
- Tool: Copilot SDK in VS Code; model/version unavailable.
- Used for: source review and drafting the issue/MR proposal. The patch and recorded tests predate this pass.
- Reviewed by: pending human review; submission readiness is **revise**.
- Skills loaded: drupal-accessibility (sub-skills: drupal-a11y-qa, drupal-a11y-dom).
