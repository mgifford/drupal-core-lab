# Targeted summary amendment for #867830

**DRAFT, 2026-11-17.** For human review; nothing posted.
Keep the original report and discussion. Make only these edits to the
[core issue](https://www.drupal.org/project/drupal/issues/867830).

## 1. Add to Problem/Motivation

Reproduce on core `main` with Default Admin, using the same published and
unpublished node/comment fixtures across themes. The solution should also work
with Claro, Olivero and newly generated Starterkit themes.
[Comment 312](https://www.drupal.org/project/drupal/issues/867830#comment-16829676)
reports subtle unpublished backgrounds and questions the existing Navigation
Top Bar status chip in light and dark modes. Check rendered nodes and comments
with and without that bar. Low background contrast alone does not establish a
WCAG failure where equivalent status text is available.

## 2. Replace the obsolete theme checklist in Remaining tasks

Keep the old Bartik/Stark/Claro table as **historical patch results**, not current
acceptance criteria. Replace its introductory task with:

- Reproduce on a recorded core `main` revision with Default Admin; add steps and
  light/dark screenshots.
- Agree how visible and accessible unpublished status should work across
  rendering contexts, including the existing status chip, without needless duplication.
- Implement the agreed fix; verify automated tests, contrast and manual
  accessibility checks, then obtain independent code and accessibility review.
- Track Claro's theme overrides separately in the
  [Claro project](https://www.drupal.org/project/claro), linking both issues once
  that follow-up exists. Coordinate Olivero's overrides in the
  [Olivero project](https://www.drupal.org/project/olivero); include Default Admin
  and Starterkit template changes in Core.

## 3. Add under User interface changes

Current **Before** evidence from November 2026:
[Default Admin light](https://www.drupal.org/files/issues/2026-11-03/867830-311-default-admin-current.light_.png)
and [Default Admin dark](https://www.drupal.org/files/issues/2026-11-03/867830-311-default-admin-current.dark_.png).
These community screenshots are not validation of the lab proposal.

## Review notes, not additional summary text

- Keep the existing problem statement, proposed resolution and original report.
- Do not remove the summary-update tag until a person checks the revised summary.
- Do not mark RTBC from this documentation change or the existing lab results.
- Proposed Claro follow-up and MR outline: [CLARO-FOLLOWUP-DRAFT.md](CLARO-FOLLOWUP-DRAFT.md).
- Shared six-step fixture walkthrough: [REPRODUCE.md](REPRODUCE.md).
  Representative Default Admin testing plus shared status checks is sufficient
  for this lab's automated scope; do not claim live coverage for all themes.
  Existing Starterkit-generated themes need their copied templates updated.

**AI disclosure**

This contribution was prepared with assistance from an AI coding tool.
- Tool: Copilot SDK in VS Code; model/version unavailable.
- Used for: source review and drafting this amendment.
- Reviewed by: pending human review; not approved for posting.
- Skills loaded: drupal-accessibility (sub-skills: drupal-a11y-qa, drupal-a11y-dom).
