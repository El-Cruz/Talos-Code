import assert from 'node:assert/strict';
import { test } from 'node:test';
import { burstValue, loadingState } from './burstTransition.ts';
test('ease-out explosion, bullet-time, ease-in return finish at 1.5s',()=>{
 const t={start:0,from:0};
 assert.equal(burstValue(t,0),0);
 assert.equal(burstValue(t,250),.9375);
 assert.equal(burstValue(t,500),1);
 assert.equal(burstValue(t,749),1);
 assert.equal(burstValue(t,1125),.75);
 assert.equal(burstValue(t,1500),0);
 assert.equal(burstValue(t,3000),0);
});
test('retrigger preserves current displacement',()=>{
 const from=burstValue({start:0,from:0},1000);
 assert.equal(burstValue({start:1000,from},1000),from);
});
test('loading stages and reconstruction boundaries',()=>{
 assert.deepEqual(loadingState(0),{stage:'FLOATING',progress:1});
 assert.equal(loadingState(499).stage,'FLOATING');
 assert.deepEqual(loadingState(500),{stage:'BUILDING',progress:1});
 assert.deepEqual(loadingState(875),{stage:'BUILDING',progress:.75});
 assert.deepEqual(loadingState(1250),{stage:'HOLD',progress:0});
 assert.equal(loadingState(1999).stage,'HOLD');
 assert.equal(loadingState(2000).stage,'UI_ACTIVE');
});
