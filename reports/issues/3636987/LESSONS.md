# Lessons from evaluating #3636987

Written 2026-11-27 while several agent sessions shared one checkout, one Docker daemon and one
`~/.ddev`. Ordered by how much time each one cost.

1. **A running viewer has one server-side variant, and `?variant=` is not it.** `serve.mjs` keeps
   `state.slug`; the live viewer's proxies use it for both frames. On a shared host another session's
   viewer was on 8100 with `3534229-pinned`, so every frame looked plausible but was another issue's
   site. The page title even said `3636987-pinned` while the proxies were serving 3534229. Check
   `http://127.0.0.1:8100/variants.json` → `state.slug`, and the process arguments. Do not switch a
   shared viewer's state; start a private one with `PORT=8110 node tools/compare/serve.mjs <slug>` and
   use `--viewer=http://localhost:8110`. The proof is a content check: request a file the patch changes
   through each proxy (`/core/themes/default_admin/css/components/form--select.css`) and look for the
   added selector. A frame that loads is not evidence that it is the right frame.

2. **Do not pipe a long build through `tail`.** `node setup.mjs … 2>&1 | tail -300` showed nothing when
   the process was killed, because `tail` buffered the log. Append to a file (`>> /tmp/setup.log 2>&1`)
   and read the file; a killed run then says which stage ran.

3. **The full-access sandbox suits short DDEV calls, not whole builds.** `ddev` writes `~/.ddev`, which
   needs `danger-full-access`, but long full-access builds were killed while waiting for the shared
   setup lock. `composer install` and `git apply` run in workspace mode. If a build must be chunked, run
   the idempotent `setup.mjs` again; it skips completed stages. `performance_mode: none` avoids Mutagen,
   which other sessions reset globally.

4. **Preflight measures the shared host, not this issue.** Twice it was BLOCK (swap > 80%, disk < 8 GB)
   because four other pairs were running; stopping my own pair did not move swap. Wait, report, and do
   not prune or delete anything to clear it. Re-run it immediately before starting again.

5. **`commit-code-check.sh` file modes are a false positive under `performance_mode: none`.** The bind
   mount makes `test -x` true for every file, including a mode-644 `README.md`, so the two CSS files are
   reported "should not be executable". Git records 100644. Cite
   [`docs/ADDON-TRIAL-2026-10-15.md`](../../../docs/ADDON-TRIAL-2026-10-15.md) item 8; do not change the
   patch for it. A Mutagen run would confirm; it was not done because other sessions were resetting
   Mutagen.

6. **`manual/*.json` is parsed as a person's viewer log.** Saving the AI-run `viewer-results.json` in
   `manual/` made `coverage.mjs` report "1 manual log" with no environment and 0/0 answers. Keep
   generated JSON at the issue root; `manual/` is for a person's downloaded log and screenshots.

7. **Two small `run-readmes.mjs` bugs surfaced only with superseded runs and a default environment
   value.** It used a superseded run's banner as the evaluation name (now finds the first `# ` heading)
   and treated `reducedMotion: "no-preference"` as a reduced-motion run (now ignores that value). Both
   are in the tooling commit.

8. **The results shape is a shared contract.** Saving measurements under `sides.*.states` broke
   `run-readmes.mjs`, which expects an array there. Rename a custom object (this issue uses
   `measurements`). If a generic tool assumes a field, do not park a differently shaped object on it.

9. **Viewer frames take browser-context media emulation well.** `newContext({forcedColors, colorScheme})`
   reaches the iframes, so the viewer's own probes and checks see forced colours without the separate
   emulation window. The manual "Conditions > Forced colours" radio is only in the emulation window; the
   API refuses to set a mode until that window is open. Use the context for scripted viewer captures.

10. **The viewer's "Theme" label can say unknown while everything else is right.** On `/admin/content`
    the frame's theme-context message had not arrived; the block page showed `default_admin`, and every
    scripted run recorded `default_admin` from `drupalSettings`. Record the label as it is, explain it,
    and rely on the measured computed values, not the label.

11. **Keep tooling fixes and issue evidence in separate commits**, both based on `origin/main`, and
    build them with a temporary index in the shared checkout. Switching branches or using `git add -A`
    would capture other sessions' work; `git read-tree origin/main` + `GIT_INDEX_FILE` + `git add
    <explicit paths>` + `git commit-tree` leaves the shared working tree and HEAD alone.
