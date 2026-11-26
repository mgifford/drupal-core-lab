// HTTP-level probe for #3606655 (MR !16432 @ 170be9e3).
// Reads what the server actually sends: the <html data-color-scheme> value, Set-Cookie,
// page-cache headers and cache contexts. Writes machine-readable JSON.
//
// Usage:
//   NODE_TLS_REJECT_UNAUTHORIZED=0 node reports/issues/3606655/tests/probe-http.mjs \
//     --base=https://repro-issue-3606655.ddev.site --side=after --out=.../http-after.json
//
// Public HTTP interface only: form logins, form posts, one cookie jar per visitor.

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const argv = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, ...v] = a.replace(/^--/, '').split('=');
  return [k, v.join('=')];
}));
const BASE = (argv.base || '').replace(/\/$/, '');
const SIDE = argv.side || 'unknown';
const OUT = argv.out || `reports/issues/3606655/tests/http-${SIDE}.json`;
const ADMIN = { name: argv.admin || 'admin', pass: argv.pass || 'admin' };
const ENVDIR = argv.envdir || '.';

function sql(query) {
  try {
    return execFileSync('ddev', ['exec', 'sqlite3', '/var/www/html/sites/default/files/.sqlite', query], { cwd: ENVDIR, encoding: 'utf8' }).trim();
  }
  catch {
    // The sqlite CLI in the container has no NOCASE_UTF8 collation, so queries
    // that use Drupal's name index fail. Absence of an answer is not an answer.
    return '';
  }
}
function uidOf(name) {
  const rows = sql(`select uid from users_field_data where name='${name}'`);
  return rows ? Number(rows.split('\n')[0].split('|')[0]) : 0;
}
function storedPreference(name) {
  const rows = sql(`select color_scheme from users_field_data where name='${name}'`);
  return rows || null;
}

