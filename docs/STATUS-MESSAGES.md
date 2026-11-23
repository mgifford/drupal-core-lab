# Status messages in Drupal core: every type, its ARIA role, and why

**DRAFT, AI-assisted; read from Drupal core `main` (`92e5c3a30476`, 2026-11-18); a person has not reviewed it.** A visual page with all three types is [examples/status-messages.html](examples/status-messages.html); with the viewer running (`node scripts/lab-env.mjs start <slug>`) open `https://drupal-compare.ddev.site/reference/status-messages` (or `http://localhost:8100/reference/status-messages`). It reproduces the markup as static text and does not announce anything itself.

## The types

Core has three message types. Everything else (the dismiss button, the icon, the title shown on screen) is theme styling.

| Type | Used for | Role | Heading text (visually hidden in most themes) | Announced as |
|---|---|---|---|---|
| `status` | A result or confirmation: "The configuration options have been saved." | `status` | Status message | polite: waits for the screen reader to finish speaking |
| `warning` | Something works but needs attention: "Cron has not run recently." | `alert` | Warning message | assertive: interrupts |
| `error` | An action failed, or input is invalid: "The username field is required." | `alert` | Error message | assertive: interrupts |

The mapping is one line in each template: `role="{{ type in ['error', 'warning'] ? 'alert' : 'status' }}"`. Warnings are treated like errors on purpose.

## Where the markup comes from

| Source | What it does |
|---|---|
| `core/modules/system/templates/status-messages.html.twig` | The base template. `<div role=… aria-label="Status message">` with a `visually-hidden` `<h2>`; a list when there is more than one message. |
| `core/themes/starterkit_theme/templates/misc/status-messages.html.twig` | The same, with `messages--<type>` classes. |
| `core/themes/default_admin/templates/misc/status-messages.html.twig` | Same roles, but the box is named by its visible `<h2>` (`aria-labelledby`) instead of `aria-label`, and each box has a **Hide** button. |
| `core/profiles/demo_umami/.../status-messages.html.twig` | Same role rule on a `<drupal-umami-messages>` web component. |
| `core/lib/Drupal/Core/Render/Element/StatusMessages.php` | Supplies the three heading strings (`#status_headings`). |
| `core/misc/message.js` (`Drupal.Message`, `Drupal.theme.message`) | The same markup built in the browser for messages added after load (AJAX, JavaScript), with the same roles and `aria-label`. |

## Why these roles

- **A message arrives without the page moving.** WCAG 2.2 SC 4.1.3 Status Messages asks that a result, error or progress note be announced by assistive technology without taking focus. The two ARIA techniques for it are [ARIA22: `role=status`](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA22) for results and [ARIA19: `role=alert`](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA19) for errors.
- **`role="status"` is polite.** It implies `aria-live="polite"`: a saved-confirmation should not cut off what the user is hearing.
- **`role="alert"` is assertive.** It implies `aria-live="assertive"`: a failed save or a warning that blocks progress should be heard now.
- **The accessible name** (`aria-label` or `aria-labelledby`, "Error message") tells a screen reader user what kind of message it is. The `<h2>` also lets them find the message by heading.
- **Two paths for late messages.** `Drupal.Message.add()` inserts the element (with its role) and also calls `Drupal.announce()`, using `assertive` priority for `warning` and `error` unless a different priority is given (`message.js`, `Drupal.Message.announce`). The announce call is there because a live region is only reliably spoken when its content changes after the region exists. Setting `announce: ''` turns the extra call off.

## Limits worth knowing

- On a full page load the messages are in the document already, so how they are announced varies between screen readers. Do not assume every message is spoken at load.
- `role="alert"` interrupts. Several errors at once are announced one after another, which can be a lot. Inline form errors have their own handling.
- Status messages in the lab are checked with the "Changes after input that nothing announces" section of the evaluator summaries: see [SILENT-CHANGES.md](SILENT-CHANGES.md). Neither that check nor this page replaces a real screen-reader pass; the lab does not run real VoiceOver or NVDA.
- This page documents what the templates do. It does not say whether a given theme's colours or layout for messages meets contrast or target-size requirements.

## Verify it yourself

```bash
git -C envs/core.git grep -n "role=" refs/lab/main -- 'core/*status-messages.html.twig' core/misc/message.js
```
