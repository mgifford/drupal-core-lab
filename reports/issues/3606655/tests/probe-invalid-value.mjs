// Invalid stored preference: what the patched site does when the database holds
// a value outside light/dark/auto (set directly, as a broken migration might).
//   node reports/issues/3606655/tests/probe-invalid-value.mjs <base-url>
import fs from 'node:fs';
const BASE = (process.argv[2] || 'https://repro-issue-3606655.ddev.site').replace(/\/$/, '');
class Jar { constructor() { this.c = new Map(); } apply(sc) { const [p] = sc.split(';'); const i = p.indexOf('='); const n = p.slice(0, i).trim(), v = p.slice(i + 1).trim(); if (/expires=Thu, 01 Jan 1970/i.test(sc) || v === '') this.c.delete(n); else this.c.set(n, v); } h() { return [...this.c].map(([k, v]) => `${k}=${v}`).join('; '); } }
const jar = new Jar();
async function req(url, { method = 'GET', form, extraCookie } = {}) {
  const h = {};
  const base = jar.h();
  if (base) h.cookie = base;
  if (extraCookie) h.cookie = h.cookie ? `${h.cookie}; ${extraCookie}` : extraCookie;
  let b; if (form) { b = new URLSearchParams(form).toString(); h['content-type'] = 'application/x-www-form-urlencoded'; }
  let r = await fetch(url, { method, body: b, headers: h, redirect: 'manual' });
  const set = [];
  for (let i = 0; i < 10; i++) {
    for (const sc of r.headers.getSetCookie?.() || []) { jar.apply(sc); if (/color/i.test(sc)) set.push(sc); }
    if (![301, 302, 303, 307, 308].includes(r.status)) break;
    url = new URL(r.headers.get('location'), url).toString();
    r = await fetch(url, { headers: { ...(jar.c.size ? { cookie: jar.h() } : {}) }, redirect: 'manual' });
  }
  const text = await r.text();
  return { status: r.status, set, text, headers: { cache: r.headers.get('x-drupal-cache'), dpc: r.headers.get('x-drupal-dynamic-cache') } };
}
const lp = await req(`${BASE}/user/login`);
const lf = lp.text.match(/<form[^>]*id="user-login-form"[\s\S]*?<\/form>/i)[0];
const f = {}; for (const m of lf.matchAll(/<input\b([^>]*)>/gi)) { const n = (m[1].match(/name="([^"]*)"/) || [])[1]; if (n) f[n] = (m[1].match(/value="([^"]*)"/) || [])[1] || ''; }
await req(`${BASE}/user/login`, { method: 'POST', form: { ...f, name: 'admin', pass: 'admin', op: 'Log in' } });
const profile = await req(`${BASE}/user/edit`);
const done = {}
for (const m of profile.text.matchAll(/<input[^>]*name="color_scheme"[^>]*>/g)) done[m[0].match(/value="([^"]*)"/)[1]] = /checked/i.test(m[0]);
const withCookie = await req(`${BASE}/user`, { extraCookie: 'DrupalColorScheme=dark' });
const without = await req(`${BASE}/user`);
const htmlTag = (t) => (t.match(/<html[^>]*data-color-scheme="([^"]*)"/) || [])[1] || null;
const out = {
  url: BASE,
  profileRadios: done,
  forgedCookie: { setCookie: withCookie.set, dpc: withCookie.headers.dpc, cache: withCookie.headers.cache, attribute: htmlTag(withCookie.text) },
  noCookie: { setCookie: without.set, dpc: without.headers.dpc, cache: without.headers.cache, attribute: htmlTag(without.text) },
};
console.log(JSON.stringify(out, null, 2));
fs.writeFileSync('reports/issues/3606655/tests/invalid-value.json', `${JSON.stringify(out, null, 2)}\n`);
