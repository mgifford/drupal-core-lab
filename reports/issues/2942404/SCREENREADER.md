# #2942404: screen reader evidence, Guidepup virtual reader and Guidepup with real VoiceOver

**DRAFT, AI-assisted; a person has not reviewed it.** Run 2026-11-23 on macOS 27.2.1, Safari, VoiceOver, core `92e5c3a30476` (main, 2026-11-18).

- **Before:** core main as it is.
- **After:** main plus the lab option [2942404-main-region-option.patch](branches/2942404-main-region-option.patch) (not an upstream MR; MR !6058 and !6112 no longer apply to main, see [MR-EVALUATION.md](MR-EVALUATION.md)). Each message type becomes a `region` named by its heading, with an inner `status` (status and warning) or `alert` (error).
- **Page:** a lab-only test page added identically to both sites by `recipes/repro_2942404` (module `lab_status_messages`, test support, not code under test): `/lab/status-messages` in the front-end theme and `/admin/lab/status-messages` in Default Admin. Each shows two server-rendered status messages (one with a link), a warning, an error, and a button that adds one JavaScript message of each type with `Drupal.Message`.
- **Tool:** [screenreader-2942404.mjs](../../../tools/playwright/screenreader-2942404.mjs). Raw output: [virtual run](screenreader/2026-11-23T13-29-17-382Z/SUMMARY.md), [VoiceOver, Before and the first After attempt](screenreader/vo-run2/results.json), [VoiceOver, After](screenreader/vo-run3-after/SUMMARY.md). Run 2 could not start VoiceOver for After (an AppleScript timeout); After was rerun alone as run 3, once VoiceOver Utility, left open by an earlier Recovery-mode start, was closed. Same pages, same command.

## Result in one table

| | Before | After (region option) |
|---|---|---|
| Status message, as read by **real VoiceOver** | "Status message application status", heading, text | "Status message **region**", heading, text |
| Warning, real VoiceOver | "Warning message **alert**" | "Warning message **region**" |
| Error, real VoiceOver | "Error message **alert**" | "Error message **region**" |
| Status, **virtual reader** | `status, Status message` | `region, Status message` containing `status` |
| Warning, virtual reader | `alert, Warning message` (assertive) | `region, Warning message` containing **`status`** (polite) |
| Error, virtual reader | `alert, Error message` | `region, Error message` containing `alert` |
| Messages added by JavaScript (`Drupal.Message.add`) | status (polite), warning and error (assertive) | **identical**: the option does not change `Drupal.theme.message` |
| Spoken by VoiceOver after pressing the button | "Error message", then the three JavaScript messages when read on | **identical** |
| Same on the front-end and Default Admin pages | yes | yes |

## What this shows

1. **The warning changes urgency.** On main a server-rendered warning is `role="alert"` (assertive). In the option it sits inside `role="status"` (polite), because the option follows the MR's "status and warning are polite". The same warning added by JavaScript stays `alert` on both sides, so After is **inconsistent** between server and JavaScript warnings. This comes from the markup (virtual reader) and from the `Drupal.announce()` calls, which the recorder logged as polite for the JavaScript status and assertive for the warning and error on both sides. Real VoiceOver reads the outer element, so it does not show the inner role directly.
2. **A region is a landmark, which adds a stop.** With the option, VoiceOver and the virtual reader both expose three `region` landmarks named "Status message", "Warning message" and "Error message". That helps someone navigating by landmark. On pages with several message types it adds up to three landmark stops where there were none, and it is the design point the issue's discussion is about, not something this run decides.
3. **The role words VoiceOver speaks change.** Before, VoiceOver says "status" or "alert" after the name. After, it says "region". The urgency the inner role carries (polite or assertive) is not spoken in the reading order, so it can only be judged from live announcements, which this run captured poorly (next section).
4. **Nothing else differs:** order, heading levels, the Hide buttons, the link and the JavaScript messages read the same on both sides.

## What is not established

- **Live announcement is thinly recorded.** After activating the button, Guidepup's phrase log held only "Error message" on both sides. That log is not a reliable record of everything VoiceOver spoke; it does not show whether the polite status or the warning was announced, and it cannot show whether an interrupting announcement cut another one off. A person listening should check this.
- **One machine, one run:** macOS 27.2.1, Safari, default VoiceOver settings and verbosity. NVDA, JAWS, TalkBack and Chrome or Firefox were not used.
- The virtual reader works on a DOM snapshot without CSS or layout and does not speak live-region changes; it reports names, roles and structure only.
- Page-load messages (the server-rendered ones) were read by moving the VoiceOver cursor to them, not heard as an announcement when the page loaded.
- A person's keyboard and screen-reader pass is still needed. This is evidence, not a conformance verdict.

## Reproduce

```bash
node scripts/lab-env.mjs start 2942404-latest
bash scripts/lab-site.sh apply baseline-2942404-latest repro_2942404
bash scripts/lab-site.sh apply issue-2942404-latest repro_2942404
node tools/playwright/screenreader-2942404.mjs 2942404-latest --mode=virtual
node tools/playwright/screenreader-2942404.mjs 2942404-latest --mode=voiceover
```

VoiceOver mode needs `npx @guidepup/setup setup` and `npx @guidepup/setup install` once, speaks aloud while it runs, and drives Safari. If it will not start, quit VoiceOver Utility and run it again; `--sides=after` reruns one side.
