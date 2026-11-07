# Accessibility tree, ARIA and speech: 867830-pinned

Generated 2026-11-06T20:52:28.115Z. Before: `baseline-867830` (422099995e 2025-07-11). After: `issue-867830` (422099995e 2025-07-11).
Chromium 156.0.8078.4, viewport 1280x900, logged in: yes. State: each page as it loads (no clicks).

**4 of 9 views differ.** Hostnames, tokens, random id suffixes and content dates are normalised away.

| Page | Accessibility tree | ARIA after JavaScript | Speech (Guidepup) | Items spoken (Before / After) |
|---|---|---|---|---|
| `/lab/unpublished-article` | [+2 −2](01-lab-unpublished-article.axtree.diff) | same | [+2 −2](01-lab-unpublished-article.speech.diff) | 249 / 249 |
| `/lab/unpublished-page` | same | same | same | 146 / 146 |
| `/lab/published-article` | [+1 −1](03-lab-published-article.axtree.diff) | same | [+1 −1](03-lab-published-article.speech.diff) | 222 / 222 |

## ID references that do not resolve

None on either side.

## What each view is

- **Accessibility tree** (`*.axtree.diff`): Chromium's accessibility tree (the "AXTree"): role, name, description, value and states of each node, indented. What the browser hands to a screen reader through the platform accessibility API.
- **ARIA after JavaScript** (`*.aria.diff`): Each element with a role, aria-* attribute, tabindex, hidden or inert, and each link, button, form control, summary, details, dialog, iframe and image, with those attributes as the page's JavaScript left them. Every ID reference (aria-labelledby, aria-describedby, aria-controls, for, ...) is looked up: [missing #id] or [#id ×n] marks one that does not resolve to exactly one element.
- **Speech (Guidepup)** (`*.speech.diff`): What the Guidepup virtual screen reader says moving through the whole page item by item (like the down arrow in a screen reader's browse mode), on a copy of the DOM in which everything Chromium does not render is hidden.

Every view in full: `before/` and `after/`. In a diff, `-` lines are Before only, `+` lines After only.

## Limits

- Each page as it loads. States reached by clicking (an opened dialog, an expanded menu, an error after Save) need the issue's evaluator or the viewer.
- Chromium only. Firefox and Safari build their own trees, and real screen readers (NVDA, JAWS, VoiceOver, TalkBack) add their own behaviour: Guidepup is a model of one, by decision (docs/TESTING-TOOLS.md).
- A difference is evidence for a person to read, not a verdict: a changed line can be the fix itself.
