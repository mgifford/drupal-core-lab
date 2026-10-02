# AI-LEARNING.md: what the first long session taught (2026-09-30 to 2026-10-02)

For the next AI session and for the people working here. `AGENTS.md` says how to use the lab; this file says what went wrong, what was learned, and
how to work with this owner. Facts are from the session; items marked *(assumed)* were not verified.

## What was built
A local workspace for evaluating Drupal core issues: two DDEV sites side by side (core, and core plus an issue's change) driven by `tools/compare/variants.json`,
a viewer with live comparison tools, scripted real-input walkthroughs, a read-only GitHub Pages guide (`cloud/`), and written evidence per issue.
Worked through #3619127 (sidebar and Inline Form Errors) and #3604037 (child-error indicators on grouping elements). **Nothing was ever posted to drupal.org.**

## How to work with this owner (standing rules, repeated several times)
- **Local development only. Never post to drupal.org, comment on issues, or push to any remote without approval.** Pushing to `drupal-core-lab` `main` was approved repeatedly; ask again for anything else. Drafts only for anything outward-facing.
- **No tokens or passwords** in the repo, chat or commands. One-time login links (`ddev drupal login`) instead. A GitLab token pasted into chat once was revoked by the owner.
- **Simple beats clever.** Optional extras (live axe, Lighthouse, hover mirroring) are **off by default**; choices live in the browser's `localStorage` only; no accounts.
- **Synthetic Guidepup screen reader is enough**; real VoiceOver/NVDA is out of scope unless asked.
- The owner reviews by looking, and notices things quickly (a frame that stayed blank, a window that was not in forced colours, a stopped site). Say plainly what was and was not verified.
- Close the loop: "push to GitHub" always meant commit, pull --rebase, push, and report the commit.

## Mistakes worth not repeating
1. **I proposed `background: currentColor` for the forced-colours icon without testing it.** In forced colours it makes the icon vanish (1:1). Measuring found the real fix (`forced-color-adjust: preserve-parent-color`). *Test a CSS suggestion in the mode it is about before recommending it.*
2. **The first "forced-colours window" opened in Normal mode**, while its button said forced colours. Make the thing do what its label says.
3. **One unguarded `execFileSync` inside a request handler killed the whole viewer** when a variant's environment folder did not exist. Servers for a local tool must catch per-request errors and keep running.
4. **Playwright installs its own SIGTERM handler once it has launched a browser**, which kept the server alive after `pkill`. Launch with `handleSIGINT/SIGTERM/SIGHUP: false` and handle shutdown yourself.
5. **A comment I wrote inside a one-line function swallowed the rest of the line**; `node --check` caught it only because I ran it. Run the syntax check after every scripted edit.
6. **Docs drifted after a UI rename** ("Frame width" became "Device width", "Site theme" became "Colour mode"). After renaming anything user-facing, grep the whole repo for the old name, including `variants.json` step text.
7. **I wrote claims into an issue-comment draft that the evidence did not support** ("pressing Enter twice still works"; WebKit in forced colours). Checking the draft against `COVERAGE.md` caught both. Verify every sentence of a draft against a recorded result.
8. **A CSS rule that hid "everything below the controls" for the GIF also hid the frames themselves.** Check a screenshot after every scripted layout change, do not assume.
9. **A viewer test passed while the thing it tested was wrong** (the script click did not trigger focus behaviour). For focus and activation use trusted input (Playwright `click()`), never script events. Mirror replays script clicks, so turn it off for the final step.

10. **A dry run is not a test.** The Farsi step in `setup.mjs` had only been dry-run when I called it done; the first real `reset` found two bugs (`lab-site.sh language` validated `fa` as a recipe name; a file copied into a just-restarted DDEV project had not synced into the container yet, so wait until `ddev exec test -f` sees it). Run the real thing, once, on throw-away data.

11. **An outside review of the public repo found four real problems I had not seen** (message bridge that ran code for any parent window, navigation sync that could never fire, cache clearing reachable by a cross-site GET, a leftover weekly workflow from the old fork with write access). Lessons: a local tool is still reachable by every web page the owner visits (source IP is 127.0.0.1 for those requests, so an IP allowlist does not help; Host, Origin, `Sec-Fetch-Site`, POST-only and `frame-ancestors` do); `postMessage` needs a specific target origin and a check of `event.source` and `event.origin`; and when copying a repo's workflows and config, read them (`weekly-sync.yml` and `dependabot.yml` were for the old fork). A line that sets a variable and then tests it for change is always false; the negative control (put the old line back, watch the test fail) proved the test.

## Technical traps (each cost real time)
| Area | Learning |
|---|---|
| DDEV router | Flaky: `ddev-router failed to become ready`. Retry; `setup.mjs` and `lab-env.mjs start` do. The viewer's proxies talk to the router over **HTTPS (443)**; plain HTTP got `ECONNRESET`. |
| Disk | Per environment: about 630 MB, of which 393 MB is `core/node_modules` and under 10 MB is site data, so `lab-env.mjs reset` costs no disk and `trim --deep` frees the most. The Mac ran down to 398 MB. Biggest regenerable wins: `npm cache clean --force`, `~/.npm/_npx`, `docker builder prune -af` (freed 7 GB). `~/.cache/puppeteer` is 6 GB and was left alone. Playwright's Chromium (150 MB) was deleted once and reinstalled. |
| Node | `fetch` ignores a custom `Host` header: use `node:http(s)`. `ddev describe` is synchronous and blocks the event loop: cache and use the async version. macOS has no `timeout`; zsh does not word-split `$var`. Node's connection-refused error can have an **empty message** (check `e.code`, not the text). |
| Drupal recipes | A recipe that installs the Language module does **not** create its locked languages (`und`, `zxx`), so adding a language crashes (`setWeight() on null`). Use `scripts/add-language.php` (API) via `lab-site.sh language`. Rebuilding routes inside that CLI bootstrap also fails; clear caches afterwards instead. |
| Forced colours | A web page cannot turn it on. Emulation set on the **whole tab** (Playwright `page.emulateMedia`, DevTools Rendering) reaches iframes; that is what the lab's "lab browser" does. Forced colours overrides plain colours (a mask icon's `background-color`) unless the value is a system colour or `forced-color-adjust` says otherwise. Emulation is not a real contrast theme. |
| Playwright | Firefox will not launch on this macOS 27 machine; record it as blocked, never as a pass. `gifenc` must be imported as a default export in ESM. |
| Viewer | The injected script is a template literal in `serve.mjs`: double backslashes, no backticks or `${}`. A page can send requests to `localhost`: the API now checks Host and Origin. `serve.mjs` reads `variants.json` once at start; restart it after editing steps. |
| CKEditor 5 | `contenteditable`, not an input: mirror it through its API (`editor.getData/setData`, matched by the source textarea's name; the editor's own ids differ per site). |
| Drag | Tabledrag works with synthetic pointer and mouse events replayed relative to the handle after a 5 px threshold; plain clicks must not be duplicated. |
| Drupal CSS | `core/scripts/css/postcss-build.js --check` compares each `.pcss.css` with its `.css`; a deliberate edit proves the check can fail. The theme already has a text-specific token (`--admin-color-text-error`); prefer it to changing a global token. |
| Git | `git add -A . ':!envs'` also skips the tracked `envs/README.md`; add it explicitly. `git pull --rebase` fails with unstaged changes. Dependabot pushes to `main`, so rebase before pushing, never force. |
| Measurement | Contrast: composite semi-transparent backgrounds before measuring; test rest, hover and keyboard focus separately (hover turned the label blue and changed every number). Select the same section on Before and After (a `querySelector` list returns the first match of either, which was the wrong element). |

