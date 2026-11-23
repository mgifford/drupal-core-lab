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
| GitHub Actions workflow/job, trigger, runner label, duration, conclusion, attempt, potential overlap | Local event; aggregate buckets | Yes, aggregated by day/activity/tool; no run ids |
| Activity category, tool name, model/provider name, public issue number, variant slug, commit/patch reference (where known) | Local event; aggregate | Yes, where the source provides it |
| Source adapter and confidence | Local event; aggregate | Yes |
| Task/execution identifiers, transcript filename, session title, command hash, local file path, run URL, branch name, raw command | Local ledger only | **No** |
| Prompts, responses, message text, request bodies, cookies, authorization headers, API keys, account identifiers | Never collected | **No** |
| Raw Claude Code session transcripts | Stay in `~/.claude/projects/`; not copied | **No** |

The collector reads transcripts only through `scripts/session-usage.mjs`, which prints numbers and tool labels, not message
text. The adapter stores the transcript filename in the local event’s `private` object and a local `source.reference`; both
are stripped from every public object.

## The public allowlist

`tools/resource/public.mjs` checks the entire public summary before it is written. It rejects:

- field names such as `private`, `source_key`, `transcript`, `title`, `command`, `command_hash`, `run_id`, `url`, `branch`,
  `reason`, `prompt`, `response`, `authorization`, `cookie`, `api_key`, account/user/email fields;
- strings that look like a private path (`/Users/`, `/home/`, `.lab-cache`, `~/.claude`, a Windows drive path) or a
  secret-shaped token.

The dashboard receives **aggregated public rows**, not raw events: date (day), issue, variant, activity, tool, model,
provider, token basis, cost basis, CPU measurement, quality, counts and evidence id hashes. It does not receive session
names, task ids, paths or precise times. Evidence ids are hashes used to cite a measurement, not identifiers that reveal
a person.

## What the public dashboard shows

- Totals and shares, not individual prompt content.
- Cost as an **estimate** where no provider invoice exists. If cost is missing, it is `—`, not `$0.00`.
- CPU-hours and memory as computational measurements, not energy or emissions.
- GitHub Actions time from the public API; no run ids or account details.
- Issue numbers, which are public Drupal issue identifiers.

The page makes no network request except for `resources.json` beside it. It does not call an AI provider, Drupal, a trace
collector, a database or an analytics service. GitHub Pages remains static.

## Retention and removal

| Data | Retention | Removal |
|---|---|---|
| Local ledger | `.lab-cache/resource-ledger/`, gitignored; keep as long as useful | `rm -rf .lab-cache/resource-ledger`; `node scripts/resource.mjs verify` reports integrity |
| Raw source transcripts | In the client’s own `~/.claude/projects/`; not managed by this repository | Use the client’s normal transcript controls |
| Committed summary | `reports/resources/summary.json`, `SUMMARY.md`, `BASELINE.md`, `baseline.json` | Delete or regenerate in a reviewed commit |
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
- This document describes the implementation as of 2026-11-23. Review it when adding a provider, field or public view.
