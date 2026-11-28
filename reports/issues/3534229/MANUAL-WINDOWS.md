# Manual verification checklist: Windows contrast themes (#3534229)

Status: **NOT DONE**. This file is for a person to run on real Windows hardware. The Lab used
Chromium's forced-colors emulation, which is evidence but not the same as a real contrast theme,
and no Firefox/Safari/Edge contrast-theme run was possible on this machine (macOS).

A browser's forced-colors emulation covers the CSS media query, but it does not cover: the user's
actual palette (Windows contrast themes can be black-on-white, white-on-black, yellow-on-black, custom
colours), the browser's own focus indication, or OS-level zoom and text scaling. That is why this pass is
still needed before final accessibility approval.

## What to test

Environment: Windows 11 (or 10), a real installation, both Lab sites or the standalone fixture. Record the
Windows build, the contrast theme name/colours, the browser and version, and the zoom level.

1. **Settings → Accessibility → Contrast themes**: test at least
   - "Night sky" (dark, coloured accents),
   - "Desert" (light, brown accents),
   - a custom theme with a non-black Canvas and a non-white CanvasText (for example Canvas `#101820`,
     CanvasText `#FFD23F`), so that "black icon on black Canvas" is not the only failure mode.
2. For each theme, in **both** Edge/Chromium and Firefox (Firefox honours Windows contrast themes too),
   open `/admin/config/content/formats/manage/full_html`, signed in as an administrator.
3. Check, in the **Available buttons**, **Button divider** and **Active toolbar** lists:
   - [ ] every icon-only control shows a recognizable icon in the theme's text colour;
   - [ ] Heading, Style and Language keep their text labels and their caret;
   - [ ] Alignment keeps its icon **and** its caret, in LTR and in an RTL language (for example Farsi);
   - [ ] available (disabled) controls are distinguishable from active ones;
   - [ ] the fieldset, list boundaries and the active toolbar container stay visible;
   - [ ] hovering and keyboard-focusing an item keeps the icon visible and shows the tooltip;
   - [ ] the focus outline is fully visible on all four sides and is not clipped by the icon;
   - [ ] keyboard reordering with the arrow keys still works and is announced;
   - [ ] drag and drop still works and the dragged item shows its icon;
   - [ ] Save configuration persists the toolbar, and a reload restores it;
   - [ ] with contrast themes off, light and dark mode look identical to the Before site.
4. Screenshot each state. Save the screenshots and the recorded environment next to this file (for
   example `manual/windows-<theme>-<browser>-<ltr|rtl>.png`) and note anything that looked wrong.
5. Also check a **contributed CKEditor 5 plugin** toolbar item if one is installed: its icon is expected
   to keep its previous rendering until the plugin opts in to `--ckeditor5-toolbar-icon` (documented in
   `core/modules/ckeditor5/css/toolbar.admin.css` in the patch). Say explicitly which plugin and version
   was used, or that none was available.

## What "pass" means for this issue

Every toolbar-configuration item renders a visible, recognizable icon (or its text label) in every
contrast theme tested, in both browsers, LTR and RTL, and the interaction states above still work. Focus
outlines and tooltips are not clipped by the icon mask. If any item is invisible or ambiguous, the issue
is not ready for RTBC.

## How this maps to the acceptance criteria

| Criterion | How this checklist covers it |
|---|---|
| icons remain recognizable | steps 3 and 5 in each real palette |
| boundaries remain visible | step 3, "list boundaries" |
| text and carets legible | step 3, Heading/Style/Language and Alignment |
| focus outlines not clipped by masks | step 3, focus outline |
| tooltips functional | step 3, tooltip |
| available and active distinguishable | step 3 |
| drag and keyboard reordering work | step 3 |
| configuration saves and restores | step 3 |
| non-forced-colors presentation unchanged | step 3, last bullet |

AI-assisted disclosure: this checklist and the Lab evidence were produced with AI assistance (DeepSeek
Harness) and are drafts for a person to verify and post; nothing was posted to drupal.org.
