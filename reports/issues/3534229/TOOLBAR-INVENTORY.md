# CKEditor 5 toolbar configuration: item and icon inventory (DRAFT)

**Issue:** [#3534229](https://www.drupal.org/project/drupal/issues/3534229) — CKEditor toolbar configuration icons are
invisible in forced-colors mode. UI route: `/admin/config/content/formats/manage/full_html`, the "Toolbar configuration"
fieldset rendered by `core/modules/ckeditor5/js/ckeditor5.admin.js` and
`core/modules/ckeditor5/templates/ckeditor5-settings-toolbar.html.twig`.

**Pinned core commit:** `8a7df6cc3e69b6b5d427cb25ce8f66dda8393c29`
(`fix: #2778345 Views argument validators aren't taken into account on access checks…`, 2026-11-27 14:18:04 +0000) in the bare
repo `envs/core.git`. Everything below was read from that commit with `git show`, `git ls-tree` and `git grep`; no working-tree
checkout was used. Generated: 2026-11-27.

**Status:** DRAFT, static source analysis only. Nothing here was observed in a browser and no server was started (the task
forbids DDEV). See "Not verified" at the end.

**Machine-readable twin:** [`TOOLBAR-INVENTORY.json`](./TOOLBAR-INVENTORY.json).

## How this was produced

```bash
git --git-dir=envs/core.git show <commit>:core/modules/ckeditor5/ckeditor5.ckeditor5.yml
git --git-dir=envs/core.git ls-tree -r --name-only <commit> core/modules/ckeditor5/css core/modules/ckeditor5/icons
git --git-dir=envs/core.git grep -n 'ckeditor5-toolbar-button' <commit> -- 'core/**/*.css' 'core/**/*.twig' 'core/**/*.js'
git --git-dir=envs/core.git grep -n 'url(' <commit> -- 'core/modules/ckeditor5/css/**'
git --git-dir=envs/core.git show <commit>:core/modules/ckeditor5/ckeditor5.libraries.yml
git --git-dir=envs/core.git show <commit>:core/modules/ckeditor5/src/Plugin/CKEditor5PluginManager.php
git --git-dir=envs/core.git show <commit>:core/modules/ckeditor5/src/Plugin/CKEditor5PluginDefinition.php
git --git-dir=envs/core.git show <commit>:core/modules/ckeditor5/src/Attribute/DrupalAspectsOfCKEditor5Plugin.php
git --git-dir=envs/core.git show <commit>:core/modules/ckeditor5/src/Annotation/DrupalAspectsOfCKEditor5Plugin.php
git --git-dir=envs/core.git show <commit>:core/modules/ckeditor5/src/Plugin/Editor/CKEditor5.php
git --git-dir=envs/core.git show <commit>:core/modules/ckeditor5/js/ckeditor5.admin.js
git --git-dir=envs/core.git show <commit>:core/profiles/standard/config/install/filter.format.full_html.yml
git --git-dir=envs/core.git show <commit>:core/profiles/standard/config/install/editor.editor.full_html.yml
```

Scope check: at this commit there is exactly **one** `*.ckeditor5.yml` in scope, `core/modules/ckeditor5/ckeditor5.ckeditor5.yml`
(49 plugin definitions). The other `*.ckeditor5.yml` files in the tree are test fixtures under
`core/modules/ckeditor5/tests/modules/` and are out of scope. **`core/modules/media` has no `*.ckeditor5.yml` of its own**; the
Media and Media Library plugins are defined *inside* the ckeditor5 module's file using a `provider:` key
(`core/modules/ckeditor5/ckeditor5.ckeditor5.yml:734`, `:775`, `:823`). No other core module defines a CKEditor 5 plugin class,
attribute or YAML file (`git grep '#\[CKEditor5Plugin'` and `git grep 'Plugin\CKEditor5Plugin'` outside `core/modules/ckeditor5`
match only test files/docs).

## Counts

| Measure | Count |
|---|---|
| Plugin definitions in `ckeditor5.ckeditor5.yml` | 49 |
| Plugin definitions that declare `toolbar_items` | 26 |
| **Toolbar items (`toolbar_items` keys)** | **29** |
| Structural controls that are not `toolbar_items` (divider, wrapping) | 2 |
| Rendered `.ckeditor5-toolbar-button-<id>` classes in the UI | 31 |
| Toolbar items rendered with a `background-image` icon | 26 |
| Toolbar items with no icon (text via `::before` on the button) | 3 |
| CSS files under `core/modules/ckeditor5/css/` that style a button class | 19 |
| Of those, files that declare a `background-image` icon | 17 |
| Distinct SVG files referenced by those rules | 31 (28 reachable from core ids) |
| Items with `[dir="rtl"]` rules | 4 |

Classification (exactly one category per button, all 31 rendered buttons):

| Category | Count | Items |
|---|---|---|
| `icon-only` | 25 | undo, redo, specialCharacters, sourceEditing, bold, italic, underline, code, codeBlock, strikethrough, subscript, superscript, blockQuote, link, bulletedList, numberedList, horizontalLine, removeFormat, insertTable, drupalInsertImage, indent, outdent, showBlocks, fullscreen, drupalMedia |
| `mixed icon and dropdown indicator` | 1 | alignment (icon **and** a CSS-border chevron) |
| `text-based simulated dropdown` | 3 | heading, style, textPartLanguage (text in `::before`, chevron in `::after`, no icon) |
| `structural separator or wrapping control` | 2 | divider (pipe), wrapping (hyphen) — not `toolbar_items` entries |
| `other exceptional rendering` | 0 | — |

## The items

Legend: "rendering shape" describes only the configuration-UI button rendered by
`Drupal.theme.ckeditor5Button` (`<span class="ckeditor5-toolbar-button ckeditor5-toolbar-button-<id>">`). The shared base
rules are in `core/modules/ckeditor5/css/toolbar.admin.css` (see next section), so "bg icon" means a per-item
`background-image: url(../icons/<file>.svg)` under `.ckeditor5-toolbar-button-<id>`.

| Item id | Plugin id | Label | Admin library | CSS file that styles the button | Icon file | Rendering shape | Classification | Notes (RTL / pseudo-elements / positioning) |
|---|---|---|---|---|---|---|---|---|
| `undo` | `ckeditor5_essentials` | Undo | `ckeditor5/internal.admin.essentials` | `css/essentials.admin.css:9-11` | `icons/undo.svg` | bg icon | icon-only | Centered by the shared rule (`background-position: center`, `background-size: 20px`). No RTL rule. |
| `redo` | `ckeditor5_essentials` | Redo | `ckeditor5/internal.admin.essentials` | `css/essentials.admin.css:13-15` | `icons/redo.svg` | bg icon | icon-only | As undo. |
| `heading` | `ckeditor5_heading` | Heading | `ckeditor5/internal.admin.heading` | **`css/essentials.admin.css:17-52`** (not `heading.admin.css`) | none | text `::before` + chevron `::after` | text-based simulated dropdown | `display:flex`, `justify-content:space-between`, `width:100px`, `color:#000` (:17-23). `::before` content `"Heading"` with alt-content form `content:"Heading" / ""`, `font-size:14px`, `margin-left:10px` (:25-31); RTL `margin-right:10px; margin-left:0` (:33-36). `::after` chevron: 7×7px box, `transform:rotate(135deg)`, `border-width:2px 2px 0 0`, `border-style:solid`, `margin-right:10px` (:38-47); RTL flips the margin (:49-52). |
| `style` | `ckeditor5_style` | Style | `ckeditor5/internal.admin.style` | `css/style.admin.css:1-36` | none | text `::before` + chevron `::after` | text-based simulated dropdown | Same pattern as heading, `width:110px` (:1-7); `::before` content `"Style"` (:9-20, RTL :17-20); chevron `::after` (:22-36, RTL :33-36). |
| `specialCharacters` | `ckeditor5_specialCharacters` | Special characters | `ckeditor5/internal.admin.specialCharacters` | `css/special-characters.css:1-3` | `icons/special-characters.svg` | bg icon | icon-only | Shared centering. No RTL rule. |
| `sourceEditing` | `ckeditor5_sourceEditing` | Source | `ckeditor5/internal.admin.sourceEditing` | `css/source-editing.admin.css:1-3` | `icons/source-editing.svg` | bg icon | icon-only | Shared centering. No RTL rule. |
| `bold` | `ckeditor5_bold` | Bold | `ckeditor5/internal.admin.basic` | `css/basic.admin.css:1-3` | `icons/bold.svg` | bg icon | icon-only | Shared centering. No RTL rule. |
| `italic` | `ckeditor5_emphasis` | Italic | `ckeditor5/internal.admin.basic` | `css/basic.admin.css:5-7` | `icons/italic.svg` | bg icon | icon-only | Shared centering. No RTL rule. |
| `underline` | `ckeditor5_underline` | Underline | `ckeditor5/internal.admin.basic` | `css/basic.admin.css:9-11` | `icons/underline.svg` | bg icon | icon-only | Shared centering. No RTL rule. |
| `code` | `ckeditor5_code` | Code | `ckeditor5/internal.admin.basic` | `css/basic.admin.css:13-15` | `icons/code.svg` | bg icon | icon-only | Shared centering. No RTL rule. |
| `codeBlock` | `ckeditor5_codeBlock` | Code Block | `ckeditor5/internal.admin.codeBlock` | `css/code-block.admin.css:1-3` | `icons/code-block.svg` | bg icon | icon-only | Shared centering. No RTL rule. |
| `strikethrough` | `ckeditor5_strikethrough` | Strikethrough | `ckeditor5/internal.admin.basic` | `css/basic.admin.css:17-19` | `icons/strikethrough.svg` | bg icon | icon-only | Shared centering. No RTL rule. |
| `subscript` | `ckeditor5_subscript` | Subscript | `ckeditor5/internal.admin.basic` | `css/basic.admin.css:21-23` | `icons/subscript.svg` | bg icon | icon-only | Shared centering. No RTL rule. |
| `superscript` | `ckeditor5_superscript` | Superscript | `ckeditor5/internal.admin.basic` | `css/basic.admin.css:25-27` | `icons/superscript.svg` | bg icon | icon-only | Shared centering. No RTL rule. |
| `blockQuote` | `ckeditor5_blockquote` | Block quote | `ckeditor5/internal.admin.blockquote` | `css/blockquote.admin.css:1-3` | `icons/blockquote.svg` | bg icon | icon-only | Shared centering. No RTL rule. |
| `link` | `ckeditor5_link` | Link | `ckeditor5/internal.admin.link` | `css/link.admin.css:1-3` | `icons/link.svg` | bg icon | icon-only | Shared centering. No RTL rule. |
| `bulletedList` | `ckeditor5_list` | Bulleted list | `ckeditor5/internal.admin.list` | `css/list.admin.css:2-4` | `icons/bulletedlist.svg` | bg icon | icon-only | Shared centering. No RTL rule. |
| `numberedList` | `ckeditor5_list` | Numbered list | `ckeditor5/internal.admin.list` | `css/list.admin.css:6-8` | `icons/numberedlist.svg` | bg icon | icon-only | Shared centering. No RTL rule. |
| `horizontalLine` | `ckeditor5_horizontalLine` | Horizontal line | `ckeditor5/internal.admin.horizontalLine` | `css/horizontal-line.admin.css:1-3` | `icons/horizontalline.svg` | bg icon | icon-only | Shared centering. No RTL rule. |
| `alignment` | `ckeditor5_alignment` | Text alignment | `ckeditor5/internal.admin.alignment` | `css/alignment.admin.css:13-45` | `icons/align-left.svg` | bg icon **+** chevron `::after` | mixed icon and dropdown indicator | Base icon (:13-15). `display:flex`, `justify-content:flex-end`, `padding-right:20px`, `background-position-x:10px` (:17-23); RTL `padding-left:20px; background-position-x:30px` (:24-28). `::after` chevron 7×7px, `rotate(135deg)`, border 2px solid, `right:-10px`, `color:#000` (:29-41); RTL `right:10px` (:42-45). |
| `removeFormat` | `ckeditor5_removeFormat` | Remove Format | `ckeditor5/internal.admin.removeFormat` | `css/remove-format.css:1-3` | `icons/remove-format.svg` | bg icon | icon-only | Shared centering. No RTL rule. |
| `insertTable` | `ckeditor5_table` | **`table`** (label is lower-case in YAML, `ckeditor5.ckeditor5.yml:504`) | `ckeditor5/internal.admin.table` | `css/table.admin.css:1-3` | `icons/table.svg` | bg icon | icon-only | Shared centering. No RTL rule. |
| `drupalInsertImage` | `ckeditor5_image` | Image | `ckeditor5/internal.admin.image` | `css/image.admin.css:1-3` | `icons/image.svg` | bg icon | icon-only | Shared centering. No RTL rule. |
| `indent` | `ckeditor5_indent` | Indent | `ckeditor5/internal.admin.indent` | `css/indent.admin.css:1-3` | `icons/indent.svg` | bg icon | icon-only | Shared centering. No RTL rule. |
| `outdent` | `ckeditor5_indent` | Outdent | `ckeditor5/internal.admin.indent` | `css/indent.admin.css:5-7` | `icons/outdent.svg` | bg icon | icon-only | Shared centering. No RTL rule. |
| `textPartLanguage` | `ckeditor5_language` | Language | `ckeditor5/internal.admin.language` | `css/language.admin.css:1-36` | none | text `::before` + chevron `::after` | text-based simulated dropdown | Same pattern as heading/style, `width:110px` (:1-7); `::before` content `"Language"` (:9-20, RTL :17-20); chevron `::after` (:22-36, RTL :33-36). |
| `showBlocks` | `ckeditor5_showBlocks` | Show blocks | `ckeditor5/internal.admin.showBlocks` | `css/show-blocks.admin.css:1-3` | `icons/show-blocks.svg` | bg icon | icon-only | Shared centering. No RTL rule. |
| `fullscreen` | `ckeditor5_fullscreen` | Fullscreen | `ckeditor5/internal.admin.fullscreen` | `css/fullscreen.admin.css:1-3` | `icons/fullscreen-enter.svg` | bg icon | icon-only | Shared centering. No RTL rule. |
| `drupalMedia` | `media_library_mediaLibrary` (provider `media_library`) | Drupal media | `ckeditor5/internal.admin.drupalmedia` | `css/drupalmedia.admin.css:2-4` | `icons/medialibrary.svg` | bg icon | icon-only | Shared centering. No RTL rule. Conditions: `filter: media_embed`, `toolbarItem: drupalMedia` (`ckeditor5.ckeditor5.yml:845-847`). |
| `divider` (structural) | — not a `toolbar_items` entry | Divider (name is the pipe character) | `ckeditor5/internal.admin.essentials` | `css/essentials.admin.css:1-3` | `icons/divider.svg` | bg icon | structural separator or wrapping control | Hardcoded in `js/ckeditor5.admin.js:547-558`. Shared centering. |
| `wrapping` (structural) | — not a `toolbar_items` entry | Wrapping (`name: "-"`) | `ckeditor5/internal.admin.essentials` | `css/essentials.admin.css:5-7` | `icons/separator.svg` | bg icon | structural separator or wrapping control | Hardcoded in `js/ckeditor5.admin.js:547-558`. Shared centering. |

Every one of the 29 items has a matching `.ckeditor5-toolbar-button-<id>` rule somewhere in
`core/modules/ckeditor5/css/`; there is no core item that renders as a bare grey square.

All 28 icon files reachable from the 31 rendered buttons live in `core/modules/ckeditor5/icons/`. No other core module ships a
toolbar-configuration icon at this commit. (`css/drupalmedia.css:65` and `css/image.css:52,60` reference
`core/misc/icons/e29700/warning.svg` and `icons/warning.svg`/`icons/caret.svg`, but those are editor-preview/message styles,
not configuration-UI buttons.)

## Shared button styling (what the icon sits inside)

`core/modules/ckeditor5/css/toolbar.admin.css` is loaded on every CKEditor 5 format form by the base admin library
(`ckeditor5/internal.admin`, `ckeditor5.libraries.yml:120-131`, attached in `CKEditor5.php:252-253`).

```css
/* core/modules/ckeditor5/css/toolbar.admin.css:29-53 */
.ckeditor5-toolbar-item,
.ckeditor5-toolbar-button {
  display: block;
  min-width: 36px;
  height: 36px;
  cursor: move;
  border-radius: 2px;
}

.ckeditor5-toolbar-item {
  position: relative;
  margin: 5px 8px 5px 0;
}

.ckeditor5-toolbar-disabled .ckeditor5-toolbar-item {
  border: 1px solid #e6e6e6;
}

.ckeditor5-toolbar-button {
  border: none;
  background-color: #eee;
  background-repeat: no-repeat;
  background-position: center;
  background-size: 20px;
}
```

So the icon is always a **CSS `background-image` on the inner `<span>`**, 20×20px, centred, on top of `background-color: #eee`.
The hover/focus background is the only interaction state declared for the button itself:

```css
/* core/modules/ckeditor5/css/toolbar.admin.css:55-65 */
.ckeditor5-toolbar-button:focus,
.ckeditor5-toolbar-button:hover {
  color: #000;
  background-color: #e6e6e6;
}
```

Note that `:focus` here targets the inner `<span>`, which is never focused (the focusable element is the parent `<li tabindex="0">`,
see DOM below), so only `:hover` can match. There is no custom focus-ring rule for `.ckeditor5-toolbar-item`; focus uses the
browser default outline (including in forced-colors mode).

Tooltip (absolute, hidden until the button carries `data-expanded="true"`):

```css
/* core/modules/ckeditor5/css/toolbar.admin.css:66-99 (abridged) */
.ckeditor5-toolbar-tooltip {
  position: absolute;
  z-index: 1;
  left: 50%;
  display: block;
  padding: 6px 10px;
  transform: translate(-50%, 2px);
  text-transform: capitalize;
  color: #fff;
  border-radius: 3px;
  background: #333;
  font-size: 12px;
  line-height: 1;
}
.ckeditor5-toolbar-tooltip::before { /* 5px CSS triangle pointing up, background #333 */ }
.ckeditor5-toolbar-button + .ckeditor5-toolbar-tooltip { visibility: hidden; }
.ckeditor5-toolbar-button[data-expanded="true"] + .ckeditor5-toolbar-tooltip { visibility: visible; }
```

`text-transform: capitalize` is why e.g. "table" is displayed as "Table" in the tooltip while the YAML label stays `table`.
The tray sets `user-select: none` and the item sets `cursor: move` (`toolbar.admin.css:9-19,34`); dragging is Sortable.js
(`ckeditor5.admin.js:292-341`).

## The DOM and the three lists (`core/modules/ckeditor5/js/ckeditor5.admin.js`)

### Per-button markup — `Drupal.theme.ckeditor5Button`, lines 953-979

```js
  Drupal.theme.ckeditor5Button = ({ button: { label, id }, listType }) => {
    const buttonInstructions = {
      divider: Drupal.t(
        'Press the down arrow key to use this divider in the active button list',
      ),
      available: Drupal.t('Press the down arrow key to activate'),
      active: Drupal.t(
        'Press the up arrow key to deactivate. Use the right and left arrow keys to move position',
      ),
    };
    const visuallyHiddenLabel = Drupal.t(`@listType button @label`, {
      '@listType': listType !== 'divider' ? listType : 'available',
      '@label': label,
    });
    return `
      <li class="ckeditor5-toolbar-item ckeditor5-toolbar-item-${id}" role="option" tabindex="0" data-drupal-selector="ckeditor5-toolbar-button" data-id="${id}" data-label="${label}" data-divider="${
        listType === 'divider'
      }">
        <span class="ckeditor5-toolbar-button ckeditor5-toolbar-button-${id}">
          <span class="visually-hidden">${visuallyHiddenLabel}. ${
            buttonInstructions[listType]
          }</span>
        </span>
        <span class="ckeditor5-toolbar-tooltip" aria-hidden="true">${label} </span>
      </li>
    `;
  };
```

