<!-- DRAFT for a human to review and post. Do not post automatically.
     Follows Drupal core's AGENTS.md rules for drupal.org prose (in any core checkout: AGENTS.md, "Operator Rules for LLM Tools"):
     rewrite it in your own words before posting; at most 180 words; sentences of at most 25 words; plain facts, no
     interpretation, recommendations or hedging; no headers; no restating the issue or earlier comments; no tool or model names;
     end with the disclosure line exactly as below. Check it with: node scripts/check-draft.mjs 2942404
     Every sentence must match a recorded result in EVIDENCE.md. Delete this comment block when you post. -->

Tested MR !17968 head `b11a4441` with an unpushed follow-up patch. The change adds one region
named "System messages" to the default messages container. The region is not a live region.

Server-rendered and JavaScript messages get the same landmark. Warnings and errors stay
`role="alert"`; status messages stay `role="status"`. `Drupal.Message` removes only attributes it
still owns. Contextual wrappers and author roles and names are left alone.

The two BigPipe expectations now include the new attributes. `message.js` uses one live-region
selector. The three performance budgets move by the measured compact delta of 1,878 bytes; the
2,000-byte tolerance is unchanged. The performance suites skip
here because they require MySQL. The Composer job timed out downloading masterminds/html5. The
PHP 8.6 unit jobs fail on spl_object_hash() and extension parsing; this patch changes no
production PHP.

PHPUnit passes `MessageLandmarkTest`, `JsMessageTest`, `MessageCommandTest`,
`BigPipeMessagesTest`, `BigPipeTest::testBigPipe` and `BigPipeTest::testBigPipeNoJs`. Core lint
passes. Earlier Chromium and VoiceOver runs, before the follow-up patch, recorded the same
landmark. Human rotor navigation, other themes, NVDA and JAWS were not tested.

No conformance claim is made.

Generated with the help of an LLM.
