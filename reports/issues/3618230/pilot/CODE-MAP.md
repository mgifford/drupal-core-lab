# #3618230 code map (Phase 4 pilot, 2026-10-15)

Made with `node scripts/code-map.mjs <env> <symbol>`: one call each, in place of a grep, sed and cat chain. Core `3b94128e929`.
Line numbers are for Before (`envs/baseline-pilot-3618230`) and After (`envs/issue-pilot-3618230`).

## The function the MR changes

`core/modules/file/src/Element/ManagedFile.php`, `ManagedFile::uploadAjaxCallback(&$form, FormStateInterface &$form_state, Request $request)`,
the `#ajax` callback of managed_file upload forms. Before: lines 189-215. After: lines 190-230.

| | Before | After |
|---|---|---|
| Messages | `$form['#prefix'] .= $renderer->renderRoot(['#type' => 'status_messages'])` (line 207-208) | none in the prefix |
| Placeholder | none | `<div id="file-upload-messages-..." class="file-upload-messages"></div>` appended to `#prefix` with `Html::getUniqueId()` (213-214) |
| Response | `ReplaceCommand(NULL, $output)` only | `ReplaceCommand`, then one `MessageCommand($message, '#<id>', ['type' => $type], FALSE)` per message from `messenger()->deleteAll()` (224-228) |

Calls: `Drupal::service('renderer')`, `NestedArray::getValue`; After adds `Html::getUniqueId`, `Drupal::messenger`.

Used by: `ManagedFile.php:239` (Before) / `:254` (After), the `'callback'` of the element's `#ajax`; and named in a comment in
`core/modules/file/src/Plugin/Field/FieldWidget/FileWidget.php:477`.

Tests that reference it: Before none; After `core/modules/file/tests/src/Kernel/ManagedFileTest.php:73` (the MR adds a kernel test that
reads `->getCommands()`), plus the functional JavaScript test proposed in `tests-proposal/`.

## The command it adopts

`core/lib/Drupal/Core/Ajax/MessageCommand.php:70`, `class MessageCommand implements CommandInterface, CommandWithAttachedAssetsInterface`
("AJAX command for a JavaScript Drupal.message() call"). `__construct($message, $wrapper_query_selector = NULL, array $options = [],
$clear_previous = TRUE)` (114), `render()` (124), `getAttachedAssets()` (139).

Already used by: `big_pipe` (`BigPipe.php`), `ckeditor5` (`Ckeditor5Hooks.php`), `media_library` (`AddFormBase.php`,
`MediaLibrarySelectForm.php`), and `AnnounceCommand.php` documents how it pairs with `MessageCommand`. So the pattern is not new to core.
Its own test: `core/tests/Drupal/FunctionalJavascriptTests/Ajax/MessageCommandTest.php`.

## Where the lab's starting state is

`recipes/repro_3618230/recipe.yml` (article content type, a file field `attachment` limited to 1 KB and `txt`).

## Not mapped

The JavaScript handler (`Drupal.AjaxCommands.prototype.message` in `core/misc/ajax.js`) was not found by symbol: `code-map` takes
`Drupal.x` names for plain definitions, and this is assigned on a prototype. Open the file directly if the client side matters.
