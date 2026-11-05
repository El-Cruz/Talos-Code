import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createParticleSeeds, nextResolutionScale } from './tier3Particles.ts';

test('allocates exactly 12,000 independent normalized particle seeds', () => {
  const seeds = createParticleSeeds();
  assert.equal(seeds.length, 12000 * 3);
  assert.ok(seeds.every(v => Number.isFinite(v) && v >= 0 && v < 1));
  const positions = new Set();
  for (let i = 0; i < seeds.length; i += 3) positions.add(`${seeds[i]},${seeds[i + 1]}`);
  assert.equal(positions.size, 12000);
});

test('GPU budget reduces resolution and ultimately disables the overlay', () => {
  assert.equal(nextResolutionScale(1, 3.5), 1);
  assert.ok(nextResolutionScale(1, 5) < 1);
  let scale = 1;
  for (let i = 0; i < 10; i++) scale = nextResolutionScale(scale, 8);
  assert.equal(scale, 0);
});
