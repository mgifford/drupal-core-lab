# #2942404: screen reader evidence

**DRAFT, AI-assisted; a person has not reviewed it.** Last updated 2026-11-26.

The current evidence has two parts:

- a Guidepup virtual run on the final three-patch code (03:34);
- real VoiceOver runs on the final three-patch code (06:39) and on the earlier two-patch code
  (01:31, 01:38, 01:42).

The 06:39 run completed both After routes. Its Before-front navigation did not start (VoiceOver
reported "Heading not found" and did not reach the button); its Before-admin route completed. The
earlier 01:31 run supplies the Before-front comparison. These are kept separate from the final
product code only where stated.

## Final code: Guidepup virtual, 2026-11-26T03-34-45-279Z

- **Before:** `baseline-2942404-latest` at `0387fb948f786bc344a5cc54aa0d98b8f552e378`.
- **After:** `issue-2942404-consolidated` at the same commit plus
  `2942404-consolidated-region.patch`, `2942404-consolidated-message-landmark.patch` and
  `2942404-consolidated-ownership.patch`.
- **Pages:** `/lab/status-messages` and `/admin/lab/status-messages`, each with two server-rendered
  status messages, a warning, an error and a button that adds one JavaScript message of each type.
  Both rendered Default Admin on this core.
- **Raw output:**
  [`screenreader/2026-11-26T03-34-45-279Z`](screenreader/2026-11-26T03-34-45-279Z/SUMMARY.md).

Result: Before has no message landmark; After exposes `region, System messages` around the server
groups and the JavaScript messages. The inner groups remain `status`, `alert`, `alert`. The virtual
reader does not speak live-region changes and jsdom has no layout.

## Final code: real VoiceOver, 2026-11-26T06-39-33-642Z

- **Code:** core `0387fb94` plus the region, message-landmark and ownership patches.
- **After:** both routes reached the button and exposed `System messages region` around the status,
  warning and error groups. The groups kept `status`, `alert`, `alert`; headings stayed at level 2.
  The unsolicited announcement was the combined three-message string.
- **Before:** the administration route reached the button and had no message region. The front route
  did not start: VoiceOver reported "Heading not found" 20 times and did not reach the button. This
  is a test-navigation failure on the Before side, not a product difference. The earlier 01:31 run
  supplies the Before-front result.
- **Raw output:**
  [`screenreader/2026-11-26T06-39-33-642Z`](screenreader/2026-11-26T06-39-33-642Z/SUMMARY.md).

## Earlier real VoiceOver, 2026-11-26 01:31 / 01:38 / 01:42

- **Code:** core `0387fb94` plus the region and message-landmark patches. The ownership/detection
  patch did not exist yet.
- **Runs:**
  - `2026-11-26T01-31-46-207Z`: Before both routes; After administration route only (After front did
    not reach the button).
  - `2026-11-26T01-38-53-209Z`: intermediate run; a Markdown reporting exception stopped the
    summary. Raw JSON preserved.
  - `2026-11-26T01-42-23-930Z`: After both routes, after the skipped-side reporting fix.
- **Tool versions:** Node 22.23.5, npm 10.9.9, Guidepup 0.40.0, Guidepup setup 0.29.3, Guidepup
  virtual reader 0.33.0. macOS, Safari and VoiceOver versions are not recorded in the run JSON; they
  are not inferred from other runs.

### What it establishes

- VoiceOver reads the named `System messages` region on the After pages.
- The status message, warning alert and error alert semantics are preserved.
- Headings remain at level 2.
- Both After routes reached the "Add messages with JavaScript" button.
- The unsolicited after-activation announcement was identical on Before and After:

  > JavaScript status: the item was saved. JavaScript warning: the connection is slow. JavaScript error: the upload failed.

Both After routes rendered Default Admin.

### What it does not establish

