<!-- DRAFT for a human to review and post. Nothing has been posted. Updated 2026-11-18. -->

**AI-assisted:** yes. A large language model helped prepare this patch summary.

I ported MR !17078 tip `c3c52b00` onto core `29b0a0b2256e` to address Comment #61.

Review artifacts: [complete replacement patch](branches/3604037-comment61-standalone.patch) and
[interdiff against !17078 at `c3c52b00`](branches/3604037-comment61-vs-mr17078-c3c52b00.interdiff.patch).
The replacement includes its fixture; apply the interdiff to the existing MR.
Replace relative links with attachment URLs before posting.

The port:
- Adds a translated fallback title for untitled details with errors.
- Limits error markers to details and renders the hidden indicator in Twig.
- Passes `child_error_count` through Default Admin's `preprocess_details` hook.
- Makes the child-error setting optional in both vertical-tab theme functions.
- Corrects the CSS selector and logical border. Keeps global tab borders unchanged.
- Fixes ineffective test assertions and adds cases for title-less details and multiple error tabs.

Both patch stacks apply to core `29b0a0b2256e`. Targeted After tests and core lint pass. The automated Before/After evaluation confirms the indicators but reports six light-mode hover text checks at 4.17:1, below 4.5:1. Human review, including keyboard and screen-reader testing, remains outstanding. See the linked evidence before posting.

Generated with the help of an LLM.
