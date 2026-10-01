# Tooling Roadmap — executable work orders

Each numbered item is a self-contained work order sized for one session
(S ≈ under an hour, M ≈ one focused session, L = needs a spec session
first). They are written so a smaller/cheaper LLM can implement them
without re-deriving context. **Executor: read this header + your one item +
[SETUP.md](SETUP.md) — nothing else unless the item says so.**

## Rules for every implementer

1. **One item per session.** Do not start a second item.
2. **Never run two Playwright invocations at once** — global setup wipes
   the in-progress crawl's shard dir. `--list` is safe; test runs are not.
3. **Verify before claiming done** — every item has a Verify block. If you
   cannot run it, say exactly what is unverified.
4. Reports scripts honor `A11Y_REPORTS_DIR` — test against a scratch copy,
   never against the real `reports/` tree.
5. Node ≥ 22, plain CommonJS in `scripts/` (match neighbors), TypeScript in
   `tests/` and `lib/`. Match surrounding code style; no new dependencies
   unless the item lists them.
6. Existing building blocks (reuse, do not reinvent):
   - `core/tests/playwright/tests/a11y-axe-crawl.spec.ts` — `scanRoute()`,
     `collectPageMetrics()`, `ensurePageReadyForScan()`, `writeResultShard()`
   - `core/tests/playwright/lib/crawl-finalize.ts` — `drush()`, `TEMP_DIR`,
     `captureOriginalSettingsOnce()`, globalTeardown merge
   - `core/tests/playwright/lib/pages.ts` — `PageEntry { name, path,
     requiresAuth, viewport?, expectedStatus? }`, `anonymousPages`, `adminPages`
   - `core/tests/playwright/scripts/lib/axe-results-store.js` —
     `loadAxeResults(file)` returns the flat record array
   - `core/tests/playwright/scripts/lib/render-markdown-report.js` —
     `renderMarkdownReport({title, description, markdown, sourceLabel})` → HTML
   - Record shape (see `AxeResultRecord` in the crawl spec): `{ theme, page,
     path, viewport, screen, colorScheme, accentPreset?, language?,
     direction?, timestamp, violations[], incomplete[], pageMetrics?, axTree? }`
7. Commit message: imperative summary + short body + the standard
   AI-assistance disclosure lines used in this repo's history.

---

## Done (reference implementations to imitate)

- ✅ WSG page checks batch 1 — see `collectPageMetrics()` (`wsg` field) and
  the "WSG Checks" section of `analyze-sustainability.js`.
- ✅ AX-tree snapshots — `ariaSnapshot()` capture in `scanRoute()`,
  `writeAxTrees()` in `analyze-sustainability.js` → `reports/ax-tree/latest/`.
- ✅ Known-issues sync v1 — `scripts/sync-known-issues.js`
  (`npm run a11y:known-issues`), d.o api-d7 fetch + keyword matcher +
  draft comments.

---

## 1. Focus-indicator & tab-order walker ([#25](https://github.com/mgifford/drupal-core/issues/25)) — M

**Goal:** detect missing/weak focus indicators (WCAG 2.4.7 — axe cannot),
focus traps, focus loss, and tab/DOM order divergence, per page.