## What worked well (repeat)
- **Variants as data** (`variants.json`: core pin or `main`, environments, patches, recipe, steps, checks) made pinned versus latest, bundles, the Pages page and the tests all derive from one source.
- **One viewer page serves both the local tool and the Pages guide**, with `data-needs="live"` marking what needs the server; `build-cloud.mjs --check` in CI stops it going stale.
- **Evidence loop:** reproduce on pristine upstream, apply the change, compare under identical conditions, record commits, say what was not verified, keep it DRAFT until a person looks. Negative controls (a deliberate edit that must fail the check) caught false confidence twice.
- **A `doctor` script and a known-pitfalls table** in `AGENTS.md` turn hard-won fixes into something a new session can use.
- Real input (Playwright) for anything about focus or activation; screenshots reviewed by eye after every layout change.
- Small, reviewable commits pushed often, each with the AI-assisted note.

## Where the owner's judgement changed the design
- Single-window use beats "open another window": the viewer can start in a lab browser with its own persistent profile (`.lab-browser/`) so saved choices survive.
- UI: first collapsible blocks, then (2026-10-02) the owner chose Option B of `docs/ui-proposal/`: a conditions toolbar (Device width, Colour mode, Compare as always visible; Conditions, Input, Audits as popovers), frames filling the window, and a tabbed dock for steps and results.
- GIF and screenshots for the project page and docs; the GIF needs a text alternative and a still image for reduced motion (WCAG 2.2.2).
- The cloud idea (DDEV Coder workspaces) is **on hold** pending the maintainer's answers; see `docs/CLOUD-PLAN.md`. Access needs a sponsoring GitHub org or a contributor request, so the local path must stay fully usable.

## Open items and next step
- Next owner action: review `reports/issues/3604037/ISSUE-COMMENT-DRAFT.md` and `reports/issues/3619127/ISSUE-COMMENT-DRAFT.md`, then post (or push to the issue forks) themselves, next week.
- Next AI action: manual walkthrough with the owner (`node scripts/lab-env.mjs start 3604037-latest --browser`); then re-check both MRs for new commits, re-run `evaluate-3604037.mjs`, and run the MR's PHPUnit tests with proposals A and B applied (not done).
- Not done anywhere: Firefox and Safari; a real Windows contrast theme; a real screen reader; Farsi interface translations (the layout and direction are real, the strings are English); the viewer scrolls sideways at about 420 px.
- Test the documentation cold: give another LLM only the repo and ask it to reproduce #3604037; every question it asks or command that fails is a missing line in `AGENTS.md`.

