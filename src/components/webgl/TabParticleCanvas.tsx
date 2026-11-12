"use client";

import { useEffect, useRef } from "react";
import { bakeWorkstation } from "./bakeWorkstation";
import { bakeTabShapes } from "./bakeTabShapes";
import { MORPH_DURATION, type MorphRequest } from "./tabMorph";

/** Low-tier projection of the same clouds; a video cannot morph to arbitrary targets. */
export function TabParticleCanvas({ request, onReady, onMorphComplete }: {
  request: MorphRequest; onReady: () => void; onMorphComplete: (id: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const callbacks = useRef({ onReady, onMorphComplete });
  useEffect(() => { callbacks.current = { onReady, onMorphComplete }; }, [onReady, onMorphComplete]);
  const visible = useRef<Float32Array | null>(null);
  const clouds = useRef<ReturnType<typeof bakeTabShapes> & { pc: Float32Array } | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current, count = 2400;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) { callbacks.current.onReady(); callbacks.current.onMorphComplete(request.id); return; }
    if (!clouds.current) {
      const baked = bakeWorkstation(count), pc = new Float32Array(count * 4);
      for (let i=0;i<count;i++) {
        let source=i;
        while(baked.randoms[source]>=.8)source=(source+1)%count;
        pc.set(baked.targets.subarray(source*3,source*3+3), i*4); pc[i*4+3]=baked.randoms[i];
      }
      clouds.current = { ...bakeTabShapes(count), pc };
    }
    const target = clouds.current[request.target.shape];
    const destination = new Float32Array(count * 3);
    const { position, rotation, scale } = request.target;
    for (let i=0;i<count;i++) {
      const x=target[i*4]*scale, y=target[i*4+1]*scale, z=target[i*4+2]*scale;
      const y1=y*Math.cos(rotation[0])-z*Math.sin(rotation[0]), z1=y*Math.sin(rotation[0])+z*Math.cos(rotation[0]);
      destination[i*3]=x*Math.cos(rotation[1])+z1*Math.sin(rotation[1])+position[0];
      destination[i*3+1]=y1+position[1];
      destination[i*3+2]=-x*Math.sin(rotation[1])+z1*Math.cos(rotation[1])+position[2];
    }
    const from = visible.current?.slice() ?? destination;
    const points = visible.current ?? new Float32Array(destination.length);
    visible.current = points;
    let frame = 0, start = performance.now(), hiddenAt: number | null = document.hidden ? start : null, done = false;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const draw = (now: number) => {
      frame = 0;
      if (document.hidden) return;
      const t = reduced.matches || from === destination ? 1 : Math.min(1, (now-start)/MORPH_DURATION);
      const eased = t*t*(3-2*t), rect = canvas.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      if (canvas.width !== Math.round(rect.width*dpr) || canvas.height !== Math.round(rect.height*dpr)) {
        canvas.width=Math.round(rect.width*dpr); canvas.height=Math.round(rect.height*dpr);
      }
      ctx.setTransform(dpr,0,0,dpr,0,0); ctx.fillStyle="#050914"; ctx.fillRect(0,0,rect.width,rect.height);
      const aspect=rect.width/Math.max(rect.height,1), depth=Math.max(9.5,6/aspect), focal=rect.height/(2*Math.tan(Math.PI/9));
      for(let i=0;i<count;i++) {
        const j=i*3;
        for(let k=0;k<3;k++) points[j+k]=from[j+k]+(destination[j+k]-from[j+k])*eased;
        const perspective=focal/Math.max(1,depth-points[j+2]);
        ctx.fillStyle=i%11===0 ? "#FF6600" : "#66FFFF";
        ctx.fillRect(rect.width/2+points[j]*perspective,rect.height/2-(points[j+1]+.45)*perspective,1.5,1.5);
      }
      canvas.dataset.morphTab=request.tab; canvas.dataset.morphProgress=String(t);
      if(t===1 && !done) { done=true; callbacks.current.onReady(); callbacks.current.onMorphComplete(request.id); }
      if(t<1) frame=requestAnimationFrame(draw);
    };
    const visibility = () => {
      if(document.hidden) { hiddenAt=performance.now();cancelAnimationFrame(frame);frame=0; }
      else { if(hiddenAt!==null)start+=performance.now()-hiddenAt;hiddenAt=null;frame=requestAnimationFrame(draw); }
    };
    const observer = new ResizeObserver(() => { if(!frame&&!document.hidden)frame=requestAnimationFrame(draw); });
    observer.observe(canvas); document.addEventListener("visibilitychange",visibility);
    frame=requestAnimationFrame(draw);
    return () => {cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener("visibilitychange",visibility);};
  }, [request]);
  return <canvas ref={canvasRef} aria-hidden="true" className="block h-full w-full" />;
}
