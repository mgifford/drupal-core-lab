# Aborted run

The Before page was captured, but the first keyboard helper evaluated the
page context during navigation and Playwright destroyed that execution
context. No `results.json` was written. The helper was corrected to wait for
the target URL before reading the page and the successful run supersedes this attempt.
