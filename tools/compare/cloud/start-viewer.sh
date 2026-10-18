#!/bin/bash
# Start the compare viewer in a DDEV Coder workspace with Coder app URLs for the viewer and both frames.
# Needs the workspace's DDEV project names to include drupal-compare, drupal-compare-before and drupal-compare-after,
# and `ddev coder-setup` run once in tools/compare/site and tools/compare/cloud/{before,after}. See tools/compare/cloud/README.md.
# Usage: tools/compare/cloud/start-viewer.sh <variant-slug>   (scripts/cloud-bootstrap.mjs runs this; you rarely need to)
set -euo pipefail
cd "$(dirname "$0")/../../.."
# The slug is required: started without one, the viewer showed the first variant, so a workspace showed another issue than its sites.
if [ $# -lt 1 ] || [ -z "$1" ]; then
  echo "Usage: tools/compare/cloud/start-viewer.sh <variant-slug>   (the variant the sites were started for, e.g. 3619154-latest)" >&2
  exit 2
fi
: "${CODER_WORKSPACE_NAME:?run this inside a Coder workspace}" "${CODER_WORKSPACE_OWNER_NAME:?}" "${CODER_AGENT_URL:?}"
DOMAIN=$(echo "$CODER_AGENT_URL" | sed -E 's#^https?://##; s#/.*$##')
# Lower case: the workspace name may have capitals ("Compare"), but browsers send the hostname in lower case.
APP() { echo "https://$1--$CODER_WORKSPACE_NAME--$CODER_WORKSPACE_OWNER_NAME.$DOMAIN" | tr '[:upper:]' '[:lower:]'; }
for p in $(ps -eo pid,args | awk '/node tools\/compare\/serve.mjs/ && !/awk/ {print $1}'); do kill "$p"; done
PROJECT_NAMES=$(node tools/compare/cloud/config.mjs --project-names)
IFS=, read -r VIEWER_PROJECT BEFORE_PROJECT AFTER_PROJECT <<< "$PROJECT_NAMES"
export LAB_BIND=0.0.0.0
export LAB_EXTRA_ORIGINS="$(APP "$VIEWER_PROJECT")"
export LAB_BEFORE_ORIGIN="$(APP "$BEFORE_PROJECT")"
export LAB_AFTER_ORIGIN="$(APP "$AFTER_PROJECT")"
nohup node tools/compare/serve.mjs "$@" > .lab-viewer.log 2>&1 < /dev/null &
echo $! > .lab-viewer.pid   # same files scripts/lab-env.mjs uses, so `lab-env.mjs stop` stops this viewer
sleep 3
echo "Viewer: $LAB_EXTRA_ORIGINS/"
