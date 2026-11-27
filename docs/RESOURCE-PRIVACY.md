# Resource data: privacy and public disclosure

This is the privacy model for the resource ledger, the reports in `reports/resources/`, and the public dashboard at
`cloud/resources.html`. It is a disclosure, not a promise that a technical control is perfect.

## What is collected

The local ledger is intended to answer “where did resources go?” without keeping the content of the work. It records:

| Data | Where | Public? |
|---|---|---|
| Aggregated provider-reported token counts, model requests, tool calls, tool-result bytes, repeated reads | Local event; aggregated report/dashboard | Yes, aggregates only |
| Client-reported or estimated cost, with its basis | Local event; aggregate | Yes, labelled estimate; not an invoice |
| CPU-seconds, CPU percentages, peak memory, disk/block I/O operations, network bytes from samples | Local event; aggregate | Yes, labelled measured/sampled/derived |
| Host capacity: disk free/total, memory free, swap used/total, Docker lab memory, running pairs/containers, preflight level | Local event; aggregate | Yes, latest sample and a capped series at hour resolution |
| GitHub Actions workflow/job, trigger, runner label, duration, conclusion, attempt, potential overlap | Local event; aggregate buckets | Yes, aggregated by day/activity/tool; no run ids |
| Activity category, tool name, model/provider name, public issue number, variant slug, commit/patch reference (where known) | Local event; aggregate | Yes, where the source provides it |
| Source adapter and confidence | Local event; aggregate | Yes |
| Task/execution identifiers, transcript filename, session title, command hash, local file path, run URL, branch name, raw command | Local ledger only | **No** |
| Prompt metadata: origin, purpose, byte size, content types, size bucket, SHA-256 fingerprint, artifact references | Local ledger `private` and a local provenance file; aggregate counts in reports | Aggregates only; no fingerprint, reference or text |
| Task record: id, description, evidence references, session filenames | `.lab-cache/resource-ledger/tasks.jsonl` | Only a task-id hash, kind, state, deliverable, issue and resource totals |
| Repetition fingerprint: command hash, result signature, test ids, precise first/last time | Local event `private` | Only a group hash, activity, run/result counts and day-level dates |
| Raw prompt text | Only in an explicitly requested local directory (`.lab-cache/resource-ledger/prompt-content/`, mode 0600) | **No** |
| Responses, message text, request bodies, cookies, authorization headers, API keys, account identifiers | Not collected | **No** |
| Raw Claude Code session transcripts | Stay in `~/.claude/projects/`; not copied | **No** |

The collector reads transcripts only through `scripts/session-usage.mjs`. Its default output is numbers, tool labels and
prompt metadata, not prompt text. Prompt text is written only when `--prompt-content` is passed; that directory is
gitignored and never read by the report, the export or the dashboard. The adapter stores the transcript filename and
prompt metadata in the local event’s `private` object; both are stripped from every public object.

Artifact inspection is opt-in (`--inspect-artifacts`). It reads only files inside the repository, never follows a
symlink, never extracts a ZIP and never executes content. A reference in a prompt does not prove that the model received
or read the artifact; the event records that distinction explicitly.

## The public allowlist

`tools/resource/public.mjs` checks the entire public summary before it is written. It rejects:

- field names such as `private`, `source_key`, `transcript`, `title`, `command`, `command_hash`, `run_id`, `url`, `branch`,
  `reason`, `prompt`, `response`, `authorization`, `cookie`, `api_key`, account/user/email fields;
- prompt text, artifact contents, prompt fingerprints and local artifact paths, which are not in any public builder;
- strings that look like a private path (`/Users/`, `/home/`, `.lab-cache`, `~/.claude`, a Windows drive path) or a
  secret-shaped token.

The dashboard receives **aggregated public rows**, not raw events: date (day), issue, variant, activity, tool, model,
provider, token basis, cost basis, CPU measurement, quality, classification confidence/provenance, unknown reason
labels, counts and evidence id hashes. It also receives aggregate prompt composition (purpose and content-type counts,
size buckets, artifact-kind counts) and exploration diagnostics (counts only). It does not receive session names, task
ids, prompt text, artifact references, fingerprints, paths or precise times. Evidence ids are hashes used to cite a
measurement, not identifiers that reveal a person.

## What the public dashboard shows

- Totals and shares, not individual prompt or artifact content.
- Cost as an **estimate** where no provider invoice exists. If cost is missing, it is `—`, not `$0.00`.
- CPU-hours and memory as computational measurements, not energy or emissions.
- GitHub Actions time from the public API; no run ids or account details.
- Host capacity samples at hour resolution: no precise working timestamps, process lists or container names.
- Issue numbers, which are public Drupal issue identifiers.

The page makes no network request except for `resources.json` beside it. It does not call an AI provider, Drupal, a trace
collector, a database or an analytics service. GitHub Pages remains static.

## Retention and removal

| Data | Retention | Removal |
|---|---|---|
| Local ledger | `.lab-cache/resource-ledger/`, gitignored; keep as long as useful | `rm -rf .lab-cache/resource-ledger`; `node scripts/resource.mjs verify` reports integrity |
| Raw source transcripts | In the client’s own `~/.claude/projects/`; not managed by this repository | Use the client’s normal transcript controls |
| Committed summary | `reports/resources/summary.json`, `SUMMARY.md`, `BASELINE.md`, `baseline.json` | Delete or regenerate in a reviewed commit |
| Opt-in raw prompt text | `.lab-cache/resource-ledger/prompt-content/`, gitignored, mode 0600 | `rm -rf .lab-cache/resource-ledger/prompt-content` |
| Local prompt metadata / ledger | `.lab-cache/resource-ledger/events.jsonl` | `rm -rf .lab-cache/resource-ledger` |
| Published dashboard data | `cloud/resources.json`, `cloud/resources.html` | Regenerate `cloud/` and publish; old GitHub Pages deployments/history may persist |
| Raw command measurements | Only aggregated in reports; the local event keeps a command hash, not the command | Delete the local ledger |

A public commit is not easily un-published: Git history, forks, caches and page snapshots may retain it. If a public
summary contains something that should not be public, remove it from the current site **and** treat the old commit as
disclosed; do not assume deleting a file removes copies.

## Secret and vulnerability handling

- Never put an API key, token, password or credential in the ledger, a report, a command, a test fixture or this
  repository. Use an environment variable or a `chmod 600` file outside the repository.
- The public check rejects secret-shaped strings, but it is a safety net, not permission to store secrets.
- If a measurement suggests a possible security vulnerability in Drupal core or a contributed project, do not write it
  into an issue, report, commit, dashboard or draft. Follow the repository rule: report it privately to the Drupal
  Security Team.

## What this model does not guarantee

- Aggregates can still reveal broad working patterns (for example, a day with unusually high usage). The dashboard uses
  day-level dates and groups rows, but a small number of records can make an aggregate close to individual data.
- The local ledger is not encrypted. Anyone with access to the host can read it; use disk encryption and normal
  workspace access controls.
- The public dashboard is a presentation layer, not an authorization boundary.
- Automated redaction is imperfect. A prompt can contain a secret or personal data even when the client did not label it;
  raw capture is therefore opt-in and should be treated as sensitive. Do not commit the prompt-content directory.
- This document describes request-level accounting, prompt/artifact metadata and opt-in raw capture as of 2026-11-23.
  Review it when adding a provider, field or public view.
