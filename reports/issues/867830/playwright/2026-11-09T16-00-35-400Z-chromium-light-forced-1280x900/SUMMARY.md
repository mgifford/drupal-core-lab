# Playwright evidence: #867830 (867830-current-authoring)

Run 2026-11-09T16:00:36.578Z. Core Before `3fb1c69d36 2026-11-06`, After `3fb1c69d36 2026-11-06` plus `867830-current-core-status.patch`. chromium 156.0.8078.4, light, forced colours, 1280x900, darwin arm64. Themes: olivero, claro, default_admin (each set as the default theme on both sites, then Olivero restored). axe-core WCAG 2.0 to 2.2 A/AA on every page. Recorders: tools/playwright/lib/lab-run.mjs.

The change under test is the local current-Core proposal with separate contrib Olivero and Claro patches, not an upstream MR. Rule: **fix** rows should differ as the issue asks (Before no, After yes); **regression** rows should match on both sides; **observe** and **context** rows are recorded, not judged. A fix row that stays "no" on After is the finding, not a run error.

Guidepup virtual screen reader reads status markup captured from each live page. Synthetic evidence only: no real VoiceOver/NVDA or human keyboard pass. Exact markup and spoken phrase logs are in each page’s `screenreader` array in results.json.

## Theme: olivero

