# Patches Directory

This directory holds proposal and reference patches related to Default Admin accessibility color work.

## Current Patch Files

- `default-admin-accent-aa-defaults.patch`
  - Scope: proposed accent preset hex updates in `core/themes/default_admin/src/Helper.php`.
  - Intent: improve WCAG AA resilience for accent combinations.

- `default-admin-focus-aa-proposals.patch`
  - Scope: proposed focus preset updates in migration CSS sources.
  - Intent: improve focus-ring visibility across light and dark modes.

- `default-admin-contrast-color-hints.patch`
  - Scope: informational guidance for possible future `contrast-color()` integration points.
  - Intent: document opportunities, not apply runtime behavior yet.

## Usage

These patches are currently proposal artifacts for review and discussion.
If you decide to apply one in a Composer-managed workflow:

1. Add the patch under `extra.patches` in `composer.json`.
2. Run `composer install` to apply it.
3. Re-run relevant report generation and accessibility checks.

## Important

- `default-admin-accent-aa-defaults.patch` and `default-admin-focus-aa-proposals.patch` are designed to be reviewed independently and can be applied together.
- Treat these as starting points; validate results in light mode, dark mode, high-contrast mode, and forced-colors mode before adoption.