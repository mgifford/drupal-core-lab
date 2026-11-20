# CSS build demonstration for #3636143

DRAFT, AI-assisted. Produced by `node tests/lab/real/css-build-real.mjs --write` (core's own `yarn run build:css`, Yarn 4.18.0 through Corepack, in a scratch worktree of core `92e5c3a30476`).

- The imported merge request patch (`../branches/3636143-regression-the-toggle.patch`) is consistent on this core: its `navigation.pcss.css` matches its `navigation.css`. The generated-CSS mismatch core's CI reported for an earlier head of the MR is **not present** in this revision.
- To show the detection, the run uses a copy of that patch with the compiled file's hunk removed (what an MR that forgot to recompile looks like). Core's check reports it stale; a build without `--corrective` is refused; `--corrective` rebuilds it and the imported patch files stay byte for byte unchanged.
- `*-followup-interdiff.patch`: what the stale copy lacked (the compiled `navigation.css` only). `*-followup-full.patch`: both files from the base commit. Neither is posted anywhere.
- This is about generated CSS only. It says nothing about the accessibility of the change.
