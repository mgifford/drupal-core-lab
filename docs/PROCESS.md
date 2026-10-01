# PROCESS.md

## Goal

Create a repeatable, low-risk workflow to evaluate and fix older Drupal Core accessibility issues locally, in small iterations, with clear evidence.

## Working style

- Work one issue at a time.
- Keep changes small and local.
- Commit frequently with short, scoped messages.
- Record what was tested, what passed/failed, and what evidence was captured.

## Iteration loop (per issue)

1. Pick an issue
   - Start from the oldest open Major accessibility issue list.
   - Skip postponed issues.
2. Understand the report
   - Summarize the problem in plain language.
   - Identify affected Drupal UI and likely local routes.
3. Reproduce in local DDEV site
   - Verify current behavior in `http://drupal-core.ddev.site`.
   - Use keyboard-only first, then optional screen reader checks.
4. Decide if issue is still valid
   - Reproducible as reported, partially reproducible, or no longer reproducible.
   - Note if issue appears to be split across related issues.
5. Check for patches/interdiffs
   - Apply patch in a throwaway branch/worktree or clean git state.
   - Re-test identical steps and compare outcomes.
6. Capture evidence
   - Before/after screenshots and concise notes.
   - Include URL, user role, browser, and assistive tech used.
7. Commit small, local increments
   - One logical change per commit.
   - Keep docs/testing artifacts separate from code changes where practical.

## Local environment baseline

- Base URL: `http://drupal-core.ddev.site`
- Drupal root: repository root
- Use an admin user for toolbar/contextual links validation

Useful commands:

- `ddev launch`
- `ddev drush cr`
- `ddev drush uli`
- `ddev drush status`

## Quick triage checklist (generic)

- Can keyboard users reach all relevant controls?
- Is focus visible at each step?
- Are control names clear out of context?
- Do disclosure/toggle controls expose state (`aria-expanded`) when needed?
- Are hidden/collapsed items correctly absent from navigation until expanded?
- Is behavior consistent across at least one modern browser and one screen reader path when available?

## Evidence template

For each issue, capture:

- Issue URL:
- Local route(s):
- User role:
- Browser + version:
- Assistive tech (if used):
- Steps to reproduce:
- Actual result:
- Expected result:
- Repro status: (Yes / Partial / No)
- Patch tested: (None / URL / filename)
- Screenshot before:
- Screenshot after:
- Notes / related issues:

## Commit conventions

Use concise commit prefixes:

- `docs(process): ...`
- `a11y(toolbar): ...`
- `test(a11y): ...`
- `chore(local): ...`

Examples:

- `docs(process): add issue triage loop for local a11y testing`
- `a11y(toolbar): improve disclosure state semantics for shortcuts toggle`
- `test(a11y): add manual test notes for issue 3046089`

## Issue #3046089 starting point

Issue: Accessibility of Main toolbar items and internal editing

Initial local routes to inspect:

- Toolbar navigation: `/admin`
- Content admin screen with toolbar context: `/admin/content`
- Front page with contextual links context: `/`

For this issue, verify:

- Top-level toolbar items are reachable by keyboard without skipping critical navigation.
- Expand/collapse controls communicate state and purpose.
- Contextual "open configuration options" controls are understandable out of context.

## Notes

- Do not assume old issue details still match current core behavior.
- If a report conflates multiple defects, split findings into narrower follow-up tasks.
- Keep each iteration reversible and easy to review.