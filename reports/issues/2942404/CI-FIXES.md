# CI fixes for MR !17968: #2942404

**DRAFT, AI-assisted. Not reviewed by a person. Nothing was pushed.**

Date: 2026-11-26.
Issue: https://www.drupal.org/project/drupal/issues/2942404
MR: https://git.drupalcode.org/project/drupal/-/merge_requests/17968
Pipeline: https://git.drupalcode.org/project/drupal/-/pipelines/1068871

Base: `0387fb948f786bc344a5cc54aa0d98b8f552e378`.
MR head tested: `b11a4441276acd732753ca4c2de6922c30728a75`.
After environment: `issue-2942404-consolidated` (base plus the three Variant C patches plus
this follow-up). Before environment: `baseline-2942404-latest`, same base.
Local test stack: PHP 8.5.7, PHPUnit 12.5.44, MariaDB 11.8, Selenium Chrome 143.

This report covers only the failures that belong to this MR. It does not redesign the
accessibility implementation and does not weaken an assertion.

## Follow-up patch

| | |
|---|---|
| Minimal diff against the MR head | [`branches/2942404-ci-fixes.patch`](branches/2942404-ci-fixes.patch), sha256 `14f1f5d3eb3cf355ec8077a118c084c16ead80148d41f59288dbc03a11e703df`, 6 files |
| Full squashed patch against the base | [`branches/2942404-consolidated-full-v2.patch`](branches/2942404-consolidated-full-v2.patch), sha256 `a5cb02b0aa6012f385715ad8df68a565c1e3f02d36eea5c8d988e05ce69f58f9`, 14 files |
| Interdiff | [`interdiff/interdiff-mr-to-ci-fixes.diff`](interdiff/interdiff-mr-to-ci-fixes.diff), same bytes and hash as the minimal diff |

The minimal diff applies on top of the MR head. The full patch applies to `0387fb948f`
alone. Both checks used throwaway worktrees of `envs/core.git`:

```bash
git -C envs/core.git worktree add --detach /tmp/2942404-check 0387fb948f786bc344a5cc54aa0d98b8f552e378
git -C /tmp/2942404-check apply --check "$PWD/reports/issues/2942404/branches/2942404-consolidated-full-v2.patch"
git -C envs/core.git worktree add --detach /tmp/2942404-mrcheck 0387fb948f786bc344a5cc54aa0d98b8f552e378
for p in region message-landmark ownership; do git -C /tmp/2942404-mrcheck apply "$PWD/reports/issues/2942404/branches/2942404-consolidated-$p.patch"; done
git -C /tmp/2942404-mrcheck apply --check "$PWD/reports/issues/2942404/branches/2942404-ci-fixes.patch"
```

All 14 files from the full patch were compared by SHA-256 with the files that ran the tests:
all 14 matched.

## Task 1: BigPipe expectations

`BigPipeTest::testBigPipe` reads
`core/modules/big_pipe/tests/modules/big_pipe_test/src/BigPipePlaceholderTestCases.php`.
The status-messages case expected the old opening tag in two places:

- `embeddedAjaxResponseCommands[0].data` (the JS delivery path);
- `embeddedHtmlResponse` (the no-JS delivery path).

Both now expect:

```html
<div data-drupal-messages role="region" aria-label="System messages">
```

The only change is the opening tag; the status group, hidden heading, message text and
newlines are unchanged. A search of `core/` for `data-drupal-messages>` found no other exact
markup expectation. `BigPipeMessagesTest` and `MessageCommandTest` already assert the new
attributes by CSS selector; they did not need a fixture change.

Results on the After checkout:

| Test | Result |
|---|---|
| `BigPipeTest` (full class) | OK, 5 tests, 160 assertions |
| `BigPipeTest::testBigPipe` and `::testBigPipeNoJs` after the final edits | OK, 2 tests, 90 assertions |

The full class run was made after the fixture change and before the JavaScript optimization;
the two methods were rerun after the fixture change. BigPipeTest is a non-JavaScript test, so the
later whitespace-only `message.js` edit does not affect it. BigPipe delivery, message content,
AJAX replacement and no-JS rendering are still asserted by the same tests.

## Task 2: JavaScript payload

### Measurement method

