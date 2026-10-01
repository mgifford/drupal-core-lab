#!/usr/bin/env node
// Generates the Default Admin color-contrast matrix (CSV + HTML).
// Self-contained: no external deps (implements WCAG ratio + oklch internally).
// Run from repo root: node testing/default-admin-dark-mode-accent/verify-contrast.js
// Writes color-contrast-matrix.csv and color-contrast-matrix.html into this directory.
//
// Integrity contract: every generated row stores the EXACT foreground and
// background hex it was tested against, and the stored ratio is recomputed from
// that pair. This script re-verifies every row at the end and fails loudly if a
// row's stored ratio does not match contrast(fg, bg). The accent tests are
// split into two separate relationships that are never merged into one row:
//   - "text on accent fill": white text ON the accent fill colour.
//   - "accent fill vs adjacent surface": the accent fill AGAINST a surface.
// Each relationship uses its own displayed foreground/background pair.

const fs = require('fs');
const path = require('path');

const srgbToLinear = (v) => {
  v /= 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};

function hexToRgb(h) {
  h = h.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function hexToOklch(hex) {
  let [r, g, b] = hexToRgb(hex).map(srgbToLinear);
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const lc = Math.cbrt(l), mc = Math.cbrt(m), sc = Math.cbrt(s);
  const L = 0.2104542553 * lc + 0.7936177850 * mc - 0.0040720468 * sc;
  const A = 1.9779984951 * lc - 2.4285922050 * mc + 0.4505937099 * sc;
  const B = 0.0259040371 * lc + 0.7827717662 * mc - 0.8086757660 * sc;
  const C = Math.sqrt(A * A + B * B);
  let H = Math.atan2(B, A) * 180 / Math.PI;
  if (H < 0) H += 360;
  return { L, A, B, C, H };
}

function oklchToHex(L, C, H) {
  const hrad = H * Math.PI / 180;
  const A = C * Math.cos(hrad), B = C * Math.sin(hrad);
  const lc = L + 0.3963377774 * A + 0.2158037573 * B;
  const mc = L - 0.1055613458 * A - 0.0638541728 * B;
  const sc = L - 0.0894841775 * A - 1.2914855480 * B;
  const l = lc * lc * lc, m = mc * mc * mc, s = sc * sc * sc;
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const b = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  const conv = (v) => {
    const x = v > 0.0031308 ? 1.055 * Math.pow(v, 1 / 2.4) - 0.055 : 12.92 * v;
    return Math.max(0, Math.min(255, Math.round(x * 255))).toString(16).padStart(2, '0');
  };
  return '#' + conv(r) + conv(g) + conv(b);
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a, b) {
  const l1 = luminance(a), l2 = luminance(b);
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Accent presets mirror Helper::accentColors(). These are the source values;
// the dark-mode fill and foreground are derived from them by the oklch() math
// below (which mirrors the CSS --admin-color-accent-base / --admin-color-accent-fg).
const presets = {
  blue: '#0047ab',
  cerulean: '#006b8f', teal: '#006b5e', green: '#08783e', olive: '#5d6b1c',
  yellow: '#765c00', orange: '#9b4b00', red: '#a83218', pink: '#8d3b75',
  purple: '#5e3b9e',
  custom: '#000000',
};
const WHITE = '#ffffff';
const TEXT_THRESHOLD = 4.5;   // WCAG 1.4.3 text
const UI_THRESHOLD = 3.0;     // WCAG 1.4.11 non-text contrast (adjacent surfaces)
const lightBgs = { '#ffffff': 'white', '#fefeff': 'off-white' };
const darkBgs = { '#1b1b1d': 'main', '#2a2a2d': 'surface', '#3b3b3f': 'nested', '#47474c': 'raised', '#2d3755': 'toolbar' };
const linkLight = '#003ecc', linkDark = '#99b8ff', linkHoverLight = '#0036b1';
const focusLight = '#003ecc', focusDark = '#99b8ff';

const rows = [];
function add(row) { rows.push(row); }

for (const [name, hex] of Object.entries(presets)) {
  const { L, C, H } = hexToOklch(hex);
  // Dark-mode accent fill (solid button/radio background) — OKLCH, mirrors CSS.
  const fillHex = oklchToHex(L * 0.45, C * 0.9, H);
  // Dark-mode accent foreground (links / active states) — OKLCH, mirrors CSS.
  const fgHex = oklchToHex(Math.max(L * 1.5, 0.93), C * 1.1, H);

  // Light source accent on white surfaces.
  for (const [bgHex, bgLabel] of Object.entries(lightBgs)) {
    const w = contrastRatio(hex, bgHex);
    add({ preset: name, mode: 'light', transform: 'source', fg: hex, desc: `source on ${bgLabel}`, bg: bgHex, bgLabel, ratio: w, pass: w >= TEXT_THRESHOLD, threshold: TEXT_THRESHOLD, rel: 'text-on-surface' });
  }

  // Relationship A — text on accent fill: white text rendered ON the fill.
  // Displayed fg is WHITE, displayed bg is the FILL. Ratio is contrast(white, fill).
  const wTextFill = contrastRatio(WHITE, fillHex);
  add({ preset: name, mode: 'dark', transform: 'fill(l*0.45)', fg: WHITE, desc: `white text on accent fill ${fillHex}`, bg: fillHex, bgLabel: 'accent-fill', ratio: wTextFill, pass: wTextFill >= TEXT_THRESHOLD, threshold: TEXT_THRESHOLD, rel: 'text-on-fill' });

  // Relationship B — accent fill against each adjacent dark surface.
  // Displayed fg is the FILL, displayed bg is the surface. Ratio is contrast(fill, surface).
  for (const [bgHex, bgLabel] of Object.entries(darkBgs)) {
    const wFill = contrastRatio(fillHex, bgHex);
    add({ preset: name, mode: 'dark', transform: 'fill(l*0.45)', fg: fillHex, desc: `accent fill vs ${bgLabel}`, bg: bgHex, bgLabel, ratio: wFill, pass: wFill >= UI_THRESHOLD, threshold: UI_THRESHOLD, rel: 'fill-vs-surface' });
  }

  // Accent foreground (text/link) on each dark surface.
  for (const [bgHex, bgLabel] of Object.entries(darkBgs)) {
    const w = contrastRatio(fgHex, bgHex);
    add({ preset: name, mode: 'dark', transform: 'fg', fg: fgHex, desc: `fg on ${bgLabel}`, bg: bgHex, bgLabel, ratio: w, pass: w >= TEXT_THRESHOLD, threshold: TEXT_THRESHOLD, rel: 'text-on-surface' });
  }

  // High contrast accent (informational; HC architecture is out of scope).
  const hcLight = oklchToHex(L * 0.70, C, H);
  for (const [bgHex, bgLabel] of Object.entries(lightBgs)) {
    const w = contrastRatio(hcLight, bgHex);
    add({ preset: name, mode: 'HC-light', transform: 'hc(fg l*0.70)', fg: hcLight, desc: `HC fg on ${bgLabel}`, bg: bgHex, bgLabel, ratio: w, pass: w >= 7, threshold: 7, rel: 'text-on-surface' });
  }
  const wHcDark = contrastRatio(fgHex, '#000000');
  add({ preset: name, mode: 'HC-dark', transform: 'hc(fg)', fg: fgHex, desc: 'HC fg on black', bg: '#000000', bgLabel: 'black', ratio: wHcDark, pass: wHcDark >= 7, threshold: 7, rel: 'text-on-surface' });
}

for (const [bgHex, bgLabel] of Object.entries(lightBgs)) {
  const wl = contrastRatio(linkLight, bgHex);
  add({ preset: 'link', mode: 'light', transform: 'source', fg: linkLight, desc: `link on ${bgLabel}`, bg: bgHex, bgLabel, ratio: wl, pass: wl >= TEXT_THRESHOLD, threshold: TEXT_THRESHOLD, rel: 'text-on-surface' });
  const wh = contrastRatio(linkHoverLight, bgHex);
  add({ preset: 'link-hover', mode: 'light', transform: 'source', fg: linkHoverLight, desc: `link-hover on ${bgLabel}`, bg: bgHex, bgLabel, ratio: wh, pass: wh >= TEXT_THRESHOLD, threshold: TEXT_THRESHOLD, rel: 'text-on-surface' });
  const wf = contrastRatio(focusLight, bgHex);
  add({ preset: 'focus', mode: 'light', transform: 'source', fg: focusLight, desc: `focus on ${bgLabel}`, bg: bgHex, bgLabel, ratio: wf, pass: wf >= UI_THRESHOLD, threshold: UI_THRESHOLD, rel: 'ui-on-surface' });
}
for (const [bgHex, bgLabel] of Object.entries(darkBgs)) {
  const wl = contrastRatio(linkDark, bgHex);
  add({ preset: 'link', mode: 'dark', transform: 'source', fg: linkDark, desc: `link on ${bgLabel}`, bg: bgHex, bgLabel, ratio: wl, pass: wl >= TEXT_THRESHOLD, threshold: TEXT_THRESHOLD, rel: 'text-on-surface' });
  const wf = contrastRatio(focusDark, bgHex);
  add({ preset: 'focus', mode: 'dark', transform: 'source', fg: focusDark, desc: `focus on ${bgLabel}`, bg: bgHex, bgLabel, ratio: wf, pass: wf >= UI_THRESHOLD, threshold: UI_THRESHOLD, rel: 'ui-on-surface' });
}
// Old broken combo for reference (regression documentation only).
const wOld = contrastRatio('#0029a5', '#2d3755');
add({ preset: 'focus-OLD', mode: 'dark', transform: 'source', fg: '#0029a5', desc: 'OLD focus on toolbar (broken)', bg: '#2d3755', bgLabel: 'toolbar', ratio: wOld, pass: wOld >= UI_THRESHOLD, threshold: UI_THRESHOLD, rel: 'ui-on-surface' });

// Integrity check: every row must derive its ratio from its displayed fg/bg pair.
for (const r of rows) {
  const recomputed = contrastRatio(r.fg, r.bg);
  const passDerived = recomputed >= r.threshold;
  if (Math.abs(recomputed - r.ratio) > 1e-9) {
    console.error(`INTEGRITY FAIL: row ${r.preset}/${r.mode} (${r.fg} on ${r.bg}) stored ${r.ratio} but contrast(fg,bg)=${recomputed}`);
    process.exit(1);
  }
  if (passDerived !== r.pass) {
    console.error(`INTEGRITY FAIL: row ${r.preset}/${r.mode} pass derived from ratio (${passDerived}) differs from stored (${r.pass})`);
    process.exit(1);
  }
}

function csvEscape(v) { if (typeof v === 'string' && v.includes(',')) return '"' + v + '"'; return v; }

// CSV — includes the exact fg, exact bg, relationship, threshold, and unrounded ratio.
const header = ['preset', 'mode', 'transform', 'relationship', 'fg_hex', 'fg_description', 'background', 'mode_label', 'threshold', 'wcag_ratio', 'wcag_pass'];
const lines = [header.join(',')];
for (const r of rows) {
  lines.push([r.preset, r.mode, r.transform, r.rel, r.fg, r.desc, r.bg, r.bgLabel, r.threshold, r.ratio.toFixed(4), r.pass ? 'PASS' : 'FAIL'].map(csvEscape).join(','));
}
fs.writeFileSync(path.join(__dirname, 'color-contrast-matrix.csv'), lines.join('\n') + '\n');

// HTML
const swatch = (hex) => `<span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:${hex};border:1px solid #888;vertical-align:middle"></span> ${hex.toLowerCase()}`;
const trs = rows.map((r) => {
  const cls = r.pass ? 'pass' : 'fail';
  return `<tr class="${cls}">
    <td>${r.preset}</td><td>${r.mode}</td><td>${r.transform}</td><td>${r.rel}</td>
    <td class="mono">${swatch(r.fg)}</td><td>${r.desc}</td>
    <td class="mono">${r.bgLabel} ${r.bg.toLowerCase()}</td>
    <td class="num">${r.ratio.toFixed(4)}</td><td class="num">≥${r.threshold}</td>
    <td><span class="tag">${r.pass ? 'PASS' : 'FAIL'}</span></td>
  </tr>`;
}).join('\n');
const total = rows.length, passes = rows.filter((r) => r.pass).length, fails = total - passes;
const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Default Admin — Color Contrast Matrix</title>
<style>
  :root{color-scheme:light dark}body{font-family:-apple-system,system-ui,"Segoe UI",Roboto,sans-serif;margin:2rem;line-height:1.4}
  h1{font-size:1.4rem;margin:0 0 .25rem}.meta{color:#666;font-size:.85rem;margin-bottom:1rem}
  input[type=text]{width:280px;padding:.4rem .6rem;margin-bottom:1rem;border:1px solid #888;border-radius:6px}
  table{border-collapse:collapse;font-size:.85rem}th,td{text-align:left;padding:.35rem .6rem;border:1px solid #ccc}
  th{background:#111;color:#fff;position:sticky;top:0}.num{text-align:right}.mono{font-family:monospace}
  tr.pass{background:rgba(0,180,0,.08)}tr.fail{background:rgba(220,0,0,.1)}
  .tag{font-weight:700;padding:.1rem .4rem;border-radius:4px;font-size:.75rem}
  tr.pass .tag{color:#0a6;background:rgba(0,180,0,.15)}tr.fail .tag{color:#c00;background:rgba(220,0,0,.15)}
  .summary{margin-bottom:1rem}.summary b{font-size:1.1rem}
</style></head><body>
<h1>Default Admin — Color Contrast Matrix</h1>
<div class="meta">WCAG 2.1/2.2 contrast ratios. ${total} checks. Generated ${new Date().toISOString().slice(0,10)}. Each row's ratio is computed from the exact foreground/background pair shown (integrity-verified).</div>
<div class="summary">PASS <b>${passes}</b> &nbsp;·&nbsp; FAIL <b>${fails}</b> &nbsp;·&nbsp; relationship: text-on-fill / fill-vs-surface / text-on-surface / ui-on-surface.</div>
<input type="text" id="filter" placeholder="Filter by preset / mode / background…" oninput="f(this.value)">
<table id="matrix"><thead><tr><th>preset</th><th>mode</th><th>transform</th><th>relationship</th><th>fg</th><th>description</th><th>background</th><th>ratio</th><th>threshold</th><th>result</th></tr></thead>
<tbody>${trs}</tbody></table>
<script>
function f(q){q=(q||'').toLowerCase();document.querySelectorAll('#matrix tbody tr').forEach(function(tr){tr.style.display=tr.textContent.toLowerCase().indexOf(q)>-1?'':'none';});}
</script>
</body></html>`;
fs.writeFileSync(path.join(__dirname, 'color-contrast-matrix.html'), html);

console.log(`Wrote color-contrast-matrix.csv (${lines.length} rows) and color-contrast-matrix.html (${total} checks, ${passes} pass / ${fails} fail). Integrity checked for all ${rows.length} rows.`);
