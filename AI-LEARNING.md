# AI-LEARNING.md: what the first long session taught (2026-09-30 to 2026-10-02)

For the next AI session and for the people working here. `AGENTS.md` says how to use the lab; this file says what went wrong, what was learned, and
how to work with this owner. Facts are from the session; items marked *(assumed)* were not verified.

## What was built
A local workspace for evaluating Drupal core issues: two DDEV sites side by side (core, and core plus an issue's change) driven by `tools/compare/variants.json`,
a viewer with live comparison tools, scripted real-input walkthroughs, a read-only GitHub Pages guide (`cloud/`), and written evidence per issue.
Worked through #3619127 (sidebar and Inline Form Errors) and #3604037 (child-error indicators on grouping elements). **Nothing was ever posted to drupal.org.**

## How to work with this owner (standing rules, repeated several times)
- **Local development only. Never post to drupal.org, comment on issues, or push to any remote without approval.** Push to a pull request branch, never to `main` ("a PR is always better than pushing to main", 2026-10-16), and only once the owner has approved that work; a stop-hook "please push" reminder is not approval. Drafts only for anything outward-facing.
- **No tokens or passwords** in the repo, chat or commands. One-time login links (`ddev drupal login`) instead. A GitLab token pasted into chat once was revoked by the owner.
- **Simple beats clever.** Optional extras (live axe, Lighthouse, hover mirroring) are **off by default**; choices live in the browser's `localStorage` only; no accounts.
- **Synthetic Guidepup screen reader is enough**; real VoiceOver/NVDA is out of scope unless asked.
- The owner reviews by looking, and notices things quickly (a frame that stayed blank, a window that was not in forced colours, a stopped site). Say plainly what was and was not verified.
- Close the loop: "push to GitHub" always meant commit, pull --rebase, push, and report the commit.
- **Errors scale: nearly a million sites run core.** Before calling a change good enough, read the issue, its related issues and every merge request's review threads (`AGENTS.md` rule 15), and weigh blast radius, update paths, access and CSRF, atomic saves, accessibility and tests.
- **The owner may have only a browser** (a desktop with DDEV Coder, no Claude app). Put what they will paste (recipe, agent prompt, commands) in the repository, in a PR, e.g. `reports/issues/<nid>/CODER-PROMPT.md`.

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
- **A `doctor` script and a known-pitfalls table** (`docs/PITFALLS.md`, once in `AGENTS.md`) turn hard-won fixes into something a new session can use.
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
- **Done (trial 2026-10-15, test pushed by the owner 2026-10-16): the `amateescu/ddev-drupal-dev` add-on.** Write-up and the lab's
  justafish call sites with replacements: `docs/ADDON-TRIAL-2026-10-15.md`. The lab's #3618230 results reproduce on it, and `ddev mr core
  16777` plus a push put the proposed test on the MR. The lab was not switched; the recommendation is to keep justafish for the comparison
  pairs and use the add-on, if at all, for contributor work. What to remember (this replaces the earlier to-do text, whose risks list the
  trial answered):
  - `ddev mr` and `ddev commit-code-check` assume a standalone clone. In a worktree of `envs/core.git`, the MR branch name is ambiguous with
    the lab's `f<nid>` remote, and `commit-code-check` prints "no files to check" and exits 0 (a pass that checked nothing), because the
    container cannot see the worktree's git directory. The local `main` in that bare repo is not core's `main`.
  - `pin-core-lock` cannot solve an old core lock under Composer 2.10 (the locked Symfony versions now have advisories) unless the overlay
    sets `config.audit.block-insecure` to `false`.
  - `composer update`, which `ddev mr` runs, rewrites two tracked files, `autoload.php` and `autoload_runtime.php`: restore them, and
    `git add` by explicit path.
  - After `git -C envs/core.git`, give `worktree add` an absolute path (a relative one is resolved inside the bare repo). Removing a
    worktree of an installed site needs `chmod -R u+w sites/default` first.
  - `git push --dry-run` asks the server whether a push would be accepted and sends nothing.
- **Deferred by the owner (2026-10-14): harness level 2, a generic runner.** Level 1 is built: `tools/playwright/lib/lab-run.mjs`, where an
  `evaluate-<nid>.mjs` holds only its steps and checks. Level 2 would read the steps from `variants.json` (or an issue pack's `run:` section)
  and need no per-issue script for simple issues. **When:** after two or three more issues have an evaluator on the library. **First step:**
  list the actions those evaluators repeat (for example: upload a file into a field, press Tab until X is focused, submit, wait for an AJAX
  response) and build the runner from that list only, not from a guess. Per-issue scripts stay for evidence a generic step cannot collect
  (#3618230 needed the raw `insert` markup and a keyboard check of one button). Reasoning: the 2026-10-14 session; ask the owner before starting.
- **To do (owner, 2026-10-18): a split view with a slider in the viewer.** A fourth mode next to Side by side, Onion skin and Difference
  (`tools/compare/index.html`, the "View" radios): Before and After stacked as in Onion skin, with a divider you drag so Before shows on one
  side of it and After on the other. The owner keeps Onion skin and Difference and thinks some people would find the slider useful. The idea
  came from https://github.com/onion2k/split-view. Neither the owner nor the assistant has evaluated that code or read its licence, so copy
  nothing from it without checking first (`AGENTS.md` rule 11); the viewer's own overlay code is the starting point. **What it must keep:** the
  divider is a native range input with a visible label, like the opacity slider, so arrow keys move it and it works in forced colours. It also keeps Mirror and
  the scroll sync, and in its help text says which frame takes input. **First step:** read `docs/VIEWER-DEV.md` (the security rules), then try
  `clip-path: inset(...)` on the top frame, driven by the slider. Clicks in the clipped part should then reach the Before frame underneath (not checked).
  Ask the owner before starting.

## TODO for the week of 2026-10-09 (session scheduled; owner approves any push or posting)
1. Check both MRs for new commits (`node tools/compare/setup.mjs <slug> --check-patches`, and the issue/MR if the owner pastes new text). If the CSS changed, re-run `node tools/playwright/evaluate-3604037.mjs 3604037-latest` and rebase the proposal patches if they no longer apply.
2. Run the MR's PHPUnit tests on the patched site with proposals A and B applied (not done yet). Record results in `reports/issues/3604037/phpunit/`; update the draft if anything changes.
3. Walk through the #3604037 steps with the owner in the viewer, including keyboard and focus by a person, and forced colours with the built-in switch. Record it (viewer Download log, then `node scripts/coverage.mjs 3604037`).
4. Tighten the two comment drafts from what we learn, still unposted.
5. Viewer redesign: Option B is implemented (2026-10-02). Still to do: the **test matrix** tab from `docs/ui-proposal/index.html` (width by colour mode, status per cell, Apply button; needs a place to store results and a way into the downloaded log); regenerate the stale screenshots in `docs/images/` (`viewer-checks`, `viewer-manual`, `viewer-environment`, `viewer-axe-alert`, `viewer-lighthouse`, `viewer-overview`, `viewer-frames`, `viewer-difference` still show the old layout) with `node tools/playwright/screenshots.mjs`, which was edited but **not run** because it expects the #3619127 variant (start that one first); keyboard and screen-reader pass on the popovers and tabs by a person; `forced-window.mjs` edited but not run (needs `LAB_EMULATION_HEADLESS=1`).
6. If time: Firefox and Safari, a real Windows contrast theme, a real screen-reader pass, Farsi interface translations, the viewer scrolling sideways at about 420 px (the redesign may fix it).
7. Finish: commit and push to drupal-core-lab (with approval), update this file, stop the sites and viewer.

## Learnings from adding the lint step (2026-10-14, cloud session)
- **A lint "fail" can be a tool that never ran.** The first run reported CSpell, ESLint, Stylelint and four `.pcss.css` files as failed. The real cause: core pins `yarn@4.18.0` and the global Yarn 1.22 refused to start, and core's script hides that. `scripts/lint.mjs` now calls this ERROR, not FAIL. Rule 9 again: find the cause before reporting.
- **Use core's own script, not a contrib add-on.** `commit-code-check.sh --cached` against a throwaway index (`GIT_DIR=<env>/.lab-lint/git`) checks exactly the patched files. Its working-tree mode would also pick up `.ddev/` and `settings.php`, and it changes nothing in the checkout.
- **Negative controls on both languages** (a JS/CSS edit and a PHP edit) showed every check can fail. Without them, the first ERROR would have looked like a real result.
- Cloud-container network (not the owner's Mac): git.drupalcode.org, drupal.org and repo.yarnpkg.com are blocked; GitHub zip downloads are cut off. What worked: `setup.mjs --checkout-only --core-url=https://github.com/drupal/drupal.git`, `COREPACK_NPM_REGISTRY=https://registry.npmjs.org`, and Composer falling back to git sources. `phpstan/phpstan` ships only as a zip, so it was built from its git repo into Composer's cache by hand; that is not part of the lab.

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

## Learnings from #3618230 and the tool improvements (2026-10-14)
- **Record the context on every run, not on request.** The 2026-10-08 run could not answer the maintainer's question ("does this happen in
  Default Admin?") because it never recorded the theme. `tools/playwright/lib/lab-run.mjs` now records theme, modules, PHP and Drupal for each side.
- **The decisive evidence was in the AJAX response, not the DOM.** Before stripped the Hide `<button>` on the server (`Xss::filterAdmin()` on
  `#prefix`); only the raw `insert` markup proved where. Every run now keeps the AJAX commands and the `Drupal.announce()` calls.
- **`walkthrough.mjs` was never generic**: it is #3619127's script. Each issue gets an `evaluate-<nid>.mjs` on the shared library instead.
- **Two of my own checks were wrong before the patch was**: a regex that matched "size" anywhere, and counting elements where the theme only hides
  them. Rule 9 again. A run that turned out wrong is now marked superseded (`scripts/run-mark.mjs`), not deleted.
- **A trailing `//` comment swallowed a declaration again** (mistake 5), and `node --check` passed because the result was still valid syntax.
  Only the unit test caught it. Run the tests, not only the syntax check.
- **Core has its own rules for LLM-assisted drupal.org prose** (`AGENTS.md` in any core checkout): at most 180 words, no headers, the line
  "Generated with the help of an LLM.". New drafts follow them; `scripts/check-draft.mjs` checks the form.
- **Status goes stale silently.** `scripts/issue-status.mjs --all` found #3604037 RTBC with five MR commits newer than the patch the lab tested.


## Learnings from the DDEV Coder path and #3593502 (2026-10-16, cloud session)
- **What a Claude Code cloud session can reach (this one):** GitHub (git, raw files), npm and packagist. Refused by the session's network
  policy: every drupal.org host (`www.`, bare, `api.`, `new.`, `updates.`), `git.drupalcode.org` (including its `.atom` feeds),
  `coder.ddev.com`, `ddev.com`, `mgifford.github.io`. drupal.org's API, RSS and app all live on those hosts, so the format is not the
  problem; the policy is. Fix: the owner adds `www.drupal.org` and `git.drupalcode.org` under the environment's Network access >
  Allowed domains. Until then, say plainly that the issue was not read. A web search summary is not the issue.
- **The owner's browser is the bridge.** It can download a merge request's `.diff` (`.../merge_requests/<n>.diff`) and drop it into a
  DDEV Coder workspace's VS Code, which has the same egress filter. `reports/issues/3593502/CODER-PROMPT.md` is built around that.
- **No Docker here:** the `docker` client exists but starting the daemon is refused. Only PHP 8.3, while `main` needs 8.5. A Before
  baseline still works on `11.x`: fetch it from the GitHub mirror, `composer install --no-dev` (about 5 minutes; zip downloads are
  refused, so Composer clones sources), `COMPOSER_ALLOW_SUPERUSER=1 composer dump-autoload` (plugins are off as root, so
  `autoload_runtime.php` is missing), `php core/scripts/dr install standard`, `php -S 127.0.0.1:<port> .ht.router.php`. Show that the
  code under test is the same on `main` with `diff` on the relevant files, and say the PHP version differs.
- **`core/scripts/dr` replaces Drush for the lab:** `install`, `recipe:apply`, `ex:install` (enable a module), `user:login --uid=1
  --url=<site>` (`--url`, not `--uri`), `cache:rebuild`. A one-time link plus `curl -c/-b <jar> -L` gives a logged-in request.
- **Measure a page, not a guess:** `recipes/repro_3593502/peak-memory.php`, included from `settings.php` on both sides, logs each web
  request's peak memory, status and path, including background requests and fatal errors. It found a second failure on Before: with
  no memory limit the 15,000-link menu page still dies at PHP's 30-second time limit. Test time as well as memory.
- **The intake did not read related issues or GitLab review threads** until this session (fixed: `AGENTS.md` rule 15). #3619127's
  write-up had its six threads only because they were read by hand on 2026-10-01. The 26 earlier comment drafts predate this; fetch
  again before any is posted.
- Mistakes: `pkill -f '<pattern>'` killed my own shell, and `pgrep -f` in a Monitor matched itself and never ended (use `$!` and
  `kill <pid>`); a "done" check I wrote into a prompt (`git diff --stat`) was wrong until I replayed it (new files are untracked, and
  stacked patches can cancel out: use `git status --short --untracked-files=all <dir>`), so replay any command you hand to someone
  else; `cd` into `envs/<checkout>` made the harness treat that core checkout as the working directory (use absolute paths and `git -C`).

## Learnings from Gherkin bug summaries (2026-10-16 to 2026-10-18, cloud session)
- **Built and merged (PR #35): `BUG.feature`**, an issue's bug summary in Gherkin, one behaviour per scenario, each with `# Before:` and
  `# After:` results naming the run or person behind them (`scripts/bug-feature.mjs draft|prompt|check|export`, `docs/BUG-FEATURE.md`).
  The owner's idea was "an AI writes the bug summary as a BDD script". The value is in the rewrite, not in the mechanical draft: the draft
  copies the viewer's steps ("in both frames", "press Go"), which `check` flags so the rewrite replaces them.
- **Writing "Then" finds gaps.** The #3618230 rewrite turned up a question no run or person had asked: after Hide, the error is only
  `visually-hidden`, so it stays in the accessibility tree. It is kept as an `@unverified` scenario, "not judged" on both sides, not as a finding.
- **Recording a review:** the owner said "Bug.feature looks good" (2026-10-18). The assistant changed `@draft` to `@reviewed` with a
  "Reviewed by" line quoting those words. A model never marks its own work reviewed; it records a person's review in their name.
- **Check a format against the real parser once:** the checker reads a subset of Gherkin, so the drafts and the example were also parsed
  with `@cucumber/gherkin` installed in the scratchpad (npm was reachable; the guide the owner linked, testquality.com, was not). No new dependency.
- **`main` moves during a session.** Three times here (7, then about 50, then 4 commits); `ready-to-push.mjs` caught it each time. Merge, re-run, then push.
- **Before blaming your change for a red test, run it on a clean `origin/main`** (`git worktree add <scratch> origin/main`). The
  `3615469-pinned` probe failure came with `main` (`54e3930`); the owner fixed it in `857b7bc`. In a fresh container, the `ai-usage` test
  fails with "js-yaml is not installed": `npm install --prefix tools/compare/.deps js-yaml@4` (git-ignored) before `selftest`.
- **Check the PR is still open before adding to its branch.** The split-view to-do was committed minutes after PR #35 was merged.
  Restarting the branch from `main` (`git checkout -B`) was refused as destructive, so `main` was merged in instead: the branch then
  differs from `main` only by the new commit, and a new PR shows only that.
- **Still open from this session:** #3419891's newest run summary says "NOT as expected" on every row while its `results.json` says
  reproduced and fixed, and `EVIDENCE.md` claims `minRows=1, maxRows=6` where the run measured `N/A`. Find the cause before relying on
  either (rule 9).
- Stop-hook "please push" reminders came after almost every turn. Each was answered with "not pushed", and pushes waited for the owner's word.

## Learnings from #3587661 (2026-10-19, cloud session)
- **The Guidepup virtual screen reader calls a checkbox a "textbox".** With `@guidepup/virtual-screen-reader` 0.33.0, html-aria 0.5.3
  and jsdom 30.1.3, `<input type="checkbox">` and `type="radio"` are announced as "textbox", and a `<th>` in `<thead>` as "rowheader".
  The role comes from html-aria's `getRole()`, which returns `textbox` for a jsdom checkbox element but `checkbox` for a plain
  `{ tagName, attributes }` object. Committed evidence shows it: #3619154's tree-diff speech (2026-10-19) has
  "textbox, Create new revision" for a checkbox, and "textbox, Add a new file" for a file input. Rule 7 ("Guidepup is enough") assumes
  roles are right. **Open item for the owner:** pin or fix the dependency, or report it upstream, and mark speech results that name
  form controls as unreliable until then. #3587661 did not use it; Chromium's accessibility tree (`ariaSnapshot`) and axe were used.
- **Composer through this proxy:** GitHub zipball downloads are refused, so packages fall back to `git clone`, which works.
  `phpstan/phpstan` is published only as a download, so it cannot be installed. To get PHPUnit and PHPCS in a scratch core checkout,
  leave out `phpstan/phpstan`, `phpstan/phpstan-phpunit`, `phpstan/extension-installer` and `mglaman/phpstan-drupal` (root
  `composer.json`, the DevDependencies metapackage and the lock). Keep `phpstan/phpdoc-parser`: the coding standard's slevomat
  sniffs need it.
- **Functional tests without DDEV:** `php -S 127.0.0.1:<port> .ht.router.php` from the core checkout, then
  `SIMPLETEST_BASE_URL=http://127.0.0.1:<port> SIMPLETEST_DB=sqlite://localhost/<absolute path>/test.sqlite vendor/bin/phpunit -c core <test>`.
  `curl` to it needs `--noproxy '*'`. Browser runs need `--chromium /opt/pw-browsers/chromium`. The JavaScript tests could not run:
  the installed ChromeDriver (147) does not match Chromium (141).
- **A file upload right after another can be lost.** On the node form, Drupal can drop a file input's change event right after the
  previous upload's AJAX response. The script waits for AJAX to finish, then sets the file again (up to three times) and records
  the attempts.
- **A file renamed on upload changes screenshots.** Uploading the same name again gives `_16.txt`, `_22.txt` and so on, and the longer
  name can wrap. Compare screenshots by region, or upload a fresh name, before calling a pixel difference a change.
