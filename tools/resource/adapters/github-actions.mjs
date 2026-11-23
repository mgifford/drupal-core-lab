// GitHub Actions adapter. Read-only: it uses the public API (gh when available, otherwise unauthenticated fetch).
// Durations and conclusions are reported by GitHub; billable minutes are not available from these endpoints and stay
// null. A run that overlaps a later run on the same branch/workflow may be superseded: that is a derived flag, not a
// confirmed waste.
import { execFileSync } from 'node:child_process';
import { makeEvent, iso, safeText } from '../events.mjs';
import { classifyWorkflow, issueFromText, variantFromText } from '../classify.mjs';

const OWNER = 'mgifford', REPO = 'drupal-core-lab';
const API = `repos/${OWNER}/${REPO}`;

function ghJson(endpoint) {
  try { return JSON.parse(execFileSync('gh', ['api', endpoint], { encoding: 'utf8', timeout: 60000, maxBuffer: 16 * 1024 * 1024 })); }
  catch { return null; }
}
async function fetchJson(endpoint) {
  const res = await fetch(`https://api.github.com/${endpoint}`, { headers: { accept: 'application/vnd.github+json', 'user-agent': 'drupal-core-lab-resource-accounting' } });
  if (!res.ok) throw new Error(`GitHub API ${endpoint}: HTTP ${res.status}`);
  return res.json();
}

const outcomeOf = (c) => ({ success: 'success', failure: 'failure', cancelled: 'cancelled', timed_out: 'failure', startup_failure: 'failure', skipped: 'partial', neutral: 'partial', action_required: 'unknown' }[c] || 'unknown');
const validationOf = (o) => o === 'success' ? 'passed' : o === 'failure' ? 'failed' : 'unknown';
const ms = (a, b) => { const start = Date.parse(a), end = Date.parse(b); return Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, end - start) : null; };

export async function collectGithubActions({ limit = 100, jobsFor = 20, issue = null, variant = null } = {}) {
  let data = ghJson(`${API}/actions/runs?per_page=${limit}`);
  if (!data) { try { data = await fetchJson(`${API}/actions/runs?per_page=${limit}`); } catch (e) { return { events: [], errors: [e.message], metadata: {} }; } }
  const runs = (data.workflow_runs || []).slice(0, limit);
  const jobMap = new Map();
  for (const run of runs.slice(0, jobsFor)) {
    const j = ghJson(`${API}/actions/runs/${run.id}/jobs?per_page=100`);
    if (j?.jobs) jobMap.set(run.id, j.jobs);
    else { try { const f = await fetchJson(`${API}/actions/runs/${run.id}/jobs?per_page=100`); jobMap.set(run.id, f.jobs || []); } catch { /* run-level event only */ } }
  }
  // Derived overlap: a later run of the same workflow/branch/event started before this one finished.
  const groups = new Map();
  for (const r of runs) { const k = `${r.workflow_id}|${r.head_branch}|${r.event}`; (groups.get(k) || groups.set(k, []).get(k)).push(r); }
  const superseded = new Set();
  for (const group of groups.values()) {
    group.sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
    for (let i = 0; i < group.length; i++) {
      const r = group[i], later = group.slice(i + 1).find((x) => Date.parse(x.created_at) < Date.parse(r.updated_at || r.created_at));
      if (later || (r.run_attempt || 1) > 1) superseded.add(r.id);
    }
  }
  const events = [];
  for (const run of runs) {
    const jobs = jobMap.get(run.id) || [];
    const issueId = issue || issueFromText(run.head_branch, run.display_title) || null;
    const variantId = variant || variantFromText(run.head_branch) || null;
    const activity = classifyWorkflow(run.name || run.workflow_name || '', '');
    const queueSeconds = ms(run.created_at, run.run_started_at);
    const base = {
      event_type: 'github-actions', issue: issueId, variant: variantId,
      task: { id: `github-actions:${run.name || run.workflow_id}`, label: `GitHub Actions: ${run.name || run.workflow_id}`, execution_id: String(run.id) },
      activity, tool: 'github-actions', model: null, provider: 'github',
      environment: { os: null, node: null, runner: 'github-actions', ddev: null, docker: null },
      commit: run.head_sha || null, patch: null,
      source: { adapter: 'github-actions', method: 'GitHub Actions API (read-only)', confidence: 'provider-reported', reference: `${API}/actions/runs/${run.id}` },
      quality: { completeness: 'partial', missing: ['cpu', 'memory', 'billable_minutes'], notes: ['GitHub reports duration and conclusion; it does not expose runner CPU, memory or billable minutes through this API. The superseded flag is derived from overlapping runs.'] },
      private: { run_id: run.id, url: run.html_url, branch: run.head_branch, head_sha: run.head_sha, display_title: safeText(run.display_title, 200) },
    };
    if (jobs.length) {
      for (const job of jobs) {
        const outcome = outcomeOf(job.conclusion || run.conclusion);
        const duration = ms(job.started_at, job.completed_at);
        events.push(makeEvent({
          ...base, occurred_at: job.started_at || run.run_started_at || run.created_at,
          duration_ms: duration,
          outcome, validation: validationOf(outcome),
          measurements: {
            github: { workflow: run.name || null, job: job.name || null, event: run.event || null, runner: Array.isArray(job.labels) ? job.labels.join(', ') : (job.runner_group_name || null), attempt: job.run_attempt || run.run_attempt || 1, potentially_superseded: superseded.has(run.id), billable_minutes: null, queue_seconds: queueSeconds },
          },
          source_key: `github:${run.id}:${job.id || job.name}`,
        }));
      }
    } else {
      const outcome = outcomeOf(run.conclusion);
      const duration = ms(run.run_started_at || run.created_at, run.updated_at);
      events.push(makeEvent({
        ...base, occurred_at: run.run_started_at || run.created_at, duration_ms: duration,
        outcome, validation: validationOf(outcome),
        measurements: { github: { workflow: run.name || null, job: null, event: run.event || null, runner: null, attempt: run.run_attempt || 1, potentially_superseded: superseded.has(run.id), billable_minutes: null, queue_seconds: queueSeconds } },
        source_key: `github:${run.id}:run`,
      }));
    }
  }
  return { events, errors: [], metadata: { runs: runs.length, runs_with_jobs: jobMap.size, superseded: superseded.size, fetched_at: iso() } };
}
