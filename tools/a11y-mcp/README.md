# tools/a11y-mcp — accessibly evaluating the state a person reached

Short operator guide. The design and the limits are in [docs/DYNAMIC-A11Y-CHECKPOINTS.md](../../docs/DYNAMIC-A11Y-CHECKPOINTS.md).

Playwright MCP is configured (`.mcp.json`) to load this integration into every tab. An agent that drives the browser
with MCP can then capture a **named checkpoint** at a meaningful state, and the scan runs on the page the MCP already
has open — no reload, no second browser, no lost state.

## From a Playwright MCP session

Call the approved helper through `browser_evaluate` on the page (never `browser_run_code_unsafe`):

```js
window.__labA11y.helper()                       // usage notes
window.__labA11y.checkpoint({
  id: "image-dialog-open",                      // lower-case id, unique on this side of the session
  label: "CKEditor image dialog open",
  profile: "full",                              // quick | semantic | visual | dynamic | multi-engine | full
  readiness: { selector: "[role=dialog], .ck-dialog", timeoutMs: 15000 },
  scope: "[role=dialog], .ck-dialog"            // optional component scope
})
```

Read-only probes, when you need one fact instead of a full checkpoint: `state()`, `focus()`,
`visual({ selector })`, `speech()`, `journal()`. `engines()`, `session()` and `finish()` report capabilities,
provenance and close the session. Every action returns a compact summary; the full evidence stays on disk.

Before exploring, name the session (optional but recommended, and required when an environment is shared by several
variants):

```
node tools/a11y-mcp/cli.mjs session --variant 3534229-pinned --scenario ckeditor-toolbar --profile full
```

Clear it afterwards with `node tools/a11y-mcp/cli.mjs session --clear`.

## From a terminal

```
node tools/a11y-mcp/cli.mjs verify                  # is .mcp.json wired up? (no browser)
node tools/a11y-mcp/cli.mjs engines                 # declared engines and their capabilities
node tools/a11y-mcp/cli.mjs list                    # checkpoint sessions in reports/ and .lab-cache/
node tools/a11y-mcp/cli.mjs check <session-dir>     # record completeness and consistency (no browser)
node tools/a11y-mcp/cli.mjs report <session-dir>    # regenerate SUMMARY.md + report.html from the JSON
node tools/a11y-mcp/cli.mjs compare <session-dir>   # equivalence first, then Before/After classifications
```

A session folder (under `reports/issues/<nid>/checkpoints/` for a Lab variant, or `.lab-cache/a11y-mcp/` for a local
fixture) holds `session.json`, `checkpoints/*.json`, `evidence/`, `SUMMARY.md` and `report.html`. The JSON is canonical.

## Live Drupal Before/After verification

```
node tools/compare/setup.mjs 3419891-pinned        # once, if the pair is not built
node scripts/lab-env.mjs start 3419891-pinned      # both sites + viewer
node tools/a11y-mcp/verify-live.mjs --slug=3419891-pinned --route=/node/add/page
```

It logs in with the one-time link (never printed or written), opens the CKEditor page on each side, captures
`editor-initialized`, `toolbar-item-focused`, `dropdown-open`, `balloon-open` and `focus-restored` checkpoints, and
compares Before/After only after equivalence is checked. Evidence goes to `reports/infrastructure/a11y-mcp/`.

## Which code is where

| Path | What |
|---|---|
| `init-page.cjs` | the `--init-page` entry point (CommonJS; the MCP server `require()`s it) |
| `mcp-client.mjs` | a minimal MCP stdio client for the lab's tools and tests |
| `cli.mjs` | session, engines, verify, list, check, report, compare |
| `verify-live.mjs` | the live Drupal Before/After run |
| `../playwright/lib/a11y/capture.mjs` | readiness, state, engines, collectors, evidence, the checkpoint record |
| `../playwright/lib/a11y/page-helper.js` | the approved in-page helper (`window.__labA11y`) |
| `../playwright/lib/a11y/mcp-hook.mjs` | the Node side of the MCP hook: binding, observers, provenance |
| `../playwright/lib/a11y/engines.mjs` | the scanner capability interface and profiles |
| `../playwright/lib/a11y/checkpoint.mjs`, `findings.mjs`, `report.mjs`, `store.mjs`, `context.mjs` | records, dedupe/classification, reports, sessions, provenance |
| `scenarios/` + `../playwright/scenario-run.mjs` | explore once, replay deterministically Before/After |

Security, licences and what is *not* verified: `docs/DYNAMIC-A11Y-CHECKPOINTS.md`. Results are DRAFT until a person
reviews them; no AI observation is a human accessibility review.
