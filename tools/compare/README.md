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

Controls: **Compare upstream with** (variant), **Page**, **Go (both)**,
**Log in both as admin**, **Site theme** (Light / Dark / Follow OS),
**Frame width** (Half / Phone / Tablet), **Sync scrolling**, **Sync navigation**,
**Simulate a dark-mode OS**, **Mirror clicks and typing**.

- Site theme sets or clears the Default Admin `dark-mode` class on `<html>`. Follow
  OS uses the real or simulated OS preference.
- Simulate a dark-mode OS rewrites `prefers-color-scheme` media rules in both
  frames and makes `matchMedia` report dark, so the theme's scripts see it too.
  It is a simulation; confirm a real result by switching the OS to dark.
- Each site is reached through a small proxy on `before.localhost:8101` /
  `after.localhost:8102`. Separate hostnames keep the two admin sessions apart
  (cookies are scoped by host, not port), the proxy strips framing headers and
  injects the sync script. The sites themselves are unchanged.

## Steps, expected result and checks
Each variant in `variants.json` can carry `steps` (each tagged `recipe`, `mirror` or
`each`, with an optional `lookFor`), `expected`, `actual`, `setup`, and `checks`.
The viewer shows them above the frames so a newcomer knows what correct looks like.

**Run checks** evaluates each check's `probe` (a JS expression) inside both frames and
shows Pass or Fail against `expect` (a value, or `"same"` meaning it must equal the
other side). Kinds: `precondition` (did you reach the right state?), `fix` (should
differ between Before and After), `regression` (should pass on both). For #3619127:
setup reached, sidebar open, focus in the URL alias field, saved preference not
overwritten, no JavaScript errors, same number of open details sections.
The harmless "ResizeObserver loop" browser notice is ignored in the error count.

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

## Mirror clicks and typing
Repeats your real clicks, typed text, checkboxes, radios and selects from either
frame in the other, to save setup time. Verified: typing in the Title field and
collapsing a details section both appeared in the other frame.

- Only trusted user events are captured, so replayed events never loop.
- It does **not** mirror Tab, Enter or focus. Script-generated key events do not
  move focus or type, and the replayed side never gets real focus (no
  `:focus-visible`). Do the keyboard and focus checks in each frame yourself:
  that is the thing being tested, and a mirror would hide a difference.
- If the matching element is missing on the other side, the page says so
  ("Not mirrored: ... The two sides have diverged here"). That is a finding.
- Elements are matched by stable `id`, else by structural position. Rich widgets
  (CKEditor, autocomplete, file upload) are untested.

## Diff report

    node tools/compare/diff.mjs [slug]

Logs in to both sites, fetches each page in `pages` and every local CSS/JS file
it references, normalises per-site noise (hostnames, form tokens, random ids,
cache-busting query strings, drupal-settings JSON, aggregate file names) and
writes `reports/issues/<nid>/compare/<slug>/SUMMARY.md` plus one `.diff` per
changed file. For #3619127 it reports 1 of 336 items different: `sidebar.js`.

## Add a comparison
Add an entry to `variants.json`: slug, issue number, label, description,
`before.env`, `after.env` (+ `patches` applied, for the record), `pages`,
`login`, optional `demo` (`start`, `viewport`).

## Limits
- Compares served HTML/CSS/JS and shows behaviour. It does not replace a
  keyboard and screen-reader test.
- Only the first variant's environments are proxied at a time (the page switches
  variants, but each variant's envs must be running).
- Tested in Chrome (the in-app browser). Frames use `SameSite=None; Secure`
  cookies on `*.localhost`; other browsers are untested.
- Typing into the frames (for example reproducing the error-link flow) was not
  exercised through the viewer yet.
- `drupal-compare.ddev.site` is not set up; the viewer runs on `localhost:8100`.