Resulting DOM per button:

* `<li class="ckeditor5-toolbar-item ckeditor5-toolbar-item-<id>" role="option" tabindex="0" data-drupal-selector="ckeditor5-toolbar-button" data-id="<id>" data-label="<label>" data-divider="true|false">` — the focusable option; `data-divider` is the string `true` only in the Button divider list.
* `<span class="ckeditor5-toolbar-button ckeditor5-toolbar-button-<id>">` — the element that carries the icon (`background-image`) and the text/chevron pseudo-elements.
* `<span class="visually-hidden">…</span>` — accessible name: `"<available|active|divider→available> button <label>. <keyboard instructions>"`. For divider buttons the word "divider" is deliberately replaced by "available" (line 964).
* `<span class="ckeditor5-toolbar-tooltip" aria-hidden="true"><label> </span>` — visual tooltip only; it is `aria-hidden` and duplicated content.

The `data-expanded` state that reveals the tooltip is set on the inner button span by listeners on the `<li>`
(lines 343-363):

```js
/* core/modules/ckeditor5/js/ckeditor5.admin.js:346-363 (abridged) */
        const expandButton = (event) => {
          event.currentTarget
            .querySelectorAll('.ckeditor5-toolbar-button')
            .forEach((buttonElement) => {
              buttonElement.setAttribute('data-expanded', true);
            });
        };
        const retractButton = (event) => { /* sets data-expanded false */ };
        element.addEventListener('mouseenter', expandButton);
        element.addEventListener('focus', expandButton);
        element.addEventListener('mouseleave', retractButton);
        element.addEventListener('blur', retractButton);
```

