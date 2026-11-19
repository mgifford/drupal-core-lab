<!-- DRAFT for a human to review and post. Do not post automatically.
     Follows Drupal core's AGENTS.md rules for drupal.org prose (in any core checkout: AGENTS.md, "Operator Rules for LLM Tools"):
     rewrite it in your own words before posting; at most 180 words; sentences of at most 25 words; plain facts, no
     interpretation, recommendations or hedging; no headers; no restating the issue or earlier comments; no tool or model names;
     end with the disclosure line exactly as below. Check it with: node scripts/check-draft.mjs 3637163
     Every sentence must match a recorded result in EVIDENCE.md. Delete this comment block when you post. -->

Tested on main (92e5c3a30476) with Default Admin on a Standard install, in Chromium, Firefox and WebKit.

Without a change, typing 777777 or #zzzzzz into the custom accent field and leaving it applies the text to the page. The Save button background becomes transparent. A custom focus color of abc removes the focus outline. A form submit with browser validation off stores an invalid value.

With a local patch, the preview applies only six-digit hex colors and the last valid color stays. The field shows a message and the server rejects invalid values. Stored invalid values are not rendered. The field description names the accepted format.

Three new functional tests fail without the patch and pass with it.

Real screen reader and keyboard testing by a person, 200% zoom and color formats other than six-digit hex were not tested.

Generated with the help of an LLM.
