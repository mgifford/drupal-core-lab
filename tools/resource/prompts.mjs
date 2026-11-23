// Deterministic prompt provenance. It classifies structure and purpose, never the meaning of the request, and never
// calls a model. By default only metadata is returned: sizes, content types, purpose, fingerprints and artifact
// references. Raw prompt text is opt-in and is written by the caller to a local-only store, never into a public export.
import crypto from 'node:crypto';

export const PROMPT_RULES_VERSION = '1.0.0';

export const PROMPT_PURPOSES = Object.freeze([
  'short_instruction', 'implementation_specification', 'architecture_request', 'code_generation',
  'code_review', 'code_modification', 'error_diagnosis', 'test_failure_analysis', 'accessibility_evaluation',
  'issue_investigation', 'documentation_request', 'research_request', 'artifact_analysis', 'mixed_content', 'unknown',
]);

export const CONTENT_TYPES = Object.freeze([
  'natural_language', 'markdown', 'code_fence', 'inline_code', 'error_output', 'stack_trace', 'diff',
  'json', 'yaml', 'table', 'html', 'attachment_reference', 'image',
]);

export const SIZE_BUCKETS = Object.freeze(['lt_1kib', '1_4kib', '4_16kib', '16_64kib', 'gte_64kib']);

export const fingerprint = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

function sizeBucket(bytes) {
  if (bytes < 1024) return 'lt_1kib';
  if (bytes < 4096) return '1_4kib';
  if (bytes < 16384) return '4_16kib';
  if (bytes < 65536) return '16_64kib';
  return 'gte_64kib';
}

