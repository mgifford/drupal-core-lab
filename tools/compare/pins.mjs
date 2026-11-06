// Pure helpers for scripts/check-pins.mjs: read the pins out of the add-on's Dockerfile.chromium (third-party text, treated as data).
const SOURCE = /^deb http:\/\/snapshot\.debian\.org\/archive\/[a-z-]+\/\d{8}T\d{6}Z\/ [a-z-]+ main$/;
const PACKAGE = /^[a-z0-9][a-z0-9+.-]*(=[A-Za-z0-9.+~:-]+)?$/;

// { sources: ['deb http://snapshot.debian.org/... bookworm main', ...], packages: ['chromium=143...', 'libdav1d6', ...] }
export function parseChromiumDockerfile(text) {
  const t = String(text || '');
  const sources = [...t.matchAll(/echo "(deb [^"]+)"/g)].map((m) => m[1]).filter((s) => SOURCE.test(s));
  const start = t.search(/apt-get install[^\n]*\n?(?:[^\n]*\n)*?[^\n]*chromium=/);
  const block = start < 0 ? '' : t.slice(start).split('&&')[0];
  const packages = block.replace(/#[^\n]*/g, '').replace('apt-get install', '').split(/\s+/)
    .filter((w) => w && !w.startsWith('-') && w !== '\\' && PACKAGE.test(w));
  if (!sources.length || !packages.some((p) => p.startsWith('chromium='))) throw new Error('Dockerfile.chromium has no snapshot source or no pinned chromium: the add-on changed shape; read it before trusting this check');
  return { sources, packages };
}

// Highest vX.Y.Z of a list of tag names.
export function latestTag(tags) {
  const num = (s) => s.slice(1).split('.').map(Number);
  return tags.filter((x) => /^v\d+\.\d+\.\d+$/.test(x)).sort((a, b) => { const [p, q] = [num(a), num(b)]; for (let i = 0; i < 3; i++) if (p[i] !== q[i]) return p[i] - q[i]; return 0; }).pop() || null;
}
