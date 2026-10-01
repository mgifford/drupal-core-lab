# STYLES.md — Drupal Core

> A machine-readable style standard for human and AI collaboration.
> Governs UI development, theming, and documentation across the Drupal Core repository.

Part of the three-pillar governance baseline:

| Standard | Purpose |
| :--- | :--- |
| [ACCESSIBILITY.md](./ACCESSIBILITY.md) | WCAG 2.2 AA requirements and contributor guardrails |
| [AGENTS.md](./AGENTS.md) | AI coding agent operational instructions |
| [STYLES.md](./STYLES.md) — this file | Design tokens, voice, and AI agent style rules |

---

## Scope

| Surface | Files | Applies? |
| :--- | :--- | :--- |
| **Admin UI (Claro theme)** | `core/themes/claro/` | ✅ |
| **Front-end theme (Olivero)** | `core/themes/olivero/` | ✅ |
| **Twig templates** | `core/**/templates/**/*.html.twig` | ✅ |
| **CSS/PostCSS** | `**/*.pcss.css`, `**/*.css` | ✅ |
| **JavaScript** | `core/misc/**/*.js`, `core/**/js/**/*.js` | ✅ |
| **Repository documentation** | `README.md`, `AGENTS.md`, and other Markdown files | ✅ |

---

## 1. Core philosophy

1. **Accessible by default.** WCAG 2.2 AA is a floor, not a target. Semantic HTML before ARIA. Keyboard operability always.
2. **Progressive enhancement.** HTML first, then CSS, then JavaScript. Core functionality must work without JS.
3. **Reader-first.** UI labels, error messages, and documentation start with what the user needs, not how the system is structured.
4. **Design tokens over magic values.** Never hardcode colors, spacing, or font sizes. Always use the CSS custom properties defined in the theme.
5. **Consistency is trust.** Humans and AI agents must use the same tokens, patterns, and vocabulary. Inventing parallel systems erodes trust.

---

## 2. Content and voice standards

### 2.1 Voice and tone

Drupal Core targets a broad contributor audience: site builders, developers, and end users. All three are present in the same admin UI.

| Context | Tone | Strategy |
| :--- | :--- | :--- |
| **UI labels and buttons** | Direct, action-oriented | Use verbs: "Save", "Delete", "Add block" — not "Submit" or "OK" |
| **Help text and descriptions** | Plain, instructional | Explain consequences, not mechanics: "This will be visible to all users." |
| **Error messages** | Calm, actionable | Name the problem; give a path forward. Never blame the user. |
| **Documentation (Markdown)** | Authoritative peer | Professional and knowledgeable, but accessible. |

### 2.2 Plain language rules

AI agents must prefer these substitutions in UI strings and documentation:

| Avoid | Use instead |
| :--- | :--- |
| Utilize | Use |
| In order to | To |
| Notwithstanding | Despite / even though |
| At this point in time | Now |
| Facilitate | Help |
| Configuration | Settings (in UI labels only) |
| Enable/disable | Turn on / turn off (in user-facing help text) |

### 2.3 Grammar and mechanics

- **Active voice.** "Save your changes" — not "Changes are saved."
- **Sentence case.** All headings, button labels, and field labels use sentence case. "Add content type" — not "Add Content Type."
- **Lists.** Use bullets for unordered items; numbered lists for sequential steps only.
- **Oxford comma.** Always use the serial comma in lists of three or more.
- **American English.** "color", "center", "behavior" — not "colour", "centre", "behaviour."
- **Abbreviations.** Spell out on first use: "Web Content Accessibility Guidelines (WCAG)." No periods in acronyms.

### 2.4 Numbers and dates

- Spell out one through nine in prose; use numerals for 10 and above.
- Use `YYYY-MM-DD` for machine-readable dates. Use "April 4, 2026" for human-readable text.
- Use numerals and `%` for all percentages: "4.5% contrast ratio."
- Version numbers always use numerals: "Drupal 10", "WCAG 2.2."

