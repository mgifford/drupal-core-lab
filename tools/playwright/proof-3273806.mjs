// #3273806 proof: render the toolbar orientation ("push") icon on the toolbar
// background at the old and new colours, compute the WCAG non-text contrast
// ratio in the page, and screenshot it. Not a Drupal run -- a focused,
// deterministic proof of the colour change ahead of the full DDEV before/after.
//   node tools/playwright/proof-3273806.mjs
// Output: reports/issues/3273806/proof/contrast-before-after.png (+ ratios on stdout)
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { labRoot } from '../compare/lib.mjs';

const out = path.join(labRoot, 'reports/issues/3273806/proof');
fs.mkdirSync(out, { recursive: true });

// The push-left glyph from the toolbar module (icons/<colour>/push-left.svg);
// the three push icons differ only by path, and all share the same fill colour.
const PATH = "M2.5 2h-2.491v12.029h2.491c.276 0 .5-.225.5-.5v-11.029c0-.276-.224-.5-.5-.5zM14.502 6.029h-4c-.275 0-.5-.225-.5-.5v-1c0-.275-.16-.341-.354-.146l-3.294 3.292c-.194.194-.194.513 0 .708l3.294 3.293c.188.193.354.129.354-.146v-1c0-.271.227-.5.5-.5h4c.275 0 .5-.225.5-.5v-3c0-.276-.225-.501-.5-.501z";
const svg = (fill) => `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'><g><path fill='${fill}' d='${PATH}'/></g></svg>`;
const BG = '#f5f5f5';        // toolbar background the reporter measured
const OLD = '#bebebe';       // rgb(190,190,190) -- the failing rest-state colour
const NEW = '#787878';       // the darker variant already used on hover/focus

const html = `<!doctype html><meta charset="utf-8"><body style="margin:0;font:14px system-ui;background:#fff">
<div id="panel" style="display:flex;gap:0;width:760px">
  ${[['Before', OLD], ['After', NEW]].map(([label, fill]) => `
  <div style="flex:1;padding:24px;text-align:center;background:${BG};border:1px solid #ddd">
    <div style="font-weight:600;margin-bottom:12px">${label}: icon ${fill} on ${BG}</div>
    <div style="width:64px;height:64px;margin:0 auto;background:no-repeat center/48px url(&quot;data:image/svg+xml,${encodeURIComponent(svg(fill))}&quot;)"></div>
    <div data-fill="${fill}" class="ratio" style="margin-top:12px;font-size:18px"></div>
  </div>`).join('')}
</div></body>`;

const browser = await chromium.launch();
const page = await browser.newContext({ deviceScaleFactor: 2 }).then((c) => c.newPage());
await page.setContent(html, { waitUntil: 'load' });

const ratios = await page.evaluate((bg) => {
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const lum = (hex) => { const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const result = {};
  document.querySelectorAll('.ratio').forEach((el) => {
    const fill = el.getAttribute('data-fill');
    const r = Math.round(ratio(fill, bg) * 100) / 100;
    const pass = r >= 3;
    el.textContent = `${r}:1 ${pass ? '\u2713 passes 3:1' : '\u2717 fails 3:1'}`;
    el.style.color = pass ? '#0a7a28' : '#b4232c';
    result[fill] = { ratio: r, pass };
  });
  return result;
}, BG);

await page.locator('#panel').screenshot({ path: path.join(out, 'contrast-before-after.png') });
await browser.close();
fs.writeFileSync(path.join(out, 'contrast.json'), JSON.stringify({ background: BG, before: { color: OLD, ...ratios[OLD] }, after: { color: NEW, ...ratios[NEW] }, criterion: 'WCAG 2.2 SC 1.4.11 Non-text Contrast (3:1)' }, null, 2) + '\n');
console.log('Before', OLD, 'on', BG, '=>', ratios[OLD].ratio + ':1', ratios[OLD].pass ? 'pass' : 'FAIL');
console.log('After ', NEW, 'on', BG, '=>', ratios[NEW].ratio + ':1', ratios[NEW].pass ? 'pass' : 'FAIL');
console.log('Wrote', path.relative(labRoot, out) + '/contrast-before-after.png');
