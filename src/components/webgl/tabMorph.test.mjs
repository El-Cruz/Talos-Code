import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tabTarget, blendWeights } from './tabMorph.ts';
import { bakeTabShapes } from './bakeTabShapes.ts';

test('tab destinations select shape, desktop side and terminal zoom', () => {
  assert.equal(tabTarget('SYSTEM', false).shape, 'pc');
  assert.equal(tabTarget('ARCHIVE', false).shape, 'database');
  assert.ok(tabTarget('ARCHIVE', false).position[0] > 0);
  assert.equal(tabTarget('CORE', false).shape, 'atom');
  assert.ok(tabTarget('CORE', false).position[0] < 0);
  assert.equal(tabTarget('TERMINAL', false).shape, 'pc');
  assert.ok(tabTarget('TERMINAL', false).scale > tabTarget('SYSTEM', false).scale * 2);
  for (const tab of ['SYSTEM','ARCHIVE','CORE','TERMINAL']) assert.equal(tabTarget(tab, true).position[0], 0);
});
test('an interrupted morph rebases continuously from the currently visible mixture', () => {
  const visible = blendWeights([1,0,0], [0,1,0], .4);
  assert.deepEqual(blendWeights(visible, [0,0,1], 0), visible);
  assert.deepEqual(blendWeights(visible, [0,0,1], 1), [0,0,1]);
});
test('database and atom clouds are deterministic, finite and geometrically different', () => {
  const a = bakeTabShapes(2000), b = bakeTabShapes(2000);
  assert.deepEqual(a,b);
  assert.equal(a.database.length,8000);assert.equal(a.atom.length,8000);
  assert.ok(a.database.every(Number.isFinite));assert.ok(a.atom.every(Number.isFinite));
  assert.notDeepEqual(a.database,a.atom);
});
