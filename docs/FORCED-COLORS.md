# Testing forced colours (Windows "contrast themes" and similar)

**What it is.** In forced-colors mode the browser replaces the page's colours with a small palette the user chose (for example black on white, or
yellow and blue on black). Author colours for text, backgrounds, borders and outlines are overridden, with these exceptions: a colour written as a
**system colour keyword** (`CanvasText`, `LinkText`, `ButtonText`, `Highlight`...) is kept, and `forced-color-adjust: none` opts an element out. Anything
that relies on colour alone (a red border) can vanish; shapes, icons and text survive. That is why it matters for #3604037, which marks a group that
contains an error with a red bar, a red label and an icon.

## The easiest way: start the viewer in the lab browser
    node scripts/lab-env.mjs start <slug> --browser        (or, with the viewer already running:  node scripts/lab-env.mjs browser)

This opens the viewer straight into the **lab browser**, a Chromium window the lab server controls, so the **User preferences** switch is on the page and you
need only one window. It opens at browser defaults; pick a forced mode when you want it. The lab browser has its **own saved profile** (`.lab-browser/`, not committed), so the
viewer's remembered choices, step ticks and notes survive between launches; it does not use your everyday browser's extensions or logins. Start clean with
`node scripts/lab-env.mjs browser --reset`. Test: `node tools/playwright/lab-browser.mjs`.

## From a normal browser tab: the forced-colours window
In the viewer press **Open preference emulation window**. A separate Chromium window opens on the viewer **at browser defaults**, and in it a **User preferences** switch
provides Forced colours Off / Light / Dark plus independent Contrast, Motion and Transparency buttons for
**both frames at once**. The line beside the switch shows what each frame actually reports (for example "Before: forced colours on, dark"), so you can see the
setting really reached them. It is **emulation**, not a real Windows contrast theme, so keep a real-theme check (below) for the final word. The window is a clean
Chromium profile (no extensions, no logins): press **Log in both as admin** in it. It needs the lab's Playwright install (`node scripts/doctor.mjs` checks it),
and it exists only when the lab server is running; the read-only GitHub Pages guide does not have it. Test: `node tools/playwright/forced-window.mjs`.

The former standalone More preset has been removed. More now appears only under Contrast and means prefers-contrast: more; it does not turn on forced colours, magnify content, or increase every preference.

## Other ways to turn it on
| Where | How |
|---|---|
| Real thing (best) | Windows: Settings > Accessibility > Contrast themes. Firefox on any OS: Settings > General > Colors > Manage Colors > "Always" high contrast. |
| Chrome / Edge | DevTools > More tools > Rendering > "Emulate CSS media feature forced-colors" > active. Pair with "prefers-color-scheme" to try the light and dark palettes. |
| Playwright | `browser.newContext({ forcedColors: 'active', colorScheme: 'dark' })` (see `tools/playwright/evaluate-3604037.mjs`). |

## Scope of the lab controls

The lab controls change the two comparison frames. They do not override the viewer's own media preferences. The viewer remains usable as the comparison changes. The Conditions panel is labelled User preferences; its placement supplies the scope without a technical label on every control.

Implementation detail: the lab browser launches Chromium with isolated origins for Before and After, obtains a separate DevTools session for each comparison frame, and sends media overrides only to those targets. It reattaches and reapplies preferences when a frame navigates. If frame isolation is unavailable, the lab reports that condition rather than falling back to whole-window emulation. Native OS preferences and manual DevTools whole-tab emulation are separate ways to test and may also affect the viewer.

## What to look at
1. Is the thing that was marked still **distinguishable without colour** (an icon, text, a shape)? 
2. Are icons **visible** (not the same colour as the background)? An icon drawn with a CSS `mask-image` takes its colour from `background-color`, and
   forced colours overrides plain colours, so `background: currentColor` alone makes it vanish (we tested this: contrast 1:1).
3. Does the icon's colour **match the text it marks**? Compare it with the label, in both the light and the dark palette.
4. Is the focus indicator still visible, and not hidden behind a border?

## Scripted comparison
    node tools/playwright/evaluate-3604037.mjs 3604037-latest --modes=forced,forced-dark,forced-preserve,forced-dark-preserve

It writes side-by-side images (Before, After, and After with a proposed change) and contrast numbers to `reports/issues/3604037/playwright/`. The proposals
(`*-currentcolor`, `*-preserve`, `*-linktext`) rewrite the CSS in the browser only; nothing in an environment is changed.

## Automated checks do not replace this
axe-core does not evaluate forced-colors rendering. A person (or a screenshot comparison like the one above) has to look.


## User-preference media queries

In the lab browser, open **Conditions > User preferences**. Forced colours retains its Off / Light / Dark buttons. Contrast, Motion and Transparency use the same segmented radio-button pattern as the rest of the toolbar. There are no duplicate browser-colour-scheme or forced-colours dropdowns.

Contrast offers Default / No preference / More / Less / Custom. Motion and Transparency offer Default / No preference / Reduce. Default removes an override and follows the browser or OS; No preference explicitly emulates that query value. Custom contrast tests the CSS value, not a custom palette editor.

Preferences combine without reloading either frame. Changing forced colours now preserves your motion, contrast and transparency choices. Reset all media preferences clears all overrides. These overrides last for the current lab-browser session. The collapsible Actual media-query values table reports what Before and After match, rather than assuming that a requested value took effect. Optional groups are hidden when the current emulation session cannot expose the feature.

The existing Colour mode controls remain the place to choose Drupal's light/dark theme. That author-theme choice differs from the browser's prefers-color-scheme signal. The forced-colours Light/Dark controls set the emulated palette and browser colour scheme, select Follow OS and clear the older simulated dark-OS override so the palette can be tested consistently.

### Browser support and lab emulation limits

A browser supporting a CSS media query and a tool being able to emulate it are separate capabilities. The lab checks the current controlled Chromium session by querying legal feature values. If none matches, the feature is not usable through this session. This is not a limitation in Drupal's CSS implementation, and does not establish support in other browsers or operating systems.

The reported session does not expose usable prefers-reduced-data or inverted-colors support, so neither is presented as an interactive control. The backend retains these query definitions for capability reporting and future browser support. Test them using an appropriate browser and native OS setting where available. A CSS invert filter is not a substitute for inverted-colors emulation. Reduced-data CSS emulation, where available, would not set Save-Data headers or throttle the network. Forced-colours emulation remains distinct from a native Windows contrast theme.

Inspired by [Carie Fisher's article on inclusion through user choice](https://www.smashingmagazine.com/2023/08/css-accessibility-inclusion-user-choice/). Its 2023 browser-support figures are not used as current capability data.

Validation commands:

```sh
node --test tests/lab/media-preferences.test.mjs tests/lab/media-api.test.mjs
node tools/playwright/media-preferences.mjs
node tools/playwright/viewer-security.mjs
```

The standalone browser test requires the existing Playwright Chromium install. The security walkthrough requires the viewer to be running. AI-assisted implementation; no Drupal core patch is changed.
