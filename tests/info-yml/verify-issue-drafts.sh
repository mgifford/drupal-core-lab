#!/bin/bash
# Runs the reproduction steps of the five ex:install issue drafts, exactly as written, on a lab worker site restored from
# its Standard snapshot. Puts the worker back as it found it (no sites/default/files, no custom extensions).
#   tests/info-yml/verify-issue-drafts.sh envs/info-yml-work/w0 <1-5>          (needs a prepared worker: prepare --workers=N)
#   tests/info-yml/verify-issue-drafts.sh envs/info-yml-work-theme-incompatible/w0 1v   (draft 1 on the variant)
#   tests/info-yml/verify-issue-drafts.sh envs/info-yml-work-name-not-string/w0 5v      (draft 5 on its variant)
#   tests/info-yml/verify-issue-drafts.sh envs/info-yml-work/w0 s                        (the steps of reports/info-yml/ISSUE-SUMMARY.md)
# Drafts: reports/info-yml/issue-drafts/. Output of the last run: reports/info-yml/issue-drafts/verification.txt.
set -u
W=$(cd "$1" && pwd); D=$W/docroot; draft=$2
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
# PHP's built-in server with core's router, .ht.router.php in the site root (as scripts/info-yml-repro.mjs uses it).
serve() { (cd "$D" && exec "${P[@]}" -S 127.0.0.1:8899 .ht.router.php > /dev/null 2>&1) & server=$!; for i in $(seq 1 40); do curl -s -o /dev/null --noproxy '*' http://127.0.0.1:8899/robots.txt && break; sleep 0.25; done; }
# Drupal's own log (dblog): the newest row id, and the rows written since (class or type, then the message).
LABROOT=$(cd "$(dirname "$0")/../.." && pwd)
wid_max() { "${P[@]}" "$LABROOT/tests/info-yml/lib/watchdog.php" "$D/sites/default/files/.sqlite" max; }
dblog_since() { "${P[@]}" "$LABROOT/tests/info-yml/lib/watchdog.php" "$D/sites/default/files/.sqlite" "$1" | "${P[@]}" -r 'foreach (json_decode(stream_get_contents(STDIN), TRUE) ?: [] as $r) { if (($r["severity"] ?? 7) <= 4) echo "dblog: ", $r["class"] ?? $r["type"], ": ", substr($r["exception_message"] ?? $r["text"] ?? "", 0, 170), "\n"; }'; }
admin_get() { curl -s -o /dev/null -w '%{http_code}\n' --noproxy '*' -H "Cookie: $(cat "$W/snapshots/standard/cookie.txt")" "http://127.0.0.1:8899$1"; }
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
    serve
    step "GET /admin/modules as the administrator"; admin_get /admin/modules
    grep -m1 -o 'TypeError: "strcasecmp()[^"]*"' "$LOG"
    kill "$server"; wait "$server" 2>/dev/null; server=
    step "dr ex:install example -y"; out=$(dr ex:install example -y); echo "exit $? / $(echo "$out" | first '\* ')"; grep -m1 -o 'Array to string conversion' "$LOG"; installed example ;;
  5v)
    mkdir -p "$D/modules/custom/example"
    printf 'name: [Example, module]\ntype: module\ncore_version_requirement: ^12\n' > "$D/modules/custom/example/example.info.yml"
    serve; wid=$(wid_max)
    step "GET /admin/modules as the administrator"; admin_get /admin/modules
    curl -s --noproxy '*' -H "Cookie: $(cat "$W/snapshots/standard/cookie.txt")" http://127.0.0.1:8899/admin/modules | grep -o '<label[^>]*for="edit-modules-example-enable"[^>]*>[^<]*</label>' | head -1
    dblog_since "$wid" | sort -u
    kill "$server"; wait "$server" 2>/dev/null; server= ;;
  s)
    mkdir -p "$D/modules/custom/example"
    printf 'name: Example\ntype: module\ncore_version_requirement: ^12\ndescription: Example: one\n' > "$D/modules/custom/example/example.info.yml"
    step "dr cache:rebuild"; out=$(dr cache:rebuild); echo "exit $? / $(echo "$out" | first 'A colon cannot' | sed "s#$D/##")"
    step "empty the cache tables (all cache* tables except cachetags)"
    (cd "$D" && "${P[@]}" -r '$db = new PDO("sqlite:sites/default/files/.sqlite"); $n = 0; foreach ($db->query("SELECT name FROM sqlite_master WHERE type = \"table\" AND name LIKE \"cache%\" AND name <> \"cachetags\"")->fetchAll(PDO::FETCH_COLUMN) as $t) { $db->exec("DELETE FROM \"$t\""); $n++; } echo "$n tables emptied\n";')
    serve; wid=$(wid_max)
    step "GET /user/login as an anonymous visitor"; curl -s -o /dev/null -w '%{http_code}\n' --noproxy '*' http://127.0.0.1:8899/user/login
    dblog_since "$wid" | sed "s#$D/##" | sort -u
    grep -m1 -o 'InfoParserException.*line 4' "$LOG" | sed "s#$D/##" | cut -c1-220
    kill "$server"; wait "$server" 2>/dev/null; server= ;;
esac
