# Drupal.org Issue Queue Comment Drafts (2026-07-13)

Prepared for d.o user: mgifford

## Issue #3573865 - Details preprocess incorrectly adds role to summary

**Issue URL:** https://www.drupal.org/i/3573865
**Issue state (last checked 2026-07-14):** Needs review (status 8)
**Issue status last changed:** 2026-07-14

**Bug ID:** DRU-3d2c0738 (instance) / DRU-93a3d129 (pattern)
**URL:** http://localhost/form-test/group-details
**XPath:** //summary[@data-summary-attribute="test"][@role="button"]
**Full DOM path:** /html/body//details[summary[@data-summary-attribute="test"]]/summary
**WCAG SC:** 1.3.1 - Info and Relationships (Level A)
**Rule:** manual semantic check - redundant-role-summary
**Severity:** Medium
**Frequency:** Pattern-level; applies to details summaries rendered by core preprocess on pages using #type details
**Screen type:** desktop | **Colour mode:** light

### HTML context (current output vs expected after fix)

```html
<!-- Current output (problematic): role is redundantly added on native summary. -->
<summary data-summary-attribute="test" role="button" aria-expanded="false">
  Details element with summary attributes
</summary>
```

```html
<!-- Expected output after fix: native summary semantics preserved, aria-expanded retained. -->
<summary data-summary-attribute="test" aria-expanded="false">
  Details element with summary attributes
</summary>
```

### What changed

- Removed redundant role assignment from summary in:
  - core/lib/Drupal/Core/Form/FormPreprocess.php
- Added regression assertions in:
  - core/modules/system/tests/src/Functional/Form/ElementTest.php
  - confirms aria-expanded remains present
  - confirms role is not rendered on summary

### Patch

- patches/a11y-DRUPAL-A11Y-010-issue-3573865-details-summary-role.patch

### Existing patch and thread context

- Existing community work is already present on the issue fork and MR:
  - https://git.drupalcode.org/project/drupal/-/merge_requests/14777
- Current MR state from API at review time:
  - Open, target branch `11.x`, detailed merge status `conflict`, merge status `cannot_be_merged`.
  - Diff currently includes:
    - core/lib/Drupal/Core/Form/FormPreprocess.php
    - core/modules/views/tests/src/Functional/Plugin/StyleTableTest.php
    - core/.phpstan-baseline.php
- Recent thread discussion includes open questions about native `<details>/<summary>` AT behavior (especially Safari/VoiceOver), and whether to keep/adjust custom summary behavior while preserving semantics.

### Loose ends to call out in queue comment

- Reconcile semantic fix scope with current MR conflict status and rebase needs.
- Confirm which parts of MR !14777 are still desired (core fix vs broader test/baseline churn).
- Confirm expected behavior in Safari/VoiceOver discussion scenarios to avoid regressions.

### Testing status

- Static checks and code review passed.
- Local runtime execution remains blocked in current environment due missing runnable php/phpunit path.

### Strict A/B validation evidence

- Baseline (patch removed):
  - `core/misc/details-aria.js` contains `attr('open') === 'open'` marker.
  - `core/tests/Drupal/FunctionalJavascriptTests/Core/Form/FormGroupingElementsTest.php` does not contain `assertEquals('false', ...)` assertion.
- Patched (patch applied):
  - `core/misc/details-aria.js` contains `parentNode.open ? 'false' : 'true'` marker.
  - `core/tests/Drupal/FunctionalJavascriptTests/Core/Form/FormGroupingElementsTest.php` contains `assertEquals('false', $summary->getAttribute('aria-expanded'));`.
- Roundtrip integrity:
  - Patch reverse/apply cycle completed cleanly with no residual diff.

Current verdict for this issue:
- Code-level A/B evidence: confirmed.
- Runtime A/B evidence (baseline fail + patched pass): pending environment support.

### AI disclosure

This contribution was prepared with assistance from an AI coding tool.
- Tool: GitHub Copilot (GPT-5.3-Codex)
- Used for: patch drafting, regression test drafting, issue comment drafting
- Reviewed by: mgifford
- Skills loaded: drupal-accessibility (sub-skills: drupal-a11y-fapi, drupal-a11y-qa)

---

## Issue #3533586 - Member for label rendered as heading

**Issue URL:** https://www.drupal.org/i/3533586
**Issue state (last checked 2026-07-14):** Reviewed & tested by the community (status 14)
**Issue status last changed:** 2026-06-25

**Bug ID:** DRU-ce079269 (instance) / DRU-1aae3721 (pattern)<br>
**URL:** http://localhost/user/2<br>
**XPath:** //h4[contains(@class,"label") and normalize-space()="Member for"]<br>
**Full DOM path:** /html/body//h4[contains(@class,"label") and normalize-space()="Member for"]<br>
**WCAG SC:** 1.3.1 - Info and Relationships (Level A)<br>
**Rule:** manual semantic check - heading-misuse-label<br>
**Severity:** Medium<br>
**Frequency:** 1 instance per user profile page where member_for is displayed<br>
**Screen type:** desktop | **Colour mode:** light

### HTML context (current output vs expected after fix)

```html
<!-- Current output (problematic): visual label is incorrectly a heading. -->
<h4 class="label">Member for</h4>
```

```html
<!-- Expected output after fix: non-heading label container. -->
<div class="label">Member for</div>
```

### What changed

- Replaced heading markup with non-heading label markup in:
  - core/modules/user/src/Hook/UserHooks.php
- Added regression test in:
  - core/modules/user/tests/src/Functional/UserLoginTest.php
  - confirms Member for is not rendered as h4
  - confirms Member for is rendered as div.label

### Patch

- patches/a11y-DRUPAL-A11Y-011-issue-3533586-member-for-label.patch

### Existing patch and thread context

- This issue already has active community patch/MR history and should be treated as additive review context, not greenfield:
  - Prior MR !12602 was closed when replacement MR !16141 was opened.
  - Thread participants reported local verification of `<h4 class="label">Member for</h4>` changing to `<div class="field__label">Member for</div>` and flagged this as the desired accessibility direction.
- Per your note, this issue is currently in `Reviewed & tested by the community` state, which aligns with the need for comments to focus on final-risk validation rather than restating baseline.

### Loose ends to call out in queue comment

- Visual regression risk remains the main thread concern (theme/CSS assumptions around heading vs non-heading label).
- Relationship to #2638250 should be acknowledged so reviewers know this does not replace the broader architectural follow-up.
- Queue comment should explicitly state that this patch set is intended to align with current MR direction rather than supersede community work.

### Testing status

- Static checks and code review passed.
- Local runtime execution remains blocked in current environment due missing runnable php/phpunit path.

### AI disclosure

This contribution was prepared with assistance from an AI coding tool.
- Tool: GitHub Copilot (GPT-5.3-Codex)
- Used for: patch drafting, regression test drafting, issue comment drafting
- Reviewed by: mgifford
- Skills loaded: drupal-accessibility (sub-skills: drupal-a11y-fapi, drupal-a11y-qa)

---

## Issue #3571628 - aria-expanded does not resync after details toggles

**Issue URL:** https://www.drupal.org/i/3571628
**Issue state (last checked 2026-07-14):** Needs work (status 13)
**Issue status last changed:** 2026-02-09

**Bug ID:** DRU-9da94f27 (instance) / DRU-e1099604 (pattern)
**URL:** http://localhost/node/add/article
**XPath:** //details//summary[@aria-expanded]
**Full DOM path:** /html/body//details/summary[@aria-expanded]
**WCAG SC:** 4.1.2 - Name, Role, Value (Level A)
**Rule:** manual state-sync check - aria-expanded-sync
**Severity:** Medium
**Frequency:** Pattern-level; affects details summaries using core details-aria behavior
**Screen type:** desktop | **Colour mode:** light

### HTML context (current output vs expected after fix)

```html
<!-- Current output can desynchronize after toggle cycles (example state bug when closed): -->
<details>
  <summary aria-expanded="true">Revision information</summary>
</details>
```

