# Upstream tests for #3534229 — where a focused assertion belongs

**DRAFT — advice only. No core test was written or run for this report.**

- Issue: [#3534229 CKEditor 5 toolbar-configuration icons are invisible in forced-colors mode](https://www.drupal.org/project/drupal/issues/3534229)
- Pinned core: `8a7df6cc3e69b6b5d427cb25ce8f66dda8393c29` (`core.git`, subject: *fix: #2778345 Views argument validators…*)
- UI under discussion: `/admin/config/content/formats/manage/full_html` → *Toolbar configuration* fieldset (manual reproduction URL; tests use the `ckeditor5` format they create, see §1.4)
- Report prepared: 2026-11-27 by the delegated agent `tests-scout`
- Fix under test: **no patch or MR exists yet** in the Lab (`reports/issues/3534229/branches/` is empty; `intake/BRIEF.md`: 8 comments, no merge request). This report therefore advises on *where* an assertion belongs and how it could be written; code sketches are conditional on the final CSS shape (mask + system colour, §3). No test should be merged before the actual patch is known.

All line numbers below refer to blobs at the pinned commit, read with
`git --git-dir=/Users/mgifford/drupal-core-lab/envs/core.git show <commit>:<path>`; no working-tree checkout was used.

---

## 0. Method

`git --git-dir=… grep -n` at the pinned commit for the terms the task named: `ckeditor5-toolbar`, `toolbar-button`,
`ckeditor5-toolbar-button`, `Drupal.theme.ckeditor5Button`, `ckeditor5Admin`, `Available buttons`, `Active toolbar`,
`Toolbar configuration`, plus the forced-colors vocabulary in §2. Files were then read in full or in the relevant ranges.
Commands are listed in the appendix.

What exists, in one sentence: **the toolbar app is heavily tested for behaviour (keyboard move, AJAX, plugin settings,
validation) and not at all for appearance** — no test on the pinned commit mentions the button CSS class, the toolbar
stylesheet, an icon file, or a computed style of a toolbar button.

---

## 1. Existing tests that exercise the toolbar-configuration UI

### 1.1 Rendered markup and JS sources (what a test would be asserting against)

| Source | Lines | What it contains |
|---|---|---|
| `core/modules/ckeditor5/templates/ckeditor5-settings-toolbar.html.twig` | 13–21 | The fieldset: `<legend id="ckeditor5-toolbar-configuration">Toolbar configuration</legend>`, `#ckeditor5-toolbar-description`, and the empty JS mount point `<div id="ckeditor5-toolbar-app">` |
| `core/modules/ckeditor5/src/Plugin/Editor/CKEditor5.php` | 287–294 | No-JS fallback: `#ckeditor5-toolbar-buttons-available` container (290) holding `Json::encode(getToolbarItems())` (292) — all toolbar items as markup, even without JS |
| same | 302–312 | `#ckeditor5-toolbar-buttons-selected` textarea (307), the `editor[settings][toolbar][items]` JSON value |
| `core/modules/ckeditor5/js/ckeditor5.admin.js` | 953–978 | `Drupal.theme.ckeditor5Button` — builds `<li class="ckeditor5-toolbar-item ckeditor5-toolbar-item-${id}">` containing `<span class="ckeditor5-toolbar-button ckeditor5-toolbar-button-${id}">` with only a `visually-hidden` label inside |
| same | 1006–1028 | `"Available buttons"` label (1012), `"Button divider"` (1017), `"Active toolbar"` (1025) |
| `core/modules/ckeditor5/css/toolbar.admin.css` | 30–52, 55–58 | Base button box: `min-width/height: 36px`, `background-color: #eee`, `background-repeat/position/size` (49–52); the `:focus`/`:hover` colours (55–58). **No icon is painted here.** |
| `core/modules/ckeditor5/css/*.admin.css`, `special-characters.css`, `remove-format.css` | see §4.2 | Per-item icon paint: 26 items use `background-image: url(../icons/*.svg)`; 3 items are text (heading, style, textPartLanguage) |
| `core/modules/ckeditor5/ckeditor5.libraries.yml` | 120–127 and per-plugin entries 133–260 | `internal.admin` attaches `css/toolbar.admin.css`; each plugin's `admin_library` attaches its icon CSS. `CKEditor5PluginManager::getAdminLibraries()` returns **all** admin libraries to the format form (`CKEditor5.php:253`), so every icon rule is on the page for both the available and the active list |

### 1.2 Tests that assert on the configuration UI (`core/modules/ckeditor5/tests/src/FunctionalJavascript/`)

| File / method | Lines | What it asserts | Icons/CSS? |
|---|---|---|---|
| `AdminUiTest::testSettingsOnlyFireAjaxWithCkeditor5` | 32–88 (+ `assertNoAjaxRequestTriggered` 89–141) | Format form AJAX behaviour when the editor is switched/validated | no |
| `AdminUiTest::testUnavailableFiltersHiddenWhenSwitching` | 145–156 | Filter settings hidden for non-CKEditor editors | no |
| `AdminUiTest::testFilterCheckboxesToggleSettings` | 160–182 | Filter settings vertical tab visibility after AJAX | no |
| `AdminUiTest::testImageUploadSettingsAreValidated` | 186–230 | Waits for `.ckeditor5-toolbar-item-drupalInsertImage` (194), sends `ArrowDown` (195), then asserts image-upload settings form, validation error (216), and that a second toolbar move re-validates (212, 223); saves | markup only |
| `AdminUiTest::testMessagesDoNotAccumulate` | 235–274 | Toolbar item wait/`ArrowDown` (243–244), source-editing tag validation message count | markup only |
| `AdminUiTest::testPluginSettingsFormSection` | 278–318 | **Closest existing test to the toolbar UI.** `fieldValueEquals('editor[settings][toolbar][items]', '["heading","bold","italic"]')` (286); toolbar item removal adds/removes the heading plugin form (291, 295–298); enabling source-editing shows its form (301, 305); filter-dependent plugin form appears (308, 316) | markup only; **no styles, no icons** |
| `AdminUiTest::testLanguageConfigForm` | 322–370 | Toolbar item wait/`ArrowDown` (331–332, 339–340, 354), language-plugin warning, config form presence/removal (361, 364, 368) | markup only |
| `CKEditor5Test::testHeadingsPlugin` | 82–153 | Opens `admin/config/content/formats/manage/ckeditor5` (87) but asserts the *editor's* heading dropdown afterwards | no |
| `CKEditor5Test::testLanguageOfPartsPlugin` (+ helpers `languageOfPartsPluginInitialConfigurationHelper` 191–226, `…ConfigureLanguageListHelper` 230–245, `…TestHelper` 249–275) | 157–187 | Toolbar item wait/`ArrowDown` (194–195, 202–203, 217) | markup only |
| `CKEditor5Test::enableDisabledToolbarItem` (helper) | 329–335 | The canonical toolbar-move assertion: item exists in `.ckeditor5-toolbar-disabled` (331), `ArrowDown` (332), item gone from disabled (333), present in `.ckeditor5-toolbar-active` (334) | markup only |
| `CKEditor5Test::testActiveTabsMaintained` | 340–475 | Uses `enableDisabledToolbarItem()` (385, 460); asserts vertical tab titles/active tab after AJAX (462–474) | no |
| `CKEditor5Test::testEditorFileReferenceIntegration` | 479–533 | Toolbar item wait/`ArrowDown` (484–485), then editor behaviour | markup only |
| `CKEditor5AllowedTagsTest::testImgAddedViaUploadPlugin` | 168–236 | Toolbar item wait/`ArrowDown` (183–184), item now in `.ckeditor5-toolbar-active` (190), remove again (229–230) | markup only |
| `CKEditor5AllowedTagsTest::testAllowedTags` | 240–340 | Toolbar item interactions (264–265, 289–290) plus filter_html updates | markup only |
| `CKEditor5AllowedTagsTest::testFullHtml` | 423–~533 | Toolbar item interactions on `full_html`/`basic_html` (475–476, 491–492) | markup only |
| `LanguageTest::test` (+ helper) | 41–69 | Waits for `.ckeditor5-toolbar-item-sourceEditing` (52–53) and arbitrary `$toolbar_item_name` (68–69), moves it into the toolbar | markup only |
| `StyleTest::testStyleSettingsForm` / `testStyleFunctionality` | 46–47, 55 / 127–128 | Waits for and moves toolbar items (style, undo, sourceEditing) | markup only |
| `SourceEditingTest::testSourceEditingSettingsForm` | 48–49 | Waits for and moves `.ckeditor5-toolbar-item-sourceEditing` | markup only |
| `JSTranslationTest::test` | 51–54 | Waits for and moves `.ckeditor5-toolbar-item-drupalMedia` | markup only |
| `ImageTest::testImageSettingsForm` | 39, 46 | Moves `.ckeditor5-toolbar-item-drupalInsertImage` | markup only |

### 1.3 The editor module's own admin test

| File / method | Lines | What it asserts |
|---|---|---|
| `core/modules/editor/tests/src/FunctionalJavascript/EditorAdminTest::testEditorCreation` | 85–99 | When CKEditor 5 is chosen, the app container `ul.ckeditor5-toolbar-available__buttons` appears (91) and disappears when switching editor (94) — the only assertion in core that a toolbar-app *container* is rendered; still no icon/CSS content |

### 1.4 No existing test asserts anything about the icons

Searches that return nothing in test code (pinned commit):

| Search | Result |
|---|---|
| `ckeditor5-toolbar-button` in tests | none (only `ckeditor5.admin.js:344,348,355,971` and the CSS files) |
| `toolbar.admin.css` outside `ckeditor5.libraries.yml:125` | none |
| `background-image` / `mask-image` in any `*Test.php` | only unrelated XSS-filter strings (`editor/…/StandardTest.php:475–567`) |
| `.svg`, `icon`, `computed` in `ckeditor5/tests/src` | only unrelated hits (`ImageTest` SVG upload, `CKEditor5OffCanvasTest` computed colours, `SourceEditingEmptyElementTest` class names) |

**Consequence:** the reporter's barrier (icons invisible in forced-colors) has no upstream test to extend *for appearance*.
Behavioural coverage is good; the gap is exactly the painting layer of `.ckeditor5-toolbar-button`.

Also note for test authoring: BrowserTestBase installs the `testing` profile (`core/tests/Drupal/Tests/BrowserTestBase.php:106`), which has **no `full_html` format**. Tests must keep using the existing helpers — `CKEditor5TestBase::addNewTextFormat()` /
`createNewTextFormat()` then `admin/config/content/formats/manage/ckeditor5` — not the issue's manual URL.
The toolbar CSS is module CSS attached at `theme` weight (`ckeditor5.libraries.yml:120–127`), so it loads under
`CKEditor5TestBase`'s `stark` theme; no `default_admin` dependency is needed.

---

## 2. Is there any core test/assertion style for forced-colors CSS?

### 2.1 CSS: the technique is already all over core (no test follows it)

`git grep -l forced-colors` at the pinned commit matches 36 `*.pcss.css` sources **plus their 36 compiled
`*.css` counterparts** (excluding `core/assets/vendor/`), plus the CKEditor 5 vendor bundle (`core/assets/vendor/ckeditor5/ckeditor5.css`,
`ckeditor5.umd.js`). Representative core-authored examples:

| File | Lines | Technique |
|---|---|---|
| `core/themes/default_admin/css/components/form--checkbox-toggle.pcss.css` | 54–55 | `@media (forced-colors: active) { background-color: CanvasText; }` |
| `core/themes/default_admin/css/_variables/variables-color-semantic.pcss.css` | 128–130 | `@media (forced-colors: active) { --admin-color-icon: CanvasText; }` |
| `core/modules/navigation/components/toolbar-button/toolbar-button.pcss.css` | 53, 104, 263–273, 280–287 | system colours `canvasText` / `buttonText` / `linkText` for SVG `fill`/`stroke` |
| `core/misc/dialog/off-canvas/css/form.pcss.css` | 122 | forced-colors override |
| `core/misc/components/tabledrag.module.css`, `core/modules/layout_builder/css/off-canvas.pcss.css` | — | same pattern |

So a forced-colors branch in a core stylesheet is normal, reviewed practice. What is absent is any test that the branch
exists or has effect.

### 2.2 Tests: the vocabulary is absent from PHP and from the JS test suites

| Search (pinned commit) | Result |
|---|---|
| `forced-colors` / `forced_colors` in `*.php` | **0 matches** |
| `prefers-contrast` anywhere in `core/` | **0 matches** |
| `mask-image` in `*.php` | **0 matches** |
| `CanvasText` | only authored CSS (variables, checkbox toggle) — never in a test |
| `color-scheme` in `*.php` | **0 matches** |
| `cssRules` / `styleSheets` in `core/tests/` or module tests | **0 matches** |
| `@media` asserted in any `*Test.php` | **0 matches** |
| `getComputedStyle` in PHP tests | exactly one file: `CKEditor5OffCanvasTest.php:50,54` (see §2.3) |
| Playwright in core | **none** — no `core/tests/playwright`, no Playwright dependency; `core/package.json:20` has `test:nightwatch`, dependency `nightwatch ^3.16.0` (line 60) |

### 2.3 Closest existing precedent (this is what a new assertion would imitate)

1. **Computed-style assertion in FunctionalJavascript** — `core/modules/ckeditor5/tests/src/FunctionalJavascript/CKEditor5OffCanvasTest::testOffCanvasStyles`
   (31–56): `evaluateScript("window.getComputedStyle(document.querySelector('.ck.ck-toolbar')).backgroundColor")`
   (50) then `assertEquals('rgb(255, 255, 255)', …)` (51); same for `.ck-content` (54–55).
   This is the established pattern for "a CSS rule produced this computed value".
2. **CSS-driven visibility assertion** — `core/tests/Drupal/FunctionalJavascriptTests/Components/ComponentRenderTest::testCssLibraryAttachesCorrectly`
   (34–43): comment "Opacity is set to 0 in the CSS file" and `assertFalse($wrapper->isVisible())`, i.e. asserting a
   stylesheet's effect through Mink rather than string-matching CSS.
3. **Kernel/library-level stylesheet test** — `core/modules/ckeditor5/tests/src/Kernel/CKEditor5StylesheetsTest`
   (46–81) asserts the *paths* of theme `ckeditor5-stylesheets`, not any CSS content.

There is **no** PHPUnit test in core that parses an authored `.css` file and asserts a declaration. The only CSS-reading
PHPUnit tests are asset optimiser tests (`core/tests/Drupal/Tests/Core/Asset/CssOptimizerUnitTest.php`,
`CssCollectionOptimizerLazyUnitTest.php`) that assert URL-rewriting/minification against fixtures — they never look at
authored declarations.

### 2.4 What core's JS test infrastructure can actually set

| Layer | Location | Can it emulate `forced-colors`? |
|---|---|---|
| PHP FunctionalJavascript (Mink → `DrupalSelenium2Driver` → php-webdriver → Selenium → Chrome) | `core/tests/Drupal/FunctionalJavascriptTests/WebDriverTestBase.php` | **No capability.** `initMink()` hardcodes `['chrome', ['goog:chromeOptions' => ['w3c' => TRUE]], 'http://localhost:4444']` (line 59), so a subclass cannot set capabilities by property. Driver args can be extended by overriding `getMinkDriverArgs()` (declared at 136) — precedent `core/tests/Drupal/Tests/PerformanceTestTrait::doGetMinkDriverArgs()` (93–113) adds `goog:loggingPrefs`/`perfLoggingPrefs`. That hook allows extra *options*, but there is no documented Chrome option that turns on the `forced-colors` media feature. Raw session access exists (`CKEditor5TestBase::triggerKeyUp()` uses `getWebDriverSession()->execute($options)`, 120–136), so a CDP helper is conceivable, not present. |
| CI environment | `.gitlab-ci.yml` | Uses Selenium service `selenium/standalone-chrome:$SELENIUM_CHROME_TAG` = `155.0` (93, 142–144) and a global `MINK_DRIVER_ARGS_WEBDRIVER` (91). Chrome args for Nightwatch come from `DRUPAL_TEST_WEBDRIVER_CHROME_ARGS` (`core/tests/Drupal/Nightwatch/nightwatch.conf.js:72`; `.env.example:47`). Both are **global**, not per test. |
| Nightwatch (JS, axe) | `core/tests/Drupal/Nightwatch/` | Runs axe only (`nightwatch.conf.js:62–75`: `browserName: chrome`, `goog:chromeOptions.args` from env). `a11yTestAdmin.js` already visits the text-format page — `path: '/admin/config/content/formats/manage/restricted_html'` (30–31) — at 415×823, and runs `axeRun('body')` (79). axe-core does **not** evaluate forced-colors rendering, and Nightwatch can't set media features. |
| Playwright | — | Not used by core. |
| CSS build/lint gate | `.gitlab-ci.yml:832–833` (`yarn run build:css --check`, `yarn run lint:css`), `core/scripts/css/check.js` | Only checks `.pcss.css` → `.css` consistency and stylelint rules. The CKEditor 5 toolbar CSS files are hand-written plain `.css` (there is **no** `.pcss.css` in `core/modules/ckeditor5/css/`), so `build:css --check` does not gate them; stylelint would (`.stylelintrc.json:23–26` has `media-feature-name-no-unknown` with only `prefers-reduced-motion` ignored — `forced-colors` is known to stylelint and already used 36× so it passes). Stylelint checks syntax, not effect. |

**Answer:** core has no forced-colors test precedent and no built-in way to enable the media feature. The only route is an
emulation command against Chrome (CDP `Emulation.setEmulatedMedia` with a `forced-colors` feature), which is what
Chromium's own DevTools/forced-colors tooling uses (see the Chromium mapping described in the
[Chromium source](https://chromium.googlesource.com/chromium/src/+/b7d8598dd729cffbbdeda6fde7b62c2783564d77);
WebDriver BiDi is still standardising a dedicated command — [w3c/webdriver-bidi#905](https://github.com/w3c/webdriver-bidi/pull/905)).
ChromeDriver/Selenium expose CDP over an endpoint that php-webdriver wraps as `executeCdpCommand`
([php-webdriver#832](https://github.com/php-webdriver/php-webdriver/pull/832)); whether that is reachable through the
`lullabot/*` forks core uses is **unverified** (§5).

A CLI-flag shortcut does not exist in practice: my ad-hoc probe of Chromium `--force-high-contrast` on macOS
(Playwright 1.65.0-alpha, Chromium 157.0.8103.15) left `matchMedia('(forced-colors: active)').matches === false`;
it is a Windows-only switch tied to OS high-contrast state. It is not proposed here.

---

## 3. Three concrete options for a core test (with sketches)

The fix is CSS-only. Two things can be asserted cheaply: **the stylesheet contains/activates the forced-colors branch**
(structural) and **the browser computes the intended properties in an emulated forced-colors mode** (behavioural-ish).
The rendered result (pixels) is a third thing core has no machinery for.

### Option A — FunctionalJavascript test asserting computed styles in emulated forced-colors (Chrome only)

Best inserted into the existing `AdminUiTest` (`core/modules/ckeditor5/tests/src/FunctionalJavascript/AdminUiTest.php`),
either as one assertion appended to `testPluginSettingsFormSection` (278–318, page and toolbar app already loaded after
line 286) or as a sibling method in the same class so a failure is easy to read. It must use the Lab-independent
preconditions from §1.4 (`addNewTextFormat()`, `admin/config/content/formats/manage/ckeditor5`).

```php
// AdminUiTest (extends CKEditor5TestBase) — sketch, not proposed verbatim.
public function testToolbarButtonIconsInForcedColors(): void {
  $this->addNewTextFormat();
  $this->drupalGet('admin/config/content/formats/manage/ckeditor5');
  $this->assertNotEmpty($this->assertSession()->waitForElement('css', '.ckeditor5-toolbar-button-bold'));

  // Chrome-only: emulates the media feature (and the palette) the report is about.
  $this->emulateForcedColors('dark');

  $values = $this->getSession()->evaluateScript(<<<JS
  (() => {
    const icon = document.querySelector('.ckeditor5-toolbar-button-bold');
    const style = getComputedStyle(icon);
    // Resolve the system colours in the same emulated state.
    const probe = document.createElement('span');
    probe.style.backgroundColor = 'CanvasText';
    document.body.appendChild(probe);
    const canvasText = getComputedStyle(probe).backgroundColor;
    probe.style.backgroundColor = 'Canvas';
    const canvas = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return { mask: style.maskImage, background: style.backgroundColor, canvasText, canvas };
  })()
  JS);

  // The icon must still be painted: a mask defines the shape, a system colour fills it.
  $this->assertNotSame('none', $values['mask'], 'Toolbar icon must be painted with a mask in forced-colors mode.');
  $this->assertSame($values['canvasText'], $values['background'], 'Toolbar icon must be filled with CanvasText, not Canvas.');
  $this->assertNotSame($values['canvas'], $values['background']);
}
```

Helper sketch (the uncertain part, needs a spike):

```php
protected function emulateForcedColors(string $scheme): void {
  // Chrome only; exact php-webdriver API to be confirmed (see §5).
  $this->getSession()->getDriver()->getWebDriverSession()->executeCdpCommand(
    'Emulation.setEmulatedMedia',
    ['features' => [
      ['name' => 'forced-colors', 'value' => 'active'],
      ['name' => 'prefers-color-scheme', 'value' => $scheme],
    ]]
  );
}
```

Why these assertions are the right ones: the Lab's probe shows that in an emulated forced-colors **dark** palette the
browser forces `background-color` to Canvas (black) and the black SVG glyph disappears, while the *computed*
`background-image` URL is unchanged — so an assertion about `background-image` would pass before and after the fix.
What changes with the likely fix is `mask-image` (not `none`) and `background-color` resolving to `CanvasText`.
Both are readable from `getComputedStyle`, and `getComputedStyle(el, '::before').maskImage` covers a pseudo-element
variant. The probe also shows why a mask alone is not enough: a masked element whose background is forced to Canvas
renders nothing (`p-mask-chip` collapsed to one colour), so asserting the *system colour* matters as much as the mask.

Trade-offs:
- ✅ Cheap marginal cost inside an already-loaded page; deterministic values (system colours in emulation are stable
  black/white); catches removal of the branch, wrong colour (Canvas vs CanvasText), and a mask that is not applied.
- ⚠️ New test-only infrastructure (CDP helper); core currently has none. Chrome-only; needs a `markTestSkipped()` path
  when CDP is unavailable so it does not break other browsers/environments.
- ⚠️ Emulation must be reset (or the test ended) after it, because it persists for the target.
- ⚠️ Proves computed values, not pixels/contrast. It cannot detect e.g. a mask pointing at a missing SVG (that is a
  404, not a computed-style change) — pair with Option B's asset check or keep that in the Lab.
- ⚠️ Still about one icon; parameterise over a couple of representative ids if cheap (`bold` = background-image item,
  `heading` = text/pseudo item, `alignment` = escaped-class item).

### Option B — Kernel/Unit stylesheet assertion (cheap, no browser; asserts text, not rendering)

No browser, no emulation, sub-second. Two layers: (i) the forced-colors branch exists and provides mask + system colour;
(ii) inventory: every core toolbar item is covered.

```php
// Kernel test sketch (e.g. core/modules/ckeditor5/tests/src/Kernel/ToolbarIconCssTest.php).
$module_path = $this->container->get('extension.list.module')->getPath('ckeditor5');
$css = '';
foreach (glob($module_path . '/css/*.css') as $file) {
  $css .= file_get_contents($file);
}

// The branch the fix adds.
$this->assertMatchesRegularExpression('/@media \(forced-colors: active\)\s*\{/', $css);
$this->assertMatchesRegularExpression('/mask-image:\s*url\(\.\.\/icons\//', $css);
$this->assertMatchesRegularExpression('/(background-color|color):\s*CanvasText/i', $css);

// Inventory: 26 of 29 core toolbar items are image-painted (heading/style/textPartLanguage are text).
$items = array_keys($this->container->get('plugin.manager.ckeditor5.plugin')->getToolbarItems());
foreach (array_diff($items, ['heading', 'style', 'textPartLanguage']) as $id) {
  $this->assertStringContainsString('.ckeditor5-toolbar-button-' . $id, $css, "No toolbar icon paint for '$id'.");
}
```

Trade-offs:
- ✅ Cheapest and fully deterministic; no browser, no CI capability question; runs in the Kernel job core already has.
- ✅ Guards the exact regression class the issue describes (branch removed/never added) and new toolbar items without an
  icon rule.
- ❌ Asserts stylesheet **text**, not effect: a valid rule pointing at a deleted/renamed SVG passes; a reformat of the CSS
  can break a brittle regex; a fix using `forced-color-adjust`, text labels, or recoloured inline SVG would not match.
- ❌ Core has **no precedent** for PHPUnit tests reading authored CSS (only asset-optimiser fixtures); reviewers may
  consider it testing implementation rather than behaviour. Keep the regex narrow and comment the intent.
- ❌ Duplicates the plugin-definition → class-name mapping (already implicit in `ckeditor5.admin.js:968–971`).

### Option C — markup-only (Functional without JS, or Kernel form test)

Possible because `CKEditor5.php:287–294` renders `Json::encode(getToolbarItems())` into
`#ckeditor5-toolbar-buttons-available` even without JS:

```php
// Functional (no JS) sketch.
$this->drupalGet('admin/config/content/formats/manage/ckeditor5');
$json = Json::decode($this->assertSession()->elementExists('css', '#ckeditor5-toolbar-buttons-available')->getText());
$this->assertArrayHasKey('bold', $json);
```

Trade-offs:
- ✅ Cheap, deterministic, no browser capability needs; good for "every toolbar item is offered and labelled".
- ❌ **Cannot test the fix at all**: no CSS is evaluated, no pixels exist. Useless as the primary guard for a CSS-only
  change. At most a companion inventory assertion (and it guards the *data*, not the icons).

### Recommendation

1. **Primary: Option A, as one focused assertion inside the existing `AdminUiTest`** (same file, new method or appended
   to `testPluginSettingsFormSection`). This is the only option that observes the browser's forced-colors branch and the
   system-colour resolution that the bug is about, and it follows proven core patterns
   (`CKEditor5OffCanvasTest::testOffCanvasStyles` for computed styles, `CKEditor5TestBase` helpers for setup).
   **Gate it on a spike** that proves CDP can be sent from `DrupalSelenium2Driver` under
   `selenium/standalone-chrome:155` in core CI. If the spike fails, do not ship it.
2. **Fallback/second layer: Option B**, a small Kernel test. It costs almost nothing, needs no capability, and catches
   the most likely future regression (branch deleted, new toolbar item without icon) — but it is a stylesheet-text
   assertion, so it must be small and clearly justified in review.
3. **Option C is not a substitute.** Only worth adding as an inventory assertion if the patch also changes the no-JS
   fallback markup (e.g. adds a visible/visually-hidden text label, or `forced-colors-label` spans as the issue summary
   suggests). A CSS-only patch changes no markup, so there is nothing for a markup test to see.
4. **Keep broad visual coverage in the Lab.** Screenshots in emulated forced-colors light/dark, Windows contrast themes,
   Edge/Chrome on Windows, and pixel-level contrast checks stay Lab evidence (`reports/issues/3534229/fixture/`), not
   core CI.

### What cannot be tested in core CI (state this explicitly in the MR)

- **Rendered forced-colors pixels / real contrast.** Core has no screenshot/visual-regression infrastructure and no
  pixel analysis; `getComputedStyle` returns property values even when the painted result is invisible. The Lab needed
  screenshot colour histograms to show the failure (its probe: the background-image icon area collapses to **1 distinct
  colour in forced-dark** versus 41 in forced-light).
- **Windows contrast themes (Edge or Chrome on Windows).** DevTools/CDP forced-colors emulation uses the browser's
  emulated palette; Chromium's own engineers note there is "no way to simulate" the themes and use `--force-high-contrast`
  for their virtual test suite ([w3c/webdriver-bidi#905](https://github.com/w3c/webdriver-bidi/pull/905)). A test can
  prove the rules apply under emulation; it cannot prove legibility under a user's actual contrast theme.
- **OS-level/user settings, browser extensions, other themes' overrides, dark-mode-only regressions in normal media,
  Firefox/Safari rendering.** None of these are reachable from core's test suite, and the fix's effect in Firefox was not
  even measurable in the Lab (the fixture's Firefox probe crashed).
- **Contrib toolbar items.** Their icons come from contrib `admin_library` CSS; a core test can only cover items defined
  in core's `*.ckeditor5.yml`.

---

## 4. Kernel/Unit tests on the plugin definitions (inventory feasibility)

### 4.1 What exists

| File | Lines / coverage | What it does |
|---|---|---|
| `core/modules/ckeditor5/src/Plugin/CKEditor5PluginManager.php` | `getToolbarItems()` 156–158, `getAdminLibraries()` 163–168 | API to enumerate all toolbar item ids and all admin CSS libraries; `getToolbarItems()` returns the flattened `toolbar_items` maps of every definition |
| `core/modules/ckeditor5/tests/src/Kernel/CKEditor5PluginManagerTest.php` | `toolbarItem` condition cases ~433–569 | Validates definition metadata (conditions), not icons |
| `core/modules/ckeditor5/tests/src/Kernel/ValidatorsTest.php` | 140–230 | Toolbar **item validity** (`foobar` is not valid — 164), not appearance |
| `core/modules/ckeditor5/tests/src/Kernel/ConfigAction/AddItemToToolbarConfigActionTest.php` | 64–92 | Toolbar item **ordering** in saved config |
| `core/modules/ckeditor5/tests/src/Kernel/SmartDefaultSettingsTest.php` | 127, 246–294, 355, 433, 582–685 | Expected default toolbar settings per filter format |
| `core/modules/ckeditor5/tests/src/Kernel/WildcardHtmlSupportTest.php` | 58–90 | Toolbar items + GHS config interplay (alignment) |
| `core/modules/ckeditor5/tests/src/Unit/*PluginTest.php` (`AlignmentPluginTest`, `ListPluginTest`, `HeadingPluginTest`, …) | — | Plugin *config*, never toolbar placement or CSS |

No test calls `getToolbarItems()` or `getAdminLibraries()` from the test suite at all (grep: 0 hits in
`core/modules/ckeditor5/tests`); the only caller of `getAdminLibraries()` is `CKEditor5.php:253`.

### 4.2 Is an "every toolbar item has an icon rule" assertion feasible? Yes — the mapping is currently exact

At the pinned commit, `ckeditor5.ckeditor5.yml` defines **29** toolbar items, and the module's CSS has a matching
`.ckeditor5-toolbar-button-<id>` selector for **all 29**:

- **26 image-painted** items (`background-image: url(../icons/*.svg)`): `undo`, `redo`, `bold`, `italic`, `underline`,
  `code`, `codeBlock`, `strikethrough`, `subscript`, `superscript`, `blockQuote`, `link`, `bulletedList`, `numberedList`,
  `horizontalLine`, `alignment`, `removeFormat`, `insertTable`, `drupalInsertImage`, `indent`, `outdent`, `showBlocks`,
  `fullscreen`, `drupalMedia`, `specialCharacters`, `sourceEditing`.
- **3 text-painted** items (`::before { content: "Heading" / "Style" / "Language" }` plus a border-drawn caret in
  `::after`, with `color: #000`): `heading`, `style`, `textPartLanguage`. These are **not** part of the failure as
  reported (their text colour is forced to `CanvasText` by the browser) and must be excluded from an image-icon assertion.
- Non-item classes that also appear and must not be mistaken for toolbar items: `divider`, `wrapping`, and the four
  escaped alignment variants `.ckeditor5-toolbar-button-alignment\:left|right|center|justify` (which are CJK/emoji-style
  aliases used by `AlignmentPlugin`; the plain `.ckeditor5-toolbar-button-alignment` rule is the one the JS emits).

Caveats for such a test:
- Derive ids from `getToolbarItems()` rather than hardcoding 29, but **restrict to core**: contrib plugins contribute
  items plus their own `admin_library` CSS, which core's test must not scan or require.
- The class name is interpolated verbatim by `ckeditor5.admin.js:971`, so ids are case-sensitive
  (`blockQuote`, `drupalInsertImage`) — match exactly.
- An icon *rule* is not an icon *file*: for full value also `assertFileExists()` the referenced SVG (the Lab-style check
  that catches a renamed asset, which computed-style assertions cannot).

Feasible form: a Kernel test using `plugin.manager.ckeditor5.plugin` + `extension.list.module` (no `::grep` of the whole
core tree; scan only `core/modules/ckeditor5/css/*.css` of `internal.admin*` libraries), with the exclusions above.
That is Option B in §3.

---

## 5. Not verified

- **No test was written or executed**, no DDEV environment was started, `envs/` was not modified, and no working-tree
  core checkout was used. Everything is static reading of git objects at the pinned commit; nothing here is a pass/fail
  claim about core.
- **CDP reachability from core's browser tests is unverified.** There is no `vendor/` directory in the pinned checkout
  used, so the `lullabot/php-webdriver` 2.0.x / `lullabot/mink-selenium2-driver` APIs could not be inspected.
  Whether `executeCdpCommand` / `POST /session/{id}/goog/cdp/execute` is available on the object returned by
  `getWebDriverSession()` (and accepted by `selenium/standalone-chrome:155` in core CI) is an inference from public
  documentation (php-webdriver#832, Selenium CDP docs), not a measured fact. Option A must not be recommended to
  reviewers until a spike proves it.
- **Forced-colors emulation details were checked only Lab-side**, with the Lab's Playwright 1.65.0-alpha /
  Chromium 157.0.8103.15 (ad-hoc inline probe on 2026-11-27 plus the existing
  `reports/issues/3534229/fixture/probe-results.json`), **not** with core's Selenium Chrome 155 and not with
  `getComputedStyle` through Mink. In that Chromium build: emulating `forced-colors: active` + `prefers-color-scheme: dark`
  gives `Canvas = rgb(0,0,0)`, `CanvasText = rgb(255,255,255)`, `mask-image` readable, and an author
  `background-color: CanvasText` resolves to the system colour — the basis of the Option A assertions. Firefox's probe
  crashed in the fixture, so no Firefox-compatible claim is made.
- **`--force-high-contrast`** was probed locally (macOS, Chromium 157) and did **not** activate the `forced-colors`
  media feature; Windows behaviour and core CI image behaviour were not tested. It is not proposed.
- **No core patch exists**, so the recommended assertion is conditional on the fix's shape. If the fix uses a different
  mechanism (`forced-color-adjust`, text/UTF labels, inline SVG recolouring, `filter`), Options A/B sketches need
  rewriting; Option A's *location* stays valid, Option B's *string assertions* would not.
- **Stylelint/build for the eventual CSS was not run.** Verified only that `core/modules/ckeditor5/css/` contains no
  `.pcss.css` source files, so `yarn run build:css --check` does not apply to those files; whether a new
  `@media (forced-colors: active)` block passes the pinned stylelint config was not checked.
- **Upstream discussion was not re-read for this report** beyond the Lab's intake snapshot (`intake/BRIEF.md`, fetched
  2026-11-27: 8 comments, no MR, related open issue #3506329). Comments #6/#7 were only seen as reproduced in the brief;
  no review threads exist. Whether maintainers would accept a Chrome/CDP-only FunctionalJavascript assertion or a
  CSS-text Kernel assertion is a judgement call, not established fact.
- **Line numbers are blob line numbers at the pinned commit.** Long files and generated CSS can shift between revisions;
  re-check before quoting in a review or MR.
- **Only the toolbar *configuration* page was considered.** The same icons are not used in the editor UI itself
  (`core/modules/ckeditor5/css/*.admin.css` are admin-only libraries, `ckeditor5.libraries.yml:133–260`), so no
  editor-side test is relevant to this issue — asserted from library definitions, not tested.
- **No assessment of other browsers' forced-colors support** (Edge = Chromium behaviour; Firefox implements
  `forced-colors`; Safari's support differs) and none of the Windows contrast palettes.

---

## Appendix: searches run (pinned commit)

```bash
G="git --git-dir=/Users/mgifford/drupal-core-lab/envs/core.git"
P=8a7df6cc3e69b6b5d427cb25ce8f66dda8393c29
$G grep -n -- 'ckeditor5-toolbar' $P -- 'core/'
$G grep -n -- 'toolbar-button' $P -- 'core/'                       # JS + CSS only; no test uses it
$G grep -n -- 'toolbar_button' $P -- 'core/'                       # 0
$G grep -n -- 'Drupal.theme.ckeditor5Button\|ckeditor5Button' $P -- 'core/modules/ckeditor5/{js,src,tests,templates}'
$G grep -n -- "Available buttons\|Active toolbar\|Toolbar configuration" $P -- 'core/'
$G grep -ln -- 'forced-colors' $P -- 'core/'                        # 36 pcss + 36 compiled + vendor
$G grep -n -- 'forced-colors\|forced_colors' $P -- '*.php'          # 0
$G grep -n -- 'prefers-contrast' $P -- 'core/'                      # 0
$G grep -n -- 'mask-image' $P -- '*.php'                            # 0
$G grep -n -- 'CanvasText' $P -- 'core/'                            # CSS only
$G grep -n -- 'getComputedStyle' $P -- 'core/tests/' 'core/modules/*/tests'
$G grep -n -- 'cssRules\|styleSheets' $P -- 'core/tests/' 'core/modules/*/tests'   # 0
$G grep -n -- 'toolbar.admin.css' $P -- 'core/'                     # libraries yml only
$G grep -n -- 'ckeditor5-toolbar-button' $P -- 'core/' | grep -v 'css/'            # JS only
```
