# Follow-up patch for #3593502

This patch applies on top of merge request !15975 at commit
`6d566c319bcfecba885938b1d789115beb830834`:

`branches/3593502-follow-up-review-fixes.patch`

The same delta is also provided as
`interdiff/15975-to-review-fixes.interdiff`. See `INTERDIFF.md` for the
change-by-change rationale and upstream diff checksum.

The DDEV variants use the interdiff copy as patch 2, after
`branches/patch-1-mr-15975.patch`. Do not add this standalone copy to that
stack, because it would apply the same changes twice.

It changes seven files and adds regression coverage for two review findings.

## Included

- Column updates now await the CSRF-token promise instead of sending an empty
  `X-CSRF-Token` header during initialization.
- Pointer, Space, and Shift+Arrow reordering stay inactive until the token is
  available.
- A FunctionalJavascript test delays `/session/token` for three seconds and
  toggles the Enabled column before the response arrives.
- FunctionalJavascript tests cover Escape and outside-click dismissal of the
  search results.
- Forced-colors rules preserve the move handle, selected or grabbed outlines,
  and drop indicator.

## Apply

From a checkout of the issue branch:

```shell
git apply --check /path/to/3593502-follow-up-review-fixes.patch
git apply /path/to/3593502-follow-up-review-fixes.patch
```

## Run the relevant core tests

```shell
./vendor/bin/phpunit -c core \
  core/modules/menu_tree_ui/tests/src/FunctionalJavascript/MenuTreeUiColumnToggleTest.php

./vendor/bin/phpunit -c core \
  core/modules/menu_tree_ui/tests/src/FunctionalJavascript/MenuTreeUiSearchTest.php

./core/scripts/dev/commit-code-check.sh
```

## Not included

The patch does not implement paging for every sibling level. The existing
reorder reconciliation assumes that a children response contains the complete
sibling set. Limiting that response without redesigning reconciliation could
hide links or produce incorrect moves.

The patch also does not add static YAML links to search, make multi-operation
Save atomic, provide performance profiles, or substitute automated checks for
accessibility and usability review. Those require separate design decisions or
manual evidence.

The patch was checked with `git apply --check`, `git diff --check`, and
`node --check`. PHPUnit, PHPCS, PHPStan, and browser testing were not available
in the environment that produced it.
