# Lab support for patch-stack baselines

`patch-stack-baselines.patch` is a change to Drupal Core Lab itself. It is not a
Drupal core patch and must not be attached to issue #3593502 or applied inside a
Drupal environment.

It removes four assumptions in the lab:

1. **Only After has patches.** `setup.mjs --check-patches` now applies and
   validates the Before and After stacks independently from the same clean core
   commit.
2. **The sides are always generically named Before patch and After patch.** A
   variant can set `before.label` and `after.label`, allowing names such as
   `MR !15975` and `MR !15975 + review interdiff`.
3. **The field documentation only describes `after.patches`.** It now documents
   patch lists and labels on either side.
4. **The static guide does not need side metadata.** `build-cloud.mjs` now keeps
   the two labels so the generated guide shows the same named stacks.

The patch is based on Drupal Core Lab `main` at commit `57b9df9` on
2026-10-16. Check it before applying if `main` has moved:

```shell
git apply --check reports/issues/3593502/lab/patch-stack-baselines.patch
git apply reports/issues/3593502/lab/patch-stack-baselines.patch
```

The #3593502 variants use three code states but retain two frames. This is
intentional. Three simultaneous frames would make each Drupal viewport too
narrow for useful desktop comparison and would require a separate three-way
model for login, proxying, navigation, audits, synchronized input, and results.
Pairwise switching preserves the existing viewport and comparison tools.
