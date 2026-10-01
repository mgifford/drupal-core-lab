# Screen-reader capture (Guidepup) — issue #2847425

Drives a real screen reader over `/file-managed-states-test` and records what it
announces, so you can show the **accessibility** difference MR !7305 makes — not
just the visual one. This is what makes the case that the bug is a WCAG 3.3.1
problem, not a cosmetic one.

- macOS → VoiceOver (default here)
- Windows → NVDA (Guidepup supports it; adjust the import/driver)

See <https://www.guidepup.dev/> for the full API and platform notes.

## One-time setup (macOS)

```bash
cd tests/guidepup
npm install
npx @guidepup/setup
```

`@guidepup/setup` enables the VoiceOver AppleScript dictionary and grants the
Accessibility + Automation permissions Guidepup needs. You may be prompted to
allow your terminal to control VoiceOver in **System Settings → Privacy &
Security → Accessibility / Automation** — approve it, or the run will hang.

VoiceOver will actually start talking and moving during the run. Don't touch the
keyboard while it runs.

## Capture before and after

Point at your instance (defaults to `https://drupal-core.ddev.site`; override
with `SR_URL`).

```bash
# On plain core (no MR): this is the "before" / buggy semantics.
SR_LABEL=before npm run test:before

# Apply MR !7305 in your Drupal checkout, then:
SR_LABEL=after npm run test:after

# Compare the two:
npm run diff
```

Each run writes `sr-output/screenreader-<label>.json` containing the ordered
spoken phrases for the default state, the toggled state, and Guidepup's full
spoken-phrase log. `npm run diff` prints the semantic deltas that matter:

- a hidden managed_file that is (wrongly) announced on load before the fix;
- whether "required" is announced after the trigger is set;
- whether the rest of the Scenario 3 fieldset is still announced after toggling
  (it should be — if it goes silent, the whole fieldset was hidden).

## Notes / gotchas

- Guidepup's API changes between versions. If `voiceOver.navigateToWebContent()`
  is not present in your installed version, the spec falls back to
  `voiceOver.interact()`; you may still need to adjust navigation for your
  version — treat `screenreader.spec.mjs` as a working starting point.
- The form is served at `_access: TRUE`, so no login step is needed. If you lock
  the route down, add a `page` login step before `page.goto`.
- Run headed (the config sets `headless: false`); screen readers need a real UI.
