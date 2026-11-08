import type { Tab } from './tabMorph';

export type Point = { x: number; y: number };
export type Layout = Point & { scale: number };
export const SCENE_TABS: Tab[] = ['SYSTEM','ARCHIVE','CORE','TERMINAL'];
export const SCREEN = { x: 72, y: 48, width: 336, height: 218 };
export const DURATION = 1000;
const smooth = (t: number) => t*t*(3-2*t);

// All shapes occupy the same 480 × 440 coordinate system. SVG and particles
// consume these very same polylines; quality never changes their geometry.
const line = (...xy: number[]): Point[] => Array.from({length:xy.length/2},(_,i)=>({x:xy[i*2],y:xy[i*2+1]}));
const rect = (x:number,y:number,w:number,h:number) => line(x,y,x+w,y,x+w,y+h,x,y+h,x,y);
const ellipse = (cx:number,cy:number,rx:number,ry:number,angle=0) => Array.from({length:97},(_,i)=> {
  const t=i/96*Math.PI*2, x=Math.cos(t)*rx,y=Math.sin(t)*ry;
  return {x:cx+x*Math.cos(angle)-y*Math.sin(angle),y:cy+x*Math.sin(angle)+y*Math.cos(angle)};
});
const pc = [rect(40,20,400,280),rect(SCREEN.x,SCREEN.y,SCREEN.width,SCREEN.height),
  line(440,20,458,34,458,292,440,300),rect(210,300,60,25),rect(160,325,160,14),
  line(64,362,416,362,452,420,28,420,64,362),rect(175,403,130,7)];
for(let row=0;row<3;row++) for(let col=0;col<13;col++) pc.push(rect(76+col*25-row*7,371+row*10,18,5));
for(let i=0;i<9;i++) pc.push(line(65+i*10,281,70+i*10,281));
pc.push(rect(391,280,12,5));
const database = [ellipse(240,80,170,45),line(70,80,70,340),line(410,80,410,340)];
for(const y of [160,250,340]) database.push(ellipse(240,y,170,45));
const atom = [ellipse(240,220,190,65),ellipse(240,220,190,65,Math.PI/3),ellipse(240,220,190,65,-Math.PI/3),ellipse(240,220,24,24)];
export const GEOMETRY = [pc,database,atom];

export function sceneLayout(width:number,height:number,tab:Tab):Layout {
  const mobile=width<768, terminal=tab==='TERMINAL';
  const top=mobile ? 148 : 150;
  const bottom=terminal || !mobile ? height-64 : Math.max(top+80,height*.49);
  const availableWidth=terminal || mobile ? width-32 : width*.54;
  const scale=Math.max(.05,Math.min(availableWidth/480,(bottom-top)/440,terminal ? 1.65 : 1.4));
  const centerX=terminal || mobile ? width/2 : width*(tab==='CORE' ? .29 : .73);
  return {x:centerX-240*scale,y:top+Math.max(0,(bottom-top-440*scale)/2),scale};
}
export function screenBounds(layout:Layout) {
  return {x:layout.x+SCREEN.x*layout.scale,y:layout.y+SCREEN.y*layout.scale,width:SCREEN.width*layout.scale,height:SCREEN.height*layout.scale};
}

export class SceneTransition {
  private from:number[];
  private to:number[];
  private velocity=[0,0,0,0];
  private start=0;
  private id=0;
  constructor(tab:Tab) { this.from=SCENE_TABS.map(t=>Number(t===tab));this.to=[...this.from]; }
  request(tab:Tab,id:number,now:number) {
    const visible=this.sample(now);this.from=visible.tabs;this.velocity=visible.velocity;
    this.to=SCENE_TABS.map(t=>Number(t===tab));this.start=now;this.id=id;
  }
  sample(now:number,reduced=false) {
    if(reduced) {this.velocity=[0,0,0,0];this.from=[...this.to];this.start=now-DURATION;}
    const progress=reduced ? 1 : Math.min(1,Math.max(0,(now-this.start)/DURATION));
    const t=smooth(progress),h=progress*(1-progress)**2;
    const tabs=this.from.map((v,i)=>v+(this.to[i]-v)*t+this.velocity[i]*DURATION*h);
    const velocity=this.from.map((v,i)=>(this.to[i]-v)*6*progress*(1-progress)/DURATION+this.velocity[i]*(1-4*progress+3*progress*progress));
    return {tabs,velocity,weights:[tabs[0]+tabs[3],tabs[1],tabs[2]],id:this.id,progress,complete:progress===1};
  }
}

export function pointerOffset(base:Point,pointer:Point & {active:boolean},previous:Point,dt:number,reduced:boolean):Point {
  if(reduced) return {x:0,y:0};
  const dx=base.x-pointer.x,dy=base.y-pointer.y,distance=Math.hypot(dx,dy);
  const force=pointer.active ? Math.max(0,1-distance/100)**2*65 : 0;
  const blend=1-Math.exp(-dt*12);
  return {x:previous.x+((distance ? dx/distance : 1)*force-previous.x)*blend,
    y:previous.y+((distance ? dy/distance : 0)*force-previous.y)*blend};
}
export function adaptQuality(quality:number,frameMs:number) {
  return Math.max(.35,Math.min(1,quality+(frameMs>23 ? -.1 : frameMs<18 ? .05 : 0)));
}

export function sampleGeometry(count:number) {
  return GEOMETRY.map(paths=> {
    const segments=paths.flatMap(path=>path.slice(1).map((end,i)=>({start:path[i],end,length:Math.hypot(end.x-path[i].x,end.y-path[i].y)})));
    const length=segments.reduce((sum,s)=>sum+s.length,0);
    return Array.from({length:count},(_,i)=> {
      // A low-discrepancy ordering preserves every contour when drawing a prefix.
      let distance=((i*.61803398875)%1)*length;
      for(const segment of segments) {
        if(distance<=segment.length) { const t=distance/segment.length;return {x:segment.start.x+(segment.end.x-segment.start.x)*t,y:segment.start.y+(segment.end.y-segment.start.y)*t}; }
        distance-=segment.length;
      }
      return segments[0].start;
    });
  });
}