### The three lists

**Active toolbar** — `Drupal.theme.ckeditor5SelectedButtons`, lines 875-885:

```js
  Drupal.theme.ckeditor5SelectedButtons = ({ buttons }) => {
    return `
      <ul class="ckeditor5-toolbar-tray ckeditor5-toolbar-active__buttons" data-button-list="ckeditor5-toolbar-active-buttons" role="listbox" aria-orientation="horizontal" aria-labelledby="ckeditor5-toolbar-active-buttons-label">
        ${buttons
          .map((button) =>
            Drupal.theme.ckeditor5Button({ button, listType: 'active' }),
          )
          .join('')}
      </ul>
    `;
  };
```

**Button divider** — `Drupal.theme.ckeditor5DividerButtons`, lines 899-909:

```js
  Drupal.theme.ckeditor5DividerButtons = ({ buttons }) => {
    return `
      <ul class="ckeditor5-toolbar-tray ckeditor5-toolbar-divider__buttons" data-button-list="ckeditor5-toolbar-divider-buttons" role="listbox" aria-orientation="horizontal" aria-labelledby="ckeditor5-toolbar-divider-buttons-label">
        ${buttons
          .map((button) =>
            Drupal.theme.ckeditor5Button({ button, listType: 'divider' }),
          )
          .join('')}
      </ul>
    `;
  };
```

