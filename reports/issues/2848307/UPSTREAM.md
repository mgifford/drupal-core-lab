# Upstream submission instructions

**Do not push, create a merge request, or post to drupal.org without the owner's explicit
approval.** The lab has only drafted this material.

## 1. Confirm the base and the patch

1. Read the issue, its related issues (#3083103, #2509268) and every review thread on the existing
   MR, including closed ones. Re-fetch the issue before posting; the local snapshot is from
   2026-11-26.
2. Check the current `main` still starts at or contains the recorded base
   `0387fb948f786bc344a5cc54aa0d98b8f552e378`. If it has moved, rebase the patch and re-run the
   tests; do not present an untested rebase as equivalent.
3. Apply [the consolidated patch](branches/2848307-table-inline-errors.patch) to a clean checkout:

       git checkout main
       git pull --ff-only
       git checkout -b 2848307-table-inline-errors
       git apply /path/to/2848307-table-inline-errors.patch
       git status --short

   The patch includes its test fixture and tests.

## 2. Run the checks

    cd core
    vendor/bin/phpunit -c phpunit.xml.dist modules/inline_form_errors/tests/src
    vendor/bin/phpunit -c phpunit.xml.dist modules/system/tests/src/Functional/Module/UninstallTest.php
    vendor/bin/phpunit -c phpunit.xml.dist modules/system/tests/src/Functional/Form/ElementsTableSelectTest.php
    vendor/bin/phpunit -c phpunit.xml.dist modules/system/tests/src/FunctionalJavascript/Form/ElementsTableSelectTest.php
    vendor/bin/phpunit -c phpunit.xml.dist modules/system/tests/src/FunctionalJavascript/ModuleUninstallFilterTest.php

Run the project's own code checks on the changed files (CSpell, PHPStan, PHPCS, twig-cs-fixer,
ESLint) with the current core tooling. The lab run of `node scripts/lint.mjs 2848307-latest`
passed on 2026-11-26; re-run it on the current base rather than citing that result.

To show the regression, apply only [the test-only patch](branches/2848307-tests-only.patch) to a
clean `0387fb94` tree and run the same tests. They must fail before the production patch and pass
after it.

## 3. Prepare the merge request

- The existing MR is !16355, source branch `2848307-inline-errors-not` in the
  `drupal-2848307` issue fork. Either update that branch or open a new MR from a fresh branch;
  say which one in the issue comment.
- The MR body should:
  - state the core base and the exact commit tested;
  - list the production change and the test fixture;
  - state that the previous recursive `setTableElementInlineErrors()` and its `#prefix` HTML are
    removed;
  - include the AI-assistance disclosure;
  - state the evidence boundary (virtual screen reader only; no real VoiceOver/NVDA run; #3083103
    remains separate).
- Attach both the full patch and the interdiff:
  - full patch: `branches/2848307-table-inline-errors.patch`;
  - interdiff from the experimental combined patch:
    `branches/2848307-interdiff-experimental-to-consolidated.patch`.
  Pin the base for both and say what tree each applies to.

## 4. Issue comment

Use [ISSUE-COMMENT-DRAFT.md](ISSUE-COMMENT-DRAFT.md) as the starting text. Before posting:

- re-read the issue summary and the MR threads;
- replace test counts or links if the patch has changed;
- keep the "limits" paragraph, especially the missing real screen-reader pass;
- leave the issue status to a person; do not mark RTBC from this lab.

## 5. What not to do

- Do not push to `main`.
- Do not create or force-push an MR without approval.
- Do not claim a real VoiceOver/NVDA result; only the Guidepup virtual screen reader was run.
- Do not fold #3083103's general error-association framework into this patch. If reviewers want
  individual control/error IDREFs, that belongs in #3083103.
