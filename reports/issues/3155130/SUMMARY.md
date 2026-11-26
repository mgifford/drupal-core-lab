# #3155130: persistent, accessible "Edit summary" disclosure

**DRAFT — a local proposal, not an upstream merge request.** No person has reviewed it, no real screen reader was used, and
nothing has been posted to drupal.org or GitLab. The implementation lives in the contributed **Text With Summary** project's
`2.0.x` branch because the field type, widget and `js/text.js` moved out of Drupal core (#3549134, #3620228).

Issue: https://www.drupal.org/project/drupal/issues/3155130
Project: https://www.drupal.org/project/text_with_summary
Historical core evaluation: [EVIDENCE-2026-11-06-historical.md](EVIDENCE-2026-11-06-historical.md)
Draft queue item: [ISSUE-COMMENT-DRAFT.md](ISSUE-COMMENT-DRAFT.md)

## The problem

On a Text (formatted, long, with summary) field, the "Edit summary" / "Hide summary" control:

1. is appended inside the **Body label**, then moved inside the **Summary label** on activation — a `<button>` inside a
   `<label>` whose text becomes part of the Body textarea's accessible name;
2. is **removed and replaced** on activation, so focus falls to `<body>` and the control's identity changes;
3. is placed **after** the summary textarea it reveals, not before it;
4. has **no `aria-expanded` or `aria-controls`**;
5. leaves every summary textarea named **"Summary"**, including multi-value rows and the always-visible required summary;
6. wipes a `Drupal.theme.textEditSummaryButton()` override's content when the summary starts collapsed (the old code calls
   `.html()` on the button);
7. hides an empty summary that has a **validation error**, so the error is not discoverable on the reloaded page.

The 2020 `<details>` proposal fixed the semantics but renamed the submitted summary to
`field_body[0][container][summary]`, so the summary was lost on save. This proposal keeps the submitted names.

## The proposed change

Two files in the contributed module:

- `js/text.js` — one `Drupal.behaviors.textSummary` behaviour that creates **one persistent native `<button>` per optional
  summary**, places it **immediately before** the summary wrapper and **outside every label**, and never moves or replaces it.
  It maintains `aria-expanded` and a unique `aria-controls` id, keeps focus on activation, and updates only the button's
  children (so the theme function and its overrides keep working).
- `src/Plugin/Field/FieldWidget/TextareaWithSummaryWidget.php` — attaches that library for **every** summary textarea, not only
  the collapsible ones, so required and always-visible summaries also get a distinguishable accessible name. It still adds
  `js-text-summary` only to fields that may be collapsed.

Accessible names are built from **existing** form context: the value textarea's own label (field label + `(value 2)` for
multi-value rows), appended visually hidden to the existing "Summary" label and to the button. The visible text stays
"Edit summary" / "Hide summary" in parentheses, using the existing theme markup and CSS classes. No new dependency, no new CSS.

The field order is unchanged: the summary is still before the Body value, as it is today. The disclosure now precedes it.

## Evidence at a glance

| | Before (contrib `2.0.x`) | After (patches applied) |
|---|---|---|
| Toggles inside a label | 4 of 4 | **0** |
| `aria-expanded` / `aria-controls` | none | all 4, unique valid ids |
| Body toggle immediately before its content | no | **yes** |
| Focus kept after Enter / Space | no (focus falls to `<body>`) | **yes / yes** |
| Body summary accessible name | "Summary" | **"Summary for Body"** |
| All summary textarea names (5) | every one "Summary" | **distinguishable by field + value** |
| Required summary name | "Summary" | **"Summary for Required summary"** |
| Summary kept after collapse + Save | yes | **yes** |
| Submitted summary name | `field_body[0][summary]` | **`field_body[0][summary]`** |
| Theme override text after load | lost ("Edit summary") | **kept ("Custom override: …")** |
| axe (WCAG 2.2 AA tags), collapsed + expanded | 0 + 0 | 0 + 0 |

