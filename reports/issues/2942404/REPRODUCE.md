# Reproduce #2942404: System messages should be accessible

**DRAFT: setup and verification instructions. The scripted evidence is in [EVIDENCE.md](EVIDENCE.md);
a person has not reviewed it.**

Issue: https://www.drupal.org/project/drupal/issues/2942404
Variant: `2942404-final` (issue-scoped, extends `2942404-consolidated`). The shared
`2942404-consolidated` entry still lists the two earlier patches; use `2942404-final` for the final
three-patch stack.
Core built and run on 2026-11-26: `0387fb948f786bc344a5cc54aa0d98b8f552e378` (2026-11-25).

## What this compares

- **Before:** pristine current main.
- **After:** the same commit plus, in order:
  1. [`branches/2942404-consolidated-region.patch`](branches/2942404-consolidated-region.patch):
     one named `region` on the outer `[data-drupal-messages]` container in the system, Default Admin
     and starterkit templates.
  2. [`branches/2942404-consolidated-message-landmark.patch`](branches/2942404-consolidated-message-landmark.patch):
     the `Drupal.Message` lifecycle, the containment fix, the Umami and `test_messages` templates,
     and the first regression tests.
  3. [`branches/2942404-consolidated-ownership.patch`](branches/2942404-consolidated-ownership.patch):
     ownership-safe cleanup, narrower message detection, one-insertion wrapper handling, and the
     expanded tests.

The full squashed proposal is
[`branches/2942404-consolidated-full.patch`](branches/2942404-consolidated-full.patch), sha256
`162da4576775cd4925f414a3e7bc8c6a142c18cd57f0eb34d91cadfc43f1f779`. The interdiff from the
two-patch proposal is
[`interdiff/interdiff-consolidated-v2-to-final.diff`](interdiff/interdiff-consolidated-v2-to-final.diff),
sha256 `6cb142553971da7038a5d886c5c37e060677eaed3e05ef62991cce7f5f32bdbe`.

The original `role="contentinfo"` defect does not reproduce on current main. This comparison tests a
design addition (a landmark), not the original defect.

## Preconditions

- Docker and DDEV available. Run `node scripts/doctor.mjs 2942404-final`.
- Recipe: `recipes/repro_2942404`. It installs the Article content type, core's `system_test`
  module, and (through `apply.sh`) the lab-only `lab_status_messages` module with
  `/lab/status-messages` and `/admin/lab/status-messages`.
- Test extensions are enabled first (`testExtensions: true` in the variant).
- The recipe is applied to both sides. Re-apply with
  `bash scripts/lab-site.sh apply <env> repro_2942404`; a full reinstall is not needed.
- Both sites are Standard installs with `admin` / `admin`. Default Admin is the default and admin
  theme on this core.

## Build and start

From the lab repository root:

```bash
node scripts/doctor.mjs 2942404-final
node tools/compare/setup.mjs 2942404-final
node scripts/lab-env.mjs start 2942404-final
```

`setup.mjs` is resumable and safe to re-run. It reuses `envs/core.git`, Composer and DDEV images. It
does not reinstall JavaScript dependencies.

If the environments already exist, reuse them. To apply only a changed patch stack without a
rebuild:

```bash
node tools/compare/setup.mjs 2942404-final --refresh-patches
```

The 2026-11-26 finalization applied the third patch to the existing environments this way. No
environment was rebuilt.

## Browser evidence

```bash
node tools/playwright/evaluate-2942404.mjs 2942404-final
```

The evaluator records, per scenario, the rendered theme (from `drupalSettings.labActiveTheme`), the
containers and their roles/names, live regions, headings, duplicate IDs by value and element,
focus, axe-core results, and the announcement recorder. It runs the `Drupal.Message` lifecycle
assertions and compares Before/After duplicate-ID sets.

Latest run:
[`playwright/2026-11-26T03-33-47-385Z-chromium-light-1280x900`](playwright/2026-11-26T03-33-47-385Z-chromium-light-1280x900/SUMMARY.md).

## Screen reader evidence

```bash
node tools/playwright/screenreader-2942404.mjs 2942404-final --mode=virtual
```

Real VoiceOver (`--mode=voiceover`) drives Safari and speaks aloud. It was not repeated after the
ownership/detection patch. The real VoiceOver evidence for the two-patch code and the focused human
protocol are in [SCREENREADER.md](SCREENREADER.md).

Latest virtual run:
[`screenreader/2026-11-26T03-34-45-279Z`](screenreader/2026-11-26T03-34-45-279Z/SUMMARY.md).

## Core regression tests

The tests are part of the After patch:

```bash
cd envs/issue-2942404-consolidated
ddev phpunit core/tests/Drupal/FunctionalJavascriptTests/Core/MessageLandmarkTest.php
ddev phpunit core/tests/Drupal/FunctionalJavascriptTests/Core/JsMessageTest.php
ddev phpunit core/modules/big_pipe/tests/src/FunctionalJavascript/BigPipeMessagesTest.php
ddev phpunit core/tests/Drupal/FunctionalJavascriptTests/Ajax/MessageCommandTest.php
```

