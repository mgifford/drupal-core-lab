# Variant: core refuses to install a theme that is incompatible with it

The fix proposed in [issue draft 1](../../issue-drafts/1-theme-core-incompatible.md), which has no drupal.org issue yet.
[tests/info-yml/patches/theme-core-incompatible.patch](../../../../tests/info-yml/patches/theme-core-incompatible.patch) adds
to `ThemeInstaller::getThemesToInstall()` the `core_incompatible` check that `ModuleInstaller` already has. Core `main` at
`89df3a065deb`. **DRAFT until a person has reviewed it.**

## Test it in the lab viewer (DDEV)

The variant `info-yml-theme-incompatible` in [tools/compare/variants.json](../../../../tools/compare/variants.json) builds
Before (core as is) and After (core plus the patch) like any other comparison here. The recipe
[recipes/info_yml_theme_incompatible](../../../../recipes/info_yml_theme_incompatible/) writes the test theme `example`
(`core_version_requirement: ^10`) into both sites. From the lab folder:

    node tools/compare/setup.mjs info-yml-theme-incompatible
    cd envs/baseline-info-yml && ddev exec php core/scripts/dr ex:install example -y; cd ../..
    cd envs/proposal-info-yml-theme-incompatible && ddev exec php core/scripts/dr ex:install example -y; cd ../..

Before: `[OK] Successfully installed 1 theme.` After: `[ERROR] Unable to install theme: 'example' is incompatible with this
version of Drupal core.`, and nothing is installed. To repeat the Before test, first run
`ddev exec php core/scripts/dr ex:uninstall example -y` in `envs/baseline-info-yml`.

The change shows on the command line only. The Appearance page already offers no Install link for this theme, so both frames
of the viewer look the same.

What was verified without DDEV (the lab container has none): `setup.mjs --check-patches` (the patch applies to the pinned
core), `setup.mjs --checkout-only` (both checkouts, the patch on After only), and the recipe with its `apply.sh` run on a
Standard site of the same core, followed by the command above on each side, with the results above. The first full
`setup.mjs` run with DDEV has not happened yet.

## Measured with the info.yml runner

The same patch, run through the Phase 1 matrix as a runner variant (`node scripts/info-yml-repro.mjs ... --variant=theme-incompatible`,
see [tests/info-yml/README.md](../../../../tests/info-yml/README.md)): theme cases, uninstalled placement, Symfony YAML, 624
results. One changed, the intended one ([COMPARE.md](COMPARE.md)). The patch, its hash and base commit are in
[variant.json](variant.json); the results in [RESULTS.md](RESULTS.md).
