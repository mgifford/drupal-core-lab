#!/usr/bin/env bash
set -euo pipefail

mkdir -p modules/custom
cp -R recipes/repro_3466040/modules/lab_dialog_repro modules/custom/
php core/scripts/dr pm:install lab_dialog_repro
php core/scripts/dr cache:rebuild