**Available buttons** — `Drupal.theme.ckeditor5AvailableButtons`, lines 923-933:

```js
  Drupal.theme.ckeditor5AvailableButtons = ({ buttons }) => {
    return `
      <ul class="ckeditor5-toolbar-tray ckeditor5-toolbar-available__buttons" data-button-list="ckeditor5-toolbar-available-buttons" role="listbox" aria-orientation="horizontal" aria-labelledby="ckeditor5-toolbar-available-buttons-label">
        ${buttons
          .map((button) =>
            Drupal.theme.ckeditor5Button({ button, listType: 'available' }),
          )
          .join('')}
      </ul>
    `;
  };
```

**Wrapper with the three group labels** — `Drupal.theme.ckeditor5Admin`, lines 999-1030: `<div data-drupal-selector="ckeditor5-admin-help-message">`,
`<div class="ckeditor5-toolbar-disabled">` containing `<div class="ckeditor5-toolbar-available">` (label
`Available buttons`, id `ckeditor5-toolbar-available-buttons-label`) and `<div class="ckeditor5-toolbar-divider">` (label
`Button divider`), then `<div class="ckeditor5-toolbar-active">` (label `Active toolbar`). Labels are plain `<label id="…">`
elements wired to the lists with `aria-labelledby`; they are not `<label for>` any control.

