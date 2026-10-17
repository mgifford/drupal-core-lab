// Node test output is explicitly TAP at the call site, independent of TTY defaults.
export function testRunSummary(result) {
  const stdout = result.stdout || '', stderr = result.stderr || '';
  const passed = stdout.match(/^# pass (\d+)/m)?.[1];
  const failed = stdout.match(/^# fail (\d+)/m)?.[1];
  const complete = passed !== undefined && failed !== undefined;
  const ok = result.status === 0 && complete;
  let detail = complete ? `${passed} passed, ${failed} failed` : 'test summary unavailable';
  if (!ok) {
    const blocks = stdout.split(/(?=# Subtest:)/).filter(block => /^not ok /m.test(block));
    const errors = [result.error?.message, result.signal && `signal ${result.signal}`, `exit ${result.status}`,
      ...blocks.slice(0, 5).map(block => block.slice(0, 2500)), stderr.slice(0, 3000)].filter(Boolean);
    detail += ':\n' + (errors.join('\n') || stdout.slice(-3000));
  }
  return { ok, detail };
}
