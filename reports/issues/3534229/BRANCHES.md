# Branch patches for #3534229

There is no merge request for this issue. One issue fork branch exists in `https://git.drupalcode.org/issue/drupal-3534229.git`:
`3534229-ckeditor-config-buttons` (checked 2026-11-27). It has **zero commits** beyond core `main`, so there is no
other contributor's implementation to build on or revise; nothing was pushed to it. The fix below is written in the lab
and captured from the After environment with `scripts/capture-patch.mjs`; it is a candidate for an upstream merge request.

Revision history of this local proposal: v1 `b32cc1b2` (first capture), v2 `a3044de4` (raised the shared forced-colors
rules above the per-plugin `background-image` declarations and added the forced-colors `filter: none` reset plus the
alignment hover override, after the first browser run showed `drupalInsertImage` still painting its black SVG over the
new mask). No upstream patch was revised, so no interdiff against an external implementation exists.

| Patch | Source | Tip | Base | Base date and subject | Files |
|---|---|---|---|---|---|
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
