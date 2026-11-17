import test from 'node:test';
import assert from 'node:assert/strict';
import { ribbonProblems } from '../../tools/playwright/lib/unpublished-ribbon.mjs';

const triangle = () => ({
  content: '""', width: 12, height: 12, borderWidth: 12, color: 'rgb(86, 56, 161)', anchored: true,
  inlineStartWidth: 12, physicalStartWidth: 12, physicalEndWidth: 0, inlineStartTransparent: true,
});
const entity = (kind = 'node') => ({
  kind, unpublished: true, markerCount: 1, borderWidth: kind === 'node' ? 4 : 3,
  direction: 'ltr', borderColor: 'rgb(86, 56, 161)', background: [244, 240, 250, 1],
  corner: triangle(),
  marker: {
    text: 'Unpublished', rect: { width: 120, height: 32 }, position: 'static',
    row: {}, flush: true, overflowsEntity: false, contentGap: 16, contrast: 8,
    background: 'rgb(86, 56, 161)',
    triangle: triangle(),
  },
});

test('nested entities need independent status and surfaces', () => {
  const node = entity();
  const comment = { ...entity('comment'), background: [237, 229, 249, 1] };
  assert.deepEqual(ribbonProblems({ entities: [node, comment] }), []);
  assert.match(ribbonProblems({ entities: [node, { ...comment, background: node.background }] }).join(), /surface/);
  assert.match(ribbonProblems({ entities: [node, { ...comment, unpublished: false }] }).join(), /incorrect local status count/);
});

test('wrapped labels need space for the triangle and must stay inside the entity', () => {
  const node = entity();
  node.marker.contentGap = 2;
  node.marker.overflowsEntity = true;
  node.marker.triangle.anchored = false;
  assert.match(ribbonProblems({ entities: [node] }).join(), /overlaps following content/);
  assert.match(ribbonProblems({ entities: [node] }).join(), /overflows its entity/);
  assert.match(ribbonProblems({ entities: [node] }).join(), /anchored below/);
});

test('RTL geometry and forced-colour borders are measured, not inferred from a label', () => {
  const node = entity();
  node.direction = 'rtl';
  node.marker.triangle.physicalStartWidth = 0;
  node.marker.triangle.physicalEndWidth = 12;
  assert.match(ribbonProblems({ entities: [node] }).join(), /mirror/);
  node.marker.triangle.physicalStartWidth = 12;
  node.marker.triangle.physicalEndWidth = 0;
  node.marker.triangle.borderWidth = 0;
  assert.match(ribbonProblems({ entities: [node], forcedColors: true }).join(), /real border/);
});

test('unmeasured contrast is not a passing contrast result', () => {
  const node = entity();
  node.marker.contrast = null;
  assert.match(ribbonProblems({ entities: [node] }).join(), /unmeasured/);
  assert.deepEqual(ribbonProblems({ entities: [{ kind: 'node', unpublished: false, markerCount: 0, borderWidth: 0 }] }), []);
});

test('forced-colour triangles need a Canvas half, not two CanvasText halves', () => {
  const node = entity();
  node.borderColor = node.marker.triangle.color = 'rgb(0, 0, 0)';
  node.marker.triangle.inlineStartTransparent = false;
  node.marker.triangle.inlineStartColor = [0, 0, 0, 1];
  const snapshot = { entities: [node], forcedColors: true, canvas: [255, 255, 255, 1] };
  assert.match(ribbonProblems(snapshot).join(), /mirror/);
  node.marker.triangle.inlineStartColor = [255, 255, 255, 1];
  assert.deepEqual(ribbonProblems(snapshot), []);
  node.marker.triangle.color = 'rgb(255, 255, 255)';
  assert.match(ribbonProblems(snapshot).join(), /triangle and rail use different colours/);
});
