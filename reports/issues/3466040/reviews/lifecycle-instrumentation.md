# Lifecycle instrumentation for #3466040 (ResizeObserver callback counts, autoResize executions, console errors)

**DRAFT — method note, not evidence.** Page-level instrumentation only: no patch change, no file in an
environment changed, no server-side code. The counters observe what the browser does; they do not make
the dialog behave differently.

- Evaluator: [`../../../tools/playwright/evaluate-3466040.mjs`](../../../tools/playwright/evaluate-3466040.mjs)
  (installed by `installCapture()` / `CAPTURE_INIT`, always on)
- Harness plan: [`harness-plan.md`](harness-plan.md)
- Source reviews whose "NEEDS RUNTIME CHECK" items this answers:
  [`code-review.md`](code-review.md) (F1 accumulation, F3 echo/loop, F5 leaked observer) and
  [`test-review.md`](test-review.md)

## Why a separate counter

The patch adds a `ResizeObserver` to `dialog.position.js`, whose callback calls the existing debounced
`autoResize`. A run can therefore show three different things that a screenshot cannot separate:

1. the geometry changed (the user-facing fix), 2. *why* it changed (observer fired → `autoResize` ran),
and 3. whether the change was benign (no loop, no console errors, observer disconnected on close).
Without instrumentation, "the dialog fits now" could be caused by anything, and a fix that leaks an
observer or loops would look like a success. The counters make the mechanism visible and give the
lifecycle comparison something to compare per stage.

## What is installed (page side, before the page's own scripts)

`installCapture(page)` runs `page.addInitScript(...)`, so on every navigation it installs
`window.__labCapture` (geometry/hit-test helpers) and `window.__labLifecycle` (counters) before Drupal's
scripts run.

| Counter | How | What it means |
|---|---|---|
| `resizeObserverCallbacks` | `window.ResizeObserver` is subclassed (pass-through); the constructor wraps the callback and records `{t, observer id, targets: [{el, width, height, time}]}` | How many observer callbacks fired, on which elements. Covers the patch's observer because the patch uses the same `new ResizeObserver(...)`. |
| `observersCreated` | the wrapper's constructor | How many observers the page created (the patch creates one per dialog on `dialog:aftercreate`; core/Views may create others for different targets). |
| `observerDisconnects` | the wrapper's `disconnect()` | Teardown. The patch disconnects on `dialog:beforeclose`; compare this with `observersCreated` to see a leak. |
| `autoResizeCalls` / `autoResizePerDialog` | a later `dialog:aftercreate` listener reads `$element.data('drupalAutoResize')` (the debounced function core stores) and replaces it with a counting pass-through; `.cancel` is preserved | How many times the page asked the dialog to recalculate its size/position. This is the debounced function itself, so one observer burst that calls it several times still counts the calls; the debounce then coalesces the actual `resetSize` runs. |
| `patchObservers` / `patchObserverCallbacks` | reads `$element.data('drupalAutoResizeObserver')`, which **only the patched side stores**, so its presence is a direct "the new code ran" signal (read-only) | Per-dialog confirmation that the patch's observer exists, how many callbacks it had, and whether it was disconnected. Also the observer's targets. |
| `dialogResizeEvents` / `dialogResizeFromDialogContent` | a capturing `dialogContentResize` listener | `resetSize()` dispatches this on the dialog content after recalculating the size options; Views UI dispatches the same event on a `summary` click from its own workaround (`core/modules/views_ui/js/dialog.views.js`). The `inDialogContent` flag separates them. |
| `pageErrors` | capture-phase `window` `error` listener + `unhandledrejection` | Uncaught errors **including** `ResizeObserver loop completed with undelivered notifications`, which `lab-run`'s `jsErrors` deliberately filters out. A loop shows here. |
| `consoleErrors` (page) | `console.error` wrapper | What the page's own code logged. |
| `consoleErrors` / `consoleWarnings` (Node) | `page.on('console')` in the evaluator | Browser-level console messages, including ones the page's console wrapper cannot see. The SUMMARY shows both counts separately. |

The probes are additive and pass-through: `ResizeObserver` keeps its subclass identity
(`instanceof` still works), `autoResize` still runs, `console.error` still logs. Only `window`-level
objects are wrapped; the patch file is untouched.

## Where the numbers are written

`results.json` → `sides.<before|after>.scenarios.<field-ui|views>.stages[]`:

- `lifecycle.counts` — cumulative for that page (navigation resets them; a reset is flagged as
  `epochReset` and treated as a new epoch),
- `lifecycle.delta` — the change since the previous captured stage, which is what to read:
  `resizeObserverCallbacks`, `autoResizeCalls`, `autoResizeWrappedDialogs`, `patchObservers`,
  `patchObserverCallbacks`, `patchObserverDisconnected`, `dialogResizeEvents`,
  `dialogResizeFromDialogContent`, `observerDisconnects`, `pageErrors`, `consoleErrorsPage`,
  `consoleErrorsNode`, `consoleWarningsNode`,
- `lifecycle.recent` — the last few raw events (observer targets, `dialogContentResize` targets, page
  errors, console errors),
- `lifecycle.patchObserverDetail` — per dialog: the patch observer's id, targets, callback count,
  disconnected flag.

`SUMMARY.md` prints a cumulative lifecycle table per scenario and the per-stage deltas in the stage
tables. A full run also takes screenshots per stage, so a counter can be read next to the picture.

## How to run it