Human landmark rotor navigation, navigation back to dynamically inserted messages, NVDA, JAWS or
TalkBack, other themes, or general conformance. The 06:39 run covers the final After code on both
routes; its Before front did not start, so the Before-front comparison comes from 01:31.

## The repeated phrases are navigation, not repeated announcements

The real VoiceOver JSON has two lists:

- `announcedAfterActivation`: what VoiceOver said by itself after the button. It is the one combined
  string above.
- `readAfterActivation`: the next 12 scripted `voiceOver.next()` steps. It repeats the same combined
  string six times, separated by empty phrases.

`Drupal.announce()` debounces and joins queued announcements into one update of a single
`#drupal-live-announce` element (`core/misc/announce.js`). After the button, the cursor reaches that
one text region and repeated `next()` steps re-read the same text. That is why the string appears six
times in the scripted navigation. It is not six automatic announcements.

## Focused human VoiceOver test (not yet run)

Use the rotor and message activation, not repeated `next()` calls.

1. Start Safari with VoiceOver on `/lab/status-messages` on both sites, signed in as administrator.
2. Open the rotor (`VO+U`) and choose Landmarks. On After, check that "System messages" appears once
   and contains the status, warning and error groups. On Before, check that it does not appear.
3. Choose "System messages". Record the region role/name, then each group's role, name, heading
   level (2) and text.
4. Activate "Add messages with JavaScript" with `VO+Space`. Record what is spoken without moving the
   cursor, then use the landmarks rotor again and record where the three new messages appear. Do not
   use repeated `next()` steps through `#drupal-live-announce`.
5. Activate a message's "Hide" button. Record whether focus stays, whether the message leaves the
   landmark, and whether the landmark remains when every message is hidden.
6. Repeat on `/admin/lab/status-messages`.
7. Record macOS, Safari and VoiceOver versions, verbosity, and anything spoken twice.

Expected on After: one "System messages" landmark, unchanged per-type roles and names, JavaScript
messages inside the same landmark, and no focus move. The Hide behavior exposes the existing Default
Admin dismissal defect (opacity plus `visually-hidden`, no DOM removal), so record it as a finding,
not a pass/fail for this patch.

## Historical evidence, preserved

### 2026-11-23: per-type region option on `92e5c3a30476`

This evaluated `2942404-main-region-option.patch` (Variant B, one region per type), not the current
consolidated Variant C. Real VoiceOver read "Status message application status", "Warning message
alert", "Error message alert" on Before, and "Status message region", "Warning message region",
"Error message region" on the option. The option changed the server warning from `alert` to `status`;
Variant C keeps warnings as `alert`.

Raw: [`screenreader/2026-11-23T13-29-17-382Z`](screenreader/2026-11-23T13-29-17-382Z/SUMMARY.md),
`screenreader/vo-run2`, `screenreader/vo-run3-after`.

### 2026-11-25: Variant C on `92e5c3a304`

Chromium and Guidepup evidence for the Twig-only Variant C patch. Runtime identity `92e5c3a30476`;
applicability to `0387fb948f` was checked separately and was not a runtime result. The VoiceOver
transcript from this run showed only `Error message` in the unsolicited slice, with the repeated
combined string in the later navigation; the 01:31/01:42 runs above are the newer real VoiceOver
evidence.

Raw: [`screenreader/2026-11-25T23-48-06-731Z`](screenreader/2026-11-25T23-48-06-731Z/SUMMARY.md)
(virtual), [`screenreader/2026-11-25T23-50-28-424Z`](screenreader/2026-11-25T23-50-28-424Z/SUMMARY.md)
(real VoiceOver).

## Limits

- The virtual reader is a DOM snapshot without CSS or layout and does not speak live-region changes.
- The real VoiceOver evidence is one machine, one Safari, one VoiceOver configuration, and no human
  review. The 06:39 run covers the final After code on both routes; its Before-front route did not
  start, so the Before-front comparison comes from 01:31.
- Automated and synthetic evidence does not establish conformance. A person's keyboard and screen
  reader pass is still required.
