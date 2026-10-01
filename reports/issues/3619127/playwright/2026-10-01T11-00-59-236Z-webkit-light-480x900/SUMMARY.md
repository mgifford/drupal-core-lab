# Playwright walkthrough: #3619127 (3619127-pinned)

Run 2026-10-01T11:01:00.462Z. Core: Before `d29add7ebc18954dcb88877ed38b5bd88cdbf967 2026-09-30`, After `d29add7ebc18954dcb88877ed38b5bd88cdbf967 2026-09-30` (`<commit> <date>`) (pinned). Patches on After: `3619127-forms-sidebar-with-ife.patch`, `patch-0-vanilla-js-no-jquery.patch`, `patch-1-no-persist-and-waits.patch`. Environment: **webkit 26.6**, colour scheme **light**, viewport 480x900, darwin arm64. Trusted input (Playwright clicks and key presses), axe-core WCAG 2.0 to 2.2 A/AA.

Rule: **fix** checks should fail on Before and pass on After; **regression** checks should be equal.

## Mouse

| Type | Check | Before | After | Verdict |
|---|---|---|---|---|
| fix | Sidebar opens after using the error link | ✗ no | ✓ yes | ✓ as expected: fails before, passes after |
| fix | URL alias field receives focus | ✗ no | ✓ yes | ✓ as expected: fails before, passes after |
| fix | URL alias field is in the viewport | ✗ no | ✓ yes | ✓ as expected: fails before, passes after |
| regression | Saved sidebar preference unchanged (still "false") | false | false | ✓ unchanged |
| regression | axe violations (elements) after using the link | 0 | 0 | ✓ unchanged |
| regression | axe violations before using the link | 0 | 0 | ✓ unchanged |
| regression | JavaScript errors | 0 | 0 | ✓ unchanged |

Field as exposed to assistive technology after using the link (After):

```yaml
- textbox "URL alias" [invalid]: no-slash
```

Screenshots: `before-mouse-2-after-link.png`, `after-mouse-2-after-link.png`.

## Keyboard only (Tab/focus the link, press Enter)

| Type | Check | Before | After | Verdict |
|---|---|---|---|---|
| fix | Sidebar opens after using the error link | ✗ no | ✓ yes | ✓ as expected: fails before, passes after |
| fix | URL alias field receives focus | ✗ no | ✓ yes | ✓ as expected: fails before, passes after |
| fix | URL alias field is in the viewport | ✗ no | ✓ yes | ✓ as expected: fails before, passes after |
| regression | Saved sidebar preference unchanged (still "false") | false | false | ✓ unchanged |
| regression | axe violations (elements) after using the link | 0 | 0 | ✓ unchanged |
| regression | axe violations before using the link | 0 | 0 | ✓ unchanged |
| regression | JavaScript errors | 0 | 0 | ✓ unchanged |

Field as exposed to assistive technology after using the link (After):

```yaml
- textbox "URL alias" [invalid]: no-slash
```

Screenshots: `before-keyboard-2-after-link.png`, `after-keyboard-2-after-link.png`.

## Interpretation

✓ **Reproduced and fixed.** On this core, Before shows the problem and After (with the patches) fixes it.

---
**✓ All checks behave as expected.** Automated results are a DRAFT: they do not replace a keyboard and screen-reader pass by a person.
