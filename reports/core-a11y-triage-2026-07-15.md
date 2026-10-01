# Core Accessibility Triage (2026-07-15)

Generated: 2026-07-15T16:44:55.838Z

## Summary

- Open/active core accessibility issues in filter set: 247
- Locally reviewed issue IDs found in repo docs: 13
- Accessibility patch files linked to issue IDs: 9
- Accessibility patch files without issue linkage: 12
- Status breakdown: 1=96, 13=79, 14=1, 16=10, 18=16, 4=40, 8=5

## 1) Next 20 To Review (Core-only)

| Issue | Status | Title | Action |
|---|---:|---|---|
| [#3593502](https://www.drupal.org/project/drupal/issues/3593502) | 8 | Introduce a new Menu UI to resolve memory issues and improve user experience | review-needed |
| [#3568310](https://www.drupal.org/project/drupal/issues/3568310) | 8 | Logged in admin in Olivero theme - Vertical toolbar triggers horizontal scrollbar due to skip-link width | review-needed |
| [#3232414](https://www.drupal.org/project/drupal/issues/3232414) | 8 | Image Media thumbnail alt text cannot be changed without reuploading the image | review-needed |
| [#2921627](https://www.drupal.org/project/drupal/issues/2921627) | 8 | Do not use a CSS-only required marker in forms per WCAG 2.0 | review-needed |
| [#3272325](https://www.drupal.org/project/drupal/issues/3272325) | 13 | Password suggestions are hidden from screenreaders | review-needed |
| [#3272316](https://www.drupal.org/project/drupal/issues/3272316) | 13 | Claro's vertical tabs' aria states don't always properly reflect state at mobile | review-needed |
| [#3272266](https://www.drupal.org/project/drupal/issues/3272266) | 13 | Grey button's background color has a too low contrast ratio against page background | review-needed |
| [#3262808](https://www.drupal.org/project/drupal/issues/3262808) | 13 | Separate tab title and "(active tab)" indicator | review-needed |
| [#3231744](https://www.drupal.org/project/drupal/issues/3231744) | 13 | Replace Olivero usage of --color--blue-50 in text | review-needed |
| [#3218877](https://www.drupal.org/project/drupal/issues/3218877) | 13 | Labels do not have correct 'for' attribute if 'id' set in #attributes | review-needed |
| [#3210434](https://www.drupal.org/project/drupal/issues/3210434) | 13 | Olivero: Header menu should not close if menu item has focus | review-needed |
| [#3209129](https://www.drupal.org/project/drupal/issues/3209129) | 13 | Scrolling problems when adding a block via layout builder | review-needed |
| [#3200635](https://www.drupal.org/project/drupal/issues/3200635) | 13 | Olivero: Description text of disabled form elements should have styling indicate they're disabled | review-needed |
| [#3200584](https://www.drupal.org/project/drupal/issues/3200584) | 13 | Olivero's focus state outline can get cut off certain situations | review-needed |
| [#3191806](https://www.drupal.org/project/drupal/issues/3191806) | 13 | Only close Olivero sub-menus when resize results in a different menu format | review-needed |
| [#3159933](https://www.drupal.org/project/drupal/issues/3159933) | 13 | Status Message in Claro on theme install should have role="status" or similar instead of contentinfo | review-needed |
| [#3152111](https://www.drupal.org/project/drupal/issues/3152111) | 13 | oEmbed iframes must have unique title attributes | review-needed |
| [#3129257](https://www.drupal.org/project/drupal/issues/3129257) | 13 | Olivero: Mobile tabs can become out of order if browser is resized | review-needed |
| [#3127469](https://www.drupal.org/project/drupal/issues/3127469) | 13 | Form element error state not visible on Windows high contrast | review-needed |
| [#3100133](https://www.drupal.org/project/drupal/issues/3100133) | 13 | Ajax replace inside a modal causes the current field to lose focus. | review-needed |

## 2) Patch Without Issue Association Proposals

| Patch | Recommendation | Candidate 1 | Candidate 2 | Candidate 3 |
|---|---|---|---|---|
| a11y-DRUPAL-A11Y-001-file-widget-display-labels.patch | associate-existing-issue | [#3543395](https://www.drupal.org/project/drupal/issues/3543395) (s:16, score:1) | [#3399980](https://www.drupal.org/project/drupal/issues/3399980) (s:1, score:1) | [#3361375](https://www.drupal.org/project/drupal/issues/3361375) (s:1, score:1) |
| a11y-DRUPAL-A11Y-002-submit-button-contrast.patch | associate-existing-issue | [#3272266](https://www.drupal.org/project/drupal/issues/3272266) (s:13, score:2) | [#2616184](https://www.drupal.org/project/drupal/issues/2616184) (s:13, score:2) | [#3595627](https://www.drupal.org/project/drupal/issues/3595627) (s:4, score:1) |
| a11y-DRUPAL-A11Y-003-select-all-checkbox-aria-label.patch | associate-existing-issue | [#851164](https://www.drupal.org/project/drupal/issues/851164) (s:18, score:4) | [#3273054](https://www.drupal.org/project/drupal/issues/3273054) (s:1, score:3) | [#3271652](https://www.drupal.org/project/drupal/issues/3271652) (s:4, score:3) |
| a11y-DRUPAL-A11Y-003-select-all-checkbox-label.patch | associate-existing-issue | [#851164](https://www.drupal.org/project/drupal/issues/851164) (s:18, score:4) | [#3273054](https://www.drupal.org/project/drupal/issues/3273054) (s:1, score:3) | [#3271652](https://www.drupal.org/project/drupal/issues/3271652) (s:4, score:3) |
| a11y-DRUPAL-A11Y-003-views-select-all-checkbox-label.patch | associate-existing-issue | [#851164](https://www.drupal.org/project/drupal/issues/851164) (s:18, score:4) | [#3543463](https://www.drupal.org/project/drupal/issues/3543463) (s:1, score:3) | [#3273054](https://www.drupal.org/project/drupal/issues/3273054) (s:1, score:3) |
| a11y-DRUPAL-A11Y-004-tabindex-buttons-test-form.patch | associate-existing-issue | [#3537503](https://www.drupal.org/project/drupal/issues/3537503) (s:4, score:1) | [#3534229](https://www.drupal.org/project/drupal/issues/3534229) (s:1, score:1) | [#3506333](https://www.drupal.org/project/drupal/issues/3506333) (s:4, score:1) |
| a11y-DRUPAL-A11Y-005-language-switcher-contrast.patch | associate-existing-issue | [#3049125](https://www.drupal.org/project/drupal/issues/3049125) (s:1, score:2) | [#3049122](https://www.drupal.org/project/drupal/issues/3049122) (s:1, score:2) | [#3587668](https://www.drupal.org/project/drupal/issues/3587668) (s:16, score:1) |
| a11y-DRUPAL-A11Y-006-theme-switcher-landmark.patch | associate-existing-issue | [#3105316](https://www.drupal.org/project/drupal/issues/3105316) (s:13, score:2) | [#3049125](https://www.drupal.org/project/drupal/issues/3049125) (s:1, score:2) | [#3049122](https://www.drupal.org/project/drupal/issues/3049122) (s:1, score:2) |
| a11y-DRUPAL-A11Y-007-messages-landmark-role.patch | associate-existing-issue | [#3159933](https://www.drupal.org/project/drupal/issues/3159933) (s:13, score:2) | [#3582950](https://www.drupal.org/project/drupal/issues/3582950) (s:16, score:1) | [#3573865](https://www.drupal.org/project/drupal/issues/3573865) (s:8, score:1) |
| a11y-DRUPAL-A11Y-008-empty-table-headers.patch | associate-existing-issue | [#2937640](https://www.drupal.org/project/drupal/issues/2937640) (s:13, score:2) | [#2494327](https://www.drupal.org/project/drupal/issues/2494327) (s:18, score:2) | [#3595627](https://www.drupal.org/project/drupal/issues/3595627) (s:4, score:1) |
| a11y-DRUPAL-A11Y-009-module-summary-names.patch | associate-existing-issue | [#3573865](https://www.drupal.org/project/drupal/issues/3573865) (s:8, score:2) | [#3432727](https://www.drupal.org/project/drupal/issues/3432727) (s:4, score:1) | [#3155130](https://www.drupal.org/project/drupal/issues/3155130) (s:13, score:1) |
| a11y-LABEL-IN-NAME-004-filter-format-aria-label.patch | associate-existing-issue | [#3273054](https://www.drupal.org/project/drupal/issues/3273054) (s:1, score:3) | [#3543395](https://www.drupal.org/project/drupal/issues/3543395) (s:16, score:2) | [#3083181](https://www.drupal.org/project/drupal/issues/3083181) (s:13, score:2) |

## 3) Full Triage Table (Core-only Inventory)

| Issue | Status | Reviewed | Patch Linked | Action | Title |
|---|---:|---:|---:|---|---|
| [#222380](https://www.drupal.org/project/drupal/issues/222380) | 18 | no | no | review-needed | No error highlighting on form checkbox or radio input types |
| [#851164](https://www.drupal.org/project/drupal/issues/851164) | 18 | no | no | review-needed | Tableselect: "select all rows in this table" header checkbox causing accessibility problems |
| [#867830](https://www.drupal.org/project/drupal/issues/867830) | 13 | no | no | review-needed | "Unpublished" style of rendered entities is not accessible (and looks bad) |
| [#879792](https://www.drupal.org/project/drupal/issues/879792) | 18 | no | no | review-needed | Default search results block has low usability on title, breadcrumb |
| [#919336](https://www.drupal.org/project/drupal/issues/919336) | 18 | no | no | review-needed | When selecting a new formatter or editing settings focus context is lost |
| [#1562776](https://www.drupal.org/project/drupal/issues/1562776) | 4 | no | no | review-needed | Edit Summary label is unclear to users |
| [#1852090](https://www.drupal.org/project/drupal/issues/1852090) | 13 | no | no | review-needed | Cached render elements can have duplicate HTML IDs |
| [#1857946](https://www.drupal.org/project/drupal/issues/1857946) | 13 | no | no | review-needed | Comment parent template variables are built twice |
| [#1860972](https://www.drupal.org/project/drupal/issues/1860972) | 18 | no | no | review-needed | Remove accessible announcement text |
| [#1920876](https://www.drupal.org/project/drupal/issues/1920876) | 13 | no | no | review-needed | Add a tiny bit of state magic in the image.module and hide the Title and Alt groups when the related form items are disabled |
| [#1925530](https://www.drupal.org/project/drupal/issues/1925530) | 18 | no | no | review-needed | Toolbar tabbing issues |
| [#1966990](https://www.drupal.org/project/drupal/issues/1966990) | 18 | no | no | review-needed | Forms API drupal_process_states() hidden content is not visible to screen readers |
| [#2047089](https://www.drupal.org/project/drupal/issues/2047089) | 1 | no | no | review-needed | Content translation settings UI should leverage Drupal.announce() to inform screen reader users of dynamic changes |
| [#2089703](https://www.drupal.org/project/drupal/issues/2089703) | 13 | no | no | review-needed | The file upload field needs a progress indicator that expresses to screen reading user agents when a file upload is finished |
| [#2096013](https://www.drupal.org/project/drupal/issues/2096013) | 13 | no | no | review-needed | Exposed filter operators should have field labels |
| [#2258197](https://www.drupal.org/project/drupal/issues/2258197) | 18 | no | no | review-needed | Toolbar is unavailable for screen reader on the iPhone/iPad |
| [#2279111](https://www.drupal.org/project/drupal/issues/2279111) | 13 | no | no | review-needed | Labels should not have "for" attribute for non labelable elements |
| [#2280035](https://www.drupal.org/project/drupal/issues/2280035) | 13 | no | no | review-needed | Add another responsive tables solution that doesn't hide content |
| [#2313471](https://www.drupal.org/project/drupal/issues/2313471) | 1 | no | no | review-needed | Re-wrap text in views interface when zooming in mobile |
| [#2349313](https://www.drupal.org/project/drupal/issues/2349313) | 18 | no | no | review-needed | Can't backtab past Image tab in format edit |
| [#2443815](https://www.drupal.org/project/drupal/issues/2443815) | 13 | yes | yes | advance-with-patch | #description_display broken for details elements |
| [#2449539](https://www.drupal.org/project/drupal/issues/2449539) | 4 | no | no | review-needed | Skip link not visible without javascript |
| [#2455933](https://www.drupal.org/project/drupal/issues/2455933) | 13 | no | no | review-needed | Error highlighting and reporting problems for the current password on the user profile form |
| [#2494327](https://www.drupal.org/project/drupal/issues/2494327) | 18 | no | no | review-needed | #type tableselect with #multiple TRUE outputs invalid HTML (duplicate id attributes) |
| [#2514218](https://www.drupal.org/project/drupal/issues/2514218) | 4 | no | no | review-needed | [regression] Pages Manage Fields, Manage form, Manage display should include name of content type or entity |
| [#2547053](https://www.drupal.org/project/drupal/issues/2547053) | 18 | no | no | review-needed | Display name is obscured by display command dropdown in narrow layout |
| [#2547063](https://www.drupal.org/project/drupal/issues/2547063) | 1 | no | no | review-needed | Remove the aria-describedby introduced in FAPI if there is no description |
| [#2560467](https://www.drupal.org/project/drupal/issues/2560467) | 13 | no | no | review-needed | Inline Errors not shown for container elements |
| [#2563173](https://www.drupal.org/project/drupal/issues/2563173) | 13 | no | no | review-needed | Display 'required' validation errors for form elements that do not provide a #title |
| [#2574721](https://www.drupal.org/project/drupal/issues/2574721) | 13 | no | no | review-needed | Provide access to action links in the modules page on small screens |
| [#2608180](https://www.drupal.org/project/drupal/issues/2608180) | 1 | no | no | review-needed | View Search Filter's Label isn't Associated with Input  |
| [#2608212](https://www.drupal.org/project/drupal/issues/2608212) | 13 | no | no | review-needed | Elements on grouped exposed filters configuration form are missing accessible names |
| [#2616184](https://www.drupal.org/project/drupal/issues/2616184) | 13 | no | no | review-needed | Right click should not submit buttons with Ajax behaviors |
| [#2638250](https://www.drupal.org/project/drupal/issues/2638250) | 13 | no | no | review-needed | The label "Member for" on user profiles is hardcoded markup that is different from other user fields |
| [#2687251](https://www.drupal.org/project/drupal/issues/2687251) | 1 | no | no | review-needed | Radios / Checkboxes focus styling wrong when marked as having an error |
| [#2715687](https://www.drupal.org/project/drupal/issues/2715687) | 16 | no | no | review-needed | make templates use 'display_label' in consistent manner |
| [#2719453](https://www.drupal.org/project/drupal/issues/2719453) | 13 | no | no | review-needed | Tableselect single radio button missing #title attribute and is not accessible |
| [#2722457](https://www.drupal.org/project/drupal/issues/2722457) | 4 | no | no | review-needed | [pp-upstream] comma-list (item-list element) humanizes poorly. |
| [#2789685](https://www.drupal.org/project/drupal/issues/2789685) | 18 | no | no | review-needed | Install page & maintenance page skip links not working |
| [#2805197](https://www.drupal.org/project/drupal/issues/2805197) | 13 | no | no | review-needed | Provide screen-reader feedback when Views UI filterable options are updated |
| [#2805227](https://www.drupal.org/project/drupal/issues/2805227) | 4 | no | no | review-needed | Make sure Place Block buttons identify as buttons in Block layout UI. |
| [#2805499](https://www.drupal.org/project/drupal/issues/2805499) | 13 | no | no | review-needed | Provide screen reader feedback when Views List is filtered by name or description |
| [#2809347](https://www.drupal.org/project/drupal/issues/2809347) | 13 | no | no | review-needed | All links using the "button" role should respond to spacebar, not only to enter key |
| [#2822778](https://www.drupal.org/project/drupal/issues/2822778) | 4 | no | no | review-needed | Modal popups in views is not showing properly when toolbar tray is upon modal |
| [#2827034](https://www.drupal.org/project/drupal/issues/2827034) | 13 | no | no | review-needed | DateList and date range inline form errors are repeated |
| [#2847425](https://www.drupal.org/project/drupal/issues/2847425) | 13 | no | no | review-needed | #states not affecting visibility/requirement of managed_file |
| [#2848307](https://www.drupal.org/project/drupal/issues/2848307) | 1 | no | no | review-needed | Inline errors not working on form table elements |
| [#2848507](https://www.drupal.org/project/drupal/issues/2848507) | 13 | no | no | review-needed | Indicate that grouping elements have child element errors for ux and a11y |
| [#2852723](https://www.drupal.org/project/drupal/issues/2852723) | 16 | no | no | review-needed | 508 Compliance Issue - Dynamic Appearing Message |
| [#2852874](https://www.drupal.org/project/drupal/issues/2852874) | 1 | no | no | review-needed | [Meta] Set the required state for all fields in Core in the Accessibility Object Model (AOM) |
| [#2873404](https://www.drupal.org/project/drupal/issues/2873404) | 13 | no | no | review-needed | Improve Accessibility: Ensure Screen Readers Do Not Announce Plus-sign for Local-action Links |
| [#2876321](https://www.drupal.org/project/drupal/issues/2876321) | 4 | no | no | review-needed | Update inline form errors summary after form validation with AJAX |
| [#2893663](https://www.drupal.org/project/drupal/issues/2893663) | 1 | no | no | review-needed | Dropbutton should report open/closed state to assistive technology |
| [#2895388](https://www.drupal.org/project/drupal/issues/2895388) | 13 | no | no | review-needed | Modules uninstall filter does not filter by machine name |
| [#2896683](https://www.drupal.org/project/drupal/issues/2896683) | 13 | no | no | review-needed | Add context to accessible names for datetime range field inputs |
| [#2910095](https://www.drupal.org/project/drupal/issues/2910095) | 18 | no | no | review-needed | 508 - Content Editor page field descriptions are not read by screen readers |
| [#2910098](https://www.drupal.org/project/drupal/issues/2910098) | 18 | no | no | review-needed | [upstream] 508 - WYSIWYG toolbar is not fully keyboard accessible |
| [#2910102](https://www.drupal.org/project/drupal/issues/2910102) | 1 | no | no | review-needed | Improve icon color contrast for WCAG 2.1 |
| [#2911733](https://www.drupal.org/project/drupal/issues/2911733) | 13 | no | no | review-needed | Uncheck block "display title" by default |
| [#2912806](https://www.drupal.org/project/drupal/issues/2912806) | 16 | no | no | review-needed | 508 - Content Type tab JAWS prompts |
| [#2913378](https://www.drupal.org/project/drupal/issues/2913378) | 1 | no | no | review-needed | Bulk Action Results are not read by Screen Reader |
| [#2917501](https://www.drupal.org/project/drupal/issues/2917501) | 16 | no | no | review-needed | Title of Expansion Section Not Announced By JAWS/NVDA (IE/Edge Only) |
| [#2919837](https://www.drupal.org/project/drupal/issues/2919837) | 4 | no | no | review-needed | Accessibility Issues with Off-Canvas dialog |
| [#2921627](https://www.drupal.org/project/drupal/issues/2921627) | 8 | no | no | review-needed | Do not use a CSS-only required marker in forms per WCAG 2.0 |
| [#2922332](https://www.drupal.org/project/drupal/issues/2922332) | 18 | no | no | review-needed | Legends for certain fields are not announced by JAWS |
| [#2922435](https://www.drupal.org/project/drupal/issues/2922435) | 13 | no | no | review-needed | "Add new comment" and "@count comments" links are not following accessibility good practices |
| [#2925295](https://www.drupal.org/project/drupal/issues/2925295) | 1 | no | no | review-needed | Make sure controls within hidden content are not focusable |
| [#2928531](https://www.drupal.org/project/drupal/issues/2928531) | 13 | no | no | review-needed | Off-canvas resize handlers are broken by dialog.css in Classy theme and System tray module |
| [#2933553](https://www.drupal.org/project/drupal/issues/2933553) | 18 | no | no | review-needed | 508 Compliance - Missing Edit Instructions |
| [#2933984](https://www.drupal.org/project/drupal/issues/2933984) | 1 | no | no | review-needed | 508 Compliance - Tooltips not displayed for keyboard navigation |
| [#2937640](https://www.drupal.org/project/drupal/issues/2937640) | 13 | no | no | review-needed | Umami theme ignores placeholders and HTML replaced elements when checking for empty regions |
| [#2940023](https://www.drupal.org/project/drupal/issues/2940023) | 4 | no | no | review-needed | [PP-1] Improve accessibility of Umami's responsive main menu |
| [#2942037](https://www.drupal.org/project/drupal/issues/2942037) | 1 | no | no | review-needed | Admin list filter fields are inconsistently labelled. |
| [#2942238](https://www.drupal.org/project/drupal/issues/2942238) | 4 | no | no | review-needed | Umami Banner Block: check presence of text alternative Firefox + NVDA |
| [#2942404](https://www.drupal.org/project/drupal/issues/2942404) | 13 | no | no | review-needed | System messages should be accessible |
| [#2942506](https://www.drupal.org/project/drupal/issues/2942506) | 4 | no | no | review-needed | Better focus style for image links in Umami |
| [#2950999](https://www.drupal.org/project/drupal/issues/2950999) | 1 | no | no | review-needed | Checkboxes element missing "required" attribute |
| [#2951317](https://www.drupal.org/project/drupal/issues/2951317) | 13 | no | no | review-needed | Radios element missing "required" attribute |
| [#2960415](https://www.drupal.org/project/drupal/issues/2960415) | 1 | no | no | review-needed | Media alt text not available in Views |
| [#2960772](https://www.drupal.org/project/drupal/issues/2960772) | 1 | no | no | review-needed | Dynamically appearing popup window is not announced by JAWS. (Content Editor) |
| [#2973114](https://www.drupal.org/project/drupal/issues/2973114) | 1 | no | no | review-needed | When enabling or disabling a block, don't move the focus to the top of the page |
| [#2973116](https://www.drupal.org/project/drupal/issues/2973116) | 1 | no | no | review-needed | After enabling or disabling a view, convey changes to screen reader users. |
| [#2973140](https://www.drupal.org/project/drupal/issues/2973140) | 13 | no | no | review-needed | Convey AJAX progress messages to assistive technology. |
| [#2973257](https://www.drupal.org/project/drupal/issues/2973257) | 4 | no | no | review-needed | Create the Umami Menu Toggle Button via JS so it's not present when JS is not enabled |
| [#2973258](https://www.drupal.org/project/drupal/issues/2973258) | 4 | no | no | review-needed | Place the Umami menu button inside the <nav> element |
| [#2974754](https://www.drupal.org/project/drupal/issues/2974754) | 1 | no | no | review-needed | Exposed filter elements do not have aria-describedby attributes |
| [#3000724](https://www.drupal.org/project/drupal/issues/3000724) | 4 | no | no | review-needed | Fix accessibility problems in Umami's branding block |
| [#3019849](https://www.drupal.org/project/drupal/issues/3019849) | 1 | no | no | review-needed | Return focus to point of action when the off-canvas dialog closes |
| [#3028647](https://www.drupal.org/project/drupal/issues/3028647) | 13 | no | no | review-needed | Range FAPI element has inconsistent style between browsers, including error state. |
| [#3028780](https://www.drupal.org/project/drupal/issues/3028780) | 13 | no | no | review-needed | Contextual links button should use aria-expanded instead of aria-pressed |
| [#3033436](https://www.drupal.org/project/drupal/issues/3033436) | 1 | no | no | review-needed | h4 in template_preprocess_field_multiple_value is not valid as child of th |
| [#3035435](https://www.drupal.org/project/drupal/issues/3035435) | 13 | no | no | review-needed | Make the show/hide row weights button more informative for assistive tech users. |
| [#3037446](https://www.drupal.org/project/drupal/issues/3037446) | 13 | no | no | review-needed | Forms with required fields marked by asterisk do not have text explaining what the asterisk means |
| [#3037625](https://www.drupal.org/project/drupal/issues/3037625) | 13 | no | no | review-needed | Duplicate label field when adding field w/o JS |
| [#3037725](https://www.drupal.org/project/drupal/issues/3037725) | 1 | no | no | review-needed | Convey successful outcome of add-section operation via assitive tech |
| [#3037726](https://www.drupal.org/project/drupal/issues/3037726) | 1 | no | no | review-needed | Convey successful outcome of add-block operation via assitive tech |
| [#3037730](https://www.drupal.org/project/drupal/issues/3037730) | 1 | no | no | review-needed | Convey outcome of remove-block operation via assistive tech |
| [#3037733](https://www.drupal.org/project/drupal/issues/3037733) | 1 | no | no | review-needed | Convey outcome of remove-section operation via assistive tech |
| [#3037742](https://www.drupal.org/project/drupal/issues/3037742) | 1 | no | no | review-needed | The toggle that makes Contextual Links visible at all times might not be sufficiently discoverable |
| [#3037779](https://www.drupal.org/project/drupal/issues/3037779) | 1 | no | no | review-needed | Configure section and Remove section links interrupt the flow for keyboard users and are visually distracting |
| [#3042107](https://www.drupal.org/project/drupal/issues/3042107) | 1 | no | no | review-needed | Layout Builder actions are inconvenient to access via keyboard navigation |
| [#3042984](https://www.drupal.org/project/drupal/issues/3042984) | 13 | no | no | review-needed | template_preprocess_username fails to set language attribute |
| [#3046089](https://www.drupal.org/project/drupal/issues/3046089) | 1 | yes | no | advance-or-retest | Accessibility of Main toolbar items and internal editing  |
| [#3046447](https://www.drupal.org/project/drupal/issues/3046447) | 13 | no | no | review-needed | Restore cursor position on #ajax 'input' or 'keyup' event |
| [#3049086](https://www.drupal.org/project/drupal/issues/3049086) | 1 | no | no | review-needed | Supporting disabled buttons leads to poor usability and accessibility |
| [#3049122](https://www.drupal.org/project/drupal/issues/3049122) | 1 | no | no | review-needed | Links in language switcher block do not conform to WCAG language-of-parts |
| [#3049125](https://www.drupal.org/project/drupal/issues/3049125) | 1 | yes | yes | advance-with-patch | Language switcher block is an unlabelled navigation landmark region |
| [#3053707](https://www.drupal.org/project/drupal/issues/3053707) | 1 | no | no | review-needed | Pager arrows should be easier to override in themes |
| [#3054914](https://www.drupal.org/project/drupal/issues/3054914) | 4 | no | no | review-needed | Autocomplete fields do not announce help text when focus is in input field |
| [#3056806](https://www.drupal.org/project/drupal/issues/3056806) | 4 | no | no | review-needed | Autocomplete not functioning with Voiceover |
| [#3059168](https://www.drupal.org/project/drupal/issues/3059168) | 13 | no | no | review-needed | Severity column icons on admin/reports/dblog are not accessible |
| [#3061090](https://www.drupal.org/project/drupal/issues/3061090) | 13 | no | no | review-needed | Drupal.announce debounce usage issue |
| [#3068698](https://www.drupal.org/project/drupal/issues/3068698) | 13 | no | no | review-needed | Better shortcut action link styles when there's limited horizontal space |
| [#3073895](https://www.drupal.org/project/drupal/issues/3073895) | 13 | no | no | review-needed | System Menu blocks placed via Layout Builder can generate duplicate, invalid HTML ID attributes |
| [#3076153](https://www.drupal.org/project/drupal/issues/3076153) | 4 | no | no | review-needed | Off-canvas dialog <optgroup> styling in Firefox is illegible  |
| [#3078334](https://www.drupal.org/project/drupal/issues/3078334) | 13 | no | no | review-needed | Datetime and Datelist elements should render as fieldsets |
| [#3080853](https://www.drupal.org/project/drupal/issues/3080853) | 13 | no | no | review-needed | Improve link text on available updates page to address WCAG SC 2.4.9 Link purpose (link only) |
| [#3081475](https://www.drupal.org/project/drupal/issues/3081475) | 1 | no | no | review-needed | According to the WCAG guidelines decorative images should not have an alt-text but this is not possible |
| [#3081500](https://www.drupal.org/project/drupal/issues/3081500) | 13 | no | no | review-needed | Accessibility bugs with vertical tabs |
| [#3081515](https://www.drupal.org/project/drupal/issues/3081515) | 1 | no | no | review-needed | Add a new, accessible datepicker library to avoid using native browser datepickers for accessibility and consistency |
| [#3081526](https://www.drupal.org/project/drupal/issues/3081526) | 13 | no | no | review-needed | Add announcement after clicking 'Save and select' in the media library. |
| [#3083181](https://www.drupal.org/project/drupal/issues/3083181) | 13 | no | no | review-needed | Menu blocks in Layout Builder get malformed aria-labelledby attribute |
| [#3083994](https://www.drupal.org/project/drupal/issues/3083994) | 4 | no | no | review-needed | Difficult for authors to embed image media with empty alt text. |
| [#3084011](https://www.drupal.org/project/drupal/issues/3084011) | 1 | no | no | review-needed | The source of alt text in embedded image media is not clear |
| [#3084554](https://www.drupal.org/project/drupal/issues/3084554) | 13 | no | no | review-needed | Change the way the + before the Add Content link is presented on admin/content so that NVDA on Firefox doesn't bury the link |
| [#3084560](https://www.drupal.org/project/drupal/issues/3084560) | 13 | no | no | review-needed | Ensure that when the Media Library disables media items so that they cannot be selected, that they are also disabled for screenreader access |
| [#3085545](https://www.drupal.org/project/drupal/issues/3085545) | 4 | no | no | review-needed | title attribute still not added to oEmbed iframe |
| [#3085811](https://www.drupal.org/project/drupal/issues/3085811) | 4 | no | no | review-needed | Toolbar buttons should respond to spacebar key |
| [#3087305](https://www.drupal.org/project/drupal/issues/3087305) | 13 | no | no | review-needed | Form validation error messages within the Media Library widget are not read by the screenreader |
| [#3087313](https://www.drupal.org/project/drupal/issues/3087313) | 13 | no | no | review-needed | In the media library modal, improve the labels on the media-type tabs for screen readers |
| [#3087385](https://www.drupal.org/project/drupal/issues/3087385) | 13 | no | no | review-needed | If the user attempts to upload an incorrect file type through the media library modal, the error message is not read by the screenreader |
| [#3087396](https://www.drupal.org/project/drupal/issues/3087396) | 1 | no | no | review-needed | When uploading new media items in a field using the media library modal, if as a screenreader user you expand "additional selected media", you are not given any announcement of what happened |
| [#3087402](https://www.drupal.org/project/drupal/issues/3087402) | 4 | no | no | review-needed | Add announcement of maximum number of items when adding media |
| [#3087403](https://www.drupal.org/project/drupal/issues/3087403) | 1 | no | no | review-needed | For screenreader users, after adding media through the media library, the resulting file list on the node form should follow the add media button instead of being before it |
| [#3087535](https://www.drupal.org/project/drupal/issues/3087535) | 13 | no | no | review-needed | In WYSIWYG embed modal for existing images, the alt text field should have a default value instead of placeholder text |
| [#3088245](https://www.drupal.org/project/drupal/issues/3088245) | 13 | no | no | review-needed | Convey form error messages to assistive technologies |
| [#3088500](https://www.drupal.org/project/drupal/issues/3088500) | 13 | no | no | review-needed | sticky table not passing aria (WCAG2) validation |
| [#3089711](https://www.drupal.org/project/drupal/issues/3089711) | 1 | no | no | review-needed | Single-value and multi-value link field widgets behave differently in voiceover |
| [#3089888](https://www.drupal.org/project/drupal/issues/3089888) | 13 | no | no | review-needed | MessageCommand with no announce option announces message type |
| [#3090120](https://www.drupal.org/project/drupal/issues/3090120) | 13 | no | no | review-needed | Improve accessibility semantics for Toolbar buttons with trays |
| [#3090371](https://www.drupal.org/project/drupal/issues/3090371) | 1 | no | no | review-needed | Drupal.Message.add passing messages to Drupal.announce is usually redundant |
| [#3091534](https://www.drupal.org/project/drupal/issues/3091534) | 13 | no | no | review-needed | Elements inside system-status-report__entry lose partial focus styling |
| [#3092279](https://www.drupal.org/project/drupal/issues/3092279) | 1 | no | no | review-needed | '#multiple' => true \| false has no effect with CheckBoxes object |
| [#3097905](https://www.drupal.org/project/drupal/issues/3097905) | 4 | no | no | review-needed | Add visual indicator to show which toolbar buttons have trays associated with them |
| [#3098857](https://www.drupal.org/project/drupal/issues/3098857) | 13 | no | no | review-needed | "drupal-live-announce" is not contained in a landmark. |
| [#3100133](https://www.drupal.org/project/drupal/issues/3100133) | 13 | no | no | review-needed | Ajax replace inside a modal causes the current field to lose focus. |
| [#3100525](https://www.drupal.org/project/drupal/issues/3100525) | 1 | no | no | review-needed | Broken Aria References |
| [#3105316](https://www.drupal.org/project/drupal/issues/3105316) | 13 | yes | no | advance-or-retest | Add accessible names to theme region complementary landmarks |
| [#3127469](https://www.drupal.org/project/drupal/issues/3127469) | 13 | no | no | review-needed | Form element error state not visible on Windows high contrast |
| [#3129257](https://www.drupal.org/project/drupal/issues/3129257) | 13 | no | no | review-needed | Olivero: Mobile tabs can become out of order if browser is resized |
| [#3152111](https://www.drupal.org/project/drupal/issues/3152111) | 13 | no | no | review-needed | oEmbed iframes must have unique title attributes |
| [#3155130](https://www.drupal.org/project/drupal/issues/3155130) | 13 | yes | no | advance-or-retest | "Edit summary" toggle on text fields has many accessibility issues |
| [#3159933](https://www.drupal.org/project/drupal/issues/3159933) | 13 | no | no | review-needed | Status Message in Claro on theme install should have role="status" or similar instead of contentinfo |
| [#3164587](https://www.drupal.org/project/drupal/issues/3164587) | 1 | no | no | review-needed | Text resize on wide screen layout also causes reflow to single column, making the layout too wide |
| [#3164800](https://www.drupal.org/project/drupal/issues/3164800) | 1 | no | no | review-needed | Accordions on content form are difficult to understand when using system or browser zoom preferences |
| [#3164806](https://www.drupal.org/project/drupal/issues/3164806) | 1 | no | no | review-needed | Purpose of filters fieldset on admin pages is unclear when zoomed in, and for cognitive accessibility |
| [#3167438](https://www.drupal.org/project/drupal/issues/3167438) | 4 | no | no | review-needed | Presentation of some toolbar buttons differs from DOM order |
| [#3171726](https://www.drupal.org/project/drupal/issues/3171726) | 4 | no | no | review-needed | Claro Shortcuts star fails WCAG Use of Color and Non-text contrast |
| [#3174459](https://www.drupal.org/project/drupal/issues/3174459) | 4 | no | no | review-needed | [PP-1] W3C Validation: required attribute not allowed on fieldset tag  |
| [#3177370](https://www.drupal.org/project/drupal/issues/3177370) | 1 | no | no | review-needed | Improve Olivero's element chunking for smoother switch access traversal |
| [#3177475](https://www.drupal.org/project/drupal/issues/3177475) | 4 | no | no | review-needed | Olivero: Ensure long words break properly when zoomed in to provide proper reflow |
| [#3191806](https://www.drupal.org/project/drupal/issues/3191806) | 13 | no | no | review-needed | Only close Olivero sub-menus when resize results in a different menu format |
| [#3200584](https://www.drupal.org/project/drupal/issues/3200584) | 13 | no | no | review-needed | Olivero's focus state outline can get cut off certain situations |
| [#3200635](https://www.drupal.org/project/drupal/issues/3200635) | 13 | no | no | review-needed | Olivero: Description text of disabled form elements should have styling indicate they're disabled |
| [#3201816](https://www.drupal.org/project/drupal/issues/3201816) | 1 | no | no | review-needed | Accessibility fail password strength track.  |
| [#3206947](https://www.drupal.org/project/drupal/issues/3206947) | 4 | no | no | review-needed | Messages block that appears in Settings Tray is incorrectly styled and does not meet contrast |
| [#3207795](https://www.drupal.org/project/drupal/issues/3207795) | 1 | no | no | review-needed | Potential header menu "X" close-icon usability issue in Olivero |
| [#3209129](https://www.drupal.org/project/drupal/issues/3209129) | 13 | no | no | review-needed | Scrolling problems when adding a block via layout builder |
| [#3210434](https://www.drupal.org/project/drupal/issues/3210434) | 13 | no | no | review-needed | Olivero: Header menu should not close if menu item has focus |
| [#3218877](https://www.drupal.org/project/drupal/issues/3218877) | 13 | no | no | review-needed | Labels do not have correct 'for' attribute if 'id' set in #attributes |
| [#3227614](https://www.drupal.org/project/drupal/issues/3227614) | 1 | no | no | review-needed | Autocomplete icon fails to meet WCAG contrast guidelines in Windows high contrast/ forced colors mode |
| [#3230231](https://www.drupal.org/project/drupal/issues/3230231) | 1 | no | no | review-needed | image field alt help/description should distinguish between decorative & meaningful images |
| [#3231744](https://www.drupal.org/project/drupal/issues/3231744) | 13 | no | no | review-needed | Replace Olivero usage of --color--blue-50 in text |
| [#3232414](https://www.drupal.org/project/drupal/issues/3232414) | 8 | no | no | review-needed | Image Media thumbnail alt text cannot be changed without reuploading the image |
| [#3243173](https://www.drupal.org/project/drupal/issues/3243173) | 1 | no | no | review-needed | Form focus / screen reader issues related to server side form validation |
| [#3262808](https://www.drupal.org/project/drupal/issues/3262808) | 13 | no | no | review-needed | Separate tab title and "(active tab)" indicator |
| [#3269342](https://www.drupal.org/project/drupal/issues/3269342) | 1 | no | no | review-needed | "Edit" cog icon for Field UI does not meet contrast minimums when in forced colors |
| [#3269420](https://www.drupal.org/project/drupal/issues/3269420) | 4 | no | no | review-needed | Toolbar icons may not meet contrast when in forced colors mode |
| [#3270130](https://www.drupal.org/project/drupal/issues/3270130) | 4 | no | no | review-needed | [upstream] CKEditor 5 toolbar UI (+ Drupal's admin UI for configuring it) *technically* has WHCM regression |
| [#3270230](https://www.drupal.org/project/drupal/issues/3270230) | 4 | no | no | review-needed | Toolbar focus styles are not sufficiently obvious to know where your focus is |
| [#3271652](https://www.drupal.org/project/drupal/issues/3271652) | 4 | no | no | review-needed | The styling for optgroup labels in the time zone select list on the regional settings page isn't applied in all browsers |
| [#3272266](https://www.drupal.org/project/drupal/issues/3272266) | 13 | no | no | review-needed | Grey button's background color has a too low contrast ratio against page background |
| [#3272316](https://www.drupal.org/project/drupal/issues/3272316) | 13 | no | no | review-needed | Claro's vertical tabs' aria states don't always properly reflect state at mobile |
| [#3272325](https://www.drupal.org/project/drupal/issues/3272325) | 13 | no | no | review-needed | Password suggestions are hidden from screenreaders |
| [#3272607](https://www.drupal.org/project/drupal/issues/3272607) | 1 | no | no | review-needed | opening a field formatter on manage form display redorders the tab order and the user starts again at show row weights |
| [#3273054](https://www.drupal.org/project/drupal/issues/3273054) | 1 | no | no | review-needed | Checkboxes of text formats in the filter section on the permissions page have visually hidden labels with links causing hidden focus states |
| [#3273086](https://www.drupal.org/project/drupal/issues/3273086) | 1 | no | no | review-needed | Differing focus order for CKEditor plugin settings for viewports smaller and larger than 1360px |
| [#3273789](https://www.drupal.org/project/drupal/issues/3273789) | 4 | no | no | review-needed | Toolbar color contrast fails WCAG on hover |
| [#3273806](https://www.drupal.org/project/drupal/issues/3273806) | 4 | no | no | review-needed | WCAG color constrast fails on toolbar direction icon |
| [#3275397](https://www.drupal.org/project/drupal/issues/3275397) | 1 | no | no | review-needed | Olivero: messages icons accessibility |
| [#3277286](https://www.drupal.org/project/drupal/issues/3277286) | 1 | no | no | review-needed | Edge in Windows high contrast mode creates a horizontal scroll in the media library dialog |
| [#3292389](https://www.drupal.org/project/drupal/issues/3292389) | 1 | no | no | review-needed | When viewing content with comments in Olivero, the H2 heading containing label and comment count is recognised as 2 distinct elements by VoiceOver on iOS |
| [#3296224](https://www.drupal.org/project/drupal/issues/3296224) | 1 | no | no | review-needed | Issues for Mac VoiceOver screenreader users when deleting characters in the comment subject field and using Safari |
| [#3300836](https://www.drupal.org/project/drupal/issues/3300836) | 1 | no | no | review-needed | Untranslatable fields do not respect language of parts |
| [#3301868](https://www.drupal.org/project/drupal/issues/3301868) | 1 | no | no | review-needed | Improve support for Voice Control with date fields |
| [#3302103](https://www.drupal.org/project/drupal/issues/3302103) | 4 | no | no | review-needed | Settings tray focus trap can inadvertently allow escaping of focus |
| [#3318394](https://www.drupal.org/project/drupal/issues/3318394) | 1 | no | no | review-needed | Block UI A11y errors identified with Axe + Nightwatch |
| [#3318396](https://www.drupal.org/project/drupal/issues/3318396) | 1 | no | no | review-needed | Address Primary tabs "missing region" A11y test failure |
| [#3354876](https://www.drupal.org/project/drupal/issues/3354876) | 16 | no | no | review-needed | Media Thumbnail Formatter: alt and title null after upgrade D9 |
| [#3361370](https://www.drupal.org/project/drupal/issues/3361370) | 1 | no | no | review-needed | Untranslatable fields on translations of nodes are not marked for Language of Parts |
| [#3361375](https://www.drupal.org/project/drupal/issues/3361375) | 1 | no | no | review-needed | Untranslated field labels on translations of nodes are not marked for Language of Parts |
| [#3362791](https://www.drupal.org/project/drupal/issues/3362791) | 1 | no | no | review-needed | Untranslated translatable fields on translations of nodes are not marked for Language of Parts |
| [#3394024](https://www.drupal.org/project/drupal/issues/3394024) | 16 | no | no | review-needed | Keyboard accessibility: not working with CKEditor 5 inserting image |
| [#3395355](https://www.drupal.org/project/drupal/issues/3395355) | 1 | no | no | review-needed | With an open dialog modal also elements in the background are added to the accessibility object model |
| [#3399980](https://www.drupal.org/project/drupal/issues/3399980) | 1 | no | no | review-needed | Labels for certain form fields are not announced by JAWS |
| [#3399985](https://www.drupal.org/project/drupal/issues/3399985) | 1 | no | no | review-needed | Table Captions in Claro |
| [#3412445](https://www.drupal.org/project/drupal/issues/3412445) | 1 | no | no | review-needed | Admin menu keeps re-expanding as I navigate on zoomed screen |
| [#3418795](https://www.drupal.org/project/drupal/issues/3418795) | 1 | no | no | review-needed | Media Add or select media dialog does not respect prefers-reduced-motion |
| [#3420558](https://www.drupal.org/project/drupal/issues/3420558) | 1 | no | no | review-needed | Remove the Parent select field from vertical sortable lists and add it to vertical and horizontal sortable lists  |
| [#3432727](https://www.drupal.org/project/drupal/issues/3432727) | 4 | no | no | review-needed | [12.x] Excess use of article HTML-tag for media |
| [#3436613](https://www.drupal.org/project/drupal/issues/3436613) | 1 | no | no | review-needed | Image missing alternative text can be inserted without error |
| [#3444209](https://www.drupal.org/project/drupal/issues/3444209) | 1 | no | no | review-needed | [Regression] Password recommendations are not being announced to screenreader users |
| [#3444245](https://www.drupal.org/project/drupal/issues/3444245) | 4 | no | no | review-needed | Location of "Skip to Main" link below admin toolbar in Olivero is problematic for screen magnifier users |
| [#3469772](https://www.drupal.org/project/drupal/issues/3469772) | 1 | no | no | review-needed | Screen Reader does not Announce Error Messages |
| [#3502292](https://www.drupal.org/project/drupal/issues/3502292) | 1 | no | no | review-needed | Ensures interactive controls are not nested |
| [#3506324](https://www.drupal.org/project/drupal/issues/3506324) | 1 | no | no | review-needed | Redundant aural interface and the general interaction with CKEditor toolbar configuration |
| [#3506333](https://www.drupal.org/project/drupal/issues/3506333) | 4 | no | no | review-needed | [PP-1] Improve the perceptibility of contextual link buttons |
| [#3506339](https://www.drupal.org/project/drupal/issues/3506339) | 1 | no | no | review-needed | Selecting a column in a table header by keyboard drops the focus |
| [#3509700](https://www.drupal.org/project/drupal/issues/3509700) | 4 | no | no | review-needed | Accessibility of landmark regions in toolbar |
| [#3515825](https://www.drupal.org/project/drupal/issues/3515825) | 1 | no | no | review-needed | Autocomplete not working with JAWS |
| [#3531873](https://www.drupal.org/project/drupal/issues/3531873) | 1 | no | no | review-needed | Node Card template h3 causes accessibility issues |
| [#3532500](https://www.drupal.org/project/drupal/issues/3532500) | 1 | no | no | review-needed | The description for the link field is redundant in the aural interface for voiceover |
| [#3533586](https://www.drupal.org/project/drupal/issues/3533586) | 14 | yes | yes | advance-with-patch | "Member for" needs a div tag instread of h4 to pass accessibility check |
| [#3534229](https://www.drupal.org/project/drupal/issues/3534229) | 1 | no | no | review-needed | CKEditor config buttons not working in forced-colors mode |
| [#3536018](https://www.drupal.org/project/drupal/issues/3536018) | 16 | no | no | review-needed | Link field target not defaulting to "_blank" in Media entity references |
| [#3537503](https://www.drupal.org/project/drupal/issues/3537503) | 4 | no | no | review-needed | Toolbar aural view tests pass falsely |
| [#3540337](https://www.drupal.org/project/drupal/issues/3540337) | 1 | no | no | review-needed | Improve visibility of More actions menu button |
| [#3541688](https://www.drupal.org/project/drupal/issues/3541688) | 1 | no | no | review-needed | Focus does not move to submenu when opened by enter or space key |
| [#3541728](https://www.drupal.org/project/drupal/issues/3541728) | 1 | no | no | review-needed | Submenu opened with hover does not close by Escape key when another menu item has focus |
| [#3543395](https://www.drupal.org/project/drupal/issues/3543395) | 16 | no | no | review-needed | Dropdown suggestions missing ARIA labels |
| [#3543463](https://www.drupal.org/project/drupal/issues/3543463) | 1 | no | no | review-needed | Improve accessibility for tables in views |
| [#3559128](https://www.drupal.org/project/drupal/issues/3559128) | 1 | no | no | review-needed | Cannot tab to CKEditor5 toolbar |
| [#3559162](https://www.drupal.org/project/drupal/issues/3559162) | 1 | no | no | review-needed | Accessing a toolbar sub-menu seems to result in a keyboard trap |
| [#3565294](https://www.drupal.org/project/drupal/issues/3565294) | 1 | no | no | review-needed | Increase the contrasting area of focus outlines in forced color mode |
| [#3566810](https://www.drupal.org/project/drupal/issues/3566810) | 1 | no | no | review-needed | Move the additional attributes in the field column on the field listings page to dedicate columns |
| [#3568283](https://www.drupal.org/project/drupal/issues/3568283) | 1 | yes | no | advance-or-retest | Clear content of drupal-live-announce region after delay |
| [#3568310](https://www.drupal.org/project/drupal/issues/3568310) | 8 | no | no | review-needed | Logged in admin in Olivero theme - Vertical toolbar triggers horizontal scrollbar due to skip-link width |
| [#3573225](https://www.drupal.org/project/drupal/issues/3573225) | 1 | no | no | review-needed | Some top-level menus obscure unrelated focused items in sidebar |
| [#3573865](https://www.drupal.org/project/drupal/issues/3573865) | 8 | yes | yes | advance-with-patch | Details preprocess incorrectly adds role to summary |
| [#3574319](https://www.drupal.org/project/drupal/issues/3574319) | 1 | no | no | review-needed | Sidebar logo link sometimes lacks focus indicator |
| [#3574972](https://www.drupal.org/project/drupal/issues/3574972) | 1 | no | no | review-needed | Admin tables can have too much horizontal whitespace, creating accessibility problems |
| [#3576830](https://www.drupal.org/project/drupal/issues/3576830) | 1 | no | no | review-needed | Grandchild menu items lack focus indicator |
| [#3579343](https://www.drupal.org/project/drupal/issues/3579343) | 1 | no | no | review-needed | ScrollTopCommand doesn't work in AJAX responses because of refocus on the triggering element  |
| [#3582950](https://www.drupal.org/project/drupal/issues/3582950) | 16 | no | no | review-needed | Table appears to be used for layout but does not have a role of presentation |
| [#3587668](https://www.drupal.org/project/drupal/issues/3587668) | 16 | no | no | review-needed | Color contrast in admin and claro |
| [#3593502](https://www.drupal.org/project/drupal/issues/3593502) | 8 | no | no | review-needed | Introduce a new Menu UI to resolve memory issues and improve user experience |
| [#3595627](https://www.drupal.org/project/drupal/issues/3595627) | 4 | no | no | review-needed | [PP-1] Sticky table header hides responsive tables toggle button |

## Linked Patch Files

- a11y-DRUPAL-A11Y-010-issue-3573865-details-summary-role.patch -> #3573865
- a11y-DRUPAL-A11Y-010-issues-3573865-3533586.patch -> #3573865
- a11y-DRUPAL-A11Y-011-issue-3533586-member-for-label.patch -> #3533586
- a11y-DRUPAL-A11Y-012-issue-3571628-aria-expanded-sync.patch -> #3571628
- a11y-DRUPAL-A11Y-013-issue-3049125-language-switcher-nav-label.patch -> #3049125
- a11y-DRUPAL-A11Y-014-issue-2443815-details-description-display.patch -> #2443815
- a11y-DRUPAL-A11Y-015-issue-3587661-file-widget-display-checkbox-label.patch -> #3587661
- a11y-DRUPAL-A11Y-016-issue-3044440-details-default-title.patch -> #3044440
- a11y-DRUPAL-A11Y-017-issue-2318757-multiple-widget-description-display.patch -> #2318757
