# AI usage, Phase 5: extend only from measured gaps (2026-10-15)

DRAFT until a person has reviewed it. Chosen by the owner ("go with Phase 5"), after merging two new upstream commits (see **Merge** below).
Nothing pushed, nothing posted. The brief asks for each gap to be measured, the smallest increment proposed with a fixture and an
acceptance test, and no support claimed until tested. This follows that.

## The four gaps, measured and what was done

| Gap | What was measured | Increment | How it was tested | Not claimed |
|---|---|---|---|---|
| **No merge request: write the patch in the lab** | Edits in an After environment were only warned about ("a run records them"), and `new-issue.mjs` needed `--branch`. There was no way to turn the edits into a patch. A variant with an empty After patch list was accepted silently: `3426468-latest` builds an After equal to Before, and `--check-patches` printed "All patches apply" for nothing | `scripts/capture-patch.mjs <slug> [--name n]` (module `tools/compare/capture.mjs`); `after.authoring: true` declares the case; a variant with nothing under test is now refused (`tools/compare/change-under-test.mjs`: setup exit 4, a run, `selftest`) | 11 unit tests on throwaway repos (modified, new, deleted, executable, binary, ignored files; declared patches not captured again; checkout, HEAD and index untouched; lab files excluded; round trip) plus the command end to end; 4 negative controls. **Live** on a real contrib environment: 2 new files captured in 1.7 s, patch round-trips, environment recorded as `verified`, `--refresh-patches` restored it. The live run found a real defect (the extracted contrib module and its markers were captured as 137 new files) which is fixed and tested | Capturing edits to a contrib module as a contrib patch; replacing an earlier captured patch (a second capture adds a patch on top); opening a merge request |
| **Contrib: intake and lint** | Intake: `issue-pack.mjs`, `new-issue.mjs` and `issue-from-url.mjs` have no contrib support (0 mentions); contrib variants are written by hand. Lint: on a contrib-only variant `lint.mjs` said "no patches, so there is nothing of the issue's to check" and exited 3; with core patches it only printed a note. `--check-patches` checks core patches only | `lint.mjs <slug> --contrib` (module `tools/compare/lint-contrib.mjs`): PHPCS with Drupal and DrupalPractice on the PHP-family files of the contrib patches, other types (CSS, JavaScript, YAML, Twig) listed as **NOT checked**, and "NOTHING CHECKED" when no PHP file exists, never a pass | 5 unit tests, 2 negative controls. **Live** in the container: a contrib patch with a coding-standard violation gave FAIL (11 errors, exit 1), the clean version PASS (exit 0); on the real `3273806` patch (CSS only) the answer is NOTHING CHECKED with 6 css files listed. First real DDEV build of a contrib variant with the contrib-identity code of slice E: 4 min 41 s, "extracted contrib toolbar ... applied ... patch 6e8143f8", and a re-run said "verified by content" | Contrib intake (no change made); contrib ESLint, Stylelint, CSpell, PHPStan; `--check-patches` for contrib patches |
| **Updating an imported issue** | A second `new-issue.mjs` run silently overwrote the patch and replaced all of `BRANCHES.md` (3618230's hand-written second row would be lost; 3426468 has two patch files and one row). The generated `REPRODUCE.md` tells people to use `--refresh`, which did not exist. Re-importing a pack is refused. A fresh extraction of an unchanged MR branch differed byte for byte from the stored patch (git abbreviated the `index` lines to 8 characters in one clone, 9 in another), so a refresh would have changed the patch hash and turned recorded runs stale for no change | `new-issue.mjs --refresh` (module `tools/compare/branch-patch.mjs`): extracts again, compares the changes ignoring the abbreviated `index` lines, writes nothing when unchanged, otherwise rewrites that patch and only its `BRANCHES.md` row and prints what to run next (`setup.mjs <slug> --refresh-patches`, `coverage.mjs`). New extractions use `--full-index`. Without `--refresh`, an existing patch is refused (see altered behaviour) | 6 unit tests, 2 negative controls. **Live against drupal.org** on #3618230: "unchanged" for the committed patch (nothing written); after altering the stored file, "CHANGED", `BRANCHES.md` row identical to the committed one, only the patch file differed; refused without `--refresh` (exit 1). 5.3 s | Re-importing a pack over human edits; re-pinning `core.commit` automatically; the case where the branch was force-pushed or deleted |
| **Restricted-network cloud** | The documented 2026-10-14 finding: `git.drupalcode.org`, `drupal.org`, `repo.yarnpkg.com` unreachable in a Coder workspace. Options exist (`--core-url`, `--core-from`, `--use-existing-core`) but a build learns about a blocked host ten minutes in, and a contrib module is cloned from its own URL with no mirror option. `make-bundle.mjs` carries patches and recipe, not core or contrib sources | `doctor.mjs <slug> --network [--core-url=<mirror>]` (module `tools/compare/hosts.mjs`): names the hosts a build of that variant needs and whether each answers | 5 unit tests with an injected probe, 1 negative control. **Live** from this machine: all 4 hosts reachable for the contrib variant. The blocked path was tested only with a fake probe and an unresolvable name | **An offline build from a versioned bundle was not built and is not claimed.** Composer, npm and Docker need their hosts too. Not run inside a filtered workspace |

## Merge

Fetched `origin/main` (2 commits: scaffolds for #3426468 and #3606655, a viewer frame-error box, Coder wording) and merged it (`503c489`).
One conflict, `AGENTS.md` (this branch shortened it): kept the short one and moved the Coder wording into `docs/VIEWER-DEV.md`.
`cloud/` regenerated. Review of the two new scaffolds, against the identity work:

- `3426468-latest` lists **no patch** (explicitly `[]`): the MR's branch (`3426468-make-the-active`, base 2024) no longer applies to current main
  (the navigation CSS moved), and `--check-patches` printed "All patches apply" vacuously. The fork's other branch, `3426468-active-indicator`, **does** apply
  to main today (checked with a throwaway index) but is not in `BRANCHES.md` and is not the MR's branch. Which one `-latest` should test is a decision for
  the owner, so the data was left alone and the new check made `selftest` fail on it. **Resolved the same day:** the owner chose `3426468-active-indicator`. The variants' own
  descriptions already say `-latest` tests a lab-authored fix (per comment #28) and `-pinned` the original 2024 MR, so `-latest` now lists that patch, `BRANCHES.md` records that it is not from the
  issue fork (the fork's only issue branch is `3426468-make-the-active`) and that it applies to `main` `ad11ba71c0f0`, and `selftest` passes.
- Both scaffolds still have template placeholders in `REPRODUCE.md`, `EVIDENCE.md` and `STATUS`, and no recorded run, so coverage has nothing for them.
- `3606655`: both variants resolve, the patch applies on pinned and latest.

## Measurements and tests

| | |
|---|---|
| Unit tests | 255 of 255 pass (was 228): +11 capture, +5 lint-contrib, +6 branch-patch, +5 hosts |
| Negative controls | 9, each failing its tests and restored byte-identical |
| `selftest` | first 5 ok, 1 FAIL (`variants: 3426468-latest: after lists no patch ...`, the new check working); after the owner chose the patch, 6 ok |
| Timings, live | capture list 3.2 s on a 16k-file core, capture write 1.7 s; `--refresh` 5.3 s; `lint --contrib` 0.7 s (CSS only); contrib build 4 min 41 s |
| Not measured | Token or prompt effect of any of this: Phase 5 adds capability, it does not shrink prompts. No model call was made by any new script |
| Not performed | Anything inside a filtered-egress workspace; a screen reader or keyboard pass (nothing here touches UI); a second operating system |

## Altered behaviour

- `new-issue.mjs` now **refuses** to run for a branch whose patch already exists (it used to overwrite the patch and `BRANCHES.md` silently); `--refresh` is the supported way. A second *different* branch of the same issue now adds a row to `BRANCHES.md` instead of replacing the file. New patches use `--full-index`; existing patches are not rewritten.
- A variant with no patch and no contrib patch is refused by setup (exit 4), by a run, and by `selftest`, unless `after.authoring` is `true`.
- `lint.mjs` no longer exits with "no patches" for a contrib-only variant; it runs the contrib checks. A mixed variant still checks core only and says how to check contrib.

## Risks and rollback

- `capture-patch.mjs` removes the files of a new-files-only change from the working tree for a moment so the recorded patch can put them back (only after the patch was checked to round-trip); a crash in between would leave the patch file but the files absent. They are in the patch.
- Rollback: revert the Phase 5 commit; the merge commit `503c489` can stay.
