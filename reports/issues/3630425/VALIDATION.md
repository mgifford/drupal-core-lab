# Validation: #3630425 main port and Lab comparison

- Main pin: dbfce851242d5b082adb8ed14634b4bc9cce374b, fetched from official core main on 2026-10-16.
- Upstream MR head: f1f524f922765807ab99442782cc2aec2f521a18, target 11.4.x. Exact 829-byte MR diff retained.
- PASS: Lab setup.mjs --check-patches for 3630425-pinned (full main port) and 3630425-mr-only (unchanged published diff).
- PASS: applying published MR + local interdiff yields exactly the same tree as the full main port: 7f0f1842464e2522f494da0b58e033c8e22bb866.
- PASS: core working-tree git diff --check for production and test changes.
- PASS: all recipe/config YAML files parse. Config actions and core widget button names checked against pinned main source.
- PASS: all viewer checks in all three variants pass the Lab's probe safety validator.
- PASS: generated Coder prompt is current; evaluator and validation scripts pass JavaScript syntax checks.
- PASS: axe empty-table-header rule exists, enabled, tagged best-practice. Evaluator explicitly requests it rather than relying on WCAG tags.
- Coverage: zero of six live environments tested here. No live results, screenshots or manual logs are manufactured.

Not run: recipe application, live widget/AJAX evaluation, PHPUnit, PHP syntax/PHPCS/PHPStan, full core lint, keyboard or screen-reader testing. This environment has no PHP, Docker, DDEV or installed browser. Proposed PHPUnit coverage is included but unverified. The recipe also needs its first real application in DDEV.

The MR discussion API returned HTTP 401. Review feedback is based on the issue's eight comments, related-issue metadata, current code and MR diff, not a claim to have read unavailable MR discussions. Nothing was pushed, retargeted or posted remotely.
