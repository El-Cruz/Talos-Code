import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as THREE from 'three';
import { pointerToNDC, createPointerProjector } from './pointerInteraction.ts';

test('mouse and touch CSS coordinates map to NDC without a DPR multiplier', () => {
  const rect = { left: 30, top: 50, width: 400, height: 800 };
  const ndc = new THREE.Vector2();
  assert.equal(pointerToNDC(230, 450, rect, ndc), true);
  assert.deepEqual(ndc.toArray(), [0, 0]);
  pointerToNDC(30, 50, rect, ndc);
  assert.deepEqual(ndc.toArray(), [-1, 1]);
  pointerToNDC(430, 850, rect, ndc);
  assert.deepEqual(ndc.toArray(), [1, -1]);
  assert.equal(pointerToNDC(29, 50, rect, ndc), false);
  assert.equal(pointerToNDC(30, 50, { ...rect, width: 0 }, ndc), false);
});

test('raycast hits the workstation and tracks the pointer after model/camera transforms', () => {
  const project = createPointerProjector();
  const camera = new THREE.PerspectiveCamera(40, 1.5, .1, 50);
  camera.position.set(0, 0, 9.5);
  camera.updateMatrixWorld();
  const model = new THREE.Object3D();
  model.updateMatrixWorld();
  const view = new THREE.Vector3();
  assert.equal(project(new THREE.Vector2(), camera, model.matrixWorld, view), true);
  assert.ok(Math.abs(view.z - (.86 - 9.5)) < 1e-6);

  model.position.x = .9;
  model.rotation.set(.08, -.35, 0);
  model.updateMatrixWorld();
  camera.lookAt(0, -.45, 0);
  camera.updateMatrixWorld();
  // Monitor, keyboard, mouse and empty background all remain under the pointer.
  for (const target of [[0, 0, .86], [-.12, -1.87, 1.35], [1.55, -1.82, 1.4], [-4, 3, 0]]) {
    const clip = new THREE.Vector3(...target).applyMatrix4(model.matrixWorld).project(camera);
    const ndc = new THREE.Vector2(clip.x, clip.y);
    assert.equal(project(ndc, camera, model.matrixWorld, view), true);
    assert.ok(view.z < 0);
    const projected = view.clone().applyMatrix4(camera.projectionMatrix);
    assert.ok(Math.abs(projected.x - ndc.x) < 1e-6);
    assert.ok(Math.abs(projected.y - ndc.y) < 1e-6);
  }
});
