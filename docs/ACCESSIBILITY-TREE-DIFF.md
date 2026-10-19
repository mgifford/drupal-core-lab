# Accessibility tree, ARIA and speech: Before vs After

`tools/playwright/tree-diff.mjs` answers one question about a change: **did it alter what assistive technology is given?** For
each page it reads three views on each side, writes them as plain text, and diffs them line by line.

| View | File | What it is |
|---|---|---|
| Accessibility tree | `*.axtree.diff` | Chromium's accessibility tree: role, name, description, value and states (expanded, checked, required, invalid, focusable, level, ...) of each node, indented. This is what the browser hands to a screen reader through the platform accessibility API. |
| ARIA after JavaScript | `*.aria.diff` | The DOM after the page's JavaScript ran: each element with a role, `aria-*`, `tabindex`, `hidden` or `inert`, and each link, button, form control, `summary`, `details`, `dialog`, `iframe` and image, with those attributes. Every ID reference (`aria-labelledby`, `aria-describedby`, `aria-controls`, `for`, `headers`, ...) is looked up: `[missing #id]` or `[#id ×2]` marks one that does not resolve to exactly one element. `(not rendered)` marks an element Chromium does not draw. |
| Speech (Guidepup) | `*.speech.diff` | What the Guidepup virtual screen reader says moving through the whole page item by item, like the down arrow in a screen reader's browse mode. |

**Terms.** "Accessibility tree" is the term in W3C specifications, WCAG understanding documents and MDN. "AXTree" is Chromium's
internal name (Chrome DevTools' "full accessibility tree", the DevTools Protocol's `Accessibility.getFullAXTree`); browser and
tooling developers use it as shorthand, but it is not a standard term. Each browser builds its own tree; this tool reads Chromium's.

## Run it

### On your laptop (local DDEV), step by step

From the lab checkout (`cd ~/drupal-core-lab`):

    git pull --ff-only                       # 1. the tool arrived on 2026-10-19; an older checkout says "Cannot find module ... tree-diff.mjs"
    cd tools/playwright && npm install && npx playwright install chromium && cd ../..   # 2. once: Playwright, jsdom, Guidepup, Chromium (about 150 MB)
    node scripts/test-mr.mjs 3619154         # 3. builds or refreshes Before and After and starts them (skip if they are already running)
    node tools/playwright/tree-diff.mjs 3619154                     # 4. about 30 seconds a page
    open reports/issues/3619154/tree-diff/3619154-latest/SUMMARY.md   # 5. macOS; or open it in your editor

