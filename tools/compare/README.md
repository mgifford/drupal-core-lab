# tools/compare: Drupal core before and after

Shows upstream Drupal core and a patched copy side by side in a browser, and
produces a diff of what each serves. Modelled on the compare tool in
FOSDEM-website, adapted to live Drupal sites.

## Environments
Two DDEV projects from `envs/` (see `../../AGENTS.md`). Local development only.

| Site | Directory | URL | Login |
|---|---|---|---|
| Upstream `main` (before) | `envs/baseline-main` | https://drupal-core.ddev.site | admin / admin |
| Patched (after) | `envs/issue-<nid>-<variant>` | https://drupal-patch.ddev.site | admin / admin |

Both have Inline Form Errors on, the Article content type (recipe
`core/tests/fixtures/recipes/article_content_type`), and CSS/JS aggregation off
(so changed files can be compared as readable source).

## Side-by-side viewer

    node tools/compare/serve.mjs [slug]       # then open http://localhost:8100/

The **top bar** always shows page navigation: **Compare upstream with** (variant), **Page**, **Go (both)**, **Log in both as admin**, **Reload Before / Reload After**, **Tools** (Clear Drupal caches, Reset browser state, Open outside this tool) and the status line.
Below it, the **conditions toolbar** keeps the three choices you change most always visible: **Device width** (Mobile / Tablet / Desktop, the default), **Colour mode** (Light / Dark / Follow OS) and **Compare as** (Side by side / Onion skin / Difference). Three popovers hold the rest:
**Conditions** (Text direction, Simulate a dark-mode OS, JavaScript off, the forced-colours window), **Input** (Sync scrolling, Sync navigation, Mirror clicks, typing and drags, Mirror hover and focus) and **Audits** (live axe-core, best-practice rules, Lighthouse).
A popover button shows how many settings inside it are not at their default, a strip above the frames lists everything that is not default (with Reset all), and each changed setting in a popover has its own Reset link. Escape closes a popover.
The frames fill the window. Under them is the **dock**, one tab per result: **Steps**, **Checks** (Run checks), **Manual** (manual confirmation), **Accessibility** (axe), **Lighthouse** and **Environment**. Each tab carries a badge (for example 2/13, ✓ pass, ✗ fail, off). Hide panel and Larger resize the dock; the chosen tab and size are remembered in this browser only.

- Colour mode (formerly "Site theme") sets or clears the Default Admin `dark-mode` class on `<html>`. Follow
  OS uses the real or simulated OS preference.
- Simulate a dark-mode OS rewrites `prefers-color-scheme` media rules in both
  frames and makes `matchMedia` report dark, so the theme's scripts see it too.
  It is a simulation; confirm a real result by switching the OS to dark.
- Each site is reached through a small proxy on `before.localhost:8101` /
  `after.localhost:8102`. Separate hostnames keep the two admin sessions apart
  (cookies are scoped by host, not port), the proxy strips framing headers and
  injects the sync script. The sites themselves are unchanged. The proxies reach the DDEV router over HTTPS (port 443, certificate not verified, local only): DDEV's plain-HTTP router port can reset connections.

## Text direction and JavaScript off
**Text direction** (Page default / Left to right / Right to left) sets `dir` on the `<html>` element in both frames at once, to check layout in right-to-left
languages without installing one. It is a simulation: the page's text stays in its own language. **Turn the sites' JavaScript off** makes the proxy drop the
sites' own scripts (data blocks such as drupalSettings stay) and show `<noscript>` content, then reloads both frames, so you see what a visitor without JavaScript gets.
The viewer's own script still runs, so mirroring and scrolling keep working. Neither setting is remembered between visits.