### 2.5 Button and action label vocabulary

Observed across all admin and front-end pages. Use these exact verbs and patterns. Do not invent synonyms.

**Creation actions — "Add [entity]" (not "Create [entity]") for most entities:**

| Correct | Incorrect |
| :--- | :--- |
| Add content | Create content / New content |
| Add content type | Create content type |
| Add vocabulary | Create vocabulary |
| Add user | Create user / New user |
| Add menu | Create menu |
| Add format | Create format |

**Exception:** Node creation forms use "Create [Content type label]" as the h1 (e.g., "Create Article", "Create Basic page") because the type label is appended. The local action link still reads "Add content."

**Primary submit buttons — "Save [context]":**

| Button text | Context |
| :--- | :--- |
| Save | Generic form save |
| Save configuration | Settings/config forms |
| Save blocks | Block layout form |
| Save permissions | Permissions form |
| Save and manage fields | After creating a content type |

**Never use:** "Submit", "OK", "Apply", or "Confirm" as primary button labels. These are not used in Drupal Core.

**Approved verb list for buttons and actions:**

`Add` · `Save` · `Create new account` · `Configure` · `Edit` · `Delete` · `Remove` · `Install` · `Uninstall` · `Filter` · `Search` · `Upload` · `Preview` · `Run cron` · `Clear all caches` · `Place block` · `Log in` · `Back` · `Next` · `Previous`

**Accessibility-disclosure labels for icon-only or ambiguous buttons** follow "[Action] [Target]" pattern:
- "Place block in the Content region"
- "Open Breadcrumb configuration options"
- "Collapse sidebar"
- "Close message"
- "List additional actions"

### 2.6 Authentication and account language

Drupal Core uses specific terms for auth flows. Do not substitute synonyms.

| Use this | Not this |
| :--- | :--- |
| Log in | Login / Sign in / Sign on |
| Log out | Logout / Sign out |
| Create new account | Register / Sign up |
| Reset your password | Forgot password / Recover password |
| Access denied | 403 Forbidden / Permission denied |
| Page not found | 404 Error / Not found |

### 2.7 Heading conventions observed in the admin UI

**Page title (h1) patterns found across admin pages:**

| Pattern | Examples |
| :--- | :--- |
| Plain noun (matches nav label) | "Content", "Structure", "People", "Reports", "Configuration", "Appearance" |
| "Add [entity]" | "Add content type", "Add vocabulary", "Add user" |
| "Create [Type label]" | "Create Article", "Create Basic page" (content type label appended) |
| Descriptive phrase | "Text formats and editors", "Basic site settings", "Logging and errors" |
| "Extend" | Modules page h1 — the navigation label is "Modules" but h1 is "Extend" |
| State/role pages | "Permissions", "Roles", "Block layout", "Appearance", "Maintenance mode" |

**Key inconsistency to be aware of:** Content type labels are appended verbatim to "Create", so the case follows the content type's human-readable name (e.g., "Article" is capitalized, "Basic page" is not). This is expected behavior from the Node module, not a bug.

**Heading hierarchy in admin pages (DOM order):**

The admin navigation sidebar appears before the h1 in source order. This is intentional. The rendered heading sequence on a typical admin page is:
```
h2: Administrative sidebar
  h3: [Sidebar section] (Content / Administration / Help / User)
h2: Main navigation
h2: Primary tabs (when tabs are present)
h2: Breadcrumb
h1: [Page title]   ← appears after navigation headings in source
```

AI agents generating templates must preserve this order. Do not move h1 above the navigation landmarks.

### 2.8 Form field label and help text patterns

**Field labels** are concise, sentence-case nouns. Required fields are marked with `*` appended by Drupal's form API — do not add asterisks manually.

Common field label vocabulary observed:
- `Title` · `Name` · `Username` · `Email address` · `Password` · `Status` · `Description` · `Weight` · `Machine name` · `Author` · `Date`

