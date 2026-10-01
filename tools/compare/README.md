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
**Simulate a dark-mode OS**.

- Site theme sets or clears the Default Admin `dark-mode` class on `<html>`. Follow
  OS uses the real or simulated OS preference.
- Simulate a dark-mode OS rewrites `prefers-color-scheme` media rules in both
  frames and makes `matchMedia` report dark, so the theme's scripts see it too.
  It is a simulation; confirm a real result by switching the OS to dark.
- Each site is reached through a small proxy on `before.localhost:8101` /
  `after.localhost:8102`. Separate hostnames keep the two admin sessions apart
  (cookies are scoped by host, not port), the proxy strips framing headers and
  injects the sync script. The sites themselves are unchanged.

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
