# Lessons from #3534229 (CKEditor 5 toolbar configuration in forced-colors mode)

DRAFT. Written 2026-11-27 from the evaluation in this folder. Facts are from the runs recorded in
`EVIDENCE.md`; items marked *(unverified)* were not observed. Nothing was posted or pushed upstream.

## About forced-colors mode (browser behaviour)

1. **Forced colors does not remove `url()` background images.** Only `background-image` values without a
   `url()` are forced to `none`. A black SVG therefore stays black while `Canvas` turns black in the dark
   palette: the icons disappear. This is why "completely invisible" (dark palette) and "looks fine"
   (light palette) are both true, and why a report must name the palette. `COMPATIBILITY-3637246.md` and
   the fixture record: forced dark A = 4/37 visible, forced light A = 37/37.
2. **System colours are not force-adjusted; other colours are.** `background-color: CanvasText` survives
   forced colors and can paint a mask. `#eee` does not: it becomes `Canvas`.
3. **A non-empty `mask-image` proves nothing.** Measure rendered pixels. A mask that fails to load is a
   transparent mask (the icon vanishes); a mask that paints the same colour as the background is invisible.
   The fixture's negative controls and `lib/pixels.mjs` exist for this.
4. **Masking a whole control clips its descendants.** kentr's experiment masks the button element, so
   Alignment's `::after` caret is clipped; the same would happen to any pseudo-element text. Mask a
   dedicated icon surface instead (or, for Alignment, the free `::before`).
5. **`background: <colour>` (shorthand) silently deletes background images.** Kent-style CSS applied to every
   `.ckeditor5-toolbar-button` turns un-opted contributed plugin icons into solid system-colour boxes. The
   opt-in has to be explicit, and the shared block must not match items that did not opt in.
6. **`filter: invert(1)` is not reset by forced colors.** A dark-mode invert (as proposed in #3637246)
   inverts the user's system colours and makes a `CanvasText` mask invisible again (1:1 in the compat
   fixture). A reset needs specificity above `.dark-mode .ckeditor5-toolbar-button`; test the combined
   state, not each patch alone. Live combined run after the reset: forced dark 31/35 → 0/35 and every
   button computes `filter: none`.
7. **Semantics pick the system colour pair.** These controls are `role="option"` inside `role="listbox"`,
   not buttons: `CanvasText`/`Canvas` is right; `ButtonText`/`ButtonFace` is borrowed from a pattern that
   does not apply.
8. **CSS cascade position matters as much as the rule.** The first proposal lost to each plugin's
   `background-image` declaration because the shared rule had equal specificity and loaded earlier;
   `drupalInsertImage` kept painting its black SVG over the new mask. Raising the selector to
   `.ckeditor5-toolbar-item .ckeditor5-toolbar-button` fixed it. Check every icon, not just one.
9. **Not every toolbar item is an icon.** Heading, Style and Language are generated text + CSS-border
   caret and already force correctly; Alignment is icon + caret and needs different treatment. Test the
   four rendering shapes separately.

## About measuring and evaluating

10. **Photograph the pixels.** Element screenshots decoded in Node (`lib/pixels.mjs`) are cheap, fast and
    reproducible; a helper browser page crashed under load. Pick the icon colour by contrast to the
    dominant colour, and keep the Before side as the negative control: it proves the method detects an
    invisible icon.
11. **Reset pointer and focus between per-item captures.** An absolutely positioned tooltip from the
    previous hover, or a focus ring, leaks into the next element screenshot. This produced false
    "normal mode changed" results until fixed.
12. **Raw screenshot hashes are not a rendering comparison.** At fractional element positions, one edge
    pixel differs between captures of identical rendering. Hash the decoded pixels inside a 2 px inset;
    keep the raw hash as a note. Five false positives at 480 px were explained this way, not by the patch.
13. **Use the right selectors for the Drupal version under test.** In core `main` the text-format save
    button is `#edit-actions-submit`, not `#edit-submit`; four interaction runs timed out on the wrong id
    before this was noticed. Read the DOM instead of assuming older markup.
14. **Interaction semantics matter.** Core announces only add (`ArrowDown`) and remove (`ArrowUp`); moving
    within the active list with `ArrowLeft`/`ArrowRight` is silent, so an empty announcement list is the
    expected result. After a keyboard move, focus landed on the first Available button identically Before
    and After: it is pre-existing behaviour under automation, not a patch regression, and it needs a
    person to judge it in normal use.
15. **Emulation is not the platform.** Chromium emulates forced-colors palettes that follow
    `prefers-color-scheme`; Playwright's Firefox crashes on this host and WebKit has no forced-colors
    emulation. Real Windows contrast themes remain a manual check, and the report says so.
16. **`file://` breaks mask images (CORS).** The standalone fixture must be served over HTTP; otherwise a
    working fix looks broken.

## About the Lab and working in a shared checkout

17. **One After environment cannot carry two patch stacks.** Sharing `envs/issue-3534229` between
    `3534229-pinned` and the combined variant produced the `lab-env status` warning. Give each patch stack
    its own environment; then both variants read `patch-state: verified` and the warning disappears. This
    is the "reconcile the patch warning" step done on 2026-11-27.
