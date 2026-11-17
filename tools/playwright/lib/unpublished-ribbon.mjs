// Geometry/colour evidence, not a human visual or assistive-technology verdict.
export async function ribbonSnapshot(page) {
  return page.evaluate(() => {
    const node = document.querySelector('article.node');
    if (!node) throw new Error('Fixture node is missing');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const rgba = (color) => {
      if (!CSS.supports('color', color)) throw new Error(`Unsupported computed colour: ${color}`);
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      return [r, g, b, a / 255];
    };
    const over = (fg, bg) => [...fg.slice(0, 3).map((c, i) => c * fg[3] + bg[i] * (1 - fg[3])), 1];
    const background = (el) => {
      const layers = [];
      for (let e = el; e; e = e.parentElement) layers.unshift(rgba(getComputedStyle(e).backgroundColor));
      return layers.reduce((bg, fg) => over(fg, bg), [255, 255, 255, 1]);
    };
    const luminance = (rgb) => rgb.slice(0, 3).map((c) => c / 255).map((c) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
      .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
    const contrast = (a, b) => {
      const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };
    const rect = (el) => {
      const { top, right, bottom, left, width, height } = el.getBoundingClientRect();
      return { top, right, bottom, left, width, height };
    };
    const triangle = (el, corner = false) => {
      const s = getComputedStyle(el, '::after');
      const direction = getComputedStyle(el).direction;
      const bordersX = parseFloat(s.borderLeftWidth) + parseFloat(s.borderRightWidth);
      const bordersY = parseFloat(s.borderTopWidth) + parseFloat(s.borderBottomWidth);
      return {
        content: s.content, clipPath: s.clipPath, background: s.backgroundColor,
        boxSizing: s.boxSizing,
        width: s.boxSizing === 'border-box' ? Math.max(parseFloat(s.width), bordersX) : parseFloat(s.width) + bordersX,
        height: s.boxSizing === 'border-box' ? Math.max(parseFloat(s.height), bordersY) : parseFloat(s.height) + bordersY,
        color: corner ? s.borderBlockEndColor : s.borderBlockStartColor,
        borderWidth: parseFloat(corner ? s.borderBlockEndWidth : s.borderBlockStartWidth),
        inlineStartWidth: parseFloat(s.borderInlineStartWidth),
        physicalStartWidth: parseFloat(direction === 'rtl' ? s.borderRightWidth : s.borderLeftWidth),
        physicalEndWidth: parseFloat(direction === 'rtl' ? s.borderLeftWidth : s.borderRightWidth),
        inlineStartTransparent: rgba(s.borderInlineStartColor)[3] === 0,
        inlineStartColor: rgba(s.borderInlineStartColor),
        anchored: s.position === 'absolute' && parseFloat(s.insetInlineEnd) === 0
          && (corner ? parseFloat(s.insetBlockEnd) === 0 : Math.abs(parseFloat(s.insetBlockStart) - el.clientHeight) <= 1),
      };
    };
    return {
      lang: document.documentElement.lang, dir: document.documentElement.dir,
      forcedColors: matchMedia('(forced-colors: active)').matches,
      canvas: rgba('Canvas'),
      entities: [node, ...node.querySelectorAll('article.js-comment')].map((el) => {
        const kind = el === node ? 'node' : 'comment';
        const s = getComputedStyle(el);
        const markers = [...el.querySelectorAll('.unpublished-status')].filter((m) => m.closest('article') === el);
        const marker = markers[0];
        const row = marker?.closest('.unpublished-status-row');
        const ms = marker && getComputedStyle(marker);
        const mr = marker && rect(marker);
        const er = rect(el);
        const following = [];
        for (let e = row?.nextElementSibling; e; e = e.nextElementSibling) {
          const style = getComputedStyle(e);
          const box = rect(e);
          if (box.width > 0 && box.height > 0 && !['absolute', 'fixed'].includes(style.position) && style.visibility === 'visible') following.push(box.top);
        }
        const markerBg = marker && background(marker);
        const opacity = [];
        for (let e = marker; e; e = e.parentElement) if (Number(getComputedStyle(e).opacity) !== 1) opacity.push(getComputedStyle(e).opacity);
        const markerText = marker?.cloneNode(true);
        markerText?.querySelectorAll('.visually-hidden').forEach((hidden) => hidden.remove());
        return {
          kind, unpublished: el.matches('.node--unpublished, .comment--unpublished, .unpublished'),
          classes: el.className, rect: er, direction: s.direction,
          forcedColorAdjust: s.forcedColorAdjust,
          background: background(el), borderColor: s.borderInlineEndColor,
          borderWidth: parseFloat(s.borderInlineEndWidth), overflow: el.scrollWidth > el.clientWidth + 1,
          markerCount: markers.length, corner: triangle(el, true),
          marker: marker ? {
            text: markerText.textContent.trim(), rect: mr, row: row && rect(row),
            position: ms.position, background: ms.backgroundColor, color: ms.color,
            forcedColorAdjust: ms.forcedColorAdjust,
            contrast: opacity.length ? null : contrast(over(rgba(ms.color), markerBg), markerBg),
            opacity, triangle: triangle(marker),
            flush: Math.abs((s.direction === 'rtl' ? mr.left - er.left : er.right - mr.right) - parseFloat(s.borderInlineEndWidth)) <= 1,
            contentGap: following.length ? Math.min(...following) - mr.bottom : null,
            overflowsEntity: mr.left < er.left - 1 || mr.right > er.right + 1,
          } : null,
        };
      }),
    };
  });
}

export function ribbonProblems(snapshot) {
  const problems = [];
  for (const [i, entity] of snapshot.entities.entries()) {
    const label = `${entity.kind}[${i}]`;
    const add = (condition, message) => { if (!condition) problems.push(`${label}: ${message}`); };
    add(entity.markerCount === (entity.unpublished ? 1 : 0), 'incorrect local status count');
    if (!entity.unpublished) {
      add(entity.borderWidth < 3, 'published entity has an unpublished-size rail');
      continue;
    }
    add(entity.borderWidth === (entity.kind === 'node' ? 4 : 3), 'incorrect rail width');
    add(!entity.overflow, 'entity content overflows horizontally');
    const m = entity.marker;
    if (!m) continue;
    add(m.text.length > 0 && m.rect.width > 0 && m.rect.height > 0, 'status text is not visible');
    add(m.position !== 'absolute' && m.position !== 'fixed' && !!m.row, 'ribbon does not reserve flow space');
    add(m.flush, 'ribbon is not flush with inline-end rail');
    add(!m.overflowsEntity, 'ribbon overflows its entity');
    add(m.contentGap === null || m.contentGap >= m.triangle.height - 1, 'triangle or ribbon overlaps following content');
    add(m.contrast !== null && m.contrast >= 4.5, 'status contrast is unmeasured or below 4.5:1');
    if (!snapshot.forcedColors) {
      add(m.background === entity.borderColor, 'ribbon and rail use different colours');
    }
    add(m.triangle.color === entity.borderColor, 'triangle and rail use different colours');
    add(m.triangle.content !== 'none' && m.triangle.width > 0 && m.triangle.height > 0, 'ribbon triangle is missing');
    add(m.triangle.width === m.triangle.height, 'ribbon triangle is not 45 degrees');
    add(m.triangle.anchored, 'ribbon triangle is not anchored below inline-end');
    const mirrored = (t) => t.borderWidth === t.inlineStartWidth && t.physicalStartWidth === t.inlineStartWidth && t.physicalEndWidth === 0
      && (t.inlineStartTransparent || (snapshot.forcedColors && JSON.stringify(t.inlineStartColor) === JSON.stringify(snapshot.canvas)));
    add(mirrored(m.triangle), 'ribbon triangle does not mirror with text direction');
    if (snapshot.forcedColors) {
      add(entity.forcedColorAdjust !== 'none' && m.forcedColorAdjust !== 'none', 'status opts out of forced colours');
      add(m.triangle.borderWidth > 0, 'forced-colour triangle has no real border');
    }
    if (entity.kind === 'comment') {
      add(entity.corner.content !== 'none' && entity.corner.width > 0 && entity.corner.height > 0, 'comment bottom corner is missing');
      add(entity.corner.anchored, 'comment corner is not anchored at bottom inline-end');
      add(mirrored(entity.corner) && entity.corner.width === entity.corner.height, 'comment bottom corner does not mirror at 45 degrees');
      add(entity.corner.color === entity.borderColor, 'comment bottom corner and rail use different colours');
    }
  }
  const node = snapshot.entities[0];
  if (node?.unpublished && !snapshot.forcedColors) {
    for (const comment of snapshot.entities.slice(1)) {
      if (JSON.stringify(comment.background) === JSON.stringify(node.background)) problems.push('comment surface is indistinguishable from its unpublished parent');
    }
  }
  return problems;
}
