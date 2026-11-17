# #867830: "Unpublished" style of rendered entities is not accessible

**DRAFT.** Historical evidence from 2026-11-06; current-Core proposal tested on
2026-11-09, with a focused Default Admin replay on 2026-11-17.
No person has reviewed it, no real screen reader was run. Nothing has been posted.

November 17 follow-up drafts: [targeted core summary amendment](ISSUE-SUMMARY-UPDATE-DRAFT.md)
and [separate Claro issue/MR proposal](CLARO-FOLLOWUP-DRAFT.md).
The refreshed [community brief](intake/BRIEF.md) includes comments 316 and 317.
These drafts do not validate the status chip or change the recorded test results.
The solution's scope is Default Admin, Claro, Olivero and newly generated
Starterkit themes, using one status convention with separate project patches.
The [shared walkthrough](REPRODUCE.md) uses the same three-node fixture throughout;
separate automated suites for all four themes are not required. Existing
Starterkit-generated themes need their copied templates updated separately.
The [November 17 replay](EVIDENCE.md#focused-default-admin-replay-2026-11-17)
passes the scripted status checks in Default Admin light, dark preference and
forced colours. This does not resolve the existing status-chip review or provide
live Starterkit coverage.

Issue: [#867830 on Drupal.org](https://www.drupal.org/project/drupal/issues/867830)
(Active, Major, opened 2010; 317 comments as of 2026-11-17; tagged WCAG 1.4.11 on 2026-11-04).
See the [current upstream status](STATUS-2026-11-17.md) and
[evidence directory on GitHub](https://github.com/mgifford/drupal-core-lab/tree/main/reports/issues/867830).
The historical comparison pins Core `422099995ecf` (11.x, 2025-07-11) and fork branch
`867830-unpublished-style-of`, commit `0fcbb553` (the #306 re-roll). **No upstream merge request.**

## New current-Core proposal (2026-11-09)

**AI-assisted local draft, separate from the historical patch below.** Three new patches
are registered in `867830-current-authoring`: [Core](branches/867830-current-core-status.patch),
[Olivero](branches/867830-olivero-status.patch), and [Claro](branches/867830-claro-status.patch).
The Core pin is `3fb1c69d3692`; the Core patch also applies cleanly to main
`f6102ad483c5390eb46baeff2ad1374783500491` (2026-11-09).
`867830-current-latest` follows main for future compatibility checks.

The proposal adds a bold visible **Unpublished** label, with hidden "This node is"
or "This comment is" context, independently of author metadata. It preserves status
classes, existing background cues and the generic mark hook. Published content is unmarked.
Core covers the generic templates, Default Admin, Starterkit and Umami; contrib Olivero
also covers its separate teaser template.

Live Chromium light and forced-colour checks passed in **Olivero, Claro and Default Admin**:
all 12 fix rows pass, no regression rows fail, and Guidepup reads each draft node and
held comment's contextual label exactly once. Published nodes/comments remain unmarked.
The probe reported minimum label-text contrast of 11.64:1 in light mode and 21:1 in forced
colours. It does not composite translucent backgrounds or support every CSS colour syntax;
these observations do not settle the community's status-chip contrast questions.
Core lint and all five contrib Twig files pass; the Lab self-test passes all nine checks.
See [current proposal evidence](EVIDENCE.md#current-core-proposal-2026-11-09) and
[reproduction commands](REPRODUCE.md#new-current-core-proposal-2026-11-09).

Not verified: a person's keyboard/visual pass, real VoiceOver/NVDA, participant usability,
live Starterkit/Umami rendering, current-proposal Firefox/WebKit or narrow viewport;
dark mode outside the November 17 Default Admin replay.
Guidepup is synthetic evidence, not human acceptance. The patches remain proposals;
no Drupal.org comment or Claro merge request has been submitted by the lab.

## Historical baseline: barrier, task and expected outcome

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

For the current proposal, use `867830-current-authoring` and the
[shared three-node walkthrough](REPRODUCE.md#shared-walkthrough-2026-11-17).
Start its registered comparison with `node scripts/lab-env.mjs start 867830-current-authoring --browser`.
Before is pristine; After applies the Core proposal and the separately pinned Claro/Olivero patches.
Use the [patch provenance](BRANCHES.md) for exact revisions and hashes.

The following describes the historical comparison, not the current proposal:

REPRODUCE.md: variant `867830-pinned`, recipe `repro_867830` (three nodes with `/lab/...` aliases, Stark installed), Before pristine, After =
branch patch then lab follow-up. Scripted: `tools/playwright/evaluate-867830.mjs` (three themes, both sides, three pages). Viewer steps switch
the theme by hand, mirrored.

## Not verified and next actions

- Not run: real VoiceOver or NVDA; a person's visual and keyboard pass; the historical branch's PHPUnit changes;
  live Starterkit/Umami rendering; a fresh build of `867830-current-latest`.
- Next: @mgifford opens `867830-current-authoring` in the viewer, follows the shared checklist and captures light/dark Before/After.
  Record manual results in [EVIDENCE.md](EVIDENCE.md), then review the targeted summary amendment and Claro follow-up.
- Agree the rendering scope and accessible status text, including interaction with the existing Navigation Top Bar chip.
  Do not treat the scripted label checks as resolution of that chip's styling or duplication questions.
- Complete independent code and accessibility review before requesting RTBC. The current issue status is Active, not RTBC.

## Acceptance and verification

Observable outcomes for a future patch, in each theme that remains in core: a draft node and a held comment each carry visible text naming the
state; the text has hidden context for screen readers; the cue survives forced colours; the `node--unpublished` and comment status classes stay
(or are deprecated with a change record); no published entity gets a marker or an empty class; no `MARK_*` or `status` consumer breaks. Checks
that exist: `evaluate-867830.mjs` fix and regression rows, `tree-diff.mjs`, `lint.mjs`. Needed in addition: a person with a screen reader, and
`try-tests.mjs` for the branch's tests. Severity (task impact): state invisible to many users. Priority: the issue's Major stands.

## Sources

- [Community snapshot](intake/BRIEF.md), refreshed 2026-11-17: 317 comments and 18 related issues; no merge request found.
  Historical evaluation used the November 6 snapshot. The API provides no body for comment 317, so its field/attachment changes are not inferred.
- git.drupalcode.org: fork `issue/drupal-867830`, branch `867830-unpublished-style-of`; MR search by source branch: none.
- GitHub drupal/drupal commit history for the removed files (BRANCHES.md).

## Reporting guidance

Adapted for Lab issue evaluation from
[Accessibility Bug Reporting Best Practices](https://github.com/mgifford/ACCESSIBILITY.md/blob/main/examples/ACCESSIBILITY_BUG_REPORTING_BEST_PRACTICES.md).
Describe visual evidence in text; the screenshots are in each run folder.
