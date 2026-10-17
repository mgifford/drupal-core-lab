// Which hosts a build of a variant has to reach, and whether they answer (AI-usage Phase 5, the restricted-network case).
// Under a filtered egress (a Coder workspace, 2026-10-14: git.drupalcode.org, drupal.org and repo.yarnpkg.com unreachable) a build used to
// fail ten minutes in. This names the hosts first, so the mirror or seed options can be chosen before starting: --core-url, --core-from,
// --use-existing-core (tools/compare/cloud/README.md). It does not make a blocked host reachable and it does not prove an offline build works.
import https from 'node:https';

const hostOf = (u) => { try { return new URL(u).hostname; } catch { return null; } };
export const DEFAULT_CORE_URL = 'https://git.drupalcode.org/project/drupal.git';

// [{ host, why: [...] }] for building `v` (a resolved variant). coreUrl is the --core-url mirror, when one is used.
export function hostsFor(v, { coreUrl } = {}) {
  const m = new Map(), need = (host, why) => { if (host) m.set(host, [...(m.get(host) || []), why]); };
  need(hostOf(coreUrl || (v.core && v.core.url) || DEFAULT_CORE_URL), 'Drupal core (git fetch)');
  for (const c of v.contrib || []) need(hostOf(c.url), `contrib module ${c.name} (git clone; there is no mirror option for it)`);
  need('repo.packagist.org', 'Composer packages (ddev composer install)');
  need('github.com', 'the DDEV add-on (ddev add-on get) and most Composer package archives');
  need('registry.npmjs.org', 'axe-core and the Playwright tools (npm install)');
  return [...m].map(([host, why]) => ({ host, why }));
}

// The default probe: an HTTPS request, any answer at all counts as reachable (404 and 403 included: the host is there).
export const httpsProbe = (host, timeoutMs = 6000, request = https.request) => new Promise((resolve) => {
  const req = request({ host, method: 'HEAD', path: '/', timeout: timeoutMs }, (res) => { res.resume(); resolve({ ok: true, detail: `HTTP ${res.statusCode}` }); });
  req.on('timeout', () => { req.destroy(); resolve({ ok: false, detail: `no answer in ${timeoutMs / 1000} s` }); });
  req.on('error', (e) => resolve({ ok: false, detail: e.code || e.message }));
  req.end();
});

// probe(host) -> { ok, detail }. Returns [{ host, why, ok, detail }].
export async function checkHosts(hosts, probe = httpsProbe) {
  return Promise.all(hosts.map(async (h) => ({ ...h, ...(await probe(h.host)) })));
}
