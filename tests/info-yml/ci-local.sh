#!/bin/bash
# Runs the steps of .github/workflows/info-yml.yml on this machine, in the same image (php:8.5-cli), as root, against a copy
# of the lab's working tree. For the lab container this was written in, which cannot reach Debian's mirrors, PECL,
# getcomposer.org or Packagist downloads: each step tries the workflow's own command first, and when a download fails it
# uses a substitute from the host and prints "LAB SUBSTITUTE". vendor/ is always the host's (hard-linked), not a fresh
# composer install. What this cannot show: the GitHub actions themselves (checkout, setup-node, cache) and the downloads.
#
#   tests/info-yml/ci-local.sh            needs docker, envs/info-yml-patch/vendor (composer install there) and
#                                         envs/info-yml-main (a clone of drupal/drupal at CORE_COMMIT)
# Environment: IMAGE (default php:8.5-cli; mirror.gcr.io/library/php:8.5-cli avoids Docker Hub's rate limit),
#   LAB_PHP (the host PHP 8.5 whose yaml.so is the PECL substitute; default /opt/php85/bin/php).
set -euo pipefail
lab=$(cd "$(dirname "$0")/../.." && pwd)
image=${IMAGE:-php:8.5-cli}
php=${LAB_PHP:-/opt/php85/bin/php}
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

# The working tree as the workflow's checkout would see it (tracked and new files; envs/ is ignored), and the substitutes.
mkdir -p "$work/lab" "$work/host"
(cd "$lab" && git ls-files -co --exclude-standard | grep -v '^envs/' | tar -cf - -T -) | tar -xf - -C "$work/lab"
[ -d "$lab/tools/compare/.deps" ] && cp -r "$lab/tools/compare/.deps" "$work/lab/tools/compare/"
mkdir -p "$work/lab/envs/info-yml-patch"
cp -al "$lab/envs/info-yml-patch/vendor" "$work/lab/envs/info-yml-patch/vendor"
cp "$("$php" -r 'echo ini_get("extension_dir");')/yaml.so" "$(command -v composer)" "$work/host/"
libyaml=$(ldd "$work/host/yaml.so" | awk '/libyaml/ {print $3}')

cat > "$work/steps.sh" <<'STEPS'
set -euo pipefail
export CORE_COMMIT=$(sed -n 's/^  CORE_COMMIT: //p' /lab/.github/workflows/info-yml.yml) COMPOSER_ALLOW_SUPERUSER=1
sub() { echo "LAB SUBSTITUTE: $*"; }
echo "== system packages, PECL yaml and Composer"
if ! { apt-get update -qq && apt-get install -y -qq git unzip libyaml-dev; } > /dev/null 2>&1; then
  sub "Debian's mirrors are not reachable; host git (local operations only) and host libyaml"; export PATH=/opt/host-git:$PATH
fi
extdir=$(php -r 'echo ini_get("extension_dir");')
pecl install yaml > /dev/null 2>&1 || { sub "PECL is not reachable; host yaml.so (check the PHP versions match)"; cp /host/yaml.so "$extdir/"; }
php -n -d extension=yaml -r 'exit(extension_loaded("yaml") ? 0 : 1);'
curl -fsS https://getcomposer.org/installer 2>/dev/null | php -- --quiet --install-dir=/usr/local/bin --filename=composer 2> /dev/null \
  || { sub "getcomposer.org is not reachable; host composer"; cp /host/composer /usr/local/bin/composer; }
git config --global --add safe.directory '*'
cd /lab
echo "== core at CORE_COMMIT, with the patch"
git init -q envs/info-yml-patch && cd envs/info-yml-patch
git fetch -q --depth 1 https://github.com/drupal/drupal "$CORE_COMMIT" 2> /dev/null \
  || { sub "github.com is not reachable with git here; a local clone at the same commit"; git -c uploadpack.allowAnySHA1InWant=true fetch -q --depth 1 file:///coremirror "$CORE_COMMIT"; }
git checkout -q FETCH_HEAD
git -c user.name=CI -c user.email=ci@example.com am -q ../../reports/info-yml/patches/ex-validate.patch
git log --oneline -2
sub "vendor/ is the host's, hard-linked; composer install is not run"
echo "== Extension unit tests, Symfony YAML"; php -n -d memory_limit=1G vendor/bin/phpunit -c core core/tests/Drupal/Tests/Core/Extension/ | tail -1
echo "== Extension unit tests, PECL YAML"; php -n -d memory_limit=1G -d extension=yaml vendor/bin/phpunit -c core core/tests/Drupal/Tests/Core/Extension/ | tail -1
cd /lab
sub "js-yaml is copied from the host; npm install is not run"
echo "== lint"; node scripts/info-yml-repro.mjs lint --core=envs/info-yml-patch | tail -3
echo "== planted"; node scripts/info-yml-repro.mjs planted --core=envs/info-yml-patch
echo "== deploy-gate"; node scripts/info-yml-repro.mjs deploy-gate --core=envs/info-yml-patch
echo "== all steps passed"
STEPS

proxy=()
for v in HTTPS_PROXY https_proxy NO_PROXY no_proxy; do [ -n "${!v:-}" ] && proxy+=(-e "$v"); done
docker run --rm --network host "${proxy[@]}" \
  -v "$work/lab:/lab" -v "$work/host:/host:ro" -v "$work/steps.sh:/steps.sh:ro" -v "$lab/envs/info-yml-main:/coremirror:ro" \
  -v "$(dirname "$(command -v node)"):/opt/host-node:ro" -e PATH=/opt/host-node:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin \
  -v "$(command -v git):/opt/host-git/git:ro" -v /usr/lib/git-core:/usr/lib/git-core:ro \
  ${libyaml:+-v "$libyaml:/usr/lib/x86_64-linux-gnu/$(basename "$libyaml"):ro"} \
  "$image" bash /steps.sh