Executed: 10 FunctionalJavascript tests, **10 fail on Before / 10 pass on After** (156 assertions); browser matrix in Default
Admin and Claro (contrib 4.0.x), light, dark, forced colours, 480 px, simulated RTL, 200% root font at 1600 px; real
Playwright keyboard input. See [tests/results.md](tests/results.md) and [browser/results.md](browser/results.md).

## Intentional visual difference

The control moves to one persistent position immediately before the summary content instead of sitting inside the Body or
Summary label. The collapsed field therefore shows `( Edit summary )` above the Body label, and the expanded field shows it
above the Summary label. Everything else is retained: the link-style button, the parentheses, the type, colour and spacing,
the theme function, the field styling and the summary-before-value order. No CSS was added. See
[VISUAL-DIFFERENCES.md](VISUAL-DIFFERENCES.md) and the screenshots in [`visual/`](visual/).

## What is verified, and what is not

**Verified by automation:** DOM structure, valid labels, ARIA state/reference, focus retention under real Enter/Space,
name stability and uniqueness, single/multi-value, AJAX addition and reordering, empty/populated summaries, required summaries, a
validation error on an empty summary, the existing theme override, and summary persistence through save, collapse and
reopen.

**Not verified:** a person's keyboard pass; VoiceOver, NVDA, JAWS or TalkBack; Firefox and WebKit (Chromium only); a real
RTL language pack (RTL is simulated with `dir="rtl"`); real browser zoom or a 400% reflow check (the 200% run raises the
root font size — at 1280 px the Default Admin sidebar intercepted a click, and the completed 1600 px run shows the sidebar
overlapping the form, recorded as finding F004, unrelated to this patch); touch; real Windows High Contrast (forced colours
are emulated). Automated evidence stays DRAFT until a person reviews it.

## Files and links

| What | Where |
|---|---|
| Implementation patch | [branches/3155130-persistent-disclosure.patch](branches/3155130-persistent-disclosure.patch) |
| Regression test patch | [branches/3155130-persistent-disclosure-tests.patch](branches/3155130-persistent-disclosure-tests.patch) |
| Patch provenance and hashes | [BRANCHES.md](BRANCHES.md) |
| Full evidence, commands and resource use | [EVIDENCE.md](EVIDENCE.md) |
| Reproduction | [REPRODUCE.md](REPRODUCE.md) |
| Functional test results | [tests/results.md](tests/results.md) / [tests/results.json](tests/results.json) |
| Browser matrix | [browser/results.md](browser/results.md) / [browser/results.json](browser/results.json) |
| Curated screenshots and ARIA diffs | [`visual/`](visual/) |
| Visual changes explained | [VISUAL-DIFFERENCES.md](VISUAL-DIFFERENCES.md) |
| Draft queue item (do not post) | [ISSUE-COMMENT-DRAFT.md](ISSUE-COMMENT-DRAFT.md) |
| Historical core evaluation (unchanged) | [EVIDENCE-2026-11-06-historical.md](EVIDENCE-2026-11-06-historical.md) |
| Original triage note (unchanged) | [ISSUE-3155130.md](ISSUE-3155130.md) |
| Lab variant | `3155130-contrib` in [variants.json](variants.json) |

## Environment

- Core `d29add7ebc18954dcb88877ed38b5bd88cdbf967` (Drupal 12.0-dev, 2026-09-30), pinned.
- Contributed `text_with_summary` `2.0.x` `89c4282cf25259564ce7fa41b9dd70f7fe7f496d`.
- Claro contrib `4.0.x` `474f080c47f5ce21961bf90515fb7bdea1d7dcd4` (no longer in core).
- Recipe `repro_3155130_contrib`; two DDEV sites in one comparison pair; PHP 8.5.7; Chromium 159.0.8154.6 (Playwright) and
  Chrome 143.0.7499.169 (PHPUnit/Selenium), macOS arm64.

No baseline tracked files were edited; `envs/baseline-3155130-contrib` is pristine `89c4282`.
