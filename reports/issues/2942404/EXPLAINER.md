# #2942404 Variant C: one "System messages" landmark

**DRAFT, AI-assisted. An explanation of a lab-authored option, not an upstream decision.**

## The problem this option addresses

Current Drupal main exposes each message group as a live region: `role="alert"` for errors and
warnings, `role="status"` for other types. It does not expose the message area itself as a landmark.
That leaves two gaps:

- After a page reload, a screen-reader user can find the messages only by reading in order or by the
  visually hidden `h2` headings. There is no landmark stop.
- A message added by `Drupal.Message` creates a plain `[data-drupal-messages]` container. It has no
  landmark at all, because the container is made by JavaScript rather than by a Twig template.

There is a third, related defect: in the system and starterkit templates the outer container has no
internal wrapper, so `defaultWrapper()` returns the first message group. A JavaScript message added
to a page that already has server messages is appended inside that group's `alert` or `status`
region. That nests one live region inside another.

## The design

One `region` landmark named "System messages" per default messages container:

```html
<div data-drupal-messages role="region" aria-label="System messages">
  <div role="status" aria-label="Status message">...</div>
  <div role="alert" aria-label="Warning message">...</div>
  <div role="alert" aria-label="Error message">...</div>
</div>
```

- The region is not a live region. It has no `aria-live`. Announcements still come only from the
  inner `alert` and `status` groups, and `Drupal.announce()` is unchanged.
- The per-type roles, names, headings, message IDs, message content, visual styling and focus are
  unchanged.
- Server-rendered messages get the region from the template.
- JavaScript-created default messages get it from `Drupal.Message`, on the same outer container.

The option is implemented in five templates (system, Default Admin, starterkit, Umami, and the
`test_messages` test theme) and in `core/misc/message.js`.

## The lifecycle in `core/misc/message.js`

`defaultWrapper()` still resolves the default container and returns the element that receives
messages. The constructor records default instances in a module-level `WeakSet`; a caller-supplied
wrapper is not recorded.

- **Construct:** no landmark. Merely making a `Drupal.Message` must not add one.
- **First successful `add()`:** add the landmark to the outer `[data-drupal-messages]` container.
- **More `add()` calls:** keep one landmark.
- **`remove()` / `clear()`:** keep the landmark while any message remains; remove it when the
  container has no messages left.
- **A later `add()`:** restore it.

The helper adds `role="region"` and an `aria-label` only when the container has no role, no
`aria-label` and no `aria-labelledby`. It records the assigned values in a module-level `WeakMap`
(and keeps `data-drupal-message-landmark` for observability). Cleanup removes `role` and
`aria-label` only when both still equal the recorded values and no `aria-labelledby` was added.
If another script changed the role, changed the name or added `aria-labelledby`, Drupal relinquishes
the landmark and leaves the changed attributes alone.

Consequences:

- Author-supplied roles, names and labelled-by references are never overwritten.
- A later external mutation is respected. Drupal does not fight another script for ownership.
- A contextual wrapper passed to `new Drupal.Message(element)` never gets the system landmark.
- An empty `.messages` group is not a message; a group with text or an image is.
- Multiple default instances share one container and one landmark. Removing one instance's message
  keeps the others; clearing the last message removes the landmark.

`defaultWrapper()` reuses an existing `.messages__wrapper`, or a first child that is not a live
region (the Default Admin and Umami shape). Otherwise it creates a `.messages__wrapper` after the
existing groups (the system and starterkit shape). `messageInternalWrapper()` takes an optional
insertion position; `defaultWrapper()` passes `'beforeend'`, so the wrapper is inserted once instead
of being inserted at the beginning and then moved. Existing callers that omit the argument still get
the previous `'afterbegin'` behaviour.

Message detection uses `[data-drupal-message-id]` and `.messages`, with a content check for a group
with no text and no image. The broad `[role="alert"]`/`[role="status"]` fallback is gone, so an
unrelated live region inside the container does not keep the landmark.

## How the four delivery paths are covered

| Path | How the region is added | Evidence |
|---|---|---|
| Server-rendered after a redirect or form submit | Twig template | Chromium scenarios; `MessageLandmarkTest` |
| JavaScript / AJAX default location | `Drupal.Message.add()` | Chromium lifecycle; `MessageCommandTest` |
| AJAX or file-upload custom wrapper | Not added (contextual) | `MessageCommandTest`, lifecycle custom-wrapper steps |
| BigPipe placeholder | Twig template, rendered in the placeholder | `BigPipeMessagesTest` |

Custom contextual wrappers stay unchanged, including the kind used for file-upload messages in
#3618230. They do not acquire a global system landmark.

## Default Admin dismissal: an existing defect, not fixed here

Default Admin's dismissal handler
(`core/themes/default_admin/migration/js/messages.js`) sets the message's opacity to `0` and adds
the `visually-hidden` class. It does not remove the message from the DOM.

Consequences:

- The message stays in the accessibility tree. Visually hidden is not hidden from assistive
  technology.
- The "System messages" landmark therefore remains after every message has been dismissed. It can
  contain only visually hidden content.
- The dismiss button is styled invisible but stays focusable; a keyboard user can tab to a control
  they cannot see. This is a separate focus and visibility question.

This option does not redesign dismissal. Removing the message from the DOM, or managing the landmark
around dismissal, would change the interaction and belongs in its own issue. The defect is recorded
in [SUMMARY.md](SUMMARY.md) and [EVIDENCE.md](EVIDENCE.md) as a limitation.

## Duplicate IDs

The six duplicate IDs seen in the JavaScript and empty-state scenarios are Views table-header IDs on
`/admin/content`:

- `view-title-table-column`
- `view-type-table-column`
- `view-name-table-column`
- `view-status-table-column`
- `view-changed-table-column`
- `view-operations-table-column`

Each appears twice on the page, on both Before and After. They are unrelated to the message markup
and are not fixed here. The improved evaluator records the values and elements, not just the count,
so a Before/After set comparison is possible.

## Multiple containers and multiple messages

The evaluator exercises a default container and two contextual wrappers (one outside the default
container, one inside it). Each default instance manages only its own `[data-drupal-messages]`
container. A page with more than one default container is not represented by a stock UI path; the
API behavior is covered by the lifecycle assertions, not by a stock page.

## Why a region and not something else

- `role="status"` or `role="alert"` on the outer container would nest live regions and could change
  announcement timing. The option deliberately does not.
- `role="region"` is a landmark with a author-provided name and no live semantics. It gives a
  landmark stop without adding an announcement.
- `aria-labelledby` pointing at a heading could be used instead of `aria-label`, but the heading text
  is per type and the outer container has no single heading. `aria-label="System messages"` is the
  smallest stable name and is translated with `Drupal.t()` / `|t`.

## Limits

- The region adds one landmark stop per page while messages exist. Whether that is useful is a
  design question for a person using a screen reader.
- The landmark remains while dismissed (visually hidden) messages remain in the DOM, because of the
  Default Admin defect above.
- A JavaScript-only page gets the region only after the first message. That is intentional: an empty
  container is not a landmark.
- The name is generic ("System messages"). It does not distinguish multiple containers on one page;
  no stock page has more than one default container.
- The real VoiceOver evidence predates the final ownership and detection changes. It verifies the
  region and roles for the two-patch code, not the final three-patch code.
- A custom `.messages` group that contains only a heading still counts as a message because its text
  is non-empty. Core templates do not render empty groups; this is an unsupported custom markup
  edge, not a supported state.
- If a custom script replaces the outer container, the new template markup must carry its own
  landmark. `Drupal.Message` does not observe replacements.
