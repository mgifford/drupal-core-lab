# tools/playwright: scripted, replayable walkthroughs

Complements the live viewer (`tools/compare`): a person drives the viewer; these scripts replay the
same steps with **trusted input** (Playwright clicks and key presses), run axe-core at the key
moments, record what assistive technology would be given, and write the result to
`reports/issues/<nid>/`. Local development only.

## Install (once)
    cd tools/playwright
    npm install
    npx playwright install chromium        # large download (the browser)

## Run (both DDEV sites must be running; see ../compare/README.md)
    node tools/playwright/walkthrough.mjs 3619127-pinned     # steps 6 to 10, mouse and keyboard-only, axe at each stage
    node tools/playwright/screenreader.mjs 3619127-pinned    # Guidepup virtual screen reader: what is announced

Login uses the one-time link from `ddev drupal login`, not a typed password.

| Script | Output | What it shows |
|---|---|---|
| `walkthrough.mjs` | `reports/issues/<nid>/playwright/<time>/SUMMARY.md`, `results.json`, screenshots | Old version fails the fix checks, new passes; regression checks unchanged; axe counts; the field's accessibility tree. Exit code 2 if anything is not as expected. |
| `frameload.mjs` | prints load times | How long both viewer frames take to load over N reloads in a real browser. Run it when frames sometimes do not load (see `../../docs/FRAME-LOADING-2026-10-01.md`). |
| `screenreader.mjs` | `reports/issues/<nid>/screenreader/<time>/SUMMARY.md` | Phrases from `@guidepup/virtual-screen-reader` over a jsdom snapshot, before vs after. |

`flow.mjs` holds the shared steps. The selectors are specific to #3619127; copy and adapt for another issue.

## Playwright MCP
`@playwright/mcp` is installed here, and `../../.mcp.json` registers it for this project only
(it does not touch your global Claude settings). Start Claude Code from the lab root and approve the
`playwright` server when asked. It lets an agent drive a browser step by step and describe what it
sees, which is useful for documenting a new walkthrough before turning it into a script like the ones above.

See `../../docs/TESTING-TOOLS.md` for how this fits with axe-core, the viewer and Accessibility Insights.

## Limits
- The virtual screen reader documents semantics (name, role, state, description) on a DOM snapshot with no
  layout engine. It is **not** VoiceOver or NVDA. Decision (2026-10-01): the synthetic Guidepup run is enough for
  comparing a change, and no real screen reader pass is planned for now. Real VoiceOver via Guidepup would need
  system permissions that only the user can grant.
- Automated checks find a subset of problems and are a DRAFT until a person has tested with a keyboard
  and a screen reader.
