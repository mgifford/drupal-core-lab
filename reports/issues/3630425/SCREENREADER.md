# Screen reader evidence: DRAFT

Virtual results are recorded. Real VoiceOver has **not** completed, so the change is not verified with real assistive technology yet.

## Status

| Mode | State | Run |
|---|---|---|
| Guidepup virtual screen reader | completed on both sides | `screenreader/2026-11-26T12-40-34-521Z/` |
| Real VoiceOver, agent attempt | blocked before navigation (`-10004`, `ETIMEDOUT`) | `screenreader/2026-11-26T12-41-55-214Z/` (voiceover incomplete) |
| Real VoiceOver, user-terminal attempt | opened Safari, failed in the lab URL setter (`-10008`) | `screenreader/2026-11-26T12-56-52-891Z/` (voiceover incomplete) |

The virtual run reused the table HTML from the stable Playwright run `playwright/2026-11-26T12-39-49-645Z-chromium-light-1280x900/`.

## Virtual results

Source: the rendered Default Admin table after Drupal behaviours initialised. Rows: 3 initial, 4 after Add another item, 3 after removing the added row. Remove controls match rows at every stage.

| Side | Stage | Column headers exposed | Rows | Remove | Phrases containing `Operations` |
|---|---|---|---|---|---|
| Before | initial | `Lab multi-value text` (span 2), bare `columnheader` | 3 | 3 | 0 |
| Before | add | same bare header | 4 | 4 | 0 |
| Before | remove | same bare header | 3 | 3 | 0 |
| After | initial | `Lab multi-value text` (span 2), `Operations` | 3 | 3 | 5 |
| After | add | `Operations` | 4 | 4 | 5 |
| After | remove | `Operations` | 3 | 3 | 5 |

Initial reading order, After, at the header row:

    table
    rowgroup
    row, Lab multi-value text Operations
    columnheader, Lab multi-value text, column span 2
    heading, Lab multi-value text, level 4
    end of columnheader, Lab multi-value text, column span 2
    columnheader, Operations
    Operations
    end of columnheader, Operations
    end of row, Lab multi-value text Operations

Before, the corresponding line is a bare `columnheader` with no name.

Default Admin hides the `Order` column (`th.tabledrag-hide`, `display:none`). The accessibility tree therefore exposes two headers, while the DOM still has three `th` cells. The actions header is the second DOM `th` and the third logical column.

The virtual reader does **not** repeat the column header when it walks into a Remove cell; the per-cell reading is `cell`, `button, Remove`. The `Operations` context is demonstrated at the header row, not at each button. This is a jsdom model with no layout or browser accessibility API, so it cannot show that the label is visually hidden and does not reproduce VoiceOver table navigation.

## Real VoiceOver: not completed

Two attempts failed, both before any table navigation:

- Agent attempt: Before `spawnSync osascript ETIMEDOUT`; After `Safari got an error: A privilege violation occurred. (-10004)`. No window was opened.
- User-terminal attempt: Safari windows opened, then `Safari got an error: The specified object is a property, not an element. (-10008)` when setting the page URL. The helper now targets `document of (first window whose id is N)` instead of `document 1`; that fix has not yet been exercised at runtime.

No phrases were recorded, no table was entered, and no unrelated Safari window was closed. The agent process still lacks macOS permission to control Safari; the run must come from the user’s terminal. From the repository root, with no VoiceOver or Safari work in progress:

```sh
node tools/playwright/screenreader-3630425.mjs 3630425-mr17622 --mode=voiceover
```

If macOS asks whether Terminal may control Safari, allow it. The run opens one new Safari window and closes only that window; it speaks aloud. It records, per command, the phrases that command added, so repeated `lastSpokenPhrase()` values are not mistaken for repeated announcements. A side that does not complete is reported as incomplete, not as a pass.

## Completion rule

A successful screen reader verification is claimed only if the live navigation scenarios complete: entering the table, the header row, across columns, the first Remove, vertical movement between Remove buttons, exit and re-entry, AJAX add, the new Remove, its activation, and re-entry after removal. A missing scenario, a command error, a stalled loop, a page that did not load, or VoiceOver failing to start is reported as incomplete.

## Limits

- Virtual reader: DOM snapshot, no layout, no browser accessibility API, no VoiceOver table navigation.
- VoiceOver: one macOS/Safari/VoiceOver machine and one run, automated input, not a person’s review.
- Not covered: NVDA, JAWS, Firefox, mobile screen readers, forced colours, zoom, translated strings.
- MR !17622 reports one review note. The GitLab notes/discussions API returned HTTP 401, so its content was not read.

## Earlier lesson

The #2942404 VoiceOver run recorded the same phrase several times after a JavaScript message. The cause was repeated `next()` calls inside one live-announcement text node, not six announcements. This evaluator records the phrase delta for each command so that reading-order repetition is not reported as repeated speech.
