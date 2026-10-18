# MR !17421 review and proposed main update

Recommendation: keep the production implementation and Operations wording; add regression tests and retarget/rebase to main for Drupal 12. The production diff applies unchanged to main dbfce851242d. No rewrite, theme-specific workaround, or dependency on Paragraphs is needed.

## Added locally

- Main-based full patch retains the author's production fix and adds testActionsColumnHeader() in the existing MultipleValueWidgetTest class.
- Data provider exercises Stark and Default Admin.
- Assertions check Operations, its visually-hidden wrapper, and persistence through AJAX add/remove.
- Separate interdiff contains only this test-file addition.
- Lab recipe uses an unlimited core string field, avoiding a contributed-module dependency.
- Evaluator explicitly runs empty-table-header; a WCAG-only axe selection can omit this best-practice rule.

## Scope and remaining work

The table always reserves an actions column, including cases where no row exposes an action. Conditionally removing that column would require changing header/body alignment and widget assumptions, so it should remain a separate issue. Operations is consistent with existing Drupal action-column language. Adding scope attributes or revising table semantics generally is also outside this small fix.

The actions header is the second DOM th because the first spans two columns. The original report's third-th wording should be corrected to actions-column header or third logical column.

This is a proposed main port, not a remote MR update. The published MR still targets 11.4.x and cannot be retargeted here without authenticated Drupal GitLab write access. Preserve chamilsanjeewa's authorship/contribution when creating or updating the main-targeted MR. The interdiff's tests, main-based lint, AJAX runtime, keyboard behavior and screen-reader output still need execution. Review discussions are unverified because their API returned HTTP 401.

The proposed PHP tests must fail on pristine core and pass with the production fix before being submitted as verified coverage. This environment has no PHP or browser, so patch/tree checks are not claimed as PHPUnit passes.

AI assistance: local test addition, main-port packaging and Lab reproduction tooling. No production-code alteration beyond the upstream MR fix.
