#!/usr/bin/env bash
# Run the proposed FileManagedStateTest against the lab pair for #2847425.
#
#   bash reports/issues/2847425/run-regression-tests.sh before
#   bash reports/issues/2847425/run-regression-tests.sh after
#   bash reports/issues/2847425/run-regression-tests.sh both
#
# The test file is copied in for the run, then removed (Before) or restored to what it was (After), so a
# checkout is never left edited by this script. It follows the safety rules of scripts/try-tests.mjs:
# it waits for DDEV's Mutagen sync, starts the add-on's Chrome container when needed, records the tracked
# git status before and after, and writes one log per side to reports/issues/2847425/phpunit/.
# A non-zero PHPUnit exit code is a result, not a script error: Before is expected to fail.
set -uo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root="$(cd "$here/../../.." && pwd)"
test_rel="core/modules/file/tests/src/FunctionalJavascript/FileManagedStateTest.php"
src="$here/tests-proposal/$test_rel"
side="${1:-both}"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
out="$here/phpunit"
mkdir -p "$out"

side_list=("$side")
[ "$side" = "both" ] && side_list=(before after)

for s in "${side_list[@]}"; do
  case "$s" in
    before) env="baseline-2847425" ;;
    after) env="issue-2847425" ;;
    *) echo "usage: $0 before|after|both" >&2; exit 2 ;;
  esac
  dir="$root/envs/$env"
  if [ ! -f "$dir/.ddev/config.yaml" ]; then echo "$env is not built: node tools/compare/setup.mjs 2847425-pinned" >&2; exit 3; fi
  if [ ! -f "$src" ]; then echo "missing $src" >&2; exit 3; fi

  chrome="ddev-repro-${env}-chrome"
  if [ "$(docker inspect -f '{{.State.Running}}' "$chrome" 2>/dev/null)" != "true" ]; then
    docker start "$chrome" >/dev/null 2>&1 || true
  fi
  for _ in $(seq 1 30); do
    docker exec "$chrome" sh -c 'curl -sf http://localhost:4444/status >/dev/null 2>&1' 2>/dev/null && break
    sleep 1
  done
  if ! docker exec "$chrome" sh -c 'curl -sf http://localhost:4444/status >/dev/null 2>&1' 2>/dev/null; then
    echo "Selenium is not answering in $chrome; start the pair: node scripts/lab-env.mjs start 2847425-pinned" >&2
    exit 3
  fi

  before_status="$(git -C "$dir" status --porcelain --untracked-files=no)"
  backup="$(mktemp)"
  copied=0
  if [ -f "$dir/$test_rel" ]; then cp "$dir/$test_rel" "$backup"; fi
  cleanup() {
    if [ "$copied" = "1" ]; then
      if [ -s "$backup" ]; then cp "$backup" "$dir/$test_rel"; else rm -f "$dir/$test_rel"; fi
      for _ in $(seq 1 30); do ( cd "$dir" && ddev exec test -f "$test_rel" ) >/dev/null 2>&1 || break; sleep 1; done
    fi
    rm -f "$backup"
  }
  trap cleanup EXIT

  mkdir -p "$(dirname "$dir/$test_rel")"
  cp "$src" "$dir/$test_rel"; copied=1
  for _ in $(seq 1 30); do ( cd "$dir" && ddev exec test -f "$test_rel" ) >/dev/null 2>&1 && break; sleep 1; done
  if ! ( cd "$dir" && ddev exec test -f "$test_rel" ) >/dev/null 2>&1; then
    echo "the test file did not reach the $env container within 30 s (DDEV Mutagen sync)" >&2
    exit 3
  fi

  log="$out/$stamp-$s.log"
  echo "--- $s ($env): ddev phpunit $test_rel"
  ( cd "$dir" && ddev phpunit "$test_rel" 2>&1 ) | tee "$log"
  code="${PIPESTATUS[0]}"
  cleanup; trap - EXIT
  copied=0

  after_status="$(git -C "$dir" status --porcelain --untracked-files=no)"
  if [ "$before_status" != "$after_status" ]; then
    echo "WARNING: the tracked git status of $env changed during the run" >&2
    diff <(printf '%s\n' "$before_status") <(printf '%s\n' "$after_status") >&2 || true
  fi
  echo "--- $s exit $code, log $log"
  echo
  [ "$code" = "0" ] && echo "$s: PASS" || echo "$s: FAIL (exit $code)"
done
