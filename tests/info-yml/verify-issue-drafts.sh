#!/bin/bash
# Runs the reproduction steps of the five ex:install issue drafts, exactly as written, on a lab worker site restored from
# its Standard snapshot. Puts the worker back as it found it (no sites/default/files, no custom extensions).
#   tests/info-yml/verify-issue-drafts.sh envs/info-yml-work/w0 <1-5>          (needs a prepared worker: prepare --workers=N)
#   tests/info-yml/verify-issue-drafts.sh envs/info-yml-work-theme-incompatible/w0 1v   (draft 1 on the variant)
# Drafts: reports/info-yml/issue-drafts/. Output of the last run: reports/info-yml/issue-drafts/verification.txt.
set -u
W=$1; D=$W/docroot; draft=$2
LOG=$(mktemp)
P=(/opt/php85/bin/php -n -d memory_limit=1G -d date.timezone=UTC -d display_errors=0 -d log_errors=1 -d "error_log=$LOG" -d opcache.enable=0)
dr() { (cd "$D" && COLUMNS=400 "${P[@]}" core/scripts/dr "$@" --no-interaction 2>&1); }
installed() { (cd "$D" && "${P[@]}" -r '$d = unserialize((new PDO("sqlite:sites/default/files/.sqlite"))->query("SELECT data FROM config WHERE collection = \"\" AND name = \"core.extension\"")->fetchColumn(), ["allowed_classes" => FALSE]); echo isset($d["module"][$argv[1]]) || isset($d["theme"][$argv[1]]) ? "recorded as installed" : "not installed", "\n";' "$1"); }
clean() { rm -rf "$D/sites/default/files" "$D/sites/default/settings.php" "$D/modules/custom/example" "$D/themes/custom/example"; }
trap 'clean; [ -n "${server:-}" ] && kill "$server" 2>/dev/null; rm -f "$LOG"' EXIT
clean
cp -a "$W/snapshots/standard/files" "$D/sites/default/files"
cp "$W/snapshots/standard/settings.php" "$D/sites/default/settings.php" && chmod 644 "$D/sites/default/settings.php"
step() { echo "-- $*"; }
first() { grep -m1 -E "$1" | sed 's/^ *//' | cut -c1-200; }

case $draft in
  1|1v)
    mkdir -p "$D/themes/custom/example"
    printf 'name: Example\ntype: theme\ncore_version_requirement: ^10\nbase theme: false\n' > "$D/themes/custom/example/example.info.yml"
    step "dr ex:install example -y"; out=$(dr ex:install example -y); rc=$?; echo "exit $rc / $(echo "$out" | first 'OK|ERROR')"; installed example ;;
  2)
    mkdir -p "$D/themes/custom/example"
    printf 'name: Example\ntype: theme\ncore_version_requirement: ^12\nbase theme: false\nregions: Header\n' > "$D/themes/custom/example/example.info.yml"
    step "dr ex:install example -y"; dr ex:install example -y > /dev/null; echo "exit $?"; grep -m1 -o 'TypeError: array_map[^,]*' "$LOG"; installed example
    step "dr cache:rebuild"; dr cache:rebuild > /dev/null; echo "exit $?" ;;
  3)
    mkdir -p "$D/modules/custom/example"
    printf 'name: Example\ntype: module\ncore_version_requirement: ^12\n' > "$D/modules/custom/example/example.info.yml"
    printf '<?php\n\nfunction example_help( {\n}\n' > "$D/modules/custom/example/example.module"
    step "dr ex:install example -y"; dr ex:install example -y > /dev/null; echo "exit $?"; grep -m1 -o 'PHP Parse error:  syntax error[^"]*"[^"]*"' "$LOG"; installed example
    step "dr cache:rebuild"; dr cache:rebuild > /dev/null; echo "exit $?" ;;
  4)
    mkdir -p "$D/modules/custom/example"
    printf 'name: Example\ntype: module\ncore_version_requirement: ^12\n' > "$D/modules/custom/example/example.info.yml"
    printf '<?php\n' > "$D/modules/custom/example/example.module"
    step "dr ex:install example -y (valid module)"; dr ex:install example -y > /dev/null; echo "exit $?"; installed example
    printf '<?php\n\nfunction example_help( {\n}\n' > "$D/modules/custom/example/example.module"
    step "dr ex:install syslog -y (after the parse error)"; out=$(dr ex:install syslog -y); echo "exit $? / $(echo "$out" | first 'commands defined|Exception|rror')"
    step "dr cache:rebuild"; dr cache:rebuild > /dev/null; echo "exit $?" ;;
  5)
    mkdir -p "$D/modules/custom/example"
    printf 'name: [Example, module]\ntype: module\ncore_version_requirement: ^12\n' > "$D/modules/custom/example/example.info.yml"
    (cd "$D" && exec "${P[@]}" -S 127.0.0.1:8899 core/.ht.router.php > /dev/null 2>&1) & server=$!
    for i in $(seq 1 40); do curl -s -o /dev/null --noproxy '*' http://127.0.0.1:8899/robots.txt && break; sleep 0.25; done
    step "GET /admin/modules as the administrator"; curl -s -o /dev/null -w '%{http_code}\n' --noproxy '*' -H "Cookie: $(cat "$W/snapshots/standard/cookie.txt")" http://127.0.0.1:8899/admin/modules
    grep -m1 -o 'TypeError: "strcasecmp()[^"]*"' "$LOG"
    kill "$server"; wait "$server" 2>/dev/null; server=
    step "dr ex:install example -y"; out=$(dr ex:install example -y); echo "exit $? / $(echo "$out" | first '\* ')"; grep -m1 -o 'Array to string conversion' "$LOG"; installed example ;;
esac
