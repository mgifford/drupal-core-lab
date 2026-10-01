# Playwright walkthrough: #3619127 (3619127-vanilla)

Run 2026-10-01T10:02:20.679Z. Viewport 480x900. Trusted input (Playwright clicks and key presses), axe-core WCAG 2.0 to 2.2 A/AA.

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

---
**✓ All checks behave as expected.** Automated results are a DRAFT: they do not replace a keyboard and screen-reader pass by a person.
