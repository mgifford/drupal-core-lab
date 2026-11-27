# Independent review: #2942404 JavaScript payload and performance-budget arithmetic

**DRAFT, AI-assisted. Not reviewed by a person.**
Date: 2026-11-26. Reviewer: fresh-context subagent (task-2).
Issue: https://www.drupal.org/project/drupal/issues/2942404 — MR !17968.
Scope reviewed: [CI-FIXES.md](../CI-FIXES.md) Task 2 and the numbers it relies on.
Constraints observed: checkout untouched; scratch scripts in `/tmp` only; no DDEV, no PHPUnit,
no browser, no push/post.

## Method

- Reconstructed the MR head `core/misc/message.js` by copying the final file
  (`envs/issue-2942404-consolidated/core/misc/message.js`, 13,131 bytes) and reverse-applying
  [`branches/2942404-ci-fixes.patch`](../branches/2942404-ci-fixes.patch) to it.
  The reconstruction is byte-exact: the reconstructed file's git blob hash is
  `5fb5d12ab9f0ac59244337de296267e6514f6e22`, matching the patch's `index 5fb5d12ab9..` old side;
  the final file's blob hash is `c8cbf9413ffd639ad03fc9a6e654a46683688be1`, matching the new side.
- Measured sizes with the same optimizer core uses (`JsOptimizer::optimize()`):
  `Peast\Peast::latest($data)->parse()` + `Peast\Formatter\Compact`. Host PHP 8.5.9;
  `mck89/peast` **v1.18.1** from `envs/issue-2942404-consolidated/vendor/` (the env composer.lock),
  i.e. the same Peast version core's `vendor/` would use.
- Base file: `envs/baseline-2942404-latest/core/misc/message.js` (env at `0387fb948f`, no tracked changes).
- Recomputed every addition, subtraction, percentage and tolerance in PHP; output reproduced below.

## 1. Reproduced sizes

| Rev | Source bytes claimed | Reproduced | Compact bytes claimed | Reproduced | Verdict |
|---|---:|---:|---:|---:|---|
| Base (`0387fb948f`) | 8,424 | **8,424** | 2,765 | **2,765** | CONFIRMED |
| MR head (`b11a4441`) | 13,504 | **13,504** | 4,746 | **4,746** | CONFIRMED |
| Final follow-up | 13,131 | **13,131** | 4,534 | **4,534** | CONFIRMED |

Derived deltas, all reproduced:

| Quantity | Claimed | Reproduced | Verdict |
|---|---:|---:|---|
| MR-head compact delta (4,746 − 2,765) | +1,981 | **+1,981** | CONFIRMED |
| Follow-up compact reduction (4,746 − 4,534) | 212 (10.7%) | **212** (212/1,981 = 10.70%) | CONFIRMED |
| Final compact delta (4,534 − 2,765) | +1,769 | **+1,769** | CONFIRMED |
| Follow-up source reduction (13,504 − 13,131) | 373 | **373** | CONFIRMED |
| Final source delta (13,131 − 8,424) | — | +4,707 | (matches EVIDENCE.md) |

Patch integrity: `branches/2942404-ci-fixes.patch` sha256 `37ea8802…a5854` and
`interdiff/interdiff-mr-to-ci-fixes.diff` sha256 `37ea8802…a5854` are identical, as the report says;
the minimal patch changes 5 files. Full patch sha256 `0fdac5e8…0ffb0cf`, 14 files, as claimed.

## 2. Updated centres and tolerance

| Fixture | Old centre | Claimed new | Reproduced (+1,769) | Tolerance at new value | Verdict |
|---|---:|---:|---:|---:|---|
| `administratorNodePage.yml` | 187,160 | 188,929 | **188,929** | min(37,785.8, 2000) = **2,000** | CONFIRMED |
| `umamiFrontAndRecipePagesAuthenticated.yml` | 60,671 | 62,440 | **62,440** | min(12,488, 2000) = **2,000** | CONFIRMED |
| `testAdmin.yml` | 155,112 | 156,881 | **156,881** | min(31,376.2, 2000) = **2,000** | CONFIRMED |

The `diff` of each of the three files against the base env changes only the `ScriptBytes:` line;
`ScriptCount` and stylesheet values are untouched. `PerformanceTestTrait` (and therefore
`calculateAllowedByteTolerance()`, `(int) min($bytes * .2, 2000)`) is not touched by the follow-up
patch at all; the tolerance stays 2,000 because all three expectations stay above 10,000 bytes.
The assertion in `assertMetrics()` is inclusive `|actual − expected| ≤ tolerance`.

