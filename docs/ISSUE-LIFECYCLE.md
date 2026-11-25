# Keeping track of issues, and archiving them

Every folder under `reports/issues/` is an issue the lab has evaluated. Issues move on drupal.org after the lab has looked at them:
a merge request gets new commits, the status changes, the fix is committed. This page says how the lab notices, what to do about
each change, and what happens when an issue is finished.

## The list

[`reports/issues/README.md`](../reports/issues/README.md) lists every issue folder in four groups:

- **Needs attention**: something changed upstream, or a reviewable change is ready; act on these first.
- **Waiting**: nothing for the lab to do until the issue moves.
- **Not checked yet**: no `status.json` yet.
- **Archived**: finished and archived in place.

Each row shows the drupal.org status, the merge request and its head commit, the commit the lab tested (from the issue's
`BRANCHES.md`) and the next step. `node scripts/index-issues.mjs` builds it offline from files in the lab, so it is only as current
as the last check.

`reports/issues/FOCUS.md` is the shorter, priority-ordered view: **Needs review** first (the best place to help a reviewer), then
**RTBC**, **Needs work**, **Active/postponed**, and finally **close-out** candidates. Within Needs review, a current MR head the lab
tested comes first; a moved MR head is re-tested before review; a draft MR is flagged, not treated as ready. Needs work rows say
whether to fetch the queue, find a missing MR, record the tested revision or re-test a moved head. The report is built by
`node scripts/focus-issues.mjs` (offline, no model) and refreshed with the weekly check. It never posts to drupal.org and is not a
substitute for reading the issue and its review threads.

## Keeping it current: the weekly check

[`.github/workflows/issue-status.yml`](../.github/workflows/issue-status.yml) runs on Mondays at 07:17 UTC, and on demand from
**Actions > Weekly issue status and focus > Run workflow**. It runs `node scripts/issue-status.mjs --all --write --include-archived`, which reads every issue (archived ones too, so a
reopened issue can be spotted) from drupal.org and git.drupalcode.org, then `node scripts/index-issues.mjs` and
`node scripts/focus-issues.mjs --write`. When something changed it opens one
pull request with the changed files (including `FOCUS.md`) and a log line per issue; you review and merge it. The job page also
shows the current focus summary. It never posts to drupal.org.

- **One-time setting.** In the repository's **Settings > Actions > General > Workflow permissions**, tick **Allow GitHub Actions to
  create and approve pull requests**. Without it the workflow reads the issues but cannot open the pull request.
