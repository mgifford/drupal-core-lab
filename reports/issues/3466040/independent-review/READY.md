# #3466040 — ready-for-“Needs review” package

**DRAFT handoff.** This is the local candidate, not the upstream MR. It has not been pushed, the MR was
not modified, and the drupal.org issue status was not changed. The final decision remains with the human
reviewer.

| | |
|---|---|
| Issue | [#3466040](https://www.drupal.org/project/drupal/issues/3466040) |
| MR | [!9088](https://git.drupalcode.org/project/drupal/-/merge_requests/9088) at `aed1df5eeddf0b89c91bab47eb83847f44c58211` |
| Base | `97c6ff8b2534b242c0f1df3e4ba2493e56aebcec` (2026-11-23, Drupal 12.0-dev) |
| Candidate | MR + observer reuse (production) + test hardening |
| Status after applying + CI | **Needs review** (not RTBC) |

## What to apply

Apply the interdiff to the MR branch, or the full patch to the base if you are rebuilding the branch:

| Artifact | Applies to | What it contains | sha256 |
|---|---|---|---|
| [`fix/3466040-interdiff-vs-mr.patch`](fix/3466040-interdiff-vs-mr.patch) | MR head `aed1df5e` | production fix + test hardening | `3e77ac86bda079c6a5f9c8b8163b647834685f6e4d7dd66b7b9a900a53145c68` |
| [`fix/3466040-full-candidate.patch`](fix/3466040-full-candidate.patch) | base `97c6ff8b` | MR + production fix + test hardening | `5287096fe8760fd9c0a174fa393e6844f8180df83bf7fc575f4275b00e46656c` |
| [`fix/3466040-observer-reuse.patch`](fix/3466040-observer-reuse.patch) | MR head `aed1df5e` | production fix only, if you prefer to review it separately | `56f4e12e7d56b62141821f4b602c596ca880af344cecfa524fde48606158a0ed` |

All three patches were checked with `git apply --check` against their declared trees. The full candidate
contains the MR's three test/fixture files; the interdiff changes only `dialog.position.js` and
`ModalRendererTest.php`.

## What changed

**Production — `core/misc/dialog/dialog.position.js`**

- Reuse one `ResizeObserver` per dialog content element instead of creating a new one on every
  `dialog:aftercreate` (the MR's stacking defect).
- Cancel the previous debounced `autoResize` before replacing it, and store the current event data and
  target; the observer callback calls the latest debounced function with the latest data.
- On `dialog:beforeclose`, disconnect and `removeData()` the observer, target, event data and debounce.

**Test — `core/modules/system/tests/src/FunctionalJavascript/ModalRendererTest.php`**

- Assert `details.open === false` before the click and `true` after it.
- Assert `.ui-dialog-content` actually scrolls (`scrollHeight > clientHeight`, `overflow-y: auto|scroll`).
- The existing geometry and titlebar/button-pane assertions are unchanged.

## Verification

| Gate | Result |
|---|---|
| Field UI AJAX lifecycle, 1920×1080 | MR only: **3 patch observers** (ids 10/11/12), **2 still connected** after close. Candidate: **1 patch observer** (id 10), **1 disconnect**, **0 leaked** (`observersCreated` 10 vs 12; 9 page observers + 1 patch). |
| Hardened test with candidate | **OK (1 test, 6 assertions)**, 1:01 ([log](regression/after-hardened-testModalContentGrows.log)). |
| Hardened test without production JS | **FAIL** at the geometry assertion (`ModalRendererTest.php:187`): 1 test, 5 assertions, 1 failure ([log](regression/before-hardened-testModalContentGrows.log)). |
| Translation modal, 125 % reflow | With candidate: **reproduced-and-fixed** — Before `69.8px` overflow, Save outside the 864 px viewport and not hittable; After fits and Save hittable ([run](runs/translation-125-fix-verify/results.json)). |
| Core code checks | **PASS**: CSpell 0 issues, PHPStan no errors, PHPCS passed, ESLint passed (`node scripts/lint.mjs` on the local probe variant, 43 s). |
| Patch applicability | Interdiff applies to MR head; full patch applies to base. |

The observer probe records one entry per `aftercreate` even when the same observer is reused, so the
candidate still shows three *records* — all id 10. `observersCreated` and the repeated id are the
authoritative count.

## What is not in this package

- **400 % reflow width**: the translation modal is 882 px wide in a 480 px CSS viewport, a pre-existing
  `config_translation` width choice (402 px off-screen horizontally). This MR does not change width; it
  should be a separate issue.
- **Pre-existing window-handler re-registration** on repeated `aftercreate` (the older half of the code
  review's F1). The candidate fixes the observer stacking; the handlers are a separate cleanup.
- **A person's keyboard/AT pass** and the colour/motion/browser matrix. The automated evidence does not
  replace them.
- **Content inserted into an already-open dialog** is still untested beyond repeated `aftercreate`; state
  that scope in the MR.

## Suggested note (draft, not posted)

> I re-tested !9088 at `aed1df5e` and the fixture/125 % translation cases. The observer is created
> three times in the Field UI AJAX flow and only the last one is disconnected; the attached interdiff
> reuses one observer, cancels the previous debounce and removes the data on close. With it the Field
> UI flow shows one observer and one disconnect, the hardened test passes (6 assertions) and fails
> without the production change, and ESLint/PHPCS/PHPStan pass. The 400 % width overflow is
> pre-existing and separate. I recommend applying the interdiff and moving the issue to Needs review.

## Suggested next steps

1. Apply the interdiff (or full patch) and re-run CI.
2. Confirm the *Test-only changes* job still fails without the production JS, and Functional Javascript,
   PHPCS, ESLint and PHPStan pass.
3. Set the issue to **Needs review** with the fixture + translation-125 % evidence and this package.
4. Leave RTBC and the 400 % width issue to the maintainer/human review.

The pair was restored after testing: `baseline-3466040` is pristine and `issue-3466040` is the MR only.
The candidate is in `fix/`; it is not applied to the shared environments.
