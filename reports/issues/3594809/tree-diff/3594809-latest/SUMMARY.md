# Accessibility tree, ARIA and speech: 3594809-latest

Generated 2026-11-25T12:04:03.630Z. Before: `baseline-3594809-latest` (1dec2b8cc1 2026-11-24). After: `issue-3594809-latest` (1dec2b8cc1 2026-11-24).
Chromium 159.0.8154.6, viewport 1280x900, logged in: yes. State: each page as it loads (no clicks).

**7 of 39 views differ.** Hostnames, tokens, random id suffixes and content dates are normalised away.

| Page | Accessibility tree | ARIA after JavaScript | Speech (Guidepup) | Items spoken (Before / After) |
|---|---|---|---|---|
| `/admin/lab/checkboxes` | same | same | same | 242 / 242 |
| `/admin/appearance/settings` | same | same | same | 176 / 176 |
| `/admin/appearance/settings/default_admin` | same | same | same | 246 / 246 |
| `/admin/modules` | same | same | same | 1063 / 1063 |
| `/admin/people/permissions` | same | same | same | 3481 / 3481 |
| `/admin/structure/types/manage/article` | same | same | same | 226 / 226 |
| `/admin/structure/views` | same | same | same | 451 / 451 |
| `/admin/config/content/formats` | same | same | same | 272 / 272 |
| `/admin/content` | [+18 −18](09-admin-content.axtree.diff) | [+6 −6](09-admin-content.aria.diff) | [+42 −42](09-admin-content.speech.diff) | 454 / 454 |
| `/admin/content/media` | [+12 −12](10-admin-content-media.axtree.diff) | [+3 −3](10-admin-content-media.aria.diff) | [+21 −21](10-admin-content-media.speech.diff) | 344 / 344 |
| `/admin/content/media-grid` | [+3 −3](11-admin-content-media-grid.axtree.diff) | same | same | 239 / 239 |
| `/node/add/article` | same | same | same | 201 / 201 |
| `/fa/admin/lab/checkboxes` | same | same | same | 242 / 242 |

## ID references that do not resolve

An aria-labelledby, aria-describedby, aria-controls, for (and the like) that names no element, or an id used more than once, loses or confuses the relationship it is meant to give.

| Change | Page | Element | Attribute | Problem |
|---|---|---|---|---|
| on both sides | `/admin/appearance/settings` | `details#edit-favicon` | aria-describedby | no element has id `edit-favicon--description` |
| on both sides | `/admin/appearance/settings/default_admin` | `details#edit-favicon` | aria-describedby | no element has id `edit-favicon--description` |
| on both sides | `/admin/structure/types/manage/article` | `label.form-item__label.visually-hidden` | for | no element has id `edit-additional-settings` |
| on both sides | `/admin/content` | `td.views-field.views-field-title` | headers | id `view-title-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.views-field.views-field-type` | headers | id `view-type-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.priority-low.views-field` | headers | id `view-name-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.views-field.views-field-status` | headers | id `view-status-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.priority-low.views-field` | headers | id `view-changed-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.views-field.views-field-langcode` | headers | id `view-langcode-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.views-field.views-field-operations` | headers | id `view-operations-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.views-field.views-field-title` | headers | id `view-title-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.views-field.views-field-type` | headers | id `view-type-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.priority-low.views-field` | headers | id `view-name-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.views-field.views-field-status` | headers | id `view-status-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.priority-low.views-field` | headers | id `view-changed-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.views-field.views-field-langcode` | headers | id `view-langcode-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.views-field.views-field-operations` | headers | id `view-operations-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.views-field.views-field-title` | headers | id `view-title-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.views-field.views-field-type` | headers | id `view-type-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.priority-low.views-field` | headers | id `view-name-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.views-field.views-field-status` | headers | id `view-status-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.priority-low.views-field` | headers | id `view-changed-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.views-field.views-field-langcode` | headers | id `view-langcode-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.views-field.views-field-operations` | headers | id `view-operations-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.views-field.views-field-title` | headers | id `view-title-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.views-field.views-field-type` | headers | id `view-type-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.priority-low.views-field` | headers | id `view-name-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.views-field.views-field-status` | headers | id `view-status-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.priority-low.views-field` | headers | id `view-changed-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.views-field.views-field-langcode` | headers | id `view-langcode-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.views-field.views-field-operations` | headers | id `view-operations-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.views-field.views-field-title` | headers | id `view-title-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.views-field.views-field-type` | headers | id `view-type-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.priority-low.views-field` | headers | id `view-name-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.views-field.views-field-status` | headers | id `view-status-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.priority-low.views-field` | headers | id `view-changed-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.views-field.views-field-langcode` | headers | id `view-langcode-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.views-field.views-field-operations` | headers | id `view-operations-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.views-field.views-field-title` | headers | id `view-title-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.views-field.views-field-type` | headers | id `view-type-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.priority-low.views-field` | headers | id `view-name-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.views-field.views-field-status` | headers | id `view-status-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.priority-low.views-field` | headers | id `view-changed-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.views-field.views-field-langcode` | headers | id `view-langcode-table-column` is on 2 elements |
| on both sides | `/admin/content` | `td.views-field.views-field-operations` | headers | id `view-operations-table-column` is on 2 elements |

## What each view is

- **Accessibility tree** (`*.axtree.diff`): Chromium's accessibility tree (the "AXTree"): role, name, description, value and states of each node, indented. What the browser hands to a screen reader through the platform accessibility API.
- **ARIA after JavaScript** (`*.aria.diff`): Each element with a role, aria-* attribute, tabindex, hidden or inert, and each link, button, form control, summary, details, dialog, iframe and image, with those attributes as the page's JavaScript left them. Every ID reference (aria-labelledby, aria-describedby, aria-controls, for, ...) is looked up: [missing #id] or [#id ×n] marks one that does not resolve to exactly one element.
- **Speech (Guidepup)** (`*.speech.diff`): What the Guidepup virtual screen reader says moving through the whole page item by item (like the down arrow in a screen reader's browse mode), on a copy of the DOM in which everything Chromium does not render is hidden.

Every view in full: `before/` and `after/`. In a diff, `-` lines are Before only, `+` lines After only.

## Limits

- Each page as it loads. States reached by clicking (an opened dialog, an expanded menu, an error after Save) need the issue's evaluator or the viewer.
- Chromium only. Firefox and Safari build their own trees, and real screen readers (NVDA, JAWS, VoiceOver, TalkBack) add their own behaviour: Guidepup is a model of one, by decision (docs/TESTING-TOOLS.md).
- A difference is evidence for a person to read, not a verdict: a changed line can be the fix itself.
