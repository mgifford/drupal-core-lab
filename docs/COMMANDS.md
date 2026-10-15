# Commands: the lab's scripts and their usage

Moved out of `AGENTS.md` on 2026-10-15 so that file, which every session loads, stays short (AI-usage option C: scope the starting context). The text is unchanged except where noted.
The short index is in `AGENTS.md`.


Everything is driven by **variants** in `tools/compare/variants.json`. A variant says which core (a pinned commit, or the latest
`main`), which two environments, which patches, the recipe that creates the starting state, the steps, and the checks.

    node scripts/doctor.mjs [slug]                       # preflight: prerequisites, disk, what is running
    node scripts/lab-env.mjs reset <slug> --yes          # cheapest reset: reinstall both SITES (database, files, recipe, languages); keeps checkout and patches
    node scripts/lab-env.mjs disk | trim <slug|all> [--deep]   # what uses disk; free regenerable space (--deep also removes core/node_modules, ~400 MB each)
    node scripts/lab-env.mjs status | start <slug> | stop <slug|all> | delete <slug> --yes   # manage environments (two at a time); start also launches the viewer
    node tools/compare/setup.mjs <slug>                  # build Before and After from scratch (resumable, idempotent)
    node tools/compare/setup.mjs <slug> --check-patches  # only: do the patches still apply to that core?
    node tools/compare/setup.mjs <slug> --refresh-patches  # patched files no longer match the patch files (setup said BLOCKED, exit 4): restore them, apply the current patches
    node tools/compare/serve.mjs <slug> [--ddev]         # side-by-side viewer (http://localhost:8100 or https://drupal-compare.ddev.site)
    node tools/compare/diff.mjs <slug>                   # which served files and pages differ
    node scripts/lint.mjs <slug> [--host]                # core's commit-code-check.sh on only the patched files (CSpell, PHPCS, PHPStan, ESLint, Stylelint, .pcss.css)
    node scripts/code-map.mjs <env|folder> <symbol|file>   # ONE call for locate + read: definition, body, what it calls, who uses it, its tests (or a file outline); use it instead of a grep, sed, cat chain
    node scripts/try-tests.mjs <slug> <tests...> [--existing <core test path...>] [--patch-out <f>] [--mr-ref <ref>] [--report <f>]   # proposed PHPUnit tests, one call: copy into Before and After, `ddev phpunit` both, remove, PHPCS+PHPStan, patch checked against the MR; sites must be running
    node tools/compare/setup.mjs <slug> --checkout-only  # worktrees and patches only, no DDEV (enough for lint --host); --core-url=<mirror> if drupalcode is unreachable
    node tools/playwright/walkthrough.mjs <slug>         # scripted replay with real input; writes evidence and an interpretation
    node scripts/new-issue.mjs <nid> --branch <branch>   # start a new issue
    node scripts/make-bundle.mjs <slug>                  # a self-contained zip for someone else
    node scripts/index-issues.mjs                        # refresh reports/issues/README.md
    node scripts/issue-status.mjs <nid> [--write] | --all  # read-only: status, comments, MR head vs the patch the lab tested (flags a stale patch)
    node scripts/check-draft.mjs <nid>                   # the comment draft against core's AGENTS.md rules (180 words, no headers, disclosure line)
    node scripts/findings.mjs add | from-run <run> | set | list   # barriers spotted outside the issue (reports/findings/); every entry starts unconfirmed
    node scripts/run-mark.mjs <run> --superseded --reason "<why>" [--by <run>]   # keep a run as history; coverage stops counting it
    node scripts/lab-env.mjs retire <slug> --yes         # delete a pair only once reports/issues/<nid>/ is committed and pushed
    node scripts/selftest.mjs [--live <slug>] [--network]   # does the lab itself work: syntax, unit tests, variants, docs; --live runs lint and the evaluator
    node scripts/issue-from-url.mjs <url> [--pack <file>] [--ai-recipe] [--mr <n>] [--no-import] [--dry-run]  # start from a Drupal.org issue URL (prepare→validate→import)
    node scripts/issue-pack.mjs validate <pack> | import <pack> [--recipe <dir>] [--depth 2000] [--dry-run]  # validate/import an issue pack; --ai-recipe at prepare time
    node tools/compare/setup.mjs <slug> --core-from=<path>  # seed core from a local checkout (filtered egress / existing worktree)
    node scripts/cloud-bootstrap.mjs <slug> [--install-autostart] [--rebuild] [--core-url=<url>] [--use-existing-core[=<path>]] [--check]  # DDEV Coder workspace bootstrap
    node scripts/build-cloud.mjs                         # regenerate cloud/ (the GitHub Pages site); commit the result. CI fails if it is stale

Details: `tools/compare/README.md`, `tools/playwright/README.md`, `docs/TESTING-TOOLS.md`. Each run is a **pinned** variant (exactly as
verified) or a **latest** variant (follows current core `main`); see `docs/NEW-ISSUE.md`.
