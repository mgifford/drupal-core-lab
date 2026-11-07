# Accessibility tree, ARIA and speech: https://repro-baseline-867830.ddev.site vs https://repro-issue-867830.ddev.site

Generated 2026-11-06T20:53:52.018Z. Before: https://repro-baseline-867830.ddev.site. After: https://repro-issue-867830.ddev.site.
Chromium 156.0.8078.4, viewport 1280x900, logged in: yes. State: each page as it loads (no clicks).

**4 of 9 views differ.** Hostnames, tokens, random id suffixes and content dates are normalised away.

| Page | Accessibility tree | ARIA after JavaScript | Speech (Guidepup) | Items spoken (Before / After) |
|---|---|---|---|---|
| `/lab/unpublished-article` | [+6 −4](01-lab-unpublished-article.axtree.diff) | same | [+7 −5](01-lab-unpublished-article.speech.diff) | 204 / 206 |
| `/lab/unpublished-page` | same | same | same | 95 / 95 |
| `/lab/published-article` | [+3 −3](03-lab-published-article.axtree.diff) | same | [+4 −4](03-lab-published-article.speech.diff) | 176 / 176 |

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
