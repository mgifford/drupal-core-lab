# Design guidance conflicts and unresolved claims

Status: DRAFT review register, 2026-10-17. The bundle adds a companion notice to
[STYLES.md](../../STYLES.md); it does not silently rewrite its existing policy.
Read [DESIGN.md](../../DESIGN.md) for scope. ACCESSIBILITY.md and AGENTS.md retain
their existing precedence. Identify conflicts when they affect a concrete change.

| Existing guidance or assumption | Concern | Proposed next action |
| --- | --- | --- |
| Claro admin and Olivero frontend are the listed theme surfaces | That inventory does not describe the captured Default Admin setup. The Lab stores core under disposable environment checkouts. | Verify the actual target theme, version and file paths before using token examples. |
| Every focusable element must use the Claro focus style | A theme-specific presentation is expressed as a universal instruction. | Retain focus accessibility expectations; define each theme's component presentation separately. |
| A percentage is used as a contrast-ratio example | Contrast ratios use a ratio such as 4.5:1, not 4.5%. | Correct the dimensional error in a focused policy edit. The original text is preserved here. |
| The primary-label list bans Submit, Apply and Confirm universally | Such a ban needs workflow and version scope; a palette or initial crawl cannot establish it. | Review published wording guidance against each actual action. |
| A fixed navigation-heading sequence must be preserved everywhere | A specific rendered sequence is not evidence of a universal document-structure contract. | Evaluate landmarks, names and hierarchy by page and component. |
| Help text is told to prefer passive constructions while the file also requires active voice | These directions conflict. | Reconcile the wording policy explicitly, using the linked Drupal interface-text guidance. |
| Every input needs a label element and every data table a caption | Blanket statements need element-type and accessible-name context; hidden inputs and alternative naming patterns matter. | Review against applicable HTML/accessibility requirements before automatic enforcement. |
| Focus instructions combine dialog opening and closing | Moving focus into a dialog and restoring focus after closure are different transitions. | Define and test the two behaviours separately. |
| Exact old token values and observed component dimensions are treated as current constants | Default Admin values have not been fully inventoried at the evidence commit. | Trace actual tokens and overrides; do not transplant Claro values. |
| Reduced-motion declarations are treated as pass/fail evidence | Declarations may not run; residual colour fades and spatial movement differ. | Add triggered scenarios and review purpose, cues and outcomes. |
| Zero print overlaps appears reassuring | The collector measured the browser viewport while the PDFs used paper layout. | Treat the result as inconclusive until paper-size evidence is validated. |
| Basic page exists in a Standard-profile Lab | The supplied pair returned 404 at that route despite reporting Standard. | Inspect recipe/configuration; choose an existing fixture rather than inferring a defect. |

Nothing in this register approves a replacement policy. Resolve a row through a
reviewed change naming the affected instruction, rationale, version scope and
verification. Do not promote observed majority styling into a standard.
