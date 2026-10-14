# #3618405 evaluate — 3618405-pinned

Generated 2026-10-14T13:40:40.951Z.
Before: `baseline-3618405` @ 263b7b80  ·  After: `issue-3618405` @ 263b7b80
Page: /admin/content (Default Admin theme). Logged in as user 1.

## Views exposed filter form

| Fact | Before | After |
|---|---|---|
| Form found | true | true |
| Visible heading | — | `<h2>` "Filter Content" |
| Heading font-size (computed) | — | 24px |
| aria-label on form | "Filter the contents of the Content view" | — |
| Theme tokens | h2=1.75rem / h3=1.5rem | h2=1.75rem / h3=1.5rem |

## Heading outline (main region, in order)

Before:
- h2: Administrative sidebar
- h3: Content
- h3: Administration
- h3: Help
- h3: User
- h2: Breadcrumb
- h1: Content
- h2: Primary tabs

After:
- h2: Administrative sidebar
- h3: Content
- h3: Administration
- h3: Help
- h3: User
- h2: Breadcrumb
- h1: Content
- h2: Primary tabs
- h2: Filter Content

## Screenshots
- before-filter-form.png / after-filter-form.png — the exposed filter region (1280px)
- before-filter-form-zoomed.png / after-filter-form-zoomed.png — the same at 560px (zoomed-in reflow)
- before-admin-content-full.png / after-admin-content-full.png — full page
- before-admin-content-zoomed.png / after-admin-content-zoomed.png — viewport at 560px

## Notes
- The MR replaces the screen-reader-only aria-label with a visible `<h2>`. Confirm Before shows the aria-label and no heading; After shows the heading and no aria-label.
- The h2 is styled with `--admin-font-size-h3` (open question in the issue, comments #18/#19): compare the computed heading font-size above with the h2/h3 tokens.
