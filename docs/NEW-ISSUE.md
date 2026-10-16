# Starting a new issue, and coming back to it later

The unit of work is **an issue**: a folder in `reports/issues/<nid>/`, a recipe in `recipes/`, and two variants in
`tools/compare/variants.json` (`<nid>-pinned` and `<nid>-latest`). #3619127 is the worked example.

## 1. Scaffold
    node scripts/new-issue.mjs <nid> --branch <issue-fork-branch> --title "Short title"
It fetches the issue fork's branch and current core `main`, writes the branch's own changes as
`reports/issues/<nid>/branches/<branch>.patch` (with source, tip, base and date in `BRANCHES.md`), pins the core commit the
patch was based on, creates `REPRODUCE.md`, `EVIDENCE.md`, a `STATUS.md` snapshot and a comment-draft stub, a recipe stub, and the two
variants. It also creates `SUMMARY.md`, the entry point a reader opens first (`docs/ISSUE-PACK.md`), without overwriting an existing summary. It needs `envs/core.git` (created by `setup.mjs`); `--depth 1500` if the branch is old; `--dry-run` shows the plan.
The issue's own drupal.org page lists the fork branch name (the MR source branch).

## 1b. Understand the issue without pasting the whole thread
    node scripts/issue-intake.mjs fetch <nid>        # snapshot, comment index and reports/issues/<nid>/intake/BRIEF.md (read-only requests to drupal.org and git.drupalcode.org)
    node scripts/issue-pack.mjs prepare <nid> --compact   # the pack prompt carries the brief instead of every comment, when that is smaller
The brief is extracted by rules, not written by a model: it says what was fetched and what limit cut it (comment pages, attachments, diff size), shows the comments whose own
words mark them as decisions, proposals, questions or revisions (and which proposals a later comment dropped), quotes everything as data, and lists the rest by number so
`issue-intake.mjs show <nid> <n>` can bring any of it back. Since 2026-10-16 it also lists the parent, related, child and mentioned issues with their state, and quotes the
unresolved review threads of every merge request (`show <nid> related|threads` for all of them): read both before judging the change (`AGENTS.md` rule 15). It finds candidates by word patterns; it does not understand the thread. What the problem is, what was decided and what
is open is interpretation: a model or a person writes it as a handoff (`handoff write <nid> issue --file ...`), every fact citing the comment, source or file it comes from. After a
new `fetch`, `handoff check <nid>` says which handoffs cite something that changed. Stages: issue, sources, reproduction, patch, validation, feedback; keep each under about 1,000 tokens and point to files rather than copying them.

## 2. Describe how to reproduce it
Edit the `<nid>-pinned` entry in `tools/compare/variants.json`:
- `pages` and `login`: pages the diff report fetches; whether it logs in.
- `steps`: each `{ "text", "how": "recipe" | "mirror" | "each", "lookFor" }`. `recipe` = the recipe does it, `mirror` = do it once, the
  viewer repeats it in both frames, `each` = do it yourself in each frame (use this for the step that is the thing being tested).
- `expected` and `actual`: one sentence each, shown above the frames.
- `checks`: `{ "label", "probe", "expect", "kind" }`. `probe` is a JS expression run inside each frame; `expect` a value or `"same"`;
  `kind` is `precondition` (must pass on both or nothing means anything), `fix` (should fail Before and pass After) or
  `regression` (should be equal). Record events instead of reading state when only one frame can hold it (focus).
- `observe`: manual yes/no questions with `expectBefore` and `expectAfter`.
- `steps` also become an optional checklist in the viewer (people can tick them; ticks are saved in their browser and the downloaded log).
- `coverage` (optional): `{ "matrix": [...], "manual": [...], "blocked": { "firefox": "why it could not be run" } }` to replace the standard browser and colour-mode matrix.
Edit `recipes/repro_<nid>/recipe.yml` so the starting state exists (modules, content types, config).
Full field reference: `tools/compare/README.md`.

## 3. Build, check, look
Build the **`-latest`** pair first (updated core, and updated core plus the patch): that is the day-to-day pair. Build `-pinned` later,
when you want the exact original reproduction recorded. Stop the previous issue's pair first (`node scripts/lab-env.mjs stop <slug>`).
    node tools/compare/setup.mjs <nid>-pinned --check-patches    # do the patches apply to the pinned core?
    node tools/compare/setup.mjs <nid>-pinned                     # build Before and After (10 to 20 minutes the first time)
    node tools/compare/serve.mjs <nid>-pinned                     # viewer; reproduce by hand, answer the manual panel
Environments are named `baseline-<nid>` and `issue-<nid>`. Two issues may share a baseline if they pin the same core commit:
give them the same `before.env`. Keep two or three DDEV projects running at most (`ddev stop` the others).

