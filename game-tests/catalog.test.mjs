import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILDER_CATALOG, BUILDER_COUNT } from '../game/builder-catalog.js';
import { SHAPES, triggerBoxes } from '../game/config.js';

test('the internal builder library contains the complete approved 100 ideas', () => {
 assert.equal(BUILDER_COUNT, 100);
 assert.equal(new Set(BUILDER_CATALOG.map(entry => entry.id)).size, 100);
 assert.equal(SHAPES.tunnel, undefined);
 assert.equal(BUILDER_CATALOG.some(entry => entry.base === 'tunnel'), false);
 for (const entry of BUILDER_CATALOG) {
  assert.ok(entry.name && entry.group && entry.behavior && entry.profile, entry.id);
  assert.ok(['universal', 'open', 'semi-enclosed', 'enclosed'].includes(entry.profile), entry.id);
  assert.ok(['entity', 'pickup'].includes(entry.kind), entry.id);
  if (entry.kind === 'entity') assert.ok(SHAPES[entry.base], `${entry.id} maps to ${entry.base}`);
}
for (const [type, shape] of Object.entries(SHAPES)) {
 for (const [x, y, w, h] of shape.solids || []) {
  assert.ok(x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= shape.width + 1 && y + h <= shape.height + 1, `${type} solid bounds`);
 }
 for (const box of triggerBoxes({ type, x: 0, y: 0 })) {
  assert.ok(box.x >= 0 && box.y >= 0 && box.w > 0 && box.h > 0, `${type} trigger bounds`);
  assert.ok(box.x + box.w <= shape.width + 1 && box.y + box.h <= shape.height + 1, `${type} trigger footprint`);
 }
}
});
