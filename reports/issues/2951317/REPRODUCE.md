# Reproduce #2951317

Run from the drupal-core-lab root. Requires Docker and DDEV. Both sites use the Standard profile and the same `recipes/repro_2951317/recipe.yml`, with test extensions enabled.

```sh
node scripts/doctor.mjs 2951317-pinned
node tools/compare/setup.mjs 2951317-pinned
node scripts/lab-env.mjs start 2951317-pinned --browser
node tools/playwright/evaluate-2951317.mjs 2951317-pinned
```

For DDEV Coder Freeform, follow [CODER-PROMPT.md](CODER-PROMPT.md). The bootstrap command is `node scripts/cloud-bootstrap.mjs 2951317-pinned --install-autostart`. Use the existing workspace only after checking its running environments. Do not reset an existing database without a snapshot.

Select `2951317-pinned` in the viewer and open `/admin/config/development/lab-radios-2951317` in both frames. The variant's numbered steps and checks are the scenario source of truth.

1. On a fresh page, leave Required color empty and activate Save. After should stop with native validation. Choose Red and confirm a valid choice is accepted. Blue must stay selected in Required color with default. Optional color must remain optional.
2. Inspect the required group. After should place required attributes on inputs, omit required on the fieldset, and expose a radiogroup. Check one visible required marker on the legend and none on individual option labels.
3. Reload. With no dynamic choice selected, toggle Require a dynamic color on/off/on. After must preserve no selection, hide None while required, and reject an empty choice.
4. Reload. Select None, then toggle required on. None must stay selected while hidden, and a visible real option must be invalid. Fill Required color and activate Save: After should focus a visible invalid dynamic option and block submission. Toggle off: None returns checked, and custom validity clears.
5. Choose Red, toggle required repeatedly, and use arrow keys to choose Blue. The real choice must persist and become valid without a stale custom error.
6. Repeat under Default Admin and Claro, recording the actual theme. Check forced colors, focus visibility, and required indicators. Disable JavaScript and repeat static required validation only. Dynamic #states are client-side and do not establish server enforcement.

The replay script records stage DOM, selection, validity, screenshots, accessibility snapshots, axe results, theme/modules, and announcements. Its keyboard activation and arrow key use Playwright's trusted input. It has not yet been executed against Drupal. Person-led checks and synthetic Guidepup comparison remain outstanding.

## Patch order and identity

Before: shared fixture only. After: shared fixture, then exact MR patch. No local fix is added to the MR. The fixture is a test-only module under `core/modules/system/tests/modules/lab_radios_2951317`, restricted to administrators, and installed on both sides by the recipe. Do not deploy it to production.

- `branches/2951317-shared-fixture.patch`: SHA-256 `0b6ee870ae17a6caa52004ca3d60e90b592d43039cb18557b508f8eb7b945b27`.
- `branches/2951317-radios-element-missing-required-attr.patch`: SHA-256 `27550bbdd14990cfe34b3180fe9ccd49472ccb9ab93d4d795b394f0f01d39f28`.

To test newer main, replace the slug with `2951317-latest`. Check applicability first with `node tools/compare/setup.mjs 2951317-latest --check-patches`. Re-fetch an updated MR explicitly with `node scripts/new-issue.mjs 2951317 --branch 2951317-radios-element-missing-required-attr --refresh`, then refresh stacks, regenerate the Coder prompt, and rerun evidence. Previous results may become stale.