Core builds JS aggregates with `core/lib/Drupal/Core/Asset/JsOptimizer.php`, which parses each
file with Peast and renders it with `Peast\Formatter\Compact`. Per aggregate, the byte delta is
therefore the compact-rendered delta of `core/misc/message.js`. `ScriptBytes` sums unique
aggregate URLs across all requests, so a file carried by `n` aggregates adds `n × 1,878` to a
test's total. `n` was not measured; the table below assumes `n = 1`. A second copy would still
leave all three residuals inside 2,000; a third copy would not, so the conclusion is not verified
for `n > 2`. It was measured with the same Peast version from `vendor/`:

```bash
docker exec -w /var/www/html ddev-repro-issue-2942404-consolidated-web \
  php .lab-measure.php .lab-before-message.js core/misc/message.js
```

The temporary measurement script was:

```php
<?php
require 'vendor/autoload.php';
foreach (array_slice($argv, 1) as $file) {
  $data = file_get_contents($file);
  $ast = Peast\Peast::latest($data)->parse();
  $renderer = new Peast\Renderer();
  $renderer->setFormatter(new Peast\Formatter\Compact());
  printf("%s\traw=%d\toptimized=%d\n", $file, strlen($data), strlen($renderer->render($ast)));
}
```

The `.lab-*` files were temporary and have been removed. To reproduce, copy the base
`core/misc/message.js` from `envs/baseline-2942404-latest` to the After checkout, save the
script above, and run it on the two files.

| Revision | Source bytes | Compact bytes | Compact delta |
|---|---:|---:|---:|
| Before (base) | 8,424 | 2,765 | — |
| MR head `b11a4441` | 13,504 | 4,746 | +1,981 |
| Final follow-up | 13,293 | 4,643 | +1,878 |

The follow-up removes 103 compact bytes (5.2%) and 211 source bytes from the MR. It keeps the
`landmarks` WeakMap: an earlier attempt to compare against a fresh `Drupal.t('System messages')`
at clear time changed cleanup after a translation change. The safe simplifications are the `LIVE`
selector constant and the flattened `isMessage` check. Documentation comments are kept; they are
stripped by the optimizer and do not affect the payload.

The core performance tests cannot run in this lab: `PerformanceTestBase::prepareEnvironment()`
skips core performance tests when the database is not MySQL, and DDEV runs MariaDB 11.8.
`StandardPerformanceTest` printed:

```text
Drupal core performance tests only run on MySQL
```

The three CI actuals (190,017 / 63,427 / 157,201) are the values reported for pipeline 1068871.
No job log or artifact for them is captured in this workspace, and the pipeline job list shows
the performance job as manual/skipped. They are inputs to the arithmetic, not locally measured
values. They were reconciled with the measured optimizer delta; no lab suite was run with a
substituted database or a weakened skip.

### Expected values

Only the `ScriptBytes` centre moves, by the measured compact delta (+1,878). The tolerance
function (`min(20% of the expected value, 2000)`) is unchanged.

| Test / fixture | Old centre | New centre | Reported CI actual (MR head) | MR-head delta | Delta after the follow-up | Within 2,000? |
|---|---:|---:|---:|---:|---:|---|
| Umami OpenTelemetry, `administratorNodePage.yml` | 187,160 | 189,038 | 190,017 | +2,857 | +979 | yes |
| Umami MultipleRequests, `umamiFrontAndRecipePagesAuthenticated.yml` | 60,671 | 62,549 | 63,427 | +2,756 | +878 | yes |
| Standard Admin, `testAdmin.yml` | 155,112 | 156,990 | 157,201 | +2,089 | +211 | yes |

The table uses the measured final delta (+1,878), not the MR-head delta (+1,981). The reported CI
actuals remain 979, 878 and 211 above the new centres; the remaining growth is baseline drift
already inside the tolerance. That attribution assumes `n = 1`.

Ten other Umami fixtures keep `ScriptBytes: 12091` (eight) and `13345` (two). Their tolerance is
exactly 2,000, so +1,878 leaves only 122 bytes of margin. They did not fail in the reported run,
and no measurement exists for those pages, so they were not changed; a later unrelated JS change
could make them fail.