## TODO for the week of 2026-10-09 (session scheduled; owner approves any push or posting)
1. Check both MRs for new commits (`node tools/compare/setup.mjs <slug> --check-patches`, and the issue/MR if the owner pastes new text). If the CSS changed, re-run `node tools/playwright/evaluate-3604037.mjs 3604037-latest` and rebase the proposal patches if they no longer apply.
2. Run the MR's PHPUnit tests on the patched site with proposals A and B applied (not done yet). Record results in `reports/issues/3604037/phpunit/`; update the draft if anything changes.
3. Walk through the #3604037 steps with the owner in the viewer, including keyboard and focus by a person, and forced colours with the built-in switch. Record it (viewer Download log, then `node scripts/coverage.mjs 3604037`).
4. Tighten the two comment drafts from what we learn, still unposted.
5. Viewer redesign: Option B is implemented (2026-10-02). Still to do: the **test matrix** tab from `docs/ui-proposal/index.html` (width by colour mode, status per cell, Apply button; needs a place to store results and a way into the downloaded log); regenerate the stale screenshots in `docs/images/` (`viewer-checks`, `viewer-manual`, `viewer-environment`, `viewer-axe-alert`, `viewer-lighthouse`, `viewer-overview`, `viewer-frames`, `viewer-difference` still show the old layout) with `node tools/playwright/screenshots.mjs`, which was edited but **not run** because it expects the #3619127 variant (start that one first); keyboard and screen-reader pass on the popovers and tabs by a person; `forced-window.mjs` edited but not run (needs `LAB_EMULATION_HEADLESS=1`).
6. If time: Firefox and Safari, a real Windows contrast theme, a real screen-reader pass, Farsi interface translations, the viewer scrolling sideways at about 420 px (the redesign may fix it).
7. Finish: commit and push to drupal-core-lab (with approval), update this file, stop the sites and viewer.

## Learnings from the viewer redesign (2026-10-02)
- Verified on the live sites with real input: popovers open one at a time and close on Escape (focus returns to the button), tabs work with arrow keys, Reset all restores defaults, dock hide/size, badges. `viewer-security.mjs`, `mirror-drag.mjs`, `mirror-ckeditor.mjs` and `make-demo-gif.mjs` pass or run on the new layout. Not verified: Firefox, Safari, a real screen reader.
- **A hidden grid child shifts the others up a row.** With `display:none` on the activity strip or dock, the frames fell into an `auto` row and shrank to a sliver (the GIF script could not click Submit). Fix: give `main` and `.dock` explicit `grid-row`s. Check the layout with each optional part hidden.
- **A flex or grid parent that also contains a hidden sibling needs care:** `main` holds the static panel (hidden when live), so it is a flex column, not a grid.
- Radio buttons restyled as a segmented strip should keep the real input, stretched over its label with `opacity:0`, not `pointer-events:none`: real clicks, Playwright and the keyboard all keep working.
- Playwright scripts: import `@playwright/test` (the lab's pinned browsers match it); the bare `playwright` package in `tools/playwright/node_modules` is a newer alpha whose browser build is not installed. `... | tail` hides a script's exit code; read the PASS lines.
- Kept every element id, so the script, the tests and the Pages guide kept working; tests only needed to open a popover or click a tab first.
- The rationale and both layouts are in `docs/ui-proposal/index.html` (Option A, the left rail, was not chosen).

## Handoff note (template: `~/.ai/HANDOFF_NOTE_TEMPLATE.md`)
- **Summary of changes:** see "What was built" and `git log`; evidence and drafts in `reports/issues/3619127/` and `reports/issues/3604037/` (`proposals/`, `STATUS-2026-10-02.md`).
- **Evidence:** MR tests pass on After and fail on Before (`reports/issues/3604037/phpunit/`); CSS parity check passes with a negative control; contrast, forced-colours, RTL and JS-off measurements in `EVALUATION-2026-10-01.md`; viewer regression scripts `tools/playwright/mirror-drag.mjs`, `mirror-ckeditor.mjs`, `forced-window.mjs`, `lab-browser.mjs`.
- **Risks:** all findings are Chromium-only and DRAFT; the proposals are untested against the MR's PHPUnit tests; sites and the viewer may still be running (`node scripts/lab-env.mjs status`; stop with `... stop 3604037-latest`).
- **Owner of the next step:** the repository owner (posting); an AI session for the walkthrough.
- **AI-assisted:** yes. Tool: Claude Code. External code copied: no. Dev dependencies `gifenc` and `pngjs` (MIT) were installed from npm for the demo GIF.
