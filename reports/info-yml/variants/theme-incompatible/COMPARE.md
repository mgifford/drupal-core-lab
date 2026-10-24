# Variant theme-incompatible compared with the baseline

Generated 2026-10-24T01:31:56.836Z by `node scripts/info-yml-repro.mjs compare --variant=theme-incompatible`. Patch: [theme-core-incompatible.patch](theme-core-incompatible.patch) (sha256 `fb06f1048c1a5dd3`), committed on `89df3a065deb`. Variant results: [RESULTS.md](RESULTS.md); baseline: [RESULTS.md](../../RESULTS.md). Machine-readable: [compare.json](compare.json). **DRAFT until a person has reviewed it.**

624 results were measured on both; 1 differs: 0 now as with a valid file, 1 now differ from a valid file, 0 differ in another way. Each verdict compares the broken file with a valid file on the same core, so a difference can be the intended effect (for example, refusing to install an incompatible extension).

| scenario | observation | baseline | variant | change |
|---|---|---|---|---|
| cvr-incompatible/theme/uninstalled/symfony | exin_self | ok | refused (exit 1) | now differs from a valid file |
