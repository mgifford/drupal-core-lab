# Evidence: issue 3594809

Status: **DRAFT.** Static checks and preparation only. A person has not
reviewed the live control, and no live Drupal browser test ran.

Date: 2026-11-23  
Author/agent: Copilot SDK in VS Code

## Environments

| Environment | Directory | Core commit | Patch state |
|---|---|---|---|
| Pinned Before | `envs/baseline-3594809` | `07d6e6935e795a62266697da0286a77b7c94b1a4` | Pristine; no tracked changes |
| Pinned After | `envs/issue-3594809` | same base | MR !16770 `main.patch`; original bytes preserved |
| Latest Before | `envs/baseline-3594809-latest` | `97c6ff8b2534b242c0f1df3e4ba2493e56aebcec` | Pristine; no tracked changes |
| Latest After | `envs/issue-3594809-latest` | same base | Separate current-main rebase; applies cleanly |

MR tip: `94a48fe8ed1a64dbb7cde2cbdc66cd9f7f88db6f` (updated 2026-08-19).

## Patch identity

| Patch | Purpose | SHA-256 |
|---|---|---|
| `main.patch` | Exact imported MR delta from its merge base to its tip | `37cf48a602eb6cdb95c8105ab0ddfefc56b70a5266c063b1a9c8bc1ace37a2ce` |
| `delete-empty-stylesheets.patch` | Separate pinned corrective deletion of the two empty files | `86e726a99b4feffe562be9a1d7c4cbaf0a306b80fb16735a2c82d110f87a4f37` |
| `main-rebased-97c6ff8b.patch` | Equivalent full proposal on current `main` | `3b4c3eecb6276431c223ea28438da9b39e40b6a6962a6337e705a39131efcf73` |

The original patch is unchanged. The current-main proposal also has a textual
interdiff: `branches/main-rebased-97c6ff8b.interdiff`.

## Static source and patch results

| Check | Result |
|---|---|
| Original MR on pinned Core, `setup --check-patches` | PASS |
| Original MR on current `main`, `setup --check-patches` | FAIL: patch does not apply to both toggle stylesheets |
| Pinned original plus corrective deletion, cached-index `git apply --cached --check` | PASS |
| Current-main rebase, cached-index `git apply --cached --check` | PASS |
| Pinned checkout-only application | PASS; original patch state recorded |
| Current-main checkout-only application | PASS; Before and After share `97c6ff8b2534` |
| Baseline tracked files at the end of preparation | No tracked changes on pinned or latest Before |

At the pinned base, `form--checkbox-toggle.pcss.css` sets the ordinary
standalone checkbox to 2.5 rem by 1.5 rem, removes its native appearance, adds
a pseudo-element, and animates a switch thumb. The shared
`form--checkbox-radio.pcss.css` defines a 21 by 21 pixel checkbox with a
checked-image background.

The MR removes the toggle stylesheet library reference. It does not alter
checkbox markup, ARIA, or form submission code.

## Core CSS pipeline

Command:

```bash
node scripts/css-build.mjs 3594809-pinned --check --host --stylelint --json
```

Result: **FAIL** on the original MR.

- `form--checkbox-toggle.pcss.css`: changed, but its compiled output does not
  match Core's generated result.
- `form--checkbox-toggle.pcss.css`: Stylelint `no-empty-source`.
- `form--checkbox-toggle.css`: Stylelint `no-empty-source`.
- The original patch includes a compiled-output change, but it tracks both
  files at zero bytes instead of deleting them.

Report:
[`css-build/2026-11-23-3594809-pinned-after.md`](css-build/2026-11-23-3594809-pinned-after.md)

The latest rebase actually deletes both files and therefore has no remaining
PostCSS source to compile. Its CSS command returned `SKIPPED` with
source/output consistency `PASS`; Stylelint is also `SKIPPED` because no CSS
files remain. This is not a browser or accessibility result. See
[`css-build/2026-11-23-3594809-latest-after.md`](css-build/2026-11-23-3594809-latest-after.md).

The corrective pinned stack also returns `SKIPPED` with source/output
consistency `PASS`: both the source and compiled files are deleted. See
[`css-build/2026-11-23-3594809-corrected-after.md`](css-build/2026-11-23-3594809-corrected-after.md).

## Lint and environment blocks

Host `scripts/lint.mjs 3594809-pinned --host` could not start because the
host has no `composer` executable. This is recorded as **ERROR**, not a lint
failure.

DDEV setup began but failed before Drupal installation:

```text
failed to create container start-chown... no space left on device
```

Host storage reported 5.4 GB available after the failure. The DDEV Docker
overlay, not the patch, was the limiting resource. No shared images, project
volumes, or snapshots were pruned.

By final verification, host storage had recovered to 24 GB. The #3594809 sites
were still stopped, and three unrelated Before/After pairs (#2574721,
#3466040, and #3590502) were running in the shared environment. The Lab policy
is to run one comparison pair at a time, so those pairs were not stopped and
the #3594809 sites were not started concurrently.

`tools/compare/diff.mjs` cannot run without installed, running DDEV sites.
The generated report would otherwise have required a `ddev drupal login`
command that was unavailable in the interrupted environment.

## Automated browser results

The evaluator
[`tools/playwright/evaluate-3594809.mjs`](../../../tools/playwright/evaluate-3594809.mjs)
passes `node --check`. It was **not run**.

No result is claimed for:

- native checkbox role, name, state, or ARIA;
- checked, unchecked, focus, disabled, grouped, or radio presentation;
- Tab, Space, pointer, or label activation;
- discarding a pending value before save;
- persistence after Save configuration and reload;
- axe-core;
- browser accessibility tree;
- light, dark, forced-colors, RTL, reduced motion, zoom, or reflow.

## Findings

1. The original MR's intended CSS removal is explicit and limited to the
   toggle stylesheet and its library registration.
2. The original MR is not pipeline-clean because it leaves two tracked empty
   CSS files.
3. A small corrective patch can delete those files without rewriting the
   original MR patch.
4. Current `main` contains related focus, disabled-state, dark-mode, and
   naming refactors, so the original patch needs a separate rebase.
5. The local rebase is patch-equivalent in intent: delete both toggle files
   and remove the one library entry.

## Not verified

No live visual, interaction, screen-reader, keyboard-by-person, native
forced-colors, 200% or 400% browser zoom, or disabled-user evaluation was done.
Automated source evidence does not establish WCAG conformance or RTBC.
