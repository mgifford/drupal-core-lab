// Bounded, read-only artifact inspection for prompt provenance. It never extracts an archive, executes content, follows
// a symlink or trusts instructions inside a file. A reference is not evidence that a model read the artifact: the result
// says whether the local file existed and whether *this* inspector opened it, not whether the provider received it.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { artifactKind } from './prompts.mjs';

export const ARTIFACT_LIMITS = Object.freeze({
  maxFileBytes: 8 * 1024 * 1024,
  maxZipEntries: 2000,
  maxZipCentralDirectoryBytes: 32 * 1024 * 1024,
  maxPatchBytes: 2 * 1024 * 1024,
  maxListedEntries: 40,
});

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const ext = (name) => (String(name).match(/\.([A-Za-z0-9]{1,10})$/)?.[1] || '').toLowerCase();

// Minimal ZIP central-directory reader (no decompression). Handles the ordinary 32-bit archive; ZIP64 is reported as
// unsupported rather than guessed.
export function inspectZipBuffer(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 22) return { inspected: false, reason: 'too_small' };
  let eocd = -1;
  const stop = Math.max(0, buf.length - 65557);
  for (let i = buf.length - 22; i >= stop; i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) return { inspected: false, reason: 'no_end_of_central_directory' };
  const entries = buf.readUInt16LE(eocd + 10);
  const cdSize = buf.readUInt32LE(eocd + 12);
  const cdOffset = buf.readUInt32LE(eocd + 16);
  if (entries === 0xffff || cdSize === 0xffffffff || cdOffset === 0xffffffff) return { inspected: false, reason: 'zip64_unsupported' };
  if (cdOffset + cdSize > buf.length) return { inspected: false, reason: 'central_directory_out_of_bounds' };
  if (cdSize > ARTIFACT_LIMITS.maxZipCentralDirectoryBytes) return { inspected: false, reason: 'central_directory_too_large' };
  let p = cdOffset, count = 0, declared = 0, compressed = 0, dirs = 0, symlinks = 0, encrypted = 0, traversal = 0, absolute = 0, truncated = false;
  const types = {}; const examples = [];
  while (p + 46 <= cdOffset + cdSize && count < ARTIFACT_LIMITS.maxZipEntries) {
    if (buf.readUInt32LE(p) !== 0x02014b50) { truncated = true; break; }
    const flags = buf.readUInt16LE(p + 8);
    const uncompressed = buf.readUInt32LE(p + 24);
    const comp = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28), extraLen = buf.readUInt16LE(p + 30), commentLen = buf.readUInt16LE(p + 32);
    const external = buf.readUInt32LE(p + 38);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    if (flags & 1) encrypted++;
    if (name.endsWith('/')) dirs++; else { const t = ext(name) || 'none'; types[t] = (types[t] || 0) + 1; }
    const mode = (external >>> 16) & 0xffff;
    if ((mode & 0xf000) === 0xa000) symlinks++;
    if (/(?:^|\/)\.\.(?:\/|$)/.test(name) || name.includes('\\..\\')) traversal++;
    if (/^\/|^[A-Za-z]:/.test(name)) absolute++;
    declared += uncompressed; compressed += comp;
    if (examples.length < ARTIFACT_LIMITS.maxListedEntries && !name.endsWith('/')) examples.push({ name, bytes: uncompressed, type: ext(name) || 'none' });
    p += 46 + nameLen + extraLen + commentLen; count++;
  }
  if (count >= ARTIFACT_LIMITS.maxZipEntries) truncated = true;
  const names = examples.map((e) => e.name);
  return {
    inspected: true,
    entries_declared: entries,
    entries_read: count,
    directories: dirs,
    total_uncompressed_bytes: declared,
    total_compressed_bytes: compressed,
    compression_ratio: compressed ? Math.round((declared / compressed) * 100) / 100 : null,
    file_types: types,
    symlinks,
    encrypted_entries: encrypted,
    path_traversal_entries: traversal,
    absolute_path_entries: absolute,
    truncated,
    has_manifest: names.some((n) => /(?:^|\/)(?:composer\.json|package\.json|README\.md|\.info\.yml)$/i.test(n)),
    has_tests: names.some((n) => /(?:^|\/)(?:tests?)\/|Test\.php$/i.test(n)),
    has_docs: names.some((n) => /\.md$/i.test(n)),
    examples,
    extraction: 'none',
    limitations: ['Only the central directory was read; file contents were not extracted or executed.'],
  };
}