**Where the lists' contents come from** — lines 541-558:

```js
        const available = Object.entries(
          JSON.parse(
            context.querySelector('#ckeditor5-toolbar-buttons-available')
              .innerHTML,
          ),
        ).map(([name, attrs]) => ({ name, id: name, ...attrs }));
        const dividers = [
          {
            id: 'divider',
            name: '|',
            label: Drupal.t('Divider'),
          },
          {
            id: 'wrapping',
            name: '-',
            label: Drupal.t('Wrapping'),
          },
        ];
```

The JSON comes from the server: `CKEditor5.php:287-294` renders
`'#markup' => Json::encode($this->ckeditor5PluginManager->getToolbarItems())` into `#ckeditor5-toolbar-buttons-available`;
the selected list is the JSON in the hidden textarea `#ckeditor5-toolbar-buttons-selected` (`CKEditor5.php:302-312`, with
`tabindex="-1"` and `aria-hidden="true"`); JS hides the server-rendered JSON with `.visually-hidden` (lines 587-594).
Dividers are **not** plugin `toolbar_items`: `|` and `-` are hardcoded at lines 547-558 and their button classes are
`ckeditor5-toolbar-button-divider` / `ckeditor5-toolbar-button-wrapping`.

**Rendering/filtering** — lines 271-288: the Available list is `availableButtons.filter((button) => !selectedButtons.value.includes(button.id))`;
the Active list is `getSelectedButtons(selected, dividerButtons, availableButtons)` (lines 104-108). So an item is in exactly
one of the two lists, and both lists use the same button markup and therefore the same icon rules.

**Keyboard interaction** — lines 365-520: `ArrowDown` on an available/divider item adds it to the active toolbar,
`ArrowUp` removes, `ArrowLeft`/`ArrowRight` move within the active toolbar (direction-aware via
`document.documentElement.dir`, line 380); changes are announced with `Drupal.announce` (e.g. lines 385-392).
Drag-and-drop is Sortable.js with groups `toolbar`, `available`, `divider` (lines 292-341).