## 4. Script it and record evidence
Write `tools/playwright/evaluate-<nid>.mjs` on `tools/playwright/lib/lab-run.mjs` (`evaluate-3618230.mjs` is the example; see
`tools/playwright/README.md`). The library records the theme, modules, AJAX commands and announcements of every run, so the script
only holds the issue's steps and checks: real input, axe at each stage. Run it and `screenreader.mjs`. Barriers you notice that are
not this issue's go in `node scripts/findings.mjs add ...` (or `from-run <run folder>` for axe results), not in the issue folder. They write dated folders under
`reports/issues/<nid>/`. Fill in `EVIDENCE.md` (exact commits) and a `STATUS.md` snapshot (keep older ones as `STATUS-<date>.md`). Nothing is posted to drupal.org by any
script; `ISSUE-COMMENT-DRAFT.md` is a draft for a person to review and post.

To try tests you propose for the MR (PHPUnit, including FunctionalJavascript) on both sides, keep them in the issue folder laid out like core
(`reports/issues/<nid>/tests-proposal/core/modules/.../tests/...`) and run, with the sites up (`node scripts/lab-env.mjs start <slug>`):

    node scripts/try-tests.mjs <slug> reports/issues/<nid>/tests-proposal \
      [--existing core/modules/<m>/tests/src/Kernel/<Existing>Test.php ...] \
      [--patch-out reports/issues/<nid>/branches/<nid>-tests-<name>.patch --mr-ref refs/lab/issue-<nid>/<branch>] [--report <file>]

It copies the files into both checkouts, runs `ddev phpunit` on each side in parallel (and any `--existing` core tests), always removes the
copies, checks that the baseline's tracked files are unchanged, runs PHPCS and PHPStan on the files inside After, and writes a patch of the new
files and checks that it applies at the MR's ref (`git -C envs/core.git for-each-ref refs/lab` lists them). It prints one row per test
method with a verdict: "fails without the change, passes with it" is the useful kind; "passes on both" is a regression guard; "fails on both"
and "passes only Before" are problems with the test and make the exit code 1. A file that already exists at its destination stops the run. The
raw PHPUnit logs go to a temp folder it names; `--report` writes the table as a DRAFT Markdown file.

## 4b. Record what has and has not been tested
    node tools/playwright/walkthrough.mjs <nid>-pinned --browser=webkit --scheme=dark     # also --forced-colors, --viewport=1280x900
    node scripts/coverage.mjs <nid>                                                        # writes COVERAGE.md
Run the issue's own matrix: `coverage.matrix` in its pinned variant (new issues get a default from `tools/compare/coverage-matrix.mjs`;
edit it to fit the question the issue asks). A missing row is a gap, shown as NOT TESTED. Each run is also checked against the variant, its patch files and its recipe as they are now: a **stale** run (what it recorded differs now: a patch rewritten by a new MR push, a changed recipe or pin) is listed with the reason and not counted, so its row shows as a gap; a run that recorded no hashes (every run before 2026-10-15) is counted and marked `record: none`, never called current; a run that did is marked `record: current`. A run that turned out wrong is kept and marked:
`node scripts/run-mark.mjs <run folder> --superseded --reason "<why>" --by <newer run>`. Save
viewer logs from people who tested by hand in `reports/issues/<nid>/manual/` and re-run `coverage.mjs`.

