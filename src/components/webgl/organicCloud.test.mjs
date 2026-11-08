import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as cloud from './organicCloud.ts';
test('surface clouds have stable identities and depth',()=>{assert.equal(typeof cloud.createClouds,'function');const a=cloud.createClouds();assert.deepEqual(a,cloud.createClouds());for(const points of a){assert.equal(points.length,1600);assert.ok(points.every(p=>Number.isFinite(p.z)));assert.ok(new Set(points.map(p=>p.z)).size>20);}});
test('projected disks stay separate even when morph positions collide',()=>{assert.equal(typeof cloud.separatedRadii,'function');const points=[{x:0,y:0},{x:1,y:0},{x:1,y:0},{x:20,y:20}];const r=cloud.separatedRadii(points,1);assert.equal(r[1],0);assert.equal(r[2],0);assert.ok(r[0]+r[1]<1);assert.equal(r[3],1);});