**"Machine name"** is the standard label for all programmatic identifiers (not "Slug", "Key", "ID", or "Handle").

**Help text patterns** (`.form-item__description`):

| Pattern | Example |
| :--- | :--- |
| Format constraint | "100 MB limit. Allowed types: png gif jpg jpeg webp." |
| Comma list with example | "Enter a comma-separated list. For example: Amsterdam, Mexico City, \"Cleveland, Ohio\"" |
| Consequence statement | "Users with the \"Post comments\" permission can post comments." |
| Technical format rule | "Unique machine-readable name: lowercase letters, numbers, and underscores only." |
| Contextual instruction | "Specify an alternative path by which this data can be accessed." |
| Cross-reference | "Control which roles can \"View the administration theme\" on the Permissions page." |
| Authorship | "The username of the content author." |
| Hover/UI behavior | "Shown when hovering over the menu link." |

**Help text rules:**
- End every help text sentence with a period.
- Use second person sparingly ("you"); prefer third-person or passive constructions: "The username of the content author" rather than "Enter the author's username."
- When giving an example, use the phrase "For example:" followed by the example.
- Cross-references name the exact page or permission string in quotes.

**Placeholder text** (observed in filter/search inputs):
- "Filter by name or description"
- "Filter by permission name"
- "Filter by view name, machine name, description, or display path"
- "Search by keyword or phrase."

Rule: filter placeholders do **not** end with a period; search placeholders **do** end with a period. (Note: this is an existing inconsistency in core — do not widen it.)

### 2.9 Table, navigation, and breadcrumb patterns

**Table column headers:**

| Header | Use |
| :--- | :--- |
| `Title` | Node/entity primary label |
| `Name` | User or vocabulary name |
| `Type` | Content type, block type |
| `Status` | Published / Unpublished / Active |
| `Author` | Content author |
| `Updated` | Last modified date |
| `Operations` | Action links column — always this word, never "Actions" or "Edit" |
| `Weight` | Drag-to-reorder numeric weight |
| `Machine name` | Programmatic identifier column |
| `Region` | Block placement region |
| `Description` | Short text description |

**Local action links** (the "+ Add" buttons above list pages) always follow "Add [entity]" — see §2.5.

**Local task tabs** use the shortest unambiguous label:
- "View", "Edit", "Delete", "Settings" for entity operations
- "Manage fields", "Manage display", "Manage form display" for field configuration
- "Permissions", "Roles" for user management
- "List", "Index" for overview pages
- "Uninstall" on the Modules page

**Breadcrumbs** always start with "Home" (not the site name, not "/"). Subsequent crumbs match the h1 of their respective pages exactly:
`Home > Administration > Structure > Content types > Add content type`

**Module description format** (observed in the Modules page). Descriptions are one sentence beginning with a present-tense third-person verb:
- "Provides…", "Allows…", "Manages…", "Logs…", "Generates…", "Sends…", "Caches…"
- Do not begin with the module name: ❌ "Block Content allows…" → ✅ "Allows the creation of content blocks…"

**Permission label format** (observed in the Permissions table):
`[Role name]: [Verb phrase describing the permission]`
Example: `Administrator: Administer content types`

---

## 3. Design tokens

### 3.1 Claro (admin theme)

Source of truth: `core/themes/claro/css/base/variables.pcss.css`

#### Colors

| Token | Value | Use |
| :--- | :--- | :--- |
| `--color-absolutezero` | `#003ecc` (blue-600) | Primary actions, links, active states |
| `--color-focus` | `#26a769` (lightninggreen) | Focus ring inner fill |
| `--color-maximumred` | `#dc2323` (red-500) | Error states, danger buttons |
| `--color-sunglow` | `#ffd23f` | Warning indicators |
| `--color-lightninggreen` | `#26a769` | Success/status indicators |
| `--color-fg` | `--color-text` (`#232429`) | Default body text |
| `--color-bg` | `#fff` | Page background |
| `--color-gray-050` | `#f3f4f9` | Subtle backgrounds (forms, cards) |
| `--color-gray-500` | `#919297` | Input borders, muted text |
| `--color-link` | `--color-absolutezero` | Link default |
| `--color-link-hover` | `--color-absolutezero-hover` (`#0036b1`) | Link hover |

