// Side-by-side server for two DDEV environments.
//   node tools/compare/serve.mjs            (page on :8100, before :8101, after :8102)
// Each site is reached through a small proxy on its own *.localhost hostname so the two
// sessions never share cookies, framing works, and a sync script can be injected.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { labRoot, variants, envInfo, loginPath, envDir } from './lib.mjs';

const PAGE = Number(process.env.PORT || 8100);
const SIDES = {
  before: { port: PAGE + 1, name: 'before.localhost' },
  after: { port: PAGE + 2, name: 'after.localhost' },
};
const list = variants();
const state = { slug: process.argv[2] || list[0].slug, theme: 'auto', darkos: false };
const current = () => list.find((x) => x.slug === state.slug) || list[0];
const infoCache = {};
const info = (env) => (infoCache[env] ||= envInfo(env));

const SYNC = (side, st) => `<script>(()=>{if(window.parent===window)return;
const side=${JSON.stringify(side)};let S=${JSON.stringify({ theme: st.theme, darkos: st.darkos })};
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
window.__cmpErrors=[];addEventListener('error',(e)=>window.__cmpErrors.push(String(e.message)));
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
addEventListener('message',(e)=>{const d=e.data;if(!d||!d.compare)return;
 if(d.type==='mirror')apply(d);
 if(d.type==='clear-storage'){try{localStorage.clear();sessionStorage.clear()}catch(err){}location.reload()}
 if(d.type==='probe'){let value;try{value=(new Function('return ('+d.code+')'))()}catch(err){value='ERROR: '+err.message}post({type:'probe-result',id:d.id,value:(typeof value==='object'?JSON.stringify(value):value)})}
 if(d.type==='scroll'){quiet=true;scrollTo(d.x,d.y);setTimeout(()=>{quiet=false},80)}
 if(d.type==='state'){S=Object.assign(S,d.state);applyAll()}});
})();</script>`;

function proxyFor(side) {
  const mine = `${SIDES[side].name}:${SIDES[side].port}`;
  return http.createServer((req, res) => {
    const env = current()[side].env;
    const { hosts, host, routerPort } = info(env);
    const swap = (t) => hosts.reduce((a, h) => a.split(`https://${h}`).join(`http://${mine}`).split(`http://${h}`).join(`http://${mine}`).split(h).join(mine), t);
    const headers = { ...req.headers, host, 'accept-encoding': 'identity' };
    delete headers.origin; delete headers.referer;
    const up = http.request({ host: '127.0.0.1', port: routerPort, path: req.url, method: req.method, headers }, (r) => {
      const h = { ...r.headers };
      delete h['x-frame-options']; delete h['content-security-policy']; delete h['content-length'];
      delete h.etag; delete h['last-modified']; h['cache-control'] = 'no-store';
      if (h.location) h.location = swap(h.location);
      if (h['set-cookie']) h['set-cookie'] = h['set-cookie'].map((c) => c.replace(/;\s*domain=[^;]*/i, '').replace(/;\s*samesite=[^;]*/i, '').replace(/;\s*secure/i, '') + '; SameSite=None; Secure');
      const type = h['content-type'] || '';
      if (!/text|json|javascript|xml/.test(type)) { res.writeHead(r.statusCode, h); r.pipe(res); return; }
      const chunks = [];
      r.on('data', (c) => chunks.push(c));
      r.on('end', () => {
        let body = swap(Buffer.concat(chunks).toString('utf8'));
        if (/text\/html/.test(type)) body = body.replace(/<head([^>]*)>/i, (m) => m + SYNC(side, state));
        res.writeHead(r.statusCode, h); res.end(body);
      });
    });
    up.on('error', (e) => { res.writeHead(502); res.end(`${env} is not reachable: ${e.message}. Is its DDEV project running?`); });
    req.pipe(up);
  });
}

for (const side of Object.keys(SIDES)) proxyFor(side).listen(SIDES[side].port, '127.0.0.1');

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/variants.json') {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    res.end(JSON.stringify({ variants: list, state, origins: { before: `http://${SIDES.before.name}:${SIDES.before.port}`, after: `http://${SIDES.after.name}:${SIDES.after.port}` } }));
  } else if (u.pathname === '/api/state') {
    if (req.method === 'POST') { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => { try { Object.assign(state, JSON.parse(b)); } catch (e) { /* ignore */ } res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(state)); }); }
    else { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(state)); }
  } else if (u.pathname === '/api/cache') {
    const v = current();
    const run = (env) => new Promise((resolve) => execFile('ddev', ['drupal', 'cache'], { cwd: envDir(env), timeout: 120000 }, (err, so, se) => resolve(err ? `failed: ${String(se || err.message).trim().slice(0, 200)}` : 'cleared')));
    Promise.all([run(v.before.env), run(v.after.env)]).then(([before, after]) => { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ before, after })); });
  } else if (u.pathname === '/api/login') {
    const v = current();
    try {
      const out = {};
      for (const side of Object.keys(SIDES)) out[side] = `http://${SIDES[side].name}:${SIDES[side].port}${loginPath(v[side].env)}`;
      res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(out));
    } catch (e) { res.writeHead(500); res.end(String(e.message)); }
  } else {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    res.end(fs.readFileSync(path.join(labRoot, 'tools/compare/index.html')));
  }
}).listen(PAGE, '127.0.0.1', () => console.log(`compare: http://localhost:${PAGE}/   (default variant ${state.slug})`));
