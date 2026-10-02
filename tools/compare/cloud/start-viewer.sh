#!/bin/bash
# Start the compare viewer in a DDEV Coder workspace with Coder app URLs for the viewer and both frames.
# Needs the workspace's DDEV project names to include drupal-compare, drupal-compare-before and drupal-compare-after,
# and `ddev coder-setup` run once in tools/compare/site and tools/compare/cloud/{before,after}. See tools/compare/cloud/README.md.
# Usage: tools/compare/cloud/start-viewer.sh [variant-slug]   (default: the first variant)
set -euo pipefail
cd "$(dirname "$0")/../../.."
: "${CODER_WORKSPACE_NAME:?run this inside a Coder workspace}" "${CODER_WORKSPACE_OWNER_NAME:?}" "${CODER_AGENT_URL:?}"
DOMAIN=$(echo "$CODER_AGENT_URL" | sed -E 's#^https?://##; s#/.*$##')
APP() { echo "https://$1--$CODER_WORKSPACE_NAME--$CODER_WORKSPACE_OWNER_NAME.$DOMAIN"; }
for p in $(ps -eo pid,args | awk '/node tools\/compare\/serve.mjs/ && !/awk/ {print $1}'); do kill "$p"; done
export LAB_BIND=0.0.0.0
export LAB_EXTRA_ORIGINS="$(APP drupal-compare)"
export LAB_BEFORE_ORIGIN="$(APP drupal-compare-before)"
export LAB_AFTER_ORIGIN="$(APP drupal-compare-after)"
nohup node tools/compare/serve.mjs "$@" > "$HOME/viewer.log" 2>&1 < /dev/null &
sleep 3
echo "Viewer: $LAB_EXTRA_ORIGINS/"
