# MR provenance

Source: https://git.drupalcode.org/project/drupal/-/merge_requests/17421
Branch: 3630425-multi-value-field-widget. Target: 11.4.x.
Exact MR head: `f1f524f922765807ab99442782cc2aec2f521a18`. MR base: `e1eb3d7487e9ea06b94ee6c3b9430881c73997df`.
Patch: `reports/issues/3630425/branches/17421-f1f524f92276.patch` (829 bytes).
SHA-256: `ec102c436575a6a9dc8ddce0f80923598794ecf7dcb5119190c645f5f1ca32c1`.

Downloaded 2026-10-16. The published MR diff is included unchanged, not rerolled. Pinned Lab comparison base is current main `dbfce851242d5b082adb8ed14634b4bc9cce374b` to test Default Admin. Before has no patches. The original upstream diff is retained here for provenance and the MR-only variant; the default After uses the main-based full patch described below.

## Main-based port and interdiff

Default After patch: branches/3630425-main-mr17421.patch. Includes the unchanged production fix, re-diffed against main dbfce851242d, plus a new testActionsColumnHeader() method and theme data provider in MultipleValueWidgetTest. Tests cover Stark and Default Admin, the initial header, AJAX add, and AJAX remove. These PHP tests have not been executed here.

Interdiff: branches/3630425-main-interdiff.patch. Apply it after the published MR on the pinned main commit. It changes only the regression test file; there is no production-code difference. Applying the MR + interdiff yields exactly the same Git tree as the full main-based patch (verified). The original MR remains available through 3630425-mr-only.

- `17421-f1f524f92276.patch` SHA-256 `ec102c436575a6a9dc8ddce0f80923598794ecf7dcb5119190c645f5f1ca32c1`
- `3630425-main-interdiff.patch` SHA-256 `7ca6481b40093197422dd0ec248c66d19b11d140fb63812e30c92d128cca8ab9`
- `3630425-main-mr17421.patch` SHA-256 `b6fc324899beae67bd477d0f048369dc16d3d490779d24b1ea3a96556e3887ea`
