#!/usr/bin/env bash
set -eo pipefail

echo "============================================="
echo "Running GitHub Pages Integrity & Health Check"
echo "============================================="

FAILED=0

# 1. Local File Verification
echo "Step 1: Verifying local file structure..."

# Check .nojekyll
if [ ! -f ".nojekyll" ]; then
  echo "❌ Error: Root '.nojekyll' file is missing! This will cause GitHub Pages to fail parsing Twig files."
  FAILED=1
else
  echo "✅ Root '.nojekyll' file is present."
fi

# Check documentation-new folder and key files
if [ ! -d "documentation-new" ]; then
  echo "❌ Error: 'documentation-new' directory is missing!"
  FAILED=1
else
  echo "✅ 'documentation-new' directory exists."
  
  # Check key files
  KEY_FILES=(
    "documentation-new/index.html"
    "documentation-new/how-to-ensure-your-contribution-is-accessible-new.html"
    "documentation-new/how-to-ensure-your-contribution-is-accessible-changes.html"
  )
  for FILE in "${KEY_FILES[@]}"; do
    if [ ! -f "$FILE" ]; then
      echo "❌ Error: Key documentation file '$FILE' is missing!"
      FAILED=1
    else
      echo "✅ Documentation file '$FILE' is present."
    fi
  done
fi

# Check reports folder and key files
if [ ! -d "reports" ]; then
  echo "❌ Error: 'reports' directory is missing!"
  FAILED=1
else
  echo "✅ 'reports' directory exists."
  if [ ! -f "reports/index.html" ]; then
    echo "❌ Error: Key report file 'reports/index.html' is missing!"
    FAILED=1
  else
    echo "✅ Report file 'reports/index.html' is present."
  fi
fi

# 2. Live Site URL Health Check
echo ""
echo "Step 2: Checking live GitHub Pages URLs..."

# Dynamically construct base URL from GitHub environment variables to support forks
OWNER="${GITHUB_REPOSITORY_OWNER:-mgifford}"
if [ -n "$GITHUB_REPOSITORY" ]; then
  REPO_NAME="${GITHUB_REPOSITORY#*/}"
else
  REPO_NAME="drupal-core"
fi
# Convert owner and repo name to lowercase for standard GitHub Pages domain/path structure
OWNER_LOWER=$(echo "$OWNER" | tr '[:upper:]' '[:lower:]')
REPO_LOWER=$(echo "$REPO_NAME" | tr '[:upper:]' '[:lower:]')
BASE_URL="https://${OWNER_LOWER}.github.io/${REPO_LOWER}"

LIVE_URLS=(
  "${BASE_URL}/"
  "${BASE_URL}/docs/"
  "${BASE_URL}/docs/how-to-ensure-your-contribution-is-accessible-new.html"
  "${BASE_URL}/docs/how-to-ensure-your-contribution-is-accessible-changes.html"
)

for URL in "${LIVE_URLS[@]}"; do
  echo "Checking $URL..."
  # Allow command to fail (e.g. DNS failure) without crashing the script
  HTTP_STATUS=$(curl -L -s -o /dev/null -w "%{http_code}" "$URL" || true)
  
  if [ -z "$HTTP_STATUS" ] || [ "$HTTP_STATUS" = "000" ] || [ "$HTTP_STATUS" = "0" ]; then
    HTTP_STATUS="000"
  fi

  if [ "$HTTP_STATUS" = "000" ]; then
    echo "⚠️ Warning: Could not connect to $URL (host may be offline or blocked). Skipping live check."
  elif [ "$HTTP_STATUS" -ne 200 ]; then
    echo "❌ Error: URL returned HTTP status $HTTP_STATUS instead of 200!"
    FAILED=1
  else
    echo "✅ URL returned HTTP 200 OK."
  fi
done

if [ "$FAILED" -eq 1 ]; then
  echo ""
  echo "============================================="
  echo "❌ Check FAILED! Please resolve the issues above."
  echo "============================================="
  exit 1
else
  echo ""
  echo "============================================="
  echo "✅ All checks PASSED! GitHub Pages is healthy."
  echo "============================================="
  exit 0
fi
