# Branch patches for #3604037

Extracted 2026-10-01 from https://git.drupalcode.org/issue/drupal-3604037.git with `git diff <merge-base> <branch tip>`: only the branch's own changes.
Not rebased onto current `main`. The MR on drupal.org is the source of truth.

| Patch | Source | Tip | Base | Base date and subject | Files |
|---|---|---|---|---|---|
| [`original-patches/3604037-grouping-elements-child-errors-default-admin.763628f8.patch`](original-patches/3604037-grouping-elements-child-errors-default-admin.763628f8.patch) (historical pinned comparison) | https://git.drupalcode.org/issue/drupal-3604037.git `3604037-grouping-elements-child-errors-default-admin` | e8b2e166be8 | c321043bb82d | 2026-09-28 task: #3557481 Convert hook_schema() implementations to SchemaDefinition - regular modules | 18 |
| [`branches/3604037-grouping-elements-child-errors-default-admin.patch`](branches/3604037-grouping-elements-child-errors-default-admin.patch) | https://git.drupalcode.org/issue/drupal-3604037.git `3604037-grouping-elements-child-errors-default-admin` | c3c52b00 | bc8a8b482ee2 | 2026-11-03 fix: #3619744 Removing an item from a multiple value field widget discards the weight order | 18 |

## Lab port addressing Comment #61

[`branches/3604037-comment61-current-main.patch`](branches/3604037-comment61-current-main.patch) is a lab-authored port of MR !17078 at `c3c52b00` onto core `29b0a0b2256e` (2026-11-17). It includes the fixes requested in mherchel's Comment #61, renders the hidden indicator in both Default Admin details templates, and passes `child_error_count` through Default Admin's `preprocess_details` hook. It omits the stale generated Umami performance snapshot and includes regression coverage for untitled details and multiple error tabs. SHA-256: `e82af47b33b4ec4b3ff8346f9984b9179c00a11a859ac63c0f745ed4de11ad02`.

[`branches/support-fixture-multiple-vertical-tab-errors.patch`](branches/support-fixture-multiple-vertical-tab-errors.patch) is test support, not code under test. It makes both fields on the vertical-tabs test form able to produce an error; the `3604037-latest` variant applies it to both Before and After. The existing `support-fixture-two-required-fields.patch` remains the other Before-side test-support change.

## Upstream handoff

These are **DRAFT submission artifacts**, not changes to the upstream branch.
The original MR is [!17078](https://git.drupalcode.org/project/drupal/-/merge_requests/17078);
its [live diff URL](https://git.drupalcode.org/project/drupal/-/merge_requests/17078.diff) is mutable.
On 2026-11-18, `git ls-remote` confirmed the source branch still pointed to
`c3c52b00781f8f2f3e94ee1697d48fe39496d4f8`. Issue comments and MR discussions were not refreshed for this packaging step.

### Choose one route

1. **Existing MR:** with permission and contributor agreement, check out issue-fork branch
   `3604037-grouping-elements-child-errors-default-admin` at `c3c52b00`, apply the
   [interdiff](branches/3604037-comment61-vs-mr17078-c3c52b00.interdiff.patch), and add a follow-up commit.
   Do not replace the branch or force-push its history. Attach/link the interdiff for reviewers.
2. **New MR:** create a new branch from that same tip and apply the same interdiff.
   Reference !17078 and explain that the new MR carries forward its work plus the Comment #61 fixes.
   Leave disposition of the original MR to its contributors/maintainers.
3. **Clean-core patch upload:** use the
   [standalone replacement](branches/3604037-comment61-standalone.patch) on clean core
   `29b0a0b2256eb5ed27df6ec5e4e4e33142a717e8`, not on an already patched checkout.
   Include the interdiff alongside it so reviewers can see what changed.

The standalone patch combines the registered After stack: the multiple-vertical-tab test fixture followed by
the current-main port. No extra lab support patch is needed. The registered comparison is unchanged.
The interdiff starts from the original MR tree on merge base `bc8a8b482ee232a7ae8c209b73158a1145abbaa9`;
it is not a text diff between patch files and does not include unrelated intervening core changes.
It also reverts the MR's stale generated Umami performance snapshot change, which the standalone patch omits.

### Verification and artifact identity

Isolated Git indexes were used; no running site or baseline was modified.

- Applying the saved upstream snapshot to `bc8a8b482ee2` reconstructs the exact `c3c52b00` tree.
- The interdiff applies directly to that tip and yields tree `d50a854b514db8d936364f8ea36a8097712f6b50`.
- The standalone patch applies to `29b0a0b2256e` and yields tree `5783c938cd306024acf004a972aef4fca3334d0b`,
  exactly matching the registered After patch stack on that base.
- Transplanting the old-base proposal onto `29b0a0b2256e` yields the same tree. This checks that the two routes
  contain equivalent changes despite their different core bases.

| Artifact | SHA-256 |
|---|---|
| Standalone replacement | `a5caf776d46f9485e8a39bb969a06efe014e4afec33c8a43e328f3211dedb112` |
| Interdiff from `c3c52b00` | `e0a2659cf5eb4013087a88d14b3ddcf79e84cb29fedfebbd78fd8543b4d8367c` |

These checks establish packaging equivalence, not a new runtime test pass. The recorded tests concern core
`29b0a0b2256e`; no runtime tests were run on the original MR base. Before submission, review the
[contrast and manual-testing gaps](EVIDENCE.md#not-verified-for-the-current-port), refresh issue/MR discussions,
and verify the chosen branch tip again. If it has moved, regenerate the interdiff rather than applying it blindly.
After any rebase or code correction, rerun affected tests and regenerate both artifacts.

AI-assisted: Copilot SDK in VS Code generated these artifacts from the attributed upstream MR and lab changes.
The patch code retains Drupal's licensing; no new license is introduced. Human review and authorization are required
before posting, opening an upstream MR, or pushing to the issue fork.
