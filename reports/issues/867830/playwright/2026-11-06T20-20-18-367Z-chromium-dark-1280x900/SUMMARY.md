# Playwright evidence: #867830 (867830-pinned)

Run 2026-11-06T20:20:18.954Z. Core Before `422099995e 2025-07-11`, After `422099995e 2025-07-11` plus `867830-unpublished-style-of.patch`. chromium 156.0.8078.4, dark, 1280x900, darwin arm64. Themes: olivero, claro, stark (each set as the default theme on both sites, then Olivero restored). axe-core WCAG 2.0 to 2.2 A/AA on every page. Recorders: tools/playwright/lib/lab-run.mjs.

The change under test is the #306 re-roll as it is on the fork branch, not a merge request. Rule: **fix** rows should differ as the issue asks (Before no, After yes); **regression** rows should match on both sides; **observe** and **context** rows are recorded, not judged. A fix row that stays "no" on After is the finding, not a run error.

## Theme: olivero

| Type | Check | Before | After | Verdict |
|---|---|---|---|---|
| context | Theme that rendered the pages | olivero | olivero | recorded |
| regression | No PHP or Twig error on any of the three pages | yes | yes | as expected |
| regression | Draft article: both comments rendered (admin sees the held one) | 2 | 2 | as expected |
| fix | Draft article: text says the node is unpublished | none | none | **NOT as expected** |
| fix | Draft page: text says the node is unpublished | none | none | **NOT as expected** |
| fix | Held comment: text says it is unpublished | none | none | **NOT as expected** |
| fix | Marker has screen-reader context ("This node is ...", visually hidden), as the issue summary asks | no | no | **NOT as expected** |
| observe | Marker text contrast (visible marker only; WCAG 1.4.3 needs 4.5:1) | - | - | recorded |
| observe | Draft article background, and its contrast with the page (the only Before cue; 1.4.11 asks 3:1 for a non-text cue) | #fff4f4, 1.01:1 | #fff4f4, 1.01:1 | recorded |
| observe | Held comment background, contrast with the page | #fff4f4, 1.01:1 | #fff4f4, 1.01:1 | recorded |
| observe | Draft article has the node--unpublished class (the change removes it from Claro's template) | yes | yes | recorded |
| observe | Held comment classes | contextual-region comment js-comment comment--level-1 comment--unpublished by-node-author by-viewer new | contextual-region comment js-comment comment--level-1 comment--unpublished by-node-author by-viewer new | recorded |
| regression | Live comment classes (a published comment must not get an empty status class such as "comment--") | contextual-region comment js-comment comment--level-1 by-node-author by-viewer new | contextual-region comment js-comment comment--level-1 comment-- by-node-author by-viewer new | **NOT as expected** |
| regression | Live article: no unpublished text (no false positive) | no | no | as expected |
| regression | Live comments: no unpublished text | no | no | as expected |
| regression | axe violations (elements): draft article / draft page / live article | 3 / 0 / 0 | 3 / 0 / 0 | as expected |
| regression | JavaScript errors | 0 | 0 | as expected |

Draft article footer, accessibility snapshot. Before:

```yaml
- paragraph:
  - link "admin":
    - /url: /user/1
- paragraph: 1 hour 35 min ago
```

After:

```yaml
- paragraph:
  - link "admin":
    - /url: /user/1
- paragraph: 1 hour 33 min ago
```

Held comment, accessibility snapshot. Before:

```yaml
- article:
  - text: new
  - paragraph:
    - link "admin":
      - /url: /user/1
  - paragraph: 1 hour 35 min ago
  - heading "A comment awaiting approval" [level=3]:
    - link "A comment awaiting approval":
      - /url: /comment/3#comment-3
  - paragraph: This comment is held for review and is not shown to visitors.
  - list:
    - listitem:
      - link "Delete":
        - /url: /comment/3/delete
    - listitem:
      - link "Edit":
        - /url: /comment/3/edit
    - listitem:
      - link "Approve":
        - /url: /comment/3/approve?token=LvRuxnLvIQtWkfhBANKevNcIKKwnK5xvUyLYUWHDh_0
```

After:

```yaml
- article:
  - text: new
  - paragraph:
    - link "admin":
      - /url: /user/1
  - paragraph: 1 hour 33 min ago
  - heading "A comment awaiting approval" [level=3]:
    - link "A comment awaiting approval":
      - /url: /comment/3#comment-3
  - paragraph: This comment is held for review and is not shown to visitors.
  - list:
    - listitem:
      - link "Delete":
        - /url: /comment/3/delete
    - listitem:
      - link "Edit":
        - /url: /comment/3/edit
    - listitem:
      - link "Approve":
        - /url: /comment/3/approve?token=KHQYocE73Y7wwiEQTvc1TVI3xYTlQVJyjdAgyKYXj9k
```

Marker markup on the draft article: Before `(no marker)`; After `(no marker)`. Held comment: Before `(no marker)`; After `(no marker)`.

axe rules, draft article: Before {"color-contrast":3}, After {"color-contrast":3}. Screenshots: `olivero-before-draftArticle.png`, `olivero-after-draftArticle.png`, and the same for `draftPage` and `liveArticle`.

## Theme: claro

| Type | Check | Before | After | Verdict |
|---|---|---|---|---|
| context | Theme that rendered the pages | claro | claro | recorded |
| regression | No PHP or Twig error on any of the three pages | yes | yes | as expected |
| regression | Draft article: both comments rendered (admin sees the held one) | 2 | 2 | as expected |
| fix | Draft article: text says the node is unpublished | none | "unpublished" in `span.marker.marker--warning` | as expected |
| fix | Draft page: text says the node is unpublished | none | none | **NOT as expected** |
| fix | Held comment: text says it is unpublished | none | "unpublished" in `span.marker.marker--warning` | as expected |
| fix | Marker has screen-reader context ("This node is ...", visually hidden), as the issue summary asks | no | no | **NOT as expected** |
| observe | Marker text contrast (visible marker only; WCAG 1.4.3 needs 4.5:1) | - | 15.49:1 (#232429 on #ffffff, 16px) | recorded |
| observe | Draft article background, and its contrast with the page (the only Before cue; 1.4.11 asks 3:1 for a non-text cue) | #fff4f4, 1.08:1 | #ffffff, 1:1 | recorded |
| observe | Held comment background, contrast with the page | #fff4f4, 1.08:1 | #ffffff, 1:1 | recorded |
| observe | Draft article has the node--unpublished class (the change removes it from Claro's template) | yes | no | recorded |
| observe | Held comment classes | contextual-region comment js-comment unpublished by-node-author by-viewer new | contextual-region comment js-comment by-node-author by-viewer new | recorded |
| regression | Live comment classes (a published comment must not get an empty status class such as "comment--") | contextual-region comment js-comment by-node-author by-viewer new | contextual-region comment js-comment by-node-author by-viewer new | as expected |
| regression | Live article: no unpublished text (no false positive) | no | no | as expected |
| regression | Live comments: no unpublished text | no | no | as expected |
| regression | axe violations (elements): draft article / draft page / live article | 0 / 0 / 0 | 0 / 0 / 0 | as expected |
| regression | JavaScript errors | 0 | 0 | as expected |

Draft article footer, accessibility snapshot. Before:

```yaml
- article
- text: Submitted by
- link "admin":
  - /url: /user/1
- text: "on"
- time: Fri, 6 Nov 2026 - 13:44
```

After:

```yaml
- article
- text: Submitted by
- link "admin":
  - /url: /user/1
- text: "on"
- time: Fri, 6 Nov 2026 - 13:47
- text: unpublished
```

Held comment, accessibility snapshot. Before:

```yaml
- article:
  - mark: new
  - article
  - paragraph:
    - text: Submitted by
    - link "admin":
      - /url: /user/1
    - text: on Fri, 6 Nov 2026 - 13:44
  - link "Permalink":
    - /url: /comment/3#comment-3
  - heading "A comment awaiting approval" [level=3]:
    - link "A comment awaiting approval":
      - /url: /comment/3#comment-3
  - paragraph: This comment is held for review and is not shown to visitors.
  - list:
    - listitem:
      - link "Delete":
        - /url: /comment/3/delete
    - listitem:
      - link "Edit":
        - /url: /comment/3/edit
    - listitem:
      - link "Approve":
        - /url: /comment/3/approve?token=-aFBkoC7zbeoZ2ZcKMUPyvAqf7XHYwPP8XdS8w3Ymcw
```

After:

```yaml
- article:
  - mark: new
  - text: unpublished
  - article
  - paragraph:
    - text: Submitted by
    - link "admin":
      - /url: /user/1
    - text: on Fri, 6 Nov 2026 - 13:47
  - link "Permalink":
    - /url: /comment/3#comment-3
  - heading "A comment awaiting approval" [level=3]:
    - link "A comment awaiting approval":
      - /url: /comment/3#comment-3
  - paragraph: This comment is held for review and is not shown to visitors.
  - list:
    - listitem:
      - link "Delete":
        - /url: /comment/3/delete
    - listitem:
      - link "Edit":
        - /url: /comment/3/edit
    - listitem:
      - link "Approve":
        - /url: /comment/3/approve?token=hOAZUvhKBBEn5nnW6uytJvI9-igrM3idCenJOHNEmRc
```

Marker markup on the draft article: Before `(no marker)`; After `<span class="marker marker--warning">unpublished</span>`. Held comment: Before `(no marker)`; After `<span class="marker marker--warning">unpublished</span>`.

axe rules, draft article: Before {}, After {}. Screenshots: `claro-before-draftArticle.png`, `claro-after-draftArticle.png`, and the same for `draftPage` and `liveArticle`.

## Theme: stark

| Type | Check | Before | After | Verdict |
|---|---|---|---|---|
| context | Theme that rendered the pages | stark | stark | recorded |
| regression | No PHP or Twig error on any of the three pages | yes | yes | as expected |
| regression | Draft article: both comments rendered (admin sees the held one) | 2 | 2 | as expected |
| fix | Draft article: text says the node is unpublished | none | none | **NOT as expected** |
| fix | Draft page: text says the node is unpublished | none | none | **NOT as expected** |
| fix | Held comment: text says it is unpublished | none | "unpublished" in `article.contextual-region.js-comment.by-viewer.new` | as expected |
| fix | Marker has screen-reader context ("This node is ...", visually hidden), as the issue summary asks | no | no | **NOT as expected** |
| observe | Marker text contrast (visible marker only; WCAG 1.4.3 needs 4.5:1) | - | - | recorded |
| observe | Draft article background, and its contrast with the page (the only Before cue; 1.4.11 asks 3:1 for a non-text cue) | #ffffff, 1:1 | #ffffff, 1:1 | recorded |
| observe | Held comment background, contrast with the page | #ffffff, 1:1 | #ffffff, 1:1 | recorded |
| observe | Draft article has the node--unpublished class (the change removes it from Claro's template) | no | no | recorded |
| observe | Held comment classes | contextual-region js-comment by-viewer new | contextual-region js-comment by-viewer new | recorded |
| regression | Live comment classes (a published comment must not get an empty status class such as "comment--") | contextual-region js-comment by-viewer new | contextual-region js-comment by-viewer new | as expected |
| regression | Live article: no unpublished text (no false positive) | no | no | as expected |
| regression | Live comments: no unpublished text | no | no | as expected |
| regression | axe violations (elements): draft article / draft page / live article | 7 / 0 / 4 | 7 / 0 / 4 | as expected |
| regression | JavaScript errors | 0 | 0 | as expected |

Draft article footer, accessibility snapshot. Before:

```yaml
- article
- text: Submitted by
- link "admin":
  - /url: /user/1
- text: "on"
- time: Fri, 6 Nov 2026 - 13:44
```

After:

```yaml
- article
- text: Submitted by
- link "admin":
  - /url: /user/1
- text: "on"
- time: Fri, 6 Nov 2026 - 13:47
```

Held comment, accessibility snapshot. Before:

```yaml
- article:
  - mark: new
  - article
  - paragraph:
    - text: Submitted by
    - link "admin":
      - /url: /user/1
    - text: on Fri, 6 Nov 2026 - 13:44
  - link "Permalink":
    - /url: /comment/3#comment-3
  - heading "A comment awaiting approval" [level=3]:
    - link "A comment awaiting approval":
      - /url: /comment/3#comment-3
  - paragraph: This comment is held for review and is not shown to visitors.
  - list:
    - listitem:
      - link "Delete":
        - /url: /comment/3/delete
    - listitem:
      - link "Edit":
        - /url: /comment/3/edit
    - listitem:
      - link "Approve":
        - /url: /comment/3/approve?token=MRLGg6pblYT6Ua-J0oNwAQd7pCnU2hqK-V02YO73dT0
```

After:

```yaml
- article:
  - mark: new
  - text: unpublished
  - article
  - paragraph:
    - text: Submitted by
    - link "admin":
      - /url: /user/1
    - text: on Fri, 6 Nov 2026 - 13:47
  - link "Permalink":
    - /url: /comment/3#comment-3
  - heading "A comment awaiting approval" [level=3]:
    - link "A comment awaiting approval":
      - /url: /comment/3#comment-3
  - paragraph: This comment is held for review and is not shown to visitors.
  - list:
    - listitem:
      - link "Delete":
        - /url: /comment/3/delete
    - listitem:
      - link "Edit":
        - /url: /comment/3/edit
    - listitem:
      - link "Approve":
        - /url: /comment/3/approve?token=73T4_nITemTv8iinMono5N2yz9C2l-LsES9scxRg1nc
```

Marker markup on the draft article: Before `(no marker)`; After `(no marker)`. Held comment: Before `(no marker)`; After `<article data-comment-user-id="1" id="comment-3" class="contextual-region js-comment by-viewer new"> <mark class="" data-comment-timestamp="1793990852" data-once="history">new</mark> unpublished <footer> <article class="contextual-region"> </article> <p>Submitted by <a title="View user profile." hre`.

axe rules, draft article: Before {"target-size":7}, After {"target-size":7}. Screenshots: `stark-before-draftArticle.png`, `stark-after-draftArticle.png`, and the same for `draftPage` and `liveArticle`.

## Context

| | Before | After |
|---|---|---|
| Core commit | `422099995e 2025-07-11` | `422099995e 2025-07-11` |
| Drupal, PHP | 11.3-dev, 8.5.12 | 11.3-dev, 8.5.12 |
| Profile; default / admin theme (config) | standard; stark / claro | standard; stark / claro |
| Theme that rendered each page | /user/1/edit → claro<br>/lab/unpublished-article → stark<br>/lab/unpublished-page → stark<br>/lab/published-article → stark<br>/lab/unpublished-article → olivero<br>/lab/unpublished-page → olivero<br>/lab/published-article → olivero<br>/lab/unpublished-article → claro<br>/lab/unpublished-page → claro<br>/lab/published-article → claro | /user/1/edit → claro<br>/lab/unpublished-article → stark<br>/lab/unpublished-page → stark<br>/lab/published-article → stark<br>/lab/unpublished-article → olivero<br>/lab/unpublished-page → olivero<br>/lab/published-article → olivero<br>/lab/unpublished-article → claro<br>/lab/unpublished-page → claro<br>/lab/published-article → claro |
| Languages (default) | none (en) | none (en) |
| Modules only on this side | none | none |
| Enabled modules | 42 | 42 |

## AJAX responses

Every Drupal AJAX response, in order; raw commands in `ajax-before.json` and `ajax-after.json`.

**Before** (0 responses)


**After** (0 responses)


## What could be announced

`Drupal.announce()` calls, and text changes inside live regions (role alert/status/log or aria-live). A recorded change is not proof that a screen reader spoke it; see the screen-reader run for that.

| Side | Source | Politeness | Text |
|---|---|---|---|
| before | Drupal.announce | polite | Tray "Administration menu" opened. |
| after | Drupal.announce | polite | Tray "Administration menu" opened. |

## Changes after input, and how a screen reader learns of them

After each click, key press or typing, the text that appeared or changed on the page. **Silent**: not in a live region, no `Drupal.announce()` after the same action, focus did not move to it, and the control pressed did not disclose it. A silent change is a candidate for WCAG 2.2 SC 4.1.3 Status Messages, for a person to judge: not every change is a status message. See docs/SILENT-CHANGES.md.

No silent change on either side.

Before: 0 in a live region, 0 Drupal.announce() after the same action, 0 focus moved to it, 0 shown by the control pressed (expanded), 0 inside the control itself, 0 the name of a control that appeared or changed, 0 silent.
After: 0 in a live region, 0 Drupal.announce() after the same action, 0 focus moved to it, 0 shown by the control pressed (expanded), 0 inside the control itself, 0 the name of a control that appeared or changed, 0 silent.

## Reading

3 of 12 fix rows differ as the issue asks across 3 theme(s); 1 regression row(s) differ. Before shows the problem wherever a fix row says "none" or "no" on the Before side. The After side says, per theme, where the #306 re-roll prints a marker and where it does not.

---
Automated evidence is a DRAFT: DOM, colour and axe checks do not replace a keyboard and screen-reader pass by a person. No real VoiceOver or NVDA pass was made by this script.
