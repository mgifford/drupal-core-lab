#!/usr/bin/env bash
# info-yml-theme-incompatible post-step (scripts/lab-site.sh apply runs it inside the site, after the recipe).
#
# Writes the test theme "example" into themes/custom. Its core_version_requirement (^10) excludes Drupal 12, so core reports it
# as incompatible: the Appearance page offers no Install link, and the variant tests what core/scripts/dr ex:install does.
# The info file is written here, not stored in the recipe: extension discovery scans the whole site, including recipes/, and
# would find a stored copy too. Safe to run again: it rewrites the same file and installs nothing.
# Draft issue: reports/info-yml/issue-drafts/1-theme-core-incompatible.md
set -euo pipefail
mkdir -p themes/custom/example
printf 'name: Example\ntype: theme\ncore_version_requirement: ^10\nbase theme: false\n' > themes/custom/example/example.info.yml
echo "themes/custom/example written (core_version_requirement: ^10, not installed)"
