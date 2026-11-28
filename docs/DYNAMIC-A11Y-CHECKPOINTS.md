# Dynamic accessibility checkpoints (Playwright MCP)

Accessibility evidence for **the state a person actually reached**, not only for the page as it loads. An agent or a human
explorer drives a Drupal interface with Playwright MCP, records a **named checkpoint** at a meaningful application state,
and gets the same evidence the lab's scripted evaluators produce. The exploration can then be replayed as a deterministic
scenario against Before and After.

This is the design and the operator guide. It is deliberately small: the integration is one Playwright MCP hook, one
approved page helper, and a thin layer over the lab's existing axe code, recorder, accessibility-tree capture and
results layout. It is **not** a second accessibility platform.

- Code: `tools/a11y-mcp/` (entry points, CLI), `tools/playwright/lib/a11y/` (engines, capture, findings, reports).
- Fixtures and negative controls: `tests/fixtures/a11y-mcp/`, `tests/lab/a11y-mcp-*.test.mjs`.
- Scenarios: `scenarios/`, runner `tools/playwright/scenario-run.mjs`.
- Requirement: if `ACCESSIBILITY.md` and this document disagree, `ACCESSIBILITY.md` wins. Results are **DRAFT** until a
  person has reviewed them (`AGENTS.md` rules 2, 8, 10).

## Why not just scan the initial page load

Most real barriers live in states: a menu is only expanded after a click, a dialog only exists when open, an AJAX
response replaces a fragment, a validation error only appears after Save, a focus indicator only disappears under
keyboard focus, an icon only vanishes in forced-colours mode. A page-load scan cannot see any of them, and re-loading the
page cannot reach them. The lab already had the pieces for scripted states (`tools/playwright/evaluate-<nid>.mjs`,
`lib/lab-run.mjs`); this adds the same evidence to **exploratory** sessions driven through Playwright MCP.

## The integration: one browser, no reloads

`.mcp.json` starts Playwright MCP with two options and nothing else:

```json
"playwright": {
  "command": "node",
  "args": [
    "tools/playwright/node_modules/@playwright/mcp/cli.js",
    "--init-page=tools/a11y-mcp/init-page.cjs",
    "--init-script=tools/playwright/lib/a11y/page-helper.js",
    "--output-dir=.lab-cache/a11y-mcp/mcp-output",
    "--redact-url-params=token,key,pass,password,code,signature"
  ]
}
```

- `--init-page` runs in the MCP server's Node process for every tab, **before the first navigation**. It adds the
  approved page helper and the lab's existing interaction recorder (`lib/recorder.mjs`, serialised from the same
  function), exposes one narrow binding, and keeps the AJAX/console observation buffer.
- `--init-script` adds the approved helper to every frame before the page's own scripts, so the agent can call it
  immediately.
- The agent then calls, through `browser_evaluate` on the page it is already on:

  ```js
  window.__labA11y.checkpoint({ id: "image-dialog-open", label: "Image dialog open", profile: "full",
                                readiness: { selector: "[role=dialog], .ck-dialog", timeoutMs: 15000 } })
  ```

  The helper forwards the request over the exposed binding. **The scan runs in Node** with the lab's `@axe-core/playwright`
  code, the accessibility-tree capture and the screenshot code, against the page object Playwright MCP already has open.
  Nothing navigates, reloads, focuses, scrolls, clicks or closes anything.

