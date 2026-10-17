# Required radio groups: 2951317-pinned

DRAFT automated evidence. 2026-10-17T17:21:34.278Z.

| Check | Result |
|---|---|
| Static required attributes moved to inputs | as expected |
| Dynamic empty group becomes invalid without selecting an option | as expected |
| Hidden None stays selected and invalid while required | as expected |
| Native validation blocks Save with hidden None | not applicable in this configuration |
| With native validation disabled, the fixture accepts the POST (no dynamic server validation supplied) | as expected |
| None reappears checked and valid when optional | as expected |
| Arrow key selects Blue and clears custom validity | as expected |
| Repeated toggles retain Blue and validity | as expected |
| before: optional group remains optional | as expected |
| before: default Blue retained | as expected |
| after: optional group remains optional | as expected |
| after: default Blue retained | as expected |

Native validation enabled: Before false, After false. After POST requests: 1; accepted message: true.

**Native submission blocking was not exercised:** core disabled it through novalidate or formnovalidate. Constraint validity and native submission blocking are separate. The fixture supplies no server-side validation for dynamic #states. Verdict remains mixed to preserve this coverage gap.

Full stage markup, axe results, accessibility snapshots, native validity, and selection are in results.json. Screenshots capture each stage.
## Context

| | Before | After |
|---|---|---|
| Core commit | `ad11ba71c0 2026-10-15` | `ad11ba71c0 2026-10-15` |
| Drupal, PHP | 12.0-dev, 8.5.8 | 12.0-dev, 8.5.8 |
| Profile; default / admin theme (config) | standard; default_admin / default_admin | standard; default_admin / default_admin |
| Theme that rendered each page | /user/1/edit → default_admin<br>/admin/config/development/lab-radios-2951317 → null | /user/1/edit → default_admin<br>/admin/config/development/lab-radios-2951317 → null |
| Languages (default) | none (en) | none (en) |
| Modules only on this side | none | none |
| Enabled modules | 40 | 40 |

## What could be announced

`Drupal.announce()` calls, and text changes inside live regions (role alert/status/log or aria-live). A recorded change is not proof that a screen reader spoke it; see the screen-reader run for that.

| Side | Source | Politeness | Text |
|---|---|---|---|
| before | none | | |
| after | none | | |


Not verified: person-led keyboard or screen-reader pass, JavaScript-disabled submission, other themes unless separately recorded, full core PHPUnit suite, contrib compatibility, or server enforcement of dynamic #states (client-side behavior).
