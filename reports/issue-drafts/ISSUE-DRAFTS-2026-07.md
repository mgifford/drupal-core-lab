# Drupal core issue drafts — 2026-07

Five scoped, reviewable issue drafts ready to file at
[drupal.org/node/add/project-issue/drupal](https://www.drupal.org/node/add/project-issue/drupal).
Each is deliberately small ("sonnet-sized"): one measurable outcome, no
speculative scope. Review, adjust versions/components against the current
queue, and file.

> Disclosure to include in each issue: *AI-assisted drafting (Claude Code);
> reviewed and filed by a human. No external code copied.*

---

## Draft 1 — Default Admin theme: test and document real RTL, dark-mode, and accent rendering states

- **Category:** Task
- **Component:** Default admin theme
- **Priority:** Normal
- **Tags:** `Accessibility`, `RTL`, `Usability`
- **Upstream status:** No matching core issue found; Default Admin is new to core (11.4), so coverage work is plausibly new. Safe to file. Part of the Default Admin theme cluster with Drafts 5 and 7 — cross-reference.

### Problem/Motivation

The new Default Admin theme (Gin-based) computes a family of derived color
variables from its accent presets, supports dark mode, and — like all core
themes — must work in RTL languages. None of these states can be validated
by mutating the DOM client-side after page load:

- Real RTL loads different server-side CSS (direction-aware stylesheets,
  logical-property fallbacks) and sets `dir` on the server. Flipping
  `document.dir` in DevTools or a test runner exercises a synthetic state
  that no user ever sees. (Our external a11y crawl made exactly this mistake
  and produced unusable RTL findings before switching to a real Hebrew
  language install.)
- Accent presets derive a palette beyond the base accent variable; testing a
  preset by overriding one CSS custom property misses most of what changes,
  including color-contrast outcomes.

There is currently no documented, repeatable way to test the Default Admin
theme across these real states, and no automated coverage of them.

### Proposed resolution

1. Document the supported state matrix for the Default Admin theme:
   {LTR, RTL (Hebrew/Arabic)} × {light, dark} × accent presets — including
   how each state is entered through real configuration (language install
   with URL prefix, `enable_dark_mode`, `preset_accent_color`).
2. Add Nightwatch (or FunctionalJavascript) coverage for at least one RTL
   language on representative admin pages (content list, node form, settings
   form), asserting direction-sensitive layout and focus indicators.
3. Add color-contrast assertions for each accent preset in both light and
   dark mode — accent changes are color-only, so a color-rules-only scan per
   preset keeps this cheap.

### Remaining tasks

- Agree on the representative admin page set.
- Decide Nightwatch vs. FunctionalJavascript placement.

---

## Draft 2 — Serve AVIF from image styles by default where the toolkit supports it

- **Category:** Feature request
- **Component:** image system
- **Priority:** Normal
- **Tags:** `Sustainability`, `Performance`
- **Upstream status:** AVIF capability already shipped in core 11.2 via #3202016 (Closed/Fixed: "Let GDToolkit support AVIF image format", with WebP fallback applied to default image styles). Before filing, verify a real gap remains — high risk of duplicate or works-as-designed.

### Problem/Motivation

Image bytes dominate page weight on media-rich sites. Core's image style
pipeline can convert to WebP, but the most efficient widely-supported format
today is AVIF (~20–50% smaller than JPEG at comparable quality; supported in
all evergreen browsers). Every site that sticks with default image styles
ships larger images than necessary — multiplied across the Drupal ecosystem,
a platform-default improvement here is one of the highest-leverage
sustainability changes available (see the draft
[W3C Web Sustainability Guidelines](https://www.w3.org/TR/web-sustainability-guidelines/)
on efficient media formats).

### Proposed resolution

1. Audit current state: confirm GD/ImageMagick toolkit AVIF capabilities per
   supported PHP version, and what the image style "Convert" effect offers
   today.
2. Where the toolkit supports AVIF, make core's default image styles use it
   (with WebP → JPEG/PNG fallback chain), so new installs get it without
   configuration.
3. Record the measured byte savings on the Umami demo as evidence in the
   issue.

### Remaining tasks

- Fallback behavior for toolkits without AVIF encode support.
- Update Standard/Umami profile image style configs + upgrade path
  considerations for existing sites (likely: new defaults for new installs
  only).

---

## Draft 3 — Make core themes demonstrate best-practice font loading

- **Category:** Task
- **Component:** Olivero theme
- **Priority:** Normal
- **Tags:** `Sustainability`, `Performance`, `frontend`
- **Upstream status:** Overlaps #3500955 (Active: Olivero preload/gap issues) and #3216489 (Closed/Fixed: preload cleanups). The broader subsetting + per-metric override scope may be novel; file referencing these to avoid duplicate.

### Problem/Motivation

Core themes are the pattern library the ecosystem copies. Font loading has
well-established best practices — WOFF2-only, subsetting, `font-display`,
preloading of critical faces, system-font fallback stacks with metric
overrides (`size-adjust`/`ascent-override`) to prevent layout shift — but
core themes don't currently document or fully demonstrate them, so contrib
themes routinely ship render-blocking, unsubsetted fonts.

### Proposed resolution

1. Audit font delivery in Olivero and the Default Admin theme: formats,
   subsetting, `font-display` values, preload usage, fallback stacks.
2. Fix gaps found (this may be a no-op in places — the audit is the
   deliverable either way).
3. Add a "font loading" section to core theming documentation capturing the
   pattern, so starterkit-derived themes inherit it.

### Remaining tasks

- Decide whether metric-override fallbacks are in scope for this pass.

---

## Draft 4 — Measure and ratchet down JavaScript shipped to anonymous users

- **Category:** Task
- **Component:** asset library system
- **Priority:** Normal
- **Tags:** `Sustainability`, `Performance`
- **Upstream status:** No duplicate found. Adjacent: #3308122 (open: pre-minify/optimize core JS). Safe to file, referencing it.

### Problem/Motivation

Anonymous page views are the overwhelming majority of Drupal page views
ecosystem-wide, so every default script on an anonymous page is multiplied
billions of times. Core has steadily reduced anonymous-page JS (jQuery
removal from front-facing paths, behaviors cleanup), but there is no
measured baseline and no guard against regression: a library added to a
common template can silently put tens of KB back on every anonymous view.

### Proposed resolution

1. Establish the baseline: per-page JS bytes and request counts for a
   standard-profile anonymous crawl in Olivero (an external measurement
   pipeline exists and can be referenced/adapted:
   [sustainability trend reports](https://mgifford.github.io/drupal-core/)).
2. Publish the numbers in the issue and identify the largest contributors
   (attach per-library breakdown).
3. Propose a budget (e.g. "anonymous Olivero pages ship ≤ N KB JS") and a
   CI check or release-notes checklist item that flags budget breaks.

### Remaining tasks

- Agree where the check runs (core GitLab CI job vs. periodic external
  report).

---

## Draft 5 — Adopt a page-weight and DOM-size budget for the Default Admin theme

- **Category:** Task
- **Component:** Default admin theme
- **Priority:** Normal
- **Tags:** `Sustainability`, `Performance`, `Usability`
- **Upstream status:** No duplicate found; Default Admin is new to core, so a page-weight/DOM budget is plausibly new. Safe to file. Companion to Draft 7 (PerformanceTestBase admin-route coverage is the mechanism for this budget) and part of the Default Admin cluster (Drafts 1, 5, 7).

### Problem/Motivation

Content editors spend hours per day in the admin UI, often on modest
hardware. Admin pages are the heaviest in core (external crawl data shows
admin routes consistently at the top of per-page transfer size and DOM node
counts). Unlike the front end, the admin theme has no weight or DOM budget,
so complexity only accumulates.

### Proposed resolution

1. Publish the baseline from the existing per-page measurements: transfer
   bytes, request count, and DOM nodes for the ~20 crawled admin routes in
   the Default Admin theme (data:
   [reports/sustainability/history.json](https://github.com/mgifford/drupal-core/blob/main/reports/sustainability/history.json)).
2. Agree budgets for the top admin routes (e.g. content list, node edit
   form) — DOM node ceilings matter as much as bytes for assistive-tech
   responsiveness, which makes this an accessibility issue too.
3. Track per-release; flag regressions ≥10% in the issue or CI.

### Remaining tasks

- Pick the budget numbers from the baseline rather than aspiration.
- Coordinate with the Gin upstream on shared wins.

---

## Draft 6 — Add an AccessibilityTestTrait so FunctionalJavascript tests can assert axe cleanliness at interaction states

- **Category:** Feature request
- **Component:** phpunit
- **Priority:** Normal
- **Tags:** `Accessibility`, `Testing system`
- **Upstream status:** Overlaps #2857808 (Active meta: "Automate Accessibility Checks") and the Nightwatch axe effort (#3293469, Closed/Fixed). Scope explicitly as a PHPUnit/FunctionalJavascript trait — note core currently runs axe via Nightwatch, not PHPUnit — to avoid a duplicate. Related scanning work: Draft 8 (Drupal CMS CI gate).

### Problem/Motivation

Automated accessibility scanning in core (Nightwatch axe) sees pages at
rest. Most real accessibility regressions appear in interaction states —
open dialogs, expanded widgets, forms re-rendered with errors — and core's
FunctionalJavascript tests already drive components into exactly those
states with no accessibility assertions.

`\Drupal\Tests\PerformanceTestTrait` established the pattern: a trait that
lets any existing test add a cross-cutting assertion cheaply.

### Proposed resolution

Add an AccessibilityTestTrait for FunctionalJavascript tests providing
`assertNoAxeViolations(array $rules = [], $context = NULL)` (injecting
axe-core, already a core dev dependency, into the WebDriver session).
Seed usage in a handful of high-state-value tests (dialog, Layout Builder,
form validation) rather than converting everything at once. Also becomes
the cheap way for a11y bugfix MRs to include their own regression test.

### Remaining tasks

- Decide rule baseline (start with the un-suppressed Nightwatch set).
- Performance impact measurement on the converted tests.

---

## Draft 7 — Add PerformanceTestBase coverage for admin-theme routes

- **Category:** Task
- **Component:** Default admin theme
- **Priority:** Normal
- **Tags:** `Sustainability`, `Performance`, `Testing system`
- **Upstream status:** Extends #3346765 (Closed/Fixed: introduced PerformanceTestBase). The admin-route assertion scope is new. Safe to file, referencing the parent issue. Companion to Draft 5 (admin theme page-weight/DOM budget).

### Problem/Motivation

`StandardPerformanceTest` pins exact query counts, cache operations, and
CSS/JS byte counts for front-end routes — any regression fails CI and
forces conscious review. Admin routes have no such coverage, yet editors
spend hours a day there and external measurement shows Default Admin admin
pages are the heaviest in core (~1.3 MB transfer on /node/add/article and
the content list; data:
https://github.com/mgifford/drupal-core/blob/main/reports/sustainability/history.json).

### Proposed resolution

Add a DefaultAdminPerformanceTest (FunctionalJavascript, extends
PerformanceTestBase) asserting query count, CacheGetCount, and
Stylesheet/Script bytes for /admin/content and a node edit form, with
initial pinned values taken from current measurements. This is the
unit-test form of an admin payload budget.

### Remaining tasks

- Consider extending PerformanceTestTrait to also record image transfer
  bytes (currently CSS/JS only) — images dominate page weight and have no
  assertion surface.

---

## Draft 8 — Drupal CMS: add an accessibility smoke gate per recipe

- **Project:** drupal/cms (not core)
- **Category:** Feature request
- **Tags:** `Accessibility`
- **Upstream status:** Targets the drupal/cms project. No duplicate found in a reasonable search of the CMS queue. Verify against drupal/cms before filing; distinct from core's Nightwatch gate. Related scanning work: Draft 6.

### Problem/Motivation

Drupal CMS recipes install complete feature sets (dashboard, project
browser, consent management, …) with no accessibility check in the
pipeline. New-user first impressions of Drupal accessibility are now
formed by CMS, not bare core.

### Proposed resolution

  A smoke-level axe pass in CMS CI: install each recipe, scan its primary
  routes (recipe-declared or convention-based), fail on new critical/serious
  WCAG-tagged violations against a recorded baseline. An external
  comprehensive crawl profile for CMS exists to generate the baseline and
  page inventory (https://github.com/mgifford/drupal-core/issues/36).

---

## Draft 9 — Inline form errors not shown for tableselect (table) form elements

- **Project:** drupal (core)
- **Category:** Bug report
- **Component:** inline_form_errors.module
- **Priority:** Normal
- **Tags:** `Accessibility`, `Forms`, `inline_form_errors`
- **Upstream status:** Corresponds to existing drupal.org **#2848307** ("Inline errors not working on form table elements"). **Submitted** via MR !16355 with a green Unit test (`OK (3 tests, 49 assertions)`); do not file a new issue. This draft + patch (`a11y-DRUPAL-A11Y-018`) is a contribution to that issue. Patch landed in working tree (`core/modules/inline_form_errors/...`).

### Problem/Motivation

The Inline Form Errors module (`inline_form_errors`) shows a field's error
message next to the field and links to it from the top-of-page summary. It
does this for most elements, but for table form elements it only handles
`#type => 'table'`.

The common table form element in core is `tableselect` (used on the module
uninstall form and many admin lists). `tableselect` declares
`#type => 'tableselect'`, so `FormErrorHandler::setTableElementInlineErrors()`
skips it. When a `tableselect` has an error, the message appears only in the
top summary, never inline next to the table. Screen reader and keyboard users
lose the inline association (`aria-describedby`) that other elements get.

Drupal 8 added the Table form element precisely so tables could take form
errors; tableselect should too.

### Proposed resolution

1. Extend the type check in
   `core/modules/inline_form_errors/src/FormErrorHandler.php`:
   `setTableElementInlineErrors()` to also match `tableselect` (keep `table`).
   Both already render via the `table` theme and set `#errors`, so the existing
   inline-error markup and `aria-describedby` wiring apply unchanged.
2. Add a regression test (`testTableElementErrorsInline`) asserting that a
   `tableselect` (and `table`) error is rendered inline in `#prefix` and
   associated via `aria-describedby` (`edit-<id>--error`). The test fails when
   `tableselect` is excluded, confirming the guard.
3. Patch: `patches/a11y-DRUPAL-A11Y-018-issue-2848307-tableselect-inline-form-errors.patch`.

### Remaining tasks

- Verify no contrib/custom table-like `#type` values need coverage beyond
  `table` and `tableselect`.
- Optional: add a Kernel/Functional render test for the assistive-technology
  output (the Unit test already asserts the `aria-describedby` association).

---

## Draft 10 — #2279111 non-labelable elements: standards-compliant label semantics

- **Project:** drupal (core)
- **Category:** Bug report / patch follow-up
- **Component:** forms system
- **Priority:** Normal
- **Tags:** `Accessibility`, `Forms`, `WCAG`
- **Issue:** https://www.drupal.org/project/drupal/issues/2279111
- **Related source patch credit:** intrafusion re-roll on #3082011 comment #16669292 (attached `3082011-22.patch`)

### What to keep from intrafusion's patch (`3082011-22.patch`)

1. Add `#title_tag` support in preprocess so label rendering can switch tags.
2. Keep `for` output only when the rendered tag is actually `label`.
3. Use a single template pattern (`<{{ tag }}>`) across core and core themes.

### What this consolidation adds on top

1. Explicit `#non_labelable` metadata for wrappers like `#type => item`.
2. Programmatic association for non-labelable wrappers via:
    - wrapper: `id="<base>-wrapper"` + `aria-describedby="<base>-label"`
    - title: `<span id="<base>-label">...` (or custom `#title_tag`)
3. Regression coverage proving the relationship (no invalid `label[for]` targeting `div`, no orphan title text).

### Ready-to-post comment for #2279111

Credit first: this approach builds directly on intrafusion's re-roll in #3082011 comment #16669292 (`3082011-22.patch`). Thank you, @intrafusion, for pushing the `#title_tag` + template simplification pattern forward.

I think the strongest path for #2279111 is to keep the architectural core of that patch and apply it with explicit non-labelable semantics.

#### 1. W3C / HTML spec compliance
Per HTML spec, `label[for]` is for labelable controls only (`input`, `select`, `textarea`, `button`, etc.). Pointing `for` at a `div` fails validation and creates noisy false positives in scanners.

#### 2. Accessible association via ARIA
Removing invalid `for` references is necessary, but not sufficient. We still need a programmatic relationship between wrapper and title for assistive tech.

This patch path does that by:
- marking elements as non-labelable (`#non_labelable => TRUE`),
- rendering wrapper ids as `<base>-wrapper`,
- rendering title ids as `<base>-label`,
- wiring wrapper `aria-describedby` to the title id.

So we get valid HTML and preserved accessibility semantics.

#### 3. Flexible rendering API (`#title_tag`)
Instead of hardcoding special-case markup in Twig, preprocess determines the tag:
- default labelable behavior: `<label for="...">`
- non-labelable default: `<span id="...">` (no `for`)
- explicit override: `#title_tag` (for heading/semantic needs)

This keeps Form API extensible for site builders and contrib.

#### 4. Clean template architecture
Templates in core/themes can stay simple and uniform:

```twig
{% if title is not empty or required -%}
   <{{ tag }}{{ attributes.addClass(classes) }}>{{ title }}</{{ tag }}>
{%- endif %}
```

That removes nested conditionals from Twig and keeps behavior centralized in preprocess.

If folks agree, the follow-up is to keep this minimal, standards-compliant API shape and continue tightening regression coverage around non-labelable wrappers.