#### Status color classes (use these CSS classes, not raw values)

| Class | Text color | Background | Use |
| :--- | :--- | :--- | :--- |
| `.color-success` | `#325e1c` | `#f3faef` | Success messages |
| `.color-warning` | `#734c00` | `#fdf8ed` | Warning messages |
| `.color-error` | `#a51b00` | `#fcf4f2` | Error messages |

#### Typography

| Token | Value | Notes |
| :--- | :--- | :--- |
| `--font-family` | `BlinkMacSystemFont, -apple-system, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif` | System UI stack — no web fonts in admin |
| `--font-size-base` | `1rem` (16px) | Body text |
| `--font-size-h1` | `2.027rem` (~32px) | Page titles |
| `--font-size-h2` | `1.802rem` (~29px) | Section headings |
| `--font-size-h3` | `1.602rem` (~26px) | Sub-section headings |
| `--font-size-s` | `0.889rem` (~14px) | Form labels |
| `--font-size-xs` | `0.79rem` (~13px) | Descriptions, help text |
| `--line-height` | `1.5` | Body text |

#### Spacing

| Token | Value | Use |
| :--- | :--- | :--- |
| `--space-xs` | `0.5rem` (8px) | Tight gaps, inline spacing |
| `--space-s` | `0.75rem` (12px) | Form field padding, small gaps |
| `--space-m` | `1rem` (16px) | Standard component padding |
| `--space-l` | `1.5rem` (24px) | Section spacing |
| `--space-xl` | `3rem` (48px) | Page-level whitespace |

#### Interaction

| Token | Value | Use |
| :--- | :--- | :--- |
| `--base-border-radius` | `2px` | All bordered UI elements |
| `--speed-transition` | `0.2s` | Hover/focus transitions |
| `--focus-box-shadow` | Double ring: white offset + `--color-focus` outer | All focusable elements |
| `--focus-border-size` | `3px` | Outer focus ring |
| `--focus-border-offset-size` | `2px` | White gap between element and focus ring |

### 3.2 Olivero (front-end theme)

Source of truth: `core/themes/olivero/css/base/variables.pcss.css`

| Token | Value | Notes |
| :--- | :--- | :--- |
| `--font-sans` | `"metropolis", sans-serif` | Body and headings |
| `--font-serif` | `"Lora", "georgia", serif` | Accent/pull quotes |
| `--font-size-base` | `16px` | Root font size |
| `--sp` | `18px` | Base spacing unit |
| `--max-width` | `1350px` | Maximum content width |
| `--color--primary-50` | `hsl(202, 79%, 50%)` | Brand blue (medium) |
| `--color--gray-5` | `hsl(201, 15%, 5%)` | Near-black text |
| `--color--white` | `#fff` | Background |
| `--color--red` | `#e33f1e` | Error/danger |
| `--color--gold` | `#fdca40` | Warning |
| `--color--green` | `#3fa21c` | Success |

---

## 4. Component and markup patterns

### 4.1 Twig templates

- Always use semantic HTML elements before adding ARIA.
- Use `{{ content }}` and `{{ attributes }}` to preserve Drupal's render pipeline.
- `aria-label` is required when the element's visible label is absent or ambiguous.
- Use `<button>` for actions that stay on the page; use `<a href>` for navigation.
- Never use `<div>` or `<span>` as interactive controls without full ARIA and keyboard handling.

### 4.2 Forms

