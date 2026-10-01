# Why the compare frames sometimes did not load (2026-10-01)

Symptom: the viewer loads but one frame, sometimes both, stays blank for a long time.

## Measured causes
1. **Fresh upstream connection for every request** (DDEV nginx to the host). A Drupal page needs about 90 files.
   Through the `drupal-compare` nginx hop, 11 of 960 requests stalled (9 for about 19.4 s, 2 timed out); direct to the
   Node proxy, 0 of 960. About 1% stalls means nearly every page load had a stalled CSS/JS file. Fixed in
   `tools/compare/site/.ddev/nginx_full/compare.conf` with `upstream ... keepalive`, a 2 s connect timeout and retries.
   After the fix: 0 failures, worst 3.6 s under a harsher synthetic load than a browser makes.
2. **Blocking `ddev describe` in the Node server.** It took 1 to 3 s, ran synchronously, and froze every proxy while
   it ran. The viewer page triggered it twice per load. `/variants.json` took seconds; it now takes about 10 ms. DDEV
   lookups are cached, warmed at startup, and refreshed in the background. `Log in both` is asynchronous too.
3. **No upstream timeout.** A hung request left a frame blank forever. There is now a 30 s timeout with a clear error.
4. Not reproduced, but possible: DDEV's shared router restarting while other projects start or stop (the same flake
   that affected setup), and a single transient DNS failure for a `*.ddev.site` name. DNS lookups were otherwise
   instant (300 of 300 under 4 ms). `http://localhost:8100` (without `--ddev`) has no DNS dependency.

## Measured result (real Chromium, logged-in form page, both frames)
| | Median | Worst | Failed |
|---|---|---|---|
| Before the Node fixes (30 reloads) | 2.7 s | 5.4 s | 0 |
| After (40 reloads) | 0.69 s | 1.0 s | 0 |

## What the viewer does now
- A watchdog notices a frame that has not finished loading after 12 s, raises an alert, and checks both sites
  (`/api/health`): "Both sites answer, so this was probably a stalled request" or "A site is not answering".
- **Reload Before** and **Reload After** buttons.
- The server logs any request slower than 3 s, or that fails, with the frame it was for.

## Diagnose it yourself
    node tools/playwright/frameload.mjs https://drupal-compare.ddev.site/ 40 --login
reloads the viewer in a real browser and reports how long both frames took each time.
