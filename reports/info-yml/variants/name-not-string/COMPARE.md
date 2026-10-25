# Variant name-not-string compared with the baseline

Generated 2026-10-25T15:46:54.737Z by `node scripts/info-yml-repro.mjs compare --variant=name-not-string`. Patch: [info-name-not-string.patch](info-name-not-string.patch) (sha256 `a178de5e3e3cca78`), committed on `89df3a065deb`. Variant results: [RESULTS.md](RESULTS.md); baseline: [RESULTS.md](../../RESULTS.md). Machine-readable: [compare.json](compare.json). **DRAFT until a person has reviewed it.**

4468 results were measured on both; 33 differ: 11 now as with a valid file, 20 now differ from a valid file, 2 differ in another way. Each verdict compares the broken file with a valid file on the same core, so a difference can be the intended effect (for example, refusing to install an incompatible extension).

| scenario | observation | baseline | variant | change |
|---|---|---|---|---|
| name-not-string/module/installed/symfony | modules | 500 TypeError | ok | now as with a valid file |
| name-not-string/module/installed/symfony | en_other | ok | degraded (exit 0) | now differs from a valid file |
| name-not-string/module/installed/symfony | exin_other | ok | degraded (exit 0) | now differs from a valid file |
| name-not-string/module/uninstalled-no-update/symfony | modules | 500 TypeError | ok | now as with a valid file |
| name-not-string/module/uninstalled-no-update/symfony | en_self | error TypeError | ok | now as with a valid file |
| name-not-string/module/uninstalled-no-update/symfony | en_other | ok | degraded (exit 0) | now differs from a valid file |
| name-not-string/module/uninstalled-no-update/symfony | exin_other | ok | degraded (exit 0) | now differs from a valid file |
| name-not-string/module/uninstalled/symfony | modules | 500 TypeError | ok | now as with a valid file |
| name-not-string/module/uninstalled/symfony | en_self | error TypeError | ok | now as with a valid file |
| name-not-string/module/uninstalled/symfony | en_other | ok | degraded (exit 0) | now differs from a valid file |
| name-not-string/module/uninstalled/symfony | exin_other | ok | degraded (exit 0) | now differs from a valid file |
| name-not-string/profile/installed/symfony | modules | 500 TypeError | ok | now as with a valid file |
| name-not-string/profile/installed/symfony | cr | ok | degraded (exit 0); then ok | now differs from a valid file |
| name-not-string/profile/installed/symfony | en_other | ok | degraded (exit 0) | now differs from a valid file |
| name-not-string/profile/installed/symfony | exin_other | ok | degraded (exit 0); after cr: 200 | now differs from a valid file |
| name-not-string/profile/uninstalled/symfony | cr | ok | degraded (exit 0); then ok | now differs from a valid file |
| name-not-string/profile/uninstalled/symfony | exin_other | ok | ok; after cr: 200 | now differs from a valid file |
| name-not-string/theme/installed/symfony | appearance | 500 TypeError | ok | now as with a valid file |
| name-not-string/theme/installed/symfony | cr | ok | degraded (exit 0); then ok | now differs from a valid file |
| name-not-string/theme/installed/symfony | en_other | ok | degraded (exit 0) | now differs from a valid file |
| name-not-string/theme/installed/symfony | exin_other | ok | degraded (exit 0); after cr: 200 | now differs from a valid file |
| name-not-string/theme/uninstalled-no-update/symfony | appearance | 500 TypeError | ok | now as with a valid file |
| name-not-string/theme/uninstalled-no-update/symfony | cr | ok | degraded (exit 0); then ok | now differs from a valid file |
| name-not-string/theme/uninstalled-no-update/symfony | en_self | error TypeError | ok | now as with a valid file |
| name-not-string/theme/uninstalled-no-update/symfony | en_other | ok | degraded (exit 0) | now differs from a valid file |
| name-not-string/theme/uninstalled-no-update/symfony | exin_self | degraded (exit 0) | degraded (exit 0); after cr: 200 | differs in another way |
| name-not-string/theme/uninstalled-no-update/symfony | exin_other | ok | degraded (exit 0); after cr: 200 | now differs from a valid file |
| name-not-string/theme/uninstalled/symfony | appearance | 500 TypeError | ok | now as with a valid file |
| name-not-string/theme/uninstalled/symfony | cr | ok | degraded (exit 0); then ok | now differs from a valid file |
| name-not-string/theme/uninstalled/symfony | en_self | error TypeError | ok | now as with a valid file |
| name-not-string/theme/uninstalled/symfony | en_other | ok | degraded (exit 0) | now differs from a valid file |
| name-not-string/theme/uninstalled/symfony | exin_self | degraded (exit 0) | degraded (exit 0); after cr: 200 | differs in another way |
| name-not-string/theme/uninstalled/symfony | exin_other | ok | degraded (exit 0); after cr: 200 | now differs from a valid file |
