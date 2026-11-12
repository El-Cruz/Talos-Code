"use client";

import { useEffect, useRef } from "react";
import type { MorphRequest } from "./tabMorph";
import { bootState } from "./bootSequence";
import { SCENE_TABS, SceneTransition, adaptQuality, pointerOffset, sceneLayout, screenBounds } from "./unifiedScene";

import { createClouds, separatePositions, separatedRadii, PARTICLES as COUNT } from "./organicCloud";
export function ParticleMonitor({ request, onMorphComplete, onReady, onScreenLayout, heroReady = false }: {
  request: Pick<MorphRequest, "id" | "tab">; onMorphComplete: (id: number) => void; onReady: () => void;
  onScreenLayout: (bounds: ReturnType<typeof screenBounds>) => void; heroReady?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef(() => {});
  const callbacks = useRef({ request, onMorphComplete, onReady, onScreenLayout, heroReady });
  useEffect(() => { callbacks.current = { request, onMorphComplete, onReady, onScreenLayout, heroReady }; wakeRef.current(); }, [request,onMorphComplete,onReady,onScreenLayout,heroReady]);

  useEffect(() => {
    const element=host.current,canvas=canvasRef.current;
    if(!element || !canvas) return;
    const ctx=canvas.getContext('2d');
    const shapes=createClouds();
    const driftStates=Array.from({length:COUNT},()=>({x:0,y:0,vx:0,vy:0}));
    let accumulator=0, simulationAge=0;
    const offsets=Array.from({length:COUNT},()=>({x:0,y:0}));
    const motion=new SceneTransition(callbacks.current.request.tab);
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    let width=0,height=0,dpr=1,quality=1,frame=0,last=0,age=0,ready=false,completed:number|null=null;
    let requestId=callbacks.current.request.id, elapsed=0,frames=0,frameTotal=0;
    let lastDraw=0;
    let parallax={x:0,y:0};
    const pointer={x:0,y:0,active:false};
    const resolution=()=> {
      dpr=Math.min(window.devicePixelRatio || 1,1+quality);
      canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
      ctx?.setTransform(dpr,0,0,dpr,0,0);
    };
    const wake=()=> { if(!frame && !document.hidden) { last=0; frame=requestAnimationFrame(animate); } };
    wakeRef.current=wake;
    const resize=()=> {
      const rect=element.getBoundingClientRect();width=rect.width;height=rect.height;
      resolution();wake();callbacks.current.onScreenLayout(screenBounds(sceneLayout(width,height,'TERMINAL')));
    };
    const observer=new ResizeObserver(resize);observer.observe(element);
    const move=(event:PointerEvent)=> {
      if(!event.isPrimary) return;
      const rect=element.getBoundingClientRect();
      pointer.x=event.clientX-rect.left;pointer.y=event.clientY-rect.top;pointer.active=true;if(!reduced.matches) wake();
    };
    const release=()=> {pointer.active=false;if(!reduced.matches) wake();};
    const up=(event:PointerEvent)=> {if(event.pointerType!=='mouse') release();};
    window.addEventListener('pointermove',move,{capture:true,passive:true});
    window.addEventListener('pointerdown',move,{capture:true,passive:true});
    window.addEventListener('pointerup',up,true);window.addEventListener('pointercancel',release,true);
    window.addEventListener('blur',release);document.documentElement.addEventListener('pointerleave',release);

    const animate=(now:number)=> {
      frame=0;
      const frameMs=last ? now-last : 16.67;last=now;
      age+=frameMs;accumulator+=Math.min(frameMs,100)/1000;
      let steps=0;while(accumulator>=1/120) {accumulator-=1/120;steps++;}
      simulationAge+=steps/120;
      const dt=Math.min(frameMs/1000,.05);
      const next=callbacks.current.request;
      if(next.id!==requestId) {motion.request(next.tab,next.id,age);requestId=next.id;}
      const pose=motion.sample(age,reduced.matches);
      const boot=bootState(age),assembled=ready || reduced.matches || boot.stage==='ASSEMBLED';
      const scatter=assembled ? 0 : boot.scatter;
      const layout={x:0,y:0,scale:0};
      pose.tabs.forEach((weight,i)=> {const target=sceneLayout(width,height,SCENE_TABS[i]);layout.x+=target.x*weight;layout.y+=target.y*weight;layout.scale+=target.scale*weight;});
      const depth=reduced.matches || !callbacks.current.heroReady ? 0 : (1-pose.tabs[3]);
      const blend=1-Math.exp(-dt*5);
      parallax={x:parallax.x+((pointer.active ? (pointer.x/width-.5)*10 : 0)*depth-parallax.x)*blend,
        y:parallax.y+((pointer.active ? (pointer.y/height-.5)*7 : 0)*depth-parallax.y)*blend};
      if(reduced.matches || (pose.complete && next.tab==='TERMINAL')) parallax={x:0,y:0};
      layout.x+=parallax.x;layout.y+=parallax.y;
      const shouldDraw=reduced.matches || quality>=.7 || now-lastDraw>=1000/30 || (pose.complete && completed!==requestId);
      if(shouldDraw) {ctx?.clearRect(0,0,width,height);lastDraw=now;}
      const count=COUNT;
      const drawn: {x:number;y:number;z:number;warm:boolean}[]=[];
      let displacement=0;
      if(ctx) for(let i=0;i<count;i++) {
        let x=0,y=0,z=0;
        for(let shape=0;shape<3;shape++) {x+=shapes[shape][i].x*pose.weights[shape];y+=shapes[shape][i].y*pose.weights[shape];z+=shapes[shape][i].z*pose.weights[shape];}
        const layer=.75+(i%7)/14;
        const arc=(1-Math.max(...pose.weights))*(reduced.matches ? 0 : 64)*Math.sin(i*2.4);
        const drift=reduced.matches ? 0 : 1.5;
        const state=driftStates[i];
        for(let step=0;step<steps;step++) {
          const t=simulationAge-(steps-step-1)/120;
          const tx=Math.sin(t/1.7+i*2.399)*drift,ty=Math.cos(t/2.1+i*1.71)*drift;
          state.vx+=(36*(tx-state.x)-12*state.vx)/120;state.vy+=(36*(ty-state.y)-12*state.vy)/120;
          state.x+=state.vx/120;state.y+=state.vy/120;
        }
        if(reduced.matches) {state.x=0;state.y=0;state.vx=0;state.vy=0;}
        x+=state.x;y+=state.y;
        const base={x:layout.x+(x+arc)*layout.scale+Math.cos(i*2.399)*480*layout.scale*.6*scatter*layer,
          y:layout.y+y*layout.scale+Math.sin(i*2.399)*440*layout.scale*.6*scatter*layer};
        // Repulsion is additive after both boot and morph, including interrupted morphs.
        const localBase={x:(base.x-layout.x)/layout.scale,y:(base.y-layout.y)/layout.scale};
        const localPointer={x:(pointer.x-layout.x)/layout.scale,y:(pointer.y-layout.y)/layout.scale,active:pointer.active};
        for(let step=0;step<steps;step++) offsets[i]=pointerOffset(localBase,localPointer,offsets[i],1/120,reduced.matches);
        if(reduced.matches) offsets[i]={x:0,y:0};
        const offset=offsets[i],distance=Math.hypot(offset.x,offset.y);displacement=Math.max(displacement,distance);
        drawn.push({x:(base.x-layout.x)/layout.scale+offset.x,y:(base.y-layout.y)/layout.scale+offset.y,z,warm:distance>2});
      }
      if(shouldDraw) {
      separatePositions(drawn);
      const radii=separatedRadii(drawn,1.05);
      const order=drawn.map((_,i)=>i).sort((a,b)=>drawn[a].z-drawn[b].z);
      if(ctx) for(const i of order) {
        const p=drawn[i];
        // Keep the glass clear, including drift at the bezel edge.
        if(pose.weights[0]>.999 && p.x>72 && p.x<408 && p.y>48 && p.y<266) continue;
        const radius=radii[i]*layout.scale*Math.max(.65,Math.min(1,.8+p.z/300));
        if(radius<=0) continue;
        ctx.fillStyle=p.warm ? '#FF6600' : '#66FFFF';
        ctx.globalAlpha=Math.max(.25,Math.min(.95,.6+p.z/200))*(assembled ? 1 : .25+boot.illumination*.75);
        ctx.beginPath();ctx.arc(layout.x+p.x*layout.scale,layout.y+p.y*layout.scale,radius,0,Math.PI*2);ctx.fill();
      }
      if(ctx) ctx.globalAlpha=1;
      }
      canvas.dataset.backend='canvas2d';canvas.dataset.morphTab=next.tab;
      canvas.dataset.morphProgress=String(pose.progress);canvas.dataset.bootStage=assembled ? 'ASSEMBLED' : boot.stage;
      canvas.dataset.pointerDisplacement=displacement.toFixed(2);canvas.dataset.particleCount=String(ctx ? count : 0);
      if(assembled && !ready) {ready=true;callbacks.current.onReady();}
      if(assembled && pose.complete && completed!==requestId) {completed=requestId;callbacks.current.onMorphComplete(requestId);}
      elapsed+=frameMs;
      if(frameMs<150) {frames++;frameTotal+=frameMs;}
      if(elapsed>=1500) {
        const average=frameTotal/Math.max(1,frames),nextQuality=adaptQuality(quality,average);
        canvas.dataset.frameMs=average.toFixed(1);
        if(nextQuality!==quality) {quality=nextQuality;resolution();}
        elapsed=0;frames=0;frameTotal=0;
      }
      if(!reduced.matches) frame=requestAnimationFrame(animate);
    };
    const visibility=()=> {cancelAnimationFrame(frame);frame=0;last=0;pointer.active=false;wake();};
    reduced.addEventListener('change',wake);
    resize();
    document.addEventListener('visibilitychange',visibility);
    wake();
    return ()=> {
      wakeRef.current=()=>{};reduced.removeEventListener('change',wake);
      cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',visibility);
      window.removeEventListener('pointermove',move,true);window.removeEventListener('pointerdown',move,true);
      window.removeEventListener('pointerup',up,true);window.removeEventListener('pointercancel',release,true);
      window.removeEventListener('blur',release);document.documentElement.removeEventListener('pointerleave',release);
    };
  },[]);

  return <div ref={host} className="pointer-events-none absolute inset-0 overflow-hidden bg-[#050914]">
    <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
  </div>;
}
