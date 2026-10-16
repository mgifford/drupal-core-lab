# #3618230: client-side energy, Before vs After (proof of concept)

**DRAFT.** Not reviewed by a person. Recorded 2026-10-16.

This is a test of the method, not of the patch. The #3618230 merge request only changes `core/modules/file/src/Element/ManagedFile.php`
(server side), so an anonymous page should cost the browser the same on both sides. That makes this an A/A test: it shows the noise
floor that a real client-side change would have to beat.

## Result

Anonymous `/user/login`, 15 alternating pairs, energy drawn by Firefox's processes above its idle baseline.

| | Before (upstream) | After (with the patch) |
|---|---|---|
| Median | 0.259 mWh | 0.265 mWh (+2.1%) |
| Middle half of runs (IQR) | 0.251 to 0.269 | 0.251 to 0.269 |
| Range | 0.229 to 0.289 | 0.240 to 0.312 |
| Power samples per load (median) | 1,846 | 1,847 |
| Requests per load | 88 | 88 |

**Reading:** no measurable difference, which is the expected answer. The interquartile ranges are identical.

**Noise floor:** the IQR is about 0.018 mWh wide, roughly 7% of the median. As a rule of thumb for this setup, a change would need to move
page-load energy by clearly more than about 7% before it is worth calling a difference with 15 pairs. This is not a significance test,
and the scanner claims none.

No run was invalid, none gave a negative value, and the scanner raised no warnings. The idle baseline was 0.090 W.

## Conditions

From [`conditions.txt`](conditions.txt) and the result's `environment` block:

- Apple M2 (Mac14,2), macOS 27.0.1, **on battery (96%) with Low Power Mode on**. Both lower and change measured energy; do not compare
  these numbers with runs on mains power or with Low Power Mode off.
- Firefox 158.0, the installed `/Applications/Firefox.app`, headless, driven by Playwright 1.62.1 over WebDriver BiDi.
- Both sides at core `3b94128e929`. Before had no tracked changes; After had only the patch's two files.
- Sites served by DDEV over plain `http://` (`repro-baseline-3618230-latest.ddev.site`, `repro-issue-3618230-latest.ddev.site`).
- [firefox-energy-scanner](https://github.com/mgifford/firefox-energy-scanner) at `27dca87`, plus the two-line change below.
- Run time: 10:49:53 to 11:02:37 UTC (about 13 minutes). Each run starts a fresh Firefox, waits 5 s, measures 10 s of idle, then loads the page.

## How it was measured

The scanner starts Firefox with the Gecko Profiler's `power` feature (`MOZ_PROFILER_STARTUP*` environment variables), then adds up the
per-process power counters over each measured step's clock-time window. Everything Firefox did in that window counts, so the page is
loaded on its own, never inside the viewer's frames. `compare` alternates the two sites in a seeded order (seed in the JSON) so drift in
heat or server state lands on both sides equally.

### The BiDi workaround

Playwright's own Firefox builds do not start on this Mac (macOS 27.0.1), so the scanner could not run as published:

- Firefox 153 (`firefox-1538`, Playwright 1.62.1) hangs at launch, headless and headed.
- Firefox 157 (`firefox-1555`, Playwright 1.64.1) exits with `Could not find profile folder`.

The `sandbox_extension_issue_file_to_process ... Operation not permitted` line in their logs is not the cause: the installed Firefox 158
prints it too and runs normally. See [`firefox-launch-checks.txt`](firefox-launch-checks.txt). Both failing builds are only ad-hoc
signed; whether that is why they fail is not known.

What works is Playwright's BiDi route to the installed Firefox, `firefox.launch({ channel: 'moz-firefox' })`. For this run the scanner's
`src/collect/session.ts` got two lines inside its `firefox.launch({...})` call:

```js
// Lab POC: 'moz-firefox' drives the installed Firefox over WebDriver BiDi.
...(process.env.WEB_ENERGY_FIREFOX_CHANNEL ? { channel: process.env.WEB_ENERGY_FIREFOX_CHANNEL } : {}),
```

A proper option (`browser.channel`) is on a local scanner branch, `fix/installed-firefox-triage-noise-compare-warmup`. It has not been pushed.

## Caveats

- **Client only.** PHP, the database and the DDEV containers are outside what is measured. A server-side patch showing no difference is correct.
- **One uneven run.** In this scanner version only the first run in the order shares a browser with the 5 warm-up loads. Here that was an
  After run, and it gave After's highest value (0.312 mWh). Without it, After's median is 0.2635 mWh (+1.7%). The fix branch above changes this.
- **The payload check gives a false "worth measuring".** `triage` reported different markup, but after normalising host names and form
  tokens the only difference is `drupalSettings.user.permissionsHash`, which is unique to each site. Scripts (15) and stylesheets (73) are identical.
- **Browser updates.** The installed Firefox updates itself. Record its version, and do not compare runs across versions.
- **Single pair is noise.** A one-pair smoke run just before this gave +9.3% for the same identical pages.
- **Not checked:** the scanner's HTML report was not run through axe; it is the tool's own output, copied unchanged.

## Files

| File | What it is |
|---|---|
| [`compare-2026-10-16T11-02-37-660Z.html`](compare-2026-10-16T11-02-37-660Z.html) | The scanner's report, unchanged |
| [`compare-2026-10-16T11-02-37-660Z.csv`](compare-2026-10-16T11-02-37-660Z.csv) | One row per run, unchanged |
| [`compare-2026-10-16T11-02-37-660Z.trimmed.json`](compare-2026-10-16T11-02-37-660Z.trimmed.json) | The full result with the per-request lists (`network.resources`) removed; every per-run energy, timing and CO2 value is kept. The 1.3 MB original was in a temporary scratchpad and is not kept. |
| [`compare-console.txt`](compare-console.txt) | The command's console output |
| [`conditions.txt`](conditions.txt) | Power, OS, browser, commits and scanner version at the start |
| [`drupal-user-login.js`](drupal-user-login.js) | The page-load script used (loads `/user/login` and waits for it to settle) |
| [`firefox-launch-checks.txt`](firefox-launch-checks.txt) | The launch logs behind the BiDi workaround |

## To run it again

On mains power with Low Power Mode off, with both sites running (`node scripts/lab-env.mjs start 3618230-latest`). In a clone of the
scanner with the channel option, `npm ci && npm run build`, copy `drupal-user-login.js` into its `examples/` folder, then:

```bash
WEB_ENERGY_FIREFOX_CHANNEL=moz-firefox node dist/cli/index.js compare --a http://repro-baseline-3618230-latest.ddev.site --label-a before --b http://repro-issue-3618230-latest.ddev.site --label-b after --journey examples/drupal-user-login.js --headless --warmups 5 --runs 15 --out results
```

The run above was started from the agent's shell with its command sandbox disabled; running it inside that sandbox was not tried. The scanner's
`doctor` command at `27dca87` reports a false failure here, because its check still uses Playwright's own Firefox.

---

AI-assisted: measured, analysed and drafted with Claude Code (Claude Opus 5.5). The numbers come from the scanner's output files listed
above. Review before quoting.
