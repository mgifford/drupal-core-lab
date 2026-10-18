# Commands: the lab's scripts and their usage

Moved out of `AGENTS.md` on 2026-10-15 so that file, which every session loads, stays short (AI-usage option C: scope the starting context). The text is unchanged except where noted.
The short index is in `AGENTS.md`.


Everything is driven by **variants** in `tools/compare/variants.json`. A variant says which core (a pinned commit, or the latest
`main`), which two environments, which patches, the recipe that creates the starting state, the steps, and the checks.

    node scripts/doctor.mjs [slug]                       # preflight: prerequisites, disk, what is running
    node scripts/doctor.mjs <slug> --network [--core-url=<mirror>]   # can the hosts a build of that variant needs be reached (core, contrib, Composer, GitHub, npm)? Run it before a build under filtered egress
    node scripts/lab-env.mjs reset <slug> --yes          # cheapest reset: reinstall both SITES (database, files, recipe, languages); keeps checkout and patches
    node scripts/lab-env.mjs disk | trim <slug|all> [--deep]   # what uses disk; free regenerable space (--deep also removes core/node_modules, ~400 MB each)
    node scripts/lab-env.mjs status | start <slug> | stop <slug|all> | delete <slug> --yes   # manage environments (two at a time); start also launches the viewer; status also shows each checkout's core commit and lists pairs that are not in the state their variant asks for
    node tools/compare/setup.mjs <slug>                  # build Before and After from scratch (resumable, idempotent)
    node tools/compare/setup.mjs <slug> --check-patches  # only: do the patches still apply to that core?
    node tools/compare/setup.mjs <slug> --refresh-patches  # patched files (or contrib modules) no longer match the patch files (setup said BLOCKED, exit 4): restore them, apply the current patches; a contrib module is extracted again, the old folder kept as a backup
    node tools/compare/serve.mjs <slug> [--ddev]         # side-by-side viewer (http://localhost:8100 or https://drupal-compare.ddev.site)
    node tools/compare/diff.mjs <slug>                   # which served files and pages differ
    node scripts/lint.mjs <slug> --contrib               # the contrib patches: PHPCS (Drupal, DrupalPractice) on their PHP files; other types are listed as NOT checked; "NOTHING CHECKED" is not a pass
    node scripts/lint.mjs <slug> [--host]                # core's commit-code-check.sh on only the patched files (CSpell, PHPCS, PHPStan, ESLint, Stylelint, .pcss.css)
    node scripts/code-map.mjs <env|folder> <symbol|file>   # ONE call for locate + read: definition, body, what it calls, who uses it, its tests (or a file outline); use it instead of a grep, sed, cat chain
    node scripts/try-tests.mjs <slug> <tests...> [--existing <core test path...>] [--patch-out <f>] [--mr-ref <ref>] [--report <f>]   # proposed PHPUnit tests, one call: copy into Before and After, `ddev phpunit` both, remove, PHPCS+PHPStan, patch checked against the MR; sites must be running
    node scripts/feedback.mjs add <nid> --run <run> --source "<who, where>" --action "<what to do>" --expected "<behaviour wanted>"   # feedback on a change, tied to the run and patch revision it was about
    node scripts/feedback.mjs resolve <nid> <id> --run <run> --outcome <met|not-met|needs-person> --observed "<what the run showed>" [--revised-patch <f>...] [--supersede <older run> --reason "<why>"]   # the answering run; list <nid> prints the table
    node tools/compare/setup.mjs <slug> --checkout-only  # worktrees and patches only, no DDEV (enough for lint --host); --core-url=<mirror> if drupalcode is unreachable
    node tools/playwright/walkthrough.mjs <slug>         # scripted replay with real input; writes evidence and an interpretation
    node scripts/issue-intake.mjs fetch <nid> [--mr <n>]   # fetch an issue with its related, parent, child and mentioned issues and the review threads of every merge request: complete snapshot in .lab-cache/ (git-ignored), manifest + comment index + BRIEF.md in reports/issues/<nid>/intake/; says what changed since the last fetch and which handoffs that makes stale
    node scripts/issue-intake.mjs brief <nid> | show <nid> <n|cid|issue|diff|mr|related|threads>   # rebuild the brief offline; print one source, e.g. an older comment by number
    node scripts/issue-intake.mjs handoff write <nid> <stage> --file <json> [--by model|person|script] | check <nid> | show <nid> <stage>   # named handoffs (issue sources reproduction patch validation feedback), validated, each citing its sources; check says fresh or stale and why
    node scripts/issue-pack.mjs validate <pack> --repair --targeted   # a repair message that asks for a small edit (JSON Patch with the pack's hash) instead of the whole file
    node scripts/issue-pack.mjs edit <pack> <edit.json> [--require-valid] [--dry-run] [--no-backup]   # apply a pack edit: refused when stale, malformed, failing a test op, or when it would add a validator error; atomic; the old file is kept
    node scripts/issue-pack.mjs sync-issue <pack> [--write]   # the issue block (title, url, fork branch, merge request) from the fetched issue, not from a model
    node scripts/repair-benchmark.mjs [--json <file>]   # bytes of one repair turn, whole pack against edit, on recorded packs (mechanical)
    node scripts/issue-pack.mjs prepare <issue> --compact   # the pack prompt carries the compact brief instead of the whole thread, when that is smaller
    node scripts/model-eval.mjs plan | run --yes [--trials 3] [--only intake|repair] [--cases V3,...] [--append] | report   # a small PAIRED model evaluation (compact brief against full thread; targeted edit against whole-file repair): calls a model and spends allowance, so run needs --yes; plan calls nothing
    node scripts/intake-benchmark.mjs [--json <file>]   # bytes of the pack prompt, full and compact, on recorded fixtures (mechanical, no model)
    node scripts/ready-to-push.mjs [--allow-behind] [--install-hook]   # before a push: fetches the base, STOPS if the branch is behind it (CI tests the merge), then runs selftest; --install-hook makes it the local pre-push hook
    node scripts/lab-config.mjs [auto_fix.enabled]       # the repository's settings (lab.config.yml); with a key, only its value; exit 2 if the file is invalid
    node scripts/patch-change.mjs check [--base <ref>]   # patch files changed since origin/main (or --base) that have no record: exit 1
    node scripts/patch-change.mjs record <patch> --by <who> --reason "<why>"   # keep the version the base had in original-patches/ and add a row to reports/issues/<nid>/PATCH-CHANGES.md
    node scripts/patch-change.mjs list [<nid>]           # the recorded changes
    node scripts/new-issue.mjs <nid> --branch <branch>   # start a new issue (refuses when branches/<branch>.patch exists)
    node scripts/new-issue.mjs <nid> --authoring [--title "..."] [--variants-file reports/issues/<nid>/variants.json]   # no merge request or fork branch: scaffold the folder and variants with "authoring": true, pinned to current core main, then write the fix in After and capture it
    node scripts/new-issue.mjs <nid> --branch <branch> --refresh   # the MR got a new push: extract that patch again, say what changed (ignores git's abbreviated index lines), update only its BRANCHES.md row
    node scripts/capture-patch.mjs <slug> [--name <name> [--exclude <path>...]]   # no MR yet: the edits made in the After environment become reports/issues/<nid>/branches/<nid>-<name>.patch, listed in the variant; without --name it only lists them
    node scripts/make-bundle.mjs <slug>                  # a self-contained zip for someone else
    node scripts/index-issues.mjs                        # refresh reports/issues/README.md
    node scripts/issue-status.mjs <nid> [--write] | --all  # read-only: status, comments, MR head vs the patch the lab tested (flags a stale patch)
    node scripts/check-draft.mjs <nid>                   # the comment draft against core's AGENTS.md rules (180 words, no headers, disclosure line)
    node scripts/bug-feature.mjs draft <nid> [--variant <slug>] [--write [--force]]   # a mechanical Gherkin draft of the bug summary from the variant and its runs (reports/issues/<nid>/BUG.feature)
    node scripts/bug-feature.mjs prompt <nid> [--out <file>]   # the message for a model to rewrite BUG.feature per behaviour: rules (prompts/bug-feature.md), the draft, the issue's files as data
    node scripts/bug-feature.mjs check <nid | file> [--strict] | export <nid | file>   # Gherkin structure and the lab's rules (exit 1 on an error); export drops comments and lab tags for a drupal.org summary (docs/BUG-FEATURE.md)
    node scripts/findings.mjs add | from-run <run> | set | list   # barriers spotted outside the issue (reports/findings/); every entry starts unconfirmed
    node scripts/run-mark.mjs <run> --superseded --reason "<why>" [--by <run>]   # keep a run as history; coverage stops counting it (coverage also marks a run stale by itself when its recorded patch hashes, recipe or pin no longer match)
    node scripts/lab-env.mjs retire <slug> --yes         # delete a pair only once reports/issues/<nid>/ is committed and pushed
    node scripts/selftest.mjs [--live <slug>] [--network]   # does the lab itself work: syntax, unit tests, variants, docs; --live runs lint and the evaluator
    node scripts/issue-from-url.mjs <url> [--pack <file>] [--ai-recipe] [--mr <n>] [--no-import] [--dry-run]  # start from a Drupal.org issue URL (prepare→validate→import)
    node scripts/issue-pack.mjs validate <pack> | import <pack> [--recipe <dir>] [--depth 2000] [--dry-run]  # validate/import an issue pack; --ai-recipe at prepare time
    node tools/compare/setup.mjs <slug> --core-from=<path>  # seed core from a local checkout (filtered egress / existing worktree)
    node scripts/test-mr.mjs <nid|slug> [--diff=<file|url>] [--mr=<n|url>] [--patch=<path>] [--no-update] [--no-start] [--dry-run] [--core-url=<url>]  # one command: update checkout, optional MR diff, stop other comparisons, build and start (Coder or local), print the viewer address
    node scripts/cloud-bootstrap.mjs <slug> [--install-autostart] [--rebuild] [--core-url=<url>] [--use-existing-core[=<path>]] [--check]  # DDEV Coder workspace bootstrap
    node scripts/build-cloud.mjs                         # regenerate cloud/ (the GitHub Pages site); commit the result. CI fails if it is stale

Details: `tools/compare/README.md`, `tools/playwright/README.md`, `docs/TESTING-TOOLS.md`. Each run is a **pinned** variant (exactly as
verified) or a **latest** variant (follows current core `main`); see `docs/NEW-ISSUE.md`.
