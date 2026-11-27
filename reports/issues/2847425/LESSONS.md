# Lessons from the #2847425 evaluation (2026-11-26/27)

Written after finishing the Before/After/refinement evaluation. Ordered by how much time each one cost.

## 1. Check the machine before starting a build

- The host had **206 MB free** on a 228 GB volume. Two core worktrees need about 1.5 GB, so the second
  `git worktree add` failed with `No space left on device`. Docker then went read-only and the daemon restarted.
- `node scripts/lab-env.mjs disk` shows free space, per-environment sizes and Docker's usage. Run it **before**
  `setup.mjs`, not after a failure.
- `trim all --deep` freed about 8 GB (test output, snapshots, `core/node_modules` in every environment). It also
  removes other sessions' `node_modules`; they come back with `cd envs/<name>/core && yarn install`.
- Docker's disk image is sparse and does not shrink when space is freed inside it; do not assume `docker system
  prune` will give the host space back.

## 2. DDEV needs paths outside the workspace

`ddev config`, `ddev start`, `ddev drupal login` and `ddev phpunit` write `~/.ddev/project_list.yaml` and Docker
volumes. Under a workspace-only file policy they fail with `operation not permitted`, and the error looks like a
DDEV bug until you read it. Every command that starts or drives DDEV needs the wider sandbox mode; script the
whole sequence so it is one approval, not ten.

## 3. Do not pipe a long build through `tail`

`setup.mjs | tail -20` buffers everything and shows nothing for 20 minutes. When the session restarted during a
build, the process died and the only evidence was a stale lock file. Redirect to a log and read the log, or drop
the pipe.

## 4. A stale setup lock needs a liveness check

`envs/.setup.lock` holds a PID. `kill -0 <pid>` says whether it is alive. Remove the file only when the process is
gone (a session restart leaves it behind). Two concurrent `setup.mjs` runs are refused for good reason: both would
reconfigure DDEV and Docker.

## 5. Element IDs are not stable across an AJAX replacement

`Html::getUniqueId()` suffixes IDs when the form is rebuilt for the AJAX response: `edit-combined` becomes
`edit-combined--5ECXj2fyHAY`, the upload ID and the description ID change with it. Tests and evaluators that hold
`#edit-…` selectors work before the upload and fail after it.

Use stable hooks instead:

- form item: `.js-form-item-<machine-name>` (`clean_class` turns `_` into `-`);
- upload control: `input[name="files[<name>]"]` (multiple: `files[<name>][]`);
- remove/upload buttons: `input[name="<name>_remove_button"]`, `input[name="<name>_upload_button"]` (theme
  classes such as `remove-button` are not in Stark);
- forms inside `details`/`fieldset`/`container` are **flattened** (those elements do not set `#tree`), so the child
  ID is `edit-textfield-in-details`, not `edit-details-textfield-in-details`.

## 6. Temporary file names must be unique per run

Core refuses `temporary://name.txt` if it already exists: "The file temporary://x.txt already exists." A second
run of the evaluator then fails on an upload that worked the first time. Use a random suffix and build the tests
and evaluator to be repeatable.

## 7. FunctionalJavascript test API details that cost a run each

- `statusCodeEquals()` throws `UnsupportedDriverActionException` in `WebDriverTestBase`; assert an element instead.
- `assertNoDuplicateIds()` is not on `WebDriverWebAssert`; do duplicate-ID checks in `executeScript` or leave them
  to the browser run.
- `assertWaitOnAjaxRequest()` has no filter; if the client-side validator blocks the change there is no request and
  it throws "There are no AJAX requests to wait for."
- `file.js` validates the extension **before** the request (`change.fileValidate`) and blocks it; to exercise the
  server-side error path, unbind that handler or fail on a size limit instead.
- `file.js` also disables every other file input for one second when an upload starts; wait for the input to be
  enabled (`!el.disabled`) before the next upload instead of sleeping.
- Uploaded paths must be readable by the browser (the Chrome container). Put generated files next to core's own
  test files or under the project, not in a host-only temp directory.