export function inspectPatchText(text) {
  const raw = String(text);
  const added = (raw.match(/^\+(?!\+\+)/gm) || []).length;
  const removed = (raw.match(/^-(?!--)/gm) || []).length;
  const files = [...new Set([...raw.matchAll(/^\+\+\+ b\/(.+)$/gm)].map((m) => m[1].trim()))];
  const binary = /^Binary files .* differ$/m.test(raw);
  return {
    inspected: true,
    files_changed: files.length || (raw.match(/^diff --git /gm) || []).length,
    added_lines: added,
    removed_lines: removed,
    file_types: Object.fromEntries([...new Set(files.map(ext).filter(Boolean))].sort().map((t) => [t, files.filter((f) => ext(f) === t).length])),
    includes_tests: files.some((f) => /(?:^|\/)tests?\//.test(f) || /Test\.php$/.test(f)),
    includes_documentation: files.some((f) => /\.md$/i.test(f) || /(?:^|\/)docs?\//.test(f)),
    includes_generated_css: files.some((f) => /\.css$/.test(f)),
    binary,
    applied: 'unknown',
    extraction: 'none',
  };
}

// Inspect a local artifact reference. Only files inside `baseDir` are read; symlinks are not followed. The returned
// `local_path` is for the caller's private record and must never enter a public export.
export function inspectArtifact(reference, { baseDir }) {
  const ref = String(reference || '');
  const kind = artifactKind(ref);
  const resolved = path.isAbsolute(ref) ? path.resolve(ref) : path.resolve(baseDir, ref);
  const rel = path.relative(path.resolve(baseDir), resolved);
  const inside = rel && !rel.startsWith('..') && !path.isAbsolute(rel);
  const metadata = { kind, extension: ext(ref) || null, available: false, inspected: false, bytes: null, fingerprint: null, ingestion: 'reference-only', reasons: [] };
  if (!inside) { metadata.reasons.push('outside the repository; not read'); return { metadata, local_path: resolved }; }
  let st;
  try { st = fs.lstatSync(resolved); } catch { metadata.reasons.push('file not found'); return { metadata, local_path: resolved }; }
  if (st.isSymbolicLink()) { metadata.reasons.push('symbolic link; not followed'); return { metadata, local_path: resolved }; }
  if (!st.isFile()) { metadata.reasons.push('not a regular file'); return { metadata, local_path: resolved }; }
  metadata.available = true; metadata.bytes = st.size;
  if (st.size > ARTIFACT_LIMITS.maxFileBytes) { metadata.reasons.push('larger than the inspection cap; metadata only'); return { metadata, local_path: resolved }; }
  let buf;
  try { buf = fs.readFileSync(resolved); } catch { metadata.reasons.push('could not be read'); return { metadata, local_path: resolved }; }
  metadata.fingerprint = sha256(buf);
  if (kind === 'archive' && st.size <= 64 * 1024 * 1024) { metadata.zip = inspectZipBuffer(buf); metadata.inspected = metadata.zip.inspected; }
  if ((kind === 'patch' || kind === 'diff') && st.size <= ARTIFACT_LIMITS.maxPatchBytes) { metadata.patch = inspectPatchText(buf.toString('utf8')); metadata.inspected = true; }
  return { metadata, local_path: resolved };
}

// Aggregate prompt metadata. Returns only counts and distributions; fingerprints stay in the local record.
export function provenanceSummary(prompts = []) {
  const types = {}, purposes = {}, sizes = {}, artifacts = {}, origins = {};
  let bytes = 0, artifactCount = 0, artifactBytes = 0, repeated = 0, inspected = 0;
  const seen = new Set();
  for (const p of prompts) {
    bytes += p.bytes || 0;
    purposes[p.purpose] = (purposes[p.purpose] || 0) + 1;
    sizes[p.size_bucket] = (sizes[p.size_bucket] || 0) + 1;
    origins[p.origin] = (origins[p.origin] || 0) + 1;
    for (const t of p.content_types || []) types[t] = (types[t] || 0) + 1;
    if (p.fingerprint) { if (seen.has(p.fingerprint)) repeated++; else seen.add(p.fingerprint); }
    for (const a of p.artifacts || []) { artifactCount++; artifactBytes += a.bytes || 0; artifacts[a.kind] = (artifacts[a.kind] || 0) + 1; if (a.inspected) inspected++; }
  }
  return {
    version: '1.0.0',
    capture: 'metadata',
    prompts: prompts.length,
    prompt_bytes: bytes,
    purposes,
    content_types: types,
    size_buckets: sizes,
    origins,
    repeated_prompts: repeated,
    artifacts: artifactCount,
    artifact_bytes: artifactBytes,
    artifact_kinds: artifacts,
    artifacts_inspected: inspected,
    completeness: prompts.length ? 'partial' : 'unavailable',
    limitations: ['Metadata only by default. A reference does not prove the model received or read the artifact.'],
  };
}
