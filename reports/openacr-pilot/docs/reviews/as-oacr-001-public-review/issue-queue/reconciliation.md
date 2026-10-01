# Drupal Issue Queue Reconciliation

> **Status:** `PUBLIC REVIEW DRAFT — NOT POSTED TO DRUPAL.ORG`
>
> **Evaluation:** `AS-OACR-001`
> **Checked:** 2026-08-23

This reconciliation keeps issue tracking separate from the evaluation result. Existing, closed,
or future Drupal issues do not change the measured outcome for the frozen test build.

| Finding | Queue disposition | Issue or draft | Why |
|---|---|---|---|
| `a11y_claro_bulk_button_contrast` | Existing exact issue | [Drupal core #3587668](https://www.drupal.org/project/drupal/issues/3587668) | The issue records the same `#edit-submit` component, white text on `#3371ff`, and 4.24:1 ratio. It is postponed because the maintainer needs more information. |
| `a11y_claro_article_edit_reflow` | Existing exact issue | [Drupal core #3577361](https://www.drupal.org/project/drupal/issues/3577361) | The issue records whole-page horizontal scrolling caused by the Navigation top bar on narrow content-edit pages. |
| `a11y_claro_status_report_reflow` | Existing broader issue; add current reproduction | [Drupal core #2280035](https://www.drupal.org/project/drupal/issues/2280035) | The open responsive-table issue explicitly records `/admin/reports/status` side-scrolling and is tagged for WCAG 1.4.10. The AS-OACR-001 result supplies a current Drupal 11.4.4 measurement. |
| `a11y_claro_empty_region_contrast` | New issue draft | `drafts/claro-empty-region-contrast.md` | [Drupal core #3293469](https://www.drupal.org/project/drupal/issues/3293469) contains the same 3.78:1 detector output, but that closed issue added automated tests and did not track the surviving visual defect as a dedicated issue. |
| `a11y_navigation_focus_tooltip_not_dismissible` | New issue draft | `drafts/navigation-focus-tooltip-dismissal.md` | [Drupal core #3197758](https://www.drupal.org/project/drupal/issues/3197758) discusses accessible tooltip/toggletip behavior, and [#3541728](https://www.drupal.org/project/drupal/issues/3541728) covers an Escape failure for submenus. Neither issue records this focus-triggered Navigation tooltip defect. |
| `a11y_olivero_tabs_trigger_focus_indicator` | New issue draft | `drafts/olivero-mobile-tabs-focus-indicator.md` | [Drupal core #3153260](https://www.drupal.org/project/drupal/issues/3153260) standardized Olivero focus states, and [Olivero #3125062](https://www.drupal.org/project/olivero/issues/3125062) covers a similar pager-focus contrast failure. Neither records the current `.tabs__trigger` result. |
| `a11y_navigation_logo_focus_not_visible` | Existing observation; new focused draft | `drafts/navigation-logo-focus-visible.md` | [Drupal core #3443571 comment #29](https://www.drupal.org/project/drupal/issues/3443571#comment-16457564) records the missing Home-logo focus indicator, but the issue was scoped to the mobile focus trap and is closed. Drupal 11.4.4 still reproduces the logo defect. |
| `a11y_navigation_breadcrumb_focus_obscured` | New issue draft | `drafts/navigation-breadcrumb-focus-obscured.md` | [Drupal core #3491044](https://www.drupal.org/project/drupal/issues/3491044) covers Navigation top-bar rendering but not complete keyboard-focus obstruction. No exact issue was found. |
| `a11y_claro_configure_label_not_in_name` | New issue draft | `drafts/block-layout-configure-label-in-name.md` | Public issue search found no exact report for BlockListBuilder changing the visible operation title without updating the inherited `aria-label`. |

## Prepared follow-up comments

- `comments/3587668-current-reproduction.md`
- `comments/3577361-current-reproduction.md`
- `comments/2280035-current-reproduction.md`

Nothing in this directory has been posted. These drafts are included in this pull request for human
review only; posting any issue or comment remains a separate action.