```html
<!-- Expected output after fix: aria-expanded mirrors the details open state. -->
<details open>
  <summary aria-expanded="true">Revision information</summary>
</details>

<details>
  <summary aria-expanded="false">Revision information</summary>
</details>
```

### What changed

- Updated details aria behavior to use the details open property for state sync in:
  - core/misc/details-aria.js
- Added regression coverage for close/reopen aria-expanded transitions in:
  - core/tests/Drupal/FunctionalJavascriptTests/Core/Form/FormGroupingElementsTest.php

### Patch

- patches/a11y-DRUPAL-A11Y-012-issue-3571628-aria-expanded-sync.patch

### Testing status

- Static checks and code review passed.
- Local runtime execution remains blocked in current environment due missing runnable php/phpunit path.

### AI disclosure

This contribution was prepared with assistance from an AI coding tool.
- Tool: GitHub Copilot (GPT-5.3-Codex)
- Used for: patch drafting, regression test drafting, issue comment drafting
- Reviewed by: mgifford
- Skills loaded: drupal-accessibility (sub-skills: drupal-a11y-dynamic, drupal-a11y-qa)

---

## Issue #3049125 - Language switcher block is an unlabelled navigation landmark region

**Issue URL:** https://www.drupal.org/i/3049125
**Issue state (last checked 2026-07-14):** Active (status 1)
**Issue status last changed:** 2019-04-18

**Bug ID:** DRU-48550bb9 (instance) / DRU-9ee9dcbd (pattern)
**URL:** http://localhost/
**XPath:** //div[@id="block-test-language-block" and @role="navigation"]
**Full DOM path:** /html/body//div[@id="block-test-language-block" and @role="navigation"]
**WCAG SC:** 4.1.2 - Name, Role, Value (Level A)
**Rule:** manual landmark-name check - landmark-name
**Severity:** Medium
**Frequency:** Pattern-level; language provider blocks rendered as navigation landmarks
**Screen type:** desktop | **Colour mode:** light

### HTML context (current output vs expected after fix)

```html
<!-- Current output (problematic): navigation landmark has no accessible name. -->
<div id="block-test-language-block" role="navigation" class="language-switcher-language-interface">
  ...
</div>
```

```html
<!-- Expected output after fix: navigation landmark has an accessible label. -->
<div id="block-test-language-block" role="navigation" aria-label="Language switcher" class="language-switcher-language-interface">
  ...
</div>
```

### What changed

- Added aria-label fallback when language block role is set to navigation in:
  - core/modules/language/src/Hook/LanguageThemeHooks.php
- Added functional regression assertion in:
  - core/modules/language/tests/src/Functional/LanguageSwitchingTest.php
  - confirms language switcher landmark includes an accessible name via aria-label

### Patch

- patches/a11y-DRUPAL-A11Y-013-issue-3049125-language-switcher-nav-label.patch

### Testing status

- Static checks and code review passed.
- Local runtime execution remains blocked in current environment due missing runnable php/phpunit path.

### Strict A/B validation evidence

- Baseline (patch removed):
  - aria-label fallback lines absent from `LanguageThemeHooks::preprocessBlock()`.
  - navigation landmark name assertion absent from `LanguageSwitchingTest::doTestHomePageLinks()`.
- Patched (patch applied):
  - aria-label fallback present in `LanguageThemeHooks::preprocessBlock()`.
  - navigation landmark name assertion present in `LanguageSwitchingTest::doTestHomePageLinks()`.
- Roundtrip integrity:
  - Patch reverse/apply cycle completed cleanly with no residual diff.

Current verdict for this issue:
- Code-level A/B evidence: confirmed.
- Runtime A/B evidence (baseline fail + patched pass): pending environment support.

### AI disclosure

This contribution was prepared with assistance from an AI coding tool.
- Tool: GitHub Copilot (GPT-5.3-Codex)
- Used for: patch drafting, regression test drafting, issue comment drafting
- Reviewed by: mgifford
- Skills loaded: drupal-accessibility (sub-skills: drupal-a11y-fapi, drupal-a11y-qa)

---

## Issue #2443815 - #description_display does not work for details descriptions

**Issue URL:** https://www.drupal.org/i/2443815
**Issue state (last checked 2026-07-14):** Needs work (status 13)
**Issue status last changed:** 2026-07-14

**Bug ID:** DRU-9a7895e1 (instance) / DRU-7df48324 (pattern)
**URL:** http://localhost/form-test/group-details, http://localhost/admin/config/people/accounts
**XPath:** //details[@id="edit-description-before"]//div[@id="edit-description-before--description"]
**Full DOM path:** /html/body//details[@id="edit-description-before"]/div[@id="edit-description-before--description"]
**WCAG SC:** 1.3.1 - Info and Relationships (Level A)
**Rule:** manual description-placement check - details-description-display
**Severity:** Medium
**Frequency:** Pattern-level; affects details elements with #description and #description_display across core and core themes
**Screen type:** desktop | **Colour mode:** light

### HTML context (current output vs expected after fix)

```html
<!-- Current output example: description position can ignore #description_display intent. -->
<details id="edit-description-before">
  <input id="edit-description-before-child" type="text" />
  <div id="edit-description-before--description">Description before the child.</div>
</details>
```

```html
<!-- Expected output after fix (description_display='before'): -->
<details id="edit-description-before">
  <div id="edit-description-before--description">Description before the child.</div>
  <input id="edit-description-before-child" type="text" />
</details>

<!-- Expected output after fix (description_display='after'): -->
<details id="edit-description-after">
  <input id="edit-description-after-child" type="text" />
  <div id="edit-description-after--description">Description after the child.</div>
</details>
```

### What changed

- Propagated details-specific description display configuration in:
  - core/lib/Drupal/Core/Form/FormPreprocess.php
- Updated details templates to respect before/after/invisible ordering in:
  - core/modules/system/templates/details.html.twig
  - core/themes/stable9/templates/form/details.html.twig
  - core/themes/starterkit_theme/templates/form/details.html.twig
  - core/profiles/demo_umami/themes/umami/templates/classy/form/details.html.twig
  - core/themes/olivero/templates/form/details.html.twig
  - core/themes/claro/templates/details.html.twig
  - core/themes/default_admin/templates/form/details.html.twig
- Added fixture and functional coverage in:
  - core/modules/system/tests/modules/form_test/src/Form/FormTestGroupDetailsForm.php
  - core/modules/system/tests/src/Functional/Form/ElementTest.php

### Patch

- patches/a11y-DRUPAL-A11Y-014-issue-2443815-details-description-display.patch

### Existing patch and thread context

- This issue has substantial historical patch context and should explicitly acknowledge prior community work:
  - 48 attached files and 50 comments in issue history.
  - Multiple historical patch/test-only iterations, including failed CI cycles and rerolls.
  - Thread records explicit baseline-vs-patched test reasoning and an earlier RTBC phase before the issue went stale.
- This current patch should be presented as a modernized, current-core refresh of that prior work, not a replacement without attribution.

### Comparison to old patch #107 and Ketr feedback

- Ketr's comment #16530075 highlighted four things: clearer issue summary steps to reproduce (pointing at #13), preprocess location updates, Default Admin theme updates, and likely change-record consideration.
- File-scope comparison (old `description_display-2443815-107.patch` vs current local patch):
  - Common files:
    - `core/modules/system/templates/details.html.twig`
    - `core/modules/system/tests/modules/form_test/src/Form/FormTestGroupDetailsForm.php`
  - Old-only (legacy architecture):
    - `core/includes/form.inc`
    - `core/lib/Drupal/Core/Render/Element/Details.php`
    - `core/modules/system/src/Tests/Form/ElementsLabelsTest.php`
    - `core/modules/system/tests/modules/form_test/src/Form/FormTestDescriptionForm.php`
    - `core/modules/system/tests/src/Functional/Form/ElementsDetailsTest.php`
    - `core/themes/classy/templates/form/details.html.twig`
    - `core/themes/stable/templates/form/details.html.twig`
  - Current-only (modern architecture/themes):
    - `core/lib/Drupal/Core/Form/FormPreprocess.php`
    - `core/modules/system/tests/src/Functional/Form/ElementTest.php`
    - `core/profiles/demo_umami/themes/umami/templates/classy/form/details.html.twig`
    - `core/themes/claro/templates/details.html.twig`
    - `core/themes/default_admin/templates/form/details.html.twig`
    - `core/themes/olivero/templates/form/details.html.twig`
    - `core/themes/stable9/templates/form/details.html.twig`
    - `core/themes/starterkit_theme/templates/form/details.html.twig`
