# Resource accounting: #2942404 Variant C

Local-only accounting for the 2026-11-26 work. The lab ledger is
`.lab-cache/resource-ledger/` (gitignored). This summary contains no prompt text, transcripts or
credentials.

## Task record

`issue-2942404-variant-c`, kind `accessibility-evaluation`, deliverable
`accessibility-findings`, variant `2942404-consolidated`, issue 2942404. Recorded with
`node scripts/resource-task.mjs`. The task is `completed_claimed`, not `completed_verified`: no
person has reviewed the evidence.

## Phases

| Phase | What ran | Measured cost | Notes |
|---|---|---|---|
| Source investigation | Read `AI-LEARNING.md`, `AGENTS.md`, `ACCESSIBILITY.md`, the issue reports, the November 25 runs, and core's message templates, JavaScript, AJAX, BigPipe and tests. | Not separately measured. | Read-only; no model token capture in this session. |
| Implementation | Edited `core/misc/message.js`, five Twig templates and four test files in the After checkout; captured two patches, the full patch and the interdiff. | Not separately measured. | Uncommitted at the end of the session. |
| Dependency provisioning | `node tools/compare/setup.mjs 2942404-consolidated` built `baseline-2942404-latest` and `issue-2942404-consolidated` at `0387fb948f`, including Composer and the DDEV core-dev add-on. | Full build not wrapped by the ledger. | Reused the shared `envs/core.git`, cached DDEV images and the existing Composer cache. ESLint 9.39.5 was already at `core/node_modules/.bin/eslint`; no JavaScript dependencies were installed. |
| Testing | Playwright, PHPUnit, screen reader virtual run, lint. | See table below. | The PHPUnit commands after the first one were run without the ledger wrapper; their wall times were about 15 s, 5 s and 55 s. |
| Documentation | Summary, evidence, screen reader, branches, reproduce, explainer, comment draft. | Not measured. | Local Markdown only. |

## Measured test and validation events

From `.lab-cache/resource-ledger/events.jsonl`, task `issue-2942404-variant-c`:

| Time (UTC) | Activity | Outcome | Wall | CPU seconds | Peak RSS |
|---|---|---|---|---|---|
| 2026-11-26T00:24:04Z | playwright-testing | failure (collision with the recorder's `window.__lab`; fixed, not a product failure) | 25.47 s | 16.01 | 378 MB |
| 2026-11-26T00:26:05Z | playwright-testing | success (first complete Chromium run) | 48.34 s | 29.55 | 365 MB |
| 2026-11-26T00:27:36Z | phpunit-execution | success (`MessageLandmarkTest`) | 13.53 s | 0.58 | 107 MB |
| 2026-11-26T00:32:50Z | validation | failure (ESLint/Prettier formatting; fixed) | 37.53 s | 6.93 | 106 MB |
| 2026-11-26T00:39:10Z | validation | success (core code checks, PASS) | 58.74 s | 13.05 | 106 MB |
| 2026-11-26T00:41:11Z | playwright-testing | success (final Chromium run) | 123.00 s | 51.96 | 338 MB |
| 2026-11-26T00:43:12Z | accessibility-scanning | success (Guidepup virtual) | 31.32 s | 18.48 | 197 MB |

Measured totals: 337.9 s wall, 136.6 CPU seconds, peak RSS 378 MB. These are process measurements
from the wrapper; they do not include the full environment build or the unwrapped PHPUnit runs.

## What the numbers do not cover

- The initial two-environment build. It ran before the ledger task was started and was not wrapped.
  It is the dominant provisioning cost.
- The three unwrapped PHPUnit suites and the Before-side failure demonstrations.
- Model tokens and cost for this session. No provider-reported usage was collected, so the ledger
  shows them as unavailable rather than zero.
- Docker sampling, Mutagen snapshots and CPU/memory of the DDEV containers.

The numbers above are enough to compare the phases that were wrapped; they are not a complete
session cost.

## Finalization phase, 2026-11-26 (task `issue-2942404-final`)

Recorded in the ledger with the issue-scoped `2942404-final` variant. The code work was performed on
the existing environments; no environment was rebuilt.

| Time (UTC) | Activity | Outcome | Wall | CPU seconds | Peak RSS |
|---|---|---|---|---|---|
| 2026-11-26T03:29:47Z | validation | failure (Prettier formatting; fixed) | 41.81 s | 6.53 | 106 MB |
| 2026-11-26T03:30:52Z | validation | success (final lint, PASS) | 21.96 s | 6.78 | 106 MB |
| 2026-11-26T03:31:43Z | playwright-testing | failure (shared DDEV router connection reset; router restarted, no project rebuilt) | 9.36 s | 5.44 | 136 MB |
| 2026-11-26T03:33:46Z | playwright-testing | success (final Chromium run) | 47.88 s | 27.69 | 382 MB |
| 2026-11-26T03:34:43Z | accessibility-scanning | success (final Guidepup virtual) | 16.83 s | 10.45 | 187 MB |
| 2026-11-26T03:38:14Z | phpunit-execution | success (JsMessageTest and MessageLandmarkTest on the final patch bytes) | 31.87 s | 1.93 | 105 MB |

Measured totals: 169.7 s wall, 58.8 CPU seconds, peak RSS 382 MB. These are process measurements
from the wrapper.

Not measured in this phase:

- Source review, test authoring and documentation.
- The PHPUnit runs (four suites plus the two v2 failure demonstrations). Their wall times were about
  42 s, 5 s, 52 s and 5 s on the final code, plus about 18 s and 57 s for the v2 detection and
  ownership failures.
- Environment provisioning. The environments were reused and only the patch state was refreshed;
  no Composer, Node or browser install ran.
- The shared DDEV router restart. It repaired all projects and touched no database or code.
- The final real VoiceOver run at 06:39. It was run interactively by the person and was not wrapped by
  the ledger; its duration and CPU are not recorded here.

The earlier `issue-2942404-variant-c` task record and its measured events remain in the same ledger;
they are not merged into these totals.

## Push-unblock provisioning

The first push from the Lab worktree was rejected with `shallow update not allowed`. To make the
branch pushable without rebuilding an environment:

- `git fetch --unshallow origin main` in the shared `envs/core.git` partially filled history; the
  repository grew from about 76 MB to 346 MB, but 316 shallow boundaries remained and the push would
  still fail.
- A fresh full-history clone of `project/drupal` `main` with `--filter=blob:none` was made at
  `/tmp/drupal-2942404-full`. It is not shallow, is about 254 MB, and contains the base commit
  `0387fb948f`. The branch and commit were recreated there and pushed.
- Disk free fell from about 12 GB to 11 GB during this work.
- The push and the GitLab transfer were not measured by the ledger. No environment, Composer
  dependency or browser was rebuilt or installed.

## CI fixes, 2026-11-26

The existing `baseline-2942404-latest` and `issue-2942404-consolidated` environments were reused;
no DDEV project, Composer dependency or browser was provisioned. Times are PHPUnit wall times from
the final runs, not CPU or model tokens.

| Activity | Result | Wall |
|---|---|---:|
| `BigPipeTest` full class, after the fixture fix | OK, 5 tests, 160 assertions | 7:20 |
| `BigPipeTest::testBigPipe` + `::testBigPipeNoJs` final | OK, 2 tests, 90 assertions | 0:32 |
| `MessageLandmarkTest` final | OK, 1 test, 2 assertions | 0:15 |
| `JsMessageTest` final | OK, 6 tests, 47 assertions | 1:33 |
| `BigPipeMessagesTest` final | OK, 1 test, 3 assertions | 0:11 |
| `MessageCommandTest` final | OK, 2 tests, 61 assertions | 1:03 |
| `scripts/lint.mjs 2942404-final` final | PASS | 0:36 |
| `StandardPerformanceTest` | skipped: "Drupal core performance tests only run on MySQL" | 0:24 |

Infrastructure cost: the host data volume reached 100% full; Docker Desktop remounted the VM disk
`/dev/vda1` with `emergency_ro`, which blocked every container write. The host was left with
about 5.7 GB free, and Docker Desktop was stopped and restarted. This added a stop/start cycle and
one container recreate for `issue-2942404-consolidated`; no database, environment or image was
rebuilt. The disk and VM recovery time was not ledger-wrapped.
