"use client";

import { lazy, Suspense, useState } from "react";
import { useRenderingTier } from "./useRenderingTier";
import { MobileParticleVideo } from "./MobileParticleVideo";

const DesktopParticleMonitor = lazy(() => import("./DesktopParticleMonitor"));

export function ParticleMonitor({ activeTab, onReady, heroReady = false }: { activeTab: string; onReady: () => void; heroReady?: boolean }) {
  const tier = useRenderingTier();
  const [failed, setFailed] = useState(false);
  if (!tier) return null;
  if (tier === 3 || failed) return <MobileParticleVideo onReady={onReady} />;
  return <Suspense fallback={null}><DesktopParticleMonitor activeTab={activeTab} heroReady={heroReady} count={tier === 1 ? 1048576 : 262144} onReady={onReady} onFailure={() => setFailed(true)} /></Suspense>;
}