The counters are always on, so the normal run already captures them:

```bash
node tools/playwright/evaluate-3466040.mjs 3466040-pinned
node tools/playwright/evaluate-3466040.mjs 3466040-pinned --scenario=field-ui --viewport=1920x1080
```

For a lifecycle-focused comparison, run the same scenario with a short viewport (the dialog has to
resize) and read these stage labels:

| Scenario | Stages | What to compare |
|---|---|---|
| A (Field UI) | `A5-config-form-open` → `A6-default-value-on` | ΔRO, ΔautoResize and ΔpatchObserverCallbacks at A6; Before should be 0/0/none, After should be ≥1 observer callback and ≥1 autoResize call. `A8-dialog-closed` shows `observerDisconnects` (After) versus `observersCreated`. |
| B (Views) | `B1-filter-dialog-open` → `B2-details-open-*` | Same deltas, plus `dialogResizeEvents` (Views dispatches its own on summary clicks — Before can show events without the patch). |

To capture the same thing by hand:

```js
import { chromium } from '@playwright/test';
import { installCapture, measureDialog } from './tools/playwright/evaluate-3466040.mjs';

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
await installCapture(page);                       // before the first goto
await page.goto('https://drupal-compare.ddev.site/...');   // then open the dialog by hand
// ... click a details element / tick "Set default value" ...
const measure = await measureDialog(page);
const lifecycle = await page.evaluate(() => {
  const L = window.__labLifecycle;
  return {
    ro: L.resizeObserver.callbacks.length,
    autoResize: L.autoResize.calls,
    patchObservers: L.patchObservers,
    dialogResize: L.dialogResizeEvents,
    pageErrors: L.pageErrors,
    consoleErrors: L.consoleErrors,
  };
});
```

A DevTools-console snippet can show the counters live but **cannot** count the patch's observer if it is
already created: the `ResizeObserver` wrapper has to exist before `dialog:aftercreate`. For a quick
look at an open dialog, paste this in the console, then grow the dialog:

```js
(() => {
  const L = window.__labLifecycle = { ro: 0, autoResize: 0, resize: [], errors: [] };
  const Native = window.ResizeObserver;
  window.ResizeObserver = class extends Native {
    constructor(cb) { super((e, o) => { L.ro += 1; L.resize.push({ t: Math.round(performance.now()), targets: e.map((x) => x.target.className) }); cb(e, o); }); }
  };
  window.addEventListener('dialogContentResize', (e) => L.resize.push({ t: Math.round(performance.now()), event: 'dialogContentResize', target: e.target.className }), true);
  window.addEventListener('error', (e) => L.errors.push(e.message), true);
  console.log('installed; observers created after this point are counted, existing ones are not');
})();
```

The evaluator is the reliable path because its wrapper is installed before any page script.

## Reading the numbers (and the traps)

- **One growth can fire the observer more than once.** `resetSize` changes the dialog's size options,
  which changes the observed element's size, so the observer fires again; a converging 2–4 callbacks
  for one details expansion is normal. Many callbacks that keep arriving after the layout has settled,
  plus a `ResizeObserver loop completed with undelivered notifications` page error, is the loop the
  code review's F3 worries about — report it, do not average it away.
- **Debounce.** `autoResize` is `debounce(resetSize, 20)`; several `autoResizeCalls` can produce one
  actual recalculation. Count calls (what the patch triggers), and use `dialogResizeEvents` from
  `.ui-dialog-content` for "resetSize actually ran".
- **`dialogContentResize` is not exclusive to the fix.** Views UI dispatches it from its own
  `summary` workaround. Always read `inDialogContent` (the `resetSize` signature) and the target
  description; a Before run with `dialogResizeEvents > 0` from `summary` is the workaround, not the
  patch.
- **`patchObservers > 0` is After-only.** Its absence on Before is expected and is the cleanest
  "the new code executed here" signal. It is not, by itself, evidence that the fix works: a leaked or
  looping observer would also be present. Pair it with the geometry checks and the disconnects.
- **Accumulation.** The patch creates an observer per `dialog:aftercreate` and disconnects only on
  `dialog:beforeclose`. Scenario A opens several modal steps, so watch `observersCreated`,
  `patchObservers` and `observerDisconnects` per stage: a new observer per dialog is expected; an
  observer still alive after `A8-dialog-closed` is the leak F1/F2 describe.
- **Lab-run filters the loop notice.** `rec.jsErrors` drops every message matching
  `ResizeObserver loop` (lab-run line 115) so that a benign browser notice does not fail unrelated
  runs. This issue's probe keeps it in `lifecycle.pageErrors`; when comparing, use that field, and say
  which of the two you are quoting.
- **Counts are page-scoped.** Each full navigation starts a new page and new counters; the stage delta
  marks a reset (`epochReset`) instead of printing a negative number. AJAX is not a navigation, so a
  modal stack shares one counter set.
- **Console noise is not a failure by itself.** Third-party or theme messages appear in both sides; the
  regression row compares Before and After counts, and the raw messages are in `lifecycle.recent`.
- **No server-side, no patch change.** Nothing here reads PHP or Drupal's logger; if a server-side
  error matters, use the lab's AJAX recorders (`ajax-<side>.json`) or the observability option
  (`--observe`), not this note.
- Automated counters are a DRAFT: they show the mechanism ran, not that a person can reach the button.
  Pair every lifecycle conclusion with the keyboard trail and a person's pass.