| Type | Check | Before | After | Verdict |
|---|---|---|---|---|
| context | Theme that rendered the pages | olivero | olivero | recorded |
| regression | No PHP or Twig error on any of the three pages | yes | yes | as expected |
| regression | Draft article: both comments rendered (admin sees the held one) | 2 | 2 | as expected |
| fix | Draft article: text says the node is unpublished | none | "This node is" in `span.visually-hidden` (visually hidden); "Unpublished" in `strong` | as expected |
| fix | Draft page: text says the node is unpublished | none | "This node is" in `span.visually-hidden` (visually hidden); "Unpublished" in `strong` | as expected |
| fix | Held comment: text says it is unpublished | none | "This comment is" in `span.visually-hidden` (visually hidden); "Unpublished" in `strong` | as expected |
| fix | Marker has screen-reader context ("This node is ...", visually hidden), as the issue summary asks | no | yes | as expected |
| observe | Marker text contrast (visible marker only; WCAG 1.4.3 needs 4.5:1) | - | 21:1 (#000000 on #ffffff, 16px) | recorded |
| observe | Draft article background, and its contrast with the page (the only Before cue; 1.4.11 asks 3:1 for a non-text cue) | #ffffff, 1:1 | #ffffff, 1:1 | recorded |
| observe | Held comment background, contrast with the page | #ffffff, 1:1 | #ffffff, 1:1 | recorded |
| observe | Draft article has the node--unpublished class (the change removes it from Claro's template) | yes | yes | recorded |
| observe | Held comment classes | contextual-region comment js-comment comment--level-1 comment--unpublished by-node-author by-viewer | contextual-region comment js-comment comment--level-1 comment--unpublished by-node-author by-viewer | recorded |
| regression | Live comment classes (a published comment must not get an empty status class such as "comment--") | contextual-region comment js-comment comment--level-1 by-node-author by-viewer | contextual-region comment js-comment comment--level-1 by-node-author by-viewer | as expected |
| regression | Live article: no unpublished text (no false positive) | no | no | as expected |
| regression | Live comments: no unpublished text | no | no | as expected |
| regression | axe violations (elements): draft article / draft page / live article | 1 / 1 / 1 | 1 / 1 / 1 | as expected |
| regression | JavaScript errors | 0 | 0 | as expected |
| regression | Guidepup: draftArticle, status count, visible label and contextual speech | yes | yes | as expected |
| regression | Guidepup: draftPage, status count, visible label and contextual speech | yes | yes | as expected |
| regression | Guidepup: liveArticle, status count, visible label and contextual speech | yes | yes | as expected |

Draft article footer, accessibility snapshot. Before:

```yaml
- paragraph:
  - link "admin":
    - /url: /user/1
- paragraph: 20 min 20 sec ago
```

After:

```yaml
- paragraph:
  - link "admin":
    - /url: /user/1
- paragraph: 16 min 22 sec ago
```

Held comment, accessibility snapshot. Before:

```yaml
- article:
  - paragraph:
    - link "admin":
      - /url: /user/1
  - paragraph: 20 min 20 sec ago
  - heading "A comment awaiting approval" [level=3]:
    - link "A comment awaiting approval":
      - /url: /comment/3#comment-3
  - list:
    - listitem:
      - link "Delete":
        - /url: /comment/3/delete
    - listitem:
      - link "Edit":
        - /url: /comment/3/edit
    - listitem:
      - link "Approve":
        - /url: /comment/3/approve?token=[redacted]
  - paragraph: This comment is held for review and is not shown to visitors.
```

After:

```yaml
- article:
  - paragraph:
    - strong: This comment is Unpublished
  - paragraph:
    - link "admin":
      - /url: /user/1
  - paragraph: 16 min 22 sec ago
  - heading "A comment awaiting approval" [level=3]:
    - link "A comment awaiting approval":
      - /url: /comment/3#comment-3
  - list:
    - listitem:
      - link "Delete":
        - /url: /comment/3/delete
    - listitem:
      - link "Edit":
        - /url: /comment/3/edit
    - listitem:
      - link "Approve":
        - /url: /comment/3/approve?token=[redacted]
  - paragraph: This comment is held for review and is not shown to visitors.
```

Marker markup on the draft article: Before `(no marker)`; After `<span class="visually-hidden">This node is </span>
<strong><span class="visually-hidden">This node is </span>Unpublished</strong>`. Held comment: Before `(no marker)`; After `<span class="visually-hidden">This comment is </span> <strong><span class="visually-hidden">This comment is </span>Unpublished</strong>`.

axe rules, draft article: Before {"color-contrast":1}, After {"color-contrast":1}. Screenshots: `olivero-before-draftArticle.png`, `olivero-after-draftArticle.png`, and the same for `draftPage` and `liveArticle`.

## Theme: claro

| Type | Check | Before | After | Verdict |
|---|---|---|---|---|
| context | Theme that rendered the pages | claro | claro | recorded |
| regression | No PHP or Twig error on any of the three pages | yes | yes | as expected |
| regression | Draft article: both comments rendered (admin sees the held one) | 2 | 2 | as expected |
| fix | Draft article: text says the node is unpublished | none | "This node is" in `span.visually-hidden` (visually hidden); "Unpublished" in `strong` | as expected |
| fix | Draft page: text says the node is unpublished | none | "This node is" in `span.visually-hidden` (visually hidden); "Unpublished" in `strong` | as expected |
| fix | Held comment: text says it is unpublished | none | "This comment is" in `span.visually-hidden` (visually hidden); "Unpublished" in `strong` | as expected |
| fix | Marker has screen-reader context ("This node is ...", visually hidden), as the issue summary asks | no | yes | as expected |
| observe | Marker text contrast (visible marker only; WCAG 1.4.3 needs 4.5:1) | - | 21:1 (#000000 on #ffffff, 16px) | recorded |
| observe | Draft article background, and its contrast with the page (the only Before cue; 1.4.11 asks 3:1 for a non-text cue) | #ffffff, 1:1 | #ffffff, 1:1 | recorded |
| observe | Held comment background, contrast with the page | #ffffff, 1:1 | #ffffff, 1:1 | recorded |
| observe | Draft article has the node--unpublished class (the change removes it from Claro's template) | yes | yes | recorded |
| observe | Held comment classes | contextual-region comment js-comment unpublished by-node-author by-viewer | contextual-region comment js-comment unpublished by-node-author by-viewer | recorded |
| regression | Live comment classes (a published comment must not get an empty status class such as "comment--") | contextual-region comment js-comment by-node-author by-viewer | contextual-region comment js-comment by-node-author by-viewer | as expected |
| regression | Live article: no unpublished text (no false positive) | no | no | as expected |
| regression | Live comments: no unpublished text | no | no | as expected |
| regression | axe violations (elements): draft article / draft page / live article | 0 / 0 / 0 | 0 / 0 / 0 | as expected |
| regression | JavaScript errors | 0 | 0 | as expected |
| regression | Guidepup: draftArticle, status count, visible label and contextual speech | yes | yes | as expected |
| regression | Guidepup: draftPage, status count, visible label and contextual speech | yes | yes | as expected |
| regression | Guidepup: liveArticle, status count, visible label and contextual speech | yes | yes | as expected |

Draft article footer, accessibility snapshot. Before:

```yaml
- article
- text: Submitted by
- link "admin":
  - /url: /user/1
- text: "on"
- time: Mon, 9 Nov 2026 - 10:40
```

After:

```yaml
- article
- text: Submitted by
- link "admin":
  - /url: /user/1
- text: "on"
- time: Mon, 9 Nov 2026 - 10:44
```

Held comment, accessibility snapshot. Before:

```yaml
- article:
  - article
  - paragraph:
    - text: Submitted by
    - link "admin":
      - /url: /user/1
    - text: on Mon, 9 Nov 2026 - 10:40
  - link "Permalink":
    - /url: /comment/3#comment-3
  - heading "A comment awaiting approval" [level=3]:
    - link "A comment awaiting approval":
      - /url: /comment/3#comment-3
  - list:
    - listitem:
      - link "Delete":
        - /url: /comment/3/delete
    - listitem:
      - link "Edit":
        - /url: /comment/3/edit
    - listitem:
      - link "Approve":
        - /url: /comment/3/approve?token=[redacted]
  - paragraph: This comment is held for review and is not shown to visitors.
```

After:

```yaml
- article:
  - paragraph:
    - strong: This comment is Unpublished
  - article
  - paragraph:
    - text: Submitted by
    - link "admin":
      - /url: /user/1
    - text: on Mon, 9 Nov 2026 - 10:44
  - link "Permalink":
    - /url: /comment/3#comment-3
  - heading "A comment awaiting approval" [level=3]:
    - link "A comment awaiting approval":
      - /url: /comment/3#comment-3
  - list:
    - listitem:
      - link "Delete":
        - /url: /comment/3/delete
    - listitem:
      - link "Edit":
        - /url: /comment/3/edit
    - listitem:
      - link "Approve":
        - /url: /comment/3/approve?token=[redacted]
  - paragraph: This comment is held for review and is not shown to visitors.
```

Marker markup on the draft article: Before `(no marker)`; After `<span class="visually-hidden">This node is </span>
<strong><span class="visually-hidden">This node is </span>Unpublished</strong>`. Held comment: Before `(no marker)`; After `<span class="visually-hidden">This comment is </span> <strong><span class="visually-hidden">This comment is </span>Unpublished</strong>`.

axe rules, draft article: Before {}, After {}. Screenshots: `claro-before-draftArticle.png`, `claro-after-draftArticle.png`, and the same for `draftPage` and `liveArticle`.

## Theme: default_admin

| Type | Check | Before | After | Verdict |
|---|---|---|---|---|
| context | Theme that rendered the pages | default_admin | default_admin | recorded |
| regression | No PHP or Twig error on any of the three pages | yes | yes | as expected |
| regression | Draft article: both comments rendered (admin sees the held one) | 2 | 2 | as expected |
| fix | Draft article: text says the node is unpublished | none | "This node is" in `span.visually-hidden` (visually hidden); "Unpublished" in `strong` | as expected |
| fix | Draft page: text says the node is unpublished | none | "This node is" in `span.visually-hidden` (visually hidden); "Unpublished" in `strong` | as expected |
| fix | Held comment: text says it is unpublished | none | "This comment is" in `span.visually-hidden` (visually hidden); "Unpublished" in `strong` | as expected |
| fix | Marker has screen-reader context ("This node is ...", visually hidden), as the issue summary asks | no | yes | as expected |
| observe | Marker text contrast (visible marker only; WCAG 1.4.3 needs 4.5:1) | - | 21:1 (#000000 on #ffffff, 16px) | recorded |
| observe | Draft article background, and its contrast with the page (the only Before cue; 1.4.11 asks 3:1 for a non-text cue) | #ffffff, 1:1 | #ffffff, 1:1 | recorded |
| observe | Held comment background, contrast with the page | #ffffff, 1:1 | #ffffff, 1:1 | recorded |
| observe | Draft article has the node--unpublished class (the change removes it from Claro's template) | yes | yes | recorded |
| observe | Held comment classes | contextual-region comment js-comment unpublished by-node-author by-viewer | contextual-region comment js-comment unpublished by-node-author by-viewer | recorded |
| regression | Live comment classes (a published comment must not get an empty status class such as "comment--") | contextual-region comment js-comment by-node-author by-viewer | contextual-region comment js-comment by-node-author by-viewer | as expected |
| regression | Live article: no unpublished text (no false positive) | no | no | as expected |
| regression | Live comments: no unpublished text | no | no | as expected |
| regression | axe violations (elements): draft article / draft page / live article | 0 / 0 / 0 | 0 / 0 / 0 | as expected |
| regression | JavaScript errors | 0 | 0 | as expected |
| regression | Guidepup: draftArticle, status count, visible label and contextual speech | yes | yes | as expected |
| regression | Guidepup: draftPage, status count, visible label and contextual speech | yes | yes | as expected |
| regression | Guidepup: liveArticle, status count, visible label and contextual speech | yes | yes | as expected |

Draft article footer, accessibility snapshot. Before:

```yaml
- article
- text: Submitted by
- link "admin":
  - /url: /user/1
- text: "on"
- time: Mon, 9 Nov 2026 - 10:40
```

After:

```yaml
- article
- text: Submitted by
- link "admin":
  - /url: /user/1
- text: "on"
- time: Mon, 9 Nov 2026 - 10:44
```

Held comment, accessibility snapshot. Before:

```yaml
- article:
  - article
  - paragraph:
    - text: Submitted by
    - link "admin":
      - /url: /user/1
    - text: on Mon, 9 Nov 2026 - 10:40
  - link "Permalink":
    - /url: /comment/3#comment-3
  - heading "A comment awaiting approval" [level=3]:
    - link "A comment awaiting approval":
      - /url: /comment/3#comment-3
  - list:
    - listitem:
      - link "Delete":
        - /url: /comment/3/delete
    - listitem:
      - link "Edit":
        - /url: /comment/3/edit
    - listitem:
      - link "Approve":
        - /url: /comment/3/approve?token=[redacted]
  - paragraph: This comment is held for review and is not shown to visitors.
```

After:

```yaml
- article:
  - paragraph:
    - strong: This comment is Unpublished
  - article
  - paragraph:
    - text: Submitted by
    - link "admin":
      - /url: /user/1
    - text: on Mon, 9 Nov 2026 - 10:44
  - link "Permalink":
    - /url: /comment/3#comment-3
  - heading "A comment awaiting approval" [level=3]:
    - link "A comment awaiting approval":
      - /url: /comment/3#comment-3
  - list:
    - listitem:
      - link "Delete":
        - /url: /comment/3/delete
    - listitem:
      - link "Edit":
        - /url: /comment/3/edit
    - listitem:
      - link "Approve":
        - /url: /comment/3/approve?token=[redacted]
  - paragraph: This comment is held for review and is not shown to visitors.
```

Marker markup on the draft article: Before `(no marker)`; After `<span class="visually-hidden">This node is </span>
<strong><span class="visually-hidden">This node is </span>Unpublished</strong>`. Held comment: Before `(no marker)`; After `<span class="visually-hidden">This comment is </span> <strong><span class="visually-hidden">This comment is </span>Unpublished</strong>`.

axe rules, draft article: Before {}, After {}. Screenshots: `default_admin-before-draftArticle.png`, `default_admin-after-draftArticle.png`, and the same for `draftPage` and `liveArticle`.

## Context

| | Before | After |
|---|---|---|
| Core commit | `3fb1c69d36 2026-11-06` | `3fb1c69d36 2026-11-06` |
| Drupal, PHP | 12.0-dev, 8.5.12 | 12.0-dev, 8.5.12 |
| Profile; default / admin theme (config) | standard; default_admin / default_admin | standard; default_admin / default_admin |
| Theme that rendered each page | /user/1/edit → default_admin<br>/lab/unpublished-article → default_admin<br>/lab/unpublished-page → default_admin<br>/lab/published-article → default_admin<br>/lab/unpublished-article → olivero<br>/lab/unpublished-page → olivero<br>/lab/published-article → olivero<br>/lab/unpublished-article → claro<br>/lab/unpublished-page → claro<br>/lab/published-article → claro | /user/1/edit → default_admin<br>/lab/unpublished-article → default_admin<br>/lab/unpublished-page → default_admin<br>/lab/published-article → default_admin<br>/lab/unpublished-article → olivero<br>/lab/unpublished-page → olivero<br>/lab/published-article → olivero<br>/lab/unpublished-article → claro<br>/lab/unpublished-page → claro<br>/lab/published-article → claro |
| Languages (default) | none (en) | none (en) |
| Modules only on this side | none | none |
| Enabled modules | 40 | 40 |

## AJAX responses

Every Drupal AJAX response, in order; raw commands in `ajax-before.json` and `ajax-after.json`.

**Before** (0 responses)


**After** (0 responses)


## What could be announced

`Drupal.announce()` calls, and text changes inside live regions (role alert/status/log or aria-live). A recorded change is not proof that a screen reader spoke it; see the screen-reader run for that.

| Side | Source | Politeness | Text |
|---|---|---|---|
| before | none | | |
| after | none | | |

## Changes after input, and how a screen reader learns of them

After each click, key press or typing, the text that appeared or changed on the page. **Silent**: not in a live region, no `Drupal.announce()` after the same action, focus did not move to it, and the control pressed did not disclose it. A silent change is a candidate for WCAG 2.2 SC 4.1.3 Status Messages, for a person to judge: not every change is a status message. See docs/SILENT-CHANGES.md.

No silent change on either side.

Before: 0 in a live region, 0 Drupal.announce() after the same action, 0 focus moved to it, 0 shown by the control pressed (expanded), 0 inside the control itself, 0 the name of a control that appeared or changed, 0 silent.
After: 0 in a live region, 0 Drupal.announce() after the same action, 0 focus moved to it, 0 shown by the control pressed (expanded), 0 inside the control itself, 0 the name of a control that appeared or changed, 0 silent.

## Reading

12 of 12 fix rows differ as the issue asks across 3 theme(s); 0 regression row(s) differ. Before shows the problem wherever a fix row says "none" or "no" on the Before side. The After side records, per theme, where the local proposal prints a marker and where it does not.

---
Automated evidence is a DRAFT: DOM, colour and axe checks do not replace a keyboard and screen-reader pass by a person. No real VoiceOver or NVDA pass was made by this script.
