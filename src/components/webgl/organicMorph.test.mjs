import { test } from 'node:test';
import assert from 'node:assert/strict';
import { morphAmplitude } from './organicMorph.ts';

test('organic displacement vanishes at both endpoints and peaks during reordering', () => {
  assert.equal(morphAmplitude(0), 0);
  assert.equal(morphAmplitude(1), 0);
  assert.equal(morphAmplitude(.5), .22);
  assert.equal(morphAmplitude(3), 0);
});

test('retargeting carries visible curvature without accumulating unbounded motion', () => {
  let amplitude = 0;
  for (let i = 0; i < 1000; i++) {
    const next = morphAmplitude(.3, amplitude);
    assert.equal(morphAmplitude(0, next), next);
    assert.equal(morphAmplitude(1, next), 0);
    assert.ok(Number.isFinite(next) && next < 1.18);
    amplitude = next;
  }
});
