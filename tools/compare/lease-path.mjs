// Machine-global lease location. Leases protect DDEV environments, and the environments are shared by every checkout on the
// machine; a lease stored inside one checkout is invisible to another clone. The legacy per-checkout file is migrated once,
// without deleting it, so an in-flight session does not lose a lease when this change lands.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function coordinationDir({ env = process.env, home = os.homedir() } = {}) {
  return path.join(env.DSH_HOME || path.join(home, '.dsh'), 'lab-coordination');
}

export function leaseFilePath({ labRoot = process.cwd(), env = process.env, home = os.homedir() } = {}) {
  if (env.LAB_LEASE_FILE) return path.resolve(env.LAB_LEASE_FILE);
  return path.join(coordinationDir({ env, home }), 'lab-env-leases.json');
}

export function leaseFileFor(labRoot, { env = process.env, home = os.homedir() } = {}) {
  const target = leaseFilePath({ labRoot, env, home });
  if (env.LAB_LEASE_FILE) return target;
  const legacy = path.join(labRoot, '.lab-cache/lab-env-leases.json');
  // An agent sandbox may not be allowed to create ~/.dsh. Fall back to the checkout-local file rather than making every
  // lab command fail; the global file is still used whenever it is writable.
  try { fs.mkdirSync(path.dirname(target), { recursive: true }); fs.accessSync(path.dirname(target), fs.constants.W_OK); }
  catch { return legacy; }
  if (!fs.existsSync(target) && fs.existsSync(legacy)) {
    fs.copyFileSync(legacy, target);
    try { fs.chmodSync(target, 0o600); } catch { /* best effort */ }
  }
  return target;
}