- Every `<input>`, `<select>`, and `<textarea>` must have a programmatically associated `<label>`.
- **Never use `title` attribute alone as a label** (`label-title-only` is a known Serious violation on `/admin/content` and `/admin/people` — do not introduce more).
- Required fields must use Drupal's `#required` form API property, which renders the correct ARIA and visual indicator.
- Error messages must be associated via `aria-describedby` to the field in error.
- Group related fields with `<fieldset>` and `<legend>`.

### 4.3 Tables

- Use `<caption>` for every data table.
- Use `<th scope="col">` for column headers and `<th scope="row">` for row headers.
- Never use a table for layout.
- Sortable column headers must be keyboard-operable (Drupal's tabledrag and tablesort libraries handle this — do not replace them).

### 4.4 Navigation and regions

- Every page must have exactly one `<main>` landmark.
- `<footer>` must be a top-level landmark — not nested inside `<main>` or another sectioning element (`landmark-contentinfo-is-top-level` is a known violation in Claro and Gin — do not introduce more).
- Provide a "skip to main content" skip link as the first focusable element on every page.
- The admin toolbar is rendered by Drupal's toolbar module; do not bypass or duplicate it.

### 4.5 Focus management

- All focusable elements must use the Claro double-ring focus style:
  ```css
  box-shadow: var(--focus-box-shadow);
  outline: var(--focus-outline);
  ```
- Never use `outline: none` or `outline: 0` without providing an equivalent custom focus indicator.
- After dialog open/close, return focus to the triggering element or the first focusable element in the dialog.

---

## 5. CSS and PostCSS conventions

- **PostCSS source files** end in `.pcss.css`; compiled output ends in `.css`. **Never edit compiled `.css` directly** — edit the `.pcss.css` source.
- Use CSS custom properties from the theme variables file. Never hardcode color, spacing, or font-size values.
- Use `rem` units for font sizes and spacing. Never use `px` for font sizes.
- Write mobile-first CSS: base styles for small viewports, then `min-width` media queries for larger breakpoints.
- Respect `prefers-reduced-motion`: wrap transitions and animations:
  ```css
  @media (prefers-reduced-motion: no-preference) {
    .my-element { transition: var(--transition); }
  }
  ```
- Never set `maximum-scale=1` or `user-scalable=no` in viewport meta tags.

---

## 6. JavaScript conventions

- JavaScript must not be required for core navigation or form submission.
- Use Drupal's behavior system (`Drupal.behaviors`) for all JS that enhances the DOM.
- Detach behaviors in `Drupal.behaviors.myBehavior.detach()` when the component is removed.
- Prefer native browser APIs over jQuery when available in Drupal 10+.
- Keyboard events must accompany all mouse/pointer event handlers for interactive widgets.

---

## 7. Plain language standard

### 7.1 Target and philosophy

Drupal Core UI strings (help text, module descriptions, status messages, field descriptions) should target:

| Metric | Target | Current baseline (April 2026) |
| :--- | :--- | :--- |
| Flesch Reading Ease | ≥ 60 (standard/plain English) | **48** — college level |
| Flesch-Kincaid Grade Level | ≤ 8 | **9.3** |
| Average words per sentence | ≤ 20 | 10.9 ✅ |

> **Important:** Readability scores are a *diagnostic tool*, not a pass/fail gate.
> Canada.ca (2024 update) and the ISO plain language standard (2023) both caution
> against relying on formulas alone — scores can conflict, penalize necessary technical
> terms, and miss structural problems. Use them to find candidates for human review.

References:
- [Canada.ca Content Style Guide §2 — Communicate clearly with plain language](https://design.canada.ca/style-guide/#toc6) (2024 update)
- [18F Content Guide — Plain language](https://guides.18f.gov/content-guide/our-style/plain-language/)
- [Colorado OIT Plain Language guide](https://oit.colorado.gov/standards-policies-guides/guide-to-accessible-web-services/plain-language)

### 7.2 Issue baseline (automated scan, April 2026)

Scanned 330 text samples across 40 pages. Run `yarn a11y:plain-language` to refresh.

| Issue type | Count | Priority |
| :--- | :--- | :--- |
| Passive voice | 69 | High — rewrite to active voice |
| Nominalization | 33 | Medium — replace noun forms with verbs |
| Jargon (`via`, `item`, technical strings) | 14 | Medium — use plain alternatives |
| Long sentences (> 25 words) | 1 | Low |

### 7.3 Writing rules (derived from scan findings)

#### Prefer active voice

The scan found 69 passive voice instances. Active voice is shorter, clearer, and more direct.

| Passive (avoid) | Active (use) |
| :--- | :--- |
| "This is only used when the site is configured…" | "Drupal uses this only when you configure…" |
| "Ensures that the latest versions… are displayed" | "Shows the latest version of each image" |
| "Images uploaded via a Text Editor are tracked" | "Tracks images you upload through a Text Editor" |
| "If dimensions are specified" | "If you set image dimensions" |

#### Replace nominalizations with verbs

The scan found 33 instances of abstract noun forms that obscure the action. Replace with the underlying verb where possible.

| Nominalization (avoid in help text) | Plain alternative |
| :--- | :--- |
| "configuration" (as a noun) | "settings", "set up", or just name the setting |
| "administration" | "managing", "admin" |
| "implementation" | "how it works", "sets up" |
| "authentication" | "sign-in", "login" |
| "authorization" | "permission", "access" |
| "specification" | "standard", "format" |
| "documentation" | "help", "docs", "guide" |

**Exception:** Use the technical term when writing for a developer audience or when the noun is the actual name of a UI element (e.g., "Configuration" as a menu label).

#### Replace jargon

| Jargon (avoid) | Plain alternative |
| :--- | :--- |
| via | through, using, with |
| item | node, page, piece of content — or the specific type name |
| utilize | use |
| facilitate | help, allow |
| implement | set up, add, turn on |
| leverage | use |
| i.e. | that is |
| e.g. | for example |

#### Keep sentences short and direct

- Aim for 15–20 words per sentence in help text.
- If a sentence has more than 25 words, split it.
- Lead with the most important information — inverted-pyramid style.
- One idea per sentence.

#### Module descriptions

Module descriptions currently score as the hardest text in core (some at grade 17–25) because the machine-readable metadata ("Machine name:", "Requires:", "Version:") is concatenated with the human-readable description. This is a rendering issue, not a writing issue — the description sentence itself is usually grade 8–10.

The description sentence should:
- Be one sentence.
- Begin with a present-tense third-person verb: "Provides", "Allows", "Manages", "Logs".
- Avoid the module name in the sentence: ❌ "CKEditor 5 provides…" → ✅ "Provides the CKEditor 5 rich text editor."

#### Help text checklist

Before committing new help text, verify:
- [ ] Active voice
- [ ] ≤ 20 words per sentence
- [ ] No jargon from the list above
- [ ] Ends with a period
- [ ] Includes "For example:" when giving an example
- [ ] Cross-references name the exact page or permission in quotes

### 7.4 Running the analysis

```bash
# From repo root (uses npx since yarn is not always available)
cd core && node tests/playwright/scripts/plain-language-analysis.js
```

Or via the registered script:

```bash
cd core && yarn a11y:plain-language
```

Output: `reports/plain-language-report.md` (human-readable) and `reports/plain-language-report.json`.

---

## 8. Known accessibility issues (do not regress)

These violations were detected by the automated axe crawl on 2026-04-04. They represent the current baseline. **Do not introduce additional instances** of these patterns.

| Rule | Impact | Pages affected | Theme(s) |
| :--- | :--- | :--- | :--- |
| `color-contrast` | Serious | `/admin/content`, `/admin/people` | Claro, Gin |
| `label-title-only` | Serious | `/admin/content`, `/admin/people` | Claro, Gin |
| `landmark-contentinfo-is-top-level` | Moderate | Appearance, Modules, Configuration, more | Claro, Gin |
| `region` | Moderate | Multiple admin pages | Gin (experimental) |
| `page-has-heading-one` | Moderate | Homepage | Olivero |
| `empty-heading` | Minor | Homepage | Claro (as front-end) |

To check whether a proposed change adds new violations:

```bash
cd core && npx playwright test --config=tests/playwright/playwright.config.ts \
  --project=chromium tests/playwright/tests/a11y-axe-crawl.spec.ts
```

Results are written to `reports/axe-results.json`. Run `node core/tests/playwright/scripts/analyze-patterns.js` for the pattern report.

---

## 9. AI agent rules

- Read [AGENTS.md](./AGENTS.md) before making any change.
- Read [ACCESSIBILITY.md](./ACCESSIBILITY.md) before touching any template, CSS, or JavaScript.
- Identify which theme surface is being edited (Claro admin vs. Olivero front-end) and apply the correct tokens from § 3.
- **Never hardcode color, spacing, or font values.** Always use CSS custom properties.
- **Never edit compiled `.css` files.** Always edit the `.pcss.css` source.
- **Never use `title` attribute alone as an accessible label** — see § 4.2.
- **Never nest `<footer>` inside `<main>` or another section** — see § 4.4.
- When generating Twig templates, always follow the patterns in § 4.1.
- **Button labels:** follow § 2.5 exactly. Use "Add [entity]", "Save [context]", "Log in". Never use "Submit", "OK", "Sign in", or "Register".
- **Help text:** end every sentence with a period; use "For example:" when giving examples; cross-reference exact page names in quotes — see § 2.8.
- **Table columns:** use "Operations" for action link columns, never "Actions" — see § 2.9.
- **Breadcrumbs:** always start with "Home"; subsequent labels must match the h1 of the linked page exactly — see § 2.9.
- **Module descriptions:** one sentence, present-tense third-person verb, no leading module name — see § 2.9.
- Run the axe crawl and verify no new violations before declaring a UI change done.
- Keep changes scoped to the minimum required. Do not refactor unrelated code.
- Surface conflicts between this file and [ACCESSIBILITY.md](./ACCESSIBILITY.md) before proceeding — ACCESSIBILITY.md wins.

---

## 10. References

- [Drupal Core Claro theme variables](./core/themes/claro/css/base/variables.pcss.css)
- [Drupal Core Olivero theme variables](./core/themes/olivero/css/base/variables.pcss.css)
- [Drupal accessibility issue queue](https://www.drupal.org/project/issues/drupal?component=accessibility)
- [Drupal CSS architecture documentation](https://www.drupal.org/docs/develop/standards/css/css-architecture-for-drupal-9)
- [Drupal JavaScript coding standards](https://www.drupal.org/docs/develop/standards/javascript/javascript-coding-standards)
- [Drupal Twig coding standards](https://www.drupal.org/docs/theming-drupal/twig-in-drupal/twig-coding-standards)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [Plain Language Guidelines — Digital.gov](https://www.plainlanguage.gov/guidelines/)
- [ACCESSIBILITY.md](./ACCESSIBILITY.md)
- [AGENTS.md](./AGENTS.md)

---

## AI disclosure

| AI tool | Role |
| :--- | :--- |
| GitHub Copilot (Claude Sonnet 4.6) | Generated initial draft of this file based on analysis of Claro/Olivero CSS tokens, axe crawl results, and the STYLES.md template from [mgifford/STYLES.md](https://github.com/mgifford/STYLES.md) |
| GitHub Copilot (Claude Sonnet 4.6) | Extended §§ 2.5–2.9 with content design patterns extracted by crawling all 40 public and admin pages of the live DDEV site using a custom Playwright script (`core/tests/playwright/scripts/extract-content-patterns.js`) |