**Read first:** `core/tests/playwright/tests/a11y-keyboard-review.spec.ts`
(existing partial keyboard review — extend its patterns, don't duplicate);
`lib/pages.ts`; how `a11y-lighthouse.spec.ts` structures a secondary spec.

**Files:** new `core/tests/playwright/tests/a11y-focus-walk.spec.ts`;
new npm script `a11y:focus-walk` in root `package.json`.

**Algorithm per page (desktop viewport, Claro + Default Admin, logged in):**

```ts
// Inside test(): page loaded via ensurePageReadyForScan-like waits.
const stops: FocusStop[] = [];
await page.keyboard.press('Tab');
for (let i = 0; i < MAX_STOPS /* 150 */; i++) {
  const stop = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return null;
    const focused = getComputedStyle(el);
    // Snapshot the properties that can express a focus indicator.
    const pick = (s: CSSStyleDeclaration) => ({
      outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth,
      outlineColor: s.outlineColor, boxShadow: s.boxShadow,
      backgroundColor: s.backgroundColor, borderColor: s.borderColor,
      textDecorationLine: s.textDecorationLine,
    });
    const focusedStyles = pick(focused);
    el.blur();                       // compare against unfocused state
    const blurred = pick(getComputedStyle(el));
    (el as HTMLElement).focus();     // restore before continuing
    const r = el.getBoundingClientRect();
    return {
      selector: el.tagName.toLowerCase()
        + (el.id ? `#${el.id}` : '')
        + (el.className && typeof el.className === 'string'
            ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''),
      name: (el as HTMLElement).innerText?.trim().slice(0, 60)
        || el.getAttribute('aria-label') || '',
      visible: r.width > 0 && r.height > 0,
      focusedStyles, blurredStyles: blurred,
      rectTop: r.top, rectLeft: r.left,
    };
  });
  if (stop) stops.push(stop);
  await page.keyboard.press('Tab');
  // Loop detection: activeElement matches an earlier stop's selector AND
  // we've advanced fewer than 3 new stops since → record potential trap, break.
}
```

Findings to emit per page:
- `no-visible-indicator`: `focusedStyles` deep-equals `blurredStyles`.
- `weak-indicator`: only difference is outline and
  `outlineStyle === 'none'` or `outlineWidth === '0px'`.
- `indicator-contrast`: parse `outlineColor`/`boxShadow` color vs
  `backgroundColor`; WCAG relative-luminance contrast < 3:1. Use the
  standard formula (https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio) —
  ~20 lines; do not add a dependency.
- `focus-trap`: loop detected before the page's focusables are exhausted.
- `dom-order-divergence`: stops sorted by (rectTop, rectLeft) differ from
  visit order by more than 2 positions anywhere.

**Output:** `reports/focus-walk-latest.json`
`{ generatedAt, pages: [{ theme, path, stops: n, findings: [{type, selector, name, detail}] }] }`
plus a markdown summary `reports/FOCUS-WALK-latest.md` via
`renderMarkdownReport` (imitate `analyze-sustainability.js` output section).

**Verify:** run against 2 pages only first
(`--grep "User login"`), confirm JSON structure; then
`/dialog` and `/dropbutton` (theming_tools) should produce stops > 5 each.
Calibrate against item 3's fixtures when both exist.

**Pitfalls:** `el.blur()` inside `page.evaluate` runs in-page — do NOT use
Playwright's `locator.blur()` per stop (30× slower). Elements that move on
focus (sticky headers) can produce false `dom-order-divergence` — compare
positions captured in the same pass only. Skip `visible: false` stops in
indicator findings (skip-links are legitimately offscreen until focused —
check `visible` AFTER focus, not before).

---

## 2. Component-state crawler on theming_tools fixtures ([#26](https://github.com/mgifford/drupal-core/issues/26)) — M

**Goal:** axe + `ariaSnapshot()` on component *states* the static crawl
never sees.

**Files:** new `core/tests/playwright/tests/a11y-component-states.spec.ts`;
npm script `a11y:component-states`.

**State table (start with exactly these six; add more later):**

| Route | Reach the state | Wait for |
| :--- | :--- | :--- |
| `/dialog` | click the dialog-opening button | `[role="dialog"]` visible |
| `/dropbutton` | click `.dropbutton__toggle` | expanded list visible |
| `/autocomplete` | type `a` into the input | `[role="listbox"] [role="option"]` |
| `/tabs` | focus first tab, press `ArrowRight` | second tab `aria-selected="true"` |
| `/contact/textform` | submit empty required form | `[role="alert"], .messages--error` |
| `/tabledrag` | `keyboard.down('Space')` on a drag handle | drag state class on row |

For each: navigate (logged in, Default Admin theme via
`switchTheme`-style drush calls — import `drush` from
`../lib/crawl-finalize`), drive the state, then:

```ts
const axe = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
const tree = await page.locator('body').ariaSnapshot();
records.push({ route, state: stateName, violations: axe.violations, axTree: tree });
```

**Output:** `reports/component-states-latest.json` + a markdown section
listing per-state violations *not present in the same page's resting-state
scan* (diff against the same route's canonical record in
`reports/axe-results.json` via `loadAxeResults`).

**Verify:** every state must produce ≥ 1 record and the dialog state's
ariaSnapshot must contain `dialog`. If a selector in the state table is
wrong (likely — verify against the live fixture pages first with
`curl -sk <route>` or a quick `--headed` run), fix the table, not the
harness.

**Pitfall:** the exact toggle selectors above are *educated guesses* —
step one of this task is opening each theming_tools route and recording
the real selectors into the state table.

---

## 3. Calibration harness on a11y-meta-skills fixtures ([#27](https://github.com/mgifford/drupal-core/issues/27)) — S/M

**Goal:** recall/precision score for every checker, against labeled fixtures.

**Source:** `git clone --depth 1 https://github.com/zivtech/a11y-meta-skills`
→ `evals/suites/a11y-critic/fixtures/*.md`. Each fixture is a markdown file
containing an HTML snippet and a description of the planted bug(s); names
encode the bug (`popover-no-focus-management.md`,
`checkbox-group-no-fieldset.md`, `modal-complete-clean.md` = clean control).