`JsMessageTest` contains separate tests for the basic lifecycle, ownership, message detection and
multiple instances. `MessageLandmarkTest` covers the system template, including server messages
followed by JavaScript messages and clearing the JavaScript ones. `MessageCommandTest` covers AJAX
default and contextual wrappers. `BigPipeMessagesTest` covers BigPipe-delivered messages.

`MessageLandmarkTest` fails on unmodified Before at the first landmark assertion. To repeat that
without editing the baseline permanently, copy the test file into
`envs/baseline-2942404-latest` at the same path, run it with `ddev phpunit`, then remove the copy and
check `git status`. The same applies to `BigPipeMessagesTest` and `MessageCommandTest`.

The ownership and detection tests fail on the two-patch implementation (the code that introduced the
lifecycle) and pass on the final code.

## Code checks

```bash
node scripts/lint.mjs 2942404-final
```

It runs core's `commit-code-check.sh` in the After DDEV container on the files the patches change:
CSpell, PHPStan, PHPCS, ESLint, Twig CS fixer and the generated-CSS check. Latest report:
[`lint/2026-11-26-2942404-final-after.md`](lint/2026-11-26-2942404-final-after.md), PASS.

## Patch verification

```bash
node tools/compare/setup.mjs 2942404-final --check-patches
```

This checks that the ordered three-patch stack applies to current main. To check the full squashed
patch, apply it to a throwaway worktree of `envs/core.git` at `refs/lab/main` and compare the 10
files with the After checkout. The 2026-11-26 verification found identical hashes.

## Coverage

```bash
node scripts/coverage.mjs 2942404
```

`COVERAGE.md` uses `2942404-final` as the primary variant and reports 1 of 6 matrix environments
tested (Chromium light 1280x900), plus 5 gaps.

## Environment and lease notes

- `node scripts/lab-env.mjs status` shows the two environments and which variants use them.
- The November 25 environments were no longer present when this work started. New environments were
  built at current main `0387fb948f`; they were not rebuilt at `92e5c3a304`.
- Do not reset or rebuild the two environments while collecting evidence. Stop them with
  `node scripts/lab-env.mjs stop 2942404-final` when done; do not delete them unless disk requires
  it.
- The recipe's `lab_status_messages` module is test support. It attaches
  `drupalSettings.labActiveTheme` so the evaluator can record the theme that actually rendered the
  page.

## CI follow-up (2026-11-26)

The follow-up patch is applied on top of the three-patch stack. `reports/issues/2942404/variants.json`
lists it as the fourth After patch. To check it without rebuilding, from the repository root:

```bash
git -C envs/core.git worktree add --detach /tmp/2942404-check 0387fb948f786bc344a5cc54aa0d98b8f552e378
git -C /tmp/2942404-check apply "$PWD/reports/issues/2942404/branches/2942404-consolidated-full-v2.patch"
git -C envs/core.git worktree add --detach /tmp/2942404-mrcheck 0387fb948f786bc344a5cc54aa0d98b8f552e378
for p in region message-landmark ownership; do git -C /tmp/2942404-mrcheck apply "$PWD/reports/issues/2942404/branches/2942404-consolidated-$p.patch"; done
git -C /tmp/2942404-mrcheck apply "$PWD/reports/issues/2942404/branches/2942404-ci-fixes.patch"
```

The targeted tests, on the running After environment:

```bash
cd envs/issue-2942404-consolidated
ddev phpunit core/tests/Drupal/FunctionalJavascriptTests/Core/MessageLandmarkTest.php
ddev phpunit core/tests/Drupal/FunctionalJavascriptTests/Core/JsMessageTest.php
ddev phpunit core/modules/big_pipe/tests/src/FunctionalJavascript/BigPipeMessagesTest.php
ddev phpunit core/tests/Drupal/FunctionalJavascriptTests/Ajax/MessageCommandTest.php
ddev phpunit core/modules/big_pipe/tests/src/Functional/BigPipeTest.php
```

The three performance tests skip here because the lab runs MariaDB and core's
`PerformanceTestBase` only runs them on MySQL. The measured compact delta and the updated
`ScriptBytes` centres are in [CI-FIXES.md](CI-FIXES.md).

During this run Docker Desktop remounted its VM disk read-only when the host disk filled.
The recovery was to restart Docker Desktop; no environment was rebuilt and no database was
changed. The follow-up and full patches are in [BRANCHES.md](BRANCHES.md).

## Not done here

No drupal.org comment was posted and no issue status was changed. The draft is
[ISSUE-COMMENT-DRAFT.md](ISSUE-COMMENT-DRAFT.md); the contribution handoff is
[UPSTREAM-HANDOFF.md](UPSTREAM-HANDOFF.md).
