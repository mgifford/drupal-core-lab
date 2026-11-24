<!-- DRAFT for a human to review and post. Do not post automatically.
     Follows Drupal core's AGENTS.md rules for drupal.org prose (in any core checkout: AGENTS.md, "Operator Rules for LLM Tools"):
     rewrite it in your own words before posting; at most 180 words; sentences of at most 25 words; plain facts, no
     interpretation, recommendations or hedging; no headers; no restating the issue or earlier comments; no tool or model names;
     end with the disclosure line exactly as below. Check it with: node scripts/check-draft.mjs 3466040
     Every sentence must match a recorded result in EVIDENCE.md. Delete this comment block when you post. -->

Tested the supplied proposal on main at 97c6ff8b2534 with Default Admin and Chromium.

Before the change, a dialog created with a percentage height changed to `height: auto`.
After its content expanded, the action pane moved below the viewport.

The attached revision removes the conversion and adds a FunctionalJavascript regression test.
At 1280 by 900, 480 by 900, and emulated forced colours, the action pane remained visible.
The content scrolled and Save remained focusable.
CSpell, PHPStan, PHPCS, ESLint and the focused PHPUnit test passed.

Firefox, WebKit, real screen readers and person-driven keyboard testing were not run.

Generated with the help of an LLM.
