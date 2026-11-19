# Human review: Drupal 3637339 clearance proposal

**DRAFT, AI-assisted. No human checks below have been performed or signed off.**
Use this guide to review the existing proposal, not to assume it is accessible or ready for RTBC.

## Which patch to review

| Your starting code | Apply only this artifact |
|---|---|
| Clean core `ecb483ff6d4b3845fcbc81700843d320c50e46c1` | [Complete revised patch](branches/3637339-focus-clearance-full.patch) |
| Exact MR !17818 tip `8c4a0e703168ebe9c3b37d3a8d00a2e89bc7ffa5` | [Clearance interdiff](branches/3637339-focus-clearance.patch) |

Do not apply the complete patch on top of the MR or together with the interdiff.
The registered Lab pair already has its declared patches applied; do not apply either artifact again to those sites.
[BRANCHES.md](BRANCHES.md) records full hashes, attribution and equivalent-tree checks.
The tested patch bytes are unchanged; this handoff adds review instructions, not another code revision.

The full proposal includes the MR's configured outline and adds clearance derived from the outline size and offset.
It changes only source and generated skip-link CSS. It does not change markup, accessible names, ARIA, destination or JavaScript.
Those are scope statements, not proof of unchanged behavior with real assistive technology.

## Start the registered comparison

From the Lab repository root, with local Docker and DDEV:

```bash
rtk proxy node scripts/doctor.mjs 3637339-focus-clearance
rtk proxy node tools/compare/setup.mjs 3637339-focus-clearance --check-patches
rtk proxy node scripts/lab-env.mjs start 3637339-focus-clearance
```

The pair is already built. If the doctor reports a missing environment, follow [REPRODUCE.md](REPRODUCE.md);
do not reset, reinstall or refresh patches just to start a review.

