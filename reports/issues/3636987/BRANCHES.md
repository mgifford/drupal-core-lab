# Patches for #3636987

The issue has **no merge request and no issue fork branch** (checked 2026-11-27). Its fix is the patch attached to
[comment #6](https://www.drupal.org/project/drupal/issues/3636987#comment-16848691) on 2026-11-20. The lab treats that
attachment as the imported proposal; it has not been modified.

The lab's own Before/After comparison is registered as `3636987-pinned` in
[`variants.json`](variants.json), not in `tools/compare/variants.json`.

| Patch | Source | Base | Base date and subject | Files | sha256 |
|---|---|---|---|---|---|
| [`branches/3636987-forced-colors-select-2026-11-20.patch`](branches/3636987-forced-colors-select-2026-11-20.patch) | [attachment 7210257](https://www.drupal.org/files/issues/2026-11-20/drupal-3636987-forced-colors-select.patch), comment 16848691 | current main `8a7df6cc3e69` (the patch was written against 2026-11-20 main; the hunk applies with a 3-line offset in the PostCSS source and a 5-line offset in the compiled CSS) | 2026-11-27 `fix: #2778345 Views argument validators...` | 2 | `966db1af875a76017dbe1b016bf00cb40fefdca081c43299bbf42168602e5da8` |

## What the patch does

It adds `.dark-mode .form-element--type-select` to the existing `@media (forced-colors: active)` selector list in
`core/themes/default_admin/css/components/form--select.pcss.css`, and makes the matching compiled-CSS change in
`form--select.css`. The declaration block is unchanged: `padding-inline-end: var(--input-padding-horizontal)`,
`background-image: none`, `appearance: revert`. No `!important` is introduced and the SVGs are not touched.

## Before this was applied

`git apply --cached --check` against `8a7df6cc3e69` succeeds. The patch's own index lines name blobs that are not in
the lab's shallow clone (`72b5f88`, `ad32ff9`), because the file changed between 2026-11-20 and 2026-11-27. The
hunks still apply.

## Compiled CSS

`node scripts/css-build.mjs 3636987-pinned --check` and the regeneration result are recorded in
[`css-build/`](css-build/) and in [EVIDENCE.md](EVIDENCE.md).
