# GitLab CI fixtures (recorded 2026-11-27)

Anonymous GET responses from git.drupalcode.org for issue #2574721, merge request !17049, trimmed to the fields the lab reads.
Personal fields (user, author, committer, runner) were removed. In `trace-13993524.json` the runner's partial upload token and
runner identifiers were replaced with `SYNTHETIC` values, and only log lines 0-6, 1765-1845 and 2504-2520 were kept.

| File | Source |
|---|---|
| `mr-17049.json`, `mr-17049-pipelines.json`, `mr-17049-diffs.json` | API `projects/project%2Fdrupal/merge_requests/17049`, `/pipelines`, `/diffs` |
| `pipeline-1068051.json`, `pipeline-1068051-jobs.json`, `pipeline-1068051-test-report-summary.json` | API `pipelines/1068051`, `/jobs`, `/test_report_summary` (merge-result pipeline, ref `refs/merge-requests/17049/merge`) |
| `commit-1ec20a6f.json` | API `repository/commits/1ec20a6f...`: the synthetic merge commit; parents are main `1dec2b8c` and source `e7a89e76` |
| `pipeline-953903.json`, `pipeline-953903-jobs.json` | API `projects/243324/pipelines/953903` (issue fork branch pipeline on source commit `ed3917f4`) |
| `suite-13993524.json` | web `project/drupal/-/pipelines/1068051/tests/suite.json?build_ids[]=13993524` (failed cases plus two skipped and two passed) |
| `trace-13993524.json` | web `project/drupal/-/jobs/13993524/trace.json` (the job log; the API trace answers 401 anonymously) |

Anonymous access checked the same day: API `jobs/:id` and `jobs/:id/trace` answer 401; web `-/jobs/:id/raw` redirects to a signed
S3 address that must not be followed or printed; `pipelines/:id/test_report` is 14 MB, so per-job `suite.json` is used instead.
