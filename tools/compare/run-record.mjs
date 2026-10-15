// Is a recorded run still about what the variant says now? (AI-usage slice F)
// A run's results.json records what it used: the patch hashes of each side (patchState, since slice A), the pinned commit and the recipe
// hash (identity, since slice D), the contrib patch hashes (since slice E); older runs record patch file NAMES, and some a contrib pin.
// This compares what a run recorded with the variant, its patch files and its recipe as they are now. Three answers, never blurred:
//   stale       something the run recorded differs now (the reasons say what): the run is evidence about an older state
//   current     the run recorded the patch hashes and every recorded value still equals what is there now
//   unrecorded  the run recorded no hashes, so nothing can be said about it either way (it is not "current")
// For an unrecorded run, a hint is added when git shows a patch file was committed after the run: a fact about the history, not a verdict.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { sha256 } from './patch-state.mjs';
import { dirHash } from './env-state.mjs';

const h8 = (s) => String(s || '').slice(0, 8);
const fileHash = (labRoot, p) => { try { return sha256(fs.readFileSync(path.join(labRoot, p))); } catch { return null; } };
export const lastCommitDate = (labRoot) => (p) => { const r = spawnSync('git', ['log', '-1', '--format=%cI', '--', p], { cwd: labRoot, encoding: 'utf8' }); return r.status === 0 ? r.stdout.trim() : ''; };

// results: a parsed results.json. variant: the variant now (or undefined). Returns { status, reasons, checked, notes, hints }.
export function runStaleness(results, variant, { labRoot, lastChange = lastCommitDate(labRoot) }) {
  const reasons = [], checked = [], notes = [], hints = [];
  if (!variant) return { status: 'unrecorded', reasons, checked, notes: [`the variant ${results.variant || '(none)'} is not in this checkout, so the run cannot be compared`], hints };
  const ps = results.patchState, id = results.identity;
  const diffLists = (what, ran, now) => {
    const ranMap = new Map((ran || []).map((x) => [x.path, x.sha256])), nowList = now.map((x) => ({ path: x.path, sha256: x.sha256 }));
    for (const n of nowList) { if (!ranMap.has(n.path)) reasons.push(`${what} ${n.path} is used now and was not used by the run`); else if (ranMap.get(n.path) !== n.sha256) reasons.push(`${what} ${n.path} changed since the run (run ${h8(ranMap.get(n.path))}, now ${h8(n.sha256)})`); }
    for (const r of ran || []) if (!nowList.some((n) => n.path === r.path)) reasons.push(`${what} ${r.path} was used by the run and the variant no longer lists it`);
  };
  if (ps) {
    for (const side of ['before', 'after']) {
      const rec = ps[side]; if (!rec) { notes.push(`${side} patches not recorded`); continue; }
      const now = (variant[side] && variant[side].patches || []).map((p) => ({ path: p, sha256: fileHash(labRoot, p) }));
      if (now.some((x) => !x.sha256)) { notes.push(`a ${side} patch file is missing now`); continue; }
      diffLists(`${side} patch`, rec.current, now); checked.push(`${side} patches`);
      const cps = (variant[side] && variant[side].contribPatches) || [];
      if (rec.contrib) {
        for (const m of new Set([...Object.keys(rec.contrib), ...cps.map((c) => c.module)])) {
          const nowC = cps.filter((c) => c.module === m).map((c) => ({ path: c.patch, sha256: fileHash(labRoot, c.patch) }));
          if (nowC.some((x) => !x.sha256)) { notes.push(`a ${side} contrib patch file is missing now`); continue; }
          diffLists(`${side} contrib patch (${m})`, rec.contrib[m] ? rec.contrib[m].patches : [], nowC);
        }
        checked.push(`${side} contrib patches`);
      } else if (cps.length) notes.push(`${side} contrib patches not recorded`);
    }
  }
  if (id) {
    const pin = variant.core && variant.core.commit ? String(variant.core.commit) : null;
    if (id.pin && pin && !(id.pin.startsWith(pin) || pin.startsWith(id.pin))) reasons.push(`the variant pins ${h8(pin)} now, the run was on ${h8(id.pin)}`); else if (id.pin || pin) checked.push('pinned commit');
    if (variant.recipe && id.recipe) { const now = dirHash(path.join(labRoot, 'recipes', variant.recipe)); if (id.recipe.name !== variant.recipe) reasons.push(`the variant uses recipe ${variant.recipe} now, the run used ${id.recipe.name}`); else if (now !== id.recipe.current) reasons.push(`recipes/${variant.recipe} changed since the run (run ${h8(id.recipe.current)}, now ${h8(now)})`); else checked.push('recipe'); }
    else if (variant.recipe) notes.push('recipe not recorded');
  } else {
    if (variant.recipe) notes.push('recipe not recorded');
    // the older evaluators recorded the core pin and the contrib pins directly
    if (results.core && results.core.commit && variant.core && variant.core.commit && !(String(results.core.commit).startsWith(String(variant.core.commit)) || String(variant.core.commit).startsWith(String(results.core.commit)))) reasons.push(`the variant pins ${h8(variant.core.commit)} now, the run was on ${h8(results.core.commit)}`);
  }
  for (const rc of results.contrib || []) { const nowM = (variant.contrib || []).find((m) => m.name === rc.name); if (!nowM) reasons.push(`contrib module ${rc.name} was used by the run and the variant no longer lists it`); else if (nowM.commit !== rc.commit) reasons.push(`contrib module ${rc.name} is pinned at ${h8(nowM.commit)} now, the run used ${h8(rc.commit)}`); else checked.push(`contrib ${rc.name} pin`); }
  const status = reasons.length ? 'stale' : ps ? 'current' : 'unrecorded';
  if (status === 'unrecorded') {
    const names = [...new Set([...(variant.before && variant.before.patches || []), ...(variant.after && variant.after.patches || []), ...((variant.after && variant.after.contribPatches) || []).map((c) => c.patch)])];
    for (const p of names) { const when = lastChange(p); if (when && results.when && new Date(when) > new Date(results.when)) hints.push(`${p} was committed ${when.slice(0, 10)}, after this run (${String(results.when).slice(0, 10)})`); }
  }
  return { status, reasons, checked: [...new Set(checked)], notes, hints };
}
