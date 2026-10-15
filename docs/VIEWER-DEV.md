# Changing the viewer (`tools/compare/index.html`, `serve.mjs`)

Moved out of `AGENTS.md` on 2026-10-15 so that file, which every session loads, stays short (AI-usage option C: scope the starting context). The text is unchanged except where noted.

- The same `index.html` is the local viewer and the GitHub Pages guide. An element that needs the server (frames, logins, axe, Lighthouse,
  checks) must carry `data-needs="live"`; server URLs are relative (no leading `/`). Then run `node scripts/build-cloud.mjs` and commit `cloud/`
  (CI fails if it is stale). Do not edit `cloud/` by hand.
- Security: the viewer is reachable by any page the owner visits. New API actions must be POST and go through the Host/Origin guard in `serve.mjs`; never post to a frame with `'*'` (use `toFrame`); never relax `frame-ancestors`. Run `node tools/playwright/viewer-security.mjs`.
- Optional extras default **off**; user choices live in `localStorage` only (`compare.prefs`). Never add accounts or server-side storage.
- The script injected into the proxied pages is a template literal in `serve.mjs`: double the backslashes in regexes, no backticks or `${}`.
- The conditions toolbar keeps Device width, Colour mode and Compare as always visible; the rest sit in popovers (`details.pop`: Conditions, Input, Audits, plus Tools in the top bar). Tests must open a popover (`summary:has-text("Input")`) before using a control inside it, and press Escape to close it before touching the frames. Results live in the dock (`#dock`, tabs `#tab-steps`, `#tab-checks`, `#tab-manual`, `#tab-axe`, `#tab-lh`, `#tab-env`); click the tab before reading a result. Keep every element id: the script and the tests depend on them. Layout proposal and rationale: `docs/ui-proposal/index.html`. A new control belongs in the block that matches its job; keep the top bar for page navigation.
- Verify with real input: `node tools/playwright/mirror-drag.mjs` (viewer must be running), plus `node scripts/doctor.mjs`.
- Cloud (DDEV Coder workspaces) is an opt-in path, partly built and tested: `tools/compare/cloud/README.md` (browser-first setup, smoke check, status table), `scripts/cloud-bootstrap.mjs`, `scripts/cloud-smoke.mjs`; the original proposal is `docs/CLOUD-PLAN.md`. Create workspaces in the web UI at https://coder.ddev.com/workspaces (or from a template at https://coder.ddev.com/templates). Local use is unchanged. Do not sign in to Coder, create or change workspaces, or publish anything without the user.
