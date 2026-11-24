# Accessibility tree, ARIA and speech: 2574721-pinned

Generated 2026-11-23T17:08:48.225Z. Before: `baseline-2574721` (9e8373659f 2026-09-08). After: `issue-2574721` (9e8373659f 2026-09-08).
Chromium 159.0.8154.6, viewport 480x900, logged in: yes. State: each page as it loads (no clicks).

**3 of 3 views differ.** Hostnames, tokens, random id suffixes and content dates are normalised away.

| Page | Accessibility tree | ARIA after JavaScript | Speech (Guidepup) | Items spoken (Before / After) |
|---|---|---|---|---|
| `/admin/modules` | [+271 −0](01-admin-modules.axtree.diff) | [+94 −72](01-admin-modules.aria.diff) | [+497 −86](01-admin-modules.speech.diff) | 682 / 1093 |

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
