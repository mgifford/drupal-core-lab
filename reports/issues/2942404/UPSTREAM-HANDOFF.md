# Upstream handoff: #2942404

**DRAFT. The branch is pushed; no merge request has been created and no comment or status change
has been posted.** This is the material for a human contributor to review, adapt and submit.

## Current upstream state

Checked 2026-11-26.

| | |
|---|---|
| Issue | https://www.drupal.org/project/drupal/issues/2942404 |
| Status | Needs work (status 13), priority Normal, component markup, version main |
| Last changed | 2026-05-27 |
| Comments | 98 |
| Assignment | Not captured by the intake snapshot. Check the issue page; do not assume it is unassigned. |
| Open merge request | !6112, branch `2942404-11`, head `7dc956336c14`, into `main`, updated 2026-01-15 |
| Other MR | !6058, branch `core-message-landmarks`, old |
| Review threads | !6112 review threads could not be read (HTTP 401). The intake reports 0 unresolved from the data it could read. |

Nothing changed on the issue between the 2026-11-19 fetch and the 2026-11-26 fetch.

The existing MRs are stale:

- !6112 is based on `66a4c78b453b` (2024-02-01) and changes 12 files. Most of its template changes
  are already in current main; the rest does not apply.
- !6058 is also old and is not the consolidated design.

The issue fork `https://git.drupalcode.org/issue/drupal-2942404.git` has no `main`, `11.x` or `12.x`
branch in the branch list read on 2026-11-26. Its current issue branch is `2942404-11` at
`7dc956336c14`; it also carries old `10.0.x` and earlier branches. Do not assume the fork is current.

## Recommended approach

Submit a fresh branch from current core main rather than rerolling !6112. The consolidated design is
new: one named region around the default messages container, with the `Drupal.Message` lifecycle and
ownership-safe cleanup. Rerolling the old per-type design would duplicate a different proposal.

If the issue fork cannot accept a branch based on current main, refresh the fork through the Drupal
issue page first. Do not force-push and do not merge unrelated histories to work around a shallow
clone.

## Final artifact

| | |
|---|---|
| Base commit | `0387fb948f786bc344a5cc54aa0d98b8f552e378` (2026-11-25) |
| Full patch | `reports/issues/2942404/branches/2942404-consolidated-full.patch` |
| SHA-256 | `162da4576775cd4925f414a3e7bc8c6a142c18cd57f0eb34d91cadfc43f1f779` |
| Files | 10 |
| Size | 404 insertions, 11 deletions |

The patch applies cleanly to pristine `0387fb948f78`. The ordered three-patch stack and the full
patch were applied to separate throwaway worktrees and produced identical files; see
[EVIDENCE.md](EVIDENCE.md).

### Production files

- `core/misc/message.js`
- `core/modules/system/templates/status-messages.html.twig`
- `core/themes/default_admin/templates/misc/status-messages.html.twig`
- `core/themes/starterkit_theme/templates/misc/status-messages.html.twig`
- `core/profiles/demo_umami/themes/umami/templates/components/messages/status-messages.html.twig`

### Test files

- `core/tests/Drupal/FunctionalJavascriptTests/Core/MessageLandmarkTest.php` (new)
- `core/tests/Drupal/FunctionalJavascriptTests/Core/JsMessageTest.php`
- `core/tests/Drupal/FunctionalJavascriptTests/Ajax/MessageCommandTest.php`
- `core/modules/big_pipe/tests/src/FunctionalJavascript/BigPipeMessagesTest.php`
- `core/modules/system/tests/themes/test_messages/templates/status-messages.html.twig`

## Suggested branch, commit and MR

Branch name: `2942404-consolidated-landmark`

Commit message:

```text
Issue #2942404: Add a consolidated System messages landmark
```

MR title:

```text
#2942404: Add a consolidated System messages landmark
```

MR description, for the contributor to rewrite:

> Adds one named "System messages" region around the default messages container. The per-type
> status and alert groups, their names, headings, warning urgency and Drupal.announce() are
> unchanged. Drupal.Message adds and removes the same landmark for default JavaScript messages,
> respects author-provided roles and names, and leaves contextual wrappers alone.
>
> Includes regression tests for the lifecycle, ownership, message detection, AJAX, BigPipe and the
> system template.

## Prepared local branch

A clean full-history worktree is prepared and the branch is pushed:

| | |
|---|---|
| Worktree | `/tmp/drupal-2942404-full` |
| Branch | `2942404-consolidated-landmark` |
| Commit | `b11a4441276acd732753ca4c2de6922c30728a75` |
| Base | `0387fb948f786bc344a5cc54aa0d98b8f552e378` |
| Tree | Clean; 10 files, 404 insertions, 11 deletions |
| Remote branch | `https://git.drupalcode.org/issue/drupal-2942404/-/tree/2942404-consolidated-landmark` |

The earlier shallow clone at `/tmp/drupal-2942404` (commit `92ef4c38`) is not pushable and
was not pushed. The full-history clone at `/tmp/drupal-2942404-full` produced the pushed commit.

## Local commands

Run from the Lab repository root.

```bash
cd /Users/mgifford/drupal-core-lab
git -C envs/core.git worktree add --detach /tmp/drupal-2942404 refs/lab/main
cd /tmp/drupal-2942404
git apply /Users/mgifford/drupal-core-lab/reports/issues/2942404/branches/2942404-consolidated-full.patch
git diff --check
git status --short
shasum -a 256 /Users/mgifford/drupal-core-lab/reports/issues/2942404/branches/2942404-consolidated-full.patch
```