## 3. CI reconciliation arithmetic

| Fixture | CI actual (MR head) | MR-head delta vs old centre | After −212 follow-up | After −1,769 | If aggregate did not shrink | Inside 2,000? |
|---|---:|---:|---:|---:|---:|---|
| `administratorNodePage.yml` | 190,017 | +2,857 | 2,645 | **+876** | +1,088 | yes |
| `umamiFrontAndRecipePagesAuthenticated.yml` | 63,427 | +2,756 | 2,544 | **+775** | +987 | yes |
| `testAdmin.yml` | 157,201 | +2,089 | 1,877 | **+108** | +320 | yes |

Every number reproduces exactly, including that the three suites fail on the **old** centres
(2,857 / 2,756 / 2,089 all exceed the 2,000 tolerance), which is the stated reason the follow-up
was needed. With the new centres the predicted final actuals are 189,805 / 63,215 / 156,989, i.e.
residuals +876 / +775 / +108 — all inside ±2,000. **Arithmetic: CONFIRMED. Conclusion: CONFIRMED
conditionally** on the input actuals (see "Provenance gap" below).

## 4. Is the aggregate byte delta exactly the compact delta of message.js?

Chain checked in the base checkout:

- `core/lib/Drupal/Core/Asset/JsOptimizer.php`: compacts each file with `Peast::latest()` +
  `Peast\Formatter\Compact`; on a Peast exception it falls back to the raw source.
- `core/lib/Drupal/Core/Asset/JsCollectionGrouper.php`: group keys are file type, CSS/JS group and
  `library`/`aggregate_target` only. **File size is not a grouping key.**
- `core/lib/Drupal/Core/Asset/JsCollectionOptimizerLazy.php::optimizeGroup()`: concatenates the
  per-file compact output with `/* @license … */\n` only when the license changes and `";\n"`
  after each file. Byte-additive.
- `core/lib/Drupal/Core/Asset/AssetDumper.php`: writes that concatenation verbatim (no rewriting).
- `core/tests/Drupal/Tests/PerformanceTestTrait.php::collectNetworkData()`: `ScriptBytes` is read
  from the dumped file on disk (`getBytesSize()`), not from `encodedDataLength`, and URLs are
  deduplicated by URL (`$script_urls[$url] = $url`), so a repeated request for the same aggregate
  counts once; query strings/compression do not matter.
- No size-based aggregate splitting or merging exists anywhere in `core/lib/Drupal/Core/Asset/`
  (no max-size, chunk or split logic). Changing bytes changes the aggregate's content hash/URL, not
  the group count or composition.

**Per aggregate, the delta is exactly the compact delta.** Two conditions matter:

1. **Peast must parse.** If it failed, `JsOptimizer` would fall back to the raw file and the delta
   would be the source delta (+4,707), not +1,769. Verified not the case here: both revisions parse
   and render with Peast v1.18.1 on PHP 8.5.9 (same code path as core).
2. **Copy count.** `ScriptBytes` sums over *unique aggregate URLs across all requests in the test*.
   Deduplication is per URL, not per file. If `message.js` is carried by `n` distinct aggregates in
   one test's network set (different library sets on different page types produce different
   aggregates), the total delta is `n × 1,769` (final) / `n × 1,981` (MR head), not one copy.
   The report states the equality unconditionally; strictly it holds per aggregate. The
   reconciliation implicitly assumes `n = 1`.

**Structural risk assessment for `n`.** `message.js` (library `core/drupal.message`) is not
attached globally; it is a dependency of `core/drupal.ajax`, `big_pipe/big_pipe` and
`core/ckeditor5`. Both `standard` and `demo_umami` install `big_pipe`, and both install
`navigation`, whose `#lazy_builder` placeholders make BigPipe attach `big_pipe/big_pipe` (and thus
`core/drupal.message`) on the tested authenticated/admin pages, so `n ≥ 1` is very likely. The
exact `n` was **not** measured; the `MultipleRequests` test loads two page types, so `n > 1` there
cannot be excluded. Notably the conclusion is insensitive to this: with
`residual = M − 1,769 − 212n` (`M` = MR-head delta above), residuals stay inside ±2,000 for
`n = 0…14` (n=0: 1,088/987/320; n=1: 876/775/108; n=2: 664/563/−104; n=3: 452/351/−316). The
*attribution* "remaining growth is baseline drift already inside the tolerance" is only valid for
`n = 1`; for `n = 0` the drift itself would already have been outside tolerance (but the bumped
centre would still pass). The report should state the `n = 1` assumption explicitly.

