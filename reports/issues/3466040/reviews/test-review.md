# Test review: `ModalRendererTest::testModalContentGrows` (#3466040, MR !9088)

**Status: DRAFT — source analysis, not run.** The lab pair for this variant does not exist yet
(`envs/baseline-3466040`, `envs/issue-3466040` were absent at review time; a build was running). Every
verdict below is reasoned from the base commit, the MR patch and the test framework source. The runtime
confirmation is the run in §7; it has not been done.

AI-assisted analysis for the Lab. Not a drupal.org post.

## Identity

| | |
|---|---|
| Issue | [#3466040](https://www.drupal.org/project/drupal/issues/3466040) — Modal dialog does not adjust to increased inner height |
| Merge request | [!9088](https://git.drupalcode.org/project/drupal/-/merge_requests/9088), branch `3466040-dialog-buttoninputs-not`, tip `aed1df5eeddf` |
| Base core | `97c6ff8b2534b242c0f1df3e4ba2493e56aebcec` (2026-11-23 "task: #3635770 PHPUnit 13.2 …") |
| MR patch | [`branches/3466040-dialog-buttoninputs-not.patch`](../branches/3466040-dialog-buttoninputs-not.patch), sha256 `1adba92d55f15f34d4f98a90277c391efa96b196d4329bdc6efe30f65bfbfae8`, 4 files |
| Test-support patch | [`branches/3466040-test-support.patch`](../branches/3466040-test-support.patch), sha256 `262dd0fc8d71ec586f3f85ab5f8c2f2fb8de9bf071721975b4b002d871674222`, 3 files, no `dialog.position.js` |
| Lab branch ref | `refs/lab/issue-3466040/3466040-dialog-buttoninputs-not` = `aed1df5eeddf` in `envs/core.git` |

Line numbers for new code are from the MR post-image (`97c6ff8b2534` + the patch); line numbers for
framework code are from `97c6ff8b2534`.

## 1. What the MR adds for the test

Three additive hunks plus the `ResizeObserver` production change:

| File | Change |
|---|---|
| `core/modules/system/tests/src/FunctionalJavascript/ModalRendererTest.php:170-189` | new `testModalContentGrows()` |
| `core/modules/system/tests/modules/dialog_renderer_test/src/Controller/TestController.php:73-100` | new `modalContentDetails()`: a `container` with the text "Look at me in a modal!", then `#type => details`, `#title => 'Show more content'`, `#open => FALSE`, and a `div` with `style="height: 2000px;"` |
| `core/modules/system/tests/modules/dialog_renderer_test/src/Controller/TestController.php:286-308` | `linksDisplay()` gains `details_modal`, title "Details modal!", `use-ajax`, `data-dialog-type=modal`, `data-dialog-options` with one "OK" button |
| `core/modules/system/tests/modules/dialog_renderer_test/dialog_renderer_test.routing.yml:33-39` | new route `dialog_renderer_test.modal_content_details` at `/dialog_renderer-content-details` |

The test method from the MR post-image:

```php
public function testModalContentGrows(): void {
  $assert_session = $this->assertSession();
  $page = $this->getSession()->getPage();

  $this->drupalGet('/dialog_renderer-test-links');
  $this->clickLink('Details modal!');
  $assert_session->waitForElementVisible('css', '.ui-dialog');
  $assert_session->assertVisibleInViewport('css', '.ui-dialog .ui-dialog-buttonpane');

  // Opening the details element makes the content much taller than the
  // viewport. The dialog must shrink its content area and keep the button
  // pane inside the viewport.
  $page->find('css', '.ui-dialog summary')->click();
  $this->assertJsCondition('(() => {
    const rect = document.querySelector(".ui-dialog").getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
  })()');
  $assert_session->assertVisibleInViewport('css', '.ui-dialog .ui-dialog-titlebar');
  $assert_session->assertVisibleInViewport('css', '.ui-dialog .ui-dialog-buttonpane');
}
```

## 2. What the assertions actually measure

**Viewport.** `WebDriverTestBase::initFrontPage()` calls `$this->getSession()->resizeWindow(1024, 768)`
(`core/tests/Drupal/FunctionalJavascriptTests/WebDriverTestBase.php:88-96`, line 95), and
`JSWebAssert` documents "JavaScript tests in the default CI environment use a viewport of 1024x768px"
(`core/tests/Drupal/FunctionalJavascriptTests/JSWebAssert.php:308`). The test never changes that. (In this
core version there is no `DrupalSeleniumWebDriverTestBase` class; the base class is `WebDriverTestBase`,
which drives `DrupalSelenium2Driver`, and the viewport assertions live in `JSWebAssert`, reached through
`$this->assertSession()`.)

**`assertVisibleInViewport()`** (`JSWebAssert.php:326`) does two things:

1. `$node->isVisible()` — Mink `NodeElement::isVisible()`
   (`vendor/behat/mink/src/Element/NodeElement.php:314-316`) delegates to the driver's `isVisible()`
   (`vendor/lullabot/mink-selenium2-driver/src/Selenium2Driver.php:943-946`), which is WebDriver
   "element displayedness" (`vendor/lullabot/php-webdriver/lib/WebDriver/Element.php:23`) — rendered or
   not, **not** in the viewport.
2. `checkNodeVisibilityInViewport()` (`JSWebAssert.php:401`) injects JS that takes
   `node.getBoundingClientRect()` and, for `$corner = FALSE`, requires
   `r.top >= 0 && r.left >= 0 && r.bottom <= window.innerHeight && r.right <= window.innerWidth`
   (lines 463-466).

So a control scrolled out of view still passes step 1 and is caught only by the rect test in step 2.
The assertion does not scroll, focus, or hit-test anything.

**`assertJsCondition()`** (`WebDriverTestBase.php:158-162`) polls the string in the browser for up to
10 s (`Session::wait`) and fails the test if it never becomes true.

**Mink `click()`** (`NodeElement::click()` → `Selenium2Driver::click()`) is a real WebDriver element
click. WebDriver may scroll the target into view before clicking, so a *click on the button pane* would
have been able to hide the original defect; the test correctly uses a geometry assertion for the button
pane instead. The click at line 182 targets `summary`, which is already in view.

**What the base JS does** (why there is a bug at all). On `dialog:aftercreate`,
`dialog.position.js:126-148` (`97c6ff8b`) schedules `resetSize()` once and on
`resize.dialogResize`/`scroll.dialogResize`/`drupalViewportOffsetChange.dialogResize` only. `resetSize()`
converts the `maxHeight: '95%'` default (`dialog.position.js:15`) to pixels and calls
`$element.dialog('option', adjustedOptions)` (`dialog.position.js:117`). jQuery UI treats `maxHeight` as
a size option (`core/assets/vendor/jquery.ui/ui/widgets/dialog.js:100-111`, `_setOptions` at 685-708),
so `_size()` + `_position()` run at that moment, while the dialog is still short: the content element
gets `max-height` (`_size()` at 779, `maxContentHeight` at 806-813) and the dialog is centred on its
**current** height. `.ui-dialog .ui-dialog-content` has `overflow: auto`
(`core/assets/vendor/jquery.ui/themes/base/dialog.css:39,44`). When the `<details>` opens, only CSS
changes: the content box grows up to its `max-height` and the dialog grows downward, but nothing re-runs
`_size()`/`_position()`. The dialog's `top` stays where it was when the dialog was small.

## 3. Requirement-by-requirement verdicts

| # | Requirement | Verdict | Deciding code | Why |
|---|---|---|---|---|
| 1 | Initial dialog fits the viewport | PARTIAL | `ModalRendererTest.php:177` | Asserts the button pane (the dialog's bottom edge) is inside the viewport after AJAX open. Does not assert the `.ui-dialog` box, its top, or its height. A dialog with `top < 0` but a visible button pane would pass. |
| 2 | The details element actually opens | PARTIAL | `ModalRendererTest.php:182` | A real click on `.ui-dialog summary` is performed and would fail loudly if the summary did not exist (null click / intercepted click). But no assertion checks `details.open` before or after, so an interaction that silently does nothing (a JS handler that calls `preventDefault()`, or a fixture that ships `#open => TRUE`) leaves the dialog short and **passes**. |
| 3 | Expanded content exceeds the available dialog height | PARTIAL | `TestController.php:89,95` | Only the fixture guarantees this (`#open => FALSE` + a 2000 px div). The test never measures content height, scroll height, or the dialog's cap. If the fixture height or the `maxHeight` default changed, the test could stop discriminating without failing. |
| 4 | Titlebar and action buttons remain reachable | PARTIAL | `ModalRendererTest.php:187-188` | Geometric visibility only (`r.top >= 0 && r.bottom <= ly`, `r.left >= 0 && r.right <= lx`). Not focusability, not tab order, not `elementFromPoint()` hit-testing, and no button is activated. The titlebar assertion is **not discriminating**: on pristine core the titlebar is at the top of the still-centred dialog (`top ≈ 300 px`) and passes even while the bottom of the dialog is off screen. |
| 5 | Content area permits scrolling | NOT MET | — | Nothing asserts `.ui-dialog-content` scrolls (`scrollHeight > clientHeight` / `overflow-y`). A "fix" that clipped the content (`overflow: hidden`) and kept the box short would pass the geometry checks in row 4 while making the tall content unreachable. |
| 6 | AJAX insertion covered | PARTIAL | `TestController.php:286-308` | The dialog body arrives by AJAX (the link is `use-ajax`), so AJAX insertion of the *initial* body is exercised. Growth caused by AJAX into an **already open** dialog — the second half of the issue summary, and what the MR author says the fix does not handle ("works only for some use-cases. Not for ajax stuff.", issue comment #32) — is not exercised at all. |
| — | No uncaught JS errors | MET (implicit) | `WebDriverTestBase::failOnJavaScriptErrors()` | A `#[PostCondition]` fails the test on any window `error` event recorded by `js_testing_log_test`. This covers a throwing fix but not console warnings, and the assertion is not part of the test method. |

## 4. Does the test fail on pristine core + fixture? — reasoned verdict: **YES**

The test-only fixture (routing + controller + test method) contains no production fix, so on
`97c6ff8b2534` the page and the interaction run, and only the geometry is wrong. The mechanism from §2
gives, with `H = window.innerHeight ≈ 768`:

- at AJAX open, `resetSize()` sets `dialog option maxHeight = 0.95 × H ≈ 729 px`, jQuery UI caps
  `.ui-dialog-content` at `729 − (titlebar + button pane + padding)` (roughly 620 px), and centres the
  still-short dialog: `top₀ = (H − dialogHeight₀) / 2 ≈ 300 px`;
- opening the `<details>` grows the content to its cap, so the dialog's outer height becomes ≈ 729 px but
  `top` is still `top₀ ≈ 300 px`;
- therefore `rect.bottom ≈ 300 + 729 = 1029 > 768 = window.innerHeight`.

`assertJsCondition` at line 183-186 fails on pristine core because `rect.bottom <= window.innerHeight`
is false; the later button-pane `assertVisibleInViewport` at line 188 would also fail (`r.bottom <= ly`)
but is not reached, because the first failure aborts the method. The titlebar check at line 187 passes on
both sides.

With the MR's `ResizeObserver`, the observer fires when the content box grows, the debounced `resetSize()`
re-applies `maxHeight`, and jQuery UI's `_position()` runs again against the now-tall dialog:
`top = (768 − 729) / 2 ≈ 19 px`, so `bottom ≈ 748 < 768` and all three assertions pass.

The margin is large (the pristine overflow is ~250-270 px; the corrected dialog has ~20 px of headroom),
so ordinary differences in titlebar/button-pane metrics or headless viewport bookkeeping do not flip the
result. The test would pass on pristine only if the expanded dialog were at most
`H − top₀ ≈ 459 px` tall (e.g. a `maxHeight` default below ~60vh, or an un-centred/top-anchored dialog),
neither of which is true at `97c6ff8b2534`.

**Confidence: high, not run-confirmed.** This is exactly what the §7 commands are for. The one observation
that would change the verdict is a real Before run that reports `testModalContentGrows` as OK; if that
happens, measure `rect.top`, `rect.bottom`, the dialog's inline `top`/`height`, `.ui-dialog-content`'s
`clientHeight`/`scrollHeight`/computed `max-height` and `overflow-y`, and `drupalSettings.dialog.maxHeight`
before concluding anything (see AGENTS.md rule 9: find the cause first).

## 5. What the test does not cover

1. **AJAX growth in an open dialog** — the reported `ajax` half of the issue and the MR's own admitted
   limitation (comment #32). No second request, no content replacement after positioning.
2. **Other content-growth triggers** — the issue's real paths (Views UI translate dialog, Media library
   widget with `image_widget_crop`, Field UI "Set default value", duplicate #3640810). The fixture is a
   synthetic 2000 px div, not a form that changes height.
3. **Content reachability** — scrolling, focus into the tall content, keyboard access to the buttons. A
   clipping fix would pass the current geometry checks.
4. **Button operability** — no focus or activation of the "OK" button; the button pane is only shown to
   have a rect inside the viewport.
5. **Viewport variants** — one implicit 1024×768 viewport. The defect is height-dependent (the issue notes
   small viewports can behave differently; comment #20 requires initial content shorter than the viewport).
   No assertion pins the property that makes the test discriminating (`maxHeight: 95%` with a centred,
   initially short dialog), so a future change to either default can turn the test into a green
   non-regression test without anyone noticing.
6. **`autoResize: false`** — the production change sits inside the `settings.autoResize` branch; no test
   proves dialogs that opt out are untouched.
7. **Lifecycle** (observer teardown, close/reopen, nested dialogs, jQuery data cleanup) — source concerns
   for the code review, only indirectly covered here by `failOnJavaScriptErrors()`.
8. **Narrower/assistive coverage** — no forced colours, zoom, screen-reader or keyboard-only pass; that is
   the separate Playwright/AT evidence, not this PHPUnit test.
9. **The assertion labels** — the titlebar check cannot fail on pristine core, so it reads as a stronger
   claim ("titlebar remains reachable") than it is.

## 6. Test-only interdiff: not needed for this run, but a small hardening is recommended

No test-only interdiff is needed to use the MR test as the regression test for this issue: as written it
is expected to fail on pristine core + fixture and to pass with the MR's JS change. The delivered
`3466040-test-support.patch` is therefore an exact copy of the MR's three test/fixture hunks, not a
modified test.

Two false-pass doors remain, and both would be closed by one assertion each. The smallest change is the
`details.open` assertion after the click; the second hunk also stops a clipping "fix" from passing. This
is a **proposal for the MR, not applied to the delivered patch**, and it applies to the MR post-image
(blob `1dfb9f2…`), not to base `97c6ff8b2534`:

```diff
diff --git a/core/modules/system/tests/src/FunctionalJavascript/ModalRendererTest.php b/core/modules/system/tests/src/FunctionalJavascript/ModalRendererTest.php
index 1dfb9f2..695135d 100644
--- a/core/modules/system/tests/src/FunctionalJavascript/ModalRendererTest.php
+++ b/core/modules/system/tests/src/FunctionalJavascript/ModalRendererTest.php
@@ -175,17 +175,29 @@ class ModalRendererTest extends WebDriverTestBase {
     $this->clickLink('Details modal!');
     $assert_session->waitForElementVisible('css', '.ui-dialog');
     $assert_session->assertVisibleInViewport('css', '.ui-dialog .ui-dialog-buttonpane');
+    // The tall content must be hidden until the details element is opened, so
+    // that the growth happens after the dialog has been positioned.
+    $this->assertJsCondition('document.querySelector(".ui-dialog details").open === false');
 
     // Opening the details element makes the content much taller than the
     // viewport. The dialog must shrink its content area and keep the button
     // pane inside the viewport.
     $page->find('css', '.ui-dialog summary')->click();
+    $this->assertJsCondition('document.querySelector(".ui-dialog details").open === true');
     $this->assertJsCondition('(() => {
       const rect = document.querySelector(".ui-dialog").getBoundingClientRect();
       return rect.top >= 0 && rect.bottom <= window.innerHeight;
     })()');
     $assert_session->assertVisibleInViewport('css', '.ui-dialog .ui-dialog-titlebar');
     $assert_session->assertVisibleInViewport('css', '.ui-dialog .ui-dialog-buttonpane');
+    // The dialog can only stay in the viewport if the content area scrolls.
+    // Clipping the content would also satisfy the geometry checks above.
+    $this->assertJsCondition('(() => {
+      const content = document.querySelector(".ui-dialog .ui-dialog-content");
+      const overflowY = getComputedStyle(content).overflowY;
+      return content.scrollHeight > content.clientHeight &&
+        (overflowY === "auto" || overflowY === "scroll");
+    })()');
   }
 
   /**
```

Order matters when adding these: the `open === false` precondition must be before the click, the
`open === true` assertion immediately after it, and any content-scroll assertion after the dialog has
settled (i.e. after the existing `assertJsCondition` on the dialog rect). If the MR author prefers one
line only, use the `details.open === true` assertion: it is the one that prevents a green result when the
interaction did not happen.

## 7. How to run it on both lab sides

Environment identity: variant `3466040-pinned` (`tools/compare/variants.json`), Before env
`baseline-3466040` at `97c6ff8b2534` plus test-support, After env `issue-3466040` at `97c6ff8b2534` plus
the full MR patch (`branches/3466040-dialog-buttoninputs-not.patch`). Both must be the same core commit;
the only difference must be `core/misc/dialog/dialog.position.js` (the three test/fixture files are
identical on both sides — verified byte-for-byte in §8).

### 7a. Reproducible route (recommended): declare the test support on the Before side

The current variant declares no `before.patches`, so Before does not contain the test/fixture. Add the
test-only change to the variant as a declared test-support patch (the same pattern as #3604037, allowed
by AGENTS.md rule 1). Only the variant owner should edit `tools/compare/variants.json`; the entry is:

```json
"before": {
  "env": "baseline-3466040",
  "patches": [
    "reports/issues/3466040/branches/3466040-test-support.patch"
  ]
}
```

If the pinned pair is rebuilt, `3466040-latest` inherits the `before.patches` entry (it `extends`
`3466040-pinned`). The test/fixture files may have moved on latest `main`; run
`node tools/compare/setup.mjs 3466040-latest --check-patches` before building it, and if the patch no
longer applies, override `before` (not only `before.patches`) on the `3466040-latest` variant so the
pinned declaration does not break the latest comparison.

Then, from the repository root:

```bash
node tools/compare/setup.mjs 3466040-pinned --check-patches
node tools/compare/setup.mjs 3466040-pinned
node scripts/lab-env.mjs start 3466040-pinned
node scripts/try-tests.mjs 3466040-pinned --existing core/modules/system/tests/src/FunctionalJavascript/ModalRendererTest.php --report reports/issues/3466040/phpunit/3466040-phpunit.md
```

What the last command does: runs the existing `ModalRendererTest` class on both sides, compares the
per-method results, and writes a draft report. Expected result: Before `testModalContentGrows` **FAIL**
(`JavaScript condition met:` from `assertJsCondition`, or `Element is not visible in the viewport.` from
the button-pane assertion, depending on which runs first after the click), all other methods OK; After
every method OK. `try-tests.mjs` refuses to run a Before that has undeclared tracked changes, which is
why 7a needs the variant entry.

### 7b. Direct PHPUnit on each side, filter one method

If the checkouts are already in the state described above (Before with test-support declared, After with
the MR patch), run from each checkout directory:

```bash
cd envs/baseline-3466040
ddev phpunit core/modules/system/tests/src/FunctionalJavascript/ModalRendererTest.php --filter testModalContentGrows
cd ../../envs/issue-3466040
ddev phpunit core/modules/system/tests/src/FunctionalJavascript/ModalRendererTest.php --filter testModalContentGrows
```

`ddev phpunit` sources `core/.env` (needs the Selenium Chrome container) and passes its arguments to
`phpunit -c core` (`.ddev/commands/web/phpunit:18-21`), so the test path and `--filter` reach PHPUnit
unchanged. Keep the logs under `reports/issues/3466040/phpunit/`. Expected: Before FAIL, After OK. Then
repeat with the whole class on both sides (drop `--filter`) to show the `linksDisplay()` addition did not
regress the existing methods.

### 7c. One-off fallback without touching `variants.json`

Temporarily apply only the test-support patch to the Before checkout, run, then reverse it. This is a
declared-exception-style test-support application, must be reversed immediately, and must not be used as
evidence of a pristine Before beyond the test/fixture files:

```bash
cd envs/baseline-3466040
git apply ../../reports/issues/3466040/branches/3466040-test-support.patch
ddev phpunit core/modules/system/tests/src/FunctionalJavascript/ModalRendererTest.php --filter testModalContentGrows
git apply -R ../../reports/issues/3466040/branches/3466040-test-support.patch
git status --short
```

`git status --short` must print nothing afterwards. Do not use `scripts/try-tests.mjs` in this state: it
flags a Before with tracked changes and no declared `before.patches`.

### 7d. Optional control run

To show the test is sensitive to the JS change alone (not to the fixture), the After env can be reduced to
base + test-support by reversing just the production hunk of the MR patch; the result should fail exactly
like Before:

```bash
cd envs/issue-3466040
git apply -R --include=core/misc/dialog/dialog.position.js ../../reports/issues/3466040/branches/3466040-dialog-buttoninputs-not.patch
ddev phpunit core/modules/system/tests/src/FunctionalJavascript/ModalRendererTest.php --filter testModalContentGrows
git apply --include=core/misc/dialog/dialog.position.js ../../reports/issues/3466040/branches/3466040-dialog-buttoninputs-not.patch
git diff --stat -- core/misc/dialog/dialog.position.js
```

The last command must show `core/misc/dialog/dialog.position.js` as modified again (the After checkout is
patched by design, so `git status --short` is not expected to be empty here). This is a diagnostic, not
the lab's After evidence; restore the JS change immediately (AGENTS.md rule 1 applies in spirit — the
After checkout must end up as the variant declares it).

## 8. Delivered test-support patch: provenance and verification

`reports/issues/3466040/branches/3466040-test-support.patch` contains only the `routing.yml`,
`TestController.php` and `ModalRendererTest.php` hunks, in that order, taken verbatim from the MR patch
(the `dialog.position.js` section is dropped). It is byte-identical to the MR tip diff for those three
files:

```
git --git-dir=envs/core.git diff --full-index \
  97c6ff8b2534 refs/lab/issue-3466040/3466040-dialog-buttoninputs-not -- \
  core/modules/system/tests/modules/dialog_renderer_test/dialog_renderer_test.routing.yml \
  core/modules/system/tests/modules/dialog_renderer_test/src/Controller/TestController.php \
  core/modules/system/tests/src/FunctionalJavascript/ModalRendererTest.php
diff of that output against the patch: no differences
```

Verification that it applies to the declared base (git plumbing, index-only, no checkout touched):

```
GIT_INDEX_FILE=/tmp/idx git --git-dir=envs/core.git read-tree 97c6ff8b2534
GIT_INDEX_FILE=/tmp/idx git --git-dir=envs/core.git apply --cached --check reports/issues/3466040/branches/3466040-test-support.patch
exit 0
```

The three resulting blobs equal the MR post-image blobs exactly:

```
100644 4a5273...  core/modules/system/tests/modules/dialog_renderer_test/dialog_renderer_test.routing.yml
100644 3cb574...  core/modules/system/tests/modules/dialog_renderer_test/src/Controller/TestController.php
100644 1dfb9f...  core/modules/system/tests/src/FunctionalJavascript/ModalRendererTest.php
```

Equivalence to the MR minus the production change: base+test-support tree `7ba5abf7e1995ebe41cb29c3a90363cd378e01f3`
vs base+full-MR tree `8f671c86c6d3843260c39de2c9b05f84e4f281ff` differ in exactly one path,
`core/misc/dialog/dialog.position.js`:

```
M core/misc/dialog/dialog.position.js
```

`sha256(3466040-test-support.patch) = 262dd0fc8d71ec586f3f85ab5f8c2f2fb8de9bf071721975b4b002d871674222`.
The full MR patch `3466040-dialog-buttoninputs-not.patch` itself equals
`git --git-dir=envs/core.git diff --full-index 97c6ff8b2534 refs/lab/issue-3466040/3466040-dialog-buttoninputs-not`.

## 9. Recommendation

1. **Keep the MR test.** As written it is a real regression test for the positioning defect: on pristine
   core + fixture the expanded dialog's bottom edge lands below `window.innerHeight` and
   `assertJsCondition`/`assertVisibleInViewport` fail; with the `ResizeObserver` change the dialog is
   re-centred and they pass. No change to the test is required for the Lab run.
2. **Do not add the production fix to the Lab Before side.** Use the delivered test-support patch on
   Before so the only difference between the sides is `dialog.position.js` (§7a).
3. **Ask for one small hardening in the MR** (not blocking, and it is the author's call): assert
   `details.open` before and after the click, and optionally that `.ui-dialog-content` is scrollable —
   §6. Without it, a silently no-op interaction or a content-clipping "fix" can pass the test.
4. **Record the gap** that the test does not cover AJAX growth in an open dialog, which the MR author
   himself reports as not fixed (issue comment #32). The Playwright harness for this issue should test
   that path on both sides; this PHPUnit test cannot.
5. **Run 7a on the built pair and attach the output** (`reports/issues/3466040/phpunit/`) before any of
   this is quoted as evidence. Until then the verdict in §4 is a source-based prediction and must be
   labelled as such.

## 10. Not verified

- No run was made: `envs/baseline-3466040` and `envs/issue-3466040` did not exist at review time and a
  build was running. The §4 verdict is reasoned, not observed.
- Chromium/Selenium version, `window.innerHeight` in headless mode and the exact titlebar/button-pane
  pixel heights were not measured; the §4 conclusion does not depend on them (the overflow margin is
  ~250 px), but the exact failure line (which assertion fails first) and the exact rects will be in the
  run log.
- The proposed interdiff in §6 was generated against the MR post-image and was not applied to any patch
  file; it is a proposal only.
- Whether the MR's `ResizeObserver` implementation itself is correct or complete is the code review's
  scope, not this test review's.
- No manual keyboard, screen-reader, zoom or forced-colours evidence exists for this issue yet; this
  test says nothing about them.
