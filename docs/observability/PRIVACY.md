# Privacy and security model

Traces are potentially sensitive: a request can contain a session, a one-time login token, a form body or a database
query with user data. The lab treats tracing as diagnostic data that stays local until it has been reduced to an
allow-listed summary.

## What is collected

| Data | Collected? | Where |
|---|---|---|
| HTTP method, path, query **parameter names and count** (not values) | yes | span attributes, request catalogue |
| HTTP status, server duration | yes | span attributes, request summary |
| Route name, controller name | yes | span attributes |
| Drupal version, PHP version, core commit, environment id, side, run id | yes | span resource/attributes |
| Drupal authenticated-user boolean | yes | span attribute |
| Database query count, statement time, target, table names | yes (aggregate) | request summary |
| Cache-table query/write counts | yes (inferred) | request summary |
| Exception class and count | yes | span status and request summary |
| SQL text and query arguments | **no** | never written |
| Request/response bodies | **no** | never read |
| Cookies, `Set-Cookie`, `Authorization`, `Proxy-Authorization`, CSRF tokens, session ids | **no** | never captured; header allow-list |
| URL query values, fragments, userinfo | **no** | stripped before writing |
| Full exception messages and stack traces | **no** | not exported |
| Request headers other than the lab's own correlation headers | **no** | not captured |
| Database credentials, environment variables, private fixtures | **no** | not read |

The implementation is deny-by-default. The PHP module writes span attributes only from a fixed allow-list
(`SpanRecorder::SAFE_ATTRIBUTES`); the Node collector keeps only a fixed set of response headers and span attributes
(`tools/observability/sanitize.mjs`). Instrumentation that adds a new attribute is ignored until someone deliberately adds
it to the list.

## Where the data lives

| Data | Location | Access | Retention |
|---|---|---|---|
| Local spans and request summaries | `/tmp/core-lab-observability/` inside each DDEV web container, mode `0600` | Container process only; not web-accessible | Until the container is removed or `/tmp` is cleared |
| Collector output | `envs/<env>/observability/data/traces.jsonl` on the host | Local file, not in the repository | Until the environment is deleted or the file is removed |
| Browser request catalogue | `reports/issues/<nid>/playwright/<run>/observability-<side>.json` | Committed; sanitised | With the run |
| Manifest, comparison, summary | `reports/issues/<nid>/observability/<stamp>/` | Committed; sanitised | With the issue |
| Raw copies (`raw/`) | `reports/issues/<nid>/observability/<stamp>/raw/` | Local; manifest marks `retention: local`, `public: false` | Until `scripts/lab-env.mjs`/manual cleanup; not published |
| Playwright trace zip | Run folder when `--playwright-trace` is used | Large; review before committing | Should be treated as local unless a run needs it |

The lab's `reports` folder is public when the repository is public. That is why the committed summary is generated from
the sanitised manifest and why raw spans are local-only. Hiding a value in the viewer is not a privacy control; the
value must not be in the file.

## Sanitisation before publication

1. The PHP module filters attributes and writes only the request summary fields described above.
2. `tools/playwright/lib/observability.mjs` records response headers through `sanitiseHeaders()` (allow-list) and URLs
   through `sanitiseUrl()` (origin, query values and fragments removed).
3. `tools/observability/collect.mjs` copies raw spans/summaries only under `raw/`, marks them local and non-public, and
   builds the committed `evidence.json` / `summary.json` from the sanitised fields.
4. `scripts/build-cloud.mjs` copies only `latest.json` (already sanitised) into `cloud/variants.json`. It does not copy
   `raw/`, local span files or collector output.
5. Error messages shown in the manifest pass through `redactSecrets()`.

The viewer's Execution tab reads the sanitised `latest.json`; it never reads a collector or a raw span file.

## Threat model

- **A public repository reader.** Must not learn a session, token, password, email address, request body, SQL text or
  private fixture. Addressed by the allow-lists and by not committing raw artifacts.
- **A malicious page in the viewer's browser.** The viewer's existing Host, Origin and `frame-ancestors` checks remain in
  place. The new `/api/observability` endpoint is read-only and only serves the current variant's sanitised summary; it
  does not accept a path.
- **A third-party request from the page under test.** The browser instrumentation injects `traceparent` only when the
  request origin equals the Drupal site origin. A request to an analytics or CDN host is not modified and is not
  correlated.
- **A collector or exporter failure.** Export runs at terminate with a short timeout and no retries; a failure is
  recorded in `export.status` and does not discard the local evidence or the browser evidence.
- **A tracing bug.** Subscribers wrap every tracer call; a failure is logged and the Drupal request continues. The module
  is disabled by default and can be removed with one command.

## Sensitive or security-relevant findings

The repository's rule applies unchanged: if an investigation suggests a possible security vulnerability in Drupal core or
a contributed project, do not write it into an issue, a report, a commit, a pull request or a finding. Stop and report it
privately to the Drupal Security Team. Trace data can make such a finding more likely to surface (for example an
unexpected access decision or an information leak); treat it with the same care as any other lab observation.

## Retention and deletion

- `node tools/observability/cli.mjs disable <slug>` removes the module, settings block and collector, but does not delete
  evidence under `reports/`.
- `node scripts/lab-env.mjs delete <slug>` removes the disposable environments, including their `observability/data/`
  collector output. The committed manifest survives; its raw artifact references become local-only and may be reported as
  missing by a later check.
- A manifest must not silently reference a deleted artifact as if it were present. `collect` checks existence and hashes
  before writing; a report exposes `retention: local` so a reader knows the raw file may not be available.
- To remove committed evidence, delete the specific run/observability folder in a normal reviewed commit. Do not rewrite
  an existing manifest to hide a value; regenerate it from sanitised data or remove it.

## What this model does not guarantee

- A screenshot can contain personal data from a test fixture; review screenshots before publishing. The lab's fixtures
  are test data, not production data.
- The collector is a local service, not an authorization boundary. Anyone with access to the DDEV host can read its
  files.
- The lab does not encrypt local evidence at rest. Use disk encryption and the existing workspace controls.
- The manifest describes what the instrumentation observed. It is not a security audit and does not prove the absence of
  an information leak.
