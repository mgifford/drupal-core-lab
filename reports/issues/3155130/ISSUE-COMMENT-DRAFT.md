On `text_with_summary` 2.0.x the "Edit summary"/"Hide summary" toggle sits inside the Body or Summary label. It is replaced on activation. Focus falls to `<body>`, there is no `aria-expanded`/`aria-controls`, the control appears after the summary it reveals, and every summary is named "Summary". The first auto-collapse wipes `Drupal.theme.textEditSummaryButton()` overrides with `.html()`. An empty summary with a validation error stays hidden.

Proposed fix: one persistent native button, immediately before the summary content and outside every label. It keeps accurate `aria-expanded`/`controls` with a unique id, retains focus, and takes its name from the existing field/item label. Empty summaries with errors expand. Only the button's children are re-themed. No Form API container, input name, dependency or CSS change. The only visual change is the control's position.

Ten FunctionalJavascript tests fail on 2.0.x and pass with the patch (156 assertions). The submitted summary survives save, collapse and reopen. Chromium evidence covers Default Admin and Claro, light, dark, forced colours, narrow and simulated RTL. No real screen reader or human keyboard pass yet. Patches are in the review bundle; I can open an MR.

Generated with the help of an LLM.
