# Reproduce #2574721: module operations on narrow screens

**DRAFT.** Reproduction and comparison are based on recorded runs from 2026-11-23.

Issue: [#2574721](https://www.drupal.org/project/drupal/issues/2574721)

## Task and barrier

An administrator needs Help, Permissions, and Configure actions for installed modules.
On screens narrower than 60em, the responsive table hides the description column containing those links.

Expected: the links remain available in an operations cell and use Drupal’s dropbutton interaction.

## Comparison identity

- Latest variant: `2574721-latest`.
- Before: `baseline-2574721-current`, pristine core `97c6ff8b2534b242c0f1df3e4ba2493e56aebcec`.
- After: `issue-2574721-current`, the same core commit plus [`2574721-current-main-proposal.patch`](branches/2574721-current-main-proposal.patch).
- Recipe: [`recipes/repro_2574721/recipe.yml`](../../../recipes/repro_2574721/recipe.yml).
- Page: `/admin/modules`.
- Account: administrator after the Standard install.
- Environment: local DDEV, PHP 8.5.13, Drupal 12.0-dev, `default_admin`.

The pinned stack uses:

1. [`drupal-2574721.patch`](branches/drupal-2574721.patch), MR `ed3917f4`.
2. [`2574721-2574721-lab-proposal.patch`](branches/2574721-2574721-lab-proposal.patch), the lab follow-up.

## Start

Run from the repository root:

```bash
node tools/compare/setup.mjs 2574721-latest --check-patches
node tools/compare/setup.mjs 2574721-latest
node scripts/lab-env.mjs start 2574721-latest
```

## Reproduction

1. Open the comparison viewer and log in both frames.
2. Go to `/admin/modules` in both frames.
3. Resize the browser to 480px wide.
4. Confirm that Before has no visible operations cell and that its description column is hidden.
5. In After, find an installed module with multiple operations.
6. Confirm that Configure, Permissions, or Help remains in an operations cell.
7. With the pointer, open the dropbutton and inspect every secondary link.
8. With the keyboard, focus the primary link, press Tab to reach the toggle, press Enter, and press Tab to reach a secondary link.

## Recorded results

At 480px in Chromium, Before had 0 operations cells. After had 61 operations cells and 72 operation links.
The sampled dropbutton remained inside the viewport.
The toggle opened with real keyboard input, and Tab reached “Help for Announcements”.

The issue also reproduces at 1280px as a discoverability problem: Before places operations inside collapsed module details.
After exposes the primary action in the row and keeps additional actions in the dropbutton.

## Automated checks

```bash
node scripts/lint.mjs 2574721-latest
node tools/playwright/evaluate-2574721.mjs 2574721-latest --viewport=480x900
node tools/playwright/evaluate-2574721.mjs 2574721-latest --viewport=1280x900
node tools/playwright/tree-diff.mjs 2574721-latest --viewport=480x900
```

## Not verified

- A person’s screen-reader pass was not run.
- Safari Full Keyboard Access was not available in Playwright WebKit.
- The 400% zoom and direct 320px CSS viewport checks were not run.
- Drupal.org CI was not run.
