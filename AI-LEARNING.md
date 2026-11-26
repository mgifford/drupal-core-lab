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
- **Guidepup is evidence, not enough.** "It is evidence though. Possibly better than a screen reader recording for automated testing
  purposes. A manual review is always better." (owner, 2026-10-19; this replaces "Guidepup is enough" from 2026-10-01). Real
  VoiceOver/NVDA runs are not done by the lab unless asked; say so in each write-up.
- The owner reviews by looking, and notices things quickly (a frame that stayed blank, a window that was not in forced colours, a stopped site). Say plainly what was and was not verified.
- Close the loop: "push to GitHub" always meant commit, pull --rebase, push, and report the commit.
- **Errors scale: nearly a million sites run core.** Before calling a change good enough, read the issue, its related issues and every merge request's review threads (`AGENTS.md` rule 15), and weigh blast radius, update paths, access and CSRF, atomic saves, accessibility and tests.
- **The owner may have only a browser** (a desktop with DDEV Coder, no Claude app). Put what they will paste (recipe, agent prompt, commands) in the repository, in a PR, e.g. `reports/issues/<nid>/CODER-PROMPT.md`.
- **Where the owner tests** (2026-10-19): mostly a Mac (zsh, BSD tools), some DDEV Cloud (Coder workspaces, Linux, bash), Linux later.
  Commands written for the owner must work in macOS zsh first: no `!`, no inline `#` comments, no `<placeholder>`, and no GNU-only
  tools or flags (`sha256sum`, `timeout`, `sed -i` without a suffix, `readlink -f`, `grep -P`, `date -d`). Use `node` scripts for anything non-trivial.

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
- **The lab's Guidepup runs announce a checkbox as "textbox". The cause is the lab's setup, not a library version.** html-aria
  (0.5.3, the newest release; it gives Guidepup 0.33.0, also the newest, its roles) treats a node as a DOM element only if
  `node instanceof Element` holds for the *global* `Element`. Our scripts set `window`, `document`, `Node` and `getComputedStyle` from
  jsdom, but not `Element`, so html-aria reads the element as a plain object and every `<input>` falls back to "textbox" (a
  checkbox, a radio, a file input), and a `<thead>` header cell is announced as "rowheader". Committed evidence shows it: #3619154's
  tree-diff speech (2026-10-19) has "textbox, Create new revision" for a checkbox. With `globalThis.Element = dom.window.Element`, the
  same snapshot gives "checkbox, Include, checked", "radio, R, not checked" and "columnheader, Display".
  `tools/playwright/label-3587661.mjs` sets it (and removes it after). **To do (lab):** set it in `lib/tree-capture.mjs`,
  `screenreader.mjs`, `screenreader-3093378.mjs`, `linktext-3615469.mjs`, `evaluate-3207233.mjs` and `evaluate-3615469.mjs`. Then
  re-run the speech evidence that names form controls or table headers, or mark it as made before the fix. No version change is
  needed.
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
- **Test with and without Inline Form Errors** (owner, 2026-10-19, for #3587661). IFE changes the form only when there are errors: it
  renders them inline and builds its error summary links from each element's `#title`. A test that only loads the form with IFE on
  proves little. Save with an error (an empty title), check IFE's summary ("1 error has been found") so you know IFE rendered the
  form, then assert. Do the same without IFE.
- **On drupal.org a core change is a merge request.** Core's GitLab CI runs only on merge requests, so the fix and its test go in one
  MR, and its "Test-only changes" job shows the test failing without the fix. When the lab's proposal changes an existing MR, also
  write a patch that applies on top of the MR branch (`proposals/<nid>-on-mr-<iid>.patch`), so the owner can apply it there.
- **Commands in a write-up must paste into zsh.** The owner pasted REPRODUCE.md's block into zsh on 2026-10-19 and got
  "zsh: no such event: 16335": the inline comment `# After = MR !16335` starts history expansion, which stops the whole paste. Without
  `setopt interactivecomments`, zsh also passes `#` and the words after it to the command. Keep command blocks to bare commands, with
  no `!`, no `<placeholder>` and no `a|b`, and explain them in a list under the block (`reports/_templates/REPRODUCE.md` now says so).
  On 2026-10-19 no other committed Markdown had `!` in a command line; many still have inline `#` comments.
- **Point people at the right layer of the markup** (owner, 2026-10-19, #3587661). Comparing the checkbox's `<input>` on both sides
  showed no difference; the fix was a `<label for>` just before it, in the same wrapper `<div class="form-item">`. A label check
  should say which element to inspect (the wrapper) and what to search for (a `<label>` whose `for` is the input's id), not just the
  text, which can also match an `aria-label`. An invisible label (`#title_display = 'invisible'`) comes before the input.

## Learnings from #3636143 READMEs, #3637163, #2942404 and the CSS build (2026-11-19 to 2026-11-20)

- **Say what a folder is.** Run folders with dozens of PNGs were unreadable on GitHub. `scripts/run-readmes.mjs <nid>` now writes a README per run (paired Before/After images, one-line meaning per state) and an index. It names the evaluation from the run's own `SUMMARY.md` heading; the first version assumed every run was the toggle and mislabelled #3637163's READMEs (fixed in PR 91). Do not hard-code one issue's vocabulary in a generator.
- **Scope calls from the owner.** #3637163 stays hex-only: `red` and other named colors are valid CSS but rejected on purpose, and no tests for `rgb()` and the other forms; broader color validation is a separate stand-alone patch. Keep a fix to what the issue asks.
- **Less text.** Owner, on the custom color field: too much text, and it was duplicated when wrong. One short hint under the field ("Six-digit hex, for example #336699. Then check its color contrast."); the client error does not repeat the format.
- **A check can fail because of when it is pressed.** A viewer check that reads a message block fails ("Setup not reached") if no message is on the page. Messages exist only after an action, so the precondition says which step comes first and every probe must be read-only (`selftest` rejects probes with assignments, `dispatchEvent`, semicolons or over 400 characters).
- **A clean first run proves little.** A leftover lime accent in both sites' settings made a run fail for the wrong reason; runs must start from a known state, and a verdict that disagrees with the last run is a cue to look at the starting state, not the patch.
- **A fixed lint tool can still lie.** A contrast check that measured a transparent button as readable passed until the background was composited over what is behind it.
- **Read the old merge requests against `main` before rerolling.** #2942404's MRs were 20 months old; main already had the design by another route (#3587678). Three of twelve file patches applied cleanly and would have broken main's tests. "Applies" is not "still right". Two interdiffs plus a per-file table settled it without a build.
- **Deep clones for old branches.** `new-issue.mjs` needed `--depth 20000` for a 2024 base; 300 and 4000 both failed with "No common ancestor".
- **Several sessions can share one repository.** An earlier session left uncommitted files in `~/wt-2942404` (a fixture module, a screen-reader script, dependency edits). `git status` there before building; commit another session's files separately and say they were not run. A lockfile that npm rewrote (`*` to `latest`) must not travel with a half-declared dependency; it was left out.
- **Worktrees and the viewer.** `~/wt-2942404/envs` is a symlink to the main checkout's `envs/`. The `drupal-compare` DDEV name belongs to the main copy, so `tests/lab/test-mr.test.mjs` "dry runs" fails when the unit tests run from a worktree while the viewer runs (not a regression). A 502 at https://drupal-compare.ddev.site/ means the DDEV proxy is up and the viewer process is not: start it with `node scripts/lab-env.mjs start <slug>` from the copy that has the variant registered.
- **Generated CSS is now a service, not a memory.** `node scripts/css-build.mjs <slug>` checks, and with `--build` rebuilds, compiled `.css` with core's own `yarn run build:css` (Corepack's Yarn through a shim; the shim's `PATH=` must be `export`ed, an assignment in front of `cd core && yarn` only reaches `cd`). Imported patches are never rewritten; `--corrective` writes a follow-up and an interdiff. MR !17738's current head is consistent: the mismatch from core's CI is not present in it (checked with the real toolchain, `tests/lab/real/css-build-real.mjs`). AGENTS.md rules 18 and 19.
- **Lab environments are slow and heavy.** Each pair takes about 10 to 15 minutes to build; keep one comparison running; stop the old one first (`lab-env.mjs stop <slug>`).
- **Open at the end of this session** (details in `reports/issues/2942404/STATUS-2026-11-20.md`): Variant C patch never run in a browser; the extended `evaluate-2942404.mjs` only syntax-checked; `EXPLAINER.md` not written; no screen-reader results; the CSS service not run under DDEV or Coder (host only); PRs 91 and 92 were merged while their GitHub checks were still pending (local `selftest` passed).

## Learnings from the toggle, skip-link and status-message work (2026-11-19 to 2026-11-23)

- **Test every URL before handing it over.** A "404: No Route Found" at `drupal-compare.ddev.site` (even for `/`) means the `drupal-compare` DDEV proxy project was stopped (`ddev start` in `tools/compare/site`); a 502 means the viewer node process is down. Check with `curl`, and say so when a page was not opened. A route written in another worktree is not in the viewer that is running.
- **Never delete a run folder you did not make.** Re-running an evaluator after `rm -rf reports/issues/<nid>/playwright` removed another session's untracked runs; they came back from a snapshot commit. Write new runs beside the old ones (or `--out`).
- **One comparison pair at a time, and other sessions count.** Another session started its pair and stopped the baseline site and repointed the viewer more than once. Check `node scripts/lab-env.mjs status` and `/api/state` before starting, work in a separate worktree, and restart a stopped baseline with `ddev start` in its folder.
- **Close out before the next issue.** `node scripts/close-out.mjs <nid> [--commit]` lists uncommitted and untracked files (this issue or not), flags run folders with no `results.json`, and names running sites. An aborted run is kept with an `ABORTED.md`, never deleted.
- **Real VoiceOver through Guidepup works, but is fragile.** One-off setup: `npx @guidepup/setup setup`, then `npx @guidepup/setup install` inside `tools/playwright` (assets are per project). It can start in Recovery mode, and a VoiceOver Utility left open makes `osascript` time out ("VoiceOver cannot be started"): quit it and rerun, one side at a time (`screenreader-2942404.mjs --sides=after`). Open Safari with `open -a Safari <url>`, not AppleScript `make new document`. Jump to the page `h1` with `findNextHeading` rather than tabbing through the sidebar. VoiceOver speaks aloud while it runs.
- **Guidepup's phrase log is thin evidence.** After pressing a button the log held only "Error message", so it cannot show whether a polite status or a warning was announced. The virtual reader reports names, roles and structure from a DOM snapshot and needs a `CSS.escape` shim under jsdom. A person listening is still needed for announcements.
- **A role mapping is a design decision, not just markup.** The #2942404 region option puts a warning inside `role="status"` (polite) where main uses `alert` (assertive), while a JavaScript warning stays `alert`. Measure both paths.
- **Measure the rendered colour, not the token.** The toggle's contrast was read from the painted border over the effective background; forced colours need a real outline and a `Highlight` colour because shadows are not drawn there. A check that composites alpha is worth the lines.
- **A patch and its interdiff need `git apply --check` at each declared base** (the MR base and current main), and the full patch must include what the tests need. Scratch worktrees (`git -C envs/core.git worktree add --detach`) keep the check away from the built sites.
- **Environment traps.** The agent's `GIT_CONFIG_*` variables stop lab scripts that run `git -C envs/core.git` (unset them). On macOS, `sed` with `#` as the separator and `sed -i` without an extension fail; use the edit tool. `npm install` inside `tools/playwright` can pull a new Playwright; run `npx playwright install chromium` when a launch says the executable is missing.
- **Merge `main` before the PR.** `serve.mjs` conflicted with a field another session added (`repo`); keep both sides.
- **Open at the end:** #3636143 has no MR-only run (`3636143-pinned` not built), the lighter treatments were not measured, and Firefox, WebKit and zoom were not run; #2942404's live announcements need a person; #3637339 needs a person's keyboard pass; nothing has been posted to drupal.org.

## Learnings from CLEER energy accounting (2026-11-24 to 2026-11-25, `50e9b87`)

- **Check what the dataset publishes before designing the schema.** CLEER's public `data/v1` carries only per-session figures for six fixed workloads. Per-token intensities are deliberately withheld: its build script has an IP guard that fails if a `per_token`, `e_in`, `e_out` or `cached_tokens` column appears, and the token counts behind each workload are withheld too. The brief's "tokens x coefficient" formula cannot be computed from published data. The exact wording, the guard and the licence are recorded in `docs/CLEER.md`; read that before touching the estimator.
- **The dataset's own `energy_wh_per_usd` is the unblock.** `estimated_wh = our_cost x published Wh/USD` uses two published numbers and a measured cost, so no withheld coefficient is reconstructed. Within a use case the ratio is stable (median 4.45% spread across the three tiers of 35 closed models); choosing `chat` instead of `agentic` changes the answer about 2.1x, so the use case is configured per activity and recorded on every estimate. This is a documented departure from the per-token formula, labelled `cost-bridge-v1`.
- **Licence first, and pin a SHA.** CLEER data is CC BY-NC 4.0 (the repository's Apache-2.0 covers code, not data). Non-commercial sharing is allowed with attribution; commercial use needs written permission. Upstream has no tags or releases, so the commit SHA is the only immutable pin, and `models.json` has a published SHA-256 to verify against. The owner approved vendoring 515 KB on that basis; the NOTICE says the dataset must go if the use ever becomes commercial.
- **Do not fabricate coefficients.** Where data is absent, report `unavailable` with a code. Test arithmetic with fixtures marked `"synthetic": true`. The owner accepted a coarse estimate that says so; they did not accept precision that the data cannot support.
- **Resume trap: check the branch, not the remembered one.** This session resumed with the worktree on `issue-focus-action` (unrelated) while the resource work had advanced on `infra/resource-audit`. Run `git branch --show-current` and `git status` at the start of a resumed turn. Recovering meant reverting two modified files, switching, and re-applying the schema and events changes on the new base; the untracked `tools/resource/energy/` survived the switch.
- **Derived is not the same as rewritten.** The event schema went to 1.1.0 with a tolerant `schema_version` enum and an optional `energy` block, but energy is computed at report time and never written to the ledger. That keeps recalculation idempotent and leaves every historical token count and timestamp untouched. I initially over-read the raw/derived rule; the owner's correction (derived fields with `computed_at`/`method_version` are fine) was right.
- **Keep per-event estimates out of the JSON twice.** `energySummary()` attaches them as a non-enumerable `Map`; `publicRows()` uses it to enrich grouped rows, and `JSON.stringify` and `assertPublic` skip it. That avoids 2,235 duplicate objects in the published report.
- **`--check` must normalise every generated value.** Composing energy into `summary.json` broke `report --check` until the canonicaliser also dropped `energy.generated_at` and `energy.overhead`; the Markdown and HTML checks needed the same scrub for compute timings. Strip each new timestamp or timing, or the check is permanently red.
- **Wrap every table and let long hashes wrap.** The CLEER page's first two tables were outside `.tablewrap`; a 73-character checksum forced 657 px at a 320 px viewport, and 200% text overflowed by 25 px. `cleer-page.mjs` found it. Every table goes in a focusable `role="region"`, and `code { overflow-wrap: anywhere; }` is set.
- **A running DDEV router breaks `cloud-origins.test.mjs` locally, not in CI.** The proxy forwards its own hostname to the router, which answers 404 where the test expects 502 ("Not built"); the Host gate is fine (no 403). Check `docker ps` for `ddev-router` before blaming the proxy, and do not stop another session's environment. This is why a local selftest can be red while the same commit is green on GitHub.
- **Kill only Playwright's Chromium.** A timed-out run left `Google Chrome for Testing` processes, and a later run then timed out waiting for `#summary`; the debug page loaded in seconds. Kill processes whose profile contains `playwright_chromiumdev_profile`, never the user's normal Chrome, and wrap test scripts in `try/finally` so the browser closes on failure.
- **A commit message with `$` is a shell-expansion trap.** The first pushed commit read ".19 cost covered" instead of "$237.19" because the message went through an unquoted shell. Write messages to a file with a quoted heredoc (`<<'EOF'`) and check `git log -1 --format=%B`. That commit was already pushed, so correcting it needed `--amend` plus `--force-with-lease`, with the owner's explicit approval.
- **A missing patch-change record blocks CI.** The pre-existing #3636143 patch change had no `patch-change.mjs record`, so `selftest` failed on the pushed branch (it passed once recorded). Record the owner's `--by`/`--reason`; the amended message says this commit does not change the patch itself.
- **The bridge's main unverified assumption is the cache mix.** Our cache-read share is 98.4% of tokens; CLEER's workload cache share is unpublished. CLEER prices cached energy as a ~10% ratio and our cost model prices cached tokens similarly, so the ratio should transfer, but it is not proven. Say so wherever the number is quoted, and never call the band a confidence interval: it is a Monte Carlo configuration spread.
- **Numbers for the record:** 2,235/2,235 AI events estimated, $237.19 covered, 1.68 kWh central, workload band 1.68-1.73 kWh, configuration band 1.01-2.35 kWh, 2.16x chat-vs-agentic sensitivity. `claude-sonnet-5-5` and `claude-opus-5-5` remain explicit, unreviewed proxies to the previous CLEER point release; the owner has not reviewed them.
- **What worked, repeat:** pin a public dataset with SHA + checksum + NOTICE; verify offline; compute derived values at report time; test with synthetic fixtures; run accessibility checks on both pages and fix what they find; record coverage and denominators next to every figure; force-push only with `--force-with-lease` and explicit approval.
- **Open:** the two proxy mappings need a human decision; carbon (Phase 7), local and CI infrastructure energy (Phase 4) and energy per verified outcome (Phase 3) are not started. The per-token coefficient import path is built and tested, but no real dataset exists to import.


## Learnings from #3603162 Default Admin SVG revision (2026-11-25 to 2026-11-26)

Worked on MR !16166 at `fe4adb4f`, rebased its 11 commits onto current `main` `0387fb94`, and added two revision commits, `0d00037e` and the spelling fix `d4728a2a`. Pushed a new issue-fork branch `3603162-svg-revision`; MR !17967 is open. The original MR branch was not rewritten. Evidence is in `reports/issues/3603162/` and in the public [SVG Review revision report](https://mgifford.github.io/svg-review/proposed/reports/revision-2026-11-25.html).

### What was verified

- 64 SVGs pass the structural validator; the reference audit has 0 undefined, missing or unused references.
- 46 external regression tests pass.
- 14 theme Unit/Kernel PHPUnit tests pass with 209 assertions; 8 functional tests need a test web server and were not counted.
- Axe reports no WCAG A/AA violations on permissions, status and node-add pages.
- Real-browser evidence covers permissions, autocomplete, sticky loader, media-library controls, status icons, tabledrag, selects, RTL, reduced motion and forced-colours emulation.
- The complete patch and interdiff both apply; the complete patch reproduces the branch theme.

### Mistakes and traps worth not repeating

1. **A `<input type="submit">` cannot host a pseudo-element.** The historical sticky-loader fix used `::after`; it could never render. Check the rendered tag before choosing a CSS mechanism. The replacement uses pretinted background images and a `.button` selector that outranks the top-bar padding rule.
2. **External SVG backgrounds do not inherit `currentColor`.** A mask takes its paint from the consuming element; a background image has its own rendering context. Classify each consumer before choosing mask, inline SVG or pretint.
3. **The theme's specificity hack can invert the cascade.** `:is(#extra-specificity-hack, [data-drupal-admin-styles])` beat the loader padding and the dark-mode rules beat forced-colours rules. Scope dark artwork with `@media (forced-colors: none)` and verify matched rules, not source order.
4. **A mask's paint is `background-color`.** In Chromium forced-colours emulation, `CanvasText` survived on the masked pseudo-element and kept status icons visible; `forced-color-adjust: none` was not needed. Record that emulation is not native Windows High Contrast.
5. **Do not measure RTL by toggling `dir` on a loaded page.** Logical padding transitioned through 12/36 px and produced a false reading. A fresh document with `dir="rtl"` gave the correct 36 px left / 12 px right and exposed the real overlap risk.
6. **Pixel-identical SVGO output can be larger.** `tabledrag-handle.svg` grew 30 bytes because arc-flag spacing expanded; `menu.svg` grew 16 bytes from intentional ARIA metadata. Gate optimisation on both bytes and pixels, and report exceptions.
7. **“Adopted”, “smaller” and “new” are different counts.** The first summary said 45 SVGs were adopted; only 41 existing SVGs are smaller, two adopted files are larger, and two adopted files were new pretints. Define the denominator before quoting a percentage.
8. **A definition is not a consumer.** Resolve CSS custom-property alias chains to files and keep literal source references separate. An absent source reference still does not prove an icon is unused.
9. **Static harnesses cannot accept interaction-dependent icons.** The sticky loader needed Drupal's real progress markup; the media edit control needed the theme's own class inside a real selected media item. Record every injected state.
10. **GitHub Pages does not list directories.** The screenshot directory returned 404 until an `index.html` was added. Publish report directories as real pages.
11. **Issue-fork write access is account-specific.** SSH can authenticate as `@mgifford` while the project rejects the push. Prepare a bundle and exact commands; do not assume read access implies write access.

12. **Drupal CSpell enforces US spelling in code comments.** `colour`, `colours` and `grey` failed the commit check even though they were only comments. Use `color`, `colors` and `gray`. Run `cspell` on the changed CSS/Twig before pushing; the bot checks the patch lines, not the whole file.

13. **A follow-up push can race an automated commit.** The remote branch already contained `d4728a2a` with the same content as the local spelling fix `172c07ef`. The push was rejected as non-fast-forward. Fetch, compare content, and adopt the remote commit; never force-push over it.

### Process notes

- Keep the original 11 commits and add clearly described revision commits. Do not rewrite the existing MR author's branch.
- The `drupal-core-lab` working tree had many unrelated changes. Push only `reports/issues/<nid>/` from a clean `origin/main` worktree. The same applies to generated HTML: regenerate only the pages that changed.
- The MR creation URL in the push hint (`/issue/.../-/merge_requests/new`) returned 404. The working route is the target project with the fork's source project id: `/project/drupal/-/merge_requests/new?merge_request[source_project_id]=225946&...`.
- The Core Lab issue index generator (`scripts/index-issues.mjs`) currently fails on unrelated `mr.sha` data, so the direct `reports/issues/3603162/index.html` page is the usable link.
- Local cleanup: remove temporary worktrees and transfer bundles, restore the shared Drupal site's theme, settings, password and test modules, and keep the active branch worktree clean.

### Open items

- MR !17967 exists and is mergeable. Its description is still the short auto-generated text; replace it with the prepared description that links the interdiff, revision report and component evidence.
- The Drupal.org issue comment draft is ready at `reports/issues/3603162/ISSUE-COMMENT-DRAFT.md` (128 words, with LLM disclosure). It has not been posted; rewrite it in the owner's words first.
- `tabledrag-handle.svg` remains 30 bytes larger. It is documented and was not reverted to avoid invalidating the pushed branch for a negligible byte change.
- Functional PHPUnit, native Windows High Contrast, Firefox and WebKit remain untested. No WCAG 2.2 AA claim.

## Learnings from #2848307 table and tableselect inline errors (2026-11-26)

Worked on the open core issue #2848307 and MR !16355. The change replaces a recursive error renderer with table/tableselect theme rendering, fixes the modules uninstall form independently, and records a before/after Lab comparison. Evidence is in `reports/issues/2848307/`; the core patch was not pushed.

### Traps worth not repeating

1. **Copying a DDEV environment copies its worktree pointer.** `cp -a envs/baseline-3083103 envs/issue-2848307` copied a `.git` *file* pointing at `envs/core.git/worktrees/baseline-3083103`, so both trees shared one worktree index. `git reset` in the copy could have changed the original's index, and the lab patch-state file was the same. Replace the copied `.git` with an independent clone/worktree before running git commands in a copied environment, and check `git worktree list` afterwards.
2. **`git archive` is not a full core tree.** Drupal's `.gitattributes` marks test directories `export-ignore`, so `git archive <sha>` silently omitted `core/modules/*/tests/...` and a patch adding tests failed with "No such file or directory". Use `git checkout-index -a --prefix=/tmp/base/` (or a worktree) when a test fixture must be present.
3. **Patch state lives in the git directory, not the web root.** `envs/<env>/.git/lab-patches/state.json` records the applied patch hashes. A copied environment inherits it and reports the old patch. Remove it and re-run `setup.mjs --refresh-patches`; the `.lab-patches-applied` name file is only a legacy hint.
4. **A wrapper theme hook declared with `variables` gets only those variables.** `inline_form_errors_table` initially declared `variables` and received no `#children`, so the table rendered as an empty div. A wrapper around a render element needs `'render element' => 'element'` so `$variables['element']` carries `#children`, `#errors` and `#id`.
5. **A table pre-render callback must run before `preRenderTableselect()`.** That callback renders the child checkboxes immediately. Appending the IFE callback to `#pre_render` was too late to suppress inherited errors; `array_unshift` is required.
6. **`#error_no_message` hides the message, not the invalid state.** `RenderElementBase::setAttributes()` adds `aria-invalid="true"` whenever `#errors` is set and the element is validated. To stop every row being invalid, clear the inherited `#errors` on the children (and keep an own-error marker on the table), not just set `#error_no_message`.
7. **A Guidepup virtual reader started inside a table skips the table's own announcement.** Starting at `table#...` began with `rowgroup` and never spoke the `aria-describedby` description; starting at the wrapper/form spoke `"table, A table with an error, No rows selected."`. Start outside the element whose name/description you are testing.
8. **A summary-link fragment needs a focusable target.** The table is not focusable, so `#edit-table` changed the hash but left focus on `BODY`. `tabindex="-1"` on the table makes the link move focus to it without adding a tab stop; the next Tab then enters the checkboxes.
9. **Adding a variant makes `cloud/` stale.** `build-cloud.mjs --check` fails until `cloud/variants.json` is regenerated. Run `node scripts/build-cloud.mjs` and commit the generated file.
10. **Issue-variant probes are validated as one expression.** A probe with `const`, `if` or semicolons failed `tests/issue-pack/validate.test.mjs`; probes over 400 characters failed too. Use one assignment-free expression, and run that test file after editing `variants.json`.
11. **`ready-to-push` can be red for machine reasons.** In an independent clone, `test-mr` stops when the real DDEV registry already has `drupal-compare` at the main lab; do not unlist another session's projects to make it green. The selftest also needs the main lab's ignored `tools/compare/.deps` and `tools/playwright/node_modules` linked for `js-yaml` and `jsdom`; restore the tracked `tools/playwright/node_modules` symlink before committing.
12. **The main lab tree was very dirty.** 134 unrelated changes from other sessions were present. A worktree from `origin/main`, explicit `git add` paths, and a check of `git diff --cached --name-only` kept the push to this issue only.

### What worked, repeat

- Read the rendered DOM before choosing the architecture: the uninstall table is hand-written, the `modules` branch is never rendered as a table, and `tableselect` child checkboxes inherit the parent error.
- Keep the error on the element that owns it and mark only tables with their **own** error (`#inline_form_errors_own_error`); an inherited parent error must not be repeated at the table.
- Preserve the table's native semantics. A `form_element` wrapper would print an invalid `<label for="<table id>">`; a fieldset/legend only in the error state needs a label source and changes the layout. Associate the error with the table and make the summary link focus it.
- Test the before side with the same test-only fixture, not a different page. The regression was concrete: two repeated messages and two invalid checkboxes before, one message and zero invalid rows after.
- Recompute and record patch hashes and regenerate the interdiff after every patch change; the first interdiff went stale within one edit.
## 2026-11-26: #3630425, shared-machine builds and real AT

- **The DSH workspace sandbox blocks DDEV's global state.** `ddev config` needs to write `~/.ddev/project_list.yaml`; under workspace-write it fails with `operation not permitted`. The setup build needs the one-shot wider permission, or must run from the owner's terminal.
- **Setup is serialized by `envs/.setup.lock`.** "Another setup is already running (pid ...)" is expected while another comparison builds. Wait, do not start a second one. A watcher loop is fine, but propagate the child status (`exit $?`), not `echo` after `wait`.
- **Safari's AppleScript `document` is a window property, not an element.** Inside `tell (first window whose id is N)`, `document 1` raises `-10008`; use `document of (first window whose id is N)` or `current tab`.
- **The agent process cannot control Safari or VoiceOver.** macOS returns `-10004` privilege violation or `osascript ETIMEDOUT`. Real VoiceOver runs must come from the owner's terminal; the agent can still build, evaluate and read the recorded phrases.
- **Default Admin hides the `Order` column.** The DOM has three `th` cells but the accessibility tree exposes two headers; the actions header is the second DOM `th` and the third logical column. The unlimited widget renders the two recipe defaults plus one empty row: 3 initial, 4 after Add, 3 after Remove.
- **The Guidepup virtual reader does not tie a header to a cell.** It reads `columnheader, Operations` at the header row but `cell`, `button, Remove` at the button. Do not claim per-button column context from it.
- **AJAX screenshots need a settle step.** Scroll and focus changes made the whole table differ by 1/255. Normalizing scroll, blurring the active element and waiting 600 ms made the initial and remove captures pixel-identical; report the remaining 9 pixels at 1/255 as anti-aliasing.
- **Guidepup's `keyboardCommands` getter throws until VoiceOver is running.** Read it only after a successful `start()`.
- **`<stamp>` in a shell block is redirection.** zsh parses `<` before it runs anything. Use a variable or `find ... | sort | tail -1`; remove angle-bracket placeholders from copy-paste commands.
- **Compare PNGs by pixels, not bytes.** Record differing pixel count and maximum channel difference; one-level differences are anti-aliasing, not a layout change.
- **A failed screen reader run must not save `completed`.** The final status write overwrote the error path; `process.exit(1)` after the error save prevents it.
## Learnings from the #3606655 review (2026-11-26)

Reviewed MR !16432 at `170be9e3` against core `ced1e263` (`12.0-dev`).

- **Scope is the issue summary, not the MR description.** The MR had pivoted from a server-rendered value (`data-color-scheme`, `color_scheme` Twig variable, capability-gated cache context) to an invariant `auto` plus a `DrupalColorScheme` cookie and a head script. No issue comment mentions the cookie, so the pivot existed only in the MR description. Compare the summary's "Proposed resolution" list to the diff first; a design recorded only in the MR is a blocker, not a nit.
- **A rebase that claims "PHPStan fixes" can still sit on the wrong branch generation.** `user_update_11401` is 11.4 numbering, but `const VERSION` was `12.0-dev` at the MR base, at the rebase base and at current main, and other modules already used `12000`–`12100`. Check the version at the base and at main, then the highest existing hook number.
- **The shared bare clone is shallow: `merge-base` fails.** Take the MR `.diff` from the GitLab endpoint, pin its sha256, and test application with a temporary index: `GIT_INDEX_FILE=/tmp/i git --git-dir=envs/core.git read-tree <sha> && GIT_INDEX_FILE=/tmp/i git --git-dir=envs/core.git apply --cached --check <patch>`. That answers "does it still apply to main" without a checkout.
- **Cacheability debug headers are a container parameter, not a setting.** `$settings['http.response.debug_cacheability_headers']` does nothing. Write `sites/default/services.yml` with `parameters: http.response.debug_cacheability_headers: true`, then rebuild caches.
- **Mutagen hides settings edits for seconds.** `update.php` kept returning the `update_free_access` denial after the line was appended on the host; `ddev exec tail` showed the container had not received it yet. Verify inside the container before concluding a setting is ignored.
- **SQLite in the core-dev container has no `NOCASE_UTF8`.** Queries using the `name` index fail with "no such collation sequence"; query and update by `uid`, or read all rows. With `--omit-containers=db`, the database is `sites/default/files/.sqlite`; `.ht.sqlite` is the empty test file.
- **Form API POSTs need the submit button's `op`.** Without it the form re-renders with a 200 and nothing saves; every preference "failed" until `op: 'Save'` was added to the probe payload.
- **Detect login by the session cookie, not the "Log out" text.** One-time-login redirects (`?check_logged_in=1`) and theme variants made text matching unreliable; `SESS`/`SSESS` in the jar is decisive.
- **Attribute an overflow before reporting it.** `/user/edit` at 320 px had `scrollWidth 387`, but Before and After were identical, so it was the theme's pre-existing layout, not the MR.
- **A cookie-driven kill switch can be driven by the client.** Sending `Cookie: DrupalColorScheme=dark` anonymously made every response `UNCACHEABLE (response policy)`; without the cookie the second request was a HIT. Kept out of the public report as a possible cache-bypass and told the operator. Test with and without the cookie.
- **A worktree inside the clone cannot pass `selftest`.** `test-mr.mjs` refuses a second copy inside the first (DDEV project names are global), and `jsdom` was missing. Prepare the commit with plumbing (`read-tree`, `--work-tree add`, `write-tree`, `commit-tree`, `push <sha>:refs/heads/<branch>`) rather than switching branches in a tree another session is using.

Open after the review: the design mismatch and the 17 unresolved threads need maintainer decisions; no person has done the keyboard or screen-reader pass.

## Learnings from #3426468 Navigation active-state evaluation (2026-11-26)

Built the `3426468-latest` pair on core `a48087f26ec`, measured nine browser/mode combinations, and pushed revision v2 on the `3426468-active-indicator` branch. The original v1 patch is preserved; v2 is a four-file interdiff (comments and a Default Admin theme colour) on top of it. The bar is the durable cue: light 6.69:1, dark 10.21:1, forced 21:1, and it survives collapse, 480 px and RTL. The active text is 5.82:1 light; the active-vs-inactive delta fell from 2.99 to 2.32, so colour alone would not carry the state.

### Mistakes and traps worth not repeating

1. **A theme can override a module custom property after the module rule.** Default Admin re-declared `--toolbar-button-current-color` after the module, so v1's `gray-990` change produced no rendered difference at all. Read the theme's cascade and the computed colour; do not trust a variable change in the component. In this theme `gray-990` is an alias for the dark active blue (`accent-600`), not a neutral gray.
2. **Chromium can serialise computed colours as `lch()`.** The dark-mode run returned null contrast until the evaluator normalised every colour through a 1x1 canvas. Parse `lch()`/`oklch()` or measure through the browser; do not assume `rgb()` strings.
3. **Wait for the admin sidebar slide before measuring.** `data-admin-toolbar-animating` and a negative `x` were the only clues; a mid-transition rect invented a clipping failure. Wait for `#admin-toolbar` to settle, then measure.
4. **The active trail can be closed on load (#3438046).** The current submenu dot is hidden until Structure is opened. Open the trail with keyboard Enter; in RTL a pointer click on the next trigger was intercepted by the open popover's safe-triangle.
5. **Hover is not a touch gesture.** At 480 px, skip hover checks and record them as not tested; do not fail a patch for a state the viewport cannot produce.
6. **Firefox's default focus ring can be 1 px dotted.** The pre-existing “Collapse sidebar” button uses it; require a visible ring (>=1 px), record the inconsistency, and keep the theme's 2 px ring as the target.
7. **Coverage's primary variant is the `-pinned` one unless `coverage.active` selects another.** The validator did not allow the key that `coverage.mjs` reads; it now does. Without it, a local proposal in `-latest` is not the primary row.
8. **Shortcuts is gone from core at this commit.** `core/modules/shortcut` and `navigation_shortcuts` do not exist, so the issue's case (c) is N/A on a Standard install, not a pass.
9. **A clean worktree still fails two selftest checks for environment reasons.** The tracked `tools/playwright/node_modules` symlink is depth-specific, and `test-mr` stops because the main copy owns the `drupal-compare` DDEV name. `ready-to-push --skip-selftest` is then an honest base check only if the variants, cloud and docs checks were run separately and the environment-blocked rows are named.
10. **The push branch can contain other work.** The main tree had 134 unrelated changes and the current branch was a 3155130 branch two commits ahead. Create a new branch from `origin/main`, copy only the issue's files, merge its variant entry, and push from there.

### Process notes

- The final branch is `3426468-active-indicator` (two commits before the learnings commit: the evaluation and the coverage/cloud fix). It was pushed from `/tmp/drupal-core-lab-3426468-push`, a clean `origin/main` worktree.
- Parallel sessions had uncommitted changes in `AI-LEARNING.md` and many `reports/issues/` folders. Do not append to or commit a shared file from the dirty main tree; do it in the clean worktree.
- The drupal.org issue stayed unassigned with 32 comments throughout. Nothing was posted, no MR was opened, and the issue status was not changed.

## Learnings from the #3370946 review and multi-session coordination (2026-11-26)

Reviewed the refresh material for #3370946 and, at the owner's request, coordinated 24 concurrent sessions in this
workspace. No environment was built; the issue stays unassigned with 121 comments and MR !4479 at `1ff37e70`
(2026-01-15).

- **Separate sessions are separate roots.** `list_agents` shows only the current session, the team board is per-root,
  and there is no cross-session message tool. Coordination happens through the shared filesystem: companion files in
  `reports/infrastructure/` (`COORDINATION-2026-11-26-session-<id>.md`), the lease primitive, and the owner. Two
  other sessions reached the same conclusion independently; do not look for a messaging API.
- **Leases are the only ownership signal.** `node scripts/lab-env.mjs leases` showed one expired lease for an
  environment nobody was using. An expired lease is noise, not ownership: release it rather than leaving it.
  `lab-env.mjs release <slug> --force` is safe when `leases` already reports it expired.
- **The viewer is machine-wide.** `stopViewer()` runs `pkill -f tools/compare/serve.mjs`, so any session's
  `lab-env start` takes every other session's viewer. Build and Playwright evaluation do not need it; only the
  side-by-side view does. Serialise that, not the whole run.
- **Disk is the real shared resource, and its ceiling is outside the repo.** The repository is 10 GB, of which
  `envs/` is 8.8 GB, while `Docker.raw` is 228 GB apparent. Repo-side GC can recover a few GB at most; deleting
  environments does not fix a host that is 100% full. At 100% even read-only commands fail with
  `ENOSPC: no space left on device`, and `docker builder prune` returns `context canceled` because the daemon cannot
  answer. Get free space outside Docker first.
- **Verify claims about the workspace from git and the filesystem, not from transcripts.** A session inventory built
  by text-search attributed environments a session never created (including a `3370946` pair that never existed).
  `ls envs/*`, `variants.json` keys and `git ls-tree` are the reliable sources.
- **Check patch applicability before provisioning.** With no checkout:
  `GIT_INDEX_FILE=/tmp/i git --git-dir=envs/core.git read-tree <sha>` then
  `GIT_INDEX_FILE=/tmp/i git --git-dir=envs/core.git apply --cached --check <patch>`.
  The #3370946 refresh patch does not apply to `0387fb94`: the `block.post_update.php` hunk conflicts and two theme
  config paths no longer exist.
- **Theme assumptions rot fastest.** At `0387fb94` `core/themes/` holds only `default_admin`, `stark` and
  `starterkit_theme`. Any patch, test or config touching Claro or Olivero is stale by construction — the
  #3370946 design was written around "default in Claro, other themes opt in", which no longer names a theme in core.
- **Re-check "existing test" claims against the tree.** #3370946's brief asked to "modernise the existing
  PageTitleBlockTest"; no such test exists on main (`PageTitleTest` does, and covers escaping). The patch's test is
  new coverage, not a modernisation.
- **Push from a clean worktree, not the shared dirty tree.** The working tree held 170 uncommitted files from other
  issues and sat on another issue's branch. `git worktree add .wt-3370946 -b <branch> origin/main`, copy only the
  issue's files, commit and push there. Add the worktree path to `.git/info/exclude` so it does not appear as
  untracked. The same pattern is already recorded above for #3426468.
- **Owner decisions can invert the brief.** For #3370946 the owner asked for *more* configurability, not less, and
  for a fresh MR rather than a rebase. Record such answers in the issue folder (`DECISIONS-2026-11-26.md`) with
  their consequences, so the next session does not re-litigate a 24-page brief.
