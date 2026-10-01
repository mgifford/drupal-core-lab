// Side-by-side server for two DDEV environments.
//   node tools/compare/serve.mjs            (page on :8100, before :8101, after :8102)
// Each site is reached through a small proxy on its own *.localhost hostname so the two
// sessions never share cookies, framing works, and a sync script can be injected.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { lighthouseAvailable, audit as lighthouseAudit } from './lighthouse.mjs';
import { labRoot, variants, envInfo, envInfoAsync, loginPathAsync, envDir } from './lib.mjs';

const PAGE = Number(process.env.PORT || 8100);
const AXE = path.join(labRoot, 'tools/compare/.deps/node_modules/axe-core/axe.min.js');
// --ddev: the viewer and both proxies are reached through a small DDEV project
// (tools/compare/site) as https://drupal-compare[-before|-after].ddev.site. Otherwise localhost ports.
const DDEV = process.argv.includes('--ddev') || !!process.env.COMPARE_DDEV;
const SIDES = DDEV
  ? { before: { port: PAGE + 1, host: 'drupal-compare-before.ddev.site', origin: 'https://drupal-compare-before.ddev.site' },
      after: { port: PAGE + 2, host: 'drupal-compare-after.ddev.site', origin: 'https://drupal-compare-after.ddev.site' } }
  : { before: { port: PAGE + 1, host: `before.localhost:${PAGE + 1}`, origin: `http://before.localhost:${PAGE + 1}` },
      after: { port: PAGE + 2, host: `after.localhost:${PAGE + 2}`, origin: `http://after.localhost:${PAGE + 2}` } };
const list = variants();
const state = { slug: process.argv.slice(2).find((x) => !x.startsWith('--')) || list[0].slug, theme: 'auto', darkos: false, axe: true, axeBest: false };
const current = () => list.find((x) => x.slug === state.slug) || list[0];
// Lighthouse jobs run one at a time, each in its own Chrome, and never block the proxies (login and DDEV lookups are async or cached).
const lh = { seq: 0, running: false, pending: null, jobs: new Map() };
async function runLighthouse(id, job) {
  lh.running = true;
  try {
    const v = current(); const r = {};
    for (const side of ['before', 'after']) r[side] = await lighthouseAudit({ env: v[side].env, host: info(v[side].env).host, pagePath: job.path, performance: job.perf });
    job.results = r; job.state = 'done';
  } catch (e) { job.state = 'error'; job.error = String(e.message).split('\n')[0].slice(0, 300); }
  lh.running = false;
  if (lh.pending) { const p = lh.pending; lh.pending = null; runLighthouse(p.id, p.job); }
}
const agent = new http.Agent({ keepAlive: true, maxSockets: 64 }); // reuse connections to the DDEV router
const infoCache = {};
// The real sites, for opening outside the viewer. Prefer a url set in variants.json; else the DDEV hostname.
function realSites() {
  const v = current(), out = {};
  for (const side of ['before', 'after']) {
    try { const hs = info(v[side].env).hosts; out[side] = v[side].url || `https://${hs.slice().sort((a, b) => a.length - b.length)[0]}`; } catch (e) { out[side] = v[side].url || ''; }
  }
  return out;
}
// `ddev describe` takes 1 to 3 seconds and runs synchronously, which would freeze every proxy while it ran,
// so look each environment up once, keep it for 5 minutes, and warm the cache at startup.
const info = (env) => { const c = infoCache[env]; if (c) { if (Date.now() - c.t > 300000 && !c.refreshing) { c.refreshing = true; envInfoAsync(env).then((v) => { infoCache[env] = { v, t: Date.now() }; }).catch(() => { c.refreshing = false; c.t = Date.now() - 240000; }); } return c.v; } const v = envInfo(env); infoCache[env] = { v, t: Date.now() }; return v; };

