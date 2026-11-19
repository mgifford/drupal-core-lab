# Required radio groups: 2951317-native-validation

DRAFT automated evidence. 2026-11-06T16:47:15.229Z.

| Check | Result |
|---|---|
| Static required attributes moved to inputs | as expected |
| Dynamic empty group becomes invalid without selecting an option | as expected |
| Hidden None stays selected and invalid while required | as expected |
| Native validation blocks Save with hidden None | as expected |
| With native validation disabled, the fixture accepts the POST (no dynamic server validation supplied) | not applicable in this configuration |
| None reappears checked and valid when optional | as expected |
| Arrow key selects Blue and clears custom validity | as expected |
| Repeated toggles retain Blue and validity | as expected |
| before: optional group remains optional | as expected |
| before: default Blue retained | as expected |
| after: optional group remains optional | as expected |
| after: default Blue retained | as expected |

Native validation enabled: Before true, After true. After POST requests: 0; accepted message: false.

Full stage markup, axe results, accessibility snapshots, native validity, and selection are in results.json. Screenshots capture each stage.
## Context

| | Before | After |
|---|---|---|
| Core commit | `ad11ba71c0 2026-10-15` | `ad11ba71c0 2026-10-15` |
| Drupal, PHP | 12.0-dev, 8.5.12 | 12.0-dev, 8.5.12 |
| Profile; default / admin theme (config) | standard; default_admin / default_admin | standard; default_admin / default_admin |
| Theme that rendered each page | /user/1/edit → default_admin<br>/admin/config/development/lab-radios-2951317 → default_admin<br>/admin/config/development/lab-radios-2951317 → null | /user/1/edit → default_admin<br>/admin/config/development/lab-radios-2951317 → default_admin |
| Languages (default) | none (en) | none (en) |
| Modules only on this side | none | none |
| Enabled modules | 40 | 40 |

## What could be announced

`Drupal.announce()` calls, and text changes inside live regions (role alert/status/log or aria-live). A recorded change is not proof that a screen reader spoke it; see the screen-reader run for that.

| Side | Source | Politeness | Text |
|---|---|---|---|
| before | none | | |
| after | none | | |

## Changes after input, and how a screen reader learns of them

After each click, key press or typing, the text that appeared or changed on the page. **Silent**: not in a live region, no `Drupal.announce()` after the same action, focus did not move to it, and the control pressed did not disclose it. A silent change is a candidate for WCAG 2.2 SC 4.1.3 Status Messages, for a person to judge: not every change is a status message. See docs/SILENT-CHANGES.md.

No silent change on either side.

Before: 0 in a live region, 0 Drupal.announce() after the same action, 0 focus moved to it, 0 shown by the control pressed (expanded), 0 inside the control itself, 0 the name of a control that appeared or changed, 0 silent.
After: 0 in a live region, 0 Drupal.announce() after the same action, 0 focus moved to it, 0 shown by the control pressed (expanded), 0 inside the control itself, 3 the name of a control that appeared or changed, 0 silent.


Not verified: person-led keyboard or screen-reader pass, JavaScript-disabled submission, other themes unless separately recorded, full core PHPUnit suite, contrib compatibility, or server enforcement of dynamic #states (client-side behavior).
