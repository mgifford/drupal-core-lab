import { JSDOM } from 'jsdom';
import { virtual } from '@guidepup/virtual-screen-reader';

// Synthetic speech over markup captured from the site, not an operating-system screen reader.
export async function statusSpeech(html) {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`, { pretendToBeVisual: true });
  const keys = ['window', 'document', 'Node', 'getComputedStyle'];
  const previous = keys.map((key) => Object.getOwnPropertyDescriptor(globalThis, key));
  let started = false;
  try {
    Object.assign(globalThis, {
      window: dom.window, document: dom.window.document, Node: dom.window.Node,
      getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
    });
    await virtual.start({ container: dom.window.document.body });
    started = true;
    for (let i = 0; i < 100 && await virtual.lastSpokenPhrase() !== 'end of document'; i++) await virtual.next();
    if (await virtual.lastSpokenPhrase() !== 'end of document') throw new Error('Guidepup did not finish reading the status snapshot');
    return await virtual.spokenPhraseLog();
  } finally {
    if (started) await virtual.stop();
    dom.window.close();
    for (const [i, key] of keys.entries()) {
      if (previous[i]) Object.defineProperty(globalThis, key, previous[i]);
      else delete globalThis[key];
    }
  }
}

export async function checkStatusSnapshot({ kind, unpublished, markers }, side) {
  const expected = side === 'after' && unpublished;
  const phrases = markers.length ? await statusSpeech(markers.map((m) => m.html).join('')) : [];
  const speech = phrases.join(' ').replace(/\s+/g, ' ');
  const sentence = `This ${kind} is Unpublished`;
  return {
    kind, unpublished, markers, phrases,
    good: expected
      ? markers.length === 1 && markers[0].visibleText === 'Unpublished' && markers[0].visible
        && markers[0].contextHidden && speech.includes(sentence)
        && speech.split('Unpublished').length - 1 === 1
      : markers.length === 0 && !speech.includes('Unpublished'),
  };
}

export async function checkPageSpeech(page, spec, side) {
  const snapshots = await page.evaluate((spec) => {
    const node = document.querySelector('article.node');
    if (!node) throw new Error('Fixture node is missing');
    const snapshot = (root, kind, unpublished) => ({
      kind, unpublished,
      markers: [...root.querySelectorAll('.unpublished-status')]
        .filter((el) => kind === 'comment' || !el.closest('.js-comment'))
        .map((el) => {
          const copy = el.cloneNode(true);
          copy.querySelectorAll('.visually-hidden').forEach((hidden) => hidden.remove());
          const context = el.querySelector('.visually-hidden');
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return {
            html: el.outerHTML, visibleText: copy.textContent.trim(),
            visible: rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility === 'visible' && Number(style.opacity) > 0,
            contextHidden: !!context && getComputedStyle(context).position === 'absolute' && context.getBoundingClientRect().width <= 1,
          };
        }),
    });
    const snapshots = [snapshot(node, 'node', spec.unpublished)];
    for (const [state, title] of Object.entries(spec.comments || {})) {
      const comment = [...document.querySelectorAll('article.js-comment')].find((c) => c.querySelector('h3, h2')?.textContent.includes(title));
      if (!comment) throw new Error(`Fixture comment is missing: ${title}`);
      snapshots.push(snapshot(comment, 'comment', state === 'held'));
    }
    return snapshots;
  }, spec);
  const checks = [];
  for (const snapshot of snapshots) checks.push(await checkStatusSnapshot(snapshot, side));
  return checks;
}
