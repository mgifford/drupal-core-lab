// Does a variant's After side hold a change to test? (AI-usage Phase 5)
// After is "the same core plus the change", so a variant that lists no patch and no contrib patch builds an After that equals Before:
// every check then reports "no difference" and nothing says why. This names that state. The one legitimate case is a patch being
// written in the After environment itself (no merge request yet): the variant says so with `after.authoring: true`, and
// scripts/capture-patch.mjs turns the edits into a patch file and lists it.
export function changeUnderTest(v) {
  const a = (v && v.after) || {};
  const patches = (a.patches || []).length, contrib = (a.contribPatches || []).length;
  return { patches, contrib, authoring: a.authoring === true, empty: patches + contrib === 0 };
}

// null when fine, else one sentence for selftest, setup and a run to show.
export function noChangeProblem(v) {
  const c = changeUnderTest(v);
  if (!c.empty || c.authoring) return null;
  return `${v.slug}: after lists no patch and no contrib patch, so After would equal Before. List the patch, or set "authoring": true in "after" while a patch is being written (then scripts/capture-patch.mjs ${v.slug} turns the edits into a patch file)`;
}
