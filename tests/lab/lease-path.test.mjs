// Machine-global lease path and the one-time migration from a checkout-local lease file.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { coordinationDir, leaseFilePath, leaseFileFor } from '../../tools/compare/lease-path.mjs';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'lease-path-'));
const clean = (dir) => fs.rmSync(dir, { recursive: true, force: true });

test('the default is under the DSH home, not the checkout', () => {
  const home = tmp();
  try {
    assert.equal(coordinationDir({ env: {}, home }), path.join(home, '.dsh/lab-coordination'));
    assert.equal(leaseFilePath({ labRoot: '/checkout', env: {}, home }), path.join(home, '.dsh/lab-coordination/lab-env-leases.json'));
  } finally { clean(home); }
});

test('LAB_LEASE_FILE overrides everything', () => {
  const dir = tmp();
  try {
    const explicit = path.join(dir, 'lease.json');
    assert.equal(leaseFilePath({ env: { LAB_LEASE_FILE: explicit }, home: dir }), explicit);
    assert.equal(leaseFileFor('/checkout', { env: { LAB_LEASE_FILE: explicit }, home: dir }), explicit);
  } finally { clean(dir); }
});

test('a legacy checkout lease is copied once and is not deleted', () => {
  const home = tmp(), lab = tmp();
  try {
    const legacy = path.join(lab, '.lab-cache/lab-env-leases.json');
    fs.mkdirSync(path.dirname(legacy), { recursive: true });
    fs.writeFileSync(legacy, '{"schema_version":1,"leases":{}}\n');
    const target = leaseFileFor(lab, { env: {}, home });
    assert.equal(target, path.join(home, '.dsh/lab-coordination/lab-env-leases.json'));
    assert.equal(fs.readFileSync(target, 'utf8'), '{"schema_version":1,"leases":{}}\n');
    assert.equal(fs.existsSync(legacy), true);
    fs.writeFileSync(target, '{"schema_version":1,"leases":{"kept":true}}\n');
    assert.equal(leaseFileFor(lab, { env: {}, home }), target);
    assert.match(fs.readFileSync(target, 'utf8'), /kept/);
  } finally { clean(home); clean(lab); }
});

test('when ~/.dsh cannot be created, the checkout-local file is used instead of failing', () => {
  const home = tmp(), lab = tmp();
  try {
    fs.writeFileSync(path.join(home, '.dsh'), 'not a directory');
    const legacy = path.join(lab, '.lab-cache/lab-env-leases.json');
    assert.equal(leaseFileFor(lab, { env: {}, home }), legacy);
  } finally { clean(home); clean(lab); }
});
