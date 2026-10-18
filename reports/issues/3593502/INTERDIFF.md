# Interdiff for MR !15975

This interdiff describes the proposed review fixes relative to the current
download of merge request !15975:

- Upstream diff: <https://git.drupalcode.org/project/drupal/-/merge_requests/15975.diff>
- Downloaded: 2026-10-16
- Upstream diff SHA-256: `1cca1f0893d2b0a6aba2f46c212c3c14c7fa4b31290877c79c096a3a64b77ebb`
- Reviewed MR revision: `6d566c319bcfecba885938b1d789115beb830834`
- Interdiff: [`interdiff/15975-to-review-fixes.interdiff`](interdiff/15975-to-review-fixes.interdiff)
- Interdiff SHA-256: `f998897b3e4c4bbddd05c35050c1816cb73685ad28a9b1c4dae14ad7b73bd68c`

The interdiff is a normal Git patch intended to be applied after the MR diff.
It is byte-for-byte identical to the standalone follow-up patch because that
patch was generated from the MR result, not from unmodified Drupal core.

The DDEV lab applies the downloaded MR as patch 1 and this interdiff as patch
2. See [`REPRODUCE.md`](REPRODUCE.md). Do not also apply the byte-identical
standalone follow-up patch.

## Change-by-change explanation

| File | Change | Reason | Verification or coverage |
|---|---|---|---|
| `core/modules/menu_tree_ui/css/menu-tree-ui.css` | Adds a `forced-colors: active` block for the move handle, grabbed or child-target outline, and drop indicator. The indicator becomes a system-colour border instead of relying on a background and shadow. | User-agent forced-colours modes can suppress authored backgrounds and shadows. The move affordance and destination must remain perceivable. | Static CSS review only. Manual Windows High Contrast testing is still required. |
| `core/modules/menu_tree_ui/js/menu-tree.js` | Creates one shared CSRF-token promise. Column changes await that promise. Handle, Space, and Shift+Arrow reordering remain inactive until the token resolves. Drag wiring is installed only after a valid, non-empty token arrives. Failed token requests leave reordering disabled and log the failure. | The MR can accept an early interaction before `/session/token` resolves and send an empty `X-CSRF-Token` header. This makes initialization deterministic and avoids a request that is expected to fail. | Covered by the delayed-token FunctionalJavascript test below. JavaScript syntax checking passed. |
| `core/modules/menu_tree_ui/tests/modules/menu_tree_ui_test/menu_tree_ui_test.services.yml` | Registers a route subscriber in the existing test module. | The race needs a deterministic test-only way to delay Drupal's token response. | The service exists only when `menu_tree_ui_test` is enabled. |
| `core/modules/menu_tree_ui/tests/modules/menu_tree_ui_test/src/Controller/MenuTreeUiTestCsrfTokenController.php` | Extends the core token controller and delays its response by three seconds. | The delay exposes the initialization window reliably instead of depending on machine or network timing. | Exercised by `MenuTreeUiColumnToggleTest`. The three-second delay is deliberately limited to the test module. |
| `core/modules/menu_tree_ui/tests/modules/menu_tree_ui_test/src/Routing/MenuTreeUiTestRouteSubscriber.php` | Replaces the controller for `system.csrftoken` with the delayed test controller. | This preserves the production route and token behavior while controlling response timing in the test. | The route alteration is scoped to the test module. |
| `core/modules/menu_tree_ui/tests/src/FunctionalJavascript/MenuTreeUiColumnToggleTest.php` | Enables the test module, confirms reordering is not ready, clicks the Enabled checkbox before the delayed token resolves, and retains the existing persistence assertion. | This reproduces the exact early-interaction failure and proves the change is not merely suppressing an error in the browser. | Run the individual PHPUnit command below. It was not executable in the artifact-generation environment. |
| `core/modules/menu_tree_ui/tests/src/FunctionalJavascript/MenuTreeUiSearchTest.php` | Adds browser-level tests for dismissing results with Escape and by clicking outside the search UI. Both assert that the query remains intact. | These documented interactions were implemented but lacked regression coverage. The real WebDriver key and click paths exercise the event listeners. | Run the individual PHPUnit command below. It was not executable in the artifact-generation environment. |

## Apply and verify

From a clean Drupal core checkout on a revision to which the current MR diff
applies:

```shell
curl -L \
  https://git.drupalcode.org/project/drupal/-/merge_requests/15975.diff \
  -o /tmp/15975.diff

shasum -a 256 /tmp/15975.diff
# Expected: 1cca1f0893d2b0a6aba2f46c212c3c14c7fa4b31290877c79c096a3a64b77ebb

git apply --check /tmp/15975.diff
git apply /tmp/15975.diff
git apply --check /path/to/15975-to-review-fixes.interdiff
git apply /path/to/15975-to-review-fixes.interdiff
git diff --check
node --check core/modules/menu_tree_ui/js/menu-tree.js
```

Run the focused tests:

```shell
./vendor/bin/phpunit -c core \
  core/modules/menu_tree_ui/tests/src/FunctionalJavascript/MenuTreeUiColumnToggleTest.php

./vendor/bin/phpunit -c core \
  core/modules/menu_tree_ui/tests/src/FunctionalJavascript/MenuTreeUiSearchTest.php

./core/scripts/dev/commit-code-check.sh
```

## Validation performed while producing the interdiff

- The downloaded MR diff applied to Drupal core main at
  `a7c1655a5fa9b94c61f8517a6c35068fc54acabf`.
- The interdiff then applied cleanly.
- Applying the MR and interdiff sequentially produced Git tree
  `9b363003d1ce7518f059bd1fd0465efbe91117f7`.
- A freshly generated combined patch produced the same Git tree.
- `git diff --check` and `node --check` passed.

PHPUnit, PHPCS, PHPStan, DDEV, and browser testing were not available in the
environment that produced these files. The commands above remain required.

## Deliberately not changed

- **Sibling-level paging:** the current client reconciliation assumes each
  response contains the complete sibling set. Slicing only in the controller
  could hide links or allow incorrect reordering. Paging and reconciliation
  need to be designed together.
- **Static YAML-link search:** the MR searches content entities. Extending the
  result set needs an explicit product and performance decision.
- **Atomic Save:** operations are persisted one at a time. Changing transaction
  and failure semantics is architectural work, not a safe review follow-up.
- **Performance and manual accessibility evidence:** this interdiff does not
  replace profiling or keyboard, screen-reader, forced-colours, zoom, reflow,
  touch, and supported-browser testing.