const SYNC = (side, st) => `<script>(()=>{if(window.parent===window)return;
const side=${JSON.stringify(side)};let S=${JSON.stringify({ theme: st.theme, darkos: st.darkos, axe: st.axe, axeBest: st.axeBest })};
const post=(m)=>parent.postMessage(Object.assign({compare:1,side},m),'*');let quiet=false;
const fake=(m,q)=>({matches:m,media:q,onchange:null,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){},dispatchEvent(){return false}});
const real=window.matchMedia.bind(window);
window.matchMedia=(q)=>{if(S.darkos&&/prefers-color-scheme:\\s*dark/.test(q))return fake(true,q);if(S.darkos&&/prefers-color-scheme:\\s*light/.test(q))return fake(false,q);return real(q)};
const orig=new WeakMap();
const sweep=(rules)=>{for(const r of rules){try{
 if(r.media&&/prefers-color-scheme/.test(orig.get(r)||r.media.mediaText)){if(!orig.has(r))orig.set(r,r.media.mediaText);
  r.media.mediaText=S.darkos?orig.get(r).replace(/\\(\\s*prefers-color-scheme:\\s*dark\\s*\\)/g,'all').replace(/\\(\\s*prefers-color-scheme:\\s*light\\s*\\)/g,'not all'):orig.get(r)}
 if(r.cssRules)sweep(r.cssRules)}catch(e){}}};
const applyOs=()=>{for(const sh of document.styleSheets){try{sweep(sh.cssRules)}catch(e){}}};
const applyTheme=()=>{const h=document.documentElement;const dark=S.theme==='dark'||(S.theme==='auto'&&(S.darkos||real('(prefers-color-scheme: dark)').matches));h.classList.toggle('dark-mode',dark)};
const applyAll=()=>{applyOs();applyTheme()};
applyTheme();
document.addEventListener('DOMContentLoaded',applyAll);addEventListener('load',()=>{applyAll();nav()});
new MutationObserver(applyOs).observe(document,{childList:true,subtree:true});
addEventListener('scroll',()=>{if(!quiet)post({type:'scroll',x:scrollX,y:scrollY})},{passive:true});
function nav(){post({type:'nav',path:location.pathname+location.search+location.hash})}
window.__cmpErrors=[];window.__cmpFocused=[];window.__cmpTrustedFragmentClick=false;
addEventListener('focusin',(e)=>{const t=e.target;if(t&&t.name)window.__cmpFocused.push(t.name)},true);
addEventListener('click',(e)=>{const a=e.target.closest&&e.target.closest('a[href*="#"]');if(a&&e.isTrusted){window.__cmpTrustedFragmentClick=true;post({type:'real-click'})}},true);
addEventListener('load',()=>post({type:'loaded'}));addEventListener('error',(e)=>window.__cmpErrors.push(String(e.message)));
addEventListener('hashchange',nav);addEventListener('popstate',nav);
// Mirror setup actions: only real (trusted) user events are captured, so the synthetic events
// we replay on the other side never loop. Keyboard focus and Tab/Enter are deliberately not mirrored.
const pathOf=(el)=>{if(el.id&&!/\\d{6,}/.test(el.id)&&document.querySelectorAll('#'+CSS.escape(el.id)).length===1)return '#'+CSS.escape(el.id);
 const parts=[];while(el&&el.nodeType===1&&el!==document.documentElement){const p=el.parentElement;if(!p)break;parts.unshift(el.tagName.toLowerCase()+':nth-child('+(Array.prototype.indexOf.call(p.children,el)+1)+')');el=p}return 'html>'+parts.join('>')};
const find=(p)=>{try{return document.querySelector(p)}catch(e){return null}};
const send=(kind,el,extra)=>post(Object.assign({type:'mirror',kind,path:pathOf(el),label:(el.getAttribute&&(el.getAttribute('aria-label')||el.textContent||el.name||el.id)||'').trim().slice(0,40)},extra));
document.addEventListener('click',(e)=>{if(!e.isTrusted)return;const el=e.target.closest('a,button,summary,input,select,label,[role=button]')||e.target;if(el.tagName==='INPUT'&&/text|email|password|search|url|number|tel/.test(el.type||'text'))return;if(el.tagName==='SELECT'||el.tagName==='LABEL')return;send('click',el,{})},true);
document.addEventListener('input',(e)=>{if(!e.isTrusted)return;const el=e.target;if(el.type==='checkbox'||el.type==='radio'||el.tagName==='SELECT')return;if('value' in el)send('value',el,{value:el.value})},true);
document.addEventListener('change',(e)=>{if(!e.isTrusted)return;const el=e.target;if(el.tagName==='SELECT')send('value',el,{value:el.value});else if(el.type==='checkbox'||el.type==='radio')send('checked',el,{checked:el.checked})},true);
const apply=(d)=>{const el=find(d.path);if(!el){post({type:'mirror-miss',kind:d.kind,label:d.label});return}
 if(d.kind==='click'){el.click()}
 else if(d.kind==='value'){const proto=el.tagName==='SELECT'?HTMLSelectElement.prototype:el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
  const set=Object.getOwnPropertyDescriptor(proto,'value').set;set.call(el,d.value);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}
 else if(d.kind==='checked'){if(el.checked!==d.checked)el.click()}};
// Live accessibility checks: run axe-core after load and, debounced, after interaction. Results go to the parent.
let axeBusy=false,axeQueued=false,axeTimer;
const loadAxe=()=>new Promise((res)=>{if(window.axe)return res();const sc=document.createElement('script');sc.src='/__compare/axe.js';sc.onload=()=>res();sc.onerror=()=>res();document.head.appendChild(sc)});
const schedule=()=>{if(!S.axe)return;clearTimeout(axeTimer);axeTimer=setTimeout(runAxe,900)};
async function runAxe(){if(!S.axe)return;if(axeBusy){axeQueued=true;return}axeBusy=true;await loadAxe();
 if(!window.axe){post({type:'axe-unavailable'});axeBusy=false;return}
 try{const tags=['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa'].concat(S.axeBest?['best-practice']:[]);
  const r=await window.axe.run(document,{runOnly:{type:'tag',values:tags},resultTypes:['violations']});
  post({type:'axe',url:location.pathname+location.search+location.hash,violations:r.violations.map((v)=>({id:v.id,impact:v.impact,help:v.help,helpUrl:v.helpUrl,nodes:v.nodes.map((n)=>({target:(n.target||[]).join(' '),html:(n.html||'').slice(0,140)}))}))})}
 catch(err){post({type:'axe-error',message:String(err&&err.message)})}
 axeBusy=false;if(axeQueued){axeQueued=false;schedule()}}
addEventListener('load',schedule);
['click','focusin','keyup','hashchange','transitionend','animationend'].forEach((t)=>addEventListener(t,schedule,true));
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','open','hidden','aria-expanded','aria-hidden','data-meta-sidebar','disabled','role']});
addEventListener('message',(e)=>{const d=e.data;if(!d||!d.compare)return;
 if(d.type==='mirror')apply(d);
 if(d.type==='clear-storage'){try{localStorage.clear();sessionStorage.clear()}catch(err){}location.reload()}
 if(d.type==='probe'){let value;try{value=(new Function('return ('+d.code+')'))()}catch(err){value='ERROR: '+err.message}post({type:'probe-result',id:d.id,value:(typeof value==='object'?JSON.stringify(value):value)})}
 if(d.type==='scroll'){quiet=true;scrollTo(d.x,d.y);setTimeout(()=>{quiet=false},80)}
 if(d.type==='state'){S=Object.assign(S,d.state);applyAll();schedule()}
 if(d.type==='axe-now')runAxe()});
})();</script>`;