## 8. #states ownership on `managed_file`

- Visibility, disabled and the other states belong on the **wrapper inside `.js-form-item`**. `states.js` uses
  `closest('.js-form-item, .js-form-wrapper')`; a state on the AJAX replacement wrapper sits outside the form item
  and hides the enclosing group.
- `required`/`optional` belong on the **upload control**: `states.js` finds the label from the target's own ID and
  sets the HTML `required` attribute.
- A hidden `fids` input is never a valid target for `required`: the attribute is invalid and no label can
  reference an id-less hidden input.
- `preprocessManagedFile()` preserving `#attributes` also preserves `disabled` on the wrapper `<div>`. That is
  invalid, does nothing, and breaks `FormTest`'s count (44 → 45). Strip control-only attributes, keep
  `data-drupal-states`, `id`, `class` and custom attributes.
- The admin theme (Default Admin) has its own managed-file template and preprocess (`main_items`, `has-upload`
  classes); Stark does not. Counts and markup differ by theme, so compare like with like and test both.

## 9. AJAX + states has a known gap; do not silently fix it here

After a replacement, new dependents never receive the dependee's current state: `states.Trigger` skips
initialization when the dependee already has `data('trigger:<state>')`, so the initial `state:*` event is not fired
again. The element stays visible and the required marker stays off until a trigger changes. That is
[#1091852](https://www.drupal.org/project/drupal/issues/1091852); the label-association half is
[#3513308](https://www.drupal.org/project/drupal/issues/3513308). Record it, do not "fix" it in a managed-file
patch: the change would be global and belongs in its own issue with its own tests.

## 10. One complete patch beats a growing stack

The lab stack (MR + fixture + refinements) hit two problems:

- `capture-patch.mjs` records the environment against the declared list; adding a patch makes earlier runs stale.
- A refinement that reverts a file to core (here `FormTest.php`) is a **net no-change** for that file, and
  `lint.mjs` refuses with "patched files are unchanged from core (patches not applied?)".

Generating one `2847425-complete.patch` against the pinned baseline (and a separate `2847425-interdiff.patch`
against the MR tip) removed both problems and matches the deliverable the issue needs. Use the lab stack to
iterate; ship the complete patch.

## 11. Lint early, and read what it actually complains about

- CSpell rejects British spellings (`behaviour`) in core; PHPCS wants one blank line after a method.
- `lint.mjs` exits 0 with only a warning when a patched file is unchanged; a "PASS" needs the report file and the
  "Result: PASS" line.
- `capture-patch` / `lint` must run again after any test edit, or the patch and the evidence describe different
  code.

## 12. Keep the evidence index honest

- Aborted runs leave folders without `results.json`. Add `ABORTED.md` with the cause (close-out asks for it) or
  the folder looks like missing evidence.
- Mark a superseded run with `scripts/run-mark.mjs … --superseded --reason`; do not delete it.
- `index-issues.mjs` reads the **first** patch row in `BRANCHES.md` for the tested tip. With a historical row on
  top, the index says "re-test" forever. Put current rows first and the historical ones in their own section.
- `issue-tracking.mjs` assumed `status.json`'s `mr` is an object; one issue stored a URL string and crashed the
  whole index. A `String(mr.sha || '')` guard fixed the crash, but the real fix is the malformed record.
- Refresh `status.json` (`issue-status.mjs <nid> --write`) before indexing, or the index reports the old MR head.

## 13. What went well

- A single evaluator built on `lib/lab-run.mjs` recorded context, AJAX commands, speech, axe, JS errors and focus
  for every side, so the A/B/C tables and the screenshots came from one script.
- Extending the MR's own fixture and test (instead of a separate lab module) meant the PHPUnit results and the
  browser evidence exercise the same form.
- Keeping the MR's corrective commit untouched, and separating "introduced by the MR" from "pre-existing", made
  the report's recommendations short and defensible.
- Writing the draft comment to `check-draft.mjs`'s rules (<180 words, no headers, disclosure line) took one
  iteration; doing it at the end was cheaper than drafting prose early.
