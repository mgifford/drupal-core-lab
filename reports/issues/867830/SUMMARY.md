# #867830: "Unpublished" style of rendered entities is not accessible

**DRAFT.** Scripted evidence from 2026-11-06; no person has reviewed it, no real screen reader was run. Nothing has been posted.

Issue: https://www.drupal.org/project/drupal/issues/867830 (Active, Major, opened 2010; 315 comments; tagged WCAG 1.4.11 on 2026-11-04).
Pinned core: `422099995ecf` (11.x, 2025-07-11). Fork branch: `867830-unpublished-style-of`, commit `0fcbb553` (the #306 re-roll). **No merge request.**

## Barrier, task and expected outcome

Someone who may see unpublished content opens a node or comment that is not published. The only cue is a pale pink background on the node
(`#fff4f4`: measured 1.01:1 in Olivero, 1.08:1 in Claro) and an unstyled CSS class on the comment. There is no text, nothing in the
accessibility tree, and in forced colours the background is plain white on both sides. Expected: a visible text marker with hidden context for
screen readers ("This node is unpublished"), in every front-end theme, that does not depend on colour. (Measurements: tool output. Impact: the
issue's report; not tested with disabled participants.)

## What the lab found (EVIDENCE.md has the rows and run folders)

1. **The #306 re-roll breaks every page as submitted.** It deletes the `MARK_*` constants but `ThemeCommonElements.php` still defaults the
   `mark` hook to `MARK_NEW`: `Undefined constant "Drupal\Core\Theme\MARK_NEW"` on every request. A two-line lab follow-up
   (`branches/867830-lab-followup-mark-hook-defaults.patch`, After only, named everywhere) was needed to see anything else.
2. **Olivero is unchanged by it.** Standard's front-end theme on that core: pink only, before and after; published comments gain a broken
   `comment--` class.
3. **Claro:** an unstyled word "unpublished" appears after "Submitted by" on articles and in held comments; not on Basic pages (tied to
   `display_submitted`); the pink background and the `node--unpublished` / `unpublished` classes are removed. The `classy/marker` library the
   templates attach does not exist.
4. **Stark:** "unpublished" as a bare text node inside comments only; nothing on nodes (core's `node.html.twig` does not print `markers`).
5. **Nowhere** is there the visually hidden context the issue summary asks for. Speech (synthetic): Claro After adds exactly two items, each the
   single word "unpublished".
6. Same result in Chromium, Firefox and WebKit, light, dark, forced colours and 480 px. axe counts identical on both sides. Lint: one Stylelint
   error (Umami `node.css`).
7. **Core has moved on:** Olivero, Claro, Stable 9 and History are no longer in core `main`, so the branch does not apply there and
   `867830-latest` is not buildable. A next patch targets core's own `node`, `comment` and `mark` templates plus `default_admin`, Starterkit and
   Umami, with Olivero and Claro in contrib.

## People affected and evidence basis

Low-vision users, people in bright light or on small screens, forced-colours and custom-stylesheet users, and screen reader users: the state is
conveyed by a near-invisible colour or not at all. Basis: DOM and computed-colour measurements, axe, Chromium's accessibility tree and Guidepup
speech on both sides (tool output); the user impact is the issue's own report and inference from the measurements. No user testimony or
participant testing was collected here.

## Reproduction and comparison

REPRODUCE.md: variant `867830-pinned`, recipe `repro_867830` (three nodes with `/lab/...` aliases, Stark installed), Before pristine, After =
branch patch then lab follow-up. Scripted: `tools/playwright/evaluate-867830.mjs` (three themes, both sides, three pages). Viewer steps switch
the theme by hand, mirrored.

## Not verified and next actions

- Not run: real VoiceOver or NVDA; a person's visual and keyboard pass; the branch's PHPUnit changes; Umami, Starterkit, Stable 9 output; current core.
- Next: a person opens the viewer (`node scripts/lab-env.mjs start 867830-pinned --browser`), looks at `/lab/unpublished-article` in Olivero and
  Claro on both sides, and fills in the manual rows in EVIDENCE.md. Then review ISSUE-COMMENT-DRAFT.md. Owner: @mgifford. Date: open.
- Decision for the issue: whether to re-roll the #306 approach against current core (core templates and `default_admin`) or to start from the
  summary's "status_marker" variable idea (#306) with hidden context text and a non-colour cue.

## Acceptance and verification

Observable outcomes for a future patch, in each theme that remains in core: a draft node and a held comment each carry visible text naming the
state; the text has hidden context for screen readers; the cue survives forced colours; the `node--unpublished` and comment status classes stay
(or are deprecated with a change record); no published entity gets a marker or an empty class; no `MARK_*` or `status` consumer breaks. Checks
that exist: `evaluate-867830.mjs` fix and regression rows, `tree-diff.mjs`, `lint.mjs`. Needed in addition: a person with a screen reader, and
`try-tests.mjs` for the branch's tests. Severity (task impact): state invisible to many users. Priority: the issue's Major stands.

## Sources

- drupal.org issue snapshot 2026-11-06 (`intake/BRIEF.md`): summary, #13, #306, #313 to #315; related #3173855, #3323028, #1311372, #2290101.
- git.drupalcode.org: fork `issue/drupal-867830`, branch `867830-unpublished-style-of`; MR search by source branch: none.
- GitHub drupal/drupal commit history for the removed files (BRANCHES.md).

## Reporting guidance

Adapted for Lab issue evaluation from
[Accessibility Bug Reporting Best Practices](https://github.com/mgifford/ACCESSIBILITY.md/blob/main/examples/ACCESSIBILITY_BUG_REPORTING_BEST_PRACTICES.md).
Describe visual evidence in text; the screenshots are in each run folder.