18. **Several sessions share one checkout.** This session's branch was another session's, 113 commits
    behind `main`, with 2,609 uncommitted paths; branch switching, merging, resetting or committing there
    would take other people's work. Prepare the push from a clean worktree based on `origin/main` with
    only this issue's files. `ready-to-push` correctly STOPped on the shared branch.
19. **Tool versions on the working branch can be older than `main`.** `scripts/preflight.mjs` and
    `_docs/WORKSPACE-HYGIENE.md` existed only on `main`; `doctor.mjs` was the working fallback. Check
    `git show origin/main:<path>` before concluding a tool is missing.
20. **A Docker Desktop crash has side effects.** It stopped environments and emptied `core/node_modules`,
    which turned CSS-build checks into "BLOCKED/toolchain missing". Here that was harmless (0 PostCSS
    sources, nothing to compile), but the report must say why the status looks alarming.
21. **Patch revisions need artifacts, not memory.** Keep each captured patch, reconstruct earlier ones and
    verify their hashes (`original-patches/`), and provide an interdiff between patch files. A revision is
    only reproducible when the prior bytes are pinned.
22. **A "conflict" link may be stale.** PR #119 was already merged and green when a conflict banner was
    reported; verify the PR's state and CI before doing conflict work.
23. **Automated checks are supplementary.** axe results were identical Before/After; that says nothing
    about icon visibility. Pixels and a person's review are the evidence.

## Lessons from the second pass (MR verification, publishing and the CI repair, 2026-11-28)

24. **Upstream can overtake the lab proposal while you are still measuring it.** Before reporting, check the issue
    and its MRs again: by the next morning a consolidated MR (!18007) existed and the issue was Needs review, then
    Needs work. Re-read `status.json`/the issue before writing anything that says "the proposal".
25. **Changing a variant's patch stack invalidates every earlier run.** When the lab re-pointed `3534229-pinned`
    at the MR-identical stack (mask patch + consolidated delta), `coverage.mjs` correctly marked 20 earlier runs
    `stale` and the tested count fell from 7/9 to 4/9. That is the ledger working, not a regression: re-run the
    matrix against the new stack before quoting coverage. Keep the old runs — they explain the older state.
26. **"Same rendering" needs a tolerance, not a byte hash.** At 480 px one item (`blockQuote`) produced a
    different pixel hash with identical geometry, dominant colour, icon colour, contrast and share: sub-pixel
    rasterization at fractional positions. Assert normal mode from geometry + rendered colour statistics (contrast
    ±1, share ±0.01) and keep byte/pixel hashes as diagnostics; otherwise you report a change that is not one.
27. **The Needs Review Queue Bot names a class of failure, not a cause.** Its comment only says "fails the Drupal
    core commit checks". The failed pipeline's job list (CSS linting, PHPUnit Unit 8.6, Nightwatch) and a local run
    of the lab's `lint.mjs` on the MR-identical checkout turn that into an actionable finding: 35 stylelint errors
    in 18 files.
28. **Repair the imported proposal without editing it.** Fix in the After checkout with core's own stylelint, prove
    the change is formatting-only (the sorted declaration multiset is unchanged), capture an incremental patch,
    validate it on the pristine tip (`patch --dry-run`, then byte-identical trees), and revert the checkout so the
    variant still reads `patch-state: verified`. The imported MR patch must stay byte-for-byte the same.
29. **A patch validated against "the MR tip" only applies to that tree.** Running `git apply` in an unrelated
    checkout fails every hunk at line 1. Identify the branch and commit first (`git rev-parse HEAD` must equal the
    MR head), then `git apply --check`. Worktree pointers are files, not directories: a checkout may have `.git` as
    a one-line `gitdir:` file.
30. **Push to the issue fork, not to `project/drupal`.** Drupal's project repository rejects protected branch
    names (`review/...` was refused by the pre-receive hook). MR source branches live in
    `https://git.drupalcode.org/issue/drupal-<nid>.git`; check `git ls-remote` there and push
    `HEAD:<mr-source-branch>`.
31. **`main` keeps moving while a PR is open.** After merging, `main` gained new conventions (curated
    human/AI `contributions.json`, warn-only evidence budgets) and changed the layout. Rebuild the PR branch from
    the current base, merge conflicts in generated files (`variants.json`, `cloud/variants.json`) semantically and
    regenerate, then run `ready-to-push` again; a branch that was green yesterday can be stale today.
32. **Record contributions, do not infer them.** The new `contributions.json` is a curated account: kentr's
    mechanism first, then inherited decisions, AI additions and discoveries, rejected approaches, human decisions
    and remaining uncertainty. Commit metadata is not attribution.
33. **Respect the evidence budget as a warning with a reason.** This issue is far over the starting budget
    (files and bytes), mostly because it keeps rendered-pixel evidence and screenshots. That is a deliberate
    trade-off for an accessibility issue where pixels are the proof; say so instead of deleting history.
34. **A transient SSH disconnect is normal; retry with keepalives.** `git push` failed once with "remote end hung
    up" and succeeded on retry with `GIT_SSH_COMMAND='ssh -o ServerAliveInterval=20'`. Do not rewrite history for
    it.
35. **Another session can hold a lock; do the narrow operation instead.** `setup.mjs --refresh-patches` stopped
    on "another setup is already running (pid …)". The patch refresh itself is git-only: `ensurePatches(...)`
    applied the two patches, recorded them and left `patch-state: verified` without waiting for the lock.
