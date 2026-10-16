# Evidence for #3207233

Date: 2026-10-16. DRAFT. No Drupal sites were built or tested in this session.

## Environment and scope

- Lab base: `72a21944f0032a31b827e19998e36a233864078e`.
- Core proposal base: `ca18edacfe9b9c2afc217151cd40653b90575f9e`.
- `doctor`: Node and git available; DDEV absent and Docker unreachable.
- PHP unavailable; no PHP syntax, PHPUnit, PHPCS, or PHPStan success is claimed.
- No manual keyboard, OS screen reader, browser replay, or axe run against Drupal occurred.

## Validation

The core patch was checked for clean application against the exact source files earlier in this session. Additional lab integration checks and their results are recorded below after execution. A standalone fixture test of the Guidepup snapshot helper returned the expected active link text; this validates only that helper, not Drupal output.

## Pending local results

| Check | Result |
|---|---|
| Recipe installation and four fixture entities | NOT RUN |
| Drupal runtime and workspace switching | NOT RUN |
| Browser matrix and axe | NOT RUN |
| Updated testWorkspaceList PHPUnit test | NOT RUN |
| Drupal code checks | NOT RUN |
| Manual keyboard, focus, and forced colors | NOT RUN |
| Off-canvas, pagination, translations, read-only access | NOT RUN |

Add dated run links and exact revisions here after testing. The caption and retained highlight remain proposals for usability review.

## Completed integration checks

- PASS: the lab setup command with --check-patches applied the proposal to the full pinned core checkout from the official GitHub mirror.
- PASS: replay JavaScript syntax and fixture shell syntax.
- PASS: both variants resolve, patch paths exist, coverage matrices validate, viewer probe expressions compile, and recipe YAML parses.
- PASS: standalone Guidepup snapshot helper preserves the active-state link text.
- PASS: generated issue index includes #3207233; tracked diff whitespace check passed.
- INCOMPLETE: repository selftest. Script syntax passed; the lab unit-test stage did not complete successfully. Automatic approval review blocked continuation after flagging unexpected access to an invalid host. No overall selftest pass is claimed.
- NOT RUN: latest-main patch check. It encountered a setup lock held during the lab tests. The pinned full-checkout patch check passed.

No repository dependency manifests or shared scripts were changed. Re-run selftest in the local lab and investigate any actual failure before proposing a pull request.
