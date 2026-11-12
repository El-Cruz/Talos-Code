export type CloudPoint = {x:number;y:number;z:number};
export const PARTICLES=1600;
/** Fixed seed and orthographic projection: never depend on device dimensions. */
export function createClouds():CloudPoint[][] {
  let seed=92731;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  return [0,1,2].map(shape=>{
    const points:CloudPoint[]=[];
    const grid=new Map<string,CloudPoint[]>();
    while(points.length<PARTICLES) {
      let x=0,y=0,z=0;
      const u=random(),v=random(),w=random();
      if(shape===0) {
        if(u<.68) {x=40+400*v;y=20+280*w;z=random()*32;
          if(x>68&&x<412&&y>44&&y<270) continue;
        } else if(u<.77) {x=210+60*v;y=300+25*w;z=random()*18;}
        else if(u<.84) {x=160+160*v;y=325+14*w;z=random()*12;}
        else {y=362+58*w;x=64-36*w+(352+72*w)*v;z=random()*14;}
      } else if(shape===1) {
        const angle=v*Math.PI*2,level=Math.floor(u*3);
        z=Math.sin(angle)*65;x=240+Math.cos(angle)*166;
        y=80+level*100+w*72+z*.32;
        if(w<.18) {const radius=Math.sqrt(random());x=240+Math.cos(angle)*166*radius;y=80+level*100+Math.sin(angle)*38*radius;z=45+radius*20;}
      } else {
        const angle=v*Math.PI*2;
        if(u<.22) {const radius=32*Math.sqrt(w);x=240+Math.cos(angle)*radius;y=220+Math.sin(angle)*radius;z=Math.sqrt(Math.max(0,1024-radius*radius));}
        else {const rotation=Math.floor((u-.22)/.26)*Math.PI/3;const a=Math.cos(angle)*(178+random()*14),b=Math.sin(angle)*(53+random()*14);x=240+a*Math.cos(rotation)-b*Math.sin(rotation);y=220+a*Math.sin(rotation)+b*Math.cos(rotation);z=Math.sin(angle)*55;}
      }
      if(shape===0) {x+=z*.45;y-=z*.2;if(x>68&&x<412&&y>44&&y<270) continue;}
      // Minimum projected spacing makes silhouettes dotted rather than continuous.
      const gx=Math.floor(x/3),gy=Math.floor(y/3);let close=false;
      for(let dx=-1;dx<=1;dx++) for(let dy=-1;dy<=1;dy++) for(const p of grid.get(`${gx+dx},${gy+dy}`)||[]) if(Math.hypot(p.x-x,p.y-y)<2.4) close=true;
      if(close) continue;
      const p={x,y,z};points.push(p);const key=`${gx},${gy}`;const cell=grid.get(key)||[];cell.push(p);grid.set(key,cell);
    }
    return points;
  });
}
/** Symmetric nearest-neighbour radius cap leaves a visible gap after projection. */
export function separatedRadii(points:readonly {x:number;y:number}[],radius:number):Float32Array {
  const size=radius*3,grid=new Map<string,number[]>(),radii=new Float32Array(points.length).fill(radius);
  points.forEach((p,i)=>{const gx=Math.floor(p.x/size),gy=Math.floor(p.y/size);
    for(let dx=-1;dx<=1;dx++) for(let dy=-1;dy<=1;dy++) for(const j of grid.get(`${gx+dx},${gy+dy}`)||[]) {
      const limit=Math.hypot(p.x-points[j].x,p.y-points[j].y)*.35;
      radii[i]=Math.min(radii[i],limit);radii[j]=Math.min(radii[j],limit);
    }
    const key=`${gx},${gy}`,cell=grid.get(key)||[];cell.push(i);grid.set(key,cell);
  });return radii;
}
/** A bounded neighbour correction prevents tight clusters during morphing. */
export function separatePositions(points:{x:number;y:number}[],distance=2.4) {
  const grid=new Map<string,number[]>();
  for(let i=0;i<points.length;i++) {
    const p=points[i],gx=Math.floor(p.x/distance),gy=Math.floor(p.y/distance);
    for(let dx=-1;dx<=1;dx++) for(let dy=-1;dy<=1;dy++) for(const j of grid.get(`${gx+dx},${gy+dy}`)||[]) {
      const q=points[j],x=p.x-q.x,y=p.y-q.y,d=Math.hypot(x,y);
      if(d>=distance) continue;
      const angle=i*2.399+j, nx=d ? x/d : Math.cos(angle),ny=d ? y/d : Math.sin(angle),push=(distance-d)*.25;
      p.x+=nx*push;p.y+=ny*push;q.x-=nx*push;q.y-=ny*push;
    }
    const key=`${gx},${gy}`,cell=grid.get(key)||[];cell.push(i);grid.set(key,cell);
  }
}