## Forced colours
A page cannot switch forced colours on, so `node scripts/lab-env.mjs start <slug> --browser` (or `... browser`) opens the viewer in a lab browser whose profile persists in `.lab-browser/` (`browser --reset` deletes it). From a normal tab, **Open forced-colours window** asks the server (`emulation.mjs`, Playwright's `page.emulateMedia`) to open a separate Chromium window in which a
**Browser colour emulation** switch (Normal / Forced light / Forced dark / More contrast) changes the whole tab, both frames included, live. The page shows what each frame reports. It is emulation, not
a real contrast theme. Server endpoints: `GET /api/emulation`, `POST /api/emulation` with `{open:true}`, `{mode}` or `{close:true}`. Set `LAB_EMULATION_HEADLESS=1` for tests. See `docs/FORCED-COLORS.md`.

## Defaults and remembered choices
Optional extras (live axe, best-practice rules, Lighthouse, performance, dark-mode OS simulation, hover/focus mirroring) start **off**. Your choices
and the site theme are kept in this browser's `localStorage` (`compare.prefs`) and nowhere else. The Page field shows the page being viewed and
accepts `node/add/article` or `/node/add/article`.

## Static (GitHub Pages) mode
The same `index.html` is published from `cloud/` (built by `node scripts/build-cloud.mjs`). It detects it is not served by `serve.mjs`
(`*.github.io`, `?mode=static`, or a `variants.json` with `"static": true`) and hides every element marked `data-needs="live"`, leaving the
steps, expected result and a "how to run it" panel. Any new element that needs the server must carry `data-needs="live"`, and server URLs
must be relative (no leading `/`).

## Live accessibility checks (axe-core)
Open **Audits** and switch on **Live accessibility checks** (off by default); results appear in the **Accessibility** tab of the dock. axe-core runs inside both frames after every page load and, debounced, after interaction
(clicks, focus, changes to the page). The panel shows violating elements by impact for each
side, a verdict that is announced as an alert when After is **worse** (and as a status when it
is better or the same), the rules and exact elements that differ, and a log of every change as you
navigate, which you can download as JSON. The browser tab title gains a warning prefix when After
is worse, so you notice from another tab. Because both frames are driven the same way, a difference
points at the change. Verified by adding an image without alt text and an unlabelled input to the
After frame only: the alert appeared within about five seconds.

axe-core is installed from npm by `setup.mjs` into `tools/compare/.deps/` (MPL-2.0, not committed);
to install it by hand: `npm install --prefix tools/compare/.deps axe-core@4`. Rules: WCAG 2.0, 2.1
and 2.2 A/AA by default; switch on "Include best-practice rules" for more. Automated checks find only
a subset of barriers.

## Open outside the viewer
"Open outside this tool" links open the real Before and After sites at the current page in a new
window (they have their own login: admin / admin).

## DDEV address for the viewer
    cd tools/compare/site && ddev start          # once: https://drupal-compare.ddev.site
    node tools/compare/serve.mjs --ddev          # from the lab root
The viewer is then at https://drupal-compare.ddev.site and the frames at
`drupal-compare-before.ddev.site` and `drupal-compare-after.ddev.site` (see `site/README.md`).
Without `--ddev` it uses http://localhost:8100 and `*.localhost`.

## Steps, expected result and checks
Each variant in `variants.json` can carry `steps` (each tagged `recipe`, `mirror` or
`each`, with an optional `lookFor`), `expected`, `actual`, `setup`, and `checks`.
The viewer shows them in the **Steps** tab under the frames so a newcomer knows what correct looks like.

**Run checks** shows a banner (green when the old version fails where the fix applies, the new one passes and nothing else changed) and a Verdict column per row, with an icon and words as well as colour. Setup preconditions must pass first: the error link must be on the page and must have been used with a **real** click or key press in each frame (turn Mirror off first). It evaluates each check's `probe` (a JS expression) inside both frames and
shows Pass or Fail against `expect` (a value, or `"same"` meaning it must equal the
other side). Kinds: `precondition` (did you reach the right state?), `fix` (should
differ between Before and After), `regression` (should pass on both). For #3619127:
setup reached, sidebar open, focus in the URL alias field, saved preference not
overwritten, no JavaScript errors, same number of open details sections.
The harmless "ResizeObserver loop" browser notice is ignored in the error count.

## Optional step checklist
The variant's `steps` appear as a checklist. Ticking is optional, saved per issue in the browser (`localStorage`), shown as "n of N steps
ticked", and included in the downloaded log. **Tick the steps the recipe did** ticks the `how: recipe` steps; **Clear ticks** resets.

## Where did you test? (and reminders)
The panel records the browser, OS, viewport, colour modes looked at, input used and assistive technology, saved in the downloaded log
(`environmentTested`). The viewer also notes, per issue and browser, which colour modes you have run checks in, and reminds you of
the modes and browsers not yet recorded (dark mode, forced colours, other browsers). Save the log in `reports/issues/<nid>/manual/`
and run `node scripts/coverage.mjs <nid>`.

## Lighthouse (optional)
Open **Audits** and switch on **Run Lighthouse audits** (or press **Audit this page now** in the **Lighthouse** tab). The server runs Lighthouse for Before then After, one at a time, in its
own headless Chrome that logs in first, and shows accessibility and best-practice scores, a banner (an alert when After is worse), and the
audits that fail on one side or both. It audits the page as it **loads**: not an error summary after Save, and not a state you reach by
clicking. Install with `node tools/compare/setup.mjs <slug> --with-lighthouse` or `npm install --prefix tools/compare/.deps lighthouse`
(Node 22.19+, Playwright's Chromium). Performance is opt-in and noisy on a shared machine.

## Manual confirmation
Because the two frames stay in step, a person can confirm the change by eye. The panel asks the questions in the variant's
`observe` list (for example "The sidebar of advanced fields opened by itself") once for Before and once for After, compares your
answers with `expectBefore` and `expectAfter`, shows a green or red summary, and saves your answers and a notes field in the
downloaded log. It does not depend on the automated checks and does not replace testing with a keyboard.

## View modes: finding differences
- **Side by side** (default).
- **Onion skin**: Before underneath, After on top, with an opacity slider.
- **Difference**: the frames are blended so identical pixels are black and anything
  that changed lights up. **Amplify** reveals faint differences. For #3619127 the
  Create Article page is entirely black: pixel-identical before and after.
In both overlay modes input goes to the top (After) frame; Mirror repeats it underneath.
Compositing needs no pixel access, so it works across the two sites. Onion skin was
not exercised in the browser yet; Difference was.

## Caches and browser state
**Clear Drupal caches (both)** runs `ddev drupal cache` on both sites at once and
reloads the frames. **Reset browser state (both)** clears `localStorage` and
`sessionStorage` in both frames (the sidebar open/closed preference lives there).
The proxies also send `Cache-Control: no-store`, so the browser never serves stale
CSS or JS.

## Mirror clicks, typing and drags
Repeats your real clicks, typed text, checkboxes, radios, selects and **drags** (for example Drupal table drag on /admin/structure/block)
from either frame in the other, to save setup time. A drag is replayed as synthetic pointer and mouse events once the pointer has moved
more than 5px, relative to the matching handle. Verified with `node tools/playwright/mirror-drag.mjs`. Typing in the Title field and
collapsing a details section were also checked.

**Mirror hover and focus** (separate, off by default) draws a marker on the matching element in the other frame (dashed for hover, solid
blue for focus). A page cannot set the real `:hover` or `:focus-visible` style on another frame, so the marker shows where the pointer or
focus is, not how it looks.

- Only trusted user events are captured, so replayed events never loop.
- It does **not** mirror Tab, Enter or focus. Script-generated key events do not
  move focus or type, and the replayed side never gets real focus (no
  `:focus-visible`). Do the keyboard and focus checks in each frame yourself:
  that is the thing being tested, and a mirror would hide a difference.
- If the matching element is missing on the other side, the page says so
  ("Not mirrored: ... The two sides have diverged here"). That is a finding.
- Elements are matched by stable `id`, else by structural position. Rich widgets
  (CKEditor, autocomplete, file upload) are untested.

## CKEditor 5
CKEditor is a `contenteditable` element, not an input, so it is mirrored through its own API: a change in one frame sends the editor's HTML,
and the matching editor in the other frame (matched by its source textarea's name, e.g. `body[0][value]`) gets `setData`. Verified both ways with
real typing: `node tools/playwright/mirror-ckeditor.mjs`. Limits, so you know what to confirm by eye:
- Only the **content** is mirrored. Selection, caret and toolbar state are not, and `setData` moves the caret in the replayed frame.
- Toolbar buttons (bold, lists, link dialogs) are mirrored as clicks, but each editor's selection differs, so the formatting may not match.
  Treat a difference there as something to check by hand, not as a result.
- Keyboard use of the editor (Alt+F10 to the toolbar, arrow keys) is never mirrored; do it in each frame.
- Live axe sees the editor as ordinary DOM. It cannot judge editing behaviour; that needs a person with a keyboard and a screen reader.

## Diff report

    node tools/compare/diff.mjs [slug]

Logs in to both sites, fetches each page in `pages` and every local CSS/JS file
it references, normalises per-site noise (hostnames, form tokens, random ids,
cache-busting query strings, drupal-settings JSON, aggregate file names) and
writes `reports/issues/<nid>/compare/<slug>/SUMMARY.md` plus one `.diff` per
changed file. For #3619127 it reports exactly one differing item (the patched `sidebar.js`) out of a few hundred compared.

## variants.json: field reference
One entry per comparison; `docs/NEW-ISSUE.md` walks through writing one. A variant may `"extends": "<slug>"` another and override
fields (`core`, `before`, `after` merge one level deep, so `after.patches` is inherited unless replaced).

| Field | Meaning |
|---|---|
| `slug`, `issue`, `label`, `description` | Identity and the sentence shown above the frames. |
| `core` | `{ "commit": "<sha>" }` pins an exact core commit; `{ "ref": "main", "commit": null }` follows the branch (fetched when an environment is first created). |
| `before.env`, `after.env` | Directory names under `envs/`. `after.patches` lists patch files (paths from the repository root) applied in order. `url` overrides the link for "open outside". |
| `recipe` | Directory under `recipes/` applied to both sites (the starting state). Omit for a plain Standard install. |
| `pages`, `login` | Pages the diff report fetches; whether it logs in. |
| `steps`, `expected`, `actual`, `setup` | Shown above the frames. Each step: `{ text, how: "recipe" / "mirror" / "each", lookFor }`. |
| `checks` | `{ label, probe, expect, kind }` for Run checks: `probe` is a JS expression evaluated inside each frame; `expect` a value or `"same"`; `kind` is `precondition`, `fix` or `regression`. |
| `observe` | `{ label, expectBefore, expectAfter }` for the manual confirmation panel. |
| `demo` | `{ start }`: the page both frames open on. |
| `languages` | Language codes `setup.mjs` adds to both sites (`scripts/lab-site.sh language <env> <code>`, via `scripts/add-language.php`), each with a `/<code>` URL prefix. `fa` (Farsi) is right to left. The interface stays English unless translations are imported. |

## If a frame does not load
The viewer raises an alert after 12 seconds and checks both sites; use **Reload Before / Reload After**. Details of what
was fixed and how to measure it: `docs/FRAME-LOADING-2026-10-01.md`. If a DDEV project is not running, `ddev list`,
then `ddev restart` in that environment.

## Local security
The viewer runs on your machine but is reachable by any web page you open in the same browser, so it defends itself:
- The API accepts only its own hostnames and origins (`localhost:8100`, `127.0.0.1:8100`, `drupal-compare.ddev.site`), refuses cross-site requests (`Sec-Fetch-Site`), and every action that changes something (`/api/cache`, `/api/login`, `/api/lighthouse/run`, `/api/state`, `/api/emulation`) is POST-only.
- The proxied sites send `Content-Security-Policy: frame-ancestors` for the viewer's origins only, so no other page can frame a logged-in site.
- Inside a frame, the injected script talks only to the viewer (it checks `event.source` and `event.origin`, and posts to the viewer's origin, never `*`); the viewer talks only to its own frames, at their origin.
- Listening sockets are bound to `127.0.0.1`.
An IP allowlist would not add protection: the dangerous requests come from your own browser (so from 127.0.0.1) via another web page. To allow another origin (for example a cloud workspace) set `LAB_EXTRA_ORIGINS="https://host.example"` before starting the viewer. Regression test: `node tools/playwright/viewer-security.mjs`.

## Limits
- It compares behaviour in a browser and the files served. It does not replace testing with a keyboard.
- Only one variant's environments are proxied at a time (the page switches variants, but that variant's environments must be running).
- Tested in Chromium (the in-app browser and Playwright). Frames use `SameSite=None; Secure` cookies on `*.localhost` or
  `*.ddev.site`; other browsers are untested. Onion skin has been used but not systematically checked.
- Rich widgets (CKEditor, autocomplete, file upload) are untested with Mirror.
- Script-generated events do not trigger the same behaviour as real input: for focus and activation use real clicks and keys.
