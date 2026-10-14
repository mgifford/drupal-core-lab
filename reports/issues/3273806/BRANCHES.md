# Branch patches for #3273806

Lab-authored fix (there is no upstream issue fork/MR yet). The Toolbar project on drupal.org is the source of truth.

| Patch | Against | Base | Files | Notes |
|---|---|---|---|---|
| [`branches/3273806-orientation-icon-contrast.patch`](branches/3273806-orientation-icon-contrast.patch) | `https://git.drupalcode.org/project/toolbar.git` `2.x` | `40434c42` (2.x tip, 2026-10-14) | 6 | Rest-state orientation push icons `#bebebe` → `#787878` (source `.pcss.css` + compiled `.css`). |

Apply:

```
git clone https://git.drupalcode.org/project/toolbar.git
cd toolbar && git checkout 2.x
git apply /path/to/3273806-orientation-icon-contrast.patch
```

The compiled `.css` was regenerated to match (the three rest-state inlined SVGs now use `fill #787878`); the module has no own build tooling and relies on core's PostCSS.
