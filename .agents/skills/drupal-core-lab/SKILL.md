---
name: drupal-core-lab
description: How to use Drupal Core Lab (this repository) to evaluate a Drupal core issue or merge request. Use when someone wants to reproduce a Drupal core bug, test an issue fork branch or patch, compare Before and After side by side, gather accessibility evidence, write up results for drupal.org, start a new issue in the lab, re-test after an MR update, work from a patch file with no MR or code that has moved out of core, fix a build that fails at the chromium install, or asks how the lab works. Starts by asking why they are doing it and whether the issue already exists in the lab.
metadata:
  status: draft
  last-reviewed: 2026-11
---

# Using Drupal Core Lab

The lab reproduces a problem on pristine upstream core, applies an issue fork branch or patch, compares the two under the same
conditions, and records the result so a human can post it to drupal.org. Core checkouts in `envs/` are disposable; the evidence in
`reports/issues/<nid>/` is what is kept. `AGENTS.md` rules always apply (never post, push or comment without approval; never publish a
possible security vulnerability; say what was not verified).

## Step 0: ask before doing anything

Ask these first (all in one question set; skip any the user already answered). Do not run build commands until they are answered.

1. **Why are you doing this, and what do you hope to get out of it?** Offer examples, and accept any answer:
   - confirm a bug is real
   - check that an MR fixes it (RTBC review, re-test after a new push)
   - gather accessibility evidence (keyboard, screen reader, axe, forced colours, dark mode)
   - propose or try tests for an MR
   - write a patch with no MR yet
   - prepare a drupal.org comment
   - learn how the lab works or demo it
2. **Which issue?**
   - *Already in the lab:* a folder exists at `reports/issues/<nid>/`. Check `reports/issues/README.md` or `ls reports/issues`.
   - *On drupal.org but not in the lab:* it has an issue number, and usually an MR.
   - *New:* nothing filed yet, or filed with no MR (authoring mode).
3. **Where will it run?**
   - local DDEV with Docker
   - DDEV Coder workspace in a browser
   - no Docker available, so preparation only
4. **How deep?** A quick look, or evidence to hand to maintainers (scripted real-input replay, coverage matrix, draft comment).

Then restate the plan in five lines (issue and MR, environment, slug, recipe, Before/After patch stacks). `AGENTS.md` has the full
pre-implementation checklist.

Check what the issue's existing state is before choosing a path:

    node scripts/issue-status.mjs <nid>      # MR head on drupal.org against the patch the lab tested

## Step 1: pick the path

| Situation | Path |
|---|---|
| Issue in the lab, MR unchanged | Build or start the existing `<nid>-latest` slug (Path A) |
| Issue in the lab, MR got a new push | `new-issue.mjs <nid> --branch <b> --refresh`, then re-test (Path A) |
| On drupal.org with an MR, not in the lab | Scaffold it (Path B) |
| On drupal.org with only a patch file, or the MR or patch no longer applies to core `main` | Path C2: pin an older core and port the patch |
| On drupal.org, from a URL, with a chat writing the recipe | `issue-from-url.mjs` (Path B, alternative) |
| No MR yet | Authoring mode, then `capture-patch.mjs` (Path C) |
| No Docker | Coder workspace, then `test-mr.mjs <nid>` (Path D) |

Slugs live in `tools/compare/variants.json` and in each issue's `variants.json`. `<nid>-latest` follows current core `main` (the
day-to-day pair); `<nid>-pinned` is the exact core the result was first verified on. Build `-latest` first.

## Path A: an issue already in the lab

    node scripts/doctor.mjs <slug>                         read-only; fix every FAIL
    node tools/compare/setup.mjs <slug>                    first time only, 10-20 min, resumable
    node scripts/lab-env.mjs start <slug> [--browser]      both sites and the viewer
    node scripts/lab-env.mjs stop <slug>                   when done; nothing is lost

`setup.mjs` first runs `scripts/check-pins.mjs` (about 30 seconds, cached 24 hours): do the add-on release and the chromium versions it
pins still install? Exit 5 means stop: either a pin no longer resolves (read the NOTE and FAIL lines), or `snapshot.debian.org` is
returning errors, and a build now would cache an empty `apt-get update` layer that fails every later build. Try again later;
`--skip-pin-check` bypasses it.

