import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bootState } from './bootSequence.ts';

test('boot waits 500ms then explodes, freezes and assembles for exactly 1.5 seconds', () => {
  assert.equal(bootState(499).stage, 'QUANTUM_GALAXY');
  assert.equal(bootState(500).stage, 'DATA_EXPLOSION');
  assert.equal(bootState(999).stage, 'DATA_EXPLOSION');
  assert.equal(bootState(1000).stage, 'QUANTUM_FREEZE');
  assert.equal(bootState(1249).stage, 'QUANTUM_FREEZE');
  assert.equal(bootState(1250).stage, 'MAGNETIC_REASSEMBLY');
  assert.equal(bootState(1999).stage, 'MAGNETIC_REASSEMBLY');
  assert.equal(bootState(2000).stage, 'UI_ACTIVE');
  assert.equal(bootState(2000).scatter, 0);
  assert.equal(bootState(2000).explosion, 0);
});

test('explosion is rapid, freeze slows drift 50x, and reassembly is continuous', () => {
  assert.ok(bootState(750).explosion > .9);
  assert.equal(bootState(1000).explosion, 1);
  assert.equal(bootState(1249).explosion, 1);
  const floatingSpeed = (bootState(400).driftTime - bootState(300).driftTime) / .1;
  const freezeSpeed = (bootState(1200).driftTime - bootState(1100).driftTime) / .1;
  assert.ok(Math.abs(freezeSpeed / floatingSpeed - .02) < 1e-9);
  for (const boundary of [500, 1000, 1250, 2000]) {
    const before = bootState(boundary - .001), after = bootState(boundary);
    assert.ok(Math.abs(before.scatter - after.scatter) < .00001);
    assert.ok(Math.abs(before.explosion - after.explosion) < .00001);
    assert.ok(Math.abs(before.driftTime - after.driftTime) < .00001);
  }
  assert.deepEqual(bootState(-100), bootState(0));
  assert.equal(bootState(5000).driftTime, bootState(2000).driftTime);
});
