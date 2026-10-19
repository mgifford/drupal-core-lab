# MR !16911 at 175e6f17: changes after input that nothing announces, 2026-10-19 (scratch environment, not lab evidence)

DRAFT. Not reviewed by a person. First run of the recorder's changes-after-input check
([docs/SILENT-CHANGES.md](../../../../../docs/SILENT-CHANGES.md)) inside `evaluate-3619154.mjs`.

**Result: four silent changes on Before, none on After.** Before, the sidebar's keyboard shortcut (Alt+S) shows the sidebar's
content without moving focus or announcing anything. After, the same shortcut moves focus into the sidebar ("focus moved to it" 4
times on After), so all four are gone in After. The toggle's own text ("Hide/Show sidebar panel") changes on Before only, as the
[tree diff](../2026-10-19-scratch-tree-diff/README.md) shows. The evaluator's own result was unchanged: exit 0, everything as expected.

## Conditions

The same two throwaway sites as [2026-10-18-scratch-175e6f17](../2026-10-18-scratch-175e6f17/SUMMARY.md) (core `f2abd4143f87`,
After plus `branches/sidebar-toggle-fixes.patch`; MariaDB and the PHP 8.5 built-in server, **not DDEV**), reached through a
stand-in for `ddev describe`, `ddev drupal login` and DDEV's HTTPS router, so `evaluate-3619154.mjs 3619154-latest` and
`lib/lab-run.mjs` ran unchanged (`--out` to a scratch folder; the screenshots and results.json were not kept). The site context
reads "not read" (the stand-in has no `ddev exec`). Chromium 141 headless, 1280x900, narrow width 800.

## The section from the run's SUMMARY.md

### Changes after input, and how a screen reader learns of them

After each click, key press or typing, the text that appeared or changed on the page. **Silent**: not in a live region, no `Drupal.announce()` after the same action, focus did not move to it, and the control pressed did not disclose it. A silent change is a candidate for WCAG 2.2 SC 4.1.3 Status Messages, for a person to judge: not every change is a status message. See docs/SILENT-CHANGES.md.

| | Side | Page | After | Text (first; last) | Where | Times |
|---|---|---|---|---|---|---|
| gone in After | before | `/node/1/edit` | key Alt+s the page | Published | `div#edit-meta-published` | 1 |
| gone in After | before | `/node/1/edit` | key Alt+s the page | Last saved 17 Oct 2026 - 22:46 | `div#edit-meta-changed` | 1 |
| gone in After | before | `/node/1/edit` | key Alt+s the page | Author Anonymous | `div#edit-meta-author` | 1 |
| gone in After | before | `/node/1/edit` | key Alt+s the page | Briefly describe the changes you have made. | `div#edit-revision-log-0-value--description` | 1 |

Inside the control itself (its own text changed; a screen reader may not say it again): before click a.meta-sidebar__trigger.trigger "Hide sidebar pan… → "Show sidebar panel"; before click a.meta-sidebar__trigger.trigger "Show sidebar pan… → "Hide sidebar panel"; before key Enter a.meta-sidebar__trigger.trigger "Hide sidebar pan… → "Show sidebar panel"; before key Enter a.meta-sidebar__trigger.trigger "Show sidebar pan… → "Hide sidebar panel".

Before: 0 in a live region, 0 Drupal.announce() after the same action, 0 focus moved to it, 78 shown by the control pressed (expanded), 7 inside the control itself, 20 the name of a control that appeared or changed, 4 silent.
After: 0 in a live region, 0 Drupal.announce() after the same action, 4 focus moved to it, 121 shown by the control pressed (expanded), 0 inside the control itself, 3 the name of a control that appeared or changed, 0 silent.