class Jar {
  constructor() { this.cookies = new Map(); }
  apply(setCookie) {
    const [pair, ...attrs] = setCookie.split(';');
    const eq = pair.indexOf('=');
    if (eq < 0) return null;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    const expired = /expires=Thu, 01 Jan 1970/i.test(setCookie) || value === '';
    if (expired) this.cookies.delete(name);
    else this.cookies.set(name, value);
    return { name, value, expired, attrs: attrs.map((a) => a.trim()).join('; ') };
  }
  header() { return [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; '); }
}

const jars = {};
const jarFor = (n) => jars[n] || (jars[n] = new Jar());

async function request(jar, url, { method = 'GET', form } = {}) {
  const headers = {};
  if (jar.cookies.size) headers.cookie = jar.header();
  let body;
  if (form) {
    body = new URLSearchParams(form).toString();
    headers['content-type'] = 'application/x-www-form-urlencoded';
  }
  let target = url;
  const hops = [];
  let res = await fetch(target, { method, body, headers, redirect: 'manual' });
  const written = [];
  for (let i = 0; i < 12; i++) {
    for (const sc of res.headers.getSetCookie?.() || []) {
      const c = jar.apply(sc);
      if (c) written.push(c);
    }
    if (![301, 302, 303, 307, 308].includes(res.status)) break;
    const loc = new URL(res.headers.get('location'), target).toString();
    hops.push({ status: res.status, location: loc.replace(BASE, '') });
    target = loc;
    res = await fetch(target, {
      headers: jar.cookies.size ? { cookie: jar.header() } : {},
      redirect: 'manual',
    });
  }
  const text = await res.text();
  return {
    url: target.replace(BASE, '') || '/',
    status: res.status,
    setCookies: written,
    headers: {
      'x-drupal-cache': res.headers.get('x-drupal-cache'),
      'x-drupal-dynamic-cache': res.headers.get('x-drupal-dynamic-cache'),
      'x-drupal-cache-contexts': res.headers.get('x-drupal-cache-contexts'),
      'x-drupal-cache-tags': res.headers.get('x-drupal-cache-tags'),
    },
    html: text,
    hops,
  };
}

function htmlTag(html) {
  const m = html.match(/<html\b[^>]*>/i);
  if (!m) return null;
  const attr = m[0].match(/data-color-scheme="([^"]*)"/i);
  return { tag: m[0], colorScheme: attr ? attr[1] : null };
}

function formBlock(html, required) {
  const parts = html.split(/(?=<form\b)/i).filter((s) => /^<form\b/i.test(s));
  for (const p of parts) {
    const block = p.split(/<\/form>/i)[0];
    if (required.every((n) => new RegExp(`name="${n}"`).test(block))) return block;
  }
  return null;
}

function fields(block) {
  const out = {};
  const re = /<input\b([^>]*)>/gi;
  let m;
  while ((m = re.exec(block))) {
    const attrs = m[1];
    const name = (attrs.match(/name="([^"]*)"/i) || [])[1];
    const type = (attrs.match(/type="([^"]*)"/i) || [])[1] || 'text';
    if (!name || /^(submit|button|image|file)$/i.test(type)) continue;
    if (type === 'radio' || type === 'checkbox') {
      if (!/checked/i.test(attrs)) continue;
    }
    out[name] = (attrs.match(/value="([^"]*)"/i) || [])[1] || '';
  }
  return out;
}

function radioOptions(html) {
  return [...html.matchAll(/<input[^>]*name="color_scheme"[^>]*>/g)].map((m) => ({
    value: (m[0].match(/value="([^"]*)"/) || [])[1] || null,
    checked: /checked/i.test(m[0]),
    disabled: /disabled/i.test(m[0]),
    describedBy: (m[0].match(/aria-describedby="([^"]*)"/) || [])[1] || null,
  }));
}

const obs = [];
const record = (step, extra) => obs.push({ step, at: new Date().toISOString(), ...extra });

async function login(jar, name, pass) {
  const page = await request(jar, `${BASE}/user/login`);
  const block = formBlock(page.html, ['name', 'pass']);
  if (!block) return { ok: false, reason: 'no login form' };
  const f = fields(block);
  const res = await request(jar, `${BASE}/user/login`, {
    method: 'POST',
    form: { ...f, name, pass, op: 'Log in' },
  });
  const session = [...jar.cookies.keys()].some((k) => /^S?SESS/.test(k));
  return { ok: session, status: res.status, url: res.url };
}

async function logout(jar) {
  const page = await request(jar, `${BASE}/user`);
  const m = page.html.match(/href="([^"]*\/user\/logout[^"]*)"/i);
  if (!m) return { ok: false, reason: 'no logout link' };
  const res = await request(jar, new URL(m[1].replace(/&amp;/g, '&'), BASE).toString());
  return { ok: !/user\/logout/i.test(res.html), status: res.status, url: res.url };
}

async function setPreference(jar, uid, value) {
  const path = uid ? `/user/${uid}/edit` : '/user/edit';
  const page = await request(jar, `${BASE}${path}`);
  if (page.status !== 200) return { ok: false, status: page.status, reason: 'form not reachable' };
  const block = formBlock(page.html, ['color_scheme']);
  if (!block) return { ok: false, status: page.status, reason: 'no color_scheme element' };
  const f = fields(block);
  const res = await request(jar, `${BASE}${path}`, {
    method: 'POST',
    form: { ...f, color_scheme: value, op: 'Save' },
  });
  return {
    ok: /have been saved|has been updated/i.test(res.html) || res.status === 303,
    status: res.status,
    setCookie: res.setCookies.filter((c) => /color/i.test(c.name)),
    cache: res.headers,
  };
}

async function findUid(adminJar, name) {
  const people = await request(adminJar, `${BASE}/admin/people`);
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const direct = people.html.match(new RegExp(`href="[^"]*/user/(\\d+)/edit"[^>]*>\\s*${escaped}\\s*<`, 'i'));
  if (direct) return Number(direct[1]);
  const row = people.html.split(/<tr/i).find((tr) => new RegExp(escaped).test(tr));
  const link = row && row.match(/user\/(\d+)\/edit/);
  return link ? Number(link[1]) : 0;
}

async function ensureUser(adminJar, { name, mail, pass, scheme }) {
  const page = await request(adminJar, `${BASE}/admin/people/create`);
  if (page.status !== 200) return { ok: false, name, reason: `create form ${page.status}` };
  const block = formBlock(page.html, ['name', 'mail']);
  if (!block) return { ok: false, name, reason: 'no create form' };
  const f = fields(block);
  const res = await request(adminJar, `${BASE}/admin/people/create`, {
    method: 'POST',
    form: { ...f, name, mail, 'pass[pass1]': pass, 'pass[pass2]': pass, notify: '0', status: '1', op: 'Create new account' },
  });
  const created = /has been emailed to the new user|Created a new user account|has been created/i.test(res.html);
  const uid = await findUid(adminJar, name);
  if (!uid) {
    const errors = [...res.html.matchAll(/<div[^>]*messages--error[^>]*>([\s\S]{0,300}?)<\/div>/gi)]
      .map((m) => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    return { ok: false, name, created, reason: 'uid not found', errors };
  }
  // The create form leaves the password widget empty unless it is submitted
  // with both confirm fields, so set the password through the edit form as well.
  const edit = await request(adminJar, `${BASE}/user/${uid}/edit`);
  const editBlock = formBlock(edit.html, ['name', 'mail']);
  if (editBlock) {
    const ef = fields(editBlock);
    const editPayload = { ...ef, 'pass[pass1]': pass, 'pass[pass2]': pass, op: 'Save' };
    if (/name="color_scheme"/.test(edit.html)) editPayload.color_scheme = scheme;
    await request(adminJar, `${BASE}/user/${uid}/edit`, { method: 'POST', form: editPayload });
  }
  return { ok: true, created, uid, name, scheme };
}

function currentThemes(html) {
  const front = [...html.matchAll(/name="theme"[^>]*value="([^"]+)"[^>]*checked/gi)].map((m) => m[1])[0]
    || (html.match(/name="theme"[^>]*value="([^"]+)"/i) || [])[1] || null;
  const adminBlock = html.match(/<select[^>]*name="admin_theme"[\s\S]*?<\/select>/i);
  const admin = adminBlock ? (adminBlock[0].match(/<option[^>]*value="([^"]+)"[^>]*selected/i) || [])[1] : null;
  return { front, admin };
}

async function setThemes(jar, { front, admin }) {
  const page = await request(jar, `${BASE}/admin/appearance`);
  if (page.status !== 200) return { ok: false, status: page.status };
  let frontResult = null;
  if (front) {
    const m = page.html.match(new RegExp(`href="([^"]*\\/admin\\/appearance\\/default\\?theme=${front}[^"]*)"`, 'i'));
    if (!m) return { ok: false, reason: `no set-default link for ${front}` };
    const res = await request(jar, new URL(m[1].replace(/&amp;/g, '&'), BASE).toString());
    frontResult = { status: res.status, url: res.url };
  }
  let adminResult = null;
  if (admin) {
    const block = formBlock(page.html, ['admin_theme']);
    const f = block ? fields(block) : {};
    const res = await request(jar, `${BASE}/admin/appearance`, {
      method: 'POST',
      form: { ...f, admin_theme: admin, op: 'Save configuration' },
    });
    adminResult = { status: res.status };
  }
  const now = await request(jar, `${BASE}/admin/appearance`);
  return { ok: true, front: frontResult, admin: adminResult, themes: currentThemes(now.html) };
}

const brief = (res, label) => ({
  label,
  url: res.url,
  status: res.status,
  colorScheme: htmlTag(res.html)?.colorScheme ?? null,
  html: htmlTag(res.html)?.tag ?? null,
  cookies: res.setCookies.map((c) => `${c.name}=${c.value}${c.expired ? ' (expired)' : ''}`),
  defaultAdminMarkup: /data-accent=/.test(res.html),
  jar: [...jarFor(label.split(':')[0]).cookies.entries()].map(([k, v]) => `${k}=${v}`),
  cache: res.headers,
});

async function main() {
  if (!BASE) throw new Error('--base is required');

  // 1. Anonymous: cache-busting query gives a real MISS then HIT.
  const anon = jarFor('anon');
  const stamp = Date.now();
  const a1 = await request(anon, `${BASE}/user/login?probe=${stamp}`);
  const a2 = await request(anon, `${BASE}/user/login?probe=${stamp}`);
  const aRoot = await request(anon, `${BASE}/`);
  record('anonymous', {
    first: brief(a1, 'anon:first'),
    second: brief(a2, 'anon:second'),
    root: { status: aRoot.status, colorScheme: htmlTag(aRoot.html)?.colorScheme ?? null, cache: aRoot.headers },
  });

  // 2. Admin: login, front-end route and admin route, in the default preference.
  const adminJar = jarFor('admin');
  const adminLogin = await login(adminJar, ADMIN.name, ADMIN.pass);
  record('login', { adminLogin });
  if (!adminLogin.ok) {
    fs.writeFileSync(OUT, `${JSON.stringify({ side: SIDE, base: BASE, observations: obs }, null, 2)}\n`);
    console.error(`login failed on ${SIDE}; wrote ${OUT}`);
    process.exit(2);
  }
  const accountPage = await request(adminJar, `${BASE}/user`);
  const uid = Number((accountPage.html.match(/user\/(\d+)\/edit/) || [])[1] || 1);

  const front = await request(adminJar, `${BASE}/user?probe=${stamp}`);
  const adminRoute = await request(adminJar, `${BASE}/admin/config`);
  const profile = await request(adminJar, `${BASE}/user/${uid}/edit`);
  const appearance = await request(adminJar, `${BASE}/admin/appearance`);
  const descId = (profile.html.match(/<fieldset[^>]*aria-describedby="([^"]+)"[^>]*>[\s\S]{0,300}Color scheme/) || [])[1] || null;
  record('admin-default', {
    uid,
    frontend: brief(front, 'admin-default'),
    adminRoute: brief(adminRoute, 'admin-default'),
    profile: {
      status: profile.status,
      colorScheme: htmlTag(profile.html)?.colorScheme ?? null,
      radios: radioOptions(profile.html),
      legend: (profile.html.match(/<legend[^>]*>([\s\S]*?)<\/legend>/i) || [])[1]?.replace(/<[^>]+>/g, '').trim() || null,
      descriptionId: descId,
      description: descId
        ? (profile.html.match(new RegExp(`id="${descId}"[^>]*>([\\s\\S]{0,400}?)<`)) || [])[1]?.replace(/<[^>]+>/g, '').trim() || null
        : null,
      setCookie: profile.setCookies.map((c) => `${c.name}=${c.value}`),
      cache: profile.headers,
    },
    themes: currentThemes(appearance.html),
  });

  // 3. Each preference in turn, then a change after the page has been cached.
  const byPreference = {};
  for (const value of ['dark', 'light', 'auto']) {
    const save = await setPreference(adminJar, uid, value);
    const page = await request(adminJar, `${BASE}/user?probe=${stamp}`);
    const again = await request(adminJar, `${BASE}/user?probe=${stamp}`);
    byPreference[value] = {
      save,
      first: brief(page, 'admin-default'),
      second: brief(again, 'admin-default'),
      form: (await request(adminJar, `${BASE}/user/${uid}/edit`)).html.includes(`value="${value}" checked`),
    };
  }
  record('admin-preference-matrix', byPreference);

  // 4. Logout: the cookie must go, and an anonymous page stays cacheable.
  const out = await logout(adminJar);
  const afterLogout = await request(adminJar, `${BASE}/user/login?probe=${stamp}`);
  record('logout', { logout: out, page: brief(afterLogout, 'anon:second') });

  // 5. Two accounts with different preferences, then two with the same one.
  await login(adminJar, ADMIN.name, ADMIN.pass);
  const suffix = String(stamp).slice(-6);
  const users = [
    { name: `probe_dark_${suffix}`, mail: `probe_dark_${suffix}@example.com`, pass: 'probe-pass-123', scheme: 'dark' },
    { name: `probe_light_${suffix}`, mail: `probe_light_${suffix}@example.com`, pass: 'probe-pass-123', scheme: 'light' },
    { name: `probe_light2_${suffix}`, mail: `probe_light2_${suffix}@example.com`, pass: 'probe-pass-123', scheme: 'light' },
  ];
  const created = [];
  for (const u of users) created.push(await ensureUser(adminJar, u));
  record('created-users', { created });

  const perUser = {};
  for (const c of created) {
    if (!c.ok) { perUser[c.name] = { created: c }; continue; }
    const jar = jarFor(c.name);
    const l = await login(jar, c.name, 'probe-pass-123');
    if (!l.ok) { perUser[c.name] = { created: c, login: l }; continue; }
    const page = await request(jar, `${BASE}/user/edit`);
    const frontPage = await request(jar, `${BASE}/user?probe=${stamp}`);
    const adminPage = await request(jar, `${BASE}/admin/config`);
    const descId = (page.html.match(/<fieldset[^>]*aria-describedby="([^"]+)"[^>]*>[\s\S]{0,300}Color scheme/) || [])[1] || null;
    perUser[c.name] = {
      created: c,
      login: l,
      profile: {
        status: page.status,
        colorScheme: htmlTag(page.html)?.colorScheme ?? null,
        radios: radioOptions(page.html),
        description: descId
          ? (page.html.match(new RegExp(`id="${descId}"[^>]*>([\\s\\S]{0,400}?)<`)) || [])[1]?.replace(/<[^>]+>/g, '').trim() || null
          : null,
        setCookie: page.setCookies.map((x) => `${x.name}=${x.value}`),
      },
      frontend: brief(frontPage, c.name),
      adminRoute: { status: adminPage.status, cache: adminPage.headers },
    };
  }
  record('accounts', perUser);

  // 6. Theme capability: the same account, front-end theme with and without support.
  const themesTried = {};
  for (const [label, combo] of Object.entries({
    'stark-front': { front: 'stark' },
    'default-admin-front': { front: 'default_admin' },
  })) {
    const set = await setThemes(adminJar, combo);
    const page = await request(adminJar, `${BASE}/user?probe=${stamp}-${label}`);
    const profilePage = await request(adminJar, `${BASE}/user/${uid}/edit`);
    themesTried[label] = {
      set,
      page: brief(page, 'admin-default'),
      description: (profilePage.html.match(/id="edit-color-scheme--wrapper--description"[^>]*>([\s\S]{0,400}?)</) || [])[1]?.replace(/<[^>]+>/g, '').trim() || null,
      disabled: radioOptions(profilePage.html).every((r) => r.disabled),
    };
  }
  record('themes', { themesTried, themesNow: currentThemes((await request(adminJar, `${BASE}/admin/appearance`)).html) });

  fs.writeFileSync(OUT, `${JSON.stringify({ side: SIDE, base: BASE, adminUid: uid, observations: obs }, null, 2)}\n`);
  console.log(`wrote ${OUT} (${obs.length} steps)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