function proxyFor(side) {
  const mine = SIDES[side].host, origin = SIDES[side].origin;
  return http.createServer((req, res) => {
    if (req.url === '/__compare/axe.js') {
      try { res.writeHead(200, { 'content-type': 'text/javascript', 'cache-control': 'no-store' }); res.end(fs.readFileSync(AXE)); } catch (e) { res.writeHead(404); res.end('axe-core is not installed: run npm install --prefix tools/compare/.deps axe-core@4'); }
      return;
    }
    const env = current()[side].env;
    const { hosts, host, routerPort } = info(env);
    const swap = (t) => hosts.reduce((a, h) => a.split(`https://${h}`).join(origin).split(`http://${h}`).join(origin).split(h).join(mine), t);
    const headers = { ...req.headers, host, 'accept-encoding': 'identity' };
    delete headers.origin; delete headers.referer;
    const started = Date.now();
    const logSlow = (what) => { const ms = Date.now() - started; if (ms > 3000 || what) console.log(`${new Date().toISOString()} ${side} ${req.method} ${req.url.slice(0, 80)} ${what || 'slow'} ${ms}ms`); };
    const up = http.request({ host: '127.0.0.1', port: routerPort, path: req.url, method: req.method, headers, agent }, (r) => {
      const h = { ...r.headers };
      delete h['x-frame-options']; delete h['content-security-policy']; delete h['content-length'];
      delete h.etag; delete h['last-modified']; h['cache-control'] = 'no-store';
      if (h.location) h.location = swap(h.location);
      if (h['set-cookie']) h['set-cookie'] = h['set-cookie'].map((c) => c.replace(/;\s*domain=[^;]*/i, '').replace(/;\s*samesite=[^;]*/i, '').replace(/;\s*secure/i, '') + '; SameSite=None; Secure');
      const type = h['content-type'] || '';
      if (!/text|json|javascript|xml/.test(type)) { res.writeHead(r.statusCode, h); r.pipe(res); r.on('end', () => logSlow('')); return; }
      const chunks = [];
      r.on('data', (c) => chunks.push(c));
      r.on('end', () => {
        let body = swap(Buffer.concat(chunks).toString('utf8'));
        if (/text\/html/.test(type)) body = body.replace(/<head([^>]*)>/i, (m) => m + SYNC(side, state));
        res.writeHead(r.statusCode, h); res.end(body); logSlow('');
      });
    });
    up.setTimeout(30000, () => up.destroy(new Error('no response from the site within 30 seconds')));
    up.on('error', (e) => { logSlow('ERROR ' + e.message); if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain' }); res.end(`${env} is not reachable: ${e.message}. Is its DDEV project running? Reload the frame.`); });
    req.pipe(up);
  });
}

for (const x of list) for (const side of ['before', 'after']) { try { info(x[side].env); } catch (e) { console.log(`could not look up ${x[side].env} yet (${String(e.message).split('\n')[0]}); will retry on first use`); } }
for (const side of Object.keys(SIDES)) { const srv = proxyFor(side); srv.keepAliveTimeout = 65000; srv.headersTimeout = 66000; srv.listen(SIDES[side].port, '127.0.0.1'); }

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/variants.json') {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    res.end(JSON.stringify({ variants: list, state, origins: { before: SIDES.before.origin, after: SIDES.after.origin }, sites: realSites() }));
  } else if (u.pathname === '/api/state') {
    if (req.method === 'POST') { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => { try { Object.assign(state, JSON.parse(b)); } catch (e) { /* ignore */ } res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(state)); }); }
    else { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(state)); }
  } else if (u.pathname === '/api/health') {
    const v = current();
    const probe = (side) => new Promise((resolve) => {
      let site;
      try { site = info(v[side].env); } catch (e) { return resolve({ ok: false, text: `DDEV could not describe ${v[side].env}: ${String(e.message).split('\n')[0].slice(0, 120)}` }); }
      const t = Date.now();
      const rq = http.request({ host: '127.0.0.1', port: site.routerPort, path: '/user/login', method: 'HEAD', headers: { host: site.host }, timeout: 6000, agent }, (r) => { r.resume(); resolve({ ok: r.statusCode < 500, text: `${v[side].env} answered ${r.statusCode} in ${Date.now() - t} ms` }); });
      rq.on('timeout', () => { rq.destroy(); resolve({ ok: false, text: `${v[side].env} did not answer within 6 seconds (is its DDEV project running? try ddev restart)` }); });
      rq.on('error', (e) => resolve({ ok: false, text: `${v[side].env} unreachable: ${e.message}` }));
      rq.end();
    });
    Promise.all([probe('before'), probe('after')]).then(([before, after]) => { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ before, after })); });
  } else if (u.pathname === '/api/lighthouse/status') {
    res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ ...lighthouseAvailable(), running: lh.running }));
  } else if (u.pathname === '/api/lighthouse/run' && req.method === 'POST') {
    const id = ++lh.seq; const job = { state: 'running', path: u.searchParams.get('path') || '/', perf: u.searchParams.get('perf') === '1' };
    lh.jobs.set(id, job); if (lh.jobs.size > 20) lh.jobs.delete(lh.jobs.keys().next().value);
    if (lh.running) { lh.pending = { id, job }; } else runLighthouse(id, job);
    res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ id, queued: lh.running && lh.pending && lh.pending.id === id }));
  } else if (u.pathname === '/api/lighthouse/result') {
    const job = lh.jobs.get(Number(u.searchParams.get('id'))) || { state: 'error', error: 'unknown job' };
    res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(job));
  } else if (u.pathname === '/api/cache') {
    const v = current();
    const run = (env) => new Promise((resolve) => execFile('ddev', ['drupal', 'cache'], { cwd: envDir(env), timeout: 120000 }, (err, so, se) => resolve(err ? `failed: ${String(se || err.message).trim().slice(0, 200)}` : 'cleared')));
    Promise.all([run(v.before.env), run(v.after.env)]).then(([before, after]) => { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ before, after })); });
  } else if (u.pathname === '/api/login') {
    const v = current();
    Promise.all(['before', 'after'].map((side) => loginPathAsync(v[side].env).then((p) => [side, `${SIDES[side].origin}${p}`])))
      .then((pairs) => { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(Object.fromEntries(pairs))); })
      .catch((e) => { res.writeHead(500); res.end(String(e.message)); });
  } else {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    const file = path.join(labRoot, 'tools/compare/index.html');
    res.end(fs.readFileSync(file, 'utf8').replace('__BUILD__', fs.statSync(file).mtime.toISOString()));
  }
}).listen(PAGE, '127.0.0.1', () => console.log(`compare: ${DDEV ? 'https://drupal-compare.ddev.site/  (via the drupal-compare DDEV project; also' : ''} http://localhost:${PAGE}/   (default variant ${state.slug}${DDEV ? ', DDEV hostnames' : ''})`));
