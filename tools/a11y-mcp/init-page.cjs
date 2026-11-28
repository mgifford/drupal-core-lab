'use strict';
// Playwright MCP `--init-page` hook (CommonJS entry point, because the MCP server `require()`s this file).
//
// The work is in tools/playwright/lib/a11y/mcp-hook.mjs, where the lab's Playwright dependencies live. This file exists
// so .mcp.json can point at a stable, tiny entry point.
//
// Loaded for every tab the MCP server opens, before the first navigation. It adds the approved page helper and the lab's
// interaction recorder, exposes one narrow binding, and runs engines on the page the MCP already has open.
let hook = null;
module.exports.default = async function labInitPage({ page }) {
  if (!hook) hook = await import('../playwright/lib/a11y/mcp-hook.mjs');
  return hook.initMCPPage({ page });
};
