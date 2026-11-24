<!-- DRAFT for a human to review and post. Do not post automatically.
     Follows Drupal core's AGENTS.md rules for drupal.org prose (in any core checkout: AGENTS.md, "Operator Rules for LLM Tools"):
     rewrite it in your own words before posting; at most 180 words; sentences of at most 25 words; plain facts, no
     interpretation, recommendations or hedging; no headers; no restating the issue or earlier comments; no tool or model names;
     end with the disclosure line exactly as below. Check it with: node scripts/check-draft.mjs 3590502
     Every sentence must match a recorded result in EVIDENCE.md. Delete this comment block when you post. -->

Tested on main (97c6ff8b25) with Default Admin in Chromium 159 at 1280x900, using
the Standard install on `/user/1/edit` and `/user/1`.

Without the MR, View was inside More actions on the edit route, and Edit was a
featured top-bar action on the view route. The primary local-task row was absent.

With the MR, View and Edit appeared as primary local tasks on both routes, and
neither remained in the tested top-bar placement. Real Tab and Enter input
reached View, and axe reported zero violations on both routes.

Not tested: real assistive technology, person-led keyboard quality, forced colours,
other entity types, or the Layout Builder exception.

Generated with the help of an LLM.
