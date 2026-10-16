#!/usr/bin/env python3
"""Install issue #3615469 files into the current lab root; preview by default."""
import argparse
from datetime import datetime, timezone
from pathlib import Path
import shutil

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--install', action='store_true', help='copy files, backing up different existing versions')
args = parser.parse_args()
root = Path.cwd()
if not (root / 'tools/compare/lib.mjs').is_file() or not (root / '.git').exists():
    parser.error('Run from the root of your drupal-core-lab checkout, not reports/issues/3615469.')
payload = Path(__file__).resolve().parent / 'payload'
files = sorted(p for p in payload.rglob('*') if p.is_file())
if not files:
    parser.error('The payload folder is missing or empty; extract the complete ZIP first.')
changes = []
for source in files:
    rel = source.relative_to(payload)
    if '..' in rel.parts or rel.is_absolute():
        parser.error('Invalid payload path')
    target = root / rel
    if not target.resolve().is_relative_to(root.resolve()):
        parser.error(f'Target escapes repository: {rel}')
    if target.exists() and (not target.is_file() or target.is_symlink()):
        parser.error(f'Refusing non-regular target: {rel}')
    if target.exists() and target.read_bytes() == source.read_bytes():
        continue
    changes.append((source, target, rel))
    print(('BACK UP AND REPLACE ' if target.exists() else 'ADD ') + str(rel))
if not args.install:
    print(f'Preview: {len(changes)} files. Re-run with --install to copy them. No files changed.')
    raise SystemExit(0)
backup = root / 'reports/issues/3615469/import-backups' / datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
for source, target, rel in changes:
    if target.exists():
        saved = backup / rel
        saved.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(target, saved)
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
print(f'Installed {len(changes)} files.')
if backup.exists():
    print(f'Previous versions: {backup.relative_to(root)}')
print('Next: node scripts/index-issues.mjs && node scripts/doctor.mjs 3615469-pinned')