**Files:** new `core/tests/playwright/scripts/calibrate-checkers.js`;
fixtures vendored under `core/tests/playwright/calibration/` (extract just
the HTML blocks + a `labels.json` you write by reading each fixture once:
`{ fixture: "popover-no-focus-management", expect: ["focus-management"] }`).

**Method:** serve each HTML snippet via a data: URL or a tiny
`http.createServer`, run the checker under test (axe via
`@axe-core/playwright`, focus walker when it exists), record which fixtures
each checker flags; compute per-checker recall (found/planted) and
precision proxy (flags on `-clean` fixtures = false positives).

**Output:** `reports/CALIBRATION-latest.md` — one row per checker × fixture
class. **Verify:** axe alone should catch `checkbox-group-no-fieldset` and
miss `popover-no-focus-management` (that asymmetry existing is the whole
point — if axe catches everything, the labels are wrong).

---

## 4. Virtual screen reader journeys (Guidepup) ([#28](https://github.com/mgifford/drupal-core/issues/28)) — L: SPEC SESSION FIRST

Do **not** hand this to a small model cold. The spec session must read:
- https://github.com/guidepup/virtual-screen-reader (DOM-based, CI-safe)
- https://github.com/guidepup/guidepup-playwright (REAL screen readers —
  probably not what we want in CI; decide explicitly)
- `USER-STORIES.md` stories 1.1, 1.4, 2.2

and produce: the assertion format (expected announcement sequences with
tolerance rules), how the virtual SR attaches to a Playwright page (likely
via jsdom on captured HTML, or in-page bundling — this is the open design
question), and a 3-story proof plan. Only then implement.

---

## 5. WSG STAR batch 2 ([#29](https://github.com/mgifford/drupal-core/issues/29)) — M

Three independent checks; land in this order, each is committable alone.

**5a. Unused bytes (coverage API, Chromium-only):** in `scanRoute`, only
when canonical (same condition as `axTree` capture):

```ts
await page.coverage.startJSCoverage({ resetOnNavigation: false });
await page.coverage.startCSSCoverage({ resetOnNavigation: false });
// … must be started BEFORE page.goto — so gate this inside scanRoute
// before navigation, and stop after axe:
const js = await page.coverage.stopJSCoverage();
const css = await page.coverage.stopCSSCoverage();
// per entry: total = text.length; used = sum(ranges end-start);
// aggregate per URL → { url, totalBytes, usedBytes }
```

Docs: https://playwright.dev/docs/api/class-coverage. Add
`coverage?: { url, totalBytes, usedBytes }[]` to `PageMetrics`; analyzer
reports the 10 worst bundles by unused % (only same-origin, > 10 KB).

**5b. No-JS smoke:** new small spec `tests/a11y-nojs-smoke.spec.ts` —
`test.use({ javaScriptEnabled: false })`, anonymous pages only, assert
`main` (or `[role="main"]`) has > 200 chars of text and at least one link.
Failures list per page → markdown section.

**5c. Minification heuristic:** in `analyze-sustainability.js`, for each
distinct same-origin `.js`/`.css` URL in `byType` data… URLs aren't stored
per-resource today — simplest: fetch the page's asset URLs live via one
Playwright-free pass: `curl` the canonical HTML, extract
`<script src>`/`<link rel=stylesheet href>`, `curl` each asset, flag when
`(newlines / bytes) > 0.01` on files > 5 KB. Skip when site unreachable.

**Verify each:** 5a — coverage entries present for canonical records after
a 1-page smoke (wait for no crawl running!); 5b — spec passes on Olivero
home; 5c — Drupal's aggregated assets should all pass (they're minified);
un-aggregated dev mode should flag.

