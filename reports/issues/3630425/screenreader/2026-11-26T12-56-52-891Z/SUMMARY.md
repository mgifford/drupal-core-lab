# #3630425 screen reader evidence: MR !17622 (3630425-mr17622)

DRAFT, AI-assisted; a person has not reviewed it. Run 2026-11-26T12:56:52.915Z. Mode: voiceover; sides: before, after.

Evidence for MR [!17622](https://git.drupalcode.org/project/drupal/-/merge_requests/17622) head `090a74cd28aa`. This is not a re-run of !17421 or of the Lab's main port; do not attribute these results to them.

| | |
|---|---|
| Core pin | `dbfce851242d5b082adb8ed14634b4bc9cce374b` |
| Before commit | `dbfce851242 2026-10-16` |
| After commit | `dbfce851242 2026-10-16` |
| Patch | `17622-090a74cd28aa.patch` |
| Source | captured in this run |
| macOS / Safari / VoiceOver | 27.2.1 / 27.2 / 10 |
| Guidepup / virtual reader / jsdom | 0.40.0 / 0.33.0 / 31.0.1 |

## Preconditions

Not checked in this run.

## Virtual screen reader (Guidepup over jsdom)

Not run in this invocation.

## Real VoiceOver and Safari

### before

URL: not read. Safari JavaScript probe: not attempted. Completed: false. Other Safari windows preserved: true.

Errors: Command failed: osascript -e tell application "Safari" tell (first window whose id is 14062) set URL of document 1 to "https://repro-baseline-3630425.ddev.site/node/add/article" end tell end tell 62:149: execution error: Safari got an error: The specified object is a property, not an element. (-10008)

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

URL: not read. Safari JavaScript probe: not attempted. Completed: false. Other Safari windows preserved: false.

Errors: Command failed: osascript -e tell application "Safari" tell (first window whose id is 14065) set URL of document 1 to "https://repro-issue-3630425-mr17622.ddev.site/node/add/article" end tell end tell 62:154: execution error: Safari got an error: The specified object is a property, not an element. (-10008)

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
