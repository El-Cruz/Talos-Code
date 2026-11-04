import assert from 'node:assert/strict';
import { test } from 'node:test';
import { burstValue } from './burstTransition.ts';

test('explodes continuously over 200ms and reforms over 1500ms', () => {
  const transition = { start: 1000, from: 0 };
  assert.equal(burstValue(transition, 1000), 0);
  assert.equal(burstValue(transition, 1100), 0.5);
  assert.equal(burstValue(transition, 1200), 1);
  assert.equal(burstValue(transition, 1950), 0.5);
  assert.equal(burstValue(transition, 2700), 0);
  assert.equal(burstValue(transition, 5000), 0);
});

test('retriggering continues from the current value without a jump', () => {
  const current = burstValue({ start: 1000, from: 0 }, 1600);
  const retrigger = { start: 1600, from: current };
  assert.equal(burstValue(retrigger, 1600), current);
  assert.ok(burstValue(retrigger, 1700) > current);
  assert.equal(burstValue(retrigger, 1800), 1);
});

test('idle and pre-start samples remain at their starting values', () => {
  assert.equal(burstValue({ start: -Infinity, from: 0 }, 1000), 0);
  assert.equal(burstValue({ start: 1000, from: 0.3 }, 999), 0.3);
});
