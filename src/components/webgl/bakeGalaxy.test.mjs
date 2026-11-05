import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bakeGalaxy } from './bakeGalaxy.ts';

test('galaxy seeds are deterministic and fill the viewport without correlated stripes', () => {
  const data = bakeGalaxy(10000);
  assert.deepEqual(data, bakeGalaxy(10000));
  assert.ok(data.every(v => Number.isFinite(v) && v >= 0 && v < 1));
  const bins = new Uint32Array(48);
  for (let i = 0; i < data.length; i += 4) bins[Math.floor(data[i] * 8) + Math.floor(data[i + 1] * 6) * 8]++;
  assert.ok(bins.every(n => n > 140 && n < 280));
});