---

## 6. Warm-cache second-visit metrics ([#30](https://github.com/mgifford/drupal-core/issues/30)) — S

In `scanRoute`, canonical scans only, after axe:
`await page.reload({ waitUntil: 'domcontentloaded' })` then run
`collectPageMetrics(page)` again → `warmMetrics` field (same `PageMetrics`
type). **Caveat to handle:** Resource Timing buffer accumulates across the
reload — call `performance.clearResourceTimings()` (in-page) *before* the
reload so the second collection measures only the warm visit. Analyzer:
"Cache effectiveness" section — median cold vs warm transfer per theme,
flag pages whose warm transfer > 50% of cold (should be mostly cached).
**Verify:** warm ≪ cold for `/` on Olivero (page cache on).

---

## 7. Main-thread CPU time per page ([#31](https://github.com/mgifford/drupal-core/issues/31)) — M

Canonical scans only:

```ts
const cdp = await page.context().newCDPSession(page);
await cdp.send('Performance.enable');            // before goto
// after ensurePageReadyForScan:
const { metrics } = await cdp.send('Performance.getMetrics');
const get = (n: string) => metrics.find((m) => m.name === n)?.value ?? null;
// TaskDuration (total main-thread task seconds), ScriptDuration,
// LayoutDuration, RecalcStyleDuration
```

Add `cpu?: { taskSeconds, scriptSeconds, layoutSeconds }` to `PageMetrics`;
analyzer + history + a "heaviest CPU pages" table. Docs:
https://chromedevtools.github.io/devtools-protocol/tot/Performance/.
**Pitfall:** metrics are cumulative per renderer — read once per scan,
fresh context per test makes that safe here.

---

## 8. WCAG SC coverage matrix ([#32](https://github.com/mgifford/drupal-core/issues/32)) — S

New `scripts/generate-wcag-coverage.js` → `WCAG-COVERAGE.md`.
Sources: (1) `require('axe-core').getRules()` — tags like `wcag143` map
rule→SC (same decoding as `classifyRule()` in `analyze-patterns.js` —
copy that logic); (2) a hand-written map in the script for our custom
checks (`label-in-name contract → 2.5.3`, `focus walker → 2.4.7` when
landed…); (3) the full WCAG 2.2 A/AA SC list — hardcode it (55 entries,
from https://www.w3.org/TR/WCAG22/); do NOT fetch at runtime.
Output columns: SC | Level | axe rules | custom checks | verdict
(`automated` / `partial` / `manual-only`). **Verify:** 1.4.3 = automated,
2.4.7 = manual-only until item 1 lands, 1.3.3 = manual-only.

---

## 9. AX-tree diff gate ([#33](https://github.com/mgifford/drupal-core/issues/33)) — S (needs 2 scans of data)

New `scripts/diff-ax-trees.js`: compare working-tree
`reports/ax-tree/latest/*.yml` against `git show HEAD:<same path>`
(`execSync`, handle file-not-in-HEAD = new page). Report per file: added/
removed/changed lines that contain `name:`/role tokens. Output section
appended to the pattern report or standalone
`reports/AX-DIFF-latest.md`. **First:** confirm the crawl actually
produced `.yml` files (the `ariaSnapshot()` call is committed but its
first real run's output must be sanity-checked — if empty, debug capture
before building diff).

---

## Nightly pipeline & OpenACR (design: [NIGHTLY-PIPELINE.md](NIGHTLY-PIPELINE.md))

### 10. Nightly orchestrator + coreCommit stamping ([#34](https://github.com/mgifford/drupal-core/issues/34)) — M
Add `coreCommit: execSync('git rev-parse HEAD')` to BOTH analyzers'
summary blocks first (tiny, separate commit). Then `scripts/nightly.sh`
per the design doc §2 — plain bash, `set -euo pipefail`, every step logged
to `logs/nightly-YYYY-MM-DD.log`, abort-not-publish when record count
< 90% of previous run (read both manifests' `totalRecords`).

### 11. New-pattern attribution ([#35](https://github.com/mgifford/drupal-core/issues/35)) — M
`scripts/attribute-new-patterns.js` per design doc §3. v1 = file-match +
window only (no bisect). Inputs: two dated `bugs-*.json` + their
`coreCommit`s. Commit-subject parsing: `/^Issue #(\d+) by ([^:]+):/`.
Confidence enum: `file-match | window`. Never emit an author name at
`window` confidence.

### 12. Drupal CMS parallel profile ([#36](https://github.com/mgifford/drupal-core/issues/36)) — M
`SITE_PROFILE=cms` env → conditionally import `lib/pages-cms.ts` +
`lib/theme-configs-cms.ts` in the crawl spec; ALL scripts take the
namespace via `A11Y_REPORTS_DIR=reports/cms`. Site setup documented in
SETUP.md §3 gets a CMS subsection. First session: build the second DDEV
site + write the CMS page inventory by walking the installed site;
parameterization is mechanical after that.

### 13. OpenACR generators ([#37](https://github.com/mgifford/drupal-core/issues/37)) — L: SPEC SESSION FIRST
Spec session reading list: https://github.com/gsa/openacr (schema +
CLI validate/output), https://github.com/mgifford/python-acr (align, don't
invent a third format), `NIGHTLY-PIPELINE.md` §5 (determination rules —
they are already decided; the spec session designs the YAML assembly and
attestations file format, not the policy).