1. If `git pull` refuses because of local changes, `git stash -u` sets them aside (`git stash list` shows them), then pull again.
2. Only needed once per checkout. `node scripts/doctor.mjs` reports whether it is there ("Playwright package", "Playwright
   Chromium"). Without it the tool says what to run instead of failing.
3. Any issue number or variant works: `node scripts/test-mr.mjs <nid>`, then `tree-diff.mjs <nid>`. The tool stops with the command
   to run when a site is not built (`setup.mjs`) or is stopped (`lab-env.mjs start`).
4. It reads the variant's pages (for #3619154, `/node/1/edit`) on Before, then on After, logged in as admin with one-time links,
   and prints what changed. Other pages and widths:

       node tools/playwright/tree-diff.mjs 3619154 --page=/node/1/edit --page=/node/add/article
       node tools/playwright/tree-diff.mjs 3619154 --viewport=480x900      # writes 3619154-latest-480x900/

5. The terminal already shows the changed lines; `SUMMARY.md` has the same with links to each diff and the full views.

What the terminal shows for #3619154 (MR !16911 at `175e6f17`; from the scratch run, so your hostnames and counts may differ):

    Before: https://repro-baseline-3619154-latest.ddev.site (logging in with a one-time link)
      /node/1/edit: 150 tree lines, 206 items spoken, 0 unresolved ID references
    After: https://repro-issue-3619154-latest.ddev.site (logging in with a one-time link)
      /node/1/edit: 150 tree lines, 206 items spoken, 0 unresolved ID references

    What changed, Before -> After (each page as it loads; Chromium 141.0.7390.37, 1280x900, logged in: yes):

    /node/1/edit
      Accessibility tree      +1 -1
        - button "Hide sidebar panel" focusable expanded controls=#default_admin_sidebar
        + button "Sidebar panel" invalid=false focusable expanded controls=#default_admin_sidebar
      ARIA after JavaScript   +2 -2
        - a.meta-sidebar__trigger.trigger "Hide sidebar panel" role="button" aria-controls="default_admin_sidebar" aria-expanded="true"
        + button.meta-sidebar__trigger.trigger "Sidebar panel" aria-controls="default_admin_sidebar" aria-expanded="true" type="button"
        + button.meta-sidebar__close.trigger "Close sidebar panel" aria-controls="default_admin_sidebar" type="button" (not rendered)
        - a.meta-sidebar__close.trigger "Close sidebar panel" role="button" (not rendered)
      Speech (Guidepup)       +1 -1
        - button, Hide sidebar panel, 1 control, expanded
        + button, Sidebar panel, 1 control, expanded

    ID references that do not resolve: none.

    Report: reports/issues/3619154/tree-diff/3619154-latest/SUMMARY.md

Read it as: the sidebar toggle was a link given `role="button"`, named "Hide sidebar panel"; it is now a native button named
"Sidebar panel", and its open or closed state is only in `aria-expanded` (a screen reader says "expanded" or "collapsed"). The close
button became a native button too, moved to the top of the sidebar, and now says which panel it controls. Nothing else changed in
what assistive technology is given on this page. Whether that is right is your call; the tool only shows it.

Then commit the folder if you want to keep it as evidence (`git add reports/issues/3619154/tree-diff`). Each run replaces the last
one in that folder, so git holds the history. The run refuses to start when a side is not what the variant says (the same check as
the evaluators).

### In DDEV Coder

The same steps in the workspace's terminal, from `~/drupal-core-lab`, with `--with-deps` in step 2 (Chromium needs system
libraries there): `cd tools/playwright && npm install && npx playwright install --with-deps chromium && cd ../..`. Status: not yet
run in a Coder workspace (2026-10-19). It uses the same headless Chromium and site addresses (`https://<project>.ddev.site`, at
DDEV's router port) as the evaluators. Read `SUMMARY.md` in the workspace's file browser, or `cat` it.

### Any two sites

As they are (no DDEV, no variant):

    node tools/playwright/tree-diff.mjs --before=<url> --after=<url> --page=/path [--page=/other] --out=<dir> [--login-before=<path>] [--login-after=<path>]

`--login-*` opens a path on that side first, for example a one-time login link. `--chromium=<path>` uses another Chromium binary.

## Read it

1. Open `SUMMARY.md`. **Check first** lists a page that did not load as asked: an HTTP error, or a redirect (to `/user/login`
   means the side was not logged in). The views then describe that other page.
2. The table gives `same`, or `+added −removed` lines with a link to the diff. In a diff, `-` lines are Before only and `+` lines
   After only; indentation shows where in the tree a node is.
3. **ID references that do not resolve** lists broken and ambiguous references, marked new in After, gone in After, or on both sides.
4. The full views are in `before/` and `after/`.

Hostnames, tokens, Drupal's random id suffixes (`--` and 11 characters), random hexadecimal ids (CKEditor 5) and content dates are
normalised away, so what remains is the change. A changed line is evidence, not a verdict: it is often the fix itself.

To see the same things in a browser: Chrome or Edge DevTools > Elements > **Accessibility** pane (tick "Enable full-page
accessibility tree" for the whole tree); Firefox DevTools > **Accessibility**; Safari Web Inspector > Elements > Node >
**Accessibility**. From the viewer, open each side on its own first ("Open outside this tool": **Before patch**, **After patch**).

## How the speech view is made

Guidepup runs on jsdom, which has no layout and applies no stylesheets. So before taking a copy of the page, the tool asks
Chromium which elements it does not render (`display: none`, `visibility: hidden`, the content of a closed `<details>`, ...) and
marks them hidden in the copy; an element with the `hidden` attribute that CSS shows anyway is marked shown. Text hidden only
visually (Drupal's `visually-hidden` class) is still spoken, as it is by a screen reader. jsdom then gets no CSS at all: the marks
say what is rendered.

## First use: #3619154, MR !16911 at `175e6f17`

[validation/2026-10-19-scratch-tree-diff](../reports/issues/3619154/validation/2026-10-19-scratch-tree-diff/README.md), on
throwaway sites (not DDEV): on `/node/1/edit` and `/node/add/article`, at 1280 and 480 pixels wide, the only differences are the
MR's own. The sidebar toggle changes from `<a role="button">` named "Hide sidebar panel" / "Show sidebar panel" to a native
`<button>` named "Sidebar panel" whose state is in `aria-expanded` alone, and the close button becomes a `<button>` with
`aria-controls` at the top of the sidebar. Every other line of all three views is identical.

## Limits

- Each page as it loads. States reached by clicking (an open dialog, an expanded menu, an error after Save) need the issue's
  evaluator or the viewer.
- Chromium only. Firefox and Safari build their own trees, and NVDA, JAWS, VoiceOver and TalkBack each add their own behaviour.
  Guidepup is a model of a screen reader, which is enough for comparing a change by decision (docs/TESTING-TOOLS.md).
- No view reads inside iframes; the ARIA and speech views do not read shadow DOM either (the accessibility tree does).
- About 30 KB of text per page and side; the ARIA view is the largest.
