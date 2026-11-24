// Byte parsing shared by resource adapters. Same notation as scripts/measure-resources.mjs (kB decimal, KiB binary).
// This is intentionally tiny: it does not parse or reinterpret a measurement, only the unit string Docker/tools print.
export function parseBytes(text) {
  const match = String(text || '').trim().match(/^([\d.]+)\s*([kmgt]?i?b)$/i);
  if (!match) return null;
  const powers = { b: 0, kb: 1, kib: 1, mb: 2, mib: 2, gb: 3, gib: 3, tb: 4, tib: 4 };
  const binary = /iB$/i.test(match[2]);
  return Number(match[1]) * (binary ? 1024 : 1000) ** powers[match[2].toLowerCase()];
}

// "12.3MiB / 1GiB" or "1kB / 2kB" -> [first, second].
export function parsePair(text) {
  if (!text) return null;
  const parts = String(text).split('/').map((x) => parseBytes(x));
  return parts.length >= 2 && parts[0] != null && parts[1] != null ? [parts[0], parts[1]] : null;
}

export function formatBytes(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(1)} GiB`;
  if (n >= 1024 ** 2) return `${(n / 1024 ** 2).toFixed(1)} MiB`;
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KiB`;
  return `${n} B`;
}
