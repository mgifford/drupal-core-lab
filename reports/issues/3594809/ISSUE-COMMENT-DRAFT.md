<!-- DRAFT for a human to review and post. Do not post automatically. -->

I checked MR !16770 on its pinned Core base, `07d6e6935e79`.
The patch applies, but Core reports two empty stylesheets and fails Stylelint with `no-empty-source`.
The MR currently empties the PostCSS and generated CSS files instead of deleting them.

The same intended change needs a rebase on current Core `main`; the original patch does not apply there.
I prepared separate deletion and rebase proposals while preserving the original MR patch.

No live browser, keyboard, forced-colors, or persistence test ran.
The initial DDEV start ran out of Docker space, and unrelated comparisons later held the shared environment.

Generated with the help of an LLM.
