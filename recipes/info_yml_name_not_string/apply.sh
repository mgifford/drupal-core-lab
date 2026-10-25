#!/usr/bin/env bash
# info-yml-name-not-string post-step (scripts/lab-site.sh apply runs it inside the site, after the recipe).
#
# Writes the test module "example" into modules/custom, uninstalled. Its name is a YAML list, [Example, module], which core
# accepts when it parses the file. On core without the fix, /admin/modules then fails with a TypeError in
# ExtensionList::sortByName().
# The info file is written here, not stored in the recipe: extension discovery scans the whole site, including recipes/, and
# would find a stored copy too. Safe to run again: it rewrites the same file and installs nothing.
# Draft issue: reports/info-yml/issue-drafts/5-info-name-not-string.md
set -euo pipefail
mkdir -p modules/custom/example
printf 'name: [Example, module]\ntype: module\ncore_version_requirement: ^12\n' > modules/custom/example/example.info.yml
echo "modules/custom/example written (name is a list, not installed)"