The two paths in `.mcp.json` are relative to the repository root, exactly as the server command itself already was: a
client must start the server with this checkout as its working directory (Claude Code, Codex and the lab's own tools do).
If the MCP server itself runs inside another OS sandbox (as this GUI's agent does), Chromium cannot nest sandboxes and
cannot write its profile/registry outside the workspace; that host may pass `--no-sandbox --isolated` (as the lab's tests
do). The production `.mcp.json` keeps Chromium's sandbox and the persistent profile.

Why this shape, and what was rejected:

| Option | Verdict |
|---|---|
| `browser_run_code_unsafe` | **Rejected.** It is RCE-equivalent in the MCP server process; the feature must not depend on host-code execution. |
| WebMCP tools registered by the page (`browser_webmcp_call`) | **Not usable in this version.** Playwright MCP 0.0.84 evaluates page-registered WebMCP tools in Playwright's *utility* (isolated) world (`webmcp.ts`, `world: "utility"`), where a `navigator.modelContext` polyfill installed by a page script is invisible. Verified 2026-11-27; `browser_webmcp_list` is also absent from the tool list this server advertises. If a host/client exposes native Chromium WebMCP later, the same page helper could register tools — the scanning path would not change. |
| A companion MCP server connected over CDP | **Not justified.** It would add a second server and a second CDP client for no capability the `--init-page` hook does not already give, and two clients on one browser is fragile. |
| Launching a separate browser and reloading the URL | **Forbidden.** It measures a different state; the requirement and the helper's design both refuse it. |

The agent-facing surface is intentionally tiny:

```js
window.__labA11y.helper()                                   // usage notes
window.__labA11y.checkpoint({ id, label, ...options })      // the scan; returns a compact summary
window.__labA11y.state() / focus() / visual({selector}) / speech() / journal()   // read-only probes
window.__labA11y.engines() / session() / finish()           // capabilities, provenance, close the session
```

`checkpoint()` refuses an unknown option (a typo must not silently produce a smaller scan), refuses an id that was
already captured on the same side, and returns `state-not-reached` (with evidence) when its readiness condition fails —
a missing state is never reported as a clean scan.

Readiness is one of: a selector with a state, `{ networkIdle: true }`, or `{ expression }` — a bounded boolean
expression evaluated in the page by Playwright (no braces, backticks or statements; escaped quotes and non-ASCII labels
are allowed). It is an explicit condition, not a scripting hook and never a sleep.

## Named checkpoints

A checkpoint is one meaningful application state at one moment. Common ids (the CKEditor scenarios use these):

`initial-load`, `editor-initialized`, `toolbar-config-open`, `toolbar-item-focused`, `tooltip-visible`,
`toolbar-item-reordered`, `config-saved`, `dropdown-open`, `image-selected`, `alt-text-balloon-open`,
`media-library-open`, `media-inserted`, `editor-focus-restored`, `dialog-open`, `dialog-dismissed`, `focus-restored`,
`validation-failed`, `ajax-complete`.

Every record (`checkpoints/NNN-<id>.json`, schema `lab-a11y-checkpoint/1`) contains:

| Part | What it records |
|---|---|
| `provenance` | issue, registered Lab variant, Before/After side, core commit, patch content state, source (`playwright-mcp` / `scripted`), MCP version and integration, scenario id |
| `environment` | browser and version, context id, viewport, colour scheme, forced colours, reduced motion, contrast preference (all read from the page's `matchMedia`), actual theme, lang, direction, OS |
| `page` | sanitised path, query parameter **names** (values dropped), title, theme |
| `interaction` | trusted pointer/key events with semantic target descriptions, focus transitions, attributes that changed (expanded/selected/open), and what the recorder saw after each action |
| `focus` | active element with role, name, selector, `:focus-visible`, containing dialog, focus trail; explicitly "read, never moved" |
| `state.readiness` | the explicit condition (selector, boolean expression, network idle), whether it was met, how long it waited, and why it failed |
| `state.application` | open dialogs, details, expanded controls and whether their `aria-controls` resolve, selected/checked, form errors and whether each error message resolves, landmarks, headings, live-region messages, tooltips, tabs, menus, listboxes, CKEditor presence, broken ARIA references, capped visible text |
| `evidence` | per-engine status/version/counts/options/timings and the raw engine file, accessibility tree (three views, kept distinct), visual measurements, screenshots, AJAX commands, console errors, the journal |
| `findings` | normalised findings with engine, rule id, WCAG/ACT mappings, structured target (frame/shadow path preserved), element identity, observed failure, expected behaviour, evidence reference, confidence, review status |
| `manual` | questions for a person raised by this state; always `result: "not-run"`, `requiresPerson: true`, stored separately from automated results |
| `limits` | what this checkpoint did **not** establish |
| `resources` | scan time, engine times, evidence bytes, screenshots; energy is recorded as not measured |

Provenance is **derived, not asserted**: the hook maps the page's hostname to the built environments under `envs/` and
their registered variants, reads the core commit with git, and hashes the patch state. A page whose host is not a Lab
environment and not a loopback fixture is refused (and the refusal is logged in `.lab-cache/a11y-mcp/refusals.jsonl`).

## axe-core first, then other engines

`axes-core` is the default. The shared runner (`tools/playwright/lib/a11y/axe-engine.mjs`) supports whole-page scans,
component scoping (`include`/`exclude` selectors), selected rule sets, WCAG tags, best-practice rules on request, complete
raw output kept next to a compact summary, incomplete/"needs review" results, passed/inapplicable counts, and axe's frame
injection. The compact report keeps at most 10 nodes a rule; the complete raw output is written as evidence, reduced to
rule ids only for `passes`/`inapplicable` when it would exceed 2 MB (and the record says so).

`tools/playwright/lib/lab-run.mjs`'s `axeScan(page)` now takes the same options and keeps its old shape for all existing
evaluators; `axeScanFull(page)` returns the complete `AxeResults`.

The second engine is **HTML_CodeSniffer 2.5.1** (BSD-3-Clause, npm, not vendored). It injects its bundle into the live page,
evaluates the document frame by frame, and returns its own codes; it does not share axe's failure conditions, so its
findings keep `engine.id: "htmlcs"` and their own rule ids, with no invented axe impact level.

The adapter interface (`tools/playwright/lib/a11y/engines.mjs`) requires each engine to declare, before it may run:
live-page support, injected-JavaScript need, navigation need, DOM-snapshot consumption, iframes, shadow DOM, computed
styles, whether it preserves focus/state, component scoping, result kinds, standards and ruleset. `validateAdapter()`
checks the declaration and the tests enforce it. An engine that cannot inspect the page the agent reached is **refused**
for checkpoints and reported as `unsupported` — it is never run against a different page and presented as the same state.

Considered and not integrated (2026-11-27), with the reason:

| Engine | Licence | Why not a live checkpoint engine |
|---|---|---|
| IBM Equal Access `accessibility-checker` | Apache-2.0 | `getCompliance(url)` renders its own page; no API for an existing page. Adapter exists, declares the limit, refuses. |
| Siteimprove Alfa | MIT | `alfa-cli audit <url>` and the library query a URL/document; no existing-page API. |
| QualWeb | ISC (packages) | `evaluate({url})` launches its own navigation. |
| AccessLint | MIT | browser bundle, but the wrappers reload the page. |
| Lighthouse | Apache-2.0 | page-load audit in its own Chrome (already documented in `docs/TESTING-TOOLS.md`). |
| Open Scans | AGPL-3.0 | **Not reusable**: AGPL is not GPL-2.0-compatible and the lab is GPL-2.0-or-later. Reviewed for vocabulary only (observation-vs-disposition, "a silent engine is not a pass") with attribution below. Every engine it wraps is URL-based; it has no live-state capability. |

The fixture engine (`fixture-engine`) exists only for the tests, and is selectable only with an explicit
`allowFixtures` flag that an agent cannot pass.

## Profiles: cheap first

| Profile | Engines and collectors |
|---|---|
| `quick` | axe-core; focus |
| `semantic` | accessibility tree, ARIA after JavaScript, unresolved ID references, landmarks, focus |
| `visual` | computed styles, colours/contrast where measurable, geometry, clipping, occlusion, screenshots, focus |
| `dynamic` | announcements, live regions, AJAX commands, focus transitions, silent changes, console errors |
| `multi-engine` | axe-core + HTML_CodeSniffer; focus |
| `full` | every available engine plus every collector |

A checkpoint selects one profile (or explicit `engines`/`collectors`). Components can be scoped with `scope`, `include`
and `exclude`. Nothing scans on every DOM mutation: checkpoints are named, deliberate states.

## Findings: state-aware, deduplicated, honest about engines

`tools/playwright/lib/a11y/findings.mjs` keeps each finding's engine and rule identifier, normalises its target without
flattening frame/shadow context, normalises site-generated ids out of the selector and HTML (the same random-suffix rules the tree diff uses) so two
builds of the same code do not look different, computes fingerprints with the lab's existing frozen profiles
(`tools/a11y-fingerprints.js`, `a11y/pattern/v1` with `state_key`), and **deduplicates across checkpoints**: the same rule
failing the same element at five states is one finding with five observations. Totals are distinct findings, not
observations.

Classification compares the sides only after equivalence:

`new-regression`, `existing-failure`, `resolved-failure`, `changed-finding`, `state-not-reached`, `not-applicable`,
`tool-error`, `unsupported-capability`, `manual-review-required`.

A finding present on only one side is not "fixed" or "new" when the engine did not run or the state was not reached; the
record says which applies. Engine agreement is not proof, and a single engine is not automatically wrong. Tool errors are
never counted as passes.

## Equivalent Before and After

Comparing two pages because they share a URL is not evidence. `equivalence()` checks: same scenario and checkpoint, same
route, same viewport, colour scheme, forced colours, reduced motion and contrast preference, both sides `captured`, and —
per scenario — the expected state facts (`dialogOpen`, exact state values, minimum counts, visible content, focus). A
Before/After comparison on non-equivalent states is **refused** and the reason is recorded. A failure to reach the
expected state is itself reported.

## Explore first, replay later

Exploration keeps the interaction history and the evidence. The reviewed steps become a scenario file
(`scenarios/`, schema `lab-a11y-scenario/1`) with: stable id, preconditions, fixture identity, initial route, ordered
trusted interactions, named checkpoints, engines, component scope, expected accessibility properties, expected focus and
announcements, regression assertions, reset instructions and manual-review requirements.

    node tools/playwright/scenario-run.mjs scenarios/ckeditor/3419891-alt-text-dialog.json 3419891-pinned --check
    node tools/playwright/scenario-run.mjs scenarios/ckeditor/3419891-alt-text-dialog.json 3419891-pinned

The runner reuses `runArgs` → `launch` → `openSide` from `lib/lab-run.mjs`, so theme, AJAX, announcements, screenshots
and patch-state checks are the same as every other evaluator, then captures the scenario's checkpoints and writes a
`results.json` that keeps the existing run schema. Steps use semantic locators (role + accessible name, label, text,
test id, CSS selector) and explicit readiness conditions; an **MCP element reference (`e12`) is never a locator**.
`evaluate` steps are small read-only expressions for cases the data steps cannot express — not a scripting language and
not a host-execution escape hatch.

`--side=before|after` runs one side only; no comparison is made and the run writes a partial result rather than a
`results.json` that `scripts/coverage.mjs` would count as a complete run.

## Reporting

`tools/playwright/lib/a11y/report.mjs` renders `SUMMARY.md` and one accessible `report.html` from the same canonical
`session.json` + `checkpoints/*.json`: scenario summary, ordered checkpoint inventory, engine-specific results,
deduplicated findings, Before/After comparison with the equivalence checks shown, tree differences, focus transitions,
announcement history, screenshots, reproduction steps, manual requirements and measured resource use. The HTML uses
semantic headings and tables with captions and `scope`, no script, light/dark support and a visible focus style.

    node tools/a11y-mcp/cli.mjs list
    node tools/a11y-mcp/cli.mjs check <session-dir>        # record completeness and consistency, no browser
    node tools/a11y-mcp/cli.mjs report <session-dir>       # regenerate from the JSON
    node tools/a11y-mcp/cli.mjs compare <session-dir>      # equivalence, then classifications

Filtering by checkpoint, component, rule, engine and issue is available through the report options; a filter never hides
the fact that a checkpoint was visited.

## Manual evaluation stays separate

Every checkpoint raises the manual questions its state deserves (meaningful name in context, logical focus order,
recognisable icon, understandable status change, keyboard task completion, repetitive screen-reader output, dialog
context, authoring-tool help, engine needs-review items). They are stored with `result: "not-run"` and
`requiresPerson: true`, outside the automated findings. **No AI observation is an independent human accessibility
review.** The lab's rule applies unchanged: automated results are a draft; a person reviews; the report says so.

## Security and privacy

- Only hosts of environments under `envs/` (built DDEV sites) and loopback fixture origins are accepted. Production sites
  are refused; there is no allow-any-host setting. `lab.config.yml` can switch the integration off
  (`a11y_mcp.enabled`) or loopback fixtures off (`a11y_mcp.fixtures`).
- One binding, four named actions (`checkpoint`, `finish`, `engines`, `session`), strict option validation, capped string
  lengths, no code, no file paths, no selectors beyond a bounded length. Requests from subframes are refused because
  they would describe a different document while claiming the main page's provenance.
- No cookies, storage state, headers, request bodies or query values are recorded. The one-time login link is used and
  never printed or written; checkpoint page paths are sanitised (`/user/reset/...` redacted).
- Page content, tool output and engine messages are untrusted data: they are evidence, never instructions. The lab does
  not publish findings or touch upstream issues automatically.
- The browser is the MCP client's browser. Chromium's sandbox stays enabled in `.mcp.json`; only a test on a host that
  already sandboxes the server adds `--no-sandbox` (documented in the test) because Chromium cannot nest sandboxes.

## Resource honesty

The integration launches no browser (it reuses the MCP one), records engine runs, scan duration, evidence size and
screenshots per session, and records energy as **not measured**. Run a session through `node scripts/resource-run.mjs`
if you want the existing CPU/memory/IO ledger. Do not invent avoided energy or token savings.

## What was verified, and what was not

Verified on this checkout, 2026-11-27 (Chromium 157, `@playwright/mcp` 0.0.84, axe-core 4.14.0, HTML_CodeSniffer 2.5.1):

- `tests/lab/a11y-mcp-integration.test.mjs` — a real MCP server opens a page; a page-load checkpoint sees no defect in a
  closed dialog; a trusted MCP click opens it; the next checkpoint finds `axe-core: button-name` on the live page; and
  `performance.timeOrigin`, the navigation entry count, the open dialog and the focused element are unchanged after the
  scans. Evidence and reports are on disk and the session passes `cli check`.
- `tests/lab/a11y-mcp-negative.test.mjs` — the ten negative controls and their valid counterparts (below), 10/10 passing.
- `tests/lab/a11y-mcp-fixtures.test.mjs` — the hand-written expectations are consistent and offline.
- `tests/lab/a11y-checkpoint|findings|engines|report.test.mjs` — record completeness and provenance, bounded compact
  output, fingerprinting, cross-state deduplication, classifications, equivalence, the adapter interface, manual/automated
  separation, and Markdown/HTML parity.
- `tests/lab/a11y-scenario.test.mjs` — every scenario file validates and `--check` works without a browser or DDEV.
- **Live Drupal**: `reports/infrastructure/a11y-mcp/2026-11-27T21-41-50-live-3419891-pinned/` (README beside it), from
  `tools/a11y-mcp/verify-live.mjs --slug=3419891-pinned --route=/node/add/page` against the running
  `baseline-3419891` / `issue-3419891` pair. Both sides: 5 checkpoints captured (`editor-initialized`,
  `toolbar-item-focused`, `dropdown-open`, `balloon-open`, `focus-restored`), `preserved: true` on every one, 0 errors,
  `unexpected: 0`; all five Before/After pairs equivalent and classified as `existing-failure` (plus
  `manual-review-required`); 10 checkpoints, 49 distinct findings after deduplication, 12 engine runs, 6.4 s scanning,
  2.3 MB evidence, 0 browser launches by the integration. `image-dialog-open` is recorded as skipped: the only image
  toolbar control opens a file chooser, so that state is covered by the scripted evaluator and scenario, not claimed
  here. The run says nothing about whether the #3419891 patch is correct.

Two defects were found by that live work and fixed, which is why earlier runs in the folder are marked superseded:

1. **Site-random ids made identical pages look different.** HTML_CodeSniffer selectors carried Drupal's generated ids
   (`#navigation-link--navigationcreate-1676520538`, `#admin-toolbar__scroll-wrapper-935526640`), so the same finding
   got a different fingerprint on each side and appeared as both a new regression and a resolved failure (14 + 14 in the
   19:11 run). `normaliseSelector()`/`normaliseHtml()` in `findings.mjs` now apply the same random-suffix normalisation
   the tree diff uses; the authoritative run has no false pairs, and a regression test covers it.
2. **A readiness condition can be wrong even when the state is right.** `focus-restored` waited for a balloon CSS class
   that lingers in the DOM, so a state where focus was in fact back in the editor was reported `state-not-reached`. The
   condition now asserts what matters (focus is in the editable, `isContentEditable`/`role=textbox`), and the record
   shows it. A readiness failure is still a result, not a pass — it just has to describe the right thing.

Not verified / out of scope: a real screen reader or a person (every manual check stays `not-run`); Firefox and WebKit
(the MCP browser is Chromium); closed shadow roots; cross-origin frames (reported, not tested); uploads and Media Library
selection in scenarios (no file-input step; the full-flow evaluators remain the tool); the full CKEditor checkpoint list
in exploratory mode beyond the states above.

## Negative controls

`tests/fixtures/a11y-mcp/` holds one self-contained page per control, with expectations written by hand in
`expected.json` **independently of the scanner**:

| Control | The state-dependent defect | What the checkpoint shows that a page-load scan cannot |
|---|---|---|
| `dialog-unnamed-button` | unnamed icon button inside a dialog | `axe-core: button-name` only while the dialog is open |
| `focus-indicator-disappears` | focus outline removed for keyboard focus | computed indicator absent on the focused control |
| `aria-ref-break-after-ajax` | `aria-controls` left pointing at a replaced id | `ariaBrokenRefs` reports the missing id after the replacement |
| `status-without-announcement` | "Saved" appears outside any live region | recorder classifies the change as silent (WCAG 4.1.3 candidate) |
| `modal-no-focus-restore` | focus falls to `<body>` on close | focus trail and active element show no restoration |
| `icon-forced-colors` | `background-image` icon removed in forced colours | visual evidence shows the declaration gone while the valid icon remains |
| `hidden-menu-exposed` | closed menu left rendered with `opacity:0` | menu links remain exposed while `aria-expanded="false"` |
| `error-not-associated` | error text with no `aria-invalid`/`aria-describedby` | the error exists but nothing programmatically relates it |
| `persistent-finding` | unnamed button visible in every state | one distinct finding with several observations, not one per state |
| `valid-controls` | none: named dialog, labelled control, live status, focus restore | no axe finding, no silent status change, focus restored |

`MODAL-NO-FOCUS-RESTORE` and the other fixtures drive nothing over the network. Run them directly:

    node tests/fixtures/a11y-mcp/serve.mjs          # prints the local URL for manual exploration with MCP
    node --test tests/lab/a11y-mcp-negative.test.mjs

## Prior art and licences

- axe-core (MPL-2.0) and `@axe-core/playwright` (MPL-2.0), Playwright (Apache-2.0) are npm dependencies, not vendored.
- HTML_CodeSniffer 2.5.1 (BSD-3-Clause) is a new npm dependency of `tools/playwright`, not vendored.
- Open Scans (AGPL-3.0) was reviewed for prior art only; its code is not copied and its licence is not compatible with
  this repository's (GPL-2.0-or-later). Its useful vocabulary ("observation vs disposition", "a silent engine is never a
  pass", ACT/WCAG mappings as data) informed the design, with this attribution. The fingerprint profiles reused here come
  from `tools/a11y-fingerprints.js` (from `mgifford/ACCESSIBILITY.md`, MIT), not from Open Scans.
- `record-a-goose-sighting` (MIT) and `vital-core` (AGPL-3.0-only) were checked: neither has live-state scanning code to
  reuse; the goose repository is useful as a source of small local defect fixtures, which the negative controls emulate.

Generated with the help of an LLM (DeepSeek Harness). AI-assisted development and evaluation disclosure. A person must
review before anything is reported upstream.

## Lessons from building this (2026-11-27)

- `@playwright/mcp` 0.0.84 evaluates page-registered WebMCP tools in Playwright's utility world, so a page-defined
  `navigator.modelContext` is invisible; `--init-page` (Node, per tab, before navigation) plus one validated binding is
  the working integration, with `browser_evaluate` calling the approved helper.
- `@axe-core/playwright` 4.14 needs a browser context that can open a second page (`browser.newContext()`); the runner
  falls back to axe's legacy mode and records it.
- Site-random ids must be normalised out of selectors and HTML before fingerprinting, or two builds of the same code
  produce false new/resolved findings (the tree diff already has the rules).
- A readiness condition must assert the fact that matters (focus is in the editable), not a CSS class that may linger.
- Scenario variants must be checked against the base branch, not only the shared checkout's working `variants.json`.
- Cross-session coordination in this repo is files in `reports/infrastructure/`; there is no messaging. Work that is
  ready to commit belongs on its own worktree/branch.
- Run the negative-control suite and the real-MCP integration suite separately; a combined run can stall in a worktree.
