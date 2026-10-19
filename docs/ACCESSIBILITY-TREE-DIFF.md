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

Install once: `cd tools/playwright && npm install && npx playwright install chromium` (`node scripts/doctor.mjs` checks it).

**Local DDEV**, with the variant's two sites running (for example after `node scripts/test-mr.mjs 3619154`):

    node tools/playwright/tree-diff.mjs 3619154                      # the issue's variant, its pages, 1280x900
    node tools/playwright/tree-diff.mjs 3619154-latest --page=/node/add/article --viewport=480x900

It logs in with one-time links when the variant has `"login": true`, refuses to run when a side is not what the variant says (the
same check as the evaluators), and writes `reports/issues/<nid>/tree-diff/<slug>/` (`<slug>-<WxH>` for another viewport). Each run
replaces the last one in that folder; git keeps the history.

**DDEV Coder**: the same commands in the workspace's terminal. Chromium there may need its system libraries:
`cd tools/playwright && npx playwright install --with-deps chromium`. Status: not yet run in a Coder workspace (2026-10-19); it uses
the same headless Chromium and site addresses (`https://<project>.ddev.site`, at DDEV's router port) as the evaluators.

**Any two sites**, as they are (no DDEV, no variant):

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
