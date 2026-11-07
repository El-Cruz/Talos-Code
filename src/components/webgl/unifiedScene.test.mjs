import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as scene from './unifiedScene.ts';

test('the complete terminal and its inset screen fit portrait and landscape viewports', () => {
  assert.equal(typeof scene.sceneLayout, 'function');
  for (const [width, height] of [[320,568],[390,844],[768,1024],[1024,768],[1440,900],[844,390]]) {
    const layout = scene.sceneLayout(width,height,'TERMINAL');
    assert.ok(layout.x >= 16 && layout.y >= 120);
    assert.ok(layout.x + 480*layout.scale <= width-16+.01);
    assert.ok(layout.y + 440*layout.scale <= height-55+.01);
    const screen = scene.screenBounds(layout);
    assert.ok(screen.x > layout.x && screen.y > layout.y);
    assert.ok(screen.x+screen.width < layout.x+480*layout.scale);
  }
});

test('interrupting a transition preserves its visible pose and only finishes the latest request', () => {
  assert.equal(typeof scene.SceneTransition, 'function');
  const motion = new scene.SceneTransition('SYSTEM');
  motion.request('ARCHIVE',1,0);
  const halfway = motion.sample(400);
  motion.request('CORE',2,400);
  assert.deepEqual(motion.sample(400).weights, halfway.weights);
  assert.equal(motion.sample(1000).complete, false);
  assert.equal(motion.sample(1400).id,2);
  assert.equal(motion.sample(1400).complete,true);
  assert.deepEqual(motion.sample(1400).weights,[0,0,1]);
  motion.request('TERMINAL',3,1500);
  assert.equal(motion.sample(1500,true).complete,true);
  assert.deepEqual(motion.sample(1516,false).weights,[1,0,0], 'restoring motion must not rewind a completed reduced-motion transition');
});

test('repulsion is added to the current morph position and decays after release', () => {
  assert.equal(typeof scene.pointerOffset, 'function');
  const displaced = scene.pointerOffset({x:110,y:100},{x:100,y:100,active:true},{x:0,y:0},1/60,false);
  assert.ok(displaced.x > 0);
  let resting = displaced;
  for(let i=0;i<180;i++) resting = scene.pointerOffset({x:250,y:250},{x:100,y:100,active:false},resting,1/60,false);
  assert.ok(Math.abs(resting.x)<.01);
  assert.deepEqual(scene.pointerOffset({x:110,y:100},{x:100,y:100,active:true},displaced,1/60,true),{x:0,y:0});
});

test('frame pressure lowers drawing cost without changing geometry or timeline', () => {
  assert.equal(typeof scene.adaptQuality, 'function');
  assert.ok(scene.adaptQuality(1,35)<1);
  assert.ok(scene.adaptQuality(.5,12)>.5);
  assert.ok(scene.adaptQuality(.35,100)>=.35);
});
