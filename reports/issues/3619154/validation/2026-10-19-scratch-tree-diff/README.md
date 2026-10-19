# MR !16911 at 175e6f17: accessibility tree, ARIA and speech, 2026-10-19 (scratch environment, not lab evidence)

DRAFT. Not reviewed by a person. First run of `tools/playwright/tree-diff.mjs` ([docs/ACCESSIBILITY-TREE-DIFF.md](../../../../../docs/ACCESSIBILITY-TREE-DIFF.md)).

**Result: on `/node/1/edit` and `/node/add/article`, at 1280 and 480 pixels wide, the only differences are the MR's own.**

| | Before | After |
|---|---|---|
| Sidebar toggle | `<a role="button">`, name "Hide sidebar panel" (sidebar open, 1280) or "Show sidebar panel" (closed, 480), `aria-expanded` | `<button type="button">`, name "Sidebar panel" in both states, `aria-expanded` |
| Close button (in the sidebar; not rendered at either width on load) | `<a role="button">` at the end of the sidebar, no `aria-controls` | `<button type="button">` at the start, `aria-controls="default_admin_sidebar"` |

Everything else in the three views is identical. Guidepup speaks as many items on each side: 206 on `/node/1/edit` and 197 on
`/node/add/article` at 1280, 73 and 67 at 480 (most of the page is not rendered at that width until a menu or the sidebar opens).
A stable name with the state in `aria-expanded` is the usual pattern for a disclosure button; whether "Sidebar panel" is clear
enough as a name is a person's call.

- [1280x900/SUMMARY.md](1280x900/SUMMARY.md), [480x900/SUMMARY.md](480x900/SUMMARY.md): the tables, diffs, and every view in full.

## Conditions

The same two throwaway sites as [2026-10-18-scratch-175e6f17](../2026-10-18-scratch-175e6f17/SUMMARY.md): core `f2abd4143f87`
on both sides, After plus `branches/sidebar-toggle-fixes.patch` (MR !16911 at `175e6f17`); Standard install and
`recipes/repro_3619154`; MariaDB 10.11 and the PHP 8.5 built-in server inside `ddev/ddev-webserver:v1.24.10`. **Not DDEV.** So the
summaries name the sides by their local addresses (`127.0.0.1:8501` is Before, `:8502` After), and the run used the "any two sites"
form with one-time login links:

    node tools/playwright/tree-diff.mjs --before=http://127.0.0.1:8501 --after=http://127.0.0.1:8502 \
      --login-before=<one-time link> --login-after=<one-time link> --page=/node/1/edit --page=/node/add/article \
      --viewport=<1280x900|480x900> --out=<this folder>/<viewport> --chromium=<Chromium 141>

Chromium 141.0.7390.37 headless, Linux x64. In DDEV the same check is `node tools/playwright/tree-diff.mjs 3619154`.
