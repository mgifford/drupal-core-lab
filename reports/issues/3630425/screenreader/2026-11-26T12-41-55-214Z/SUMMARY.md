# #3630425 screen reader evidence: MR !17622 (3630425-mr17622)

DRAFT, AI-assisted; a person has not reviewed it. Run 2026-11-26T12:41:55.311Z. Mode: both; sides: before, after.

Evidence for MR [!17622](https://git.drupalcode.org/project/drupal/-/merge_requests/17622) head `090a74cd28aa`. This is not a re-run of !17421 or of the Lab's main port; do not attribute these results to them.

| | |
|---|---|
| Core pin | `dbfce851242d5b082adb8ed14634b4bc9cce374b` |
| Before commit | `dbfce851242 2026-10-16` |
| After commit | `dbfce851242 2026-10-16` |
| Patch | `17622-090a74cd28aa.patch` |
| Source | reused `reports/issues/3630425/playwright/2026-11-26T12-39-49-645Z-chromium-light-1280x900` |
| macOS / Safari / VoiceOver | 27.2.1 / 27.2 / 10 |
| Guidepup / virtual reader / jsdom | 0.40.0 / 0.33.0 / 31.0.1 |

## Preconditions

| Side | Stage | Problems |
|---|---|---|
| before | initial | none |
| before | add | none |
| before | remove | none |
| after | initial | none |
| after | add | none |
| after | remove | none |

## Virtual screen reader (Guidepup over jsdom)

| Side | Stage | Header names | Rows | Remove buttons | Operations phrases |
|---|---|---|---|---|---|
| before | initial | Lab multi-value text, column span 2 / (unnamed) | 3 | 3 | 0 |
| before | add | Lab multi-value text, column span 2 / (unnamed) | 4 | 4 | 0 |
| before | remove | Lab multi-value text, column span 2 / (unnamed) | 3 | 3 | 0 |
| after | initial | Lab multi-value text, column span 2 / Operations | 3 | 3 | 5 |
| after | add | Lab multi-value text, column span 2 / Operations | 4 | 4 | 5 |
| after | remove | Lab multi-value text, column span 2 / Operations | 3 | 3 | 5 |

Reading order, initial state:

**before**

    - table
    - rowgroup
    - row, Lab multi-value text
    - columnheader, Lab multi-value text, column span 2
    - heading, Lab multi-value text, level 4
    - end of columnheader, Lab multi-value text, column span 2
    - columnheader
    - end of row, Lab multi-value text
    - end of rowgroup
    - rowgroup
    - row, Lab multi-value text (value 1) First sample
    - cell
    - link, Change order
    - end of cell
    - cell, Lab multi-value text (value 1) First sample
    - Lab multi-value text (value 1)
    - textbox, Lab multi-value text (value 1), First sample
    - end of cell, Lab multi-value text (value 1) First sample
    - cell
    - button, Remove
    - end of cell
    - end of row, Lab multi-value text (value 1) First sample
    - row, Lab multi-value text (value 2) Second sample
    - cell
    - link, Change order
    - end of cell
    - cell, Lab multi-value text (value 2) Second sample
    - Lab multi-value text (value 2)
    - textbox, Lab multi-value text (value 2), Second sample
    - end of cell, Lab multi-value text (value 2) Second sample
    - cell
    - button, Remove
    - end of cell
    - end of row, Lab multi-value text (value 2) Second sample
    - row, Lab multi-value text (value 3)
    - cell
    - link, Change order
    - end of cell
    - cell, Lab multi-value text (value 3)
    - Lab multi-value text (value 3)
    - textbox, Lab multi-value text (value 3)
    - end of cell, Lab multi-value text (value 3)
    - cell
    - button, Remove
    - end of cell
    - end of row, Lab multi-value text (value 3)
    - end of rowgroup
    - end of table

**after**

    - table
    - rowgroup
    - row, Lab multi-value text Operations
    - columnheader, Lab multi-value text, column span 2
    - heading, Lab multi-value text, level 4
    - end of columnheader, Lab multi-value text, column span 2
    - columnheader, Operations
    - Operations
    - end of columnheader, Operations
    - end of row, Lab multi-value text Operations
    - end of rowgroup
    - rowgroup
    - row, Lab multi-value text (value 1) First sample
    - cell
    - link, Change order
    - end of cell
    - cell, Lab multi-value text (value 1) First sample
    - Lab multi-value text (value 1)
    - textbox, Lab multi-value text (value 1), First sample
    - end of cell, Lab multi-value text (value 1) First sample
    - cell
    - button, Remove
    - end of cell
    - end of row, Lab multi-value text (value 1) First sample
    - row, Lab multi-value text (value 2) Second sample
    - cell
    - link, Change order
    - end of cell
    - cell, Lab multi-value text (value 2) Second sample
    - Lab multi-value text (value 2)
    - textbox, Lab multi-value text (value 2), Second sample
    - end of cell, Lab multi-value text (value 2) Second sample
    - cell
    - button, Remove
    - end of cell
    - end of row, Lab multi-value text (value 2) Second sample
    - row, Lab multi-value text (value 3)
    - cell
    - link, Change order
    - end of cell
    - cell, Lab multi-value text (value 3)
    - Lab multi-value text (value 3)
    - textbox, Lab multi-value text (value 3)
    - end of cell, Lab multi-value text (value 3)
    - cell
    - button, Remove
    - end of cell
    - end of row, Lab multi-value text (value 3)
    - end of rowgroup
    - end of table

The virtual reader works on a DOM snapshot. It has no layout engine, does not model VoiceOver table navigation and does not associate the header with a Remove cell in its per-cell speech. A bare `columnheader` above is the empty header; `Operations` is the label.

## Real VoiceOver and Safari

### before

URL: not read. Safari JavaScript probe: not attempted. Completed: false. Other Safari windows preserved: true.

Errors: spawnSync osascript ETIMEDOUT

| Scenario | Last phrase | New phrases from the command |
|---|---|---|
| entering the table | not reached | |
| header row | not reached | |
| across columns | not reached | |
| first Remove | not reached | |
| column header at Remove | not reached | |
| between Remove buttons | not reached | |
| re-enter | not reached | |
| Add another item | not reached | |
| header after add | not reached | |
| last Remove after add | not reached | |
| Remove activation | not reached | |
| header after remove | not reached | |

<details><summary>Raw command log (0 steps)</summary>


</details>

### after

URL: not read. Safari JavaScript probe: not attempted. Completed: false. Other Safari windows preserved: true.

Errors: Command failed: osascript -e tell application "Safari" make new document with properties {URL:"https://repro-issue-3630425-mr17622.ddev.site/user/reset/[redacted]"} set w to front window set index of w to 1 return (id of w) as text end tell 26:187: execution error: Safari got an error: A privilege violation occurred. (-10004)

| Scenario | Last phrase | New phrases from the command |
|---|---|---|
| entering the table | not reached | |
| header row | not reached | |
| across columns | not reached | |
| first Remove | not reached | |
| column header at Remove | not reached | |
| between Remove buttons | not reached | |
| re-enter | not reached | |
| Add another item | not reached | |
| header after add | not reached | |
| last Remove after add | not reached | |
| Remove activation | not reached | |
| header after remove | not reached | |

<details><summary>Raw command log (0 steps)</summary>


</details>

## Limits

- The virtual reader is a synthetic model. It has no CSS or layout, so it cannot show that `Operations` is visually hidden, and it does not reproduce VoiceOver table navigation.
- VoiceOver output depends on macOS, Safari, VoiceOver settings and verbosity. One machine, one run. A person's keyboard and screen reader review is still required.
- Repeated phrases are reported only when a command added them; a repeated `lastPhrase` with no new speech is a navigation artefact, not a repeated announcement.
- AJAX completion is judged from the page's row state and what VoiceOver read, not only from network timing.
- The MR's one review note could not be read (GitLab API returned HTTP 401).