### 14. Known-issues reconciliation v2 ([#38](https://github.com/mgifford/drupal-core/issues/38)) — M
Extend `scripts/sync-known-issues.js` (v1 shipped, read it first).
Verified API facts baked into v1: `api-d7/node.json?type=project_issue&
field_project=3060&taxonomy_vocabulary_9=1101` (tid 1101 =
`Accessibility`), status IDs in `OPEN_STATUSES`, 1.5 s politeness delay.
v2 adds: body fetch for match candidates only
(`api-d7/node.json?nid=<nid>` → `body.value`), `openacr/issue-map.json`
maintenance (flag mapped patterns that disappeared = fixed → draft a
"verified fixed by automated scan on <date>" comment), staleness nudges
(> 6 months unchanged).

## Local AI layer — llama.cpp ([#39](https://github.com/mgifford/drupal-core/issues/39))

Server facts: llama.cpp `llama-server` exposes an OpenAI-compatible API
(https://github.com/ggml-org/llama.cpp/tree/master/tools/server);
embeddings via `--embedding` + `POST /v1/embeddings`; structured output via
`json_schema`/GBNF grammar in the request (kills malformed-JSON failure
modes — always use it for extraction).

### 15a. Embedding matcher (S/M) — replace the keyword scorer in
`sync-known-issues.js`: embed issue `title` (v1 cache) or `title+body`
(after 14) and pattern `summary + selector + likely_template`; cache
vectors in `reports/known-issues-embeddings.json` keyed by
`nid + changed` (re-embed only when `changed` moves). Cosine ≥ 0.75 =
candidate (tune against the same synthetic fixture in the v1 commit
message + 20 hand-labeled real pairs). Keep the wcag-tag bonus from v1.
Env: `LLAMA_SERVER_URL` (default `http://localhost:8080`); fall back to
the keyword scorer with a warning when unreachable.
### 15b. Issue quality cards (M) — GBNF/json_schema extraction per known
issue body: `{ statesWcagSc: string|null, hasReproSteps: bool,
namesSelectorOrTemplate: bool, mentionsAssistiveTech: bool }` → drives
targeted nudge-draft variants in the reconciliation report.
### 15c. Content-quality flags (M) — nightly pass over canonical records'
HTML: alt texts matching file-name patterns are rule-detectable (no LLM);
LLM judges the remainder + link text in context + heading descriptiveness.
Output always `needs human review`, never a filed finding.
### 15d. Nightly digest (S) — 5 sentences from the attribution JSON +
trend deltas; template-constrained; part of nightly.sh.
### 15e. Draft prose assist (S) — impact statements into the existing
draft-comment/issue templates; input = the pattern record only; label as
drafted.

**Guardrails for all of 15:** no conformance determinations, no
auto-merge, no auto-posting; each task ships with a calibration accuracy
figure (item 3 harness) before its output feeds anything downstream.

## Session-budget guidance

- One numbered item per query: "do roadmap item N".
- S items can share a session with a report regeneration; M items get the
  session to themselves; items 4 and 13 are spec sessions before code.
- The conclusions from upstream research (d.o API params, llama.cpp
  endpoints, STAR classifications, Playwright APIs) are already baked in
  above — re-research only if something fails.
