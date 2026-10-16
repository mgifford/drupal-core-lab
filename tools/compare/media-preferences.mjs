// Validated CSS user-preference overrides for the controlled Chromium tab.
// null removes an override and returns that feature to the browser/OS default.
export const FEATURES = {
  colorScheme: { query: 'prefers-color-scheme', values: ['light', 'dark'] },
  forcedColors: { query: 'forced-colors', values: ['none', 'active'] },
  contrast: { query: 'prefers-contrast', values: ['no-preference', 'more', 'less', 'custom'] },
  reducedMotion: { query: 'prefers-reduced-motion', values: ['no-preference', 'reduce'] },
  reducedTransparency: { query: 'prefers-reduced-transparency', values: ['no-preference', 'reduce'] },
  reducedData: { query: 'prefers-reduced-data', values: ['no-preference', 'reduce'] },
  invertedColors: { query: 'inverted-colors', values: ['none', 'inverted'] },
};
export const defaults = () => Object.fromEntries(Object.keys(FEATURES).map(key => [key, null]));
export function mergePreferences(current, patch, supported = {}) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new Error('preferences must be an object');
  const next = { ...current };
  for (const [key, value] of Object.entries(patch)) {
    if (!Object.hasOwn(FEATURES, key)) throw new Error(`Unknown media preference: ${key}`);
    if (value !== null && !FEATURES[key].values.includes(value)) throw new Error(`Invalid ${key} value`);
    if (value !== null && supported[key] === false) throw new Error(`${FEATURES[key].query} is not supported by this browser`);
    next[key] = value;
  }
  return next;
}
export const mediaFeatures = preferences => Object.entries(preferences).filter(([,value]) => value !== null).map(([key, value]) => ({ name: FEATURES[key].query, value }));
// Run in a real browser/frame. An unknown feature matches none of its legal values.
export function observePreferences(features) {
  return Object.fromEntries(Object.entries(features).map(([key, feature]) => {
    const matches = feature.values.filter(value => matchMedia(`(${feature.query}: ${value})`).matches);
    return [key, { supported: matches.length > 0, value: matches[0] ?? null }];
  }));
}
// Keep state only after Chromium accepts the whole request. Callers serialize updates.
export async function applyPreferences(session, current, patch, supported) {
  const next = mergePreferences(current, patch, supported);
  await session.send('Emulation.setEmulatedMedia', { features: mediaFeatures(next) });
  return next;
}

// Apply the same override to both isolated comparison targets, never the viewer.
// Wait for both responses before rollback so a slower success cannot undo rollback.
export async function applyFramePreferences(targets, current, patch, supported) {
  if (targets.length !== 2) throw new Error('Both comparison frames must be ready before changing preferences');
  const next = mergePreferences(current, patch, supported);
  const results = await Promise.allSettled(targets.map(target => target.send('Emulation.setEmulatedMedia', { features: mediaFeatures(next) })));
  const failed = results.find(result => result.status === 'rejected');
  if (failed) {
    const rollback = await Promise.allSettled(targets.map(target => target.send('Emulation.setEmulatedMedia', { features: mediaFeatures(current) })));
    const uncertain = rollback.some(result => result.status === 'rejected');
    throw new Error(`Could not update both comparison frames: ${failed.reason.message || failed.reason}${uncertain ? '. A frame disconnected; reload it before retrying' : '. Previous preferences restored'}`);
  }
  return next;
}