- **Let its checks finish before merging.** The pull request gets the usual **Lab self-test** and **Check cloud/ is up to date**
  runs (about a minute). Merged before they start, with "Automatically delete head branches" on, they end as failed with no jobs
  (2026-10-18, PR #38): nothing was wrong, and the same checks then ran on `main` after the merge and passed.
- **It works from GitHub.** The first run (2026-10-18) read all 34 issues from drupal.org and git.drupalcode.org. An issue that
  cannot be read fails the run, after the pull request for the others. From a computer that reaches drupal.org the same is:

      node scripts/issue-status.mjs --all --write && node scripts/index-issues.mjs

What is stored, per issue:

- `status.json`: status, comments count and the last three comments, the merge request and its head commit, title, priority and
  tags. It is rewritten only when one of those changed, so a week with no change touches no file, and its `since` date is when the
  lab first saw the current state.
- `STATUS-<date>.md`: a dated note of each change after the first check (an existing one is kept; a hand-written `STATUS.md` is never
  touched).

"Lab tested" is not stored with the status: it is read from `BRANCHES.md` each time the list is built, so after you re-extract a
patch the row stops saying "Re-test" at once. `BRANCHES.md` comes in several shapes; only labelled places count: the table row naming
the `branches/…` patch (its Source, Branch and Tip columns), or lines starting `Source:`, `Fetched … from MR !n`, `Branch:`,
`Exact MR head:`, `MR head:` or `Tip:`. Only a commit hash counts as the tested tip, so a patch written in the lab (tip `-`) has
none, and an open merge request on such an issue shows as **Test MR !n**.

## What each next step means

| Next step | Do this |
|---|---|
| **Re-test**: the MR is at a commit the lab has not tested, or on another branch | Bring the new revision in: `node scripts/new-issue.mjs <nid> --branch <branch> --refresh` where git.drupalcode.org is reachable, or `node scripts/test-mr.mjs <nid> --diff=<saved diff>` (see the issue's `REPRODUCE.md`). Run the comparison again and update `EVIDENCE.md`. |
| **RTBC**: one final run on current core main | `node scripts/test-mr.mjs <nid>` (the `-latest` variant) and record the result. |
| **MR closed**: check the issue for a newer one | Read the issue; record a newer MR with `new-issue.mjs --branch <branch> --refresh`. |
| **Test MR !n**: `BRANCHES.md` records no MR commit the lab tested (the lab wrote its own patch, or the tip was not recorded) | Compare the MR with the lab's patch, then record and test it: `node scripts/new-issue.mjs <nid> --branch <branch> --refresh`. |
| **Fixed / Closed (fixed) / MR merged**: confirm, then archive | See the next section. |
| **Closed (duplicate, won't fix, works as designed, outdated, cannot reproduce)**: archive | `node scripts/issue-archive.mjs <nid>`; for a duplicate add `--duplicate-of <nid>`. |
| **Needs work**, **Needs review** (current head tested), **Active**, **Postponed** | Nothing until the issue moves. |

## Closing out before the next issue

Every issue ends the same way, finished upstream or not: nothing uncommitted and no orphaned evidence, so the next issue starts from a clean tree.

    node scripts/close-out.mjs <nid>             # report
    node scripts/close-out.mjs <nid> --commit    # commit this issue's own paths locally

It refreshes `COVERAGE.md` and the issue list, then lists each uncommitted or untracked file as **this issue** (its report folder, recipes, evaluator,
`variants.json`, the generated list and `cloud/`) or **not this issue**, which it never commits: commit, ignore or delete that on purpose. It also flags a
`playwright/<run>` folder with no `results.json`: re-run it, or write an `ABORTED.md` saying what is known (the folder stays as history; the script never
deletes evidence). It names the issue's sites that are still running. Exit 0 means a clean tree. It pushes nothing.

## When an issue is fixed upstream

1. **Confirm that core has the change.** Build the issue's comparison on current core main: `node scripts/test-mr.mjs <nid>`. Once
   the change is in core, the After patch no longer applies and setup says so: *"Its changes are already in this core commit (the
   patch applies in reverse): the issue may be fixed upstream."* That reverse check needs no network, so it works in a DDEV Coder
   workspace too. A patch that only partly landed does not apply in reverse; setup then asks for a reroll as before.
2. **Archive it.** Look first, then do it:

       node scripts/issue-archive.mjs <nid> --commit <core commit with the fix> --dry-run
       node scripts/issue-archive.mjs <nid> --commit <core commit with the fix>

   It writes `reports/issues/<nid>/ARCHIVED.md`, marks the issue's variants that follow a core branch (no pinned commit, usually
   `<nid>-latest`) as **retired**, and rebuilds `cloud/` and `reports/issues/README.md`. The reason comes from `status.json`
   (`--reason` names it when there is none). Review the changed files and commit them.
3. **Free the disk** on the machine that built the retired variant: `node scripts/lab-env.mjs retire <nid>-latest --yes`.

## Archived in place

An archived issue's folder stays where it is: links to it from drupal.org comments, issue summaries and earlier conversations keep
working, and its evidence stays next to its reproduction steps. (`reports/archive/` is something else: dated bundles of older
reports.)

- `ARCHIVED.md` says when and why, the drupal.org status, the core commit if known, which variants were retired and which still
  build. The list shows the issue under **Archived**. The weekly check still reads archived issues, so a reopened one is noticed and appears under **Reopened archive** in `FOCUS.md`; unarchive it deliberately, never automatically.
- A **retired** variant has `"retired": "<date and reason>"` in its `variants.json` entry. `tools/compare/setup.mjs` and
  `scripts/test-mr.mjs` refuse to build it and say why; an issue number (`test-mr.mjs <nid>`) picks a variant that is not retired.
  A variant pinned to a core commit (usually `<nid>-pinned`) is not retired and still builds, so the Before/After evidence stays
  reproducible. A variant that extends a retired one does not inherit the mark.
- To undo: delete `ARCHIVED.md` and the `"retired"` entries, or revert the commit that archived the issue.

## Scale: what many issues cost

Measured in this checkout on 2026-11-24: **41 issue folders**, **69 registered variants** (67 with a drupal.org number),
**26 issue recipes**, and **41 `status.json` snapshots**. Only **2 environments** were built, using **1.3 GB** (about
626 MB per Drupal environment); `reports/issues/` held **801 MB**, mostly evidence. The viewer payload was about
**362 KB** (`cloud/variants.json`) plus a **125 KB** page, and the full weekly read of all 41 issues took **2m 5s**
(network-bound; 0 changed).

Most of that does not scale with the number of issues: folders, recipes, variants and status snapshots are small, and the
viewer loads one grouped JSON file. The costs that do grow are:

- **Built environments.** Each pair is two DDEV projects and about 1.2 GB. If all 69 variants were built, that is tens
  of GB before shared pairs. Stop them when a review ends (`lab-env.mjs stop`), and delete or trim ones you no longer
  need (`lab-env.mjs delete|trim`).
- **DDEV projects and Docker.** `ddev list`, `lab-env.mjs status` and the router get slower with every registered
  project, even stopped ones. Built environments are the main source of drag.
- **The weekly status check.** It reads every issue, archived ones included, from drupal.org and GitLab: about 3 seconds per issue
  here, so the 41 issues take about two minutes. Archiving closed issues removes them from the sweep.
- **Evidence size.** `reports/issues/` grows with screenshots and run records; it is not loaded by the viewer, but it
  is what makes a full clone large.

Keeping many *variants and recipes* is cheap. Keeping many *built environments* is not. Archive closed issues
(`scripts/issue-archive.mjs`), retire the branch-following variant and free its environment (`lab-env.mjs retire
<nid>-latest --yes`), and keep the pinned variant when the evidence must stay reproducible.
