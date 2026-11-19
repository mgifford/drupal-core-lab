<!-- DRAFT for a human to review and post. Do not post automatically.
     Follows Drupal core's AGENTS.md rules for drupal.org prose (in any core checkout: AGENTS.md, "Operator Rules for LLM Tools"):
     rewrite it in your own words before posting; at most 180 words; sentences of at most 25 words; plain facts, no
     interpretation, recommendations or hedging; no headers; no restating the issue or earlier comments; no tool or model names;
     end with the disclosure line exactly as below. Check it with: node scripts/check-draft.mjs 3636143
     Every sentence must match a recorded result in EVIDENCE.md. Delete this comment block when you post. -->

Compared two Default Admin sites on core 92e5c3a30476 in Chromium.

Both included MR 17738; one additionally included the separate skip-link proposal from issue 3637339.

With Orange saved, the MR-only skip link retained the browser ring.

Adding the separate proposal matched the configured focus color in saved Light and Dark states.

An Auto appearance trial with dark OS preference also matched Orange.

Computed toggle-border contrast was 3.11:1 against white and 5.02:1 against the measured dark background on both integration sides.

Core lint and the scoped keyboard activation checks passed.

No human keyboard, screen-reader or real Windows contrast-theme review was performed.

MR discussions could not be read.

Generated with the help of an LLM.
