import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chooseRenderingTier } from './renderingTier.ts';

test('only verified dedicated, capable desktop GPUs use accelerated tiers', () => {
  const desktop = { mobile: false, limited: false, dedicated: true };
  assert.equal(chooseRenderingTier({ ...desktop, webgpu: true, webgl2: true }), 1);
  assert.equal(chooseRenderingTier({ ...desktop, webgpu: false, webgl2: true }), 2);
  assert.equal(chooseRenderingTier({ ...desktop, webgpu: false, webgl2: false }), 3);
  assert.equal(chooseRenderingTier({ ...desktop, mobile: true, webgpu: true }), 3);
  assert.equal(chooseRenderingTier({ ...desktop, limited: true, webgpu: true }), 3);
  assert.equal(chooseRenderingTier({ ...desktop, dedicated: false, webgpu: true }), 3);
});