The viewer opens at https://drupal-compare.ddev.site or http://localhost:8100. Both sites log in as `admin` / `admin`. Read the
issue's `REPRODUCE.md` and `SUMMARY.md` first. In the viewer: Log in both, Go (both), follow the steps, turn Mirror off for the step
under test and use **real** mouse and keyboard input in each frame (script-generated events are not evidence for focus or activation),
then press Run checks. Scripted replay with real input: `node tools/playwright/evaluate-<nid>.mjs <slug>` when one exists. For a
change in an existing MR revision, check patches still apply first: `setup.mjs <slug> --check-patches`.

## Path B: an issue on drupal.org, new to the lab

    node scripts/new-issue.mjs <nid> --branch <issue-fork-branch> --title "Short title"
    node scripts/issue-intake.mjs fetch <nid>              brief of comments, related issues and unresolved MR threads

Then follow `docs/NEW-ISSUE.md`: fill in `steps`, `expected`, `actual`, `checks`, `observe` in the `<nid>-pinned` variant and the
recipe in `recipes/repro_<nid>/recipe.yml`, build `-latest`, check, and record evidence. The fork branch name is the MR source branch
on the issue page. Alternative from a URL: `node scripts/issue-from-url.mjs https://www.drupal.org/project/drupal/issues/<nid>`
(it prints the next step; a chat writes the issue pack, which is a draft). Read `AGENTS.md` rule 15 before judging a change: read the
related issues and the unresolved review threads, not just the diff.

## Path C: no merge request yet

    node scripts/new-issue.mjs <nid> --authoring --variants-file reports/issues/<nid>/variants.json
    (edit files in envs/<after-env>)
    node scripts/capture-patch.mjs <slug>                  lists what would be captured
    node scripts/capture-patch.mjs <slug> --name <short-name>

An After with no patch is refused unless the variant is marked `authoring`. To share the result, open an MR on drupal.org.

## Path C2: only a patch file, or the code has moved

Old issues often have a patch attached to a comment and no MR. Check before building anything:

1. **Get the patch.** `fetch_webpage` on a drupal.org issue hits a CAPTCHA; `node scripts/issue-intake.mjs fetch <nid>` (read-only GETs) works, and
   `https://www.drupal.org/api-d7/comment/<cid>.json` lists the attached files (`field_issue_files`, with URLs). Save it in `reports/issues/<nid>/branches/`.
2. **Does it apply to core `main`?** Without touching a checkout:
   `GIT_INDEX_FILE=/tmp/i git --git-dir=envs/core.git read-tree <sha> && GIT_INDEX_FILE=/tmp/i git --git-dir=envs/core.git apply --cached --check <patch>`.
3. **If the files are gone,** find when: `gh api "repos/drupal/drupal/commits?path=<file>&per_page=3"`. Pin the variant's `core.commit` to the last commit
   that still has the code (`git --git-dir=envs/core.git fetch origin <sha>` first), port the patch (extract the files into a scratch git repo, edit,
   `git diff`), save it as `branches/<nid>-ported-<sha8>.patch`, and say in `BRANCHES.md`, `EVIDENCE.md` and the PR that it is a lab port of the
   original, not the issue's patch. Keep the original's design flaws: the point is to test it. There is no `-latest` variant when the code no longer exists on `main`.
4. **Tell the user** the code moved or was removed (and where it went): the fix may belong in another project, which changes what a comment should say.

**Recipes.** Config files go in `recipes/repro_<nid>/config/`, not `config/install/`: Drupal imports that folder itself, and a recipe that
looks "applied" can then do nothing. Current Standard installs create no content types, so the recipe must make the one the steps use.
Re-apply to both sides with `scripts/lab-site.sh apply <env> repro_<nid>`. **Before reading any diff, confirm the starting page returns 200 on both
sides** (`curl` it logged in: use the one-time link plus `/login`): a 404 on both sides gives a clean "0 of N differ" that means nothing.

## Path D: browser only (DDEV Coder)

Use the **DDEV Freeform** template (not "Drupal Core Development"); project names
`drupal-compare,drupal-compare-before,drupal-compare-after`; keep sharing off. In the workspace terminal:

    [ -d ~/drupal-core-lab ] || git clone https://github.com/mgifford/drupal-core-lab.git ~/drupal-core-lab
    cd ~/drupal-core-lab && git pull --ff-only
    node scripts/test-mr.mjs <nid>

Do not sign in to Coder, create workspaces or publish anything without the user. Details: `docs/CLOUD-QUICKSTART.md`. For a handoff to
another agent: `node scripts/coder-prompt.mjs <slug> --write`.

