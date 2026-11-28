# Code review: #3466040 MR !9088 — ResizeObserver in `dialog.position.js`

**DRAFT — source-level review. AI-assisted.** No browser run, no assistive-technology pass, and no
execution of the patch was performed for this file. "CONFIRMED" below means *confirmed by reading the
pinned source*, not observed in a browser. Where the source is not enough, the item is labelled NEEDS
RUNTIME CHECK. This file is a review input, not evidence that the fix works or does not work.

- Issue: [#3466040 Modal dialog does not adjust to increased inner height (pushes buttons out of reach)](https://www.drupal.org/project/drupal/issues/3466040)
- Merge request: [!9088](https://git.drupalcode.org/project/drupal/-/merge_requests/9088), branch `3466040-dialog-buttoninputs-not`
- Base: `97c6ff8b2534b242c0f1df3e4ba2493e56aebcec` (`97c6ff8b2534`)
- MR head: `aed1df5eeddf0b89c91bab47eb83847f44c58211` (`aed1df5eeddf`; parent `62763daaa3`)
- Patch under review: [../branches/3466040-dialog-buttoninputs-not.patch](../branches/3466040-dialog-buttoninputs-not.patch),
  sha256 `1adba92d55f15f34d4f98a90277c391efa96b196d4329bdc6efe30f65bfbfae8`
- Method: read-only `git --git-dir=envs/core.git show ...` against the bare repo. No core checkout was
  modified, no lab build/setup command was run, no file besides this report was written.

### Pinned-artifact checks

| Check | Result |
|---|---|
| `git diff 97c6ff8b2534 aed1df5eeddf` vs. the patch file | identical (index lines aside) |
| Patch blob hashes vs. real blobs | `dialog.position.js` `36f1ccf07c..505f906799`, routing `3828cf8c13..4a5273852e`, controller `110792f042..3cb5741b0a`, test `d2ed339ecf..1dfb9f27f8` — all match the patch `index` lines |
| Net MR change | 4 files, +92 lines: `dialog.position.js` **+9** (ResizeObserver + disconnect), 3 test-support files (+83) |
| MR commit churn | earlier commits (`fdc0733075`, `2c0de1f869`, `4bb3955b28`, `62763daaa3`) add-then-remove event wiring and remove-then-re-add the "don't force bigger vertically" block; they net to **zero** in the reviewed diff |
| Generated CSS | none touched; the `.pcss.css` → `.css` rules do not apply here |

Because the patch is the exact base→head diff, every citation below is either base source (unchanged by
the MR) or the two added hunks at `dialog.position.js` patch lines 9-16 and 24 (head file lines 147-155
and 164).

## Verdict at a glance

| # | Finding | Label | Severity |
|---|---|---|---|
| F1 | Observer *and* debounce accumulate when `dialog:aftercreate` fires again for the same element without `dialog:beforeclose`; only the newest observer is ever disconnected | **CONFIRMED by source** (reachable core flow shown) | **MEDIUM** |
| F2 | Teardown only at `dialog:beforeclose`: destroy/remove paths (and a caller-supplied `close` override) never disconnect | **CONFIRMED gap**, core reachability **NEEDS RUNTIME CHECK** | LOW-MEDIUM |
| F3 | Echo risk: `resetSize` writes size options to the observed element and fires `dialogContentResize`, whose listeners mutate the observed element again | **NEEDS RUNTIME CHECK** (analysis says it converges) | LOW-MEDIUM if a loop exists |
| F4 | For **modal** dialogs the callback is a no-op unless the dialog settings contain a %-based `height`/`maxHeight`; numeric overrides are not recentred | **CONFIRMED by source** (core defaults are covered) | LOW |
| F5 | Guard checks for a live jQuery UI instance, not "open"; a leaked observer can call `_size()`/`_position()` on a closed dialog | **CONFIRMED path** (via F1/F2), effect **NEEDS RUNTIME CHECK** | LOW |
| F6 | `drupalAutoResizeObserver` jQuery data is never `removeData()`d | CONFIRMED, cosmetic | INFO |
| F7 | Added regression test asserts only the end state; it can pass without the content growth having happened | **CONFIRMED** (test-only) | LOW |
| F8 | No coverage for AJAX replacement, nested dialogs, non-modal dialogs, close/reopen, `autoResize:false`, or the issue's own repro scenarios | evidence gap | INFO |

Cleared items (checked and found correct) are listed after the findings so the lead can separate "no
defect found" from "not examined".

## Findings

### F1 — Observer/debounce accumulation on repeated `dialog:aftercreate` — CONFIRMED by source, MEDIUM

The MR creates one `ResizeObserver` per `dialog:aftercreate` and stores it under a single fixed jQuery
data key:

```js
// head core/misc/dialog/dialog.position.js:150-154 (patch lines 12-16)
const resizeObserver = new ResizeObserver(() => {
  autoResize({ data: eventData });
});
resizeObserver.observe(e.target);
$element.data('drupalAutoResizeObserver', resizeObserver);
```

`dialog:aftercreate` is **not** a create-once/teardown-once event pair. It is dispatched on every
`Drupal.dialog(...).show()/showModal()` call (`core/misc/dialog/dialog.js:79-96`, dispatch at
`:93-95`; `show`/`showModal` at `:111-116`), and an AJAX modal that is re-rendered into the same element
fires it again **without** a preceding `dialog:beforeclose`:

- `OpenModalDialogCommand` always targets `#drupal-modal` (`core/lib/Drupal/Core/Ajax/OpenModalDialogCommand.php:33-36`), a single persistent element created by `Drupal.behaviors.dialog.attach` (`core/misc/dialog/dialog.ajax.js:20-28`).
- The `openDialog` AJAX command reuses that element if it exists (`core/misc/dialog/dialog.ajax.js:173-180`), inserts the new content into it (`:186-189`), and calls `Drupal.dialog(dialog, response.dialogOptions)…showModal()` again (`:221-226`) → second `dialog:aftercreate`.
- Core reaches this deliberately: Views AJAX forms return `OpenModalDialogCommand` on rerender (`core/modules/views_ui/src/Form/Ajax/ViewsFormBase.php:241-265`), and rerender is set on validation errors (`ConfigHandler.php:204-208`, `Display.php:100-104`). Each Views dialog submit that re-renders therefore dispatches a further `dialog:aftercreate` on the same element.

Because the data key is overwritten, the previous observer becomes unreachable for cleanup, and the
`dialog:beforeclose` teardown only cancels/disconnects the **latest** one:

```js
// head core/misc/dialog/dialog.position.js:158-167 (patch line 24)
$(e.target).data('drupalAutoResize')?.cancel();
$(e.target).data('drupalAutoResizeObserver')?.disconnect();
```

Consequences (all follow from the source, not yet measured):

1. While the dialog stays open, every content-size change invokes **N** observer callbacks (N = number
   of `aftercreate` dispatches). Each leaked observer keeps its own `debounce` closure, so it schedules
   its own `resetSize` run → N × (`_size()` + `_position()` + one `dialogContentResize` event) per
   resize. This is a visible-jank / extra-DOM-work risk in long-lived Views dialogs.
2. On close, the leaked observers stay connected. The dialog element is removed by the AJAX close
   wrapper (`core/misc/dialog/dialog.ajax.js:90-116`, removal at `:115`), but a live `ResizeObserver`
   holds a strong reference to its target, so the detached dialog subtree is retained. The guard at
   `dialog.position.js:66-69` prevents a throw, but the leak remains.
3. This is the same class of defect as the existing re-registration of window handlers on every
   `aftercreate` (`dialog.position.js:139-146`), except that `.off('.dialogResize')` on close does clean
   those up — the observers have no equivalent namespaced cleanup.

**What runtime evidence would settle it:** a page-level `ResizeObserver` constructor counter that stays
at 1 for one dialog with several AJAX re-renders (correct) or grows by 1 per re-render (this finding).
See the instrumentation plan.

**Minimal source fix** (for the MR discussion, not applied here): disconnect and `removeData()` any
existing observer before constructing a new one, or create it once (e.g. guarded by
`$element.data('drupalAutoResizeObserver')`), and disconnect in teardown. Test for it: open a dialog,
force N AJAX rerenders, assert one observer and zero callbacks after close.

### F2 — Teardown is only attached to `dialog:beforeclose` — CONFIRMED gap, reachability NEEDS RUNTIME, LOW-MEDIUM

Core has exactly four Drupal dialog lifecycle events — `beforecreate`, `aftercreate`, `beforeclose`,
`afterclose` (`core/misc/dialog/dialog.js:82,93-95,99,108`); there is no `dialog:close` and no
`dialog:remove` event anywhere in core JS (grep at base: no matches). The MR therefore has one teardown
hook, and it inherits that hook's limits:

- **Correct ordering for the normal paths.** For the Close button/ESC path, jQuery UI calls
  `_trigger('close')` only after hiding (`core/assets/vendor/jquery.ui/ui/widgets/dialog.js:214-237`),
  and that callback is Drupal's default `settings.dialog.close` (`dialog.js:36-39`), which calls
  `Drupal.dialog(event.target).close()` → dispatches `dialog:beforeclose` → the `disconnect()` runs
  **before** `core/misc/dialog/dialog.ajax.js:115` removes the element. So placement at `beforeclose`
  is right (using `afterclose` would be worse: see the recursion/ordering noted in the cleared list).
- **Not fired on removal without close.** `$(el).dialog('destroy')` (public jQuery UI API, used by
  contrib/custom code; no core JS caller at base) and removing/replacing an ancestor of an open dialog
  with an AJAX `insert` command produce no `dialog:beforeclose`, so the observer is never disconnected.
  Detached-element retention follows (F1 consequence 2).
- **Not fired if a caller overrides `close`.** `dialog:beforeclose` is dispatched by the default
  `close` option; a dialog created with its own `close` option (merged at `dialog.js:80`) never
  dispatches it. `autoResize`'s existing `cancel()`/`off()` teardown has the same dependency, so this is
  not new, but the MR adds another resource that then leaks.

**What runtime evidence would settle it:** after `$('#drupal-modal').dialog('destroy')` (or replacing
the dialog's wrapper via DOM), resize the viewport and count observer callbacks (expect 0) and
disconnects (expect 1). If they are 0/0, F2 is real.

### F3 — Echo/feedback: `resetSize` mutates the observed element and announces it — NEEDS RUNTIME CHECK, LOW-MEDIUM if a loop exists

The observed target is the dialog **content** element (`e.target` — see cleared list). `autoResize`
runs `resetSize`, which writes size-related dialog options (`dialog.position.js:117`), which makes
jQuery UI run `_size()` + `_position()` (`core/assets/vendor/jquery.ui/ui/widgets/dialog.js:685-708`,
`_size()` at `:779-823`) on that same content element — and then `resetSize` dispatches
`dialogContentResize` (`dialog.position.js:119-123`). Two consequences:

1. **Self-echo.** When the write changes the content element's height, the observer fires again. The
   maximum-`maxHeight` cap means the second pass computes the same values, `_size()` applies the same
   box, and the observer stops. Expect ≤2 extra callbacks per growth event, not an infinite loop. The
   debounce (20 ms) also keeps the mutation outside the ResizeObserver delivery phase, avoiding the
   "ResizeObserver loop completed with undelivered notifications" error class.
2. **Fan-out to `dialogContentResize` consumers.** The event now fires on every content-size change, not
   just viewport changes. The one core consumer that mutates content is Views UI:
   `handleDialogResize()` sets `.scroll` height on the same `.ui-dialog-content` element
   (`core/modules/views_ui/js/dialog.views.js:7-38`, bound to `.ui-dialog-content` at `:53-57`). My
   arithmetic says its recalculation is idempotent (the scroll height is derived from the container
   height, not from the element height it just changed), so it should converge — but this is exactly
   the issue's primary reproduction area (Views translate dialog), so it must be measured rather than
   assumed. Off-canvas is out of scope because off-canvas dialogs force `autoResize: FALSE`
   (`core/lib/Drupal/Core/Ajax/OpenOffCanvasDialogCommand.php:51`).

**What runtime evidence would settle it:** count observer callbacks, `dialogContentResize` events and
content-element style writes per user action, then wait 500 ms idle and confirm counts stop. A
non-converging loop shows as callbacks continuing after the action, a monotonically changing
`getBoundingClientRect()`, and repeated `dialogContentResize` events in the idle window.

### F4 — For modal dialogs the callback is a no-op without %-based height options — CONFIRMED by source, LOW

`autoResize` → `resetSize` only emits adjusted options for settings values that are strings ending in
`%` and whose name matches `/height/i` (`dialog.position.js:85-112`); for modal dialogs it does not add
a `position` option (`:113-116`). jQuery UI only calls `_size()`/`_position()` when at least one
size-related option is set (`dialog.js:685-708`). So for a **modal** dialog created with, e.g.,
`data-dialog-options='{"maxHeight":600}'` (numeric) or a site-level `drupalSettings.dialog` override
without a `maxHeight` percentage, the observer callback runs `resetSize`, which computes
`adjustedOptions = {}` and calls `dialog('option', {})` — no resize, no reposition, no fix. Non-modal
dialogs still recentre because `resetPosition()` always supplies `position`.

Core's own defaults always supply `maxHeight: '95%'` (`dialog.position.js:14-17`), so core modals are
covered; the MR's comment ("Recalculate the size and the position, so the dialog stays inside the
viewport", patch lines 9-11) overstates applicability for configured dialogs. No core template at base
overrides dialog height/maxHeight, so severity is LOW.

**What runtime evidence would settle it:** open a modal with a numeric `maxHeight`, grow the content,
and check whether the dialog rect moves at all (expected: no move, confirming the no-op).

### F5 — Guard checks for a live instance, not for "open" — CONFIRMED path (via F1/F2), effect NEEDS RUNTIME, LOW

`resetSize` guards only `event.data?.$element?.data('ui-dialog')` (`dialog.position.js:66-69`). After
jQuery UI `close()`, that data still exists until `destroy()`. Through a leaked observer (F1/F2) a
deferred `resetSize` can therefore run on a closed dialog: `_size()` calls `this.element.show()`
(`core/assets/vendor/jquery.ui/ui/widgets/dialog.js:787`) and `_position()` recalculates against an
offset parent that is hidden (`:779-823`), and `dialogContentResize` is dispatched on a closed element.
Nothing throws (the wrapper is hidden), but it is unnecessary DOM work and another false signal for
listeners. Cheap hardening: also require the instance to be open (or cancel before the wrapper hides).

### F6 — jQuery data is not removed — CONFIRMED, INFO

`$element.data('drupalAutoResizeObserver', resizeObserver)` is never paired with `removeData()`.
Normal close removes the element (`dialog.ajax.js:115`) and jQuery clears its data, so this is mostly
cosmetic; for a persisted dialog the stale, disconnected observer object is retained until the next
`aftercreate` overwrites it. Pair the disconnect with `removeData('drupalAutoResizeObserver')` in
teardown (and `removeData('drupalAutoResize')` for symmetry).

### F7 — The added regression test can pass without proving the growth — CONFIRMED (test-only), LOW

Added test (`aed1df5eeddf:core/modules/system/tests/src/FunctionalJavascript/ModalRendererTest.php:167-189`):
after clicking the summary it only asserts that `.ui-dialog` is inside the viewport. It never asserts
that the content actually exceeded the viewport (e.g. `.ui-dialog-content` `scrollHeight >
clientHeight`, or that dialog height grew). If the details click were a no-op (fixture/CSS/JS problem),
the small dialog would also satisfy the viewport assertion — a vacuous pass. Also
`$page->find('css', '.ui-dialog summary')->click()` dereferences null with a PHP error if the summary
is missing, instead of producing an assertion failure. The `assertJsCondition` default timeout in this
base is 10 s (`core/tests/Drupal/FunctionalJavascriptTests/WebDriverTestBase.php:158-162`), so the
20 ms debounce does not make it flaky. The test-only review is task-2's scope; this is recorded here
only because it bears on how much the MR's own evidence proves. The accompanying fixture is reasonable
(`dialog_renderer_test` route at head `dialog_renderer_test.routing.yml:33-39`, a collapsed `details`
with a 2000 px child at head `TestController.php:86-99`), and per source reasoning the test should fail
on the base — that must still be demonstrated by the before/after run.

### F8 — Coverage gaps — INFO (evidence gap)

The added test covers one modal + `<details>` scenario. It does not cover: AJAX content replacement in
an already-open dialog; the repeated-`aftercreate` path from F1; nested dialogs; a second modal opening
over the first; non-modal dialogs; close/reopen cycles; `autoResize:false`; keyboard reachability after
the resize; or the issue's own repros (Views translate dialog, Media Library widget, Field UI "Set
default value" — see `../intake/BRIEF.md`). Recommendation: the runtime harness (task-3) should exercise
at least the Views dialog path, not only the test fixture, because that is where the accumulation (F1)
and the `dialogContentResize` fan-out (F3) can actually bite.

## Cleared: items checked and found correct

- **What `e.target` is.** In `dialog:aftercreate`, `e.target` is the dialog **content** element passed to `Drupal.dialog()` (`core/misc/dialog/dialog.js:71-72,93-95`); the custom event bubbles to `window` (`:8-13`), which is why the listener sees it. Observing it is the right node for content growth and for AJAX `insert`-into-dialog replacement (`dialog.ajax.js:186-189`). It does **not** cover chrome-only growth (titlebar wrap, button pane added by a non-option path); button option changes already trigger `_size()`/`_position()` because `buttons` is a `sizeRelatedOptions` key (`dialog.js:100-108`), and title changes are not a core flow.
- **Call shape.** `autoResize` is `debounce(resetSize, 20)` (`dialog.position.js:127`); `Drupal.debounce` forwards arguments to `func.apply(context, args)` (`core/misc/debounce.js:30-49`), and `resetSize` reads `event.data.settings` / `event.data.$element` (`dialog.position.js:65-123`). `autoResize({ data: eventData })` is therefore the same shape jQuery produces for the window handlers (`:139-146`). Correct.
- **Debounce semantics.** 20 ms trailing, one instance shared by window/scroll/document and the observer; `.cancel()` clears a scheduled run (`debounce.js:30-63`). Sharing the instance means the observer's initial callback and the existing `trigger('resize.dialogResize')` at open coalesce into one `resetSize`, and a `cancel()` in teardown also cancels a run scheduled by an observer callback that fired just before close. Correct.
- **`observe()` initial callback.** It fires once asynchronously after `observe()` and is coalesced as above; not an extra visible reset per open. Expected count: one callback per dialog open (to be confirmed by the instrumentation).
- **Teardown point and ordering.** `dialog:beforeclose` is dispatched before the element is removed on the standard close paths (see F2), so `disconnect()` runs before DOM removal; `afterclose` would be worse because the AJAX close wrapper removes the element inside the jQuery UI `close` callback chain (`dialog.ajax.js:90-116`) and `afterclose` can fire after removal (the second, recursive `closeDialog`). `beforeclose` can be dispatched twice in the close-button path (default `close` option recursively calls `Drupal.dialog().close()`); `cancel()`/`disconnect()` are idempotent, so this is harmless.
- **Pending debounced callback vs. destroyed dialog.** `cancel()` runs synchronously in `beforeclose`, and `resetSize` also returns early when the jQuery UI instance is gone (`dialog.position.js:66-69`), so a late call cannot throw. Correct.
- **`autoResize: false` respected.** The observer is created inside the `if (settings.autoResize === true || settings.autoResize === 'true')` block (`head dialog.position.js:132-155`), and off-canvas dialogs set `autoResize: FALSE` (`OpenOffCanvasDialogCommand.php:51`), so off-canvas is untouched. Correct.
- **Nested dialogs.** Per-element jQuery data, so two concurrently open dialogs do not share an observer. One pre-existing defect remains and is **not** introduced by the MR: `$(window).off('.dialogResize')` / `$(document).off('.dialogResize')` in `beforeclose` (`dialog.position.js:156-157`) unbinds *all* dialogs' viewport handlers when any one closes; the MR's observers partly survive that, which is a side effect, not a regression.
- **ResizeObserver availability.** `core/package.json:83-93` targets the last two major versions of Chrome/Firefox/Safari/Edge/Opera/iOS, ChromeAndroid/Samsung and Firefox ESR — all have had `ResizeObserver` since 2020. Core already uses it unguarded in `core/themes/default_admin/migration/js/sidebar.js:47` and `tableheader.js:20`. No feature detection is required by policy; note only that a browser without it would throw a `ReferenceError` inside the listener (uncaught, but the window handlers are already bound by then). Not a blocker.
- **Generated CSS / patch hygiene.** No `.pcss.css` changed; the patch applies exactly to the declared base and equals the base→head diff; the test-support files are part of the MR and are needed for the test.
- **No MR review threads available.** `../intake/BRIEF.md:19` records that `!9088` discussions returned HTTP 401, so it is unknown whether maintainers already raised F1/F4; nothing was read from the MR discussion.

## Runtime instrumentation plan (page JS only, patch unchanged)

Goal: settle F1-F5 and the cleared-count expectations without editing the MR. All of this can run in
the later browser pass, e.g. Playwright `addInitScript` before Drupal's JS loads (the lab's evaluator
in `tools/playwright/evaluate-3466040.mjs` is being written under task-3; do not edit shared lab files
for this).

1. **Wrap `ResizeObserver` before core JS loads** and record per instance: constructed, observed target
   (`id`/class), callbacks delivered, entries, disconnect calls, deliveries after disconnect.

   ```js
   (() => {
     const Native = window.ResizeObserver;
     if (!Native) return;
     window.__lif = { constructed: 0, disconnected: 0, callbacks: 0, entries: 0, afterDisconnect: 0, targets: [], sizeWrites: [] };
     let nextId = 1;
     window.ResizeObserver = class extends Native {
       constructor(cb) {
         const id = nextId++;
         const state = { live: true };
         super((entries, obs) => {
           window.__lif.callbacks += 1;
           window.__lif.entries += entries.length;
           if (!state.live) window.__lif.afterDisconnect += 1;
           cb(entries, obs);
         });
         window.__lif.constructed += 1;
         this.__id = id;
         this.__state = state;
         window.__lif.instances = window.__lif.instances || [];
         window.__lif.instances.push(this);
       }
       observe(target, opts) {
         window.__lif.targets.push({ id: this.__id, target: target.id || target.className || target.nodeName });
         return super.observe(target, opts);
       }
       disconnect() {
         window.__lif.disconnected += 1;
         this.__state.live = false;
         return super.disconnect();
       }
     };
   })();
   ```

   Expected with a correct implementation: `constructed - disconnected == 0` after each close, and
   `afterDisconnect == 0` after close + a viewport resize. With the MR as written, the Views rerender
   flow should show `constructed` growing while `disconnected` grows by 1 on close (F1).
2. **Count lifecycle events.** Capture-phase listeners on `window` for `dialog:aftercreate`,
   `dialog:beforeclose`, `dialog:afterclose` and (capture, on document) `dialogContentResize`, each with
   `performance.now()` and the target id. Signatures to look for: `aftercreate` count > 1 without an
   intervening `beforeclose` (F1); `dialogContentResize` events arriving after 500 ms of idle (F3);
   `afterDisconnect` observer deliveries (F2).
3. **Count `autoResize` executions and size writes.** Before any dialog opens, wrap the dialog widget
   prototype once:
   `const proto = window.jQuery.ui.dialog.prototype; const orig = proto._setOptions; proto._setOptions = function (o) { window.__lif.sizeWrites.push({ t: performance.now(), keys: Object.keys(o) }); return orig.apply(this, arguments); }`
   This counts `resetSize`-driven option writes (`{maxHeight}` for modal, `{position}` for non-modal),
   including empty objects → which is the F4 signature. Do not wrap `_size` itself; the option write is
   the observable input.
4. **Height-write/oscillation check.** `MutationObserver` on the observed content element's `style`
   attribute, plus `requestAnimationFrame` sampling of `.ui-dialog` and `.ui-dialog-content`
   `getBoundingClientRect()` for 3 s after an action: record frames changed, first/last rect, and
   whether it settles. Used for F3 and to capture the "dialog stays in viewport" claim.
5. **`autoResize:false` control.** Open `Drupal.dialog(el, {autoResize: false})` (or the CKEditor 5
   dialog path, `core/modules/ckeditor5/js/ckeditor5.js:620-650`, which can set `autoResize:false`) and
   assert `constructed` is 0.
6. **Console/error capture.** `page.on('console')` + `page.on('pageerror')`: assert no uncaught error,
   no `ResizeObserver loop completed with undelivered notifications`, no
   `Cannot read properties of undefined` (the destroyed-dialog failure mode the base comment warns
   about).
7. **Scenario matrix to run (both sides, same pinned revisions):**
   - Fixture modal (`/dialog_renderer-test-links` → "Details modal!"), toggle the summary 10×:
     callbacks per toggle, `dialogContentResize` per toggle, size writes, rect settled; then idle 500 ms
     and confirm zero events.
   - Same fixture, close → reopen ×3: `constructed`, `disconnected`, `afterDisconnect`; expect no growth.
   - Views dialog (the issue's own repro): open the translate/Content-type filter dialog, trigger a
     validation error or an AJAX rerender 3×, record observer count after each (F1), then resize and
     compare callbacks/height writes against the 1-observer baseline.
   - Destroy/remove path: `$('#drupal-modal').dialog('destroy')` and an AJAX ancestor replace; expect
     disconnect to be called (F2).
   - Second modal opening over an open one (same `#drupal-modal` reuse): observer count (F1).
   - Numeric `maxHeight` modal: expect no reposition (F4).
   - `autoResize:false`: expect no observer (control).
   - Record `window.innerWidth/innerHeight`, `Drupal.displace.offsets`, dialog/titlebar/buttonpane rects,
     `document.activeElement`, and `elementFromPoint` hit-tests at each stage, plus JSON + screenshots
     to `reports/issues/3466040/`.

## What this review does not establish

- No browser/Playwright run, no keyboard-only pass, no screen-reader pass, no forced-colors run; the
  actual geometry outcome of the fix and the debounce/observer counts are unmeasured here.
- The base is expected to fail the new regression test by source reasoning (dialog grows downward from
  its stale centred position), but this was not executed; task-2 owns running it on both sides.
- The MR review threads could not be fetched (HTTP 401), so prior maintainer comments are unknown.
- All "CONFIRMED by source" statements are code-path claims. Whether a given core flow reaches them
  (especially F1's repeated `aftercreate` and F2's destroy/remove) is what the instrumentation above is
  for.

## Sources read (pinned)

| File | Revision / lines |
|---|---|
| `reports/issues/3466040/branches/3466040-dialog-buttoninputs-not.patch` | full (150 lines); reviewed hunks 1-17, 20-27 |
| `core/misc/dialog/dialog.position.js` | base `97c6ff8b2534` lines 1-159; head `aed1df5eeddf` lines 126-168 |
| `core/misc/dialog/dialog.js` | base lines 1-120 |
| `core/misc/dialog/dialog.ajax.js` | base lines 1-337 |
| `core/misc/dialog/dialog.jquery-ui.js` | base lines 1-152 (no lifecycle dispatch) |
| `core/misc/debounce.js` | base lines 1-64 |
| `core/assets/vendor/jquery.ui/ui/widgets/dialog.js` | base lines 47-115, 200-300, 680-840 |
| `core/assets/vendor/jquery.ui/ui/widget.js` | base `_trigger` 683-711, `option()` 380-430 |
| `core/misc/ajax.js` | base 600-635, 1067-1100 |
| `core/lib/Drupal/Core/Ajax/OpenModalDialogCommand.php`, `OpenOffCanvasDialogCommand.php` | base |
| `core/modules/views_ui/src/Form/Ajax/ViewsFormBase.php`, `ConfigHandler.php`, `Display.php` | base (rerender flow) |
| `core/modules/views_ui/js/dialog.views.js`, `views-admin.js` | base (dialogContentResize consumers) |
| `core/misc/dialog/off-canvas/js/off-canvas.js` | base 100-150, 175-256, 340-385 |
| `core/modules/system/tests/.../ModalRendererTest.php`, `dialog_renderer_test` route/controller | base and head |
| `core/core.libraries.yml` (`drupal.dialog`), `core/package.json` (browserslist), `core/tests/.../WebDriverTestBase.php` | base |

## Commands used (read-only)

```bash
git --git-dir=envs/core.git show 97c6ff8b2534:core/misc/dialog/dialog.position.js
git --git-dir=envs/core.git show aed1df5eeddf:core/misc/dialog/dialog.position.js
git --git-dir=envs/core.git diff 97c6ff8b2534 aed1df5eeddf
git --git-dir=envs/core.git log --oneline 97c6ff8b2534..aed1df5eeddf
git --git-dir=envs/core.git grep -n "<symbol>" 97c6ff8b2534 -- core
```