## Toolbar lists in the pinned Standard profile's Full HTML format

The task pointed at `core/profiles/standard/config/install/filter.format.full_html.yml`. That file contains **no editor
settings at all** at this commit (it only enables `editor_file_reference`, `filter_align`, `filter_caption`,
`filter_htmlcorrector`, `filter_image_lazy_load`). The CKEditor 5 toolbar for Full HTML is in the sibling config entity
`core/profiles/standard/config/install/editor.editor.full_html.yml` (`editor: ckeditor5`), lines 10-33:

```yaml
settings:
  toolbar:
    items:
      - bold
      - italic
      - strikethrough
      - superscript
      - subscript
      - removeFormat
      - '|'
      - link
      - '|'
      - bulletedList
      - numberedList
      - '|'
      - blockQuote
      - drupalInsertImage
      - insertTable
      - horizontalLine
      - '|'
      - heading
      - codeBlock
      - '|'
      - sourceEditing
```

* **Active toolbar on Full HTML (16 items, 5 divider entries):** `bold`, `italic`, `strikethrough`, `superscript`, `subscript`,
  `removeFormat`, `link`, `bulletedList`, `numberedList`, `blockQuote`, `drupalInsertImage`, `insertTable`, `horizontalLine`,
  `heading`, `codeBlock`, `sourceEditing`.
* **Available buttons on Full HTML (all items minus the active ones = 13):** `undo`, `redo`, `style`, `specialCharacters`,
  `underline`, `code`, `alignment`, `indent`, `outdent`, `textPartLanguage`, `showBlocks`, `fullscreen`, `drupalMedia`.
  (`drupalMedia` only appears in the list if the plugin definition is present; see the caveat in "Not verified".)
* **Button divider list (always both):** `divider` (`|`), `wrapping` (`-`).

Basic HTML, for comparison (`editor.editor.basic_html.yml:12-27`): bold, italic, `|`, link, `|`, bulletedList, numberedList,
`|`, blockQuote, drupalInsertImage, `|`, heading, code, `|`, sourceEditing.

What this means for the Full HTML page at this commit:

* **Active toolbar, 21 entries (16 items + 5 dividers):** 15 of the 16 items use a `background-image` icon — `bold`, `italic`,
  `strikethrough`, `superscript`, `subscript`, `removeFormat`, `link`, `bulletedList`, `numberedList`, `blockQuote`,
  `drupalInsertImage`, `insertTable`, `horizontalLine`, `codeBlock`, `sourceEditing` — and only `heading` is text-based.
* **Available buttons, 13 items:** 11 use a `background-image` icon — `undo`, `redo`, `specialCharacters`, `underline`, `code`,
  `alignment` (icon plus chevron), `indent`, `outdent`, `showBlocks`, `fullscreen`, `drupalMedia` — and `style` and
  `textPartLanguage` are text-based.
* **Button divider, 2 entries:** both `divider` and `wrapping` are `background-image` icons.

So on this page 28 of the 31 rendered buttons paint their only visible content with a CSS background image: 15 active items,
11 available items and both structural dividers. The 3 text-based buttons (heading, style, textPartLanguage) are the only
items whose visible affordance is generated text/borders, which forced-colors does force to system colours.

## Contribution/extension contract

### What a contributed module must provide

1. **A plugin definition with `drupal.toolbar_items`.** YAML `MODULE.ckeditor5.yml` or the PHP attributes
   (`core/modules/ckeditor5/ckeditor5.api.php:139-147`):

   > ```
   > - drupal.toolbar_items: List of toolbar items the plugin provides. Keyed by a
   >   machine name and the value being a pair defining the label:
   >   toolbar_items:
   >     indent:
   >       label: Indent
   >     outdent:
   >       label: Outdent
   > ```

   The key becomes the item id, the DOM class `ckeditor5-toolbar-button-<key>`, and the value stored in the toolbar settings.
   Validated shape: `CKEditor5PluginDefinition::getToolbarItems()` (`CKEditor5PluginDefinition.php:402-404`),
   `hasToolbarItems()` (`:414-416`), annotation default `[]` (`Annotation/DrupalAspectsOfCKEditor5Plugin.php:104-111`),
   attribute `public readonly array $toolbar_items = []` (`Attribute/DrupalAspectsOfCKEditor5Plugin.php:52-55,67`).

2. **`drupal.admin_library` pointing at a real asset library.** Docs (`ckeditor5.api.php:117-118`):

   > ```
   > - drupal.admin_library: A Drupal asset library that will load in the text
   >   format admin UI when the plugin is available.
   > ```

   Attribute docblock: *"The admin library this plugin provides"* (`Attribute/DrupalAspectsOfCKEditor5Plugin.php:26-29`,
   property `:65`). It is validated eagerly — the library must resolve, or plugin discovery throws
   (`CKEditor5PluginDefinition.php:235-240`):

   > ```php
   >     if ($definition['drupal']['admin_library'] !== FALSE) {
   >       [$extension, $library] = explode('/', $definition['drupal']['admin_library'], 2);
   >       if (\Drupal::service('library.discovery')->getLibraryByName($extension, $library) === FALSE) {
   >         throw new InvalidPluginDefinitionException(...);
   > ```

   All admin libraries of **all** definitions are attached to the format form, plus the base library
   (`CKEditor5PluginManager.php:163-168`):

   > ```php
   >   public function getAdminLibraries(): array {
   >     $list = $this->mergeDefinitionValues('getAdminLibrary', $this->getDefinitions());
   >     // Include main admin library.
   >     array_unshift($list, 'ckeditor5/internal.admin');
   >     return $list;
   >   }
   > ```

   attached in `CKEditor5.php:248-263` (`'#attached' => ['library' => $this->ckeditor5PluginManager->getAdminLibraries(), …]`).

