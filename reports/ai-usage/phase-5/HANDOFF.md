# Handoff: AI usage reduction, after Phase 5 (2026-10-15)

Resume from this file. Evidence: [RESULTS.md](RESULTS.md). Index: [../README.md](../README.md). Earlier: [../phase-4/HANDOFF.md](../phase-4/HANDOFF.md).

- **Repository:** branch `claude/unruffled-lewin-d2de0a`; the Phase 5 commit follows the merge `503c489` of `origin/main` (2 upstream commits). Nothing pushed.
- **Done:** four measured gaps, one increment each, each tested (RESULTS.md): `scripts/capture-patch.mjs` and `after.authoring`; `lint.mjs --contrib`; `new-issue.mjs --refresh`; `doctor.mjs --network`. A variant with nothing under test is refused.
- **Failing on purpose:** `node scripts/selftest.mjs` fails one check, `variants: 3426468-latest ... after lists no patch`. Owner decision: list a patch for `3426468-latest` (the MR branch `3426468-make-the-active` no longer applies to main; the fork's `3426468-active-indicator` does and is not in `BRANCHES.md`), or mark it `"authoring": true` if someone is writing one.
- **Needs the owner:** that decision; reset `3618230-latest` and the other items in [../phase-4/HANDOFF.md](../phase-4/HANDOFF.md); push or not (15+ local commits); the 50% prompt target; FB-002 and FB-003 of #3618230 need a person.
- **Environments here:** `3618230-pilot` and `3273806-latest` pairs exist in this worktree's `envs/`, stopped (about 2.6 GB; 4 GB free). `node scripts/lab-env.mjs delete <slug> --yes` removes a pair. They were built here because DDEV project names are global and the owner's checkout already has `3093378-*`.
- **Not done, with the next smallest step:** contrib intake (`new-issue.mjs --project <name>`: contrib fork URL, module pin, contrib patch; none of the intake scripts mention contrib); `--check-patches` for contrib patches; contrib ESLint and Stylelint; an offline build from a bundle (not claimed, not tried); re-pinning `core.commit` after a refresh; capturing a contrib-module patch.
- **Rollback:** revert the Phase 5 commit.
