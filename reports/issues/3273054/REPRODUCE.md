# Reproduce #3273054: text-format permission checkboxes have a hidden focus stop

Issue: https://www.drupal.org/project/drupal/issues/3273054
Pinned core: `ad11ba71c0f09b856e45dfdb8db155b5a588712d` (`main`, 2026-10-15). Built and run; result `not-reproduced` on `main`.

## The problem in one paragraph

On `/admin/people/permissions`, every permission checkbox gets a `visually-hidden` label built from
`$role . ': ' . $permission_title`. For text formats the permission title used to contain a link to the format
configuration page, which made each of those hidden labels focusable. Tabbing through the Filter module section
stopped on that invisible link before each checkbox, so a keyboard user hit a tab stop with no visible focus
indicator: WCAG 2.1/2.2 SC 2.4.7 (Focus Visible). Screen readers also read a labelled-by node that is not the
control.

The rendering chain is:

1. `Drupal\filter\FilterPermissions::permissions()` builds the permission title. Until #3619751 it was
   `Use the <a href=":url">@label</a> text format`.
2. `Drupal\user\Form\UserPermissionsForm::buildForm()` sets `#title` to `$role_name . ': ' . $perm_item['title']`
   with `#title_display: 'invisible'`.
3. The form element renders that title inside `<label class="visually-hidden">`, link and all.

## Reproduce it (pinned core, exactly as verified)

    node tools/compare/setup.mjs 3273054-pinned                 # builds Before and After, applies the recipe
    node scripts/lab-env.mjs start 3273054-pinned --browser
    node tools/compare/serve.mjs 3273054-pinned                 # side-by-side viewer
    node tools/playwright/evaluate-3273054.mjs 3273054-pinned   # scripted replay with real input

There is no issue fork and no merge request, so `after.authoring` is `true` and After starts equal to Before.
The patch is written in the After checkout and turned into a file:

    # edit files in envs/issue-3273054/
    node scripts/capture-patch.mjs 3273054-pinned --name 3273054-text-format-permission-focus

## Steps in the viewer

1. Standard install: the Content editor role and the Basic HTML, Full HTML and Restricted HTML text formats exist.
2. Open `/admin/people/permissions` in both frames (the viewer logs in).
3. Type `text format` in the Filter permissions field so the Filter module section is at the top of the table.
4. In each frame, click into the Filter permissions field and press Tab once per stop through the text-format
   checkboxes. Watch for a stop that shows no visible focus outline, and for a screen reader announcement naming
   the control.

## Try it on the latest core

    node tools/compare/setup.mjs 3273054-pinned --check-patches   # use 3273054-latest for current core
    node tools/compare/setup.mjs 3273054-latest
    node tools/playwright/evaluate-3273054.mjs 3273054-latest

`3273054-latest` follows `main`, so it is the pair that answers "does this still reproduce upstream?".

## If the result is not what you expect

| What you see | What it probably means | What to do |
|---|---|---|
| **Before does not fail** (no hidden focus stop) | On `main` the link was already removed by #3619751 | This is the expected result on `main` after 12.0.0-alpha1. Confirm the check probes and look at 11.x, where the link is still present. |
| The Fix check fails on both frames | The probe no longer matches the markup | Re-read the rendered label markup and update the probe in `tools/compare/variants.json`. |
| A patch does not apply | Core changed the same lines | Regenerate the lab patch from the current After checkout. |

## Re-pin to a newer core after verifying

1. Run the `-latest` variant to the end and read the walkthrough's "Interpretation".
2. Put the verified commit (`git -C envs/issue-3273054-latest rev-parse HEAD`) in `core.commit` of the `-pinned`
   variant in `tools/compare/variants.json`.
3. Re-run the walkthrough and the diff report, commit the new evidence, update "Pinned core" above.