- Behavioral difference to confirm in-thread:
  - Old patch #107 set details `#description_display` default to `before`.
  - Current patch fallback in preprocess is `after`.
  - This should be explicitly confirmed in review to avoid semantic drift.
- Reproduction matrix should explicitly include `/admin/config/people/accounts` in addition to `form-test/group-details`.

### Loose ends to call out in queue comment

- Clarify which historical concerns are now resolved by current implementation (description placement propagation + cross-theme template behavior).
- Ask reviewers to focus on stale historical patch noise vs current patch applicability to main.
- Note that runtime A/B remains pending in this environment, while code-level A/B and patch roundtrip are confirmed.
- Confirm whether a change record is required for any resulting behavior/default change.

### Testing status

- Static checks and code review passed.
- Local runtime execution remains blocked in current environment due missing runnable php/phpunit path.

### Strict A/B validation evidence

- Baseline (patch removed):
  - `FormPreprocess::preprocessDetails()` does not include details-specific fallback assignment for `description_display`.
  - `ElementTest::testDetailsDescriptionAttributes()` does not include assertion for `edit-description-before` ordering.
- Patched (patch applied):
  - `FormPreprocess::preprocessDetails()` includes `$variables['description_display'] = $element['#description_display'] ?? 'after';`.
  - `ElementTest::testDetailsDescriptionAttributes()` includes `edit-description-before` ordering assertion.
- Roundtrip integrity:
  - Patch reverse/apply cycle completed cleanly with no residual diff.

Current verdict for this issue:
- Code-level A/B evidence: confirmed.
- Runtime A/B evidence (baseline fail + patched pass): pending environment support.

### AI disclosure

This contribution was prepared with assistance from an AI coding tool.
- Tool: GitHub Copilot (GPT-5.3-Codex)
- Used for: patch drafting, regression test drafting, issue comment drafting
- Reviewed by: mgifford
- Skills loaded: drupal-accessibility (sub-skills: drupal-a11y-fapi, drupal-a11y-qa)

---

## Consolidated Existing Issues And Recommendations

This section replaces the duplicated "issue writeup + follow-up HTML + MR/test gap" blocks above with one canonical source of truth.

### Consolidated issue matrix

| Issue | Bug ID | Current state | MR state | Patch status | Single recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| #3573865 | DRU-3d2c0738 / DRU-93a3d129 | Needs review | MR !14777 open, conflict | Local patch + test ready | Rebase MR, keep semantic summary-role fix, add ElementTest assertion, remove phpstan baseline churn. |
| #3533586 | DRU-ce079269 / DRU-1aae3721 | RTBC | MR !16141 mergeable | Local patch + test ready | Keep markup fix and add UserLoginTest regression coverage before merge. |
| #3571628 | DRU-9da94f27 / DRU-e1099604 | Needs work | MR !14647 mergeable | Local patch + test ready | Keep aria-expanded sync, add FunctionalJavascript close/reopen assertions, and avoid reintroducing summary role. |
| #3049125 | DRU-48550bb9 / DRU-9ee9dcbd | Active | No active MR | Local patch + test ready | Post fresh MR with LanguageThemeHooks + LanguageSwitchingTest only (scope-clean landmark naming fix). |
| #2443815 | DRU-9a7895e1 / DRU-7df48324 | Needs work | No active MR | Local patch + test ready | Post fresh MR, keep cross-theme + test scope, and explicitly resolve default #description_display behavior. |
| #3587661 | TBD / TBD | Active | No active MR | Local patch + test ready | Post fresh MR with FileWidget display-checkbox fallback label + FileFieldDisplayTest assertion. |
| #3044440 | TBD / TBD | Active | No active MR | Local patch + test ready | Post fresh MR with Details default <code>#title</code> fallback + focused ElementTest coverage for omitted title path. |

### Consolidated recommendations (priority order)

