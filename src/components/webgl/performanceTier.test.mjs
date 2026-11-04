import assert from 'node:assert/strict';
import { test } from 'node:test';
import { selectPerformanceTier } from './performanceTier.ts';
test('narrow screens and mobile user agents stay at 65K, including landscape phones', () => {
 for (const input of [{width:390,cores:16},{width:767,cores:32},{width:1024,cores:8,mobile:true}]) {
  const tier=selectPerformanceTier(input);
  assert.equal(tier.particleSize**2,65536);assert.equal(tier.pressureIterations,2);assert.equal(tier.fluidSize,64);
 }
});
test('standard laptops and unknown hardware default to 262K',()=>{
 for(const input of [{width:1366,cores:8},{width:1920},{width:1920,cores:16,memory:4},{width:768}]) {
  assert.equal(selectPerformanceTier(input).particleSize**2,262144);
 }
});
test('wide desktops with enough CPU and memory can opt into 1M',()=>{
 const tier=selectPerformanceTier({width:1920,cores:16,memory:16});
 assert.equal(tier.particleSize**2,1048576);assert.equal(tier.pressureIterations,5);
});
