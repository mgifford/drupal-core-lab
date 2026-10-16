# #3615469: Maintenance form login link text

DRAFT review, 2026-10-16. The issue and all 14 fetched comments, MR metadata and diff, and Drupal interface text guidance were read. No related issue was identified by intake. MR review threads could not be read (HTTP 401), so this is not a complete review and does not establish that no unresolved threads exist.

Issue: https://www.drupal.org/project/drupal/issues/3615469
MR: https://git.drupalcode.org/project/drupal/-/merge_requests/16609

## Review

The current MR moves page inside the user login link in SiteMaintenanceModeForm and updates SiteMaintenanceTest to expect user login page. It changes two files. The visible sentence and destination do not change. The permission link is unchanged. There is no API, schema, database update, or JavaScript change.

Recommendation: favor the complete user login page link phrase as a small usability improvement. Retain the existing functional test change. An exact link-text assertion paired with the expected destination would strengthen the test against a future longer matching label. No additional core patch is included here: the lab tests the current MR unchanged.

Comments #10 and #12 narrow the reported speech problem to real iOS VoiceOver and report that both candidate wordings fix it. Those are contributor reports, not independent results from this session. Desktop WebKit and synthetic Guidepup cannot establish the real iOS result.

Do not assume the original string fails WCAG 2.4.4: that criterion allows programmatically determined context, including an enclosing sentence. Complete link text improves links-list navigation, but a short link is not automatically a failure. Source: https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html

Comment #4 requests subsystem maintainer review of the interface text convention for quoted page references. The wording decision remains with maintainers. The new translatable source string requires translation updates; existing translations are not tested here. A separate permission-link change is omitted to keep this review focused.

## Start here

[REPRODUCE.md](REPRODUCE.md) contains commands for the existing Before/After comparison lab and instructions to stop the prior pair and clear viewer settings. [variants.json](variants.json) defines pinned and latest pairs. [BRANCHES.md](BRANCHES.md) records the current MR patch and exact revisions. [STATUS.md](STATUS.md) records the issue snapshot and review gaps. [EVIDENCE.md](EVIDENCE.md) preserves the historical Before-only evidence and adds the current validation limits.

Recipe: [repro_3615469](../../../recipes/repro_3615469/recipe.yml). This deliberately makes no site changes: Standard already provides the maintenance form. Replay: [evaluate-3615469.mjs](../../../tools/playwright/evaluate-3615469.mjs). It records names, descriptions, destinations, real Tab navigation, simulated reading, screenshots, and axe for both sites.

The older CODER-PROMPT.md describes an independent manual build. Use REPRODUCE.md for this registered comparison pair. Historical screenreader results remain historical, not current evidence for the MR.

Generated with the help of an LLM.