1. Update active MRs to include missing regression tests before requesting final review (#3573865, #3533586, #3571628).
2. For issues without active MRs but with ready patches, post fresh scope-clean MRs (#3049125, #2443815, #3587661, #3044440).
3. For scan-only or legacy-scan issues still unverified on current-main, require a failing baseline before proposing implementation changes (for example #3587682).
4. Keep cross-issue semantic alignment for native details/summary behavior: do not reintroduce redundant summary roles while fixing aria-expanded sync.
5. Keep every issue comment scoped to one issue, one selector family, one primary recommendation to avoid queue noise.

### Consolidated test targets

- #3573865: core/modules/system/tests/src/Functional/Form/ElementTest.php and core/modules/views/tests/src/Functional/Plugin/StyleTableTest.php
- #3533586: core/modules/user/tests/src/Functional/UserLoginTest.php
- #3571628: core/tests/Drupal/FunctionalJavascriptTests/Core/Form/FormGroupingElementsTest.php
- #3049125: core/modules/language/tests/src/Functional/LanguageSwitchingTest.php
- #2443815: core/modules/system/tests/src/Functional/Form/ElementTest.php and core/modules/system/tests/modules/form_test/src/Form/FormTestGroupDetailsForm.php
- #3587661: core/modules/file/tests/src/Functional/FileFieldDisplayTest.php and core/modules/file/src/Plugin/Field/FieldWidget/FileWidget.php
- #3044440: core/modules/system/tests/src/Functional/Form/ElementTest.php and existing form_test details fixtures

### Canonical ready-to-post snippets for active existing issues

Use one snippet per issue. Do not post multiple variants for the same issue.

#### #3573865

```html
<p>Follow-up on MR !14777 for #3573865.</p>
<p><strong>Request before merge:</strong></p>
<ol>
  <li>Rebase on current main and keep the semantic fix in <code>FormPreprocess.php</code>.</li>
  <li>Keep <code>StyleTableTest.php</code> expectation updates.</li>
  <li>Add regression assertions in <code>ElementTest.php</code> for summary without redundant role.</li>
  <li>Drop unrelated <code>core/.phpstan-baseline.php</code> churn.</li>
</ol>
```

#### #3533586

```html
<p>Follow-up on MR !16141 for #3533586.</p>
<p><strong>Request before merge:</strong> keep the semantic markup change and add focused regression assertions in <code>core/modules/user/tests/src/Functional/UserLoginTest.php</code> so <code>Member for</code> is not rendered as heading markup.</p>
```

#### #3571628

```html
<p>Follow-up on MR !14647 for #3571628.</p>
<p><strong>Request before merge:</strong></p>
<ol>
  <li>Add FunctionalJavascript regression coverage in <code>core/tests/Drupal/FunctionalJavascriptTests/Core/Form/FormGroupingElementsTest.php</code> for close/reopen <code>aria-expanded</code> transitions.</li>
  <li>Preserve synchronized <code>aria-expanded</code> behavior without reintroducing <code>role="button"</code> on native <code>&lt;summary&gt;</code>.</li>
</ol>
```

#### #3049125

```html
<p>Follow-up on #3049125.</p>
<p><strong>Current status:</strong> no active public MR found in the latest pass.</p>
<p><strong>Request:</strong> post a fresh, scope-clean MR with landmark naming fallback in <code>LanguageThemeHooks.php</code> and matching regression coverage in <code>LanguageSwitchingTest.php</code>.</p>
```

#### #2443815

```html
<p>Follow-up on #2443815.</p>
<p><strong>Current status:</strong> no active public MR found in the latest pass.</p>
<p><strong>Request:</strong> post a fresh current-main MR with preprocess + cross-theme template + functional test coverage, and resolve in-thread the expected default when <code>#description_display</code> is not explicitly set.</p>
```

#### #3587661

```html
<p>Follow-up on #3587661.</p>
<p>I prepared a current-main reroll for the missing display checkbox label in the limited file widget variant.</p>

<p><strong>What changed</strong></p>
<ul>
  <li>Added a fallback accessible name on the display checkbox in <code>core/modules/file/src/Plugin/Field/FieldWidget/FileWidget.php</code> via <code>aria-label=&quot;Include file in display&quot;</code>.</li>
  <li>Added regression coverage in <code>core/modules/file/tests/src/Functional/FileFieldDisplayTest.php</code> asserting the rendered checkbox includes that aria-label.</li>
</ul>

<p><strong>Patch</strong></p>
<p><code>patches/a11y-DRUPAL-A11Y-015-issue-3587661-file-widget-display-checkbox-label.patch</code></p>

<p><strong>Request for review</strong></p>
<ol>
  <li>Confirm this fallback wording is acceptable for a translatable default accessible name.</li>
  <li>Confirm this narrow scope is preferred over broader widget markup changes.</li>
</ol>
```

#### #3044440

```html
<p>Follow-up on #3044440.</p>
<p>I prepared a current-main reroll aligned with the latest thread direction to remove jQuery UI dependence by ensuring a physical, focusable <code>&lt;summary&gt;</code> always exists for <code>#type = details</code>.</p>

<p><strong>What changed</strong></p>
<ul>
  <li>Set a translatable default title in <code>core/lib/Drupal/Core/Render/Element/Details.php</code>: <code>#title =&gt; $this-&gt;t('Details')</code>.</li>
  <li>Added a no-explicit-title fixture in <code>core/modules/system/tests/modules/form_test/src/Form/FormTestGroupDetailsForm.php</code> (<code>default_title</code> details element + child field).</li>
  <li>Added functional regression coverage in <code>core/modules/system/tests/src/Functional/Form/ElementTest.php</code> to assert:
    <ul>
      <li><code>//details[@id=&quot;edit-default-title&quot;]/summary[normalize-space()=&quot;Details&quot;]</code> exists, and</li>
      <li><code>aria-expanded=&quot;false&quot;</code> is present on first render.</li>
    </ul>
  </li>
</ul>

<p><strong>Patch</strong></p>
<p><code>patches/a11y-DRUPAL-A11Y-016-issue-3044440-details-default-title.patch</code></p>

<p><strong>Why this direction</strong></p>
<p>This keeps native <code>details/summary</code> semantics and avoids empty-title fallbacks that can suppress summary rendering in the DOM. It also matches the current post-jQuery-UI architecture direction discussed in comment #16692349.</p>

<p><strong>Request for review</strong></p>
<ol>
  <li>Confirm the default string <code>Details</code> is acceptable for core fallback semantics/translatability.</li>
  <li>Confirm this scope (element default + focused functional coverage) is sufficient for this issue.</li>
</ol>
```

---

## Posting A Patch To Drupal.org (Detailed + Short)

This project file is for drafting. For Drupal.org issue work, prefer branch + MR over manually editing large comments.

### Detailed workflow

1. Open the target issue and create/use an issue fork from the Drupal.org issue UI.
2. Copy the exact `git remote add` command from the issue fork panel (avoids remote-name/path mistakes).
3. Create a clean branch for one issue only:
  - `git checkout main`
  - `git pull --ff-only origin main`
  - `git checkout -b issue-<nid>-<short-topic>`
4. Apply or refresh changes locally:
  - if using an existing patch file: `git apply patches/<patch-file>.patch`
  - or edit files directly, then run targeted checks/tests.
5. Commit with issue reference:
  - `git add <changed-files>`
  - `git commit -m "Issue #<nid>: <short summary>"`
6. Push to the issue fork remote/branch shown in the issue UI.
7. Create merge request to `project/drupal` from that pushed branch.
8. In the issue comment, include:
  - what changed (file list summary)
  - reproduction steps (IS), including real route(s) and test route(s)
  - test evidence (manual + automated)
  - comparison vs latest patch/MR if one exists.

### Short workflow

1. Create issue fork.
2. Branch from current main.
3. Apply patch or make fix + tests.
4. Commit and push to issue fork.
5. Open MR and post a concise issue comment with IS + test results.

### Practical note for this repo

- Keep full drafting context in this file.
- Post a concise HTML comment in the queue, linking to MR and the key comparison points.

## Per-Issue Reset Workflow (to avoid patch carry-over)

Use this between issue investigations so each patch is generated from clean repo state.

1. Confirm and record current branch and HEAD:
   - git branch --show-current
   - git rev-parse --short HEAD

2. Stash any WIP before switching issue context:
   - git stash push -u -m "wip/<issue-id>"

3. Return to clean baseline before starting next issue:
   - git reset --hard HEAD
   - git clean -fd

4. Optionally sync baseline with upstream main before new issue work:
   - git fetch upstream
   - git merge --ff-only upstream/main

5. Start one issue at a time; create one focused patch file per issue.

6. After creating the patch, validate scope:
   - git diff --name-only
   - ensure files belong only to the active issue

7. Generate/refresh issue-specific patch artifact and comment draft.

---

## Non-Reproducible Issue Measurement Rubric

When a drupal.org accessibility issue cannot be reproduced, record outcome as evidence states instead of forcing a binary fixed/not-fixed claim.

1. Reproduction confidence
  - High: reproduced on clean current main.
  - Medium: reproduced only under a specific matrix.
  - Low: not reproduced after matrix attempts.

2. Matrix required in notes
  - URL/route and content state
  - Theme (default/admin)
  - Browser + AT pair
  - Viewport (desktop/mobile)
  - Color mode and high-contrast state

3. Outcome classification
  - `fixed`: baseline reproduces; patched no longer reproduces.
  - `regression`: baseline passes; patched fails.
  - `inconclusive`: baseline not reproduced (`no-baseline-instances-observed`).
  - `invalid-patch`: does not apply, target missing, or patch corrupt.

4. Queue handling guidance
  - Keep open with replication request when confidence is low.
  - Mark `needs info` when reporter matrix is missing.
  - Close `cannot reproduce` only after documented matrix attempts on current main.

---

## Ready-To-Post: Existing Queue Issues (Additional)

Merged into "Consolidated Existing Issues And Recommendations" above.
Use the canonical snippets in that section for #3587661 and #3044440.

---

## Ready-To-Post: Legacy Reports Targeted Follow-Ups

These are targeted queue comments based on older patch evaluations and older reports, aimed at unblocking current work instead of filing duplicate issues.

### Target: #3587682 - Empty Table Header in Select some other countries

```html
<p>Follow-up on #3587682 after re-checking current-main local evidence.</p>

<p><strong>Current finding:</strong> I could not reproduce <code>empty-table-header</code> on <code>/autocomplete</code> in the latest scan artifacts in this repository.</p>

<p><strong>Evidence from current artifacts:</strong></p>
<ul>
  <li><code>reports/axe-results/latest/shards/chunk-*.json</code> shows <code>/autocomplete</code> violations only for <code>color-contrast</code> (no <code>empty-table-header</code> entries).</li>
  <li>Current <code>empty-table-header</code> hits are on <code>/table</code>, selector <code>#edit-table-empty &gt; thead &gt; tr &gt; .select-all</code>.</li>
  <li>The <code>/autocomplete</code> "Select some other countries" output is built via <code>field_multiple_value_form</code> with non-empty header content in current core preprocess/theme paths.</li>
</ul>

<p><strong>Proposed next step:</strong> either update this issue with a current reproducible baseline for <code>/autocomplete</code> (route, theme, viewport, exact selector), or reclassify/close as non-reproducible and track the current <code>/table</code> empty-header case separately.</p>
```

Short paste variant:

```html
<p>Follow-up on #3587682: I could not reproduce <code>empty-table-header</code> on <code>/autocomplete</code> from current-main artifacts in this repo.</p>
<p>Current <code>empty-table-header</code> evidence points to <code>/table</code> (selector <code>#edit-table-empty &gt; thead &gt; tr &gt; .select-all</code>), while <code>/autocomplete</code> currently reports <code>color-contrast</code> only.</p>
<p>Request: either provide an updated reproducible <code>/autocomplete</code> baseline (theme + viewport + selector), or reclassify this issue as non-reproducible and track the current <code>/table</code> case separately.</p>
```

### Target: #3015239 - Assess Drupal core for WCAG success criterion 2.5.3 Label in Name

```html
<p>Follow-up on #3015239 with an incremental, per-component approach instead of a broad one-shot patch.</p>

<p><strong>Slice 1 (Filter component) is now scoped and test-backed:</strong></p>
<ul>
  <li><strong>Reproducible control:</strong> <code>/admin/config/content/formats</code>, Configure action link for a format row (visible text: <code>Configure</code>).</li>
  <li><strong>Issue:</strong> visible text and accessible name diverged (<code>Configure</code> vs <code>Edit &lt;format&gt;</code>).</li>
  <li><strong>Fix:</strong> align aria-label with visible action text in <code>FilterFormatListBuilder::getDefaultOperations()</code>.</li>
  <li><strong>Regression test:</strong> assert aria-label equals <code>Configure Filter test</code> in <code>FilterAdminTest::testFilterEnableAndDisable()</code>.</li>
  <li><strong>Patch artifact:</strong> <code>patches/a11y-LABEL-IN-NAME-004-filter-format-aria-label.patch</code>.</li>
</ul>

<p><strong>Proposed workflow under #3015239:</strong></p>
<ol>
  <li>One reproducible control per component (Filter, Node, Media, etc.).</li>
  <li>Land a minimal fix + one focused regression test per slice.</li>
  <li>Repeat, linking each slice back to #3015239 for umbrella tracking.</li>
</ol>

<p>This keeps review scope tight, avoids risky broad rewrites, and provides measurable progress per component.</p>
```

### Target: #3587678 - Ensure landmarks are unique - Status Messages

```html
<p>De-prioritized for now: this item will be addressed as part of the Gin / Default Admin Theme update track.</p>
<p>No separate patch is planned in this queue pass.</p>
```

### Target: #3509700 / #3583486 - Toolbar and default_admin landmark structure

```html
<p>Deferred for now: this item depends on upstream issue work and is being tracked through upstream-first updates.</p>
<p>No local patch is planned in this queue pass.</p>
```

### Legacy triage rule of thumb

- If old evaluation says <code>patch-file-corrupt</code> or <code>patch-does-not-apply</code>: treat as patch hygiene debt, not invalid accessibility evidence.
- If old evaluation says <code>no-baseline-instances-observed</code>: refresh reproduction matrix first (route/theme/state), then decide whether to close as inconclusive or proceed with a current-main patch.
- Prefer posting to an active related issue with concrete updated evidence before filing net-new duplicates.

### Old Queue Revive Comments (Created-Asc Candidates)

Use these to nudge long-open issues with concrete next actions.

#### Target: #2318757 - Make position of #description configurable via the API for form field widgets

```html
<p>Follow-up on #2318757 with a focused patch candidate for multi-value field widgets.</p>

<p><strong>Problem confirmed:</strong> in <code>field_multiple_value_form</code>, description output is effectively fixed after the table and does not consistently honor <code>#description_display</code> for before/after placement.</p>

<p><strong>Patch scope (small + test-backed):</strong></p>
<ul>
  <li>Add <code>#description_display</code> support in <code>FieldPreprocess::preprocessFieldMultipleValueForm()</code>.</li>
  <li>Update field-multiple templates (system + stable9 + starterkit + olivero + claro + default_admin) to render description before/after based on <code>description_display</code>.</li>
  <li>Add functional regression coverage in <code>MultipleWidgetFormTest</code> for default-after and configured-before behavior.</li>
  <li>Use field_test widget alter hook in tests to set <code>#description_display = 'before'</code> on the widget wrapper.</li>
</ul>

<p><strong>Patch artifact:</strong> <code>patches/a11y-DRUPAL-A11Y-017-issue-2318757-multiple-widget-description-display.patch</code></p>

<p><strong>Proposed review plan:</strong></p>
<ol>
  <li>Review preprocess and template ordering changes first (API behavior).</li>
  <li>Review functional test assertions second (before vs after output order).</li>
  <li>If accepted, follow up with optional additional component-specific tests in separate slices.</li>
</ol>
```

#### Target: #2547063 - Remove the aria-describedby introduced in FAPI if there is no description

```html
<p>Revive note: this issue is a useful guardrail for avoiding stale/empty accessibility relationships.</p>

<p><strong>Suggested next step:</strong> add/refresh a focused test that asserts no <code>aria-describedby</code> is emitted when description output is absent, including details-based elements after preprocess/template changes.</p>

<p><strong>Why now:</strong> current details description placement work increases the importance of keeping described-by wiring strict and non-redundant.</p>
```

#### Target: #2608180 - View Search Filter's Label isn't Associated with Input

```html
<p>Revive note: this remains a high-value form-label association issue in Views UI.</p>

<p><strong>Suggested next step:</strong> post a fresh baseline on current main with one failing selector/path example and attach a minimal fix plus regression assertion for label/input association.</p>

<p><strong>Why now:</strong> older label-focused patch evaluations in this repo were often inconclusive due to baseline/preflight conditions, not because the accessibility requirement was resolved.</p>
```

#### Target: #2848307 - Inline errors not working on form table elements

```html
<p>Revive note: this issue aligns with current message/landmark and error-announcement accessibility themes.</p>

<p><strong>Suggested next step:</strong> update IS with one reproducible table-element error path and verify announcement/association behavior with both visual inline errors and assistive-technology output.</p>

<p><strong>Why now:</strong> this can likely be advanced with a narrow, test-backed fix without waiting on broader form-system refactors.</p>
```

#### Target: #1096124 - Compose tips tables need better use of ids and summary elements

```html
<p>Revive note: this is old but still relevant to table semantics and assistive context quality.</p>

<p><strong>Suggested next step:</strong> provide a current-main DOM snapshot for compose tips markup and identify whether remaining gaps are header associations, table naming, or deprecated-summary usage, then scope a modernized fix.</p>

<p><strong>Why now:</strong> this complements recent table/header accessibility work and can benefit from updated semantic guidance rather than legacy table-summary patterns.</p>
```

---

## Ready-To-Post: New Bug Candidates From Scan Evidence

These are structured draft comments you can adapt into new issue filings, based on the current pattern report and bug export artifacts.

### New Candidate A - DRU-58ED44E2 (color-contrast, label[for="edit-preferred-theme"])

I found a reproducible contrast issue in scan evidence that appears suitable for a new core accessibility issue.

**Pattern ID:** DRU-58ED44E2  
**Rule:** `color-contrast`  
**WCAG:** 1.4.3 (AA)  
**Impact:** serious  
**Selector:** `label[for="edit-preferred-theme"]`  
**Sample paths:** `/admin/config/system/site-information`, `/admin/modules`, `/admin/people`  

Sample snippet:

```html
<label for="edit-preferred-theme" class="form-item__label">Preferred theme</label>
```

Request for issue triage:
1. Validate contrast with an explicit matrix across color mode and directionality:
  - Light mode and dark mode
  - Admin accent variants
  - Forced-colors/high contrast mode
  - LTR and RTL interfaces
2. Confirm WCAG thresholds are met in each matrix row:
  - 4.5:1 for label text against immediate background
  - 3:1 for focus indicators against adjacent colors
3. Fix token/variable source rather than one-off CSS overrides.
4. Add regression coverage for affected selectors in light/dark and in both LTR/RTL rendering.

### New Candidate B - DRU-6CBB7080 (color-contrast, admin toolbar burger label)

I found a serious color-contrast issue on the admin toolbar burger-label text in scan evidence.

**Pattern ID:** DRU-6CBB7080  
**Rule:** `color-contrast`  
**WCAG:** 1.4.3 (AA)  
**Impact:** serious  
**Selector:** `.toolbar-button--icon--burger > .toolbar-button__label[data-toolbar-text=""]`  
**Sample snippet:**

```html
<span class="toolbar-button__label" data-toolbar-text="">Expand sidebar</span>
```

Request for issue triage:
1. Validate contrast with an explicit matrix, not a single screenshot:
  - Light mode (default admin palette)
  - Dark mode
  - Accent variants used in admin theming tools
  - Forced-colors/high contrast mode
2. Verify state-level behavior for the same selector in each mode:
  - default
  - hover
  - focus-visible
  - active/expanded
  - responsive collapsed toolbar
3. Run the same mode/state matrix in both LTR and RTL interfaces so mirrored toolbar layouts are covered.
4. Enforce WCAG thresholds in each mode/state:
  - 4.5:1 for toolbar label text against its immediate background
  - 3:1 for focus indicators against adjacent colors
5. Implement the fix at shared toolbar token level (not per-route overrides), and avoid hard-coded absolute colors that break in alternate modes.
6. Add regression coverage that checks this selector in light/dark plus at least one accent variant, includes forced-colors fallback assertions, and runs in both LTR and RTL.

### New Candidate C - DRU-D377125E (link-in-text-block in limited file widget)

I found a reproducible link distinguishability issue in the limited-file widget view.

**Pattern ID:** DRU-D377125E  
**Rule:** `link-in-text-block`  
**WCAG:** 1.4.1 (A)  
**Impact:** serious  
**Selector:** `#edit-imagefile-file-limited-dis-N > .form-managed-file__main > .file.file--mime-text-plain.file--text > .menu-item__link[type="text/plain"]`  
**Path:** `/contact/imagefile_file`  

Sample snippet:

```html
<a href="/sites/default/files/README.txt" type="text/plain" class="menu-item__link">README.txt</a>
```

Request for issue triage:
1. Ensure link styling is distinguishable from surrounding text without relying on color only.
2. Validate in the same file-widget variants where disabled/meta states are present.
3. Add focused CSS regression coverage.

### New Candidate D - DRU-05EC5EAB (color-contrast, hidden region message)

I found a serious color-contrast issue on hidden-region placeholder table text.

**Pattern ID:** DRU-05EC5EAB  
**Rule:** `color-contrast`  
**WCAG:** 1.4.3 (AA)  
**Impact:** serious  
**Selector:** `.region-hidden-message > td[colspan="9"]`  
**Path:** `/admin/structure/types/manage/test_type/display/default`  

Sample snippet:

```html
<td colspan="9">No field is hidden.</td>
```

Request for issue triage:
1. Verify contrast in both default and admin themes.
2. Fix via design token(s) where possible.
3. Confirm no regressions in table readability.

### New Candidate E - DRU-5867174A (target-size, tabledrag handle)

I found a serious touch-target size issue in tabledrag handles.

**Pattern ID:** DRU-5867174A  
**Rule:** `target-size`  
**WCAG:** 2.5.8 (AA)  
**Impact:** serious  
**Selector:** `tr[data-drupal-selector="edit-terms-tid10"] > .tabledrag-cell > .tabledrag-cell-content.js-tabledrag-cell-content > .tabledrag-cell-content__item > .tabledrag-handle[href="#"][title="Move in any direction"]`  
**Path:** `/tabledrag`  

Sample snippet:

```html
<a href="#" title="Move in any direction" class="tabledrag-handle"><div class="handle"></div></a>
```

Request for issue triage:
1. Confirm minimum target dimensions and spacing across pointer modalities.
2. Validate keyboard + pointer parity for drag affordances.
3. Add regression checks for mobile viewport behavior.

---

## Scan Wave 2 Priority Queue (2026-07-14)

This section captures additional high-value targets from the latest ranking pass, excluding pattern IDs already drafted above.

### Likely New Issues To File Next

1. DRU-D62C6EC9
  - rule: color-contrast
  - impact: serious
  - wcag: 1.4.3 AA
  - selector: #edit-submit
  - prevalence: 34 concrete paths

2. DRU-5CF2AC9D
  - rule: color-contrast
  - impact: serious
  - wcag: 1.4.3 AA
  - selector: .toolbar-button--icon--theming-tools-dashboard > .toolbar-button__label[data-toolbar-text=""]
  - prevalence: 29 concrete paths

3. DRU-850DCDEB
  - rule: color-contrast
  - impact: serious
  - wcag: 1.4.3 AA
  - selector: label
  - prevalence: 11 concrete paths

4. DRU-1296E451
  - rule: color-contrast
  - impact: serious
  - wcag: 1.4.3 AA
  - selector: .button--action
  - prevalence: 5 concrete paths

5. DRU-09E68687
  - rule: color-contrast
  - impact: serious
  - wcag: 1.4.3 AA
  - selector: .toolbar-button--icon--system-admin-structure > .toolbar-button__label[data-toolbar-text=""]
  - prevalence: 4 concrete paths

6. DRU-C173AC22
  - rule: color-contrast
  - impact: serious
  - wcag: 1.4.3 AA
  - selector: .toolbar-button--icon--navigation-create > .toolbar-button__label[data-toolbar-text=""]
  - prevalence: 3 concrete paths

7. DRU-EE5E2CD9
  - rule: color-contrast
  - impact: serious
  - wcag: 1.4.3 AA
  - selector: .toolbar-button--icon--system-admin-config > .toolbar-button__label[data-toolbar-text=""]
  - prevalence: 3 concrete paths

8. DRU-33BE632E
  - rule: target-size
  - impact: serious
  - wcag: 2.5.8 AA
  - selector: #edit-terms-tid10-term
  - prevalence: 1 concrete path (high interaction risk)

### Likely Existing Issues (Post Follow-Up Comments, Not New Filing)

1. DRU-D8FCA413
  - rule: region
  - impact: moderate
  - section in reconciliation: likely already filed
  - observed commonality in scan evidence:
    - selector: `#primary-tabs-title`
    - sample markup: `<h2 id="primary-tabs-title" class="visually-hidden">Primary tabs</h2>`
    - prevalence: 24 routes (admin + form test routes)
    - pattern signal: local task/tab heading appears outside expected landmark containment on affected pages
  - candidate Drupal issue IDs from reconciliation (manual confirm):
    - #3049125 - https://www.drupal.org/i/3049125
    - #3568283 - https://www.drupal.org/i/3568283
    - #3344778 - https://www.drupal.org/i/3344778
  - best target recommendation:
    - No clean one-to-one open issue match in this candidate set.
    - Preferred: file as net-new issue scoped to `#primary-tabs-title` landmark containment, then cross-link #3049125 and #3568283 for related context.
    - If posting to an existing issue first, use #3049125 as the nearest landmark-structure thread, but call out scope mismatch clearly.

2. DRU-6488726D
  - rule: region
  - impact: moderate
  - section in reconciliation: likely already filed
  - observed commonality in scan evidence:
    - selector: `.top-bar__actions`
    - sample markup: `<div class="top-bar__actions">`
    - prevalence: 5 routes (admin content/config/taxonomy/type listing pages)
    - pattern signal: top-bar action container is outside expected landmark containment on affected pages
  - candidate Drupal issue IDs from reconciliation (manual confirm):
    - #3568283 - https://www.drupal.org/i/3568283
    - #3105316 - https://www.drupal.org/i/3105316
    - #3344778 - https://www.drupal.org/i/3344778
  - best target recommendation:
    - #3105316 is the closest thematic match but appears closed, so it is better as historical reference than active target.
    - Preferred: file as net-new issue scoped to `.top-bar__actions` landmark containment and cross-link #3105316 + #3568283.

### Posting Guidance

- For the first posting batch today, prioritize 3 high-prevalence serious issues from the list above.
- Use the existing issue comments section first when an issue already exists; only file net-new issues for items in the likely-new list.
- Keep each issue narrowly scoped to one pattern ID and one primary selector key.
- For any color-contrast filing, include a minimum validation matrix of: light, dark, accent variant, forced-colors, and both LTR/RTL directionality.

### Reusable Color-Contrast Filing Template (Light/Dark + LTR/RTL)

Use this block when posting any new color-contrast issue comment.

```html
<p>I found a reproducible color-contrast issue in Drupal core.</p>

<p><strong>Pattern ID:</strong> [PATTERN_ID]<br>
<strong>Rule:</strong> color-contrast<br>
<strong>WCAG:</strong> 1.4.3 (AA)<br>
<strong>Impact:</strong> [serious/moderate]<br>
<strong>Selector:</strong> [SELECTOR]<br>
<strong>Representative route:</strong> [ROUTE]</p>

<p><strong>Request for triage/review:</strong></p>
<ol>
  <li>Validate with an explicit matrix: light mode, dark mode, admin accent variants, forced-colors/high contrast mode, and both LTR/RTL directionality.</li>
  <li>Check state-level behavior in each matrix row: default, hover, focus-visible, active/expanded, and responsive/collapsed state where applicable.</li>
  <li>Confirm WCAG thresholds in each row: 4.5:1 for text contrast and 3:1 for focus indicators.</li>
  <li>Apply a shared token-level fix (avoid per-route overrides and hard-coded absolute colors).</li>
  <li>Add regression coverage that includes light/dark and both LTR/RTL; include forced-colors fallback verification.</li>
</ol>
```

Suggested evidence table to include in issue comments:

| Mode | Direction | Viewport | State | Selector | Ratio | Pass/Fail |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Light | LTR | Desktop | Default | [selector] | [x:1] | [pass/fail] |
| Light | LTR | Tablet portrait | Default | [selector] | [x:1] | [pass/fail] |
| Light | LTR | Tablet landscape | Default | [selector] | [x:1] | [pass/fail] |
| Light | LTR | Mobile portrait | Default | [selector] | [x:1] | [pass/fail] |
| Light | LTR | Mobile landscape | Default | [selector] | [x:1] | [pass/fail] |
| Dark | RTL | Desktop | Default | [selector] | [x:1] | [pass/fail] |
| Forced-colors | LTR/RTL | Desktop | Focus-visible | [selector] | [n/a or x:1] | [pass/fail] |

### Playwright Checklist (Color Modes + Directionality)

Use this checklist to generate repeatable evidence for color-contrast issue comments.

Starter spec in this repository:

- `core/tests/playwright/tests/a11y-color-contrast-matrix.spec.ts`
- Writes JSON evidence to `core/tests/playwright/reports/color-contrast-matrix/`
- Auto-generates a paste-ready comment artifact (`-comment.txt`) beside each JSON report
- Runs viewport matrix by default: desktop, tablet portrait, tablet landscape, mobile portrait, mobile landscape

Run example:

```bash
cd core/tests/playwright
MATRIX_TARGET_PATH=/admin/config/system/site-information \
MATRIX_TARGET_SELECTOR='label[for="edit-preferred-theme"]' \
MATRIX_RTL_LANG=he \
npx playwright test tests/a11y-color-contrast-matrix.spec.ts
```

Optional viewport subset:

```bash
MATRIX_VIEWPORT_SET=mobile npx playwright test tests/a11y-color-contrast-matrix.spec.ts
```

Optional forced-colors rows:

```bash
MATRIX_FORCE_COLORS=1 npx playwright test tests/a11y-color-contrast-matrix.spec.ts
```

Generate a paste-ready evidence table from the latest matrix JSON:

```bash
cd core
yarn a11y:matrix-comment
```

Generate a compact Drupal.org HTML snippet:

```bash
cd core
yarn a11y:matrix-comment:drupal
```

Optional explicit input/output:

```bash
node tests/playwright/scripts/generate-color-contrast-matrix-comment.js \
  --input tests/playwright/reports/color-contrast-matrix/<report>.json \
  --format drupal-html \
  --output tests/playwright/reports/color-contrast-matrix/<report>-comment.txt
```

1. Select one representative route and one primary selector.
2. Run in light mode and dark mode with automated color-contrast checks.
3. Run each mode in LTR and RTL contexts.
4. Run each mode/direction across viewport matrix: desktop, tablet portrait, tablet landscape, mobile portrait, mobile landscape.
5. Record default and focus-visible state evidence at minimum.
6. Run at least one admin accent variant.
7. Validate forced-colors/high contrast mode in a dedicated environment and record pass/fail.

Playwright execution outline:

```text
- For each mode in [light, dark]
  - Set color scheme
  - For each direction in [ltr, rtl]
    - For each viewport in [desktop, tablet portrait, tablet landscape, mobile portrait, mobile landscape]
      - Load route in target direction context
      - Trigger default and focus-visible states
      - Run axe color-contrast checks for the selector context
      - Capture ratio/pass output and screenshot
- Run accent variant pass with same matrix rows
- Run forced-colors/high contrast pass and attach evidence
```

Notes:

- If forced-colors cannot be fully emulated in the local browser runner, run this check on a dedicated Windows high-contrast environment and attach screenshot + DOM evidence.
- Keep issue comments scoped to one selector family and one primary recommendation.

### Fully Drafted HTML Filings (Top 3)

Use these as paste-ready HTML bodies for new drupal.org issue filing comments.

#### DRU-D62C6EC9 - color-contrast on #edit-submit

Suggested issue title:
- Admin submit button text contrast fails WCAG 2.2 AA on multiple admin routes

Manual search reference:
- https://www.drupal.org/project/issues/search?text=color-contrast%20edit-submit&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

```html
<p>I found a reproducible color-contrast issue in Drupal core admin UI affecting submit buttons.</p>

<p><strong>Pattern ID:</strong> DRU-D62C6EC9<br>
<strong>Rule:</strong> color-contrast<br>
<strong>WCAG:</strong> 1.4.3 (AA)<br>
<strong>Impact:</strong> serious<br>
<strong>Selector:</strong> #edit-submit<br>
<strong>Prevalence:</strong> 34 affected routes in current crawl</p>

<p><strong>Representative routes:</strong></p>
<ul>
  <li>/admin/appearance</li>
  <li>/admin/config/content/formats</li>
  <li>/admin/config/system/site-information</li>
  <li>/admin/content</li>
  <li>/admin/modules</li>
  <li>/admin/people</li>
  <li>/admin/structure/block</li>
  <li>/admin/structure/taxonomy</li>
</ul>

<p><strong>Sample failing markup:</strong></p>
<pre><code>&lt;input data-drupal-selector="edit-submit" type="submit" id="edit-submit" name="op" value="Save configuration" class="button button--primary js-form-submit form-submit"&gt;</code></pre>

<p><strong>Request for triage/review:</strong></p>
<ol>
  <li>Validate with an explicit matrix: light mode, dark mode, admin accent variants, forced-colors/high contrast mode, and both LTR/RTL directionality.</li>
  <li>Confirm WCAG thresholds in each matrix row: 4.5:1 for text and 3:1 for focus indicators.</li>
  <li>Fix through shared design token/variable updates rather than per-route overrides.</li>
  <li>Add regression coverage to prevent reintroduction across admin forms using <code>#edit-submit</code>, including LTR and RTL runs.</li>
</ol>
```

#### DRU-5CF2AC9D - color-contrast on admin toolbar Theming Tools label

Suggested issue title:
- Admin toolbar "Theming Tools" label contrast fails WCAG 2.2 AA across routes

Manual search reference:
- https://www.drupal.org/project/issues/search?text=color-contrast%20toolbar%20(admin%20theme)%20toolbar-button--icon--theming-tools-dashboard&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

```html
<p>I found a reproducible color-contrast issue affecting the admin toolbar label text for Theming Tools.</p>

<p><strong>Pattern ID:</strong> DRU-5CF2AC9D<br>
<strong>Rule:</strong> color-contrast<br>
<strong>WCAG:</strong> 1.4.3 (AA)<br>
<strong>Impact:</strong> serious<br>
<strong>Selector:</strong> .toolbar-button--icon--theming-tools-dashboard &gt; .toolbar-button__label[data-toolbar-text=""]<br>
<strong>Prevalence:</strong> 29 affected routes in current crawl</p>

<p><strong>Representative routes:</strong></p>
<ul>
  <li>/admin/appearance</li>
  <li>/admin/config/system/site-information</li>
  <li>/admin/content</li>
  <li>/admin/structure/types/manage/test_type/display/default</li>
  <li>/autocomplete</li>
  <li>/buttons</li>
  <li>/cd-navigation/config</li>
  <li>/contact/checkbox_radio</li>
</ul>

<p><strong>Sample failing markup:</strong></p>
<pre><code>&lt;span class="toolbar-button__label" data-toolbar-text=""&gt;Theming Tools&lt;/span&gt;</code></pre>

<p><strong>Request for triage/review:</strong></p>
<ol>
  <li>Validate with an explicit matrix: light mode, dark mode, admin accent variants, and forced-colors/high contrast mode.</li>
  <li>Run the same mode/state matrix in both LTR and RTL interfaces so mirrored toolbar layouts are covered.</li>
  <li>Check state-level contrast for this selector in each mode: default, hover, focus-visible, active/expanded, and responsive collapsed toolbar.</li>
  <li>Confirm WCAG thresholds are met in each case: 4.5:1 for label text and 3:1 for focus indicators.</li>
  <li>Apply a shared toolbar token-level fix (avoid route-specific overrides and hard-coded absolute colors that fail in alternate modes).</li>
  <li>Add regression coverage for this selector across light/dark plus at least one accent variant, with forced-colors fallback assertions and LTR/RTL coverage.</li>
</ol>
```

#### DRU-850DCDEB - color-contrast on form label text

Suggested issue title:
- Form label text contrast fails WCAG 2.2 AA on multiple admin/navigation routes

Manual search reference:
- https://www.drupal.org/project/issues/search?text=color-contrast%20label&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

```html
<p>I found a reproducible color-contrast issue affecting form label text in core admin/navigation pages.</p>

<p><strong>Pattern ID:</strong> DRU-850DCDEB<br>
<strong>Rule:</strong> color-contrast<br>
<strong>WCAG:</strong> 1.4.3 (AA)<br>
<strong>Impact:</strong> serious<br>
<strong>Selector:</strong> label<br>
<strong>Prevalence:</strong> 11 affected routes in current crawl</p>

<p><strong>Representative routes:</strong></p>
<ul>
  <li>/admin</li>
  <li>/admin/config</li>
  <li>/admin/reports</li>
  <li>/admin/structure</li>
  <li>/admin/structure/types</li>
  <li>/cd-navigation/config</li>
  <li>/dialog</li>
  <li>/tabs/format/plain_text</li>
</ul>

<p><strong>Sample failing markup:</strong></p>
<pre><code>&lt;label for="edit-preferred-theme" class="form-item__label"&gt;Preferred theme&lt;/label&gt;</code></pre>

<p><strong>Request for triage/review:</strong></p>
<ol>
  <li>Validate with an explicit matrix: light mode, dark mode, admin accent variants, forced-colors/high contrast mode, and both LTR/RTL directionality.</li>
  <li>Confirm label text contrast failures (or pass values) against current background tokens in each matrix row.</li>
  <li>Fix via shared label/form token variables to avoid one-off selector overrides.</li>
  <li>Add a regression check for label contrast in both default and admin themes, with LTR and RTL coverage.</li>
</ol>
```

### Fully Drafted HTML Filings (Landmark/Region Candidates)

Use these as paste-ready HTML bodies for new drupal.org issue filing comments when a clean one-to-one existing issue does not match scope.

#### DRU-D8FCA413 - region on local task tabs heading containment

Suggested issue title:
- Primary tabs heading is outside landmark containment on multiple admin and form routes

Related issues to cross-link (context, not exact scope):
- https://www.drupal.org/i/3049125
- https://www.drupal.org/i/3568283
- https://www.drupal.org/i/3344778

```html
<p>I found a reproducible landmark-containment issue affecting local task tabs markup in Drupal core pages.</p>

<p><strong>Pattern ID:</strong> DRU-D8FCA413<br>
<strong>Rule:</strong> region<br>
<strong>WCAG:</strong> 1.3.1 (A), 2.4.1 (A)<br>
<strong>Impact:</strong> moderate<br>
<strong>Selector:</strong> #primary-tabs-title<br>
<strong>Prevalence:</strong> 24 affected routes in current crawl</p>

<p><strong>Observed common markup:</strong></p>
<pre><code>&lt;h2 id="primary-tabs-title" class="visually-hidden"&gt;Primary tabs&lt;/h2&gt;</code></pre>

<p><strong>Representative routes:</strong></p>
<ul>
  <li>/admin</li>
  <li>/admin/appearance</li>
  <li>/admin/content</li>
  <li>/admin/modules</li>
  <li>/admin/people</li>
  <li>/admin/structure/types</li>
  <li>/contact/checkbox_radio</li>
  <li>/contact/imagefile_file</li>
</ul>

<p><strong>Scope clarification:</strong> this is not primarily an aria-live behavior issue. The repeated pattern is landmark containment around local tab/task heading structure.</p>

<p><strong>Request for triage/review:</strong></p>
<ol>
  <li>Confirm whether the local task heading output is consistently inside an expected landmark region across affected routes.</li>
  <li>Identify the canonical template/render path for this heading and apply a single structural fix at that level.</li>
  <li>Add regression coverage that asserts landmark containment for local tabs in representative admin and form routes.</li>
</ol>

<p><strong>Related context:</strong> This issue is adjacent to landmark and region discussions in existing queue threads, but appears to be a distinct structural case and may be best tracked separately with cross-links.</p>
```

#### DRU-6488726D - region on top bar actions containment

Suggested issue title:
- Top bar actions container appears outside landmark containment on admin listing pages

Related issues to cross-link (context, not exact scope):
- https://www.drupal.org/i/3105316
- https://www.drupal.org/i/3568283
- https://www.drupal.org/i/3344778

```html
<p>I found a reproducible landmark-containment issue affecting top bar actions containers on admin listing pages.</p>

<p><strong>Pattern ID:</strong> DRU-6488726D<br>
<strong>Rule:</strong> region<br>
<strong>WCAG:</strong> 1.3.1 (A), 2.4.1 (A)<br>
<strong>Impact:</strong> moderate<br>
<strong>Selector:</strong> .top-bar__actions<br>
<strong>Prevalence:</strong> 5 affected routes in current crawl</p>

<p><strong>Observed common markup:</strong></p>
<pre><code>&lt;div class="top-bar__actions"&gt;</code></pre>

<p><strong>Affected routes:</strong></p>
<ul>
  <li>/admin/config/content/formats</li>
  <li>/admin/content</li>
  <li>/admin/people</li>
  <li>/admin/structure/taxonomy</li>
  <li>/admin/structure/types</li>
</ul>

<p><strong>Request for triage/review:</strong></p>
<ol>
  <li>Confirm that the top bar actions wrapper is within an expected landmark region on each affected route.</li>
  <li>Apply a structural fix in the shared template/render layer rather than route-specific overrides.</li>
  <li>Add regression coverage for landmark containment in at least one representative content list route and one structure route.</li>
</ol>

<p><strong>Related context:</strong> #3105316 is thematically related, but this pattern appears in a narrower top-bar-actions structure and is likely best tracked as a separate issue with cross-references.</p>
```
