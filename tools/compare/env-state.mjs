// Environment identity (AI-usage slice D): do the two environments of a variant stand on the state the variant asks for?
// Observed against requested, nothing stored: the base commit of each checkout, the commit a pinned variant pins, and the recipe
// that was applied to each site (the copy lab-site.sh puts in <env>/recipes/<name>) against recipes/<name> now. A mismatch means
// a comparison, or a result from one of the sites, is about something other than what the variant says. Patches are in patch-state.mjs.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

// Hash of a folder: every file's relative name and bytes, in name order. null if the folder does not exist.
export function dirHash(dir) {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return null;
  const h = crypto.createHash('sha256');
  const walk = (d, rel) => { for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, `${rel}${e.name}/`); else h.update(`${rel}${e.name}\0`).update(fs.readFileSync(p)); } };
  walk(dir, ''); return h.digest('hex');
}
export const headOf = (dir) => (fs.existsSync(dir) ? spawnSync('git', ['-C', dir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim() : '');
const short = (s) => (s ? s.slice(0, 12) : 'none');

// The recipe a site holds against the recipe the variant names. 'same', 'differs', 'never-applied' (no copy in the environment) or 'none' (no recipe asked for).
export function recipeStatus(envDir, labRoot, recipe) {
  if (!recipe) return { status: 'none' };
  const now = dirHash(path.join(labRoot, 'recipes', recipe)), applied = dirHash(path.join(envDir, 'recipes', recipe));
  return { status: now === null ? 'missing-in-lab' : applied === null ? 'never-applied' : applied === now ? 'same' : 'differs', current: now, applied };
}

// checks: any of 'base', 'pin', 'recipe'. Read-only. An environment that does not exist is skipped (nothing to compare).
export function identity(v, { labRoot, envDir, checks = ['base', 'pin', 'recipe'] }) {
  const sides = {}, problems = [];
  for (const s of ['before', 'after']) { const spec = v[s], dir = envDir(spec.env); sides[s] = { env: spec.env, exists: fs.existsSync(dir), head: headOf(dir), recipe: recipeStatus(dir, labRoot, v.recipe) }; }
  const b = sides.before, a = sides.after, pin = v.core && v.core.commit ? String(v.core.commit) : '';
  if (checks.includes('base') && b.head && a.head && b.head !== a.head) problems.push({ kind: 'base', text: `Before (${b.env}) is at ${short(b.head)} and After (${a.env}) is at ${short(a.head)}: the comparison would include every upstream change between them` });
  if (checks.includes('pin') && pin) for (const x of [b, a]) if (x.head && !(x.head.startsWith(pin) || pin.startsWith(x.head))) problems.push({ kind: 'pin', text: `${x.env} is at ${short(x.head)} but the variant pins ${short(pin)}` });
  if (checks.includes('recipe') && v.recipe) {
    for (const x of [b, a]) {
      if (!x.exists) continue;
      if (x.recipe.status === 'differs') problems.push({ kind: 'recipe', text: `the recipe applied to ${x.env} (${short(x.recipe.applied)}) is not recipes/${v.recipe} as it is now (${short(x.recipe.current)})` });
      else if (x.recipe.status === 'never-applied') problems.push({ kind: 'recipe', text: `recipes/${v.recipe} was never applied to ${x.env} (no copy in the environment)` });
      else if (x.recipe.status === 'missing-in-lab') problems.push({ kind: 'recipe', text: `the variant names recipes/${v.recipe}, which does not exist` });
    }
  }
  return { slug: v.slug, pin: pin || null, recipe: v.recipe || null, sides, problems };
}

// The message for a run or a setup that must stop, with the exact fix for each kind of problem.
export function blockMessage(id) {
  if (!id.problems.length) return '';
  const kinds = new Set(id.problems.map((p) => p.kind)), fix = [];
  if (kinds.has('base') || kinds.has('pin')) fix.push(`Rebuild both environments at one base: node scripts/lab-env.mjs delete ${id.slug} --yes, then node tools/compare/setup.mjs ${id.slug}`);
  if (kinds.has('recipe')) fix.push(`Reset the sites to the current recipe (reinstalls both, applies the recipe; the checkouts and patches stay): node scripts/lab-env.mjs reset ${id.slug} --yes`);
  return [`BLOCKED: the environments of ${id.slug} are not in the state the variant asks for, so a result from them would be about something else.`, ...id.problems.map((p) => `  - ${p.text}`), ...fix.map((f) => `  ${f}`)].join('\n');
}

// What a run records: requested and observed, per side.
export function identityRecord(id) {
  return { pin: id.pin, recipe: id.recipe ? { name: id.recipe, current: id.sides.before.recipe.current ?? id.sides.after.recipe.current ?? null, before: id.sides.before.recipe.applied ?? null, after: id.sides.after.recipe.applied ?? null } : null, base: { before: id.sides.before.head || null, after: id.sides.after.head || null }, problems: id.problems.map((p) => p.text) };
}
