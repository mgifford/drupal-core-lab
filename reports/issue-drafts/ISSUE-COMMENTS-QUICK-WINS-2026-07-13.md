# Issue Comment Drafts With Unique Identifiers (2026-07-13)

## Issue #3573865

Accessibility update for this issue with stable identifiers:

**Bug ID:** DRU-3d2c0738 (instance) / DRU-93a3d129 (pattern)
**URL:** http://localhost/form-test/group-details
**XPath:** //summary[@data-summary-attribute="test"][@role="button"]
**Full DOM path:** /html/body//details[summary[@data-summary-attribute="test"]]/summary
**WCAG SC:** 1.3.1 - Info and Relationships (Level A)
**Rule:** manual semantic check - redundant-role-summary
**Severity:** Medium
**Frequency:** Pattern-level; applies to details summaries rendered by core preprocess on pages using #type details
**Screen type:** desktop | **Colour mode:** light

### HTML Snippet

```html
<summary data-summary-attribute="test" role="button" aria-expanded="false">
  Details element with summary attributes
</summary>
```

### Change implemented

- Removed the redundant role assignment from core details preprocess:
  - core/lib/Drupal/Core/Form/FormPreprocess.php
- Added regression assertions:
  - core/modules/system/tests/src/Functional/Form/ElementTest.php
  - asserts aria-expanded remains present
  - asserts role attribute is absent on summary

### Notes

- This keeps native summary semantics and preserves aria-expanded/aria-controls behavior.
- Local runtime test execution remains environment-blocked; static checks and review passed.

### AI Disclosure

This contribution was prepared with assistance from an AI coding tool.
- Tool: GitHub Copilot (GPT-5.3-Codex)
- Used for: patch drafting, regression test drafting, and issue comment drafting
- Reviewed by: <your drupal.org username>
- Skills loaded: drupal-accessibility (sub-skills: drupal-a11y-fapi, drupal-a11y-qa)

---

## Issue #3533586

Accessibility update for this issue with stable identifiers:

**Bug ID:** DRU-ce079269 (instance) / DRU-1aae3721 (pattern)
**URL:** http://localhost/user/2
**XPath:** //h4[contains(@class,"label") and normalize-space()="Member for"]
**Full DOM path:** /html/body//h4[contains(@class,"label") and normalize-space()="Member for"]
**WCAG SC:** 1.3.1 - Info and Relationships (Level A)
**Rule:** manual semantic check - heading-misuse-label
**Severity:** Medium
**Frequency:** 1 instance per user profile page where the member_for field is displayed
**Screen type:** desktop | **Colour mode:** light

### HTML Snippet

```html
<h4 class="label">Member for</h4>
```

### Change implemented

- Replaced heading markup with label container markup:
  - core/modules/user/src/Hook/UserHooks.php
- Added regression test:
  - core/modules/user/tests/src/Functional/UserLoginTest.php
  - asserts no h4.label for Member for
  - asserts div.label for Member for

### Notes

- This avoids introducing a false heading into the document outline.
- Local runtime test execution remains environment-blocked; static checks and review passed.

### AI Disclosure

This contribution was prepared with assistance from an AI coding tool.
- Tool: GitHub Copilot (GPT-5.3-Codex)
- Used for: patch drafting, regression test drafting, and issue comment drafting
- Reviewed by: <your drupal.org username>
- Skills loaded: drupal-accessibility (sub-skills: drupal-a11y-fapi, drupal-a11y-qa)
