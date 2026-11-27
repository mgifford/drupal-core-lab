# Source review for #3419891 (alternative text textarea)

**DRAFT.** Written 2026-11-26 from source reading. No browser reproduction for this revision yet: the
environment build is blocked by a full disk (see [Status](#status)). Everything below is source
evidence and a set of hypotheses to test, not a result.

Issue: https://www.drupal.org/project/drupal/issues/3419891
MR: https://git.drupalcode.org/project/drupal/-/merge_requests/16984 (head `1931822c77bb`)

## Versions

| What | Value | How read |
|---|---|---|
| Core at the MR base | `47430c368bbd` (2026-10-06) | `reports/issues/3419891/BRANCHES.md` |
| CKEditor 5 at that base | `^48.5.1` | `git show 47430c368bbd:core/package.json` |
| Core at this evaluation's pin | `0387fb948f786bc344a5cc54aa0d98b8f552e378` (2026-11-25) | `tools/compare/variants.json` |
| CKEditor 5 at that pin | `^49.1.0`, installed **49.1.0** | `git show 0387fb948f7:core/package.json`; `node_modules/ckeditor5/package.json` |
| Lab Playwright | 1.65.0-alpha-2026-10-30 | `tools/playwright/package.json` |

The MR was written and reviewed against 48.5.1. The re-pinned evaluation runs 49.1.0, so the
reviewer's observations must be re-tested rather than assumed to still apply.

## Drupal integration (the patch under review)

Patch: `reports/issues/3419891/branches/3419891-increase-size-of.patch`, sha256 `b40e9c79…`.

1. `imagealternativetextformview.js` — `createLabeledInputText` becomes `createLabeledTextarea`
   and the view sets `fieldView.minRows = 1`, `fieldView.maxRows = 6`.
2. `drupalimagealternativetextui.js` — adds
   `this.listenTo(this._form.labeledInput.fieldView, 'update', () => repositionContextualBalloon(editor))`.
3. `css/image.css` — `.ck.ck-text-alternative-form .ck-labeled-field-view__input-wrapper .ck-textarea { width: 100% !important; }`.
4. Compiled `js/build/drupalImage.js` and three PHPUnit selectors (`input[type=text]` → `textarea`).

`TextareaView` fires an `update` event in 48.5.1 as well as 49.1.0, so item 2 is not dead code on
either version. `TextareaViewUpdateEvent` is documented in the v47 LTS API as "fired every time the
layout … possibly changed as a result of the user input or the value change".

## The form lifecycle that matters for "reopen"

`drupalimagealternativetextui.js`, `_showForm()` (unchanged by the MR):

```js
this._form.disableCssTransitions();
if (!this._isInBalloon) {
  this._balloon.add({ view: this._form, position: getBalloonPositionData(editor) });
}
decorativeToggle.isOn = command.value === '';
labeledInput.fieldView.element.value = command.value || '';
labeledInput.fieldView.value = labeledInput.fieldView.element.value;
if (!decorativeToggle.isOn) { labeledInput.fieldView.select(); } else { decorativeToggle.focus(); }
this._form.enableCssTransitions();
```

- The balloon (and therefore the form element) is attached **before** the value is restored.
- The DOM value is assigned first; the observable `fieldView.value` is assigned second.
- `_hideForm()` removes the form from the balloon and never resets the field value.
- Cancel (`cancel` event), Escape (`keystrokes.set('Esc', …)`) and `clickOutsideHandler` all call
  `_hideForm()`; submit calls `editor.execute('imageTextAlternative', …)` and then `_hideForm(true)`.
- The decorative toggle only hides the whole labeled field (`ck-hidden`); its value is untouched.

Consequence: when the form reopens with the value the view already holds, the second assignment is
not a *change*, so `change:value` does not fire.

## CKEditor 5 `TextareaView` internals (49.1.0)

Read from `node_modules/@ckeditor/ckeditor5-ui/dist/index.js` and the upstream TypeScript at
`v49.1.0` (`packages/ckeditor5-ui/src/textarea/textareaview.ts`).

- Template: `rows` is bound to `minRows`; inline `style.height` is bound to `_height`; class `ck-textarea`.
- `input` → `_updateAutoGrowHeight(true)` (which also scrolls to the end) and fires `update`.
- `change:value` → `_updateAutoGrowHeightWhenVisible()`: one `requestAnimationFrame`, then
  `if (!isVisible(element)) { pending = true; return; }`, else recompute and fire `update`.
- `ResizeObserver` callback:
  ```js
  const isVisible = !!evt.contentRect.width && !!evt.contentRect.height;
  if (!wasVisible && isVisible && this._isUpdateAutoGrowHeightPending) { requestAnimationFrame(update) }
  wasVisible = isVisible;
  ```
  The recalculation on becoming visible requires `!wasVisible`.
- `_updateAutoGrowHeight()` itself returns early (and sets `pending`) when `element.offsetParent`
  is null, i.e. detached or `display:none`.
- Height maths: `maxHeight = maxRows * lineHeight + verticalPaddings + verticalBorder`;
  `_height = min(max(...), maxHeight)`.

Upstream history (see links below): the detached-element guard and `pending`/ResizeObserver
machinery come from the 2023 fix "TextareaView will no longer update its height … when the element
is detached from DOM". The 48.5.1 → 49.1.0 diff only adds placeholder-driven recalculation and a
shadow-DOM-aware `getParentNode`; the reopen logic is otherwise the same. **A version bump alone is
therefore not a fix for the stale-height concern.**

## CSS and scrollbars

- CKEditor's own rule is only `.ck-textarea { overflow-x: hidden; }` (no `overflow-y`).
- A plain textarea in WebKit on this macOS host (measured with Playwright WebKit, no Drupal)
  computes `overflow-y: auto`: `scrollHeight 190` vs `clientHeight 72`, `scrollTop` settable, and
  `offsetWidth - clientWidth - borders = 0` → the platform uses **overlay scrollbars**.
  An unpainted scrollbar is therefore not by itself evidence of inaccessible overflow.
- The owner-proposed CSS adds `resize: vertical`, `overflow-y: auto !important` and a fixed
  `max-height: 150px`. Upstream issue #15061 records that manual resize is overwritten by the
  autogrow logic ("known bug"), and a fixed 150 px cap does not track six rows when text is
  enlarged. Neither belongs in the fix without evidence.

## Hypotheses to test (not results)

- **H1 (scrollbar):** at the six-row cap the content remains scrollable (`scrollHeight >
  clientHeight`, `overflow-y: auto`, keyboard and programmatic scroll work); the missing scrollbar
  is macOS overlay behaviour. If so, the reviewer's first point is a platform characteristic, not a
  Drupal or CKEditor defect.
- **H2 (reopen):** the height can be stale because (a) `_showForm()` restores the value the view
  already holds (no `change:value`), and/or (b) the last recalculation was deferred while the form
  was detached, leaving `pending` set while `wasVisible` is already `true`, so the ResizeObserver's
  `!wasVisible` gate never lets the deferred update run. Both conditions exist in Drupal's
  `_showForm()` ordering.
- **H3 (fix shape):** a narrow Drupal-side correction after the balloon is shown (force one
  recalculation, or set the value before attachment and reposition once) is preferable to synthetic
  input events, timeouts or a global ResizeObserver. If H2 is confirmed to be a generic
  `TextareaView` lifecycle defect, an upstream issue/correction should be documented; Drupal should
  not carry an avoidable workaround.

## Upstream references

- `TextareaView` at v49.1.0: https://github.com/ckeditor/ckeditor5/blob/v49.1.0/packages/ckeditor5-ui/src/textarea/textareaview.ts
- The detached-element fix (2023): https://github.com/ckeditor/ckeditor5/commit/46c6595d921f9724583979f5769bfc58f347c452
- Manual resize vs auto-grow, issue #15061: https://github.com/ckeditor/ckeditor5/issues/15061
- `TextareaView#update` event (v47 LTS docs): https://ckeditor.com/docs/ckeditor5/lts-v47/api/module_ui_textarea_textareaview-TextareaViewUpdateEvent.html
- Drupal's upstream basis for the override: `module:image/imagetextalternative/imagetextalternativeui~ImageTextAlternativeUI`

## Status

Resolved on 2026-11-26. The re-pinned environments were built and the hypotheses were tested:

- H1 accepted: at the six-row limit the field is scrollable (`overflow-y: auto`, 218 > 134, keyboard scroll works) and the platform reports a 0 px scrollbar gutter, i.e. macOS overlay scrollbars.
- H2 accepted with a sharper cause: `TextareaView.value` is programmatic only; typing updates the DOM and the height but never `value`, so restoring the same value fires no `change:value`. Reopening after Cancel therefore kept the 136 px height and left `isEmpty` false (Save enabled).
- H3 chosen: the follow-up calls the public `reset()` after the balloon is attached and before restoring the value. No private method, synthetic input, timeout or resize observer.

See [EVIDENCE.md](EVIDENCE.md) and [BRANCHES.md](BRANCHES.md).

**Upstream.** No specific CKEditor 5 issue for this Drupal interaction was found, so none is claimed. The relevant upstream property is that `TextareaView#value` is programmatic: typing does not update it, while `change:value` is what triggers recalculation. An upstream correction could make `value` track user input, or expose a public height recalculation. The Drupal follow-up uses the public `reset()` that already exists on `InputBase`.
