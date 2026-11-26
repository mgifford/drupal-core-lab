MR !17967 is open for review: https://git.drupalcode.org/project/drupal/-/merge_requests/17967

It preserves the 11 commits from !16166 and adds one revision commit. It restores the autocomplete and media-edit icons, fixes dark disabled checkbox and select states, keeps status masks visible in forced colours, and replaces the sticky-loader pseudo-element because the controls are inputs. Fifteen unused assets and twenty registry entries are removed. Forty-one existing SVGs are smaller; two adopted files are larger.

Interdiff against !16166: https://github.com/mgifford/drupal-core-lab/blob/main/reports/issues/3603162/branches/3603162-mr16166-comprehensive-interdiff.patch
Review summary: https://mgifford.github.io/svg-review/proposed/reports/revision-2026-11-25.html
Component evidence: https://github.com/mgifford/drupal-core-lab/blob/main/reports/issues/3603162/SUMMARY.md

Static validation, 46 regression tests and 14 Unit/Kernel tests pass. Axe found no violations on three pages. Functional tests and native Windows High Contrast were not run.

Rewrite this in your own words before posting. No issue comment has been posted yet.

Generated with the help of an LLM.
