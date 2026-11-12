import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bakeWorkstation } from './bakeWorkstation.ts';
test('baked targets are deterministic, finite and cover the workstation and ambient volume',()=>{
 const baked=bakeWorkstation(65536), second=bakeWorkstation(65536);
 assert.deepEqual(baked.targets,second.targets);
 let ambient=0, keyboard=0, mouse=0, screen=0;
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<baked.randoms.length;i++){
  const j=i*3,x=baked.targets[j],y=baked.targets[j+1],z=baked.targets[j+2];
  assert.ok(Number.isFinite(x+y+z));
  if(baked.randoms[i]>=.8){
   ambient++;[x,y,z].forEach((value,axis)=>{min[axis]=Math.min(min[axis],value);max[axis]=Math.max(max[axis],value);});
   assert.ok(x>=-10&&x<=10&&y>=-10&&y<=10&&z>=-15&&z<=5);
  }else{
   assert.ok(Math.abs(Math.hypot(...baked.normals.subarray(j,j+3))-1)<1e-6);
   if(y<-1.65&&z>.8&&x<1.2)keyboard++;
   if(x>1.25&&y<-1.5&&z>.8)mouse++;
   if(Math.abs(z-.54)<1e-6)screen++;
  }
 }
 assert.ok(ambient>12000&&ambient<14000);
 assert.ok(keyboard>3000&&mouse>500&&screen>5000);
 assert.ok(min[0]<-9.9&&max[0]>9.9&&min[1]<-9.9&&max[1]>9.9&&min[2]<-14.9&&max[2]>4.9);
});