The hash must be `162da4576775cd4925f414a3e7bc8c6a142c18cd57f0eb34d91cadfc43f1f779`.

To inspect the patch file itself:

```bash
cd /Users/mgifford/drupal-core-lab
git apply --stat reports/issues/2942404/branches/2942404-consolidated-full.patch
git apply --numstat reports/issues/2942404/branches/2942404-consolidated-full.patch
```

## Install dependencies and run the tests

In the Drupal checkout where the patch is applied:

```bash
composer install
./vendor/bin/phpunit -c core core/tests/Drupal/FunctionalJavascriptTests/Core/MessageLandmarkTest.php
./vendor/bin/phpunit -c core core/tests/Drupal/FunctionalJavascriptTests/Core/JsMessageTest.php
./vendor/bin/phpunit -c core core/tests/Drupal/FunctionalJavascriptTests/Ajax/MessageCommandTest.php
./vendor/bin/phpunit -c core core/modules/big_pipe/tests/src/FunctionalJavascript/BigPipeMessagesTest.php
```

The browser tests need the Drupal test browser configuration and a running web server. In the Lab,
`ddev phpunit` supplies that; a plain core checkout does not.

Core's code checks on the changed files:

```bash
./core/scripts/dev/commit-code-check.sh
```

## Push the branch to the issue fork

The branch has been pushed. The remote tip matches `b11a4441276acd732753ca4c2de6922c30728a75`.
The commands below verify or recreate the push; they are not needed for the current submission.

```bash
cd /tmp/drupal-2942404-full
git log -1 --oneline
git status --short
git remote -v
git push issue-fork 2942404-consolidated-landmark
```

`issue-fork` is already configured as
`https://git.drupalcode.org/issue/drupal-2942404.git`; do not run `git remote add` again. HTTPS has
no stored credential on this machine, so the push prompts for the Drupal.org username and a GitLab
personal access token with `write_repository`. SSH port 22 to `git.drupalcode.org` timed out here;
use HTTPS unless your network allows SSH. Do not put a token in a command, a report or the repository.

If the branch must be recreated elsewhere, apply the full patch to a clean `0387fb948f` checkout,
stage the 10 files, and commit with the message above.

If the fork rejects the push because its history is old or shallow, refresh the issue fork from the
Drupal issue page. Do not force-push and do not merge unrelated histories.

## Create the merge request

Open this URL to create the MR with the source branch already selected:

```text
https://git.drupalcode.org/issue/drupal-2942404/-/merge_requests/new?merge_request%5Bsource_branch%5D=2942404-consolidated-landmark
```

Target `main` in `project/drupal`.

1. Open the issue fork on git.drupalcode.org.
2. Create a merge request from `2942404-consolidated-landmark` into `main` in
   `project/drupal`.
3. Use the MR title and description above.
4. Link the MR on the drupal.org issue; attach the full patch only if the issue workflow asks for it.

Do not change the issue status, assign the issue or post the comment automatically.

## Remaining manual verification

- A person with VoiceOver should use the landmark rotor on both After routes and navigate back to
  the dynamically inserted messages. The automated 06:39 VoiceOver run covers both After routes; its
  Before front route did not start, so Before front comes from the earlier 01:31 run.
- NVDA with Firefox and Chrome, and JAWS where available.
- Stark, starterkit and Umami in a browser on the final code. The system template is covered by
  `MessageLandmarkTest`; Umami is not.
- Default Admin dismissal remains a separate existing defect: opacity plus `visually-hidden`, no DOM
  removal; the landmark can remain over visually hidden messages and the Hide button stays
  focusable. Do not expand this patch to fix it.
- The six duplicate Views table-header IDs on `/admin/content` are unrelated. Do not include them.

## Recommended issue status after submission

Set the issue to **Needs review** after the MR is created and the patch is attached. Do not mark it
Fixed or RTBC. A human must review the accessibility evidence and the remaining manual verification.

## CI follow-up (2026-11-26)

MR !17968 is open at head `b11a4441276acd732753ca4c2de6922c30728a75`. Its pipeline failed on
`BigPipeTest::testBigPipe`, `BigPipeTest::testBigPipeNoJs` and three performance budgets. The
follow-up is a minimal diff against that head:
[`branches/2942404-ci-fixes.patch`](branches/2942404-ci-fixes.patch),
sha256 `14f1f5d3eb3cf355ec8077a118c084c16ead80148d41f59288dbc03a11e703df`.
It fixes the two BigPipe fixture strings, moves the three `ScriptBytes` centres by the measured
compact delta (+1,878 bytes) with the 2,000-byte tolerance unchanged, simplifies `message.js`
without changing behaviour, and adds a language-change regression test. The full squashed
proposal is
[`branches/2942404-consolidated-full-v2.patch`](branches/2942404-consolidated-full-v2.patch),
sha256 `a5cb02b0aa6012f385715ad8df68a565c1e3f02d36eea5c8d988e05ce69f58f9`, 14 files.
Targeted PHPUnit and lint results are in [CI-FIXES.md](CI-FIXES.md). This follow-up has not
been pushed; the MR head is still `b11a4441`.
