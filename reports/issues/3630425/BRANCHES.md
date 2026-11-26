# MR provenance

Last updated: 2026-11-26.

Issue: [#3630425: Multi-value field widget table renders an empty header for the actions column](https://www.drupal.org/project/drupal/issues/3630425)

**Preferred upstream implementation: MR !17622.**

The November 26 evaluation establishes reproducible evidence supporting this implementation. See [STATUS.md](STATUS.md) for RTBC readiness and outstanding review requirements.

## Branch and proposal inventory

| Proposal | Target | Revision | Lab assessment |
|---|---|---|---|
| MR !17622 | main | `090a74cd28aa` | Tested; preferred upstream implementation |
| MR !17421 | 11.4.x | `f1f524f92276` | Earlier implementation; retained for provenance |
| Lab main-based port | Pinned main | `dbfce851242d` + patch | Alternative regression coverage |

The production changes in both upstream MRs are equivalent. The regression test implementations differ.

## MR !17622: preferred upstream implementation

Source: https://git.drupalcode.org/project/drupal/-/merge_requests/17622

- Target branch: `main`.
- Source branch: `issue/drupal-3630425:main`.
- Exact MR head: `090a74cd28aa448aa506413b02abf5c7935e21a2`.
- MR base: `555acb124a507400d63ad38526b221c0e813bf7d`.
- Retrieved: 2026-11-26.
- Diff size: 2,023 bytes, 35 lines, two files.
- Patch: [17622-090a74cd28aa.patch](branches/17622-090a74cd28aa.patch).
- SHA-256: `b459af60d26d409678279f793974dec24039c0c794f9983d7c2c3319b65016`.

The captured patch is the unchanged upstream MR diff. The temporary downloaded copy was verified as byte-identical.

### Implementation

The production change adds visually hidden "Operations" text to the previously empty actions-column header.

The MR also introduces two regression assertions in `FormTest::testFieldFormUnlimited()`.

No additional Lab-authored production changes are included in this comparison.

### Patch applicability

Both modified files are byte-identical at the Lab's pinned Core revision and the MR base:

- `FieldPreprocess.php`: 7,397 bytes.
- `FormTest.php`: 25,444 bytes.

A `git apply --check` against these files succeeded in a temporary repository on 2026-11-26.

The patch was subsequently applied and evaluated in the registered Lab comparison.

### Evaluated comparison

| Property | Value |
|---|---|
| Variant | `3630425-mr17622` |
| Core revision | `dbfce851242d5b082adb8ed14634b4bc9cce374b` |
| Before environment | `baseline-3630425` |
| Before patch stack | None |
| After environment | `issue-3630425-mr17622` |
| After patch stack | `17622-090a74cd28aa.patch` |
| Theme | Default Admin |
| Evaluation date | 2026-11-26 |
| Lab pull request | [#110](https://github.com/mgifford/drupal-core-lab/pull/110) |

### Verified results

- Original empty table header reproduced.
- Actions-column header receives the accessible text "Operations".
- Explicit axe `empty-table-header` violation eliminated.
- Correct header preserved through AJAX addition and removal.
- Guidepup virtual screen reader exposes the named column header.
- No meaningful visual regression in stabilized table screenshots.
- PHPUnit regression test fails against pristine Core.
- PHPUnit regression test passes with the MR applied: two tests, 35 assertions.

Evidence:

- [Summary](SUMMARY.md)
- [Evidence](EVIDENCE.md)
- [Before PHPUnit output](tests/before.log)
- [After PHPUnit output](tests/after.log)
- [Playwright evaluation](playwright/2026-11-26T12-39-49-645Z-chromium-light-1280x900/SUMMARY.md)
- [Visual comparison](playwright/2026-11-26T12-39-49-645Z-chromium-light-1280x900/visual-compare.json)
- [Virtual screen reader evaluation](screenreader/2026-11-26T12-40-34-521Z/SUMMARY.md)

These results apply specifically to MR !17622 at `090a74cd28aa` on the recorded Core baseline.

### Outstanding verification

- Current upstream MR head and CI results.
- Current mergeability against Core main.
- MR review discussion and resolution status.
- Independent human review.
- Real screen reader testing.

The merge request reported one user note. The notes and discussions API returned HTTP 401, so its content was not reviewed.

Real VoiceOver evaluation was attempted but blocked by Safari automation errors. No real screen reader results were recorded.

## MR !17421: earlier upstream implementation

Source: https://git.drupalcode.org/project/drupal/-/merge_requests/17421

- Source branch: `3630425-multi-value-field-widget`.
- Target branch: `11.4.x`.
- Exact MR head: `f1f524f922765807ab99442782cc2aec2f521a18`.
- MR base: `e1eb3d7487e9ea06b94ee6c3b9430881c73997df`.
- Retrieved: 2026-10-16.
- Patch: [17421-f1f524f92276.patch](branches/17421-f1f524f92276.patch).
- Patch size: 829 bytes.
- SHA-256: `ec102c436575a6a9dc8ddce0f80923598794ecf7dcb5119190c645f5f1ca32c1`.

The original published MR diff is retained unchanged.

Its production change is equivalent to MR !17622, but the November 26 regression test results must not be attributed to this earlier MR.

The original MR remains available through the `3630425-mr-only` comparison.

## Historical Lab main-based port and interdiff

Before MR !17622 was evaluated, the Lab prepared a main-based port of MR !17421 with additional regression coverage.

### Full patch

- Patch: [3630425-main-mr17421.patch](branches/3630425-main-mr17421.patch).
- Core base: `dbfce851242d5b082adb8ed14634b4bc9cce374b`.
- SHA-256: `b6fc324899beae67bd477d0f048369dc16d3d490779d24b1ea3a96556e3887ea`.

Includes:

- The unchanged production fix, re-diffed against pinned main.
- A new `testActionsColumnHeader()` method in `MultipleValueWidgetTest`.
- A theme data provider covering Stark and Default Admin.
- Regression coverage for initial rendering, AJAX addition and AJAX removal.

These Lab-authored PHP tests have not been independently executed. They are distinct from the successfully executed tests supplied by MR !17622.

### Interdiff

- Patch: [3630425-main-interdiff.patch](branches/3630425-main-interdiff.patch).
- SHA-256: `7ca6481b40093197422dd0ec248c66d19b11d140fb63812e30c92d128cca8ab9`.

Apply this interdiff after the original MR !17421 patch on the pinned main revision.

The interdiff changes only the regression test file. There is no production-code difference.

Applying MR !17421 followed by the interdiff produces exactly the same Git tree as applying the full main-based Lab patch. This equivalence was previously verified.

## Patch inventory

All historical patch artifacts are retained.

| Patch | Purpose |
|---|---|
| `17622-090a74cd28aa.patch` | Preferred, tested upstream MR |
| `17421-f1f524f92276.patch` | Original earlier upstream MR |
| `3630425-main-mr17421.patch` | Historical Lab-authored main port with additional tests |
| `3630425-main-interdiff.patch` | Test-only changes relative to MR !17421 |

## Recommendation

Prioritize review of MR !17622 rather than creating another production patch or competing merge request.

The existing Lab-authored tests may provide useful supplementary coverage, but should only be proposed upstream if they address a demonstrated coverage gap.

If the current upstream revision matches the tested implementation, CI is satisfactory, and outstanding review requirements are addressed, proceed with independent human review and consideration for RTBC.

See [STATUS.md](STATUS.md) for the readiness assessment and [REPRODUCE.md](REPRODUCE.md) for reproduction instructions.

AI-assisted documentation update. No production patches, upstream branches or Drupal.org issue statuses were changed.