3. **CSS in that library that targets `.ckeditor5-toolbar-button-<item-id>`.** There is no icon fallback in core: the button is
   a 36×36 `#eee` square (`toolbar.admin.css:47-53`) whose only visible content is whatever the plugin's admin CSS paints. The
   only contract is the class name emitted by `Drupal.theme.ckeditor5Button` (`ckeditor5.admin.js:971`), and the pattern core
   itself follows is a bare `background-image: url(../icons/<name>.svg)`:

   ```css
   /* the whole of core/modules/ckeditor5/css/link.admin.css */
   .ckeditor5-toolbar-button-link {
     background-image: url(../icons/link.svg);
   }
   ```

   Icon location/format is **convention only** (`core/modules/ckeditor5/icons/*.svg`), not enforced by code. Core's docblock
   comment says the assets are internal and not a stable API (`ckeditor5.libraries.yml:1-9`: *"Internal libraries, do not depend
   on these"*; `ckeditor5-settings-toolbar.html.twig:6-11`: the template *"is internal … utilizing or overriding it outside of
   core usages is not supported"*).

4. Optional refinements a plugin can copy: a `::before` text label (with the `content: "Text" / ""` alt-content form used by
   heading/style/language), a CSS-border chevron (as in `alignment`, `style`, `language`), RTL rules under
   `[dir="rtl"]`, and `background-position`. None of this is documented as a contract.

### Is there an existing core CSS custom property/contract for those icons?

**No.** All evidence from the pinned commit:

* No custom property is defined or consumed anywhere in the ckeditor5 module's CSS or JS:
  `git grep -n 'forced-colors\|prefers-contrast\|forced-color-adjust\|mask-image\|currentColor\|--ckeditor5' <commit> -- 'core/modules/ckeditor5/**'`
  (excluding `tests/`) returns **no matches**. Every icon rule in the module hardcodes a `background-image` URL to a fixed-fill
  SVG (32 `url()` declarations in 17 CSS files; 28 of them are reachable from core item ids).
* The icons themselves are not recolourable: e.g. `icons/undo.svg` is
  `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="…"/></svg>` — no `fill` attribute and no `fill="currentColor"`,
  so the path defaults to black; `icons/separator.svg` goes further and hardcodes `fill="black"`. Forced-colors mode forces
  `background-color`/`color` but does not recolour `background-image`, so these icons keep their own colour against the forced
  Canvas background. (Whether that makes them invisible therefore depends on the forced background — see "Not verified".)
* The three non-icon buttons prove the contrast: heading/style/textPartLanguage render text through generated content and a
  chevron through `border-style: solid` (no explicit colour in the heading/style/language chevrons), and those are forced to
  system colours; `alignment`'s chevron sets `color: #000`, which the UA forces.

There *are* two general icon-variable patterns elsewhere in core that a fix could adopt, but neither is connected to CKEditor 5:

* `core/themes/default_admin/css/base/icons.pcss.css:2-63` defines `--admin-icon-add`, `--admin-icon-warning`, … as `url()` values;
  themes/components then use `background-color: currentColor; mask-image: var(--admin-icon-…);`
  (`core/themes/default_admin/css/components/status.pcss.css:42-45`, `action-link.pcss.css:177-217`).
* Forced-colors overrides are expressed as custom properties, e.g.
  `core/themes/default_admin/css/_variables/variables-color-semantic.pcss.css:128-132`:
  `@media (forced-colors: active) { :root { --admin-color-icon: CanvasText; } }`.
* `core/misc/dialog/off-canvas/css/messages.pcss.css:77-103` does the same with `--off-canvas-messages-icon-*` + `mask-image`.

Consequence for the issue: a fix has to either (a) duplicate each icon URL inside a `@media (forced-colors: active)` block as
`mask-image` (and set `background-color: currentColor`/`buttonText` and `background-image: none`) in each of the 17 CSS files
that declare an icon, or (b) first introduce a per-item custom property (e.g. `--ckeditor5-toolbar-icon: url(...)`) in those
rules so one forced-colors block can switch them all to `mask-image: var(--ckeditor5-toolbar-icon)`. There is no such property
today.

## Notable exceptions and code smells found while inventorying

1. **`heading`'s button CSS lives in another plugin's admin library.** `ckeditor5_heading` declares
   `admin_library: ckeditor5/internal.admin.heading` (`ckeditor5.ckeditor5.yml:50`), whose only file
   `css/heading.admin.css` styles the *dropdown option text* (`.ck-heading_heading1`, …) and contains no
   `.ckeditor5-toolbar-button-heading` rule; the button's text+chevron styling is in `css/essentials.admin.css:17-52`, the
   library of `ckeditor5_essentials`. It works only because every admin library is attached to the form regardless of which
   plugin it belongs to. A contributed plugin cannot rely on another plugin's library being its own.
2. **Four `alignment` selectors can never match a core id.** `alignment.admin.css:1-12` styles
   `.ckeditor5-toolbar-button-alignment\:left|right|center|justify` (escaped colons). Core's only alignment item is `alignment`
   (`ckeditor5.ckeditor5.yml:456-458`), so these `align-right/center/justify.svg` declarations are unreachable in the current
   UI; they would only match if a plugin declared item ids containing `:`. The base `.ckeditor5-toolbar-button-alignment` rule
   (`:13-15`) is the one that renders.
3. **`.ckeditor5-toolbar-button:focus` is dead CSS.** The focusable element is `<li class="ckeditor5-toolbar-item" tabindex="0">`;
   the inner `<span>` with `.ckeditor5-toolbar-button` is never focused, so only `:hover` (and forced-colors/UA focus painting on
   the `<li>`) applies. Declared at `toolbar.admin.css:55-59`.
4. **JS selector typo in the Safari focus fix.** `ckeditor5.admin.js:622` queries
   `[data-button-list="ckeditor5-toolbar-active__buttons"]` (two underscores) while the markup uses
   `data-button-list="ckeditor5-toolbar-active-buttons"` (hyphen, line 877), so that branch never matches.
5. **`insertTable`'s visible label is lower-case `table`** in YAML (`ckeditor5.ckeditor5.yml:504`); the tooltip rule
   `text-transform: capitalize` (`toolbar.admin.css:73`) makes it read "Table". The accessible (visually-hidden) label is also
   built from that raw string, so the visually-hidden accessible name reads "available button table. …" (lower-case).
6. **Toolbar item labels from YAML are not translatable.** `CKEditor5PluginManager::getDiscovery()` notes that
   `YamlDiscoveryDecorator` *"only supports top-level properties"* (`CKEditor5PluginManager.php:69-71`), and
   `Drupal.theme.ckeditor5Button` interpolates `label` directly without `Drupal.t()` (`ckeditor5.admin.js:976`), so a
   contributed YAML `toolbar_items.*.label` stays in whatever language it was written in. (Core's own labels are English.)
7. **Divider/wrapping are JS-only.** They have buttons and icons but no plugin definition, no `provider`, no conditions, and no
   presence in `getToolbarItems()`, so there is no plugin-level contract for them; core's styling lives in
   `essentials.admin.css:1-7` and any other loaded admin library could also target `.ckeditor5-toolbar-button-divider` /
   `-wrapping`.
8. **Items with unmet `conditions` are still in `getToolbarItems()`.** `CKEditor5PluginManager::getToolbarItems()`
   (`:156-158`) merges **all** definitions — it does not call `getEnabledDefinitions()` — while conditions are only evaluated
   for enabling the plugin in the editor (`:185-230`). So `availableWhen` in the JSON records the definition's conditions
   (machine-readable fact) rather than a proof of what the Available list shows for a given format; only `drupalInsertImage`
   (`toolbarItem: drupalInsertImage`, `ckeditor5.ckeditor5.yml:581-582`) and `drupalMedia`
   (`filter: media_embed` + `toolbarItem: drupalMedia`, `:845-847`) have any conditions among the 29 items.
9. **`provider` does not filter the UI list.** `provider: media` / `provider: media_library` on the media definitions
   (`ckeditor5.ckeditor5.yml:734,775,823`) feed the plugin-id prefix check (`CKEditor5PluginManager.php:97-101`) and the saved
   editor config dependency (`core/modules/editor/src/Entity/Editor.php:141`), not the Available buttons list.

## Not verified

* **No browser observation at all.** DDEV and browsers were out of scope for this task; the page
  `/admin/config/content/formats/manage/full_html`, the rendered DOM, the tooltip, drag behaviour, focus rings and the
  forced-colors appearance were **not** observed. Every statement above is source-derived.
* **Forced-colors outcome is not measured.** The claim "background-image icons cannot be recoloured" is a reading of the CSS
  and SVG sources plus the forced-colors colour-forcing list, not a screenshot. Whether icons disappear should be checked in
  both `forced-colors` light (Canvas white → black icons likely still visible) and dark (Canvas black → likely invisible)
  emulation; the issue report describes them as "completely invisible", which is consistent with dark forced-colors only.
* **The Available-buttons list content per format** is derived from `getToolbarItems()` merging all definitions (finding 8).
  The exact 13-item Available list for Full HTML above is arithmetic from the 29 items minus the 16 active ones; if any
  definition is removed by a provider/condition path not visible in the code read here, the count would differ. The
  `drupalMedia` presence on a site where `media_library` is absent is specifically unconfirmed.
* **No tests were run.** No PHPUnit/Kernel/FunctionalJavascript test, no `yarn` build, no stylelint; the lab's lint, CSS-build
  and Playwright tooling were not used.
* **Other core modules/themes were only grepped**, not audited: no core CSS outside `core/modules/ckeditor5/css/` contains a
  `.ckeditor5-toolbar-button` selector, and `core/themes/default_admin/` has no CKEditor 5 toolbar override at this commit, but
  a contributed/admin theme (e.g. Claro/Gin) was not examined.
* **Icon files were inspected only by their first line/attributes** (fill/currentColor presence), not rendered.
* The `vendor` CKEditor 5 CSS (`core/assets/vendor/ckeditor5/ckeditor5.css`) contains its own forced-colors rules, but it styles
  the editor toolbar, not this configuration UI; it was not audited.
