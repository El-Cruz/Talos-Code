import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addVideoIntent, stepVideoIntent } from './videoIntent.ts';

test('intent accumulates bounded velocity and playback remains forward at 1x–1.5x', () => {
  let intent = 0, rate = 1;
  for (let i = 0; i < 120; i++) {
    intent = addVideoIntent(intent, 100, 1 / 60);
    ({ intent, rate } = stepVideoIntent(intent, rate, 1 / 60));
    assert.ok(intent >= 0 && intent <= 1 && rate >= 1 && rate <= 1.5);
  }
  assert.ok(rate > 1.4);
  for (let i = 0; i < 300; i++) ({ intent, rate } = stepVideoIntent(intent, rate, 1 / 60));
  assert.ok(intent < .00001 && Math.abs(rate - 1) < .00001);
});

test('smoothing is similar at 30/60/120Hz and clamps stalled frames', () => {
  const rates = [30, 60, 120].map(hz => {
    let state = { intent: 1, rate: 1 };
    for (let i = 0; i < hz; i++) state = stepVideoIntent(state.intent, state.rate, 1 / hz);
    return state.rate;
  });
  assert.ok(Math.max(...rates) - Math.min(...rates) < .003);
  assert.deepEqual(stepVideoIntent(1, 1, 30), stepVideoIntent(1, 1, .1));
});
