# ACCESSIBILITY.md

This document defines accessibility expectations for this repository and local development workflow.

Based on the [ACCESSIBILITY.md](https://mgifford.github.io/ACCESSIBILITY.md/) open format for documenting a project's accessibility posture.

## 1. Our Commitment

We believe accessibility is a subset of quality. This project commits to **WCAG 2.2 AA** standards.
We track our progress publicly to remain accountable to our users.

- Standard: **WCAG 2.2 AA**
- Scope: UI, content, navigation, forms, and documentation examples
- Principle: Accessibility is required quality, not a post-release enhancement

## 2. Real-Time Health Metrics

| Metric | Status / Value |
| :--- | :--- |
| **Open A11y Issues** | [drupal.org accessibility queue](https://www.drupal.org/project/issues/drupal?component=accessibility) |
| **Automated Test Pass Rate** | Tracked via CI |
| **Standards** | WCAG 2.2 AA |

## 3. Definition of Done (accessibility)

A change is ready when all apply:

1. Core tasks are keyboard-operable.
2. Semantic HTML is used before ARIA.
3. Focus order and visible focus indicators are correct.
4. No axe-core **Critical** or **Serious** violations are introduced.
5. No new WCAG 2.2 A or AA failures are introduced.
6. No unresolved Critical accessibility regressions remain.

## 4. Contributor Requirements (The Guardrails)

To contribute UI changes to this repo, you must follow these guidelines:

- **Testing:** All UI changes must be manually tested with a screen reader and keyboard.
- **Automated checks:** Run axe DevTools or equivalent on changed components.
- **Semantic HTML first:** Use semantic elements before reaching for ARIA.
- **CI/CD:** PRs must not introduce violations detected by accessibility CI checks.
- **Documentation:** Follow Drupal's [accessibility standards](https://www.drupal.org/docs/develop/standards/accessibility-standards).

## 5. Reporting & Severity Taxonomy

File issues at [drupal.org](https://www.drupal.org/project/issues/drupal?component=accessibility). Tag all issues with `Accessibility` and the affected component.

### Priority model

We use [axe-core's impact levels](https://github.com/dequelabs/axe-core/blob/develop/doc/issue_impact.md) as the primary ranking:

| axe Impact | Meaning | WCAG level guidance |
| :--- | :--- | :--- |
| **Critical** | Blocks access entirely for users with disabilities | Typically WCAG 2.2 A failures |
| **Serious** | Significant barrier; difficult or impossible to work around | Typically WCAG 2.2 A or AA failures |
| **Moderate** | Causes difficulty but a workaround may exist | Typically WCAG 2.2 AA failures |
| **Minor** | Inconvenience or best-practice deviation | May fall below AA or be a best-practice |

### WCAG level and axe impact together

Work through issues in this order:

1. **WCAG 2.2 A** violations — address all Critical and Serious first
2. **WCAG 2.2 AA** violations — address all Critical and Serious, then Moderate
3. Minor impact issues — address opportunistically or as "good first issues"

When the WCAG conformance level and the axe impact rating appear to conflict (e.g. an AA rule marked Critical by axe), **defer to the axe impact rating** for prioritization. axe's impact reflects real-world barrier severity, which may exceed what the WCAG level alone implies.

### Response targets

| axe Impact | Triage | Fix target |
| :--- | :--- | :--- |
| **Critical** | Immediately | Current sprint / release cycle |
| **Serious** | Within 5 business days | Next sprint |
| **Moderate** | Normal backlog grooming | Scheduled |
| **Minor** | Opportunistic | As capacity allows |

## 6. Shift-left Accessibility Automation

Adopt layered checks (fast to deep):

1. **Editor/IDE**: linting and accessibility hints while coding.
2. **Pre-commit**: run fast checks on changed files only.
3. **PR/CI gate**: run deterministic accessibility checks and fail on blocking regressions.
4. **Scheduled scans**: run deeper weekly scans and triage findings.

Reference: https://mgifford.github.io/ACCESSIBILITY.md/examples/SHIFT_LEFT_ACCESSIBILITY_AUTOMATION.html

## 7. CI/CD Best-Practice References

Use these patterns to build or improve your pipeline:

- CI/CD overview and workflows:
  https://mgifford.github.io/ACCESSIBILITY.md/examples/CI_CD_ACCESSIBILITY_BEST_PRACTICES.html
- GitHub Accessibility Scanner, axe-core, pa11y-ci, Lighthouse CI, AccessLint examples:
  https://mgifford.github.io/ACCESSIBILITY.md/examples/CI_CD_ACCESSIBILITY_BEST_PRACTICES.html
- Combined shift-left workflow example:
  https://mgifford.github.io/ACCESSIBILITY.md/examples/A11Y_SHIFT_LEFT_WORKFLOW.yml

## 8. Automated Accessibility Testing Best Practices

Reference: https://mgifford.github.io/ACCESSIBILITY.md/examples/CI_CD_ACCESSIBILITY_BEST_PRACTICES.html

Automated testing catches a subset of accessibility issues. It is the baseline, not the ceiling — always combine with manual screen reader and keyboard testing.

### 8.1 Testing Strategy

Use layered tools together; no single tool catches everything:

| Approach | Finds WCAG rule violations | Finds announcement quality issues | CI-friendly |
| :--- | :---: | :---: | :---: |
| **axe-core** | ✅ | ❌ | ✅ |
| **Lighthouse CI** | ✅ | ❌ | ✅ |
| **Playwright aria snapshots** | Partial | ✅ | ✅ |
| **Guidepup virtual screen reader** | ❌ | ✅ | ✅ |
| **Manual screen reader testing** | Partial | ✅ | ❌ |

- axe-core rule coverage reference: https://mgifford.github.io/ACCESSIBILITY.md/examples/AXE_RULES_COVERAGE.html

### 8.2 Recommended Tools

- **[Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)** — high-level quality gate; enforce minimum accessibility score on every PR.
- **[Playwright + axe-core](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)** — dynamic elements, mobile emulation, light/dark theme testing.
- **[GitHub Accessibility Scanner](https://github.com/github/accessibility-scanner)** — scheduled scans that open issues automatically.
- **[AccessLint](https://github.com/accesslint)** — inline PR comments without a full CI run.
- **[Guidepup](https://www.guidepup.dev)** — virtual screen reader unit tests; assert exact text announced by assistive technology.

### 8.3 Local-First Workflow

Run audits locally before pushing. This is the fastest feedback loop and keeps CI noise low:

```bash
npm install -g @lhci/cli
npm install -D @playwright/test @axe-core/playwright
```

Add to `package.json`:
```json
"scripts": {
  "test:a11y": "lhci autorun && npx playwright test",
  "test:a11y:local": "lhci collect --url=http://localhost && lhci assert"
}
```

### 8.4 Lighthouse CI Gate

Enforce a minimum accessibility score on every PR. Start with `"warn"` while resolving existing issues, then tighten to `"error"` with `minScore: 1` once you achieve a clean baseline.

Example `.lighthouserc.json`:
```json
{
  "ci": {
    "collect": { "staticDistDir": "./_site", "numberOfRuns": 1 },
    "assert": {
      "assertions": {
        "categories:accessibility": ["error", { "minScore": 1 }]
      }
    }
  }
}
```

### 8.5 Playwright + axe-core for Dynamic Content

Test dynamic elements (menus, modals) and user preference modes (light/dark):

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('A11y: no violations in dark mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
```

### 8.6 Accessibility Tree Testing

WCAG rule checks verify markup rules but cannot confirm what a screen reader *actually announces*. Use accessibility tree testing for complex components: SVG diagrams, custom widgets, live regions, navigation landmarks.

**Playwright aria snapshots** (`toMatchAriaSnapshot()`, Playwright ≥ v1.46):
```typescript
test('main navigation is correctly announced', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('nav[aria-label="Main navigation"]'))
    .toMatchAriaSnapshot(`
      - navigation "Main navigation":
          - list:
              - listitem:
                  - link "Home"
    `);
});
```

**Semantic queries** (`getByRole`) fail when accessible names are missing — use them in existing tests:
```typescript
await expect(page.getByRole('textbox', { name: 'Email address' })).toBeVisible();
await expect(page.getByRole('button',  { name: 'Send message' })).toBeEnabled();
```

**Guidepup virtual screen reader** for unit-testing exact announcements:
```bash
npm install -D @guidepup/virtual-screen-reader
```
```typescript
import { virtual } from '@guidepup/virtual-screen-reader';

it('announces dialog title and buttons', async () => {
  // ... render component ...
  await virtual.start({ container: document.body });
  const spoken = await virtual.spokenPhraseLog();
  expect(spoken).toContain('Confirm deletion');
  expect(spoken).toContain('Delete, button');
  await virtual.stop();
});
```

### 8.7 Scheduled Scans with Alert-Fatigue Guard

Run the GitHub Accessibility Scanner monthly. Skip the scan if open accessibility issues already exist to prevent alert fatigue:

```yaml
# .github/workflows/accessibility-scan.yml
- name: Check for existing open accessibility issues
  id: check_issues
  run: |
    COUNT=$(gh issue list --label "accessibility" --state open --json number --jq '. | length')
    echo "count=$COUNT" >> $GITHUB_OUTPUT

- name: Run GitHub Accessibility Scanner
  if: steps.check_issues.outputs.count == '0'
  uses: github/accessibility-scanner@v3
  with:
    urls: ${{ vars.ACCESSIBILITY_SCAN_URL }}
    token: ${{ secrets.GITHUB_TOKEN }}
```

### 8.8 Governance & SLAs

- Any build that introduces new axe-core violations **blocks merge**.
- Lighthouse accessibility score drops **block merge** (once a clean baseline is established).
- Failures from scheduled scans must be filed as issues and triaged within 5 business days.
- If open accessibility issues exist, subsequent scheduled scans are paused.

### 8.9 Playwright Crawl Workflow

Drupal core runs a **Playwright-based full-site crawler** in addition to the Nightwatch axe tests. The crawler lives in `core/tests/playwright/` and runs axe-core and Lighthouse against every page in the inventory.

**Why a separate crawler?**
Nightwatch tests cover ~10 hand-picked pages. Many violations originate in shared Twig templates — the same broken selector repeated across dozens of pages. The crawler surfaces these template-level patterns automatically.

**Running locally (requires DDEV):**
```bash
ddev start
cd core

# Install Playwright browser once:
npx playwright install chromium

# Run axe crawl + regression tests:
yarn test:a11y:playwright

# Run Lighthouse audit:
yarn test:a11y:lighthouse

# Analyze results — generate PATTERN-REPORT.md:
yarn a11y:analyze

# View the pattern report:
open tests/playwright/reports/PATTERN-REPORT.md
```

**Reading the pattern report:**
- Patterns marked 🔁 appear on ≥3 pages — these are almost certainly template issues
- Sorted by axe impact (Critical first), then page count
- Each pattern includes the likely Twig template inferred from CSS class naming
- Fix the template, not each page individually

**After fixing a violation, add a regression test:**
```bash
yarn a11y:add-regression \
  --rule duplicate-id-aria \
  --page /search/node \
  --issue 3318398 \
  --name "Search page has no duplicate-id-aria violations"
```

This appends a permanent guard to `tests/playwright/tests/a11y-regressions.spec.ts` that runs on every MR.

**CI integration:**
The `🎭 Playwright A11y` GitLab CI job runs:
- On a daily schedule (full crawl)
- On any MR that touches `.twig` files or the `tests/playwright/` directory
- Artifacts include `axe-results.json`, `pattern-report.json`, and `PATTERN-REPORT.md`

The crawler does **not** hard-fail on new violations — it records them. Hard failures are the regression tests. This keeps CI actionable without noise.

## 9. Phased Axe Rule Expansion & Issue Intake

### The alert-fatigue problem

Drupal core's axe-core Nightwatch tests currently **disable several rules** (e.g. `region`, `heading-order`, `color-contrast`) via `@todo` comments pointing to open issues. This happened because enabling all rules at once produced too many violations, made CI reports noisy, and gave contributors no clear starting point — so the community learned to ignore the failures.

The solution is a **structured, phased process**: re-enable rules one at a time, only after the backlog for each rule is cleared through the normal contribution workflow.

### Process: re-enabling a disabled axe rule

1. **File issues first.** Before re-enabling a rule in CI, file one drupal.org issue per distinct violation instance. Use the `Accessibility` issue tag and set priority to match the severity taxonomy (section 5). Do not re-enable the rule until all issues are filed.

2. **Tag issues consistently.** Every issue must carry:
   - Tag: `Accessibility`
   - Component: the affected module/theme (e.g. `claro`, `olivero`, `block.module`)
   - A clear description of the axe rule, the failing element, and the WCAG criterion

3. **One rule at a time.** Only attempt to clear one axe rule at a time. Clearing multiple rules in parallel fragments contributor attention and makes regressions hard to isolate.

4. **Create a meta-issue.** For each rule being cleared, open a meta/parent issue that:
   - Names the axe rule and its WCAG criterion
   - Lists all child issues as sub-tasks
   - Tracks progress toward re-enabling the rule in CI
   - Search existing accessibility issues: https://www.drupal.org/project/issues/search?projects=Drupal+core&issue_tags=Accessibility

5. **Fix, verify, and re-enable.** Once all child issues are resolved:
   - Remove the `{ enabled: false }` override from the test file
   - Confirm CI passes with the rule active
   - Close the meta-issue

6. **Guard against regression.** Once a rule is re-enabled, any PR that reintroduces violations for that rule **must not merge**. The CI gate is the enforcement mechanism.

### Disabled rules and their tracking issues

When filing child issues for each disabled rule, set the drupal.org priority to match the axe impact of each individual violation (Critical → Critical, Serious → Major, Moderate → Normal, Minor → Minor).

| axe Rule | axe Impact | WCAG | Test file | Tracking issue |
| :--- | :--- | :--- | :--- | :--- |
| `region` | Moderate | 1.3.6 (A) | `a11yTestDefault.js`, `a11yTestAdmin.js` | [#3318396](https://drupal.org/i/3318396) |
| `heading-order` | Moderate | 1.3.1 (A) | `a11yTestDefault.js` | [#3318398](https://drupal.org/i/3318398) |
| `duplicate-id-aria` | Critical | 4.1.1 (A) | `a11yTestDefault.js` | [#3318398](https://drupal.org/i/3318398) |
| `color-contrast` | Serious | 1.4.3 (AA) | `a11yTestAdmin.js` | [#3318394](https://drupal.org/i/3318394) |
| `duplicate-id-active` | Serious | 4.1.1 (A) | `a11yTestAdmin.js` | [#3318394](https://drupal.org/i/3318394) |

Address in this order: `duplicate-id-aria` and `duplicate-id-active` (Critical/Serious, WCAG 2.2 A) → `color-contrast` (Serious, WCAG 2.2 AA) → `heading-order` and `region` (Moderate).

### Contribution queue guidance

The accessibility issue queue is the canonical place for this work:
https://www.drupal.org/project/issues/search?projects=Drupal+core&issue_tags=Accessibility

Good first contributions:
- Fixing a single failing element for a disabled rule
- Adding a missing `aria-label` or landmark region
- Improving heading order in a specific template

Reviewers and maintainers: when a patch resolves all child issues for a rule, verify that the rule can be re-enabled in CI before marking the meta-issue Fixed.

## 10. Progressive Enhancement Requirements

All features should follow progressive enhancement:

- Layer 1: semantic HTML supports core tasks without JavaScript.
- Layer 2: CSS enhances presentation but does not block access.
- Layer 3: JavaScript enhances behavior without gating core flows.
- If enhancements fail, baseline behavior remains usable.

Reference: https://mgifford.github.io/ACCESSIBILITY.md/examples/PROGRESSIVE_ENHANCEMENT_BEST_PRACTICES.html

## 11. Browser and Assistive Technology Support

Project policy baseline:

- Support the **last 2 major versions** of major browser engines.
- Include manual checks for key AT/browser combinations in release testing.
- Reassess support quarterly and document exceptions.

Reference: https://mgifford.github.io/ACCESSIBILITY.md/BROWSER_SUPPORT.html

## 12. Sustainability Alignment

Accessibility work should also reduce digital waste:

- Prefer simple semantic solutions over heavy client-side complexity.
- Avoid duplicate documentation when linking to canonical guidance is enough.
- Keep assets lean (optimized images, minimal dependencies).
- Use AI judiciously and with focused scope.

Reference: https://mgifford.github.io/ACCESSIBILITY.md/SUSTAINABILITY.html

## 13. Governance Notes

- Do not merge changes that introduce axe-core **Critical** or **Serious** violations.
- Do not merge changes that introduce new WCAG 2.2 A failures.
- **Moderate** violations in new code should be flagged and tracked as issues before merge.
- Document temporary waivers with owner, axe impact level, and expiry date.
- Keep this file current as tooling, support matrix, and standards evolve.

## 14. Drupal Accessibility Coding Standards

Source: https://www.drupal.org/docs/getting-started/accessibility/accessibility-coding-standards
Last updated on drupal.org: 4 March 2026

All contributions to Drupal core must follow these standards.

### Key goals

1. **Inclusive strategy** — consider accessibility needs when architecting features
2. **Accessible coding** — follow the implementation practices below
3. **Normalized testing** — build accessibility review into the development process, not as an add-on

### Technical standards

| Interface | Standard |
| :--- | :--- |
| Public-facing pages (Olivero and other front-end themes) | **WCAG 2.2 AA** |
| Author/admin interface (Claro) | **WCAG 2.2 AA** + **ATAG 2.0** |

ATAG 2.0 Part A: the authoring tool itself must be accessible to authors with disabilities.
ATAG 2.0 Part B: the tool must help authors produce accessible content by default.

### General best practices

- Provide **text alternatives** (`alt`) for images, charts, and graphs.
- Provide **captions, transcripts, and audio descriptions** for video.
- Ensure **sufficient colour contrast** (WCAG 1.4.3 for normal text, 1.4.11 for UI components).
- All features operable by mouse must be **keyboard-navigable**.
- Use **semantic HTML** (`<h1>`, `<ul>`, `<button>`, `<nav>`) before reaching for `<div>`.
- Default to **HTML first; use WAI-ARIA modestly** — ARIA shims labels onto non-semantic markup and improper use actively degrades screen reader experience.
- **Check your work.** Run automated tools and manually test new interactive components. Invite users with disabilities to test where possible.

### WAI-ARIA implementation in Drupal

Use ARIA only when HTML semantics are insufficient:

```php
// Correct: add ARIA via #attributes in render arrays
$form['field_name'] = [
  '#type' => 'textfield',
  '#title' => t('Field Label'),
  '#attributes' => [
    'aria-required' => 'true',
    'aria-describedby' => 'field-help-text',
  ],
];
```

Common ARIA patterns in Drupal:
- `aria-expanded="false"` — accordion/disclosure toggle state
- `aria-describedby="ID"` — associate form field with its help text
- `aria-current="page"` — active navigation item

### Dynamic content

When page content changes after user interaction, announce it to screen reader users:

```javascript
// Polite announcement (queued, does not interrupt)
Drupal.announce(Drupal.t('Your form has been submitted successfully.'));

// Assertive announcement (interrupts current speech — use sparingly)
Drupal.announce(Drupal.t('Error: required field is empty.'), 'assertive');
```

Use `Drupal.announce()` for: alerts and error messages, autocomplete suggestions, AJAX-filtered result counts.

### Keyboard navigation

- Every mouse-operable feature must be keyboard-operable.
- Follow [ARIA Authoring Practices patterns](https://www.w3.org/WAI/ARIA/apg/patterns/) for custom widgets.
- Dialogs and overlays must **trap focus** while open and **release focus** on close (Esc or close button).

Use Drupal's built-in tabbingManager for focus trapping:

```javascript
// Constrain focus to a set of elements
var tabbingContext = Drupal.tabbingManager.constrain($('.dialog-content'));

// Release focus constraint (on close)
tabbingContext.release();
```

### Hiding content accessibly

| Goal | Method | CSS class / attribute |
| :--- | :--- | :--- |
| Visible to screen readers only | `visually-hidden` CSS class | `.visually-hidden` |
| Hidden until focused (skip links) | `visually-hidden focusable` | `.visually-hidden.focusable` |
| Completely hidden from all users | HTML `hidden` attribute or `display: none` | `hidden` / `display: none` |

**Do not use** `visibility: hidden` or `opacity: 0` alone to hide content from screen readers — they may still be announced. Use `display: none` or `hidden` for complete removal.

### Forms

- Group related fields with `<fieldset>` and `<legend>`.
- Enable the **Inline Form Errors** module: it places error summaries at the top of the form and inline error messages beside each field.
- Never rely on placeholder text alone as a label — placeholders disappear on input and have poor contrast.

### Animation

- Respect `prefers-reduced-motion`. Wrap animations in a media query:

```css
@media (prefers-reduced-motion: no-preference) {
  .animated-element {
    transition: transform 0.3s ease;
  }
}
```

### Testing checklist (per contribution)

- [ ] Run axe DevTools or `yarn test:a11y:playwright` on affected pages
- [ ] Verify keyboard-only navigation through all new interactive elements
- [ ] Confirm focus is visible at all times
- [ ] Check colour contrast meets 4.5:1 (normal text) and 3:1 (large text / UI)
- [ ] Verify ARIA attributes are correct and not redundant with native semantics
- [ ] Test `Drupal.announce()` calls with a screen reader if dynamic content is involved
- [ ] Check animations respect `prefers-reduced-motion`

Full testing guidance: https://www.drupal.org/docs/getting-started/accessibility/accessibility-coding-standards#testing

## 15. Related References

- ACCESSIBILITY.md project home:
  https://mgifford.github.io/ACCESSIBILITY.md/
- AI agent guidance reference:
  https://mgifford.github.io/ACCESSIBILITY.md/AGENTS.html
- Drupal Accessibility Coding Standards:
  https://www.drupal.org/docs/getting-started/accessibility/accessibility-coding-standards
- Drupal accessibility issue queue:
  https://www.drupal.org/project/issues/search?projects=Drupal+core&issue_tags=Accessibility
- A11Y-PROCESS.md — local testing and contribution workflow:
  ./A11Y-PROCESS.md
