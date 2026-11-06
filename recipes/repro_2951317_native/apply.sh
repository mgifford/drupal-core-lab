#!/usr/bin/env bash
# Post-recipe setup for the #2951317 native-validation comparison: turn on Drupal's enable_html5_validation setting, so forms are
# rendered without novalidate and the browser blocks Save itself. A site setting, not core code: the same line goes on both sides.
# The setting is deprecated (removed in Drupal 13); the status report says so. Safe to run again.
set -euo pipefail
settings="sites/default/settings.php"
chmod u+w "$settings" "$(dirname "$settings")"
if ! grep -q "enable_html5_validation" "$settings"; then
  printf "\n\$settings['enable_html5_validation'] = TRUE;\n" >> "$settings"
fi
grep -n "enable_html5_validation" "$settings"
