# AGENTS.md

> New session? Read the first 20 lines of `AI-LEARNING.md` (how this owner works, standing rules). The rest of it is history: `grep -n` it when something fails.

## What this repository is

A **workspace for evaluating Drupal core changes**. Drupal core is not part of this repository. Core checkouts live in `envs/`
(gitignored) and are disposable. What is kept over time is the evidence in `reports/`, the tooling, and the accessibility skills in
`.agents/` and `.claude/`.

The job: reproduce a problem on pristine upstream, apply an issue fork's branch or a patch, compare the two under the same
conditions, and write the result up so a human can post it to drupal.org. Each issue can be **reproduced again later, on the same
core or on updated core**: see `reports/issues/README.md`, `docs/NEW-ISSUE.md`, and an issue's own `REPRODUCE.md`.

Instruction precedence: `ACCESSIBILITY.md`, then this file, then `STYLES.md`, then `.agents/DRUPAL_AGENTS.md`. When they conflict,
choose the safer, more accessible option. (`.agents/DRUPAL_AGENTS.md` still describes the old layout with core at the repository
root; where it disagrees with this file, this file wins.)

For a browser-visible Drupal core change, the deliverable is a registered Before/After comparison in the Lab viewer. In DDEV Coder, start with `node scripts/test-mr.mjs <issue number>` (it updates the checkout and runs scripts/cloud-bootstrap.mjs; the issue's CODER-PROMPT.md lists the errors it can stop with and what each means). Creating two independent sites does not complete this task. Each issue must identify its variant, recipe or explicit Standard-install precondition, exact patch revision, reproduction steps and evidence gaps.

## Before implementation: agent checklist

State these five items before changing files or writing setup commands:

- Issue number and URL, plus the selected MR or local proposal.
- Execution environment: local DDEV, DDEV Coder Freeform, or preparation only without Docker.
- Exact registered comparison slug; if missing, scaffold and register it first.
- Recipe path, including optional post-recipe scripts, or an explicit plain Standard-install precondition.
- Ordered Before and After patch stacks and their revisions/hashes; distinguish the MR from local follow-ups.

For Coder handoffs, put the issue-specific scenario in the variant's `steps`, `expected`, `actual`, `checks` and `observe`.
Generate the common instructions with `node scripts/coder-prompt.mjs <slug> --write`; do not write an independent-site setup.
The shared template is `prompts/coder-prompt.md`. Regenerate after changing a scenario or patch stack.

## Start here (the normal sequence for an issue)

    node scripts/doctor.mjs [slug]                       1. is this machine ready? fix what it reports (read-only)
    node tools/compare/setup.mjs <slug>                  2. FIRST TIME ONLY: build Before and After (10-20 min, resumable; re-run if it stops)
    node scripts/lab-env.mjs start <slug> [--browser]    3. every time: both sites + the viewer (https://drupal-compare.ddev.site or http://localhost:8100); --browser opens it in the lab browser (forced-colours switch, own profile in .lab-browser)
    node tools/playwright/evaluate-<nid>.mjs <slug>      4. scripted replay with real input, on tools/playwright/lib/lab-run.mjs (records theme, modules, AJAX
                                                         commands and announcements on every run); evidence goes to reports/issues/<nid>/. walkthrough.mjs is #3619127's.
    node scripts/lint.mjs <slug>                         4b. core's own code checks (the CI ones) on the patched files; report in reports/issues/<nid>/lint/
    (write up: REPRODUCE/EVIDENCE/STATUS, drafts only)    5. then: node scripts/coverage.mjs <nid>; node scripts/check-draft.mjs <nid>; node scripts/index-issues.mjs
    node scripts/lab-env.mjs stop <slug>                 6. when done (nothing is lost)

New issue: `node scripts/new-issue.mjs <nid> --branch <fork-branch>`, then `docs/NEW-ISSUE.md`. People: `docs/FIRST-RUN.md`, `docs/USER-GUIDE.md`.
Slugs and environments are in `tools/compare/variants.json`; `node scripts/lab-env.mjs status` shows what exists and runs.

## Commands (usage and flags: `docs/COMMANDS.md`)
All are `node <path> ...` from the repository root; `<slug>` is a variant in `tools/compare/variants.json`.

    scripts/doctor.mjs [slug] [--network]  |  scripts/lab-env.mjs status|start|stop|reset|delete|trim|disk|retire <slug>
    tools/compare/setup.mjs <slug> [--check-patches | --refresh-patches | --checkout-only | --reinstall | --core-from=<path>]
    tools/compare/serve.mjs <slug>  |  tools/compare/diff.mjs <slug>  |  tools/playwright/walkthrough.mjs <slug>  |  tools/playwright/tree-diff.mjs <nid|slug>  (accessibility tree, ARIA, speech: docs/ACCESSIBILITY-TREE-DIFF.md)
    scripts/lint.mjs <slug> [--contrib]  |  scripts/coverage.mjs <nid>  |  scripts/check-draft.mjs <nid>  |  scripts/findings.mjs add|from-run|set|list  |  scripts/run-mark.mjs <run>
    scripts/code-map.mjs <env|folder> <symbol|file>    ONE call for locate + read: definition, body, what it calls, who uses it, its tests (or a file outline). Use it instead of a grep, sed, cat chain.
    scripts/try-tests.mjs <slug> <tests...> [--existing ...] [--patch-out f] [--mr-ref ref]    proposed PHPUnit tests, ONE call: both sides, remove, PHPCS+PHPStan, patch checked against the MR (sites running)
    scripts/feedback.mjs add|resolve|list <nid>    feedback tied to the run and patch revision it was about, and to the run that answered it (FEEDBACK.md)
    scripts/bug-feature.mjs draft|prompt|check|export <nid>    the bug summary as Gherkin (Given/When/Then) in BUG.feature: drafted from the variant, rewritten by a model or person, checked (docs/BUG-FEATURE.md)
    scripts/new-issue.mjs <nid> --branch <b> [--refresh]  |  scripts/capture-patch.mjs <slug> [--name <n>]  (edits in After become a patch, no MR needed)  |  scripts/issue-from-url.mjs <url>  |  scripts/issue-pack.mjs validate|import <pack>  |  scripts/issue-status.mjs <nid>|--all [--write]  |  scripts/index-issues.mjs  |  scripts/issue-archive.mjs <nid> [--dry-run]  (tracking and archiving: docs/ISSUE-LIFECYCLE.md)  |  scripts/make-bundle.mjs <slug>
    scripts/lab-config.mjs [key]  |  scripts/patch-change.mjs check|record|list  (a changed patch file leaves a record)
    scripts/issue-pack.mjs edit <pack> <edit.json> | sync-issue <pack> | validate <pack> --repair --targeted   fix the fields the validator named, not the whole pack
    scripts/issue-intake.mjs fetch|brief|show <nid> ... | handoff write|check|show   compact issue brief and named handoffs (reports/issues/<nid>/intake/, handoffs/); `issue-pack.mjs prepare --compact` uses the brief
    scripts/selftest.mjs  |  scripts/build-cloud.mjs  |  scripts/cloud-bootstrap.mjs <slug>  |  scripts/test-mr.mjs <nid|slug> [--diff=<file>] [--dry-run]   (one command: update, build, start; Coder or local)

## Read on demand (not loaded every session)
| When | Read |
|---|---|
| a command fails or something behaves oddly | `docs/PITFALLS.md` (search it for the error text first) |
| the exact flags of a lab script | `docs/COMMANDS.md` |
| building, resetting or removing an environment; which environments exist; the manual fallback | `docs/ENVIRONMENTS.md` |
| changing the viewer (`tools/compare/index.html`, `serve.mjs`) | `docs/VIEWER-DEV.md` (the security rules are there) |
| writing results into `reports/issues/<nid>/` | `docs/RESULTS-LAYOUT.md` |
| a DDEV Coder task, before writing commands | `docs/CLOUD-QUICKSTART.md` and `tools/compare/cloud/README.md` |
| generating a Coder handoff | `prompts/README.md`; `node scripts/coder-prompt.mjs <slug> --write` |
| starting a new issue | `docs/NEW-ISSUE.md` |

## Rules for agents

1. **Do not edit the baseline.** If `git status` there shows tracked changes, stop and say so (setup warns about them and a run refuses until they are reverted). One declared exception: a variant may list `before.patches` for a *test-support* change that must be the same on both sides (for example #3604037's `form_test` page); it is named in the variant and the issue's REPRODUCE.md, and is never code under test.
2. **Record the commit** (`git rev-parse --short HEAD`) of every environment behind every result, and the tool, browser and OS
   versions for manual tests. The walkthrough does this for you.
3. **Snapshot before anything destructive** on a site database (`ddev snapshot --name <label>`).
4. **Never post to drupal.org, push to any remote, or comment on an issue** without the user's explicit approval. Draft for review.
5. **Never put tokens or passwords in this repository**, in chat, or in commands. Use an environment variable or a `chmod 600`
   file outside the repo. Log in with the one-time link from `ddev drupal login`, not by typing a password into a form.
6. **Do not add Drush or other dependencies** to a core checkout's `composer.json`. Use `core/scripts/dr` or the add-on.
7. **Testing tools and scope:** see `docs/TESTING-TOOLS.md`. A synthetic Guidepup virtual screen reader is the agreed standard for
   comparing a change; real VoiceOver/NVDA passes are out of scope unless the user asks.
8. **Say what was not verified.** Automated results do not replace a person's keyboard pass; use real (trusted) input, not
   script-generated events, for anything about focus or activation. Evidence stays DRAFT until a person has reviewed it.
9. **When a result looks wrong, find the cause before reporting it.** (Examples from this lab: a "fail" caused by a script click, a
   test error caused by a missing `core/.env`, noise in the diff caused by timestamps.)
10. **AI-assisted disclosure** on commits and drafted comments.
11. Do not copy code from external projects without a compatible licence and attribution. Dependencies (Playwright, axe-core,
    Guidepup, jsdom) are installed from npm, not vendored.
12. **Cloud (DDEV Coder workspaces) is opt-in** (`tools/compare/cloud/README.md`, `scripts/cloud-bootstrap.mjs`, `docs/CLOUD-PLAN.md`). Do not sign in to Coder, create or change workspaces, or publish anything without the user.
13. **Auto-fix is on by default and never silent.** `lab.config.yml` sets `auto_fix.enabled` (read it with `node scripts/lab-config.mjs auto_fix.enabled`; a person can also switch it off for one pull request in the app's CI popover). After opening a pull request, turn CI auto-fix on for it when that prints `true`; leave it off when `false`. An auto-fix commit starts with `autofix:` and its body names the failing check and every file it changed. Changing a patch file (`reports/issues/*/branches/*.patch`, the change under test) is the one thing it must never do quietly: run `node scripts/patch-change.mjs record <patch> --by auto-fix --reason "<why>"` in the same commit (it keeps the original in `original-patches/` and adds a row to `reports/issues/<nid>/PATCH-CHANGES.md`) and say so in the commit body. `selftest` fails a changed patch that has no record.
14. **Before any push, run `node scripts/ready-to-push.mjs`.** CI tests the pull request merged with the current `main`, so a branch that passes alone can fail there (PR #13 did, on a probe that arrived with `main`). The script fetches the base, stops if the branch is behind it (merge it first), and runs `selftest`. A push still needs the owner's approval; this only says whether it is ready.
15. **A review reads more than the diff:** the issue and its comments, its parent, related, child and mentioned issues, and the review
    threads of every merge request, closed ones included. `node scripts/issue-intake.mjs fetch <nid>` gets all of them (since 2026-10-16);
    read the brief's related-issues table and unresolved threads before judging a change or drafting a comment, and fetch again before
    anyone posts an older draft. If drupal.org or git.drupalcode.org is unreachable, say that nothing was read; do not judge from a search summary.
16. **A possible security vulnerability is never made public.** If something found in the lab might be a vulnerability in Drupal core or
    a contributed project (cross-site scripting, access bypass, information disclosure, CSRF), do not write it into an issue, a comment
    draft, a commit, a report, a pull request or a finding here. Stop, tell the person, and let them report it privately to the Drupal
    Security Team ("Report a security issue", linked from https://www.drupal.org/security). Lab sites are private test sites: never
    point lab tools at a site other people use. Issues already public (a security advisory, a hardening issue in the public queue) are
    not covered.
