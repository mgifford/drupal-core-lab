# MR !16770 review update draft

**DRAFT. Do not post.** The original MR and its review threads were not
modified or published. GitLab returned HTTP 401 for review-thread retrieval,
so unresolved thread state remains unverified.

## What the MR changes

MR !16770 removes the Default Admin `form--checkbox-toggle` stylesheet from
`default_admin.libraries.yml` and empties the PostCSS and compiled CSS files.
The intended result is that standalone native checkboxes fall through to the
existing `form--checkbox-radio` presentation.

## Static review

- The original patch applies to the MR base
  `07d6e6935e795a62266697da0286a77b7c94b1a4`.
- The patch is limited to the expected three files.
- It does not change native checkbox markup, ARIA, form submission code, or
  radio styles.
- It leaves both obsolete stylesheets tracked at zero bytes.
- Core's CSS build check reports the PostCSS output as stale.
- Stylelint reports `Unexpected empty source` in both stylesheet files.
- The original patch does not apply to current Core `main`
  `97c6ff8b2534b242c0f1df3e4ba2493e56aebcec`.

## Proposed correction

Keep the imported MR patch unchanged and apply
`branches/delete-empty-stylesheets.patch` after it. That patch deletes the two
obsolete zero-byte files rather than retaining them. The resulting stack passes
`git apply --cached --check`.

For current `main`, the separate
`branches/main-rebased-97c6ff8b.patch` makes the same final three-file change
against the refactored source. Its textual interdiff is included.

## Runtime evidence

Blocked. Docker first ran out of overlay space before DDEV installed Drupal.
Host space later recovered, but unrelated comparison pairs were active in the
shared environment and were not interrupted. No screenshot, keyboard,
save/reload, axe, accessibility-tree, forced-colors, zoom, or screen-reader
result is claimed.

## Readiness

MR !16770 is **not ready for a maintainer update that says the MR passed Lab
checks**. Its empty-file problem should be corrected and the branch rebased
before runtime review. Once DDEV capacity is restored, the next evidence run
should use `3594809-corrected` and `3594809-latest`.

Suggested next action: amend the MR to delete the two files, then capture the
new exact tip and re-run the registered evaluator. Do not post this draft or
the local rebase automatically.
