import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bootState, heroPose } from './bootSequence.ts';

test('destruction precedes ignition and organic assembly before title readiness', () => {
  assert.equal(bootState(499).stage, 'DESTROYED');
  assert.equal(bootState(500).stage, 'IGNITION');
  assert.equal(bootState(849).stage, 'IGNITION');
  assert.equal(bootState(850).stage, 'ASSEMBLING');
  assert.equal(bootState(2349).stage, 'ASSEMBLING');
  assert.equal(bootState(2350).stage, 'ASSEMBLED');
  assert.equal(bootState(2350).scatter, 0);
  assert.equal(bootState(2350).illumination, 1);
  assert.equal(bootState(499).scatter, 1);
});

test('boot is continuous and only a title-ready clock can rotate the hero', () => {
  for (const boundary of [500, 850, 2350]) {
    const before = bootState(boundary - .001), after = bootState(boundary);
    assert.ok(Math.abs(before.scatter - after.scatter) < .00001);
    assert.ok(Math.abs(before.illumination - after.illumination) < .00001);
    assert.ok(Math.abs(before.driftTime - after.driftTime) < .00001);
  }
  assert.deepEqual(bootState(-100), bootState(0));
  assert.equal(bootState(5000).driftTime, bootState(2350).driftTime);
  assert.equal(heroPose(null), 0);
  assert.equal(heroPose(0), 0);
  assert.equal(heroPose(500), .5);
  assert.equal(heroPose(1000), 1);
  assert.equal(heroPose(5000), 1);
});
