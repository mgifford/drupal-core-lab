Issue #3615469 local comparison kit.

Extract this folder anywhere outside your checkout. In your drupal-core-lab repository root run:

python3 /path/to/3615469-local-test-kit/install-3615469.py
python3 /path/to/3615469-local-test-kit/install-3615469.py --install

The first command previews changes. The second backs up different existing files and installs the payload at the correct paths. Do not copy the kit folder into reports/issues. Then read reports/issues/3615469/REPRODUCE.md. No database reset is needed to switch issues.
