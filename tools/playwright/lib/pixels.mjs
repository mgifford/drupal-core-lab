/**
 * Rendered-pixel helpers for Lab evaluators.
 *
 * A non-empty `mask-image` or `background-image` computed value does not prove
 * that an icon is visible: the image can fail to load, the mask can be fully
 * transparent, or the painted colour can match the background. These helpers
 * read the actual screenshot of an element and decide whether it contains a
 * distinguishable icon (WCAG contrast of at least 3:1 against the dominant
 * colour).
 *
 * PNGs are decoded in Node with zlib, so no helper browser page is needed (a
 * helper page was crashing under load and added a round-trip per screenshot).
 */
import zlib from 'node:zlib';
import { createHash } from 'node:crypto';

/** Decode an 8-bit RGB/RGBA non-interlaced PNG (the format Chromium screenshots use). */
export function decodePNG(buf) {
  if (buf.length < 8 || buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let pos = 8;
  let width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    pos += 12 + len;
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
  }
  const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  if (bitDepth !== 8 || interlace !== 0 || !bpp) throw new Error(`unsupported PNG: depth ${bitDepth}, colour type ${colorType}, interlace ${interlace}`);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * bpp;
  if (raw.length < height * (stride + 1)) throw new Error('PNG data is truncated');
  const data = Buffer.alloc(height * stride);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const cur = Buffer.alloc(stride);
    for (let x = 0; x < stride; x += 1) {
      const a = x >= bpp ? cur[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      if (filter === 1) v = (v + a) & 255;
      else if (filter === 2) v = (v + b) & 255;
      else if (filter === 3) v = (v + ((a + b) >> 1)) & 255;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255;
      } else if (filter !== 0) throw new Error(`unknown PNG filter ${filter}`);
      cur[x] = v;
    }
    cur.copy(data, y * stride);
    prev = cur;
  }
  return { width, height, bpp, data };
}

export function luminance([r, g, b]) {
  const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

export class Pixels {
  /** @param {import('playwright').Page} [_page] kept for call-site compatibility; decoding happens in Node. */
  constructor(_page) { /* no helper page needed */ }

  /**
   * Count distinct colours in a PNG buffer.
   * `inset` ignores an N-pixel frame, so a 1px border drawn by the parent item
   * cannot be mistaken for icon pixels (element screenshots round fractional
   * coordinates and can pick up the neighbouring border).
   */
  async colours(buffer, { inset = 0 } = {}) {
    const { width, height, bpp, data } = decodePNG(buffer);
    const counts = new Map();
    let total = 0;
    for (let y = inset; y < height - inset; y += 1) {
      for (let x = inset; x < width - inset; x += 1) {
        const i = (y * width + x) * bpp;
        if (bpp === 4 && data[i + 3] < 128) continue;
        const key = `${data[i]},${data[i + 1]},${data[i + 2]}`;
        counts.set(key, (counts.get(key) || 0) + 1);
        total += 1;
      }
    }
    if (!total) return [];
    return [...counts.entries()]
      .map(([key, n]) => ({ rgb: key.split(',').map(Number), share: n / total }))
      .sort((a, b) => b.share - a.share);
  }

  /**
   * A hash of the decoded pixels inside an inset frame, so two captures that
   * differ only by sub-pixel rounding at the element's edge compare equal.
   * `screenshotHash` stays available as the raw-bytes hash.
   */
  pixelHash(buffer, { inset = 2 } = {}) {
    const { width, height, bpp, data } = decodePNG(buffer);
    const hash = createHash('sha256');
    hash.update(`${width - inset * 2}x${height - inset * 2}:`);
    for (let y = inset; y < height - inset; y += 1) {
      hash.update(data.subarray((y * width + inset) * bpp, (y * width + width - inset) * bpp));
    }
    return hash.digest('hex').slice(0, 16);
  }

  /** Visible = a pixel group at least 0.1% of the box (or 2px) at >= 3:1 against the dominant colour. */
  static visible(colours) {
    if (!colours.length) return { visible: false, dominant: null, icon: null, distinctColours: 0 };
    const dominant = colours[0];
    let best = null;
    for (const c of colours.slice(1)) {
      if (c.share < 0.001) continue;
      const ratio = contrast(dominant.rgb, c.rgb);
      if (ratio >= 3 && (!best || ratio > best.contrast)) best = { colour: c.rgb, contrast: +ratio.toFixed(2), share: +c.share.toFixed(4) };
    }
    return { visible: !!best, dominant: dominant.rgb, dominantShare: +dominant.share.toFixed(4), icon: best, distinctColours: colours.length };
  }

  /** Photograph one element and say whether it renders a distinguishable icon. */
  async measure(locator, { inset = 1, knownInvisible = false } = {}) {
    const buffer = await locator.screenshot();
    const colours = await this.colours(buffer, { inset });
    const measured = Pixels.visible(colours);
    return { ...measured, knownInvisible, negativeControlPass: !knownInvisible || !measured.icon };
  }
}
