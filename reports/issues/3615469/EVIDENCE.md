# #3615469: evidence

**DRAFT.** Recorded by the lab on 2026-10-16. Not reviewed by a person yet.

## The string is still unfixed in core (checked from core's history, not from drupal.org)

On 2026-10-16, `main` (`9faf7e2a`) and `11.x` (`4a3b0586`) on the GitHub mirror of core still have, in
`core/modules/system/src/Form/SiteMaintenanceModeForm.php` line 89:

    ... Authorized users can log in directly via the <a href=":user-login">user login</a> page.

No commit since 2026-07-01 mentions #3615469 (`git log --grep=3615469`, history fetched with `--shallow-since=2026-07-01`). The
file's last changes were unrelated (#3614964, #3589342, #3584793).

## Before: the rendered description and what a screen reader gets

Run `screenreader/2026-10-16T11-28-49-633Z-before/` (`node tools/playwright/linktext-3615469.mjs --side before ...`).
Environment: Drupal core `11.x` at `4a3b0586`, whose `SiteMaintenanceModeForm.php` is identical to `main` at `9faf7e2a`
(`git diff`; `SiteMaintenanceTest.php` differs only by one doc comment, and its line 78 assertion is the same); PHP 8.3.6 with `php -S` and SQLite; Standard
install, Default Admin theme; Chromium 141.0.7390.37 (Playwright); Guidepup virtual screen reader over a jsdom snapshot (synthetic,
the lab's agreed standard; not a real VoiceOver or NVDA run). Logged in as user 1 with a one-time link.

The checkbox "Put site into maintenance mode" has `aria-describedby="edit-maintenance-mode--description"`, so its description is
read with it. The description:

    Visitors will only see the maintenance mode message. Only users with the "Use the site in maintenance mode"
    <a href="/admin/people/permissions">permission</a> will be able to access the site. Authorized users can log in directly via
    the <a href="/user/login">user login</a> page.

| Link name | Goes to | Text right after it |
|---|---|---|
| "permission" | `/admin/people/permissions` | `" will be able to access "` (starts with a space) |
| "user login" | `/user/login` | `" page. "` (starts with a space) |

The virtual screen reader, reading the description: "Visitors will only see … maintenance mode"", "link, permission",
"will be able to access the site. Authorized users can log in directly via the", "link, user login", "page.".

In the page's whole links list (43 names, what a screen reader's links list offers out of context) the two appear as "permission"
and "user login", next to names such as "Log out", "View profile" and "Maintenance mode".

What this shows: the HTML puts a space between the link and "page", and the synthetic reader announces them as separate phrases.
It does **not** show how a real screen reader reads them; whether one runs them together ("user loginpage", as the issue title
says) depends on the screen reader, its version and the browser, and was not tested (lab rule 7).

## After

Not tested: needs the merge request's diff (`CODER-PROMPT.md`, step 2) or network access to git.drupalcode.org from the lab.


## Comparison package added 2026-10-16

DRAFT. The historical Before-only evidence above is preserved. It does not establish current After behavior.

The issue, 14 fetched comments, current MR diff, metadata, and interface text guidance were read. MR discussion threads were inaccessible (HTTP 401). The MR's two-file diff is stored unchanged and pinned in BRANCHES.md. No new Drupal runtime, axe, browser keyboard, PHPUnit, or real screen reader test was run in this session. DDEV is not installed here.

The new replay distinguishes link-name verification from the actual iOS speech claim. The standard schema verdict reproduced-and-fixed refers only to the tested link-text change. SiteMaintenanceTest, browser runs, manual focus, iOS speech, and translations remain pending.


Static integration checks: PASS for the unchanged MR patch applying to the full pinned core checkout (89973d2da24ffbae29903502e585bd66bd57ba06); replay syntax; both variant definitions; viewer probe syntax; coverage matrices; recipe YAML; and tracked diff whitespace. The recipe is a declared no-op, not a runtime-tested Drupal application. Runtime remains NOT RUN.
