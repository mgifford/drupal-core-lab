# First run: from a fresh clone to your first comparison

For someone who has just cloned this repository. About 30 minutes, most of it waiting for Drupal to install. Everything runs on your own
computer; nothing is posted anywhere.

## 1. Install the prerequisites
- [Docker](https://www.docker.com/) (running), [DDEV](https://ddev.com/get-started/) 1.24 or newer, git, Node.js 20 or newer (22.19+ only for the optional Lighthouse panel).
- About 10 GB free disk and 8 GB memory.

## 2. Check your machine
    node scripts/doctor.mjs

It prints PASS, WARN or FAIL with the command that fixes each problem. Fix every FAIL. WARN lines are optional or not needed yet
(for example "environments not built" before your first build).

## 3. Install the helper tools (once)
    cd tools/playwright && npm install && npx playwright install chromium && cd ../..

Only needed for the scripted walkthroughs. The side-by-side viewer works without it (it fetches axe-core itself during setup).

## 4. Pick an issue and build its two sites
The issues that are ready are the `slug`s in `tools/compare/variants.json` (a slug ending `-latest` follows current Drupal `main`; `-pinned` is the exact
core the result was first verified on). For example:

    node tools/compare/setup.mjs 3604037-latest

This clones Drupal core once, makes two copies (Before: core; After: core plus the issue's change), installs both, and applies the issue's
recipe. It takes 10 to 20 minutes and is safe to re-run. If it stops with `ddev-router failed to become ready`, run it again.

## 5. Start everything
    node scripts/lab-env.mjs start 3604037-latest

Open https://drupal-compare.ddev.site (or http://localhost:8100). You see Before and After side by side, with the steps to reproduce above
them. If the page says the sites are still loading, wait: it clears by itself. Sites log in as `admin` / `admin`.

## 6. Do the test
Press **Log in both as admin**, then follow the numbered steps. Steps the recipe already did are ticked. Press **Run checks** at the end; a
green banner means the old version fails where the fix applies, the new one passes, and nothing else changed. `docs/USER-GUIDE.md` explains every
control, including the optional accessibility and Lighthouse panels (off until you turn them on).

## 7. Keep your results
Write what you found in `reports/issues/<nid>/` (see `AGENTS.md`, "Where results go"). A scripted replay with real input:

    node tools/playwright/walkthrough.mjs 3619127-pinned      # specific to #3619127 today

## 8. Stop (nothing is lost) or free the disk
    node scripts/lab-env.mjs stop 3604037-latest
    node scripts/lab-env.mjs delete 3604037-latest --yes      # removes the two sites and their disk use; the reports stay

## If something goes wrong
Run `node scripts/doctor.mjs <slug>` first, then look at the pitfalls table in `AGENTS.md`.

## Your own issue
`node scripts/new-issue.mjs <nid> --branch <fork-branch>` scaffolds everything; `docs/NEW-ISSUE.md` walks through it.
