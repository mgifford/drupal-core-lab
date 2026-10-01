# Guidepup before/after analysis — admin sidebar

This directory contains a VoiceOver (macOS) harness that captures what a screen
reader announces for the admin content-form sidebar, so the behavior can be
compared before and after the patch.

## Requirements
- macOS with VoiceOver enabled and **VoiceOver Automation** allowed for the
  terminal/node process (System Settings > Privacy & Security > Accessibility).
- Node 18+ and the dev dependencies below.

## Install
```
npm i -D @guidepup/guidepup playwright
npx playwright install chromium
```

## Run (twice — before and after the patch)
```
# On the unpatched code:
node guidepup/sidebar-modal.voiceover.mjs > before.txt

# Apply the patch, clear Drupal caches, then on the patched code:
node guidepup/sidebar-modal.voiceover.mjs > after.txt

diff before.txt after.txt
```

## What the script does
1. Opens node/add/article.
2. Submits an invalid path alias ("about") to force a child error in the
   sidebar/advanced group.
3. Records the screen-reader announcement.
4. Opens the sidebar via the single toggle control.
5. Moves VoiceOver into the panel and records the announcement.
6. Presses Tab (to verify focus is trapped inside the panel).
7. Presses Escape (to verify the panel closes and focus returns to the toggle).

The `diff` of the two logs is the before/after analysis. See ANALYSIS.md for the
expected differences.