## 4c. Feedback on the change
When someone asks for something to be checked or changed (a review comment, a gap in `SUMMARY.md`'s "Not verified"), record it against the run it was about, then answer it with a later run:

    node scripts/feedback.mjs add <nid> --run <run folder> --source "<who said it, where>" --action "<what to do>" --expected "<the behaviour wanted>"
    node scripts/feedback.mjs resolve <nid> <FB-id> --run <the answering run> --outcome <met|not-met|needs-person> --observed "<what it showed>" \
      [--revised-patch <file>...] [--supersede <older run> --reason "<why>"]

`feedback.json` and the generated `FEEDBACK.md` keep each item with the patch hashes the run used, the run that answered it and the revised patch.
An answering run must not be stale (see 4b). `needs-person` is for what a script cannot decide (a screen reader, a keyboard pass) and stays open.
`--supersede` marks the older run superseded by the answering one, so `coverage.mjs` stops counting what the feedback replaced. Worked example: `reports/issues/3618230/FEEDBACK.md`.

## 4d. No merge request yet: write the patch in the lab
For an issue that has no merge request and no fork branch, `node scripts/new-issue.mjs <nid> --authoring --variants-file reports/issues/<nid>/variants.json` scaffolds the folder, a recipe stub and the two variants already marked authoring (an empty issue fork branch, or a merge request from a branch named `main`, counts as none). Otherwise, make a variant whose After has nothing to test only on purpose: `"after": { "env": "...", "patches": [], "authoring": true }`. Without `authoring`, a variant with no patch
and no contrib patch is refused (setup stops with BLOCKED, exit 4, a run refuses, and `selftest` fails), because its After would equal Before and every check would
say "no difference". Build the pair, edit files in the After environment (`envs/<after-env>`), then:

    node scripts/capture-patch.mjs <slug>                     # lists what would be captured; writes nothing
    node scripts/capture-patch.mjs <slug> --name <short-name> # writes branches/<nid>-<name>.patch, lists it in the variant, adds a BRANCHES.md row

It captures every change in After beyond the declared patches (modified, deleted and new files that git does not ignore; the lab's own marker files, the recipe copy and
extracted contrib modules are left out, `--exclude <path>` adds more), checks that the declared patches plus the new one give exactly the files on disk, and records the
environment against the new patch list. A second capture adds a second patch on top. Capturing changes to a contrib module is not supported. To share the work, open a merge request on drupal.org.

## 4e. The merge request got a new push
    node scripts/issue-status.mjs <nid>                                  # the MR head against the patch the lab tested
    node scripts/new-issue.mjs <nid> --branch <fork-branch> --refresh    # extract that patch again
It reports "unchanged" (nothing written, hash stays), or "CHANGED" with the old and new hash and what to run next: `setup.mjs <slug> --refresh-patches` for each variant that lists
the patch, `coverage.mjs <nid>` (runs recorded against the old hash are now stale). Variants, recipe, steps, checks, evidence and the comment draft are not touched; only that patch's row of `BRANCHES.md` changes.
If the new push is based on a newer core, the pinned variant keeps its old `core.commit`: run `setup.mjs <slug> --check-patches` and re-pin after verifying.

## 5. Package it
    node scripts/make-bundle.mjs <nid>-pinned          # writes bundles/drupal-repro-<nid>-<date>.zip
    node scripts/index-issues.mjs                      # refresh reports/issues/README.md
The zip holds the viewer, recipe, patches, steps, checks and evidence, and a setup command; it does not contain Drupal core.

## 6. Come back later, including on updated Drupal core
Everything is in `reports/issues/<nid>/`: start with `SUMMARY.md` (the entry point), then `REPRODUCE.md`. In short:
    node scripts/issue-status.mjs <nid> --write                 # what changed on drupal.org; is the MR newer than the tested patch?
    node tools/compare/setup.mjs <nid>-pinned  --check-patches   # still applies to the pinned core?
    node tools/compare/setup.mjs <nid>-latest  --check-patches   # ...and to current core main?
    node tools/compare/setup.mjs <nid>-latest                    # build on current main
    node tools/compare/setup.mjs <nid>-latest --refresh-patches   # only if setup said BLOCKED: the patch file changed (a newer MR push) or a patched file was edited
    node tools/playwright/walkthrough.mjs <nid>-latest           # read its "Interpretation"
The walkthrough says whether the problem was **reproduced and fixed**, **no longer reproduces** (upstream may have fixed it: check
the issue before concluding anything), or **reproduces but the patch no longer fixes it** (reroll). To re-pin after verifying, set
`core.commit` on the `-pinned` variant. To free resources when you move on: `ddev delete --omit-snapshot --yes` in each
`envs/<name>/` and `git -C envs/core.git worktree remove --force ../<name>`; the evidence stays in `reports/`.

## Where to change report templates

- `reports/_templates/SUMMARY.md`: the layout used by both `scripts/new-issue.mjs` and issue-pack import.
- `reports/_templates/REPRODUCE.md`: the reproduction scaffold copied by `scripts/new-issue.mjs`.
- `tools/compare/issue-summary.mjs`: fills the summary layout using known issue or pack values.
- `prompts/issue-pack-chat-prompt.md`: controls what an assistant writes in the issue pack, not the final Markdown layout.

Template changes affect newly generated documents. They do not rewrite existing issue reports or evidence.
Scaffolding preserves an existing summary/reproduction file; issue-pack import deliberately regenerates its summary from the pack.
Review and commit your existing issue report before importing over it.

For accessibility findings, lead with the task and barrier, distinguish evidence methods, and keep expected results separate from
observed results. Standards mapping is optional. Preserve credible incomplete reports while investigation continues.
See [Accessibility Bug Reporting Best Practices](https://github.com/mgifford/ACCESSIBILITY.md/blob/main/examples/ACCESSIBILITY_BUG_REPORTING_BEST_PRACTICES.md).
