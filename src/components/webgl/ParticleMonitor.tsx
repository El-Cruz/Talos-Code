"use client";

import { lazy, Suspense, useState } from "react";
import { useRenderingTier } from "./useRenderingTier";
import { TabParticleCanvas } from "./TabParticleCanvas";
import type { MorphRequest } from "./tabMorph";

const DesktopParticleMonitor = lazy(() => import("./DesktopParticleMonitor"));

export function ParticleMonitor({ request, onMorphComplete, onReady, heroReady = false }: { request: MorphRequest; onMorphComplete: (id: number) => void; onReady: () => void; heroReady?: boolean }) {
  const tier = useRenderingTier();
  const [failed, setFailed] = useState(false);
  if (!tier) return null;
  if (tier === 3 || failed) return <TabParticleCanvas request={request} onReady={onReady} onMorphComplete={onMorphComplete} />;
  return <Suspense fallback={null}><DesktopParticleMonitor request={request} onMorphComplete={onMorphComplete} heroReady={heroReady} count={tier === 1 ? 1048576 : 262144} onReady={onReady} onFailure={() => setFailed(true)} /></Suspense>;
}
