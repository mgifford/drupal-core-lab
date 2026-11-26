# #3083103: Programmatically associate error messages with inputs

**DRAFT — runtime comparison built and measured 2026-11-26; not reviewed by a person; no real NVDA/VoiceOver
pass.** Nothing was posted to Drupal.org or GitLab. The four original patches are unchanged.

Issue: https://www.drupal.org/project/drupal/issues/3083103
Patches: [BRANCHES.md](BRANCHES.md) · Preflight: [PREFLIGHT.md](PREFLIGHT.md) · Source: [SOURCE-REVIEW.md](SOURCE-REVIEW.md)
· Rendered evidence: [EVIDENCE.md](EVIDENCE.md) · Comparison: [INDEPENDENT-COMPARISON.md](INDEPENDENT-COMPARISON.md)
· Rebuild: [REPRODUCE.md](REPRODUCE.md) · Screen reader: [SCREENREADER.md](SCREENREADER.md) · Plain explanation: [EXPLAINER.md](EXPLAINER.md)

## What was found

Neither recorded proposal associates the error with its control in the default configuration.

- Standard sets **`default_admin` as both the default and the admin theme**, and `default_admin` overrides
  the three form templates with error containers that have **no `id`**. In the measured `invalid` scenario,
  **16 of 16 error containers had `id: null`**.
- **MR !15692**: the association exists only when Inline Form Errors is disabled, where the target is the
  messenger message; with the module enabled (its own case) every reference dangles. It is also a **fatal
  error on current `main` as submitted** (typed property conflict) and leaves a dangling reference on
  `#error_no_message`.
- **August 6 proposal**: no association at all when Inline Form Errors is disabled — the Standard default —
  and the same dangling target when it is enabled. It was an **11.4.x** diff (`b2ce2022`), never a `main`
  one; the comparison document compared unlike bases and is unverified.

Recommendation: a **minimal Core association mechanism** that carries the ID with the error content rather
than a template variable, with Inline Form Errors keeping presentation. See
[INDEPENDENT-COMPARISON.md](INDEPENDENT-COMPARISON.md).

## Runs

| Run | Result |
|---|---|
| MR !15692 (`3083103-latest`) | `playwright/2026-11-26T06-47-46-613Z-chromium-light-1280x900/` — verdict `reproduced-not-fixed` |
| August 6 (`3083103-aug6`) | `playwright/2026-11-26T06-49-21-012Z-chromium-light-1280x900/` — verdict `reproduced-not-fixed` |
| Virtual screen reader | `screenreader/2026-11-26T06-43-46-673Z/` |

Core `0387fb948f7`, Chromium (Playwright 1.59.1), light scheme, 1280×900, `default_admin`, logged in.

## Not verified

- Real NVDA (Firefox/Chrome) and VoiceOver (Safari); live-region announcements.
- Firefox/WebKit accessibility trees, forced colours, dark scheme, mobile width.
- A person's keyboard pass.
- Regression tests: the acceptance test is written and run (Before 2 failures, MR After 5); it has not been proposed upstream as a patch to an MR.
- The unresolved MR review threads (GitLab API answered HTTP 401).
- Whether merging #3557245 / MR !16520 first changes the ID resolution this work must reuse.

## Historical documents

- [3083103-comparison.md](3083103-comparison.md) — the original "my patch is preferred" comparison.
  **Unverified and not reproduced:** it compared an 11.4.x diff with a `main` MR, never applied one to the
  other, and did not test the default theme.
- [3083103-aria-error-association.md](3083103-aria-error-association.md) — the patch description; its
  "module boundary preserved" and "6 unit tests" claims are accurate as description, but the tests assert
  PHP arrays, not the DOM.