// Path-like references. This is deliberately conservative: only a token with a path separator and a known extension is
// recorded, and only the first 20 unique references per prompt. A reference is not evidence that the model read it.
const ARTIFACT_EXTENSIONS = new Set([
  'zip', 'patch', 'diff', 'php', 'module', 'theme', 'inc', 'install', 'yml', 'yaml', 'json', 'md', 'txt', 'html',
  'css', 'scss', 'js', 'mjs', 'cjs', 'ts', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'pdf', 'csv', 'log', 'xml',
]);
export function artifactReferences(text) {
  const found = [];
  const seen = new Set();
  const re = /(?:^|[\s("'`=])((?:\.{0,2}\/|\/)?(?:[A-Za-z0-9_.-]+\/)+[A-Za-z0-9_.-]+\.([A-Za-z0-9]{1,10}))(?=$|[\s)"'`,:;])/g;
  for (const m of String(text).matchAll(re)) {
    const ref = m[1].replace(/[),.;:]+$/, '');
    const ext = String(m[2]).toLowerCase();
    if (!ARTIFACT_EXTENSIONS.has(ext) || seen.has(ref)) continue;
    seen.add(ref);
    found.push({ reference: ref, extension: ext, kind: artifactKind(ref) });
    if (found.length >= 20) break;
  }
  return found;
}

export function artifactKind(name) {
  const ext = String(name).split('.').pop().toLowerCase();
  if (ext === 'zip') return 'archive';
  if (ext === 'patch') return 'patch';
  if (ext === 'diff') return 'diff';
  if (['php', 'module', 'theme', 'inc', 'install', 'js', 'mjs', 'cjs', 'ts', 'css', 'scss'].includes(ext)) return 'source';
  if (['md', 'txt', 'html', 'pdf'].includes(ext)) return 'document';
  if (['json', 'yml', 'yaml', 'xml', 'csv'].includes(ext)) return 'data';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  if (ext === 'log') return 'log';
  return 'other';
}

// Deterministic purpose classification. Rules are ordered from most specific evidence to least. Multiple purposes are
// represented as `mixed_content` only when two strong purposes are both present; the individual signals are retained.
export function classifyPromptText(text, { origin = 'unknown' } = {}) {
  const raw = String(text ?? '');
  const bytes = Buffer.byteLength(raw);
  const contentTypes = new Set(['natural_language']);
  const signals = [];
  const hasFence = /```/.test(raw);
  const hasInlineCode = /`[^`\n]+`/.test(raw);
  const hasDiff = /^(?:diff --git|--- a\/|\+\+\+ b\/|@@ )/m.test(raw) || /\.(?:patch|diff)\b/i.test(raw);
  const hasStackTrace = /\b(?:Stack trace|Traceback \(most recent call last\)|at [\w.$]+\([^)]*:\d+:\d+\))/.test(raw) || /\n\s+#\d+\s+\//.test(raw);
  const hasError = /\b(?:Fatal error|Uncaught|TypeError|ReferenceError|ParseError|Exception|Error:)\b/.test(raw);
  const hasJson = /^\s*[\[{][\s\S]*[\]}]\s*$/.test(raw) || /```json/i.test(raw);
  const hasYaml = /^---\s*$/m.test(raw) && /^[A-Za-z0-9_.-]+:\s/m.test(raw);
  const hasHtml = /<(?:html|body|div|table|form|button|a)\b/i.test(raw);
  const hasTable = /\n\s*\|[^\n]*\|[^\n]*\n\s*\|?\s*:?-{2,}/.test(raw);
  const hasMd = /^#{1,6}\s+\S/m.test(raw) || /^\s*[-*]\s+\S/m.test(raw) || hasTable;
  const refs = artifactReferences(raw);
  if (hasFence) { contentTypes.add('code_fence'); signals.push('code_fence'); }
  if (hasInlineCode) { contentTypes.add('inline_code'); signals.push('inline_code'); }
  if (hasDiff) { contentTypes.add('diff'); signals.push('diff'); }
  if (hasStackTrace) { contentTypes.add('stack_trace'); signals.push('stack_trace'); }
  if (hasError) { contentTypes.add('error_output'); signals.push('error_output'); }
  if (hasJson) { contentTypes.add('json'); signals.push('json'); }
  if (hasYaml) { contentTypes.add('yaml'); signals.push('yaml'); }
  if (hasHtml) { contentTypes.add('html'); signals.push('html'); }
  if (hasTable) { contentTypes.add('table'); signals.push('table'); }
  if (hasMd) { contentTypes.add('markdown'); signals.push('markdown'); }
  if (refs.length) { contentTypes.add('attachment_reference'); signals.push('attachment_reference'); }

  const lower = raw.toLowerCase();
  const words = (n) => new RegExp(`\\b${n}\\b`, 'i').test(lower);
  const spec = bytes > 500 && (words('acceptance criteria') || words('requirements') || words('deliverables') || words('implementation plan') || (hasMd && (words('objective') || words('scope'))));
  const review = words('review') || words('critique') || words('code review');
  const modify = (words('fix') || words('implement') || words('change') || words('modify') || words('update')) && (hasDiff || hasFence || refs.length);
  const generate = words('write') || words('create') || words('generate') || words('add');
  const accessibility = words('accessibility') || words('wcag') || words('a11y') || words('screen reader') || words('keyboard');
  const issue = /(?:drupal\.org\/issue|#\d{5,7}|\bissue\s+\d{5,7})/i.test(raw);
  const docs = words('documentation') || words('readme') || words('change record');
  const research = words('research') || words('investigate') || words('compare');
  const testPhrase = (hasStackTrace || hasError) && (words('test') || words('failure') || words('failing'));

  let purpose = 'unknown';
  if (refs.some((r) => ['archive', 'patch'].includes(r.kind)) && (words('review') || words('reproduce') || words('apply'))) purpose = 'artifact_analysis';
  else if (testPhrase) purpose = 'test_failure_analysis';
  else if (accessibility && (review || testPhrase)) purpose = 'accessibility_evaluation';
  else if (spec) purpose = 'implementation_specification';
  else if (review) purpose = 'code_review';
  else if (modify) purpose = 'code_modification';
  else if (generate && (hasFence || refs.length)) purpose = 'code_generation';
  else if (issue) purpose = 'issue_investigation';
  else if (docs) purpose = 'documentation_request';
  else if (research) purpose = 'research_request';
  else if (hasError) purpose = 'error_diagnosis';
  else if (bytes <= 400 && !hasFence && !hasDiff) purpose = 'short_instruction';
  else if (bytes <= 400) purpose = 'short_instruction';
  else if (signals.length >= 3) purpose = 'mixed_content';
  if (purpose === 'unknown' && bytes > 400) purpose = 'mixed_content';

  return {
    bytes,
    lines: raw ? raw.split('\n').length : 0,
    size_bucket: sizeBucket(bytes),
    purpose,
    origin,
    content_types: [...contentTypes],
    signals,
    code_fences: (raw.match(/```/g) || []).length >> 1,
    has_diff: hasDiff,
    has_stack_trace: hasStackTrace,
    has_error: hasError,
    artifact_references: refs,
    references_truncated: refs.length >= 20,
    fingerprint: fingerprint(raw),
    capture: 'metadata',
    rules_version: PROMPT_RULES_VERSION,
    limitations: bytes === 0 ? ['Empty prompt text.'] : [],
  };
}

// Prompt origin is a property of the recorded turn, not of its content. Only explicit client markers are used.
export function promptOrigin({ text = '', isMeta = false, client = null } = {}) {
  if (isMeta) return 'generated';
  const s = String(text || '');
  if (/^<(?:command-name|command-message|local-command|system-reminder)/.test(s)) return 'generated';
  if (/^\[Request interrupted by user\]/.test(s)) return 'generated';
  if (client) return 'human';
  return 'unknown';
}