## Step 2: gather evidence

Match the evidence to what the user said they want.

| Goal | Use |
|---|---|
| Real-input replay with axe at each stage | `tools/playwright/evaluate-<nid>.mjs`, built on `tools/playwright/lib/lab-run.mjs` |
| Accessibility tree and ARIA/speech difference | `node tools/playwright/tree-diff.mjs <nid or slug>` |
| What the two sites serve (HTML, CSS, JS) | `node tools/compare/diff.mjs <slug>` |
| Browser, colour scheme, forced colours matrix | `walkthrough.mjs <slug> --browser=webkit --scheme=dark`, then `scripts/coverage.mjs <nid>` |
| Core's own code checks | `node scripts/lint.mjs <slug>` |
| Proposed PHPUnit tests, both sides | `node scripts/try-tests.mjs <slug> <tests...>` |
| An unrelated barrier you noticed | `node scripts/findings.mjs add ...` (goes in `reports/findings/`, not the issue) |
| Review feedback to answer | `node scripts/feedback.mjs add|resolve <nid>` |

Real VoiceOver or NVDA passes are not run by the lab unless asked; say that one was not done. Synthetic screen reader output is
evidence, not a substitute for a person.

## Step 3: write it up

Results go in `reports/issues/<nid>/` (`docs/RESULTS-LAYOUT.md`): `SUMMARY.md` (entry point), `REPRODUCE.md`, `EVIDENCE.md` with exact
commits, `STATUS.md`, and `ISSUE-COMMENT-DRAFT.md` for a person to post. Everything stays DRAFT until a person has reviewed it. Record
the core commit (`git rev-parse --short HEAD`) behind each result, plus browser, OS and tool versions for manual tests.

## Step 4: QA gate before calling it done

Run these and report each result honestly, including anything not run.

    node scripts/coverage.mjs <nid>            gaps show as NOT TESTED; stale runs are listed, not counted
    node scripts/check-draft.mjs <nid>         the drupal.org comment draft follows core's prose rules
    node scripts/index-issues.mjs              refreshes reports/issues/README.md
    node scripts/selftest.mjs                  the lab's own checks
    node scripts/ready-to-push.mjs             before any push; a push still needs the owner's approval

Also confirm:

- The baseline has no tracked changes (`git -C envs/<baseline-env> status`); if it does, stop and say so.
- A result that looks wrong has a known cause (script click, missing `core/.env`, timestamp noise), not just a label.
- The "Not verified" list in `SUMMARY.md` names what was skipped (browsers, forced colours, real screen reader, keyboard pass).
- No tokens, passwords or secrets in files, commands or chat; no possible vulnerability written down (`AGENTS.md` rule 16).
- AI-assisted disclosure is on commits and drafted comments.
- Land changes on a branch and open a pull request (`gh pr create --body-file`); never push to `main` or merge. Keep unrelated changes (tooling,
  one issue's evidence) in separate branches and PRs. On macOS, local `selftest` fails the `cloud-origins` test (bash 3.2 has no `${APP,,}`); CI is the reference.

## When it breaks

`node scripts/doctor.mjs <slug>` first, then search `docs/PITFALLS.md` for the error text. `ddev-router failed to become ready`:
run the same command again, it resumes. `docker-compose build failed` at `apt-get install ... chromium=...` with `Version ... was not found`:
Docker reused an empty cached `apt-get update` layer (the pins are usually fine: `node scripts/check-pins.mjs` says); `setup.mjs` runs
`ddev debug rebuild` once itself, by hand `cd envs/<env> && ddev debug rebuild`. A weekly workflow (`.github/workflows/pins-check.yml`) fails
when the pins need adjusting; they live in `tools/compare/ddev-build-failure.mjs` (add-on release) and the add-on's `Dockerfile.chromium`.
Reset or free disk: `node scripts/lab-env.mjs reset|delete|trim|disk <slug>` (snapshot a
database before anything destructive: `ddev snapshot --name <label>`).

## Where to read more

`docs/FIRST-RUN.md` (fresh clone), `docs/USER-GUIDE.md` (every viewer control), `docs/NEW-ISSUE.md`, `docs/ISSUE-LIFECYCLE.md`
(tracking and archiving), `docs/COMMANDS.md` (all flags), `docs/ENVIRONMENTS.md`, `docs/TESTING-TOOLS.md`.
