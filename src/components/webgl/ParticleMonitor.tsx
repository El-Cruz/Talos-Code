"use client";

import { useEffect, useRef } from "react";
import type { MorphRequest } from "./tabMorph";
import { bootState } from "./bootSequence";
import { GEOMETRY, SCENE_TABS, SceneTransition, adaptQuality, pointerOffset, sampleGeometry, sceneLayout, screenBounds } from "./unifiedScene";

const COUNT = 3200;
export function ParticleMonitor({ request, onMorphComplete, onReady, onScreenLayout, heroReady = false }: {
  request: Pick<MorphRequest, "id" | "tab">; onMorphComplete: (id: number) => void; onReady: () => void;
  onScreenLayout: (bounds: ReturnType<typeof screenBounds>) => void; heroReady?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const callbacks = useRef({ request, onMorphComplete, onReady, onScreenLayout, heroReady });
  useEffect(() => { callbacks.current = { request, onMorphComplete, onReady, onScreenLayout, heroReady }; }, [request,onMorphComplete,onReady,onScreenLayout,heroReady]);

  useEffect(() => {
    const element=host.current,canvas=canvasRef.current,svg=svgRef.current;
    if(!element || !canvas || !svg) return;
    const ctx=canvas.getContext('2d');
    const shapes=sampleGeometry(COUNT);
    const offsets=Array.from({length:COUNT},()=>({x:0,y:0}));
    const groups=Array.from(svg.querySelectorAll<SVGGElement>('[data-shape]'));
    const motion=new SceneTransition(callbacks.current.request.tab);
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    let width=0,height=0,dpr=1,quality=1,frame=0,last=0,age=0,ready=false,completed:number|null=null;
    let requestId=callbacks.current.request.id, elapsed=0,frames=0,frameTotal=0;
    let parallax={x:0,y:0};
    const pointer={x:0,y:0,active:false};
    const resolution=()=> {
      dpr=Math.min(window.devicePixelRatio || 1,1+quality);
      canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
      ctx?.setTransform(dpr,0,0,dpr,0,0);
    };
    const resize=()=> {
      const rect=element.getBoundingClientRect();width=rect.width;height=rect.height;
      svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
      resolution();callbacks.current.onScreenLayout(screenBounds(sceneLayout(width,height,'TERMINAL')));
    };
    const observer=new ResizeObserver(resize);observer.observe(element);resize();
    const move=(event:PointerEvent)=> {
      if(!event.isPrimary) return;
      const rect=element.getBoundingClientRect();
      pointer.x=event.clientX-rect.left;pointer.y=event.clientY-rect.top;pointer.active=true;
    };
    const release=()=> {pointer.active=false;};
    const up=(event:PointerEvent)=> {if(event.pointerType!=='mouse') release();};
    window.addEventListener('pointermove',move,{capture:true,passive:true});
    window.addEventListener('pointerdown',move,{capture:true,passive:true});
    window.addEventListener('pointerup',up,true);window.addEventListener('pointercancel',release,true);
    window.addEventListener('blur',release);document.documentElement.addEventListener('pointerleave',release);

    const animate=(now:number)=> {
      const frameMs=last ? now-last : 16.67;last=now;
      age+=frameMs;const dt=Math.min(frameMs/1000,.05);
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
      if(pose.complete && next.tab==='TERMINAL') parallax={x:0,y:0};
      layout.x+=parallax.x;layout.y+=parallax.y;
      groups.forEach((group,i)=> {
        group.setAttribute('transform',`translate(${layout.x} ${layout.y}) scale(${layout.scale})`);
        group.style.opacity=String(pose.weights[i]*(i===0 ? .42+.58*(1-scatter) : .8));
      });
      ctx?.clearRect(0,0,width,height);
      const count=Math.round(COUNT*quality);
      let displacement=0;
      if(ctx) for(let i=0;i<count;i++) {
        let x=0,y=0;
        for(let shape=0;shape<3;shape++) {x+=shapes[shape][i].x*pose.weights[shape];y+=shapes[shape][i].y*pose.weights[shape];}
        const layer=.75+(i%7)/14;
        const arc=(1-Math.max(...pose.weights))*(reduced.matches ? 0 : 64)*Math.sin(i*2.4);
        const base={x:layout.x+(x+arc)*layout.scale+Math.cos(i*2.399)*width*.6*scatter*layer,
          y:layout.y+y*layout.scale+Math.sin(i*2.399)*height*.6*scatter*layer};
        // Repulsion is additive after both boot and morph, including interrupted morphs.
        offsets[i]=pointerOffset(base,pointer,offsets[i],dt,reduced.matches);
        const offset=offsets[i],distance=Math.hypot(offset.x,offset.y);displacement=Math.max(displacement,distance);
        ctx.fillStyle=distance>2 ? '#FF6600' : '#66FFFF';
        ctx.globalAlpha=(.35+layer*.4)*(assembled ? .8 : .25+boot.illumination*.55);
        const size=(i%9===0 ? 2 : 1.15)*layer;
        ctx.fillRect(base.x+offset.x,base.y+offset.y,size,size);
      }
      if(ctx) ctx.globalAlpha=1;
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
      frame=requestAnimationFrame(animate);
    };
    const visibility=()=> {cancelAnimationFrame(frame);last=0;release();if(!document.hidden) frame=requestAnimationFrame(animate);};
    document.addEventListener('visibilitychange',visibility);
    if(!document.hidden) frame=requestAnimationFrame(animate);
    return ()=> {
      cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',visibility);
      window.removeEventListener('pointermove',move,true);window.removeEventListener('pointerdown',move,true);
      window.removeEventListener('pointerup',up,true);window.removeEventListener('pointercancel',release,true);
      window.removeEventListener('blur',release);document.documentElement.removeEventListener('pointerleave',release);
    };
  },[]);

  return <div ref={host} className="pointer-events-none absolute inset-0 overflow-hidden bg-[#050914]">
    <svg ref={svgRef} className="absolute inset-0 h-full w-full" aria-hidden="true">
      {GEOMETRY.map((paths,i)=><g key={i} data-shape={i} opacity="0" fill="none" stroke={i===2 ? '#FF6600' : '#66FFFF'} strokeWidth="1.2" strokeLinejoin="round">
        {paths.map((path,j)=><polyline key={j} points={path.map(p=>`${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ')} vectorEffect="non-scaling-stroke" />)}
      </g>)}
    </svg>
    <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
  </div>;
}
