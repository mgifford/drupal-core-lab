# Patch Evaluation Infrastructure

This directory contains accessibility patches and tooling to validate fixes with reproducible before/after evidence.

## Quick Start

### Evaluate One Patch

```bash
# From drupal-core root
yarn a11y:evaluate-patch a11y-DRUPAL-A11Y-002-submit-button-contrast
```

### Evaluate All Configured Patches

```bash
# Full batch
yarn a11y:evaluate-all-patches

# Optional priority filters
PATCH_FILTER=priority-1 yarn a11y:evaluate-all-patches
PATCH_FILTER=priority-2 yarn a11y:evaluate-all-patches
PATCH_FILTER=priority-3 yarn a11y:evaluate-all-patches
```


## Deterministic Setup

Each patch evaluation run executes explicit setup steps before testing:

1. `ddev drush cset system.theme default <theme> -y`
2. `ddev drush cset system.theme admin <theme> -y`
3. `ddev drush cache-rebuild`
4. `ddev drush cget system.theme --format=json`

These are stored in JSON at:
- `runContext.deterministicThemeSetup.requested`
- `runContext.deterministicThemeSetup.detected`
- `runContext.deterministicThemeSetup.commands`

## Evaluator Flow

For each patch and variant:

1. Capture before-state screenshots/HTML on target selectors
2. Run axe before scan
3. Apply patch with `git apply`
4. Clear Drupal cache with `ddev drush cache-rebuild`
5. Revisit same URL + same conditions and capture after-state screenshots/HTML
6. Run axe after scan
7. Compare pattern/instance evidence
8. Revert applied patch with `git apply -R`

## Output Files

### Per Patch

- `patches/{PATCH_NAME}-evaluation.json`
- `patches/{PATCH_NAME}-evaluation.md`
- `patches/{PATCH_NAME}-evaluation.html`

### Batch Summary

- `reports/PATCH-EVALUATION-SUMMARY.json`
- `reports/PATCH-EVALUATION-SUMMARY.md`

Only actionable patches should be recommended: a target violation must be observed before patching and verifiably reduced or removed after patching under the same conditions.

## Replication Evidence Captured

Each evaluation JSON captures:

- Requested conditions: device, viewport, orientation, color mode, direction
- Runtime conditions (before and after):
  - `screenType`, `orientation`, `viewport`
  - `colorMode`, `colorSchemeDetected`
  - `direction`, `language`
  - `forcedColors`, `prefersContrast`
  - `theme`, `bodyClasses`
- Pattern and instance IDs tied to condition context
- ID consistency validation (`idValidation`)
- Replication workflow steps (`replication`)

## Troubleshooting

### Patch does not apply

```bash
git apply --check patches/{PATCH_NAME}.patch
```

### Revert a patch manually

```bash
git apply -R patches/{PATCH_NAME}.patch
```

### Cache rebuild fails

```bash
ddev drush cache-rebuild
```

### DDEV/environment issues

```bash
ddev status
```

## Scripts

- `core/tests/playwright/scripts/evaluate-patch.js`
- `core/tests/playwright/scripts/evaluate-all-patches.js`
- `core/tests/playwright/scripts/lib/patch-evaluator-config.js`
- `core/tests/playwright/scripts/lib/render-markdown-report.js`
