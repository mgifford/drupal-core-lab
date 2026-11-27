# Branch patches for #3083103

Extracted 2026-10-01 from the drupal.org issue fork(s) with
`git diff <merge-base with upstream main> <branch tip>`: only the branch's own
changes, **not rebased** onto current `main`. Re-check against the issue before
use: the MR on drupal.org is the source of truth. Apply to a core worktree with
`git apply branches/<file>.patch` (may need a reroll if the base is old).

| Patch | Source | Tip | Base | Tip date | Files | Commits |
|---|---|---|---|---|---|---|
| `branches/3083103-improve-error-accessibility.patch` | issue-fork f3083103: drupal-3083103 | ed60e948ec1 | c6836648996 | 2026-05-07 | 15 | 33 |
| `branches/3083103-programmatically-associate-error.patch` | issue-fork drupal-3083103 | 0fddb21c553 | 9f2ee8352d4 | 2026-03-24 | 5 | 11 |
| `branches/3083103-programmatically-associate-error-11.patch` | issue-fork drupal-3083103 | 32d4ece4454 | 496796e0a3e | 2026-04-15 | 9 | 26 |

Also present at the top level of this folder, with **no recorded provenance**: `3083103-aria-error-association.patch`
(8 files, a plain `git diff` with no base, tip or date). Re-extract it from the issue fork if a patch with provenance is
needed.

## Verified 2026-11-25 (static)

Checked against `envs/core.git`: `origin/main` = `0387fb948f7` (2026-11-25), `origin/11.4.x` = `6155f891`
(2026-11-25). Review threads still unread (GitLab API 401).

| Patch | sha256 | Verdict on current `main` | Files applying / total |
|---|---|---|---|
| `branches/3083103-improve-error-accessibility.patch` | `37af15398bb89d1826e4570a4dc3237a196256a850a89dc182bdd8c74c74491a` | applies except `system/tests/…/Form/FormTest.php` | 14 / 15 |
| `branches/3083103-programmatically-associate-error-11.patch` | `cbd0c3eb433d72eca48d30a29ff23074385bbacf34882a0c675f56aa87511a28` | applies except the same `FormTest.php` | 8 / 9 |
| `branches/3083103-programmatically-associate-error.patch` | `a1154fe9b3fc44b9c6762c6770af6318daeccf153ad8012abddb6f4e3afaaa77` | applies except `core/tests/…/Form/FormErrorHandlerTest.php` | 4 / 5 |
| `3083103-aria-error-association.patch` | `9740d7ca58cd09b4154c52c458780ee0a3cff642f70b8756f0f0d3064f6d3bc6` | fails on `FormErrorHandler.php`, `FormPreprocess.php`, `InlineFormErrorsThemeHooks.php`, `inline_form_errors/…/Unit/FormErrorHandlerTest.php` | 4 / 8 |

### Provenance of the August 6 patch — reconstructed

It has **no base on `main`**. All eight `index` pre-image blobs match **`11.4.x` at `b2ce2022`** (2026-08-06,
"Back to dev" after Drupal 11.4.5), checked file by file with `git hash-object` against the GitLab raw-file API:

| File | Pre-image blob | Matches 11.4.x `b2ce2022` |
|---|---|---|
| `core/lib/Drupal/Core/Form/FormErrorHandler.php` | `a414439f8fd` | yes |
| `core/lib/Drupal/Core/Form/FormPreprocess.php` | `2a22d44e4a7` | yes |
| `core/modules/inline_form_errors/src/FormErrorHandler.php` | `2a449ab89da` | yes |
| `core/modules/inline_form_errors/src/Hook/InlineFormErrorsThemeHooks.php` | `a15dae146fb` | yes |
| `core/modules/inline_form_errors/tests/src/Unit/FormErrorHandlerTest.php` | `d5d3dfad846` | yes |
| `core/modules/system/templates/details.html.twig` | `1e235a07efe` | yes |
| `core/modules/system/templates/fieldset.html.twig` | `19c970f3207` | yes |
| `core/modules/system/templates/form-element.html.twig` | `7b94a519d48` | yes |

It therefore applies cleanly to `11.4.x` `6155f891` (verified), and it contains a hunk that only makes sense
on that branch: `enable_html5_validation` `TRUE` → `FALSE` in `FormPreprocess::preprocessForm()`. On `main`
that default is already `FALSE` since `d5babbbe` (2026-04-28, #1797438), so the hunk is obsolete there and
the intent — disabling native browser validation site-wide — belongs to a different issue.

**Consequence:** the comparison document (`3083103-comparison.md`) compares an 11.4.x diff with a `main`
MR without saying so, and never applies one to the other. Its conclusion is not a like-for-like result.
It is preserved as historical evidence and is explicitly unverified.

Original files were not modified. Porting to `main`, if approved, will be a **new** file with its own
provenance, not an edit of these.


## Ported and lab-authored patches (2026-11-26)

All apply to `main` `0387fb948f786bc344a5cc54aa0d98b8f552e378`. The four original patches above are
unchanged. These are new files, and each was generated from a clean scratch worktree.

| Patch | sha256 | What it is |
|---|---|---|
| `branches/3083103-fixture.patch` | `e9a243f5…37e64b88` | **Lab test support**, applied identically to Before and After: a `form_test` form and routes (`/form-test/error-association`, `/error-association/two`, `/error-association/no-ife`). Not code under test. |
| `branches/3083103-improve-error-accessibility-main.patch` | `c7aa92c2…837adbd0` | MR !15692 (tip `ed60e948`) ported to `main`. 14 files. |
| `branches/3083103-aria-error-association-main.patch` | `71402ae2…dbcd8602` | The August 6 proposal ported from `11.4.x` (`b2ce2022`). 7 files. |

### What porting changed, and why

**MR !15692 → `main`**

- The `FormTest.php` hunk did not apply (the file now uses `getNodeElementsByXpath()`); it was re-ported
  by hand, keeping the MR's assertions.
- `core/lib/Drupal/Core/Form/FormErrorHandler.php`: the MR's `protected $renderer;` was changed to
  `protected RendererInterface $renderer;`. **Required** on current `main`: `inline_form_errors` now uses
  constructor property promotion with a typed `RendererInterface $renderer` (`780eb17c`, 2026-11-04), and
  an untyped parent property is a fatal error when the module is enabled. This is a real portability defect
  of the MR, not a lab preference.
- Nothing else was changed.

**August 6 proposal → `main`**

- Dropped the `FormPreprocess` hunk that flips `enable_html5_validation` from `TRUE` to `FALSE`: it is a
  site-wide native-validation change unrelated to this issue, meaningful only on 11.4.x; `main` already
  defaults to `FALSE` (`d5babbbe`, 2026-04-28, #1797438).
- Dropped the `@file` docblock removal (cosmetic; conflicts with the `theme()` hook added in `bdba9f89`).
- Ported `getErrorId()` into core `FormErrorHandler`, the three `$variables['error_id'] = NULL;` lines into
  `FormPreprocess`, and the `error_id` assignment into `InlineFormErrorsThemeHooks`.
- **Not ported: the six unit tests.** They assert intermediate PHP arrays and the file has changed since
  11.4.x; they are replaced by the acceptance test described in
  [INDEPENDENT-COMPARISON.md](INDEPENDENT-COMPARISON.md).
