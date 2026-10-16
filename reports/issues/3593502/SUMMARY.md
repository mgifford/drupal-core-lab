# #3593502: Introduce a new Menu UI to resolve memory issues and improve user experience

**DRAFT. The issue, its comments, its related issues and its merge request have NOT been read by the lab yet.** On 2026-10-16
drupal.org and git.drupalcode.org were unreachable from the session that started this folder, so nothing here is a review of the
change. What is here: a recipe that builds the same large menu on Before and After, two measuring tools, the Before baseline, and
the instructions to build both sides in DDEV Coder. Last updated: 2026-10-16.

Issue: https://www.drupal.org/project/drupal/issues/3593502

## What is known, and from where

| Fact | Source | Checked? |
|---|---|---|
| Title, component `menu_ui.module`, priority Major, status Needs review, tagged accessibility | the lab's triage of 2026-07-15 (`reports/core-a11y-triage-2026-07-15.md`, `reports/known-issues.json`) | from drupal.org's API in July; status may have changed |
| The menu edit form builds every link of the menu into one form, so large menus run out of memory | a web search summary of the issue page | **measured on Before** (below) |
| The proposal is a new experimental module, `menu_tree_ui`, that loads the tree lazily, and leaves `menu_ui` in place | the same web search summary | **not checked**: read the merge request |
| The merge request includes a test module with a Drush seeder of about 15,000 links | the same web search summary | **not checked**; the lab does not use Drush, so it has its own seeder |
| Related: #191360 (parent selector loads the whole tree), #2862907 (large menus hit `max_input_vars`), #2742371 (drag and drop and form size limits), usability meeting #3592717 | the same web search summary | **not checked**: `issue-intake.mjs fetch 3593502` lists them with their state |

## Measured by the lab (Before only, details in `EVIDENCE.md`)

On unchanged core with 15,000 menu links, `/admin/structure/menu/manage/main` fails: at a 256M memory limit it dies after 3.3 s
with "Allowed memory size exhausted", and with unlimited memory it still dies at PHP's default 30-second time limit, having used
1,133 MB. Building the form alone costs about 70 KB per link, so a 256M site fails at roughly 3,500 links.

## Files

| What | Where |
|---|---|
| Build Before and After in DDEV Coder from a browser (you download the merge request's diff) | [CODER-PROMPT.md](CODER-PROMPT.md) |
| Evidence: Before baseline, environment, commands | [EVIDENCE.md](EVIDENCE.md) |
| Recipe: Standard plus a 15,000-link Main navigation menu, same on both sides, no Drush | [`recipes/repro_3593502/`](../../../recipes/repro_3593502/) (`recipe.yml`, `apply.sh`, `seed-menu.php`) |
| Measure the form: peak memory, time, rows | [`recipes/repro_3593502/measure-menu-form.php`](../../../recipes/repro_3593502/measure-menu-form.php) |
| Measure any page, including background requests: one log line per request | [`recipes/repro_3593502/peak-memory.php`](../../../recipes/repro_3593502/peak-memory.php) |

## What a review of the merge request has to answer

Not answered yet: these are the questions, not findings. A change to the menu UI reaches every Drupal site that upgrades, so each
one matters at that scale.

1. **Blast radius.** Is it only a new, opt-in experimental module, or does it change `menu_ui`, `menu_link_content`, the menu tree
   storage or shared JavaScript that every site runs? Any `hook_update_N` or post-update function?
2. **Does it fix what it says,** on 15,000 links at a 256M limit and a 30-second time limit, including every background request
   the page makes (the `peak-memory.php` log), and for the parent selector on the link form (#191360)?
3. **Access and safety.** Every new route requires `administer menu` (or the existing per-menu access); requests that change data
   are POST with a CSRF token; nothing leaks link titles of menus the user cannot administer; saving a reorder of many links either
   fully succeeds or changes nothing.
4. **Accessibility** (the issue is tagged for it): moving a link has a keyboard and single-pointer alternative to drag and drop
   (WCAG 2.5.7); tree semantics (levels, expanded or collapsed) reach screen readers; loading, moves, saves and errors are announced;
   focus is managed after lazy loads and moves; it works at 400% zoom and in forced colours.
5. **Parity with the old form:** enable or disable, edit, delete, weights, "Show row weights", translations, right-to-left.
6. **Tests:** functional JavaScript tests for the new UI and its keyboard path; a test at a size that would have failed before.
7. **Reviews already given:** the unresolved threads on the merge request and any open related issue
   (`node scripts/issue-intake.mjs fetch 3593502` now lists both).

## Next steps

1. Allow `www.drupal.org` and `git.drupalcode.org` for the lab session, then `node scripts/issue-intake.mjs fetch 3593502` and
   `node scripts/new-issue.mjs 3593502 --branch <fork branch>`, and review the diff against the list above.
2. Or, without that: run `CODER-PROMPT.md` in DDEV Coder with the diff you download, and do the manual checks there.
