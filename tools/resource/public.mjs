// The public export allowlist check. It is intentionally blunt: if a forbidden field name or a private path appears
// anywhere in the summary, the export fails instead of trying to remove it.
const FORBIDDEN_KEYS = new Set([
  'private', 'source_key', 'supersedes', 'revision', 'transcript', 'transcripts', 'title', 'command', 'command_hash',
  'command_label', 'run_id', 'url', 'branch', 'head_sha', 'reason', 'api_key', 'apikey', 'authorization', 'cookie',
  'session_id', 'prompt', 'response', 'raw', 'source_ref', 'user', 'username', 'email', 'account', 'description', 'task_id', 'task_description', 'evidence_refs',
]);
const PRIVATE_PATH = /(\/Users\/|\/home\/|\.lab-cache|~\/\.claude|\.claude\/projects|[A-Za-z]:\\)/;
const SECRET_TEXT = /(gho_|ghp_|sk-ant-|xox[baprs]-|BEGIN (?:RSA |OPENSSH )?PRIVATE KEY)/;

export function publicProblems(value, at = '') {
  const problems = [];
  if (value == null || typeof value !== 'object') {
    if (typeof value === 'string') {
      if (PRIVATE_PATH.test(value)) problems.push(`${at || '/'}: private path or local ledger reference`);
      if (SECRET_TEXT.test(value)) problems.push(`${at || '/'}: secret-shaped string`);
    }
    return problems;
  }
  if (Array.isArray(value)) { value.forEach((v, i) => problems.push(...publicProblems(v, `${at}/${i}`))); return problems; }
  for (const [k, v] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(k.toLowerCase())) problems.push(`${at || '/'}/${k}: forbidden public field`);
    problems.push(...publicProblems(v, `${at || ''}/${k}`));
  }
  return problems;
}

export function assertPublic(value, label = 'public resource summary') {
  const problems = publicProblems(value);
  if (problems.length) throw new Error(`${label} is not publishable:\n  ${problems.slice(0, 30).join('\n  ')}`);
  return value;
}