| Side | Code and page |
|---|---|
| Before | MR only: [Default Admin settings](https://repro-issue-3637339-latest.ddev.site/admin/appearance/settings/default_admin) |
| After | MR plus clearance: [Default Admin settings](https://repro-issue-3637339-focus-clearance.ddev.site/admin/appearance/settings/default_admin) |

Both use fixed core `ecb483ff6d4b`. Before is deliberately **not pristine core**.
To reproduce the original color defect separately, use `3637339-latest` as described in [REPRODUCE.md](REPRODUCE.md).
Do not switch comparisons during a recorded operation.

1. Use the viewer's one-time login links in the browser you are testing. Do not copy login tokens into review evidence.
2. Record each site's initial appearance, accent and focus choices before changing them.
3. Use **Open outside this tool** to test each site in its own top-level tab. This avoids iframe navigation and focus mirroring.
4. Close developer tools and return to the page before recording keyboard actions.
5. Test sequentially. Do not run the evaluator while a person is changing settings.

The viewer can help navigate and compare captures. Screenshots cannot prove what a screen reader announced.
Never inject focus styles, call `focus()` from developer tools or use mirrored focus as test evidence.

## Record the environment once per session

Record a reviewer identifier, date/time, session identifier, comparison slug, full core commit, ordered patch hashes,
page URL without login tokens, OS, browser and screen-reader versions, language/direction, CSS viewport, zoom,
OS color preference, saved appearance/accent/focus choices, and any OS contrast theme.
Use [BRANCHES.md](BRANCHES.md) to identify the declared stack, then confirm the checkout being reviewed matches it.

On macOS, record keyboard-navigation and Safari link-tabbing preferences. If plain Tab skips the link on both sides,
record that limitation. A separately labeled Option+Tab trial does not turn it into a plain-Tab pass.
Use actual Safari for VoiceOver review; Playwright WebKit is not a Safari/VoiceOver test.

## Keyboard and visible-focus pass

Save identical choices through both settings forms. Then reload each document and start from browser chrome.
Advance one key at a time, observing the actual destination; do not assume a fixed number of Tabs.
Run K1-K3 on both sides for every row:

| ID | Saved appearance | Accent | Focus | Human result |
|---|---|---|---|---|
| C1 | Light | Blue (Default) | Orange | UNTESTED |
| C2 | Dark | Blue (Default) | Green | UNTESTED |
| C3 | Light | Pink | Same as Accent color | UNTESTED |
| C4 | Dark | Pink | Same as Accent color | UNTESTED |
| C5 | Light | Pink | Orange | UNTESTED |
| C6 | Dark | Pink | Orange | UNTESTED |

| Operation | Action | Expected observation |
|---|---|---|
| K1: reach and inspect | Tab from a fresh page until Skip to main content is focused. Inspect the complete ring. | Both sides use the saved focus color. MR-only Before clips top/start; After should show the complete ring without hiding its text. |
| K2: reverse navigation | Tab to the next control, then Shift+Tab back to the skip link. | Focus returns to the same link. Its indicator reappears, and forward/reverse navigation remains usable. |
| K3: activate and continue | From the focused link, press Enter, then Tab. Record scroll, focus and next control. | Navigation reaches main content. It should not strand focus or return to navigation that the link was meant to bypass. Compare both sides. |

Capture the genuinely focused state on each side before switching tabs. Inspect paint, not just computed outline bounds.
For K1, After is expected to improve visibility; the expected clipped Before state is not a failure of the local follow-up.
Use a contrast-measurement tool if judging contrast; appearance alone cannot establish a numeric ratio.

For Comment #7, additionally record Pink accent with the independent **Default** focus choice in Light and Dark.
The saved focus choice must be written down; Pink accent alone does not request Pink focus.
Treat these as diagnostic trials, not a reconstruction of what the commenter selected.

## Real screen-reader pass

Use at least one real pairing: VoiceOver with Safari, or NVDA with Firefox/Chrome.
Test C1 and C4 at minimum; list other configurations as UNTESTED if not reviewed.
Record the screen reader's navigation mode, modifier settings and exact commands.

| Operation | Action | Expected observation |
|---|---|---|
| S1: find the link | From a fresh page, locate Skip to main content using keyboard focus and the screen reader's link navigation or links list. | It is discoverable with a useful name and link role. Record the words actually spoken on each side. |
| S2: activate and read | Activate that exact link using the screen reader's normal command. Read the next content, then continue with Tab. | Reading/navigation reaches main content, with no new focus or reading-position regression in After. |
| S3: cross-check | Compare announcements and continuation with the MR-only side in the same saved configuration. | The CSS-only follow-up should not introduce duplicate speech, a missing link, or a changed destination. Report differences rather than assuming equivalence. |

Do not require one exact announcement phrase across screen readers.
A changed URL fragment or an accessibility-tree snapshot alone does not establish a successful screen-reader experience.
If focus and reading position disagree, record both. Do not repair the state with a mouse click and call the operation passed.

## Remaining visual and platform checks

Run these on both sides with C1 and C4 where the platform supports them. Record actual dimensions and settings.

| Operation | Check | Human result |
|---|---|---|
| V1 | At 1280px and about 375px wide, inspect the focused ring and link text at the top/start edge. | UNTESTED |
| V2 | At 200% browser zoom, repeat K1-K3. At 400%, test about 320 CSS px of available width and record clipping, overlap and horizontal scrolling. | UNTESTED |
| V3 | On real Windows with an OS contrast theme, repeat K1-K3. System colors may replace the author's selected color; the ring and text must remain perceivable. | UNTESTED |
| V4 | With a real RTL-language page, repeat K1-K3 and inspect the logical-start edge. Direction-only simulation does not complete this row. | UNTESTED |

If Windows or an RTL-language setup is unavailable, leave that operation UNTESTED and identify the needed reviewer/environment.
Browser forced-colors emulation is supplemental evidence, not completion of V3.
Do not install languages or alter the shared comparison's baseline during review; arrange a separately declared setup if needed.

## Write one observation per operation and side

Copy this blank record into your review notes; repeat it for each configuration, operation and side you actually test.
Initial status is UNTESTED. Preserve earlier records when repeating a test in a new session.

| Field | Reviewer entry |
|---|---|
| Session, environment and exact stack | Not recorded |
| Configuration, side and operation ID | Not recorded |
| Starting focus/reading position and how reached | Not recorded |
| Keys or screen-reader commands, in order | Not recorded |
| Expected result | Copy the relevant predicate above |
| Observed focus, scroll and next destination | Not recorded |
| Words actually spoken, if using a screen reader | Not recorded |
| Screenshot/recording reference, without credentials | Not recorded |
| Status: PASS, FAIL, BLOCKED or UNTESTED | UNTESTED |
| Limitation or follow-up needed | Not recorded |

PASS means the recorded operation met its stated expectation, not that the whole issue conforms to WCAG.
FAIL records a contrary observation; BLOCKED records an attempted operation the environment or missing instrument prevented deciding.
UNTESTED means no usable observation was collected. Do not replace observations with "works" or "as expected."
Do not declare a keyboard trap from one stationary focus observation: attempt the normal exit and record what happens.

## Upstream feedback and submission gate

The intake was refreshed at `2026-11-18T23:16:39.876Z`: seven comments, unchanged MR tip.
The public MR overview was also read, but its discussion text was not exposed.

| Item | What this handoff supplies | Still open |
|---|---|---|
| Public Comment #4: selector scope and focus styling | Source trace and unchanged-MR browser evidence support the selector explanation. The proposal retains the MR's outline declarations. | Real AT and OS contrast checks above. Computed box-shadow was `none` on the tested page; no shadow override was added. |
| Public Comment #7: no apparent Pink/dark change | C3-C6 and the independent-Default diagnostics record accent and focus separately. | A human repeats the settings and reports the exact observed result. The original commenter's focus choice remains unknown. |
| Public Comments #5-#6: AI assistance | Draft disclosure and an explicit human-rewrite requirement. | The human author reviews, understands and rewrites any text before posting. |
| MR !17818 discussions | API retry still returned HTTP 401. | A person reads the discussions or supplies their text. No inaccessible review concern is claimed addressed. |
| Related Gin review | The linked summary was previously read. | Gin comments and MR !581 discussions remain unread; obtain relevant context before submission. |

Preflight outcome: **revise before submission**. The receiving core instructions discourage LLM-written Drupal.org prose;
operator-requested drafts require human rewriting and the exact disclosure line already in the comment draft.
This checklist is a local working document, not a Drupal.org comment.

Before deciding on RTBC or an upstream update:

- Review every line of the [interdiff](branches/3637339-focus-clearance.patch) and understand the token-derived positioning.
- Inspect [the evidence and limitations](EVIDENCE.md); identify which human operations above remain unresolved.
- Have another reviewer independently confirm the decisive correction where possible; retain contrary observations.
- Resolve the inaccessible-review gap and answer actual concerns individually, without assuming agreement.
- Replace relative evidence links with attachments or accessible links in the [comment draft](ISSUE-COMMENT-DRAFT.md).
- Obtain approval before posting or pushing. Follow [BRANCHES.md](BRANCHES.md) for the existing-MR versus new-branch route.

No human results, contributor agreement or upstream acceptance have been recorded here.
Owner of the next action: the human contributor and accessibility reviewer.
When finished, restore the initial settings on both sites, then stop the pair without deleting it:

```bash
rtk proxy node scripts/lab-env.mjs stop 3637339-focus-clearance
```
