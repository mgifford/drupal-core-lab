# Playwright evidence: #3093378 (3093378-latest)

Run 2026-10-13T19:34:46.690Z. Core Before `4f9558d85e7db3f2fc0e4a5cde195a1834cb6206 2026-10-12`, After `4f9558d85e7db3f2fc0e4a5cde195a1834cb6206 2026-10-12`. Contrib toolbar `871ce7810a90c0e664b59df83ed64d250da3a626`; patch on After: `3093378-use-aria-disclosure.patch`. Environment: **webkit 26.6**, colour scheme **dark**, viewport 480x900 (vertical toolbar — the disclosure handles only render when the tray is vertical, below the 1024px breakpoint), darwin arm64. Trusted input (Playwright click), axe-core WCAG 2.0–2.2 A/AA.

Rule: **fix** checks fail on Before and pass on After; **regression** checks are equal.

| Type | Check | Before | After | Verdict |
|---|---|---|---|---|
| fix | Disclosure button carries aria-expanded | no | yes | ✓ as expected |
| fix | Label reads 'Structure menu' | Structure | Structure menu | ✓ as expected |
| fix | Old 'Extend'/'Collapse' action span removed | yes | no | ✓ as expected |
| fix | aria-expanded changes on click (real click) | null → null | false → true | ✓ as expected |
| regression | Disclosure buttons rendered (count) | 12 | 12 | ✓ as expected |
| regression | axe violations (elements) | 0 | 0 | ✓ as expected |
| regression | JavaScript errors | 0 | 0 | ✓ as expected |

## Markup of the "Structure" disclosure button

Before (closed):

```html
<button class="toolbar-icon toolbar-handle" style="opacity: 0;"><span class="action">Extend</span> <span class="label">Structure</span></button>
```

Before (open):

```html
<button class="toolbar-icon toolbar-handle open" style=""><span class="action">Collapse</span> <span class="label">Structure</span></button>
```

After (closed):

```html
<button aria-expanded="false" class="toolbar-icon toolbar-handle" style="opacity: 0;"><span class="label visually-hidden">Structure menu</span></button>
```

After (open):

```html
<button aria-expanded="true" class="toolbar-icon toolbar-handle open" style=""><span class="label visually-hidden">Structure menu</span></button>
```

## Accessibility tree of the button (ariaSnapshot)

Before (closed):

```yaml
- button "Extend Structure"
```

After (closed):

```yaml
- button "Structure menu"
```

## Visual comparison

Screenshots `before-1-tray.png` and `after-1-tray.png` (same page state) differ in **0** of 432000 pixels (0%). `pixel-diff.png` highlights any difference in red. The change is intended to be visually identical.

Screenshots: `before-2-structure-open.png`, `after-2-structure-open.png`.

## Interpretation

✓ **Reproduced and fixed.** Before has no `aria-expanded` and a name that flips between "Extend" and "Collapse"; After reports the state with `aria-expanded` and keeps a stable name "Structure menu". No regression in the number of handles, axe results or JavaScript errors.

---
Automated evidence is a **DRAFT**: DOM/axe/pixel checks do not replace a keyboard and screen-reader pass by a person. Open the two sites in the viewer to compare by hand.
