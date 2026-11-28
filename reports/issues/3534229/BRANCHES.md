# Branch patches for #3534229

The consolidated implementation is published in [MR !18007](https://git.drupalcode.org/project/drupal/-/merge_requests/18007).

- Source branch: `3534229-ckeditor-config-buttons`
- Published commit: `50833b7592fcb0ceee39815724ea9420710e486f`
- Drupal issue: [#3534229](https://www.drupal.org/project/drupal/issues/3534229)

The implementation builds on kentr's CSS mask proof of concept in comment #7 and subsequent development and testing in Drupal Core Lab.

The pinned comparison uses the original Lab patch followed by the consolidated incremental patch. The resulting CKEditor stylesheets have been verified as identical to the published MR.

Earlier implementations and their testing evidence are retained for historical comparison.

| Patch | Source | Tip | Base | Base date and subject | Files |
|---|---|---|---|---|---|
| [`branches/3534229-mr-18007.patch`](branches/3534229-mr-18007.patch) | [MR !18007](https://git.drupalcode.org/project/drupal/-/merge_requests/18007), branch `3534229-ckeditor-config-buttons` | `50833b7592` | `c706424d7e` | Consolidated forced-colors fix | 18 |
| [`branches/3534229-forced-colors-mask.patch`](branches/3534229-forced-colors-mask.patch) | authored in the lab (no merge request), captured from `issue-3534229` on 2026-11-27 with `scripts/capture-patch.mjs`; sha256 c1c969bd33b681a0 | - | 8a7df6cc3e69 | 2026-11-27, "fix: #2778345 Views argument validators …" | 18 |

## Revision artifacts (Lab rule 17: full patch and interdiff)

There is no upstream implementation to revise, so no interdiff against an MR exists. The local proposal was revised
twice while the browser evidence was being produced. The full patch above is the final proposal; the earlier versions
are kept byte for byte, and each interdiff is a unified diff **between the two patch files** (a patch-of-patches):

| Revision | Patch | sha256 | What changed |
|---|---|---|---|
| v1 | [`original-patches/3534229-forced-colors-mask.v1-b32cc1b2.patch`](original-patches/3534229-forced-colors-mask.v1-b32cc1b2.patch) | `b32cc1b2bf85c9a2` | first capture: mask + CanvasText, alignment on `::before` |
| v2 | [`original-patches/3534229-forced-colors-mask.v2-a3044de4.patch`](original-patches/3534229-forced-colors-mask.v2-a3044de4.patch) | `a3044de4ad4318be` | raise the shared forced-colors rules above the per-plugin `background-image` declarations (fixes `drupalInsertImage` still painting its black SVG over the mask); add the forced-colors `filter: none` reset (#3637246 interaction); add the alignment `:hover` override |
| v3 (final) | [`branches/3534229-forced-colors-mask.patch`](branches/3534229-forced-colors-mask.patch) | `c1c969bd33b681a0` | comments use US spelling so CSpell passes; no CSS behaviour change |

- [`INTERDIFF-v1-to-v2.patch`](INTERDIFF-v1-to-v2.patch) — the behaviour-changing revision.
- [`INTERDIFF-v2-to-v3.patch`](INTERDIFF-v2-to-v3.patch) — the spelling-only revision.

Verification, so a reviewer can reproduce it: the earlier revisions were reconstructed from the final checkout by
reversing the documented edits and their sha256 values match the values recorded when each was captured. The final
patch applies to the pinned base (`git apply --check` in `envs/issue-3534229` at `8a7df6cc3e69`), and the environment
patch-state record after re-applying it is `verified`.
| [`branches/3534229-consolidated-mask.patch`](branches/3534229-consolidated-mask.patch) | authored in the lab (no merge request), captured from `issue-3534229` on 2026-11-28 with `scripts/capture-patch.mjs`; sha256 fcd40f45 | - | 8a7df6cc3e69 | - | 18 |
