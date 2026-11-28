// Drupal AJAX responses, summarised. Shared by lib/lab-run.mjs (scripted evaluators) and the checkpoint bridge, so a
// checkpoint and a run describe the same response the same way.
export const AJAX_URL = /_wrapper_format=drupal_ajax|ajax_form=1|element_parents=/;

export const stripTags = (s) => String(s ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

// One command of a Drupal AJAX response: what it does, to which element, and (for a message) which type and text.
export const summariseCommand = (c) => ({
  command: c.command,
  method: c.method ?? null,
  selector: c.selector ?? null,
  messageWrapperQuerySelector: c.messageWrapperQuerySelector ?? null,
  clearPrevious: c.clearPrevious ?? null,
  messageType: c.messageOptions?.type ?? null,
  message: c.message != null ? stripTags(c.message).slice(0, 300) : null,
  dataBytes: typeof c.data === 'string' ? c.data.length : null,
  dataLiveRoles: typeof c.data === 'string' ? [...new Set([...c.data.matchAll(/role="(alert|status|log)"|aria-live="(polite|assertive)"/g)].map((m) => m[1] || m[2]))] : [],
});

// A response is a list of commands; `url` is the path plus the parameter names (values are never kept).
export const summariseAjaxResponse = (url, status, commands) => {
  const p = new URL(url);
  const where = p.pathname + (p.search ? '?' + [...new Set(p.searchParams.keys())].join('&') : '');
  return { url: where, status, commands: (Array.isArray(commands) ? commands : []).map(summariseCommand) };
};

// The raw command list for the side file, with oversized markup cut so the file stays readable.
export const limitRawCommands = (commands, max = 20000) => (Array.isArray(commands) ? commands : []).map((c) => (typeof c.data === 'string' && c.data.length > max ? { ...c, data: c.data.slice(0, max) + '…(cut)' } : c));