No other MR file changes script payload: the full 14-file patch changes `message.js`, Twig
templates, PHP test fixtures and three YAMLs only. No library/Twig change alters which libraries
are attached, so `ScriptCount` and group composition cannot move.

## 5. MySQL-only skip: confirmed

`core/tests/Drupal/FunctionalJavascriptTests/PerformanceTestBase.php::prepareEnvironment()`:

```php
$db = Database::getConnection();
$is_core_test = str_starts_with($test_file_name, DRUPAL_ROOT . DIRECTORY_SEPARATOR . 'core');
if ($db->databaseType() !== 'mysql' && $is_core_test) {
  $this->markTestSkipped('Drupal core performance tests only run on MySQL');
}
```

With the lab's MariaDB 11.8 this skips every core performance suite, so the three suites cannot be
executed locally as configured. `RESOURCE.md` records `StandardPerformanceTest` skipping with that
message; no suite was run in this review.

Two additions for completeness: MySQL is **necessary but possibly not sufficient** locally — the
three classes also carry `#[RequiresPhpExtension('apcu')]`, and they need a working browser/
chromedriver performance log. The skip is therefore genuinely an environment limit, not a code
failure.

## 6. Provenance gap and residual risks

1. **The CI actuals are not evidenced in this workspace.** `190,017`, `63,427` and `157,201`
   occur **only** in [CI-FIXES.md](../CI-FIXES.md) (searched the whole workspace). There is no
   captured pipeline log or artifact behind them, and the report's own Task 4 says the pipeline's
   performance job is "manual/skipped". The arithmetic and the conclusion are correct, but the
   three input values cannot be independently verified here. Pin the source (job id + log excerpt
   or paste of the three measured `ScriptBytes`) before this goes upstream.
2. **Copy count `n` is an unstated assumption** (see item 4). Adding one sentence would close it.
   The pass/fail conclusion survives `n = 0…14`, so the fixture update itself is robust.
3. **Near-threshold fixtures not updated.** Ten other Umami fixtures keep `ScriptBytes: 12091`
   (eight: `umamiFrontPage*`, `umamiNodePage*`, `umamiFrontAndRecipePages`) and `13345` (two:
   `umamiLogin`, `authenticatedFrontPage`); the tolerance there is exactly 2,000, so the +1,769
   leaves **231 bytes** of margin. They pass today but the next unrelated JS change can fail them.
   The report does not mention this. (The three JSON:API and two node expectations with
   `ScriptBytes: 0` are asserted differently/for pages without JS and are not affected.)
4. **No observed pass.** The updated fixtures are a prediction from the compact delta; the suites
   were not executed (MySQL required). The residual-drift figures are inferred from the unverified
   CI actuals, not measured.
5. Low risk: the compact measurement uses the env's Peast v1.18.1 and PHP 8.5.9, not CI's PHP
   build; Peast is pure PHP and the version matches `composer.lock`, so a different result in CI is
   unlikely but not observed.
6. Report hygiene verified: only `ScriptBytes` moved; `Stylesheet*`, `ScriptCount` and the
   tolerance function are unchanged; the arithmetic in the table is correct as printed.

## Verdict

- **Numbers and arithmetic (items 1–3): CONFIRMED.** All three size pairs, both deltas, the three
  centres, the tolerance values, and every CI reconciliation figure reproduce exactly.
- **Optimizer-method claim (item 4): CONFIRMED per aggregate; needs the "one aggregate copy"
  qualifier for the per-test total.** No structural reason for an inexact delta was found
  (no size-based splitting, byte-additive concatenation, disk-read byte counting, Peast parses).
- **MySQL-only skip (item 5): CONFIRMED.** Local execution is impossible without MySQL (and also
  needs `apcu`).
- **Input provenance: UNVERIFIABLE.** The three CI actuals have no artifact in the workspace.
- **Overall: CONFIRMED, with one provenance gap and one unstated copy-count assumption.** Neither
  changes the arithmetic or the "inside 2,000" conclusion; both should be stated before posting.