The ownership record is kept because removing it, as an earlier attempt did, changed cleanup
after a translation change. The updated centres move only by the measured cost of the retained
behaviour.

## Task 3: Accessibility behaviour

The PHPUnit results below are from the final tree. The full `BigPipeTest` class was run after the
fixture change and before the JavaScript simplification; its two named methods were rerun later.
No assertion was relaxed.

| Test | Result | Coverage exercised |
|---|---|---|
| `MessageLandmarkTest` | OK, 1 test, 2 assertions | One named region around server status/alert groups; no nested live region; server messages survive a JS clear; contextual wrapper unchanged |
| `JsMessageTest` | OK, 6 tests, 47 assertions | Lifecycle, empty-container cleanup, detection, author role/name/`aria-labelledby`, name change between add and clear, multiple instances, focus unmoved, contextual wrapper |
| `BigPipeMessagesTest` | OK, 1 test, 3 assertions | BigPipe-delivered messages get one region; status group unchanged |
| `MessageCommandTest` | OK, 2 tests, 61 assertions | AJAX default and alternate locations; one region for default; alternate container untouched |
| `BigPipeTest::testBigPipe` + `::testBigPipeNoJs` | OK, 2 tests, 90 assertions | BigPipe and no-JS delivery of the new opening tag |

The final commands, once DDEV was healthy:

```bash
cd envs/issue-2942404-consolidated
ddev phpunit core/tests/Drupal/FunctionalJavascriptTests/Core/MessageLandmarkTest.php
ddev phpunit core/tests/Drupal/FunctionalJavascriptTests/Core/JsMessageTest.php
ddev phpunit core/modules/big_pipe/tests/src/FunctionalJavascript/BigPipeMessagesTest.php
ddev phpunit core/tests/Drupal/FunctionalJavascriptTests/Ajax/MessageCommandTest.php
ddev phpunit core/modules/big_pipe/tests/src/Functional/BigPipeTest.php
```

During the Docker recovery the same commands were run through `docker exec` with
`core/.env` sourced; the exit status and test counts were identical.

### Code checks

`node scripts/lint.mjs 2942404-final` passed after fixing two Prettier line-wrap errors:
CSpell, PHPStan, PHPCS, Twig CS fixer and ESLint, 14 files (all four patches).
Report: [`lint/2026-11-26-2942404-final-after.md`](lint/2026-11-26-2942404-final-after.md).

## Task 4: unrelated failures

- **Composer build (job 14010962).** Timeout connecting to `api.github.com` while downloading
  `masterminds/html5`. No Composer file, lock file or build test was changed.
- **PHP 8.6 unit jobs (14010964 and 14010966).** Failures name `spl_object_hash()`
  deprecations and extension parsing tests. The lab runs PHP 8.5.7, so the 8.6 matrix was not
  run here. A comparison with upstream main was attempted: the recent scheduled main pipeline
  [1068877](https://git.drupalcode.org/project/drupal/-/pipelines/1068877) at `a48087f` ran
  only a subset of jobs and did not include the 8.6 unit matrix, so it gives no same-version
  comparison. The MR changes no production PHP; its only PHP files are JavaScript test classes,
  which the Unit jobs do not run. No PHP compatibility change is part of this follow-up.
- **Performance jobs.** The pipeline's performance job is manual/skipped. In the lab the core
  performance tests skip on MariaDB, as above. This is an environment limit, not a code
  failure.
- **Docker VM disk.** During the session the host disk filled and Docker Desktop remounted the
  VM disk `/dev/vda1` with `emergency_ro`. Every container's `/var/www` became read-only;
  PHPUnit failed in `tempnam()` and browser tests could not install a site. Restarting Docker
  Desktop recovered the disk. This is infrastructure, not a code change; test results above
  were recorded before and after that event, with the same code and the same test counts.

## What was not verified

- The three performance suites were not executed; their fixtures were updated from the
  measured compact delta and the CI actuals.
- No real screen reader, keyboard-only pass, other browser or forced-colours pass was run for
  this follow-up. The earlier evidence in [SUMMARY.md](SUMMARY.md) still applies to the
  accessibility code. The follow-up does not change the Twig templates; it changes JS internals,
  two BigPipe fixture strings and three performance assertion values.
- The MR was not pushed and no comment was posted.
